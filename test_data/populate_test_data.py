import json
import asyncio
import aiohttp
import os
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8001"
TOKENS = {}

async def login(email: str, password: str) -> str:
    """Login and return the access token."""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{BASE_URL}/auth/login",
            data={"username": email, "password": password} 
        ) as response:
            if response.status == 200:
                data = await response.json()
                return data["access_token"]
            else:
                print(f"Login failed for {email}: {await response.text()}")
                return None

async def register_user(user_data: Dict[str, Any]) -> bool:
    """Register a new user."""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{BASE_URL}/auth/register",
            json=user_data
        ) as response:
            if response.status == 200:
                print(f"Successfully registered user: {user_data['email']}")
                return True
            else:
                print(f"Registration failed for {user_data['email']}: {await response.text()}")
                return False

async def create_category(category_data: Dict[str, Any], admin_token: str) -> int:
    """Create a service category and return its ID."""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{BASE_URL}/providers/categories",
            headers={"Authorization": f"Bearer {admin_token}"},
            json=category_data
        ) as response:
            if response.status == 200:
                data = await response.json()
                print(f"Successfully created category: {category_data['name']}")
                return data["category_id"]
            else:
                print(f"Category creation failed for {category_data['name']}: {await response.text()}")
                return None

async def create_provider_profile(profile_data: Dict[str, Any], provider_token: str) -> int:
    """Create a provider profile and return its ID."""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{BASE_URL}/providers/",
            headers={"Authorization": f"Bearer {provider_token}"},
            json=profile_data
        ) as response:
            if response.status == 200:
                data = await response.json()
                print(f"Successfully created provider profile: {profile_data['business_name']}")
                return data["provider_id"]
            else:
                print(f"Provider profile creation failed for {profile_data['business_name']}: {await response.text()}")
                return None

async def create_service(service_data: Dict[str, Any], provider_token: str) -> int:
    """Create a service and return its ID."""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{BASE_URL}/services/",
            headers={"Authorization": f"Bearer {provider_token}"},
            json=service_data
        ) as response:
            if response.status == 200:
                data = await response.json()
                print(f"Successfully created service: {service_data['name']}")
                return data["service_id"]
            else:
                print(f"Service creation failed for {service_data['name']}: {await response.text()}")
                return None

async def create_review(review_data: Dict[str, Any], customer_token: str) -> bool:
    """Create a review."""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{BASE_URL}/reviews",
            headers={"Authorization": f"Bearer {customer_token}"},
            json=review_data
        ) as response:
            if response.status == 200:
                print(f"Successfully created review for service {review_data['service_id']}")
                return True
            else:
                print(f"Review creation failed for service {review_data['service_id']}: {await response.text()}")
                return False

async def verify_provider(provider_id: int, admin_token: str) -> bool:
    """Verify a service provider."""
    async with aiohttp.ClientSession() as session:
        async with session.put(
            f"{BASE_URL}/providers/{provider_id}/verify",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"is_verified": True}
        ) as response:
            if response.status == 200:
                print(f"Successfully verified provider {provider_id}")
                return True
            else:
                print(f"Provider verification failed for {provider_id}: {await response.text()}")
                return False

async def main():
    # Load test data
    with open("users/customers.json") as f:
        customers_data = json.load(f)
    with open("users/providers.json") as f:
        providers_data = json.load(f)
    with open("users/admin.json") as f:
        admin_data = json.load(f)
    with open("categories/service_categories.json") as f:
        categories_data = json.load(f)
    with open("providers/provider_profiles.json") as f:
        provider_profiles_data = json.load(f)
    with open("services/services.json") as f:
        services_data = json.load(f)
    with open("reviews/reviews.json") as f:
        reviews_data = json.load(f)

    # Register users
    print("\nRegistering users...")
    for customer in customers_data["customers"]:
        await register_user(customer)
    for provider in providers_data["providers"]:
        await register_user(provider)
    await register_user(admin_data["admin"])

    # Login users and store tokens
    print("\nLogging in users...")
    for customer in customers_data["customers"]:
        TOKENS[customer["email"]] = await login(customer["email"], customer["password"])
    for provider in providers_data["providers"]:
        TOKENS[provider["email"]] = await login(provider["email"], provider["password"])
    TOKENS[admin_data["admin"]["email"]] = await login(admin_data["admin"]["email"], admin_data["admin"]["password"])

    # Create categories
    print("\nCreating categories...")
    category_ids = []
    for category in categories_data["categories"]:
        category_id = await create_category(category, TOKENS[admin_data["admin"]["email"]])
        if category_id:
            category_ids.append(category_id)

    # Create provider profiles and verify them
    print("\nCreating and verifying provider profiles...")
    provider_ids = []
    for i, profile in enumerate(provider_profiles_data["provider_profiles"]):
        provider_id = await create_provider_profile(profile, TOKENS[providers_data["providers"][i]["email"]])
        if provider_id:
            provider_ids.append(provider_id)
            await verify_provider(provider_id, TOKENS[admin_data["admin"]["email"]])

    # Create services
    print("\nCreating services...")
    service_ids = []
    for i, service in enumerate(services_data["services"]):
        # Distribute services among providers
        provider_index = i % len(provider_ids)
        service_id = await create_service(service, TOKENS[providers_data["providers"][provider_index]["email"]])
        if service_id:
            service_ids.append(service_id)

    # Create reviews
    print("\nCreating reviews...")
    for i, review in enumerate(reviews_data["reviews"]):
        # Distribute reviews among customers
        customer_index = i % len(customers_data["customers"])
        await create_review(review, TOKENS[customers_data["customers"][customer_index]["email"]])

    print("\nTest data population completed!")

if __name__ == "__main__":
    asyncio.run(main()) 