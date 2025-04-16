from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.providers import router as providers_router
from app.api.services import router as services_router
from app.api.reviews import router as reviews_router
from app.api.recommendations import router as recommendations_router
from app.api.categories import router as categories_router
from app.models.database import get_db, init_db
from dotenv import load_dotenv
import os
from sqlalchemy import text
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="Service Recommendation Engine API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include API routes
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(users_router, prefix="/users", tags=["Users"])
app.include_router(providers_router, prefix="/providers", tags=["Service Providers"])
app.include_router(services_router, prefix="/services", tags=["Services"])
app.include_router(reviews_router, prefix="/reviews", tags=["Reviews"])
app.include_router(recommendations_router, prefix="/recommendations", tags=["Recommendations"])
app.include_router(categories_router, prefix="/categories", tags=["Categories"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Sentiment Recommender API!"}

@app.get("/routes")
async def get_routes():
    routes = []
    for route in app.routes:
        routes.append({
            "path": route.path,
            "name": route.name,
            "methods": route.methods
        })
    return routes

@app.on_event("startup")
async def startup_event():
    # Initialize database
    await init_db()
    
    # Test database connection
    try:
        db_gen = get_db()
        db = await anext(db_gen)
        try:
            await db.execute(text("SELECT 1"))
            logger.info("Database connection successful")
        finally:
            await db.close()
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        raise