# Service provider endpoints

from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
from backend.app.models.database import get_db
from backend.app.models.models import ServiceProvider, User
from backend.app.api.auth import get_current_active_user, get_admin_user

router = APIRouter()

# Pydantic Models
class ServiceProviderBase(BaseModel):
    business_name: str
    description: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    business_hours: Optional[dict] = None
    services_offered: Optional[dict] = None

class ServiceProviderCreate(ServiceProviderBase):
    pass

class ServiceProviderUpdate(ServiceProviderBase):
    is_verified: Optional[bool] = None

class ServiceProviderResponse(ServiceProviderBase):
    provider_id: int
    user_id: int
    average_rating: float
    sentiment_score: float
    total_reviews: int
    created_at: datetime
    is_verified: bool

    class Config:
        from_attributes = True

# Endpoints
@router.post("/", response_model=ServiceProviderResponse)
async def create_service_provider(
    provider_data: ServiceProviderCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new service provider profile"""
    # Check if user already has a provider profile
    existing_provider = await db.execute(
        select(ServiceProvider).filter(ServiceProvider.user_id == current_user.user_id)
    )
    if existing_provider.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has a service provider profile"
        )

    new_provider = ServiceProvider(
        user_id=current_user.user_id,
        **provider_data.dict(),
        created_at=datetime.utcnow()
    )

    db.add(new_provider)
    await db.commit()
    await db.refresh(new_provider)
    return new_provider

@router.get("/", response_model=List[ServiceProviderResponse])
async def list_service_providers(
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """List all service providers with pagination"""
    result = await db.execute(
        select(ServiceProvider)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

@router.get("/{provider_id}", response_model=ServiceProviderResponse)
async def get_service_provider(
    provider_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific service provider by ID"""
    provider = await db.execute(
        select(ServiceProvider).filter(ServiceProvider.provider_id == provider_id)
    )
    provider = provider.scalar_one_or_none()
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service provider not found"
        )
    return provider

@router.put("/{provider_id}", response_model=ServiceProviderResponse)
async def update_service_provider(
    provider_id: int,
    provider_data: ServiceProviderUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a service provider's details"""
    provider = await db.execute(
        select(ServiceProvider).filter(
            ServiceProvider.provider_id == provider_id,
            ServiceProvider.user_id == current_user.user_id
        )
    )
    provider = provider.scalar_one_or_none()
    
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service provider not found or you don't have permission to update"
        )

    # Update fields
    for field, value in provider_data.dict(exclude_unset=True).items():
        setattr(provider, field, value)

    await db.commit()
    await db.refresh(provider)
    return provider

@router.patch("/{provider_id}/verify", response_model=ServiceProviderResponse)
async def verify_service_provider(
    provider_id: int,
    data: dict = Body(..., example={"is_verified": True}),
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Verify or unverify a service provider (Admin only)"""
    provider = await db.execute(
        select(ServiceProvider).filter(ServiceProvider.provider_id == provider_id)
    )
    provider = provider.scalar_one_or_none()
    
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service provider not found"
        )

    provider.is_verified = data.get("is_verified")
    await db.commit()
    await db.refresh(provider)
    return provider
