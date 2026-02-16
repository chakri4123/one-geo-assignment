import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.deps import get_db
from app.db.models.dataset import Dataset
from app.db.models.analysis import Analysis
from app.services.analysis_service import analyze_las_from_s3

router = APIRouter(prefix="/analysis", tags=["Analysis"])


# -----------------------------
# Run Analysis (async)
# -----------------------------
@router.post("/run/{dataset_id}")
async def run_analysis(
    dataset_id: UUID,
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        dataset.status = "processing"
        db.commit()

        result = await asyncio.to_thread(analyze_las_from_s3, dataset.file_path)

        analysis = Analysis(
            dataset_id=dataset.id,
            mean_value=result.get("mean"),
            std_dev=result.get("std"),
            min_value=result.get("min"),
            max_value=result.get("max"),
            outlier_count=result.get("outliers")
        )

        db.add(analysis)
        dataset.status = "completed"

        db.commit()
        db.refresh(analysis)

        return {
            "analysis_id": str(analysis.id),
            "results": result
        }

    except Exception as e:
        dataset.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# Get All Analyses for Dataset
# -----------------------------
@router.get("/{dataset_id}")
def get_analyses(
    dataset_id: UUID,
    db: Session = Depends(get_db)
):
    analyses = db.query(Analysis).filter(
        Analysis.dataset_id == dataset_id
    ).all()

    return [
        {
            "analysis_id": str(a.id),
            "mean": a.mean_value,
            "std_dev": a.std_dev,
            "min": a.min_value,
            "max": a.max_value,
            "outliers": a.outlier_count,
            "created_at": a.created_at
        }
        for a in analyses
    ]
