import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.database import Base
from app.models.models import User, ServiceCategory, ServiceProvider, Service, Review

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:se2025@localhost:4444/sentimenteng_db")

async def init_db():
    engine = create_async_engine(DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        # Create default admin user
        admin = User(
            email="admin@example.com",
            password_hash="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # password: admin
            role="admin",
            first_name="Admin",
            last_name="User",
            is_active=True
        )
        session.add(admin)
        await session.commit()

        # Create some default categories
        categories = [
            ServiceCategory(name="Cleaning", description="Professional cleaning services"),
            ServiceCategory(name="Repair", description="Home and appliance repair services"),
            ServiceCategory(name="Beauty", description="Beauty and personal care services"),
            ServiceCategory(name="Education", description="Tutoring and educational services"),
        ]
        for category in categories:
            session.add(category)
        await session.commit()

if __name__ == "__main__":
    asyncio.run(init_db()) 