import os
from dotenv import load_dotenv

load_dotenv()

# App settings
APP_NAME = os.getenv("APP_NAME", "ServiceBasedRecommendationEngine")
APP_ENV = os.getenv("APP_ENV", "development")

# Database settings
DATABASE_URL_SYNC = os.getenv("DATABASE_URL_SYNC")
DATABASE_URL_ASYNC = os.getenv("DATABASE_URL_ASYNC")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "s3zcz55589w9")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# Frontend Configuration
NEXT_PUBLIC_API_URL = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:8000")

# Machine Learning Configuration
SENTIMENT_MODEL_PATH = os.getenv("SENTIMENT_MODEL_PATH", "./models/sentiment_model.pkl")
RECOMMENDATION_MODEL_PATH = os.getenv("RECOMMENDATION_MODEL_PATH", "./models/recommendation_model.pkl")