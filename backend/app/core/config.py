from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Application-specific configurations
SECRET_KEY = os.getenv("SECRET_KEY")  # Make sure this is being loaded correctly
print(f"Using SECRET_KEY: {SECRET_KEY}")  # Add this debug line temporarily
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

# Ensure imports are correct if any are added in the future.