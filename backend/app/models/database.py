import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
from typing import AsyncGenerator
import asyncpg
import asyncio
from sqlalchemy.exc import SQLAlchemyError

load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL_ASYNC")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL_ASYNC environment variable is not set")

print(f"Using database URL: {DATABASE_URL}")

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    max_retries = 3
    retry_delay = 1  # seconds
    
    for attempt in range(max_retries):
        try:
            async with SessionLocal() as session:
                try:
                    # Test the connection
                    await session.execute("SELECT 1")
                    print("Database connection successful!")
                    yield session
                    break
                except SQLAlchemyError as e:
                    print(f"Database session error (attempt {attempt + 1}/{max_retries}): {str(e)}")
                    if attempt < max_retries - 1:
                        await asyncio.sleep(retry_delay)
                        continue
                    raise
                finally:
                    await session.close()
        except Exception as e:
            print(f"Database connection error (attempt {attempt + 1}/{max_retries}): {str(e)}")
            print(f"Connection details: {DATABASE_URL}")
            if attempt < max_retries - 1:
                await asyncio.sleep(retry_delay)
                continue
            raise