from fastapi import FastAPI
from .api import auth, users, providers, services, reviews, recommendations
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Sentiment Recommender API")

# Include API routes
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(providers.router, prefix="/providers", tags=["providers"])
app.include_router(services.router, prefix="/services", tags=["services"])
app.include_router(reviews.router, tags=["reviews"])
app.include_router(
    recommendations.router,
    prefix="/recommendations",
    tags=["recommendations"]
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Sentiment Recommender API!"}

@app.get("/")
async def get_routes():
    routes = []
    for route in app.routes:
        routes.append({
            "path": route.path,
            "methods": route.methods,
            "name": route.name
        })
    return routes