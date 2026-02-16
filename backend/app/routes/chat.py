import asyncio

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel
from typing import List, Optional

from app.db.deps import get_db
from app.services.dataset_service import DatasetService
from app.services.analysis_service import load_las_dataframe_from_s3
from app.services.chat_service import ChatService


router = APIRouter(prefix="/chat", tags=["Chatbot"])


# -------------------------------------------------------
# Request Schema
# -------------------------------------------------------
class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = None


# -------------------------------------------------------
# Chat Endpoint (async)
# -------------------------------------------------------
@router.post("/{dataset_id}")
async def chat_with_data(
    dataset_id: UUID,
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    dataset = DatasetService.get_dataset_by_id(db, dataset_id)

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    try:
        # Load LAS data (cached — near-instant on repeat calls)
        df = await asyncio.to_thread(load_las_dataframe_from_s3, dataset.file_path)

        # Convert history to list of dicts
        history = None
        if request.history:
            history = [
                {"role": msg.role, "content": msg.content}
                for msg in request.history
            ]

        # Get AI response (blocking Gemini call in thread)
        reply = await asyncio.to_thread(
            ChatService.get_chat_response,
            df=df,
            message=request.message,
            history=history
        )

        return {"reply": reply}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
