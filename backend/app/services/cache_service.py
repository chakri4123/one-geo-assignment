"""
In-memory TTL cache for parsed LAS DataFrames.
Eliminates redundant S3 downloads — once a file is loaded, all subsequent
operations (analysis, curves, chat) share the cached DataFrame instantly.
"""

import io
import threading
import warnings

import boto3
import lasio
import pandas as pd
from cachetools import TTLCache

from app.core.config import settings


# -----------------------------------------------------------
# S3 Client (shared across the app)
# -----------------------------------------------------------
s3 = boto3.client(
    "s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_DEFAULT_REGION,
)

BUCKET_NAME = settings.S3_BUCKET_NAME

# -----------------------------------------------------------
# Cache: max 64 entries, 10-minute TTL
# -----------------------------------------------------------
_cache_lock = threading.Lock()
_df_cache: TTLCache = TTLCache(maxsize=64, ttl=600)
_bytes_cache: TTLCache = TTLCache(maxsize=64, ttl=600)


def _download_bytes(file_key: str) -> bytes:
    """Download file bytes from S3 (or return cached)."""
    with _cache_lock:
        if file_key in _bytes_cache:
            return _bytes_cache[file_key]

    response = s3.get_object(Bucket=BUCKET_NAME, Key=file_key)
    data = response["Body"].read()

    with _cache_lock:
        _bytes_cache[file_key] = data

    return data


def _parse_las(raw_bytes: bytes) -> lasio.LASFile:
    """Parse LAS from raw bytes using an in-memory buffer (no temp files)."""
    buf = io.StringIO(raw_bytes.decode("utf-8", errors="replace"))
    return lasio.read(buf)


def get_dataframe(file_key: str) -> pd.DataFrame:
    """
    Return a de-fragmented DataFrame for the given S3 key.
    Uses the cache; downloads + parses only on a cache miss.
    """
    with _cache_lock:
        if file_key in _df_cache:
            return _df_cache[file_key]

    raw = _download_bytes(file_key)
    las = _parse_las(raw)

    # Suppress the PerformanceWarning from lasio's fragmented inserts
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", pd.errors.PerformanceWarning)
        df = las.df()

    # De-fragment: join all columns at once → contiguous memory
    df = pd.DataFrame(
        {col: df[col].values for col in df.columns},
        index=df.index,
    )
    df = df.reset_index()

    with _cache_lock:
        _df_cache[file_key] = df

    return df


def get_las(file_key: str) -> lasio.LASFile:
    """Return a parsed LASFile object (for curve metadata etc.)."""
    raw = _download_bytes(file_key)
    return _parse_las(raw)


def invalidate(file_key: str) -> None:
    """Remove a file from all caches."""
    with _cache_lock:
        _df_cache.pop(file_key, None)
        _bytes_cache.pop(file_key, None)


def pre_warm(file_key: str, raw_bytes: bytes) -> None:
    """
    Cache raw bytes + parsed DataFrame immediately after upload.
    This eliminates the redundant S3 re-download on the first analysis.
    """
    with _cache_lock:
        _bytes_cache[file_key] = raw_bytes

    las = _parse_las(raw_bytes)

    with warnings.catch_warnings():
        warnings.simplefilter("ignore", pd.errors.PerformanceWarning)
        df = las.df()

    df = pd.DataFrame(
        {col: df[col].values for col in df.columns},
        index=df.index,
    )
    df = df.reset_index()

    with _cache_lock:
        _df_cache[file_key] = df
