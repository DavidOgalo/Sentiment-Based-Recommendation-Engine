from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api import auth, users, providers, services, reviews, recommendations
from backend.app.models.database import get_db
from dotenv import load_dotenv
import os

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

# Include API routes
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(providers.router, prefix="/providers", tags=["Service Providers"])
app.include_router(services.router, prefix="/services", tags=["Services"])
app.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])
app.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Sentiment Recommender API!"}

@app.get("/routes")
async def get_routes():
    routes = []
    for route in app.routes:
        routes.append({
            "path": route.path,
            "methods": route.methods,
            "name": route.name
        })
    return routes

@app.on_event("startup")
async def startup_event():
    """Test database connection on startup"""
    try:
        # Test the database connection
        async for session in get_db():
            try:
                await session.execute("SELECT 1")
                print("Database connection successful!")
                break
            except Exception as e:
                print(f"Database connection test failed: {str(e)}")
                raise
            finally:
                await session.close()
    except Exception as e:
        print(f"Failed to connect to database on startup: {str(e)}")