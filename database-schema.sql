-- Create database
CREATE DATABASE sentimenteng_db;

-- Connect to the database
\c sentimenteng_db

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT users_role_check CHECK (role IN ('customer', 'provider', 'admin'))
);

-- Create user_preferences table
CREATE TABLE user_preferences (
    preference_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    category_preferences JSONB,
    price_sensitivity INTEGER,
    distance_preference INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_preferences_price_sensitivity_check CHECK (price_sensitivity >= 1 AND price_sensitivity <= 5),
    CONSTRAINT user_preferences_distance_preference_check CHECK (distance_preference >= 1 AND distance_preference <= 5)
);

-- Create service_categories table
CREATE TABLE service_categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- Create service_providers table
CREATE TABLE service_providers (
    provider_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    business_name VARCHAR(255) NOT NULL,
    description TEXT,
    contact_phone VARCHAR(20),
    address TEXT,
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    business_hours JSONB,
    services_offered JSONB,
    average_rating NUMERIC(3,2) DEFAULT 0,
    sentiment_score NUMERIC(4,3) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT false
);

-- Create services table
CREATE TABLE services (
    service_id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES service_providers(provider_id),
    category_id INTEGER REFERENCES service_categories(category_id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_range JSONB,
    duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    average_rating DOUBLE PRECISION DEFAULT 0.0
);

-- Create reviews table
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(service_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL,
    sentiment_score DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5)
);

-- Create review_sentiment_details table
CREATE TABLE review_sentiment_details (
    sentiment_id SERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES reviews(review_id),
    aspect VARCHAR(100),
    aspect_sentiment_score NUMERIC(4,3),
    keywords JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create recommendations table
CREATE TABLE recommendations (
    recommendation_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    provider_id INTEGER REFERENCES service_providers(provider_id),
    recommendation_score NUMERIC(4,3),
    recommendation_factors JSONB,
    is_clicked BOOLEAN DEFAULT false,
    is_booked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_interactions table
CREATE TABLE user_interactions (
    interaction_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    provider_id INTEGER REFERENCES service_providers(provider_id),
    interaction_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    provider_id INTEGER REFERENCES service_providers(provider_id),
    service_id INTEGER REFERENCES services(service_id),
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_reviews_service_id ON reviews(service_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_services_avg_rating ON services(average_rating);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date); 