from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional, Dict
from pydantic import BaseModel, Field, constr
from datetime import datetime
from backend.app.models.database import get_db
from backend.app.models.models import Service, ServiceProvider, User, ServiceCategory
from backend.app.api.auth import get_current_active_user, get_admin_user

router = APIRouter()

# Pydantic Models
class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    price_range: dict  # e.g., {"min": 50, "max": 200}
    duration_minutes: int
    category_id: int

class ServiceCreate(BaseModel):
    name: constr(max_length=255)
    description: Optional[str] = None
    price_range: Dict[str, float]  # {"min": float, "max": float}
    duration_minutes: int
    category_id: int

class ServiceUpdate(ServiceBase):
    name: Optional[str] = None
    description: Optional[str] = None
    price_range: Optional[dict] = None
    duration_minutes: Optional[int] = None
    category_id: Optional[int] = None
    is_active: Optional[bool] = None

class ServiceResponse(ServiceCreate):
    service_id: int
    provider_id: int
    is_active: bool = True
    
    class Config:
        orm_mode = True

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

# Endpoints
@router.post("/", response_model=ServiceResponse)
async def create_service(
    service: ServiceCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if user is a provider
    if current_user.role != "provider":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only providers can create services"
        )
    
    # Get the provider profile and check verification
    provider = await db.execute(
        select(ServiceProvider)
        .filter(ServiceProvider.user_id == current_user.user_id)
    )
    provider = provider.scalar_one_or_none()
    
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider profile not found. Please create a provider profile first."
        )
    
    if not provider.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Provider must be verified before creating services"
        )
    
    # Create new service
    new_service = Service(
        provider_id=provider.provider_id,
        **service.dict()
    )
    
    db.add(new_service)
    await db.commit()
    await db.refresh(new_service)
    
    return new_service

@router.get("/", response_model=List[ServiceResponse])
async def list_services(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    provider_id: Optional[int] = None,
    category_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Service).where(Service.is_active == True)
    
    if provider_id:
        query = query.filter(Service.provider_id == provider_id)
    if category_id:
        query = query.filter(Service.category_id == category_id)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: int,
    db: AsyncSession = Depends(get_db)
):
    service = await db.execute(
        select(Service).filter(Service.service_id == service_id)
    )
    service = service.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service

@router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: int,
    service_update: ServiceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    # First get the service
    service = await db.execute(
        select(Service).filter(Service.service_id == service_id)
    )
    service = service.scalar_one_or_none()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
        
    # Check if the current user owns this service
    if service.provider_id != current_user.user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this service")
    
    # Update the service
    for field, value in service_update.dict(exclude_unset=True).items():
        setattr(service, field, value)
    
    await db.commit()
    await db.refresh(service)
    return service

@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a service (soft delete by setting is_active to False)"""
    service = await db.execute(
        select(Service)
        .join(ServiceProvider)
        .filter(
            Service.service_id == service_id,
            ServiceProvider.user_id == current_user.user_id
        )
    )
    service = service.scalar_one_or_none()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found or you don't have permission to delete"
        )

    service.is_active = False
    await db.commit()

@router.post("/categories", response_model=CategoryCreate)
async def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new service category (Admin only)"""
    new_category = ServiceCategory(**category_data.dict())
    db.add(new_category)
    await db.commit()
    await db.refresh(new_category)
    return new_category
