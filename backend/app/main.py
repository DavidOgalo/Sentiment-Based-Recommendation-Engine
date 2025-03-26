from fastapi import FastAPI
from backend.app.api import auth, users, providers, reviews, recommendations
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Print environment variables to verify they are loaded correctly
print("DATABASE_URL_SYNC:", os.getenv("DATABASE_URL_SYNC"))
print("DATABASE_URL_ASYNC:", os.getenv("DATABASE_URL_ASYNC"))

app = FastAPI(title="Sentiment Recommender API")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Sentiment Recommender API!"}

# Include API routes
app.include_router(auth.router, prefix="/auth")
# app.include_router(users.router, prefix="/users")
# app.include_router(providers.router, prefix="/providers")
# app.include_router(reviews.router, prefix="/reviews")
# app.include_router(recommendations.router, prefix="/recommendations")