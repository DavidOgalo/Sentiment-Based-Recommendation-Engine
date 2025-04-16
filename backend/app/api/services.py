from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional, Dict
from pydantic import BaseModel, Field, constr
from datetime import datetime
import logging
from ..models.database import get_db
from ..models.models import Service, ServiceProvider, User, ServiceCategory
from ..api.auth import get_current_active_user, get_admin_user
from sqlalchemy import or_
from sqlalchemy.types import Float
import traceback

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

class PriceRange(BaseModel):
    min: float
    max: float

# Pydantic Models
class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    price_range: PriceRange
    duration_minutes: int
    category_id: int

class ServiceCreate(BaseModel):
    name: constr(max_length=255)
    description: Optional[str] = None
    price_range: PriceRange
    duration_minutes: int
    category_id: int

class ServiceUpdate(ServiceBase):
    name: Optional[str] = None
    description: Optional[str] = None
    price_range: Optional[PriceRange] = None
    duration_minutes: Optional[int] = None
    category_id: Optional[int] = None
    is_active: Optional[bool] = None

class ServiceResponse(BaseModel):
    service_id: int
    name: str
    description: str
    price_range: PriceRange
    duration_minutes: int
    category_id: int
    category_name: str
    provider_id: int
    provider_name: str
    average_rating: float = 0.0
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True

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
    """Create a new service"""
    try:
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

        # Validate category exists
        category = await db.execute(
            select(ServiceCategory)
            .filter(ServiceCategory.category_id == service.category_id)
        )
        category = category.scalar_one_or_none()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service category not found"
            )
        
        # Create new service
        new_service = Service(
            provider_id=provider.provider_id,
            **service.dict()
        )
        
        db.add(new_service)
        await db.commit()
        await db.refresh(new_service)
        
        # Create response with required fields
        response = {
            'service_id': new_service.service_id,
            'name': new_service.name,
            'description': new_service.description,
            'price_range': new_service.price_range,
            'duration_minutes': new_service.duration_minutes,
            'category_id': new_service.category_id,
            'category_name': category.name,
            'provider_id': new_service.provider_id,
            'provider_name': provider.business_name,
            'average_rating': new_service.average_rating or 0.0,
            'is_active': new_service.is_active,
            'created_at': new_service.created_at
        }
        
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating service: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create service"
        )

@router.get("/", response_model=List[ServiceResponse])
async def list_services(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    limit: int = 10,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """List all services with optional filters"""
    try:
        # Build the query
        query = select(Service, ServiceCategory.name.label('category_name'), ServiceProvider.business_name.label('provider_name'))
        query = query.join(ServiceCategory, Service.category_id == ServiceCategory.category_id)
        query = query.join(ServiceProvider, Service.provider_id == ServiceProvider.provider_id)
        query = query.filter(Service.is_active == True)

        # Apply filters
        if search:
            query = query.filter(
                or_(
                    Service.name.ilike(f"%{search}%"),
                    Service.description.ilike(f"%{search}%")
                )
            )
        
        if category_id:
            query = query.filter(Service.category_id == category_id)
        
        if min_price is not None or max_price is not None:
            # For JSONB price range, we need to extract the min/max values
            if min_price is not None:
                query = query.filter(Service.price_range['min'].astext.cast(Float) >= min_price)
            if max_price is not None:
                query = query.filter(Service.price_range['max'].astext.cast(Float) <= max_price)

        # Apply pagination
        query = query.limit(limit).offset(offset)
        
        # Execute the query
        result = await db.execute(query)
        services = result.all()
        
        # Format the response
        formatted_services = []
        for service, category_name, provider_name in services:
            try:
                service_dict = {
                    'service_id': service.service_id,
                    'name': service.name,
                    'description': service.description,
                    'price_range': service.price_range,
                    'duration_minutes': service.duration_minutes,
                    'category_id': service.category_id,
                    'category_name': category_name,
                    'provider_id': service.provider_id,
                    'provider_name': provider_name,
                    'average_rating': service.average_rating or 0.0,
                    'is_active': service.is_active,
                    'created_at': service.created_at
                }
                formatted_services.append(service_dict)
            except Exception as e:
                logger.error(f"Error formatting service {service.service_id}: {str(e)}")
                continue

        return formatted_services
    except Exception as e:
        logger.error(f"Error listing services: {str(e)}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to fetch services")

@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a service by ID"""
    try:
        # Build the query to get service with category and provider names
        query = select(Service, ServiceCategory.name.label('category_name'), ServiceProvider.business_name.label('provider_name'))
        query = query.join(ServiceCategory, Service.category_id == ServiceCategory.category_id)
        query = query.join(ServiceProvider, Service.provider_id == ServiceProvider.provider_id)
        query = query.filter(Service.service_id == service_id)
        query = query.filter(Service.is_active == True)
        
        # Execute the query
        result = await db.execute(query)
        service_data = result.first()
        
        if not service_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found"
            )
        
        service, category_name, provider_name = service_data
        
        # Format the response
        response = {
            'service_id': service.service_id,
            'name': service.name,
            'description': service.description,
            'price_range': service.price_range,
            'duration_minutes': service.duration_minutes,
            'category_id': service.category_id,
            'category_name': category_name,
            'provider_id': service.provider_id,
            'provider_name': provider_name,
            'average_rating': service.average_rating or 0.0,
            'is_active': service.is_active,
            'created_at': service.created_at
        }
        
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching service: {str(e)}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch service"
        )

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

@router.get("/provider/{provider_id}", response_model=List[ServiceResponse])
async def get_services_by_provider(
    provider_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get all services for a specific provider"""
    try:
        # Build the query
        stmt = select(Service, ServiceCategory.name.label('category_name'), ServiceProvider.business_name.label('provider_name'))
        stmt = stmt.join(ServiceCategory, Service.category_id == ServiceCategory.category_id)
        stmt = stmt.join(ServiceProvider, Service.provider_id == ServiceProvider.provider_id)
        stmt = stmt.where(Service.provider_id == provider_id)

        # Execute the query
        result = await db.execute(stmt)
        services = result.all()

        # Format the response
        formatted_services = []
        for service, category_name, provider_name in services:
            service_dict = {
                'service_id': service.service_id,
                'name': service.name,
                'description': service.description,
                'price_range': service.price_range,
                'duration_minutes': service.duration_minutes,
                'category_id': service.category_id,
                'category_name': category_name,
                'provider_id': service.provider_id,
                'provider_name': provider_name,
                'average_rating': service.average_rating or 0.0,
                'is_active': service.is_active,
                'created_at': service.created_at
            }
            formatted_services.append(service_dict)

        return formatted_services
    except Exception as e:
        logger.error(f"Error fetching provider services: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch provider services")
