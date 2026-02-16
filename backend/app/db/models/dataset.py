from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.base import Base


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)  # S3 path or local path

    file_size = Column(Float, nullable=True)

    status = Column(String, default="uploaded")  
    # uploaded | processing | completed | failed

    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    analyses = relationship("Analysis", back_populates="dataset", cascade="all, delete")
