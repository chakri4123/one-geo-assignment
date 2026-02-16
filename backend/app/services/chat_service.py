"""
Chat service — LLM-powered chat about well-log data.
Gemini model initialized once at module level (not per-request).
Context built with vectorized describe() instead of per-column loops.
"""

import google.generativeai as genai
import pandas as pd
import numpy as np
from app.core.config import settings


# -----------------------------------------------------------
# Initialize Gemini ONCE at module level
# -----------------------------------------------------------
genai.configure(api_key=settings.GEMINI_API_KEY)
_model = genai.GenerativeModel("gemini-2.5-flash")


class ChatService:
    """Service to handle LLM-powered chat about well-log data."""

    @staticmethod
    def _build_data_context(df: pd.DataFrame) -> str:
        """Build a concise context string using vectorized describe()."""

        numeric_cols = [
            col for col in df.select_dtypes(include=np.number).columns
            if col.upper() != "DEPTH"
        ]

        depth_col = "DEPTH" if "DEPTH" in df.columns else df.columns[0]
        depth_min = float(df[depth_col].min())
        depth_max = float(df[depth_col].max())
        total_rows = len(df)

        # Single vectorized describe() for all numeric columns at once
        desc = df[numeric_cols].describe()
        missing_pct = df[numeric_cols].isna().mean() * 100

        stats_lines = []
        for col in numeric_cols:
            if desc.loc["count", col] == 0:
                continue
            missing = int(df[col].isna().sum())
            stats_lines.append(
                f"  - {col}: mean={desc.loc['mean', col]:.4f}, "
                f"std={desc.loc['std', col]:.4f}, "
                f"min={desc.loc['min', col]:.4f}, "
                f"max={desc.loc['max', col]:.4f}, "
                f"missing={missing} ({missing_pct[col]:.1f}%)"
            )

        # Sample rows (first 5 + last 5)
        sample_head = df.head(5).to_string(index=False)
        sample_tail = df.tail(5).to_string(index=False)

        context = f"""WELL LOG DATA SUMMARY:
- Total data points: {total_rows}
- Depth range: {depth_min:.2f} to {depth_max:.2f}
- Available curves: {', '.join(numeric_cols)}

CURVE STATISTICS:
{chr(10).join(stats_lines)}

SAMPLE DATA (first 5 rows):
{sample_head}

SAMPLE DATA (last 5 rows):
{sample_tail}"""

        return context

    @staticmethod
    def get_chat_response(
        df: pd.DataFrame,
        message: str,
        history: list = None
    ) -> str:
        """Send a message to Gemini with well-log data context and return the response."""

        data_context = ChatService._build_data_context(df)

        system_prompt = f"""You are a well-log data analyst assistant. You have access to the following well-log dataset:

{data_context}

Your role:
- Answer questions about this well-log data accurately and concisely.
- Provide statistical insights, identify trends, anomalies, or patterns when asked.
- If the user asks about a specific curve or depth range, reference the actual data.
- Use clean formatting: headings, bullet points, and bold text where appropriate.
- Keep responses concise and to the point. Avoid long paragraphs.
- Do NOT use emojis in your responses.
- Do NOT make up data that isn't in the dataset.
- If you don't have enough information to answer, say so clearly."""

        # Build conversation messages
        contents = []

        # Add system context as first message
        contents.append({
            "role": "user",
            "parts": [{"text": system_prompt + "\n\nPlease acknowledge you understand the data."}]
        })
        contents.append({
            "role": "model",
            "parts": [{"text": "I understand the well-log data. I'm ready to answer your questions about the curves, depth ranges, and statistics."}]
        })

        # Add conversation history
        if history:
            for msg in history:
                role = "user" if msg.get("role") == "user" else "model"
                contents.append({
                    "role": role,
                    "parts": [{"text": msg.get("content", "")}]
                })

        # Add current message
        contents.append({
            "role": "user",
            "parts": [{"text": message}]
        })

        # Use cached model instance (no re-init per request)
        response = _model.generate_content(contents)

        return response.text
