# Recommendation engine endpoints
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc, and_, cast, Float
from typing import List, Optional
from ..models.database import get_db
from ..models.models import User, Service, Review, ServiceProvider, ServiceCategory
from ..api.auth import get_current_active_user
from pydantic import BaseModel
from datetime import datetime, timedelta

router = APIRouter()

# Pydantic models
class ServiceRecommendation(BaseModel):
    service_id: int
    name: str
    description: Optional[str] = None
    provider_id: int
    provider_name: str
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    average_rating: float
    sentiment_score: Optional[float] = None
    recommendation_score: float
    price_range: Optional[dict] = None
    
    class Config:
        orm_mode = True

# Get personalized recommendations
@router.get("/", response_model=List[ServiceRecommendation])
async def get_recommendations(
    limit: int = Query(10, ge=1, le=50),
    category_id: Optional[int] = None,
    min_rating: Optional[float] = Query(None, ge=1, le=5),
    max_price: Optional[float] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get personalized service recommendations based on sentiment analysis and user preferences.
    """
    # Base query to get services with their average rating and sentiment
    query = select(
        Service,
        func.avg(Review.rating).label("average_rating"),
        func.avg(Review.sentiment_score).label("avg_sentiment")
    ).join(
        Review, Service.service_id == Review.service_id, isouter=True
    ).filter(
        Service.is_active == True
    ).group_by(
        Service.service_id
    )
    
    # Apply filters if provided
    if category_id:
        query = query.filter(Service.category_id == category_id)
    
    if min_rating:
        # Fix: Only filter by min_rating if there are reviews
        query = query.having(
            func.coalesce(func.avg(Review.rating), 0) >= min_rating
        )
    
    # Note: We'll handle max_price filter after getting the results,
    # since price_range is a JSONB field that needs special handling
    
    # Execute the query
    result = await db.execute(query)
    services = result.all()
    
    # Get user's previous interactions (reviews)
    user_reviews = await db.execute(
        select(Review).filter(Review.user_id == current_user.user_id)
    )
    user_reviews = user_reviews.scalars().all()
    
    # Calculate preferred categories based on user's previous positive reviews
    category_preferences = {}
    
    for review in user_reviews:
        service = await db.execute(select(Service).filter(Service.service_id == review.service_id))
        service = service.scalar_one_or_none()
        
        if service and service.category_id:
            # Weigh preference by rating and sentiment
            preference_score = (review.rating / 5.0) * (max(0, review.sentiment_score) if review.sentiment_score else 0.5)
            
            if service.category_id in category_preferences:
                category_preferences[service.category_id] += preference_score
            else:
                category_preferences[service.category_id] = preference_score
    
    # Calculate recommendation score for each service
    recommendations = []
    
    for service, avg_rating, avg_sentiment in services:
        # Skip services the user has already reviewed
        if any(review.service_id == service.service_id for review in user_reviews):
            continue
            
        # Apply price filter manually (since we can't do it easily in the SQL query)
        if max_price and service.price_range:
            try:
                # Handle different possible structures of price_range
                if isinstance(service.price_range, dict) and 'max' in service.price_range:
                    service_max_price = float(service.price_range['max'])
                elif isinstance(service.price_range, str):
                    import json
                    price_data = json.loads(service.price_range)
                    service_max_price = float(price_data.get('max', float('inf')))
                else:
                    # If we can't determine max price, skip this service
                    continue
                    
                if service_max_price > max_price:
                    continue  # Skip this service if price exceeds max
            except (ValueError, TypeError, AttributeError, KeyError):
                # If we can't parse the price, we'll include the service anyway
                pass
        
        # Base score is average rating (normalize to 0-1)
        base_score = float(avg_rating) / 5.0 if avg_rating else 0.5
        
        # Sentiment factor (normalize to 0-1, with 0.5 being neutral)
        sentiment_factor = (float(avg_sentiment) + 1) / 2 if avg_sentiment is not None else 0.5
        
        # Category preference factor
        category_factor = 1.0
        if service.category_id in category_preferences:
            # Boost score for preferred categories
            category_factor = 1.0 + (category_preferences[service.category_id] * 0.5)
        
        # Calculate final recommendation score
        recommendation_score = base_score * sentiment_factor * category_factor
        
        # Get provider name
        provider_query = await db.execute(
            select(ServiceProvider).filter(ServiceProvider.provider_id == service.provider_id)
        )
        provider = provider_query.scalar_one_or_none()
        provider_name = provider.business_name if provider else "Unknown Provider"
        
        # Get category name
        category_name = None
        if service.category_id:
            category_query = await db.execute(
                select(ServiceCategory).filter(ServiceCategory.category_id == service.category_id)
            )
            category = category_query.scalar_one_or_none()
            category_name = category.name if category else None
        
        # Add to recommendations
        recommendations.append({
            "service_id": service.service_id,
            "name": service.name,
            "description": service.description,
            "provider_id": service.provider_id,
            "provider_name": provider_name,
            "category_id": service.category_id,
            "category_name": category_name,
            "average_rating": float(avg_rating) if avg_rating else 0.0,
            "sentiment_score": float(avg_sentiment) if avg_sentiment else None,
            "recommendation_score": recommendation_score,
            "price_range": service.price_range
        })
    
    # Sort by recommendation score (highest first)
    recommendations.sort(key=lambda x: x["recommendation_score"], reverse=True)
    
    # Limit results
    return recommendations[:limit]

# Get trending services
@router.get("/trending", response_model=List[ServiceRecommendation])
async def get_trending_services(
    limit: int = Query(10, ge=1, le=50),
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db)
):
    """
    Get trending services based on recent high ratings and positive sentiment.
    """
    # Calculate cutoff date
    cutoff_date = datetime.now() - timedelta(days=days)
    
    # Query for trending services
    query = select(
        Service,
        func.avg(Review.rating).label("average_rating"),
        func.avg(Review.sentiment_score).label("avg_sentiment"),
        func.count(Review.review_id).label("review_count")
    ).join(
        Review, Service.service_id == Review.service_id
    ).filter(
        Service.is_active == True,
        Review.created_at >= cutoff_date
    ).group_by(
        Service.service_id
    ).having(
        func.count(Review.review_id) >= 1  # At least 1 review to be considered trending in MVP
    ).order_by(
        desc(func.avg(Review.rating) * func.coalesce(func.avg(Review.sentiment_score) + 1, 1) / 2 * func.count(Review.review_id))
    ).limit(limit)
    
    result = await db.execute(query)
    trending_services = result.all()
    
    # Format response
    recommendations = []
    
    for service, avg_rating, avg_sentiment, review_count in trending_services:
        # Get provider name
        provider_query = await db.execute(
            select(ServiceProvider).filter(ServiceProvider.provider_id == service.provider_id)
        )
        provider = provider_query.scalar_one_or_none()
        provider_name = provider.business_name if provider else "Unknown Provider"
        
        # Get category name
        category_name = None
        if service.category_id:
            category_query = await db.execute(
                select(ServiceCategory).filter(ServiceCategory.category_id == service.category_id)
            )
            category = category_query.scalar_one_or_none()
            category_name = category.name if category else None
        
        # Calculate trending score
        trending_score = float(avg_rating) * ((float(avg_sentiment) + 1) / 2 if avg_sentiment else 0.5) * (min(review_count, 10) / 10)
        
        recommendations.append({
            "service_id": service.service_id,
            "name": service.name,
            "description": service.description,
            "provider_id": service.provider_id,
            "provider_name": provider_name,
            "category_id": service.category_id,
            "category_name": category_name,
            "average_rating": float(avg_rating) if avg_rating else 0.0,
            "sentiment_score": float(avg_sentiment) if avg_sentiment else None,
            "recommendation_score": trending_score,
            "price_range": service.price_range
        })
    
    return recommendations