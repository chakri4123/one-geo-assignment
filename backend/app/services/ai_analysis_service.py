"""
AI Analysis Service — fully vectorized statistical analysis, outlier detection,
insight generation, and Gemini-powered AI summary.
"""

import json
import numpy as np
import pandas as pd
import google.generativeai as genai
from app.core.config import settings

# Reuse the module-level Gemini model
genai.configure(api_key=settings.GEMINI_API_KEY)
_gemini_model = genai.GenerativeModel("gemini-2.5-flash")


class AIAnalysisService:

    @staticmethod
    def _numeric_cols(df: pd.DataFrame) -> list:
        """Return numeric columns excluding DEPTH (computed once)."""
        return [
            col for col in df.select_dtypes(include=np.number).columns
            if col.upper() != "DEPTH"
        ]

    # -----------------------------------
    # Combined Full Analysis (single pass)
    # -----------------------------------
    @staticmethod
    def run_full_analysis(df: pd.DataFrame):
        """
        Single-pass analysis returning (summary, z_outliers, iqr_outliers).
        Uses describe() + numpy nan-aware functions to avoid per-column dropna().
        """
        numeric_cols = AIAnalysisService._numeric_cols(df)
        numeric_df = df[numeric_cols]

        # One vectorized describe() call — already ignores NaN internally
        desc = numeric_df.describe(percentiles=[0.25, 0.5, 0.75])
        skew = numeric_df.skew()  # vectorized across all columns at once
        missing_pct = numeric_df.isna().mean() * 100  # vectorized

        summary = {}
        z_outliers = {}
        iqr_outliers = {}

        for col in numeric_cols:
            count = desc.loc["count", col]
            if count == 0:
                continue

            mean = float(desc.loc["mean", col])
            std = float(desc.loc["std", col])
            min_val = float(desc.loc["min", col])
            q1 = float(desc.loc["25%", col])
            median = float(desc.loc["50%", col])
            q3 = float(desc.loc["75%", col])
            max_val = float(desc.loc["max", col])

            summary[col] = {
                "count": int(count),
                "mean": mean,
                "median": median,
                "std": std,
                "min": min_val,
                "max": max_val,
                "q1": q1,
                "q3": q3,
                "skewness": float(skew[col]),
                "missing_percent": float(missing_pct[col]),
            }

            # Z-score outliers — use raw numpy array, nan-safe
            vals = numeric_df[col].values
            if std > 0 and not np.isnan(std):
                z = np.abs((vals - mean) / std)
                z_outliers[col] = int(np.nansum(z > 3.0))
            else:
                z_outliers[col] = 0

            # IQR outliers — nan-safe
            iqr = q3 - q1
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr
            iqr_outliers[col] = int(np.nansum((vals < lower) | (vals > upper)))

        return summary, z_outliers, iqr_outliers

    # -----------------------------------
    # Legacy methods (delegate to single-pass)
    # -----------------------------------
    @staticmethod
    def statistical_summary(df: pd.DataFrame):
        summary, _, _ = AIAnalysisService.run_full_analysis(df)
        return summary

    @staticmethod
    def zscore_outliers(df: pd.DataFrame, threshold: float = 3.0):
        _, z_out, _ = AIAnalysisService.run_full_analysis(df)
        return z_out

    @staticmethod
    def iqr_outliers(df: pd.DataFrame):
        _, _, iqr_out = AIAnalysisService.run_full_analysis(df)
        return iqr_out

    # -----------------------------------
    # Insight + Dataset Health Evaluation
    # -----------------------------------
    @staticmethod
    def generate_insights(summary: dict, outliers: dict):
        insights = []
        penalty = 0
        curve_count = max(len(summary), 1)

        for col, stats in summary.items():
            # Missing Data
            if stats["missing_percent"] > 20:
                insights.append(
                    f"{col} has high missing data ({stats['missing_percent']:.1f}%)."
                )
                penalty += 8

            # Strong Skewness
            if abs(stats["skewness"]) > 1:
                direction = "positive" if stats["skewness"] > 0 else "negative"
                insights.append(
                    f"{col} shows strong {direction} skewness."
                )
                penalty += 5

            # Outliers
            if outliers.get(col, 0) > 0:
                insights.append(
                    f"{col} contains {outliers[col]} detected outlier value(s)."
                )
                penalty += 4

        normalized_penalty = penalty / curve_count
        health_score = max(100 - normalized_penalty, 0)

        if health_score > 80:
            risk = "Low"
        elif health_score > 50:
            risk = "Moderate"
        else:
            risk = "High"

        return insights, round(health_score, 2), risk

    # -----------------------------------
    # Gemini-Powered AI Summary
    # -----------------------------------
    @staticmethod
    def generate_ai_summary(
        summary: dict,
        outliers: dict,
        insights: list,
        health_score: float,
        risk: str
    ) -> str:
        """
        Send statistical results to Gemini for rich natural-language interpretation.
        Returns a markdown-formatted AI summary.
        """
        prompt = f"""You are an expert petrophysicist analyzing well-log data. Based on the following statistical analysis results, provide a concise, insightful interpretation.

STATISTICAL SUMMARY:
{json.dumps(summary, indent=2)}

OUTLIER COUNTS (per curve):
{json.dumps(outliers, indent=2)}

RULE-BASED FINDINGS:
{chr(10).join(f'- {i}' for i in insights) if insights else '- No significant issues detected.'}

DATASET HEALTH SCORE: {health_score}/100
RISK LEVEL: {risk}

Please provide:
1. **Overview** — A 2-3 sentence summary of the dataset quality and key characteristics
2. **Curve Analysis** — Brief interpretation of each curve's behavior (what the statistics suggest geologically)
3. **Anomalies** — Explain what the outliers might indicate (lithology changes, fluid contacts, tool issues, etc.)
4. **Recommendations** — 2-3 actionable next steps for the analyst

Keep the response concise (under 300 words). Use markdown formatting. Do NOT use emojis."""

        try:
            response = _gemini_model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"AI summary generation failed: {str(e)}"

