from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Optional
from ..models.database import get_db
from ..models.models import Review, Service, User
from ..api.auth import get_current_active_user
from pydantic import BaseModel, Field, validator
from datetime import datetime, timezone
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

router = APIRouter()

# Initialize the VADER sentiment analyzer
sentiment_analyzer = SentimentIntensityAnalyzer()

# Pydantic models
class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    comment: str = Field(..., min_length=5, max_length=1000)
    sentiment_score: Optional[float] = None

class ReviewCreate(ReviewBase):
    service_id: int

class ReviewResponse(ReviewBase):
    review_id: int
    service_id: int
    user_id: int
    user_first_name: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = Field(None, min_length=5, max_length=1000)

    @validator('rating', 'comment')
    def at_least_one_field(cls, v, values):
        if v is None and not values:
            raise ValueError('At least one field must be provided')
        return v
        
# Analyze sentiment of a comment
def analyze_sentiment(comment: str) -> float:
    """
    Analyze the sentiment of a comment using VADER.
    Returns a score between -1 (very negative) and 1 (very positive).
    """
    sentiment = sentiment_analyzer.polarity_scores(comment)
    return sentiment['compound']  # compound is the normalized score

async def update_service_rating(service_id: int, db: AsyncSession):
    """Update the average rating of a service based on its reviews"""
    try:
        # Calculate average rating
        result = await db.execute(
            select(func.avg(Review.rating))
            .where(Review.service_id == service_id)
        )
        average_rating = result.scalar_one_or_none()
        
        # Update service's average rating
        service = await db.execute(
            select(Service).where(Service.service_id == service_id)
        )
        service = service.scalar_one_or_none()
        
        if service:
            service.average_rating = float(average_rating) if average_rating else 0.0
            await db.commit()
    except Exception as e:
        print(f"Error updating service rating: {str(e)}")
        raise

# Create a new review
@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review: ReviewCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new review"""
    try:
        # Check if the service exists
        service = await db.execute(
            select(Service).filter(Service.service_id == review.service_id)
        )
        service = service.scalar_one_or_none()
        
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found"
            )
        
        # Check if user has already reviewed this service
        existing_review = await db.execute(
            select(Review).filter(Review.service_id == review.service_id, Review.user_id == current_user.user_id)
        )
        
        if existing_review.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already reviewed this service"
            )
        
        # Analyze sentiment
        sentiment_score = analyze_sentiment(review.comment)
        
        # Create review
        new_review = Review(
            service_id=review.service_id,
            user_id=current_user.user_id,
            rating=review.rating,
            comment=review.comment,
            sentiment_score=sentiment_score,
            created_at=datetime.now(timezone.utc)
        )
        
        db.add(new_review)
        await db.commit()
        await db.refresh(new_review)
        
        # Update service's average rating
        await update_service_rating(review.service_id, db)
        
        # Create response with user's first name
        response = ReviewResponse(
            review_id=new_review.review_id,
            service_id=new_review.service_id,
            user_id=new_review.user_id,
            rating=new_review.rating,
            comment=new_review.comment,
            sentiment_score=new_review.sentiment_score,
            created_at=new_review.created_at,
            user_first_name=current_user.first_name or 'Anonymous'
        )
        
        return response
    except Exception as e:
        await db.rollback()
        print(f"Error creating review: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create review"
        )

# List reviews for a specific service
@router.get("/services/{service_id}/reviews", response_model=List[ReviewResponse])
async def list_service_reviews(
    service_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    # Check if service exists
    service = await db.execute(
        select(Service).filter(Service.service_id == service_id)
    )
    
    if not service.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    # Get reviews with user details
    reviews = await db.execute(
        select(Review, User.first_name)
        .join(User, Review.user_id == User.user_id)
        .filter(Review.service_id == service_id)
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    
    # Format response with user first name
    formatted_reviews = []
    for review, first_name in reviews:
        review_dict = review.__dict__
        review_dict['user_first_name'] = first_name
        formatted_reviews.append(ReviewResponse(**review_dict))
    
    return formatted_reviews

# Get a specific review
@router.get("/reviews/{review_id}", response_model=ReviewResponse)
async def get_review(
    review_id: int,
    db: AsyncSession = Depends(get_db)
):
    review = await db.execute(
        select(Review).filter(Review.review_id == review_id)
    )
    review = review.scalar_one_or_none()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    return review

# Get reviews by current user
@router.get("/users/me/reviews", response_model=List[ReviewResponse])
async def get_my_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    reviews = await db.execute(
        select(Review)
        .filter(Review.user_id == current_user.user_id)
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    
    return reviews.scalars().all()

# Update a review
@router.put("/reviews/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: int,
    review_update: ReviewUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an existing review"""
    try:
        # Get existing review
        review = await db.execute(
            select(Review)
            .filter(Review.review_id == review_id)
        )
        review = review.scalar_one_or_none()
        
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        # Verify ownership
        if review.user_id != current_user.user_id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this review"
            )
        
        # Update fields
        update_data = review_update.dict(exclude_unset=True)
        
        # Re-analyze sentiment if comment is changed
        if "comment" in update_data:
            update_data["sentiment_score"] = analyze_sentiment(update_data["comment"])
        
        # Apply updates
        for field, value in update_data.items():
            setattr(review, field, value)
        
        review.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(review)
        
        # Update service's average rating
        await update_service_rating(review.service_id, db)
        
        return review
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# Delete a review
@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    # Get review
    review = await db.execute(
        select(Review)
        .filter(Review.review_id == review_id)
    )
    review = review.scalar_one_or_none()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    # Verify ownership
    if review.user_id != current_user.user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this review"
        )
    
    # Delete review
    await db.delete(review)
    await db.commit()
    
    return None