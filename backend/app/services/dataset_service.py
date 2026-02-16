from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID

from app.db.models.dataset import Dataset


class DatasetService:

    # -----------------------------------
    # Get Dataset By ID
    # -----------------------------------
    @staticmethod
    def get_dataset_by_id(db: Session, dataset_id: UUID) -> Optional[Dataset]:
        return db.query(Dataset).filter(Dataset.id == dataset_id).first()

    # -----------------------------------
    # Get All Datasets
    # -----------------------------------
    @staticmethod
    def get_all_datasets(db: Session) -> List[Dataset]:
        return db.query(Dataset).order_by(Dataset.uploaded_at.desc()).all()

    # -----------------------------------
    # Update Dataset Status
    # -----------------------------------
    @staticmethod
    def update_status(db: Session, dataset: Dataset, status: str) -> Dataset:
        dataset.status = status
        db.commit()
        db.refresh(dataset)
        return dataset

    # -----------------------------------
    # Delete Dataset
    # -----------------------------------
    @staticmethod
    def delete_dataset(db: Session, dataset: Dataset):
        db.delete(dataset)
        db.commit()
