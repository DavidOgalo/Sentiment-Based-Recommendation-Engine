# Service provider endpoints

from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional, Dict
from pydantic import BaseModel, EmailStr, constr, Field
from datetime import datetime
import logging
from ..models.database import get_db
from ..models.models import ServiceProvider, User, ServiceCategory
from .auth import get_current_active_user, get_admin_user
from sqlalchemy import or_

router = APIRouter()

# Pydantic Models
class ProviderCreate(BaseModel):
    business_name: constr(max_length=255)
    description: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    business_hours: Optional[Dict] = None
    services_offered: Optional[Dict] = None

class ProviderResponse(ProviderCreate):
    provider_id: int
    user_id: int
    average_rating: Optional[float] = 0
    sentiment_score: Optional[float] = 0
    total_reviews: Optional[int] = 0
    is_verified: bool = False
    
    class Config:
        orm_mode = True

# Pydantic model for category
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryResponse(CategoryCreate):
    category_id: int
    
    class Config:
        orm_mode = True

# Endpoints
@router.post("/", response_model=ProviderResponse)
async def create_provider(
    provider_data: ProviderCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if user is a provider
    if current_user.role != "provider":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only users with provider role can create provider profiles"
        )
    
    # Check if provider profile already exists
    existing_provider = await db.execute(
        select(ServiceProvider).filter(ServiceProvider.user_id == current_user.user_id)
    )
    if existing_provider.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provider profile already exists for this user"
        )
    
    # Create new provider profile
    new_provider = ServiceProvider(
        user_id=current_user.user_id,
        **provider_data.dict(exclude_unset=True)  # Only include provided fields
    )
    
    db.add(new_provider)
    await db.commit()
    await db.refresh(new_provider)
    
    return new_provider

@router.get("/", response_model=List[ProviderResponse])
async def list_service_providers(
    skip: int = 0,
    limit: int = 10,
    search: Optional[str] = None,
    is_verified: Optional[bool] = None,
    min_rating: Optional[float] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all service providers with pagination and filtering"""
    try:
        # Build the base query
        stmt = select(ServiceProvider)

        # Apply filters
        if search:
            stmt = stmt.where(
                or_(
                    ServiceProvider.business_name.ilike(f"%{search}%"),
                    ServiceProvider.description.ilike(f"%{search}%")
                )
            )
        if is_verified is not None:
            stmt = stmt.where(ServiceProvider.is_verified == is_verified)
        if min_rating is not None:
            stmt = stmt.where(ServiceProvider.average_rating >= min_rating)

        # Apply pagination
        stmt = stmt.offset(skip).limit(limit)

        # Execute the query
        result = await db.execute(stmt)
        providers = result.scalars().all()

        return providers
    except Exception as e:
        logger.error(f"Error listing providers: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch providers")

@router.get("/{provider_id}", response_model=ProviderResponse)
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

@router.put("/{provider_id}", response_model=ProviderResponse)
async def update_service_provider(
    provider_id: int,
    provider_data: ProviderCreate,
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

@router.patch("/{provider_id}/verify", response_model=ProviderResponse)
async def verify_service_provider(
    provider_id: int,
    data: dict = Body(..., example={"is_verified": True}),
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Verify or unverify a service provider (Admin only)"""
    try:
        provider = await db.execute(
            select(ServiceProvider).filter(ServiceProvider.provider_id == provider_id)
        )
        provider = provider.scalar_one_or_none()
        
        if not provider:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service provider not found"
            )

        is_verified = data.get("is_verified")
        if not isinstance(is_verified, bool):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="is_verified must be a boolean value"
            )

        provider.is_verified = is_verified
        await db.commit()
        await db.refresh(provider)
        return provider
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying provider {provider_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify provider"
        )

# Create category endpoint
@router.post("/categories", response_model=CategoryResponse)
async def create_category(
    category: CategoryCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create categories"
        )
    
    new_category = ServiceCategory(**category.dict())
    db.add(new_category)
    await db.commit()
    await db.refresh(new_category)
    return new_category

@router.get("/user/{user_id}", response_model=ProviderResponse)
async def get_provider_by_user_id(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a service provider by user ID"""
    provider = await db.execute(
        select(ServiceProvider).filter(ServiceProvider.user_id == user_id)
    )
    provider = provider.scalar_one_or_none()
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service provider not found"
        )
    return provider
