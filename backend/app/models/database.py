import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import text
from dotenv import load_dotenv
from typing import AsyncGenerator
import asyncpg
import asyncio
from sqlalchemy.exc import SQLAlchemyError
import logging
from fastapi import HTTPException, status

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DB_MAX_RETRIES = 5
DB_RETRY_DELAY = 1  # seconds

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL_ASYNC")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL_ASYNC environment variable is not set")

logger.info(f"Using database URL: {DATABASE_URL}")

# Create async engine with optimized configuration
engine = create_async_engine(
    DATABASE_URL,
    echo=True,  # Set to False in production
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_timeout=30,
    pool_recycle=3600,  # Recycle connections every hour
    connect_args={
        "timeout": 10,
        "command_timeout": 10
    }
)

SessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function that yields db sessions.
    Handles connection retries and proper session cleanup.
    """
    session = None
    for attempt in range(DB_MAX_RETRIES):
        try:
            session = SessionLocal()
            # Test connection
            await session.execute(text("SELECT 1"))
            logger.info("Database connection established")
            
            try:
                yield session
                await session.commit()
            except Exception as e:
                await session.rollback()
                logger.error(f"Database operation failed: {str(e)}")
                raise
            finally:
                await session.close()
            return
            
        except (SQLAlchemyError, asyncpg.exceptions.PostgresError) as e:
            logger.error(f"Database connection error (attempt {attempt + 1}/{DB_MAX_RETRIES}): {str(e)}")
            if session:
                await session.close()
            if attempt == DB_MAX_RETRIES - 1:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Database connection unavailable"
                )
            await asyncio.sleep(DB_RETRY_DELAY * (attempt + 1))  # Exponential backoff

async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized")