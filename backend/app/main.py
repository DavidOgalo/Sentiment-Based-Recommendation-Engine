from fastapi import FastAPI
from backend.app.api import auth, users
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Sentiment Recommender API")

# Include API routes with proper prefixes and tags
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(users.router, prefix="/users", tags=["users"])