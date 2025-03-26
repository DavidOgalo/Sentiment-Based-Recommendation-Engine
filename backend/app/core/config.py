from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Application-specific configurations
SECRET_KEY = os.getenv("SECRET_KEY", "default_secret_key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# Ensure imports are correct if any are added in the future.