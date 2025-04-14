import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.exc import SQLAlchemyError

load_dotenv()

async def test_connection():
    DATABASE_URL = os.getenv("DATABASE_URL_ASYNC")
    if not DATABASE_URL:
        print("Error: DATABASE_URL_ASYNC environment variable is not set")
        return

    print(f"Testing connection to: {DATABASE_URL}")
    
    try:
        engine = create_async_engine(DATABASE_URL, echo=True)
        async with engine.connect() as conn:
            result = await conn.execute("SELECT 1")
            print("Database connection successful!")
            print(f"Test query result: {result.scalar()}")
    except SQLAlchemyError as e:
        print(f"Database connection failed: {str(e)}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_connection()) 