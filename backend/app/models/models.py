# Database ORM models
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Text, JSON, DateTime, Float, CheckConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.app.models.database import Base

# Users Table
class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    is_active = Column(Boolean, default=True)

    # Relationships
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    preferences = relationship("UserPreference", back_populates="user")

 
# Service Providers Table
class ServiceProvider(Base):
    __tablename__ = "service_providers"

    provider_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    business_name = Column(String, nullable=False)
    description = Column(Text)
    contact_phone = Column(String(20))
    address = Column(Text)
    latitude = Column(Float)
    longitude = Column(Float)
    business_hours = Column(JSON)
    services_offered = Column(JSON)
    average_rating = Column(Float, default=0)
    sentiment_score = Column(Float, default=0)
    total_reviews = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_verified = Column(Boolean, default=False)

    # Relationships
    user = relationship("User")
    services = relationship("Service", back_populates="provider")
    reviews = relationship(
        "Review",
        secondary="services",
        primaryjoin="ServiceProvider.provider_id == Service.provider_id",
        secondaryjoin="and_(Service.service_id == Review.service_id, Service.is_active == True)",
        viewonly=True,
        back_populates="provider"
    )


# Service Categories Table
class ServiceCategory(Base):
    __tablename__ = "service_categories"

    category_id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)

    # Relationships
    services = relationship("Service", back_populates="category")


# Services Table
class Service(Base):
    __tablename__ = "services"

    service_id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("service_providers.provider_id"))
    category_id = Column(Integer, ForeignKey("service_categories.category_id"))
    name = Column(String, nullable=False)
    description = Column(Text)
    price_range = Column(JSON)
    duration_minutes = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    # Relationships
    provider = relationship("ServiceProvider", back_populates="services")
    category = relationship("ServiceCategory", back_populates="services")
    reviews = relationship("Review", back_populates="service", cascade="all, delete-orphan")


# Reviews Table
class Review(Base):
    __tablename__ = "reviews"

    review_id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.service_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=False)
    sentiment_score = Column(Float)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    # Relationships
    service = relationship("Service", back_populates="reviews")
    user = relationship("User", back_populates="reviews")
    provider = relationship(
        "ServiceProvider",
        secondary="services",
        primaryjoin="Review.service_id == Service.service_id",
        secondaryjoin="Service.provider_id == ServiceProvider.provider_id",
        viewonly=True,
        back_populates="reviews"
    )

    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='reviews_rating_check'),
    )


# Review Sentiment Details Table
class ReviewSentimentDetail(Base):
    __tablename__ = "review_sentiment_details"

    sentiment_id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.review_id"))
    aspect = Column(String(100))
    aspect_sentiment_score = Column(Float)
    keywords = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    review = relationship("Review")


# User Preferences Table
class UserPreference(Base):
    __tablename__ = "user_preferences"

    preference_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    category_preferences = Column(JSON)
    price_sensitivity = Column(Integer)
    distance_preference = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="preferences")


# Recommendations Table
class Recommendation(Base):
    __tablename__ = "recommendations"

    recommendation_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    provider_id = Column(Integer, ForeignKey("service_providers.provider_id"))
    recommendation_score = Column(Float)
    recommendation_factors = Column(JSON)
    is_clicked = Column(Boolean, default=False)
    is_booked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# User Interactions Table
class UserInteraction(Base):
    __tablename__ = "user_interactions"

    interaction_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    provider_id = Column(Integer, ForeignKey("service_providers.provider_id"))
    interaction_type = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)


# Bookings Table
class Booking(Base):
    __tablename__ = "bookings"

    booking_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    provider_id = Column(Integer, ForeignKey("service_providers.provider_id"))
    service_id = Column(Integer, ForeignKey("services.service_id"))
    booking_date = Column(DateTime, nullable=False)
    booking_time = Column(DateTime, nullable=False)
    status = Column(String(20), default="pending")
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User")
    provider = relationship("ServiceProvider")
    service = relationship("Service")

