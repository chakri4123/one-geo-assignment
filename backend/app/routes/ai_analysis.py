import asyncio

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel
from typing import List, Optional, Dict

from app.db.deps import get_db
from app.db.models.analysis import Analysis
from app.services.dataset_service import DatasetService
from app.services.ai_analysis_service import AIAnalysisService
from app.services.analysis_service import load_las_dataframe_from_s3


# -------------------------------------------------------
# Router Definition
# -------------------------------------------------------
router = APIRouter(prefix="/ai", tags=["AI Analysis"])


# -------------------------------------------------------
# Request Schema
# -------------------------------------------------------
class AnalyzeRequest(BaseModel):
    well: Optional[str] = None
    curves: Optional[List[str]] = None
    depthRange: Optional[Dict[str, float]] = None


# -------------------------------------------------------
# Run AI Analysis with Filtering (async)
# -------------------------------------------------------
@router.post("/analyze/{dataset_id}")
async def ai_analyze_dataset(
    dataset_id: UUID,
    request: AnalyzeRequest,
    db: Session = Depends(get_db)
):
    dataset = DatasetService.get_dataset_by_id(db, dataset_id)

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    DatasetService.update_status(db, dataset, "processing")

    try:
        # Load LAS into DataFrame (cached — near-instant on repeat calls)
        df = await asyncio.to_thread(load_las_dataframe_from_s3, dataset.file_path)

        # ---------------------------
        # APPLY CURVE FILTERING
        # ---------------------------
        if request.curves:
            existing_cols = [
                col for col in request.curves
                if col in df.columns
            ]

            if "DEPTH" in df.columns:
                existing_cols.append("DEPTH")

            if existing_cols:
                df = df[existing_cols]

        # ---------------------------
        # APPLY DEPTH FILTERING
        # ---------------------------
        if request.depthRange:
            from_depth = request.depthRange.get("from")
            to_depth = request.depthRange.get("to")

            if (
                from_depth is not None
                and to_depth is not None
                and "DEPTH" in df.columns
            ):
                df = df[
                    (df["DEPTH"] >= from_depth)
                    & (df["DEPTH"] <= to_depth)
                ]

        if df.empty:
            raise HTTPException(
                status_code=400,
                detail="Filtered dataset is empty."
            )

        # ---------------------------
        # SINGLE-PASS AI ANALYSIS
        # ---------------------------
        summary, z_outliers, iqr_outliers = await asyncio.to_thread(
            AIAnalysisService.run_full_analysis, df
        )

        combined_outliers = {
            col: {
                "zscore": z_outliers.get(col, 0),
                "iqr": iqr_outliers.get(col, 0)
            }
            for col in summary.keys()
        }

        combined_for_insight = {
            col: max(
                z_outliers.get(col, 0),
                iqr_outliers.get(col, 0)
            )
            for col in summary.keys()
        }

        insights, health_score, risk = (
            AIAnalysisService.generate_insights(
                summary,
                combined_for_insight
            )
        )

        # ---------------------------
        # GEMINI AI SUMMARY
        # ---------------------------
        ai_summary = await asyncio.to_thread(
            AIAnalysisService.generate_ai_summary,
            summary,
            combined_for_insight,
            insights,
            health_score,
            risk
        )

        # ---------------------------
        # SAVE TO DATABASE
        # ---------------------------
        analysis = Analysis(
            dataset_id=dataset.id,
            summary=summary,
            outliers=combined_outliers,
            insights=insights,
            dataset_health=str(health_score),
            risk_level=risk
        )

        db.add(analysis)
        db.commit()
        db.refresh(analysis)

        DatasetService.update_status(db, dataset, "completed")

        return {
            "analysis_id": str(analysis.id),
            "dataset_id": str(dataset_id),
            "dataset_health": float(health_score),
            "risk_level": risk,
            "insights": insights,
            "ai_summary": ai_summary,
            "summary": summary,
            "outliers": combined_outliers
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        DatasetService.update_status(db, dataset, "failed")
        raise HTTPException(status_code=500, detail=str(e))
