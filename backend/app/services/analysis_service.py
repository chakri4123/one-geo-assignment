"""
Analysis service — upload, analyze, fetch curves, and load DataFrames.
All read operations use the in-memory cache to avoid redundant S3 downloads.
"""

import uuid
import warnings

import numpy as np
import pandas as pd
from fastapi import HTTPException

from app.core.config import settings
from app.services.cache_service import s3, BUCKET_NAME, get_dataframe, get_las, pre_warm


# ----------------------------------------
# Upload LAS to S3
# ----------------------------------------
def upload_las_to_s3(file):
    if not file.filename.lower().endswith(".las"):
        raise HTTPException(status_code=400, detail="Only .las files allowed")

    file_key = f"{uuid.uuid4()}_{file.filename}"

    file_bytes = file.file.read()
    file_size = len(file_bytes)

    # Reset file pointer after reading
    file.file.seek(0)

    s3.upload_fileobj(file.file, BUCKET_NAME, file_key)

    # Pre-warm cache: parse the LAS now so first analysis is instant
    try:
        pre_warm(file_key, file_bytes)
    except Exception:
        pass  # Non-critical — cache miss will just re-download

    return file_key, file_size


# ----------------------------------------
# Analyze LAS from S3 (cached)
# ----------------------------------------
def analyze_las_from_s3(file_key: str):
    try:
        df = get_dataframe(file_key)

        # Work with numeric data only (exclude DEPTH)
        numeric_cols = [
            col for col in df.select_dtypes(include=np.number).columns
            if col.upper() != "DEPTH"
        ]
        numeric_df = df[numeric_cols].dropna()

        if numeric_df.empty:
            raise HTTPException(status_code=400, detail="No valid curve data found")

        # Vectorized describe() for all columns at once
        desc = numeric_df.describe()
        results = {}

        for col in numeric_cols:
            data = numeric_df[col].values
            mean = float(desc.loc["mean", col])
            std = float(desc.loc["std", col])

            z_scores = (data - mean) / std if std != 0 else np.zeros_like(data)
            outliers = int(np.sum(np.abs(z_scores) > 3))

            results[col] = {
                "mean": mean,
                "std": std,
                "min": float(desc.loc["min", col]),
                "max": float(desc.loc["max", col]),
                "outliers": outliers,
            }

        return results

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Well LAS Analysis Failed: {str(e)}"
        )


# ----------------------------------------
# Fetch Curves from S3 (cached)
# ----------------------------------------
def fetch_curves_from_s3(file_key: str):
    try:
        df = get_dataframe(file_key)

        if df.empty:
            raise HTTPException(status_code=400, detail="No valid curve data found")

        # Determine depth column
        depth_col = "DEPTH" if "DEPTH" in df.columns else df.columns[0]

        # Drop rows where ALL curve columns are NaN
        curve_cols = [c for c in df.columns if c != depth_col]
        clean = df.dropna(subset=curve_cols, how="all")

        def _safe_list(series):
            """Convert series to list, replacing NaN/Inf with None for JSON."""
            arr = series.values
            mask = np.isfinite(arr)
            return [float(v) if m else None for v, m in zip(arr, mask)]

        response = {
            "depth_name": depth_col,
            "depth": _safe_list(clean[depth_col]),
            "curves": {col: _safe_list(clean[col]) for col in curve_cols},
        }

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Curve fetch failed: {str(e)}"
        )


# ----------------------------------------
# Load LAS as DataFrame (reusable for AI + chat)
# ----------------------------------------
def load_las_dataframe_from_s3(file_key: str):
    try:
        df = get_dataframe(file_key)

        if df.empty:
            raise HTTPException(status_code=400, detail="No valid curve data found")

        return df

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"LAS loading failed: {str(e)}"
        )
