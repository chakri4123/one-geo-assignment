from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import dataset
from app.routes import analysis  # if exists
from app.routes import ai_analysis
from app.routes import chat

import os

app = FastAPI(title="Data Analytics Platform")

# CORS — allow frontend origins (localhost + Vercel)
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Add production frontend URL if set
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(dataset.router)
app.include_router(analysis.router)
app.include_router(ai_analysis.router)
app.include_router(chat.router)