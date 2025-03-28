# User management endpoints
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.database import get_db
from backend.app.models.models import User
from backend.app.api.auth import get_current_active_user, get_admin_user, verify_password, get_password_hash
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

router = APIRouter()

# Pydantic Models
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserUpdate(UserBase):
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class UserResponse(BaseModel):
    user_id: int
    email: str
    role: str
    first_name: Optional[str]
    last_name: Optional[str]
    created_at: datetime
    last_login: Optional[datetime]
    is_active: bool

    class Config:
        from_attributes = True

class UserCreate(UserBase):
    email: EmailStr
    password: str
    role: str

# Get current user details
@router.get("/me", response_model=UserResponse)
async def get_user_me(current_user: User = Depends(get_current_active_user)):
    """Fetch the authenticated user's details"""
    return current_user

# Update current user details
@router.put("/me", response_model=UserResponse)
async def update_user_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update the authenticated user's details"""
    # If trying to update password
    if user_update.new_password:
        if not user_update.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is required to set a new password"
            )
        
        if not verify_password(user_update.current_password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect"
            )
        
        current_user.password_hash = get_password_hash(user_update.new_password)

    # Update other fields if provided
    if user_update.email and user_update.email != current_user.email:
        # Check if new email is already taken
        existing_user = await db.execute(
            select(User).filter(User.email == user_update.email)
        )
        if existing_user.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        current_user.email = user_update.email

    if user_update.first_name is not None:
        current_user.first_name = user_update.first_name
    if user_update.last_name is not None:
        current_user.last_name = user_update.last_name

    await db.commit()
    await db.refresh(current_user)
    return current_user

# Admin: Fetch all users
@router.get("/", response_model=List[UserResponse])
async def get_all_users(
    current_user: User = Depends(get_admin_user), 
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Fetch all users with pagination (Admin only)"""
    result = await db.execute(
        select(User)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


# Admin: Get user by ID
@router.get("/{user_id}", response_model=UserResponse, dependencies=[Depends(get_admin_user)])
async def get_user_by_id(user_id: int, db: AsyncSession = Depends(get_db)):
    """Fetch a user by ID (Admin only)"""
    result = await db.execute(select(User).filter(User.user_id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user

# Admin: Update user
@router.put("/{user_id}", response_model=UserResponse, dependencies=[Depends(get_admin_user)])
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a user (Admin only)"""
    result = await db.execute(select(User).filter(User.user_id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update fields if provided
    if user_update.email and user_update.email != user.email:
        # Check if new email is already taken
        existing_user = await db.execute(
            select(User).filter(User.email == user_update.email)
        )
        if existing_user.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        user.email = user_update.email

    if user_update.first_name is not None:
        user.first_name = user_update.first_name
    if user_update.last_name is not None:
        user.last_name = user_update.last_name
    if user_update.new_password:
        user.password_hash = get_password_hash(user_update.new_password)

    await db.commit()
    await db.refresh(user)
    return user

# Admin: Deactivate/Reactivate user
@router.patch("/{user_id}/status", response_model=UserResponse)
async def toggle_user_status(
    user_id: int,
    is_active: bool = Body(..., embed=True),
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Toggle user active status (Admin only)"""
    result = await db.execute(select(User).filter(User.user_id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.is_active = is_active
    await db.commit()
    await db.refresh(user)
    return user
