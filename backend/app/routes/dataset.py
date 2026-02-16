import asyncio
import traceback

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.deps import get_db
from app.db.models.dataset import Dataset
from app.services.dataset_service import DatasetService
from app.services.analysis_service import (
    upload_las_to_s3,
    fetch_curves_from_s3
)

router = APIRouter(prefix="/dataset", tags=["Dataset"])


# ----------------------------------------
# Upload Dataset
# ----------------------------------------
@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        file_key, file_size = upload_las_to_s3(file)

        dataset = Dataset(
            file_name=file.filename,
            file_path=file_key,
            file_size=file_size,
            status="uploaded"
        )

        db.add(dataset)
        db.commit()
        db.refresh(dataset)

        return {
            "message": "File uploaded successfully",
            "dataset_id": str(dataset.id)
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------------------------
# List All Datasets
# ----------------------------------------
@router.get("/")
def list_datasets(db: Session = Depends(get_db)):
    datasets = DatasetService.get_all_datasets(db)

    return [
        {
            "id": str(d.id),
            "file_name": d.file_name,
            "file_size": d.file_size,
            "status": d.status,
            "uploaded_at": d.uploaded_at
        }
        for d in datasets
    ]


# ----------------------------------------
# Get Dataset Info
# ----------------------------------------
@router.get("/{dataset_id}")
def get_dataset(
    dataset_id: UUID,
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    return {
        "id": str(dataset.id),
        "file_name": dataset.file_name,
        "file_size": dataset.file_size,
        "status": dataset.status,
        "uploaded_at": dataset.uploaded_at
    }


# ----------------------------------------
# Fetch Curves (async, cached)
# ----------------------------------------
@router.get("/{dataset_id}/curves")
async def get_dataset_curves(
    dataset_id: UUID,
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    return await asyncio.to_thread(fetch_curves_from_s3, dataset.file_path)
