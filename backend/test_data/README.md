# Test Data for Sentiment-Based Recommendation Engine

This directory contains test data and scripts for populating the database with sample data for testing and development purposes, tweak data for your respective use-case.

## Directory Structure

```
test_data/
├── categories/
│   └── service_categories.json
├── providers/
│   └── provider_profiles.json
├── services/
│   └── services.json
├── reviews/
│   └── reviews.json
└── populate_test_data.py

```

## Test Data Contents
The test data is designed to cover:
- Category-based recommendations
- Price-based filtering
- Rating-based filtering (ratings from 2 to 5)
- Sentiment analysis (diverse comments with varying sentiment)
- User preference tracking (multiple reviews per service)
- Trending services (services with high ratings and positive sentiment)

### Categories
Contains predefined service categories for car wash services:
- General Wash
- Exterior Car Washing
- Interior Vacuuming and Cleaning
- Engine Cleaning
- Undercarriage Cleaning
- Car Detailing Services
- Polishing and Waxing
- Waxing and Buffing
- Headlight Restoration
- Tire and Rim Cleaning

### Providers
Sample service provider profiles with:
- Business names and descriptions
- Contact information
- Business hours
- Services offered
- Location data

### Services
Sample services for each category with:
- Service names and descriptions
- Price ranges
- Duration information
- Category associations

### Reviews
Sample reviews with:
- Ratings (1-5)
- Comments
- Sentiment scores
- Service associations

## Usage

1. Ensure the database is running and accessible
2. Install required packages:
```bash
pip install -r requirements.txt
```

3. Run the population script
```bash
python populate_test_data.py
```
The population script:
- Handles all the necessary API calls in the correct order, including: 
   - User registration 
   - Login and token management
   - Category creation
   - Provider profile creation and verification
   - Service creation 
   - Review creation.
- Distributes services among providers and reviews among customers
- Includes error handling and logging


## Test Users

The script creates the following test users:

### Admin User
- Email: admin@test.com
- Password: AdminPass123!

### Provider Users
1. ModWash Car Wash
   - Email: provider1@test.com
   - Password: ProviderPass123!

2. Luxe Detailing Car Wash
   - Email: provider2@test.com
   - Password: ProviderPass123!

3. Autobell Car Wash
   - Email: provider3@test.com
   - Password: ProviderPass123!

4. Elite Car Wash
   - Email: provider4@test.com
   - Password: ProviderPass123!

### Customer Users
1. John Doe
   - Email: customer1@test.com
   - Password: CustomerPass123!

2. Jane Smith
   - Email: customer2@test.com
   - Password: CustomerPass123!

3. Mike Johnson
   - Email: customer3@test.com
   - Password: CustomerPass123!

## Data Population Process

The script follows this sequence:
1. Creates admin user
2. Creates provider users and profiles
3. Creates customer users
4. Creates service categories
5. Creates services for each provider
6. Creates reviews for services
7. Creates user preferences
8. Creates sample bookings

## Notes

- All test data is fictional and for testing purposes only
- The script includes error handling and logging
- Each step is logged for debugging purposes
- The script can be run multiple times (it will clean up existing data first)
- All passwords follow the pattern: [Role]Pass123!

## Troubleshooting

If you encounter issues:

1. Check the database connection:

Different host database
```bash
psql -h <db-address> -d <db-name> -U <username> -W
```
Same host database
```bash
psql -d <db-name> -U <username> -W
```

2. Verify the environment variables:
```bash
cat .env
```

3. Check the logs:
```bash
docker-compose logs -f backend
```

4. Reset the database:
```bash
docker-compose down -v
docker-compose up -d
python populate_test_data.py
``` 