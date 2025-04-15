import json
import asyncio
import aiohttp
import os
from typing import Dict, Any, List
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
BASE_URL = "http://backend:8000"  # Using service name in Docker network
MAX_RETRIES = 3
RETRY_DELAY = 1  # seconds
BACKEND_WAIT_TIMEOUT = 60  # seconds

class DataPopulator:
    def __init__(self):
        self.tokens = {}
        self.category_ids = {}
        self.provider_ids = {}
        self.service_ids = []

    async def load_data_files(self):
        """Load all JSON data files."""
        data_dir = os.path.join(os.path.dirname(__file__))
        
        try:
            # Load admin data
            with open(os.path.join(data_dir, "users/admin.json")) as f:
                self.admin_data = json.load(f)["admin"]
            
            # Load customer data
            with open(os.path.join(data_dir, "users/customers.json")) as f:
                self.customers = json.load(f)["customers"]
            
            # Load provider data
            with open(os.path.join(data_dir, "providers/provider_profiles.json")) as f:
                provider_profiles = json.load(f)["provider_profiles"]
                self.providers = [
                    {
                        "email": f"{profile['business_name'].lower().replace(' ', '')}@provider.com",
                        "password": "provider123",
                        "first_name": profile["business_name"].split()[0],
                        "last_name": profile["business_name"].split()[-1],
                        "role": "provider",
                        "profile": profile
                    }
                    for profile in provider_profiles
                ]
            
            # Load category data
            with open(os.path.join(data_dir, "categories/service_categories.json")) as f:
                self.categories = json.load(f)["categories"]
            
            # Load service data
            with open(os.path.join(data_dir, "services/services.json")) as f:
                self.services = json.load(f)["services"]
            
            # Load review data
            with open(os.path.join(data_dir, "reviews/reviews.json")) as f:
                self.reviews = json.load(f)["reviews"]
            
            logger.info("Successfully loaded all data files")
            logger.info(f"Loaded: {len(self.categories)} categories, {len(self.providers)} providers, {len(self.services)} services, {len(self.reviews)} reviews")
            return True
        
        except Exception as e:
            logger.error(f"Failed to load data files: {str(e)}")
            return False

    async def wait_for_backend(self):
        """Wait for the backend to be ready."""
        logger.info("Waiting for backend to be ready...")
        start_time = time.time()
        
        while time.time() - start_time < BACKEND_WAIT_TIMEOUT:
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(f"{BASE_URL}/health") as response:
                        if response.status == 200:
                            logger.info("Backend is ready!")
                            return True
            except Exception:
                pass
            
            await asyncio.sleep(1)
        
        logger.error("Backend did not become ready in time")
        return False

    async def make_request(self, method, url, **kwargs):
        """Generic request handler with retries."""
        for attempt in range(MAX_RETRIES):
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.request(method, url, **kwargs) as response:
                        if response.status in (200, 201):
                            return await response.json()
                        elif response.status == 400:
                            error_data = await response.json()
                            if "already exists" in error_data.get("detail", ""):
                                logger.warning(f"Resource already exists: {url}")
                                return None
                        logger.warning(f"Request failed (attempt {attempt + 1}): {response.status} - {await response.text()}")
            except Exception as e:
                logger.warning(f"Request error (attempt {attempt + 1}): {str(e)}")
            
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_DELAY)
        
        return None

    async def register_user(self, user_data: Dict[str, Any]) -> bool:
        """Register a new user."""
        url = f"{BASE_URL}/auth/register"
        response = await self.make_request("POST", url, json=user_data)
        if response is not None:
            logger.info(f"Registered user: {user_data['email']}")
            return True
        return False

    async def login(self, email: str, password: str) -> str:
        """Login and return the access token."""
        url = f"{BASE_URL}/auth/login"
        data = {"username": email, "password": password}
        response = await self.make_request("POST", url, json=data)
        if response:
            logger.info(f"Logged in user: {email}")
            return response["access_token"]
        return None

    async def create_category(self, category_data: Dict[str, Any], token: str) -> int:
        """Create a service category and return its ID."""
        url = f"{BASE_URL}/providers/categories"
        headers = {"Authorization": f"Bearer {token}"}
        response = await self.make_request("POST", url, headers=headers, json=category_data)
        if response:
            logger.info(f"Created category: {category_data['name']} (ID: {response['category_id']})")
            return response["category_id"]
        return None

    async def create_provider_profile(self, profile_data: Dict[str, Any], token: str) -> int:
        """Create a provider profile and return its ID."""
        url = f"{BASE_URL}/providers/"
        headers = {"Authorization": f"Bearer {token}"}
        response = await self.make_request("POST", url, headers=headers, json=profile_data)
        if response:
            logger.info(f"Created provider profile: {profile_data['business_name']} (ID: {response['provider_id']})")
            return response["provider_id"]
        return None

    async def verify_provider(self, provider_id: int, token: str) -> bool:
        """Verify a provider profile."""
        url = f"{BASE_URL}/providers/{provider_id}/verify"
        headers = {"Authorization": f"Bearer {token}"}
        response = await self.make_request("PATCH", url, headers=headers, json={"is_verified": True})
        if response:
            logger.info(f"Verified provider: {provider_id}")
            return True
        return False

    async def create_service(self, service_data: Dict[str, Any], token: str) -> int:
        """Create a service and return its ID."""
        url = f"{BASE_URL}/services/"
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get category_id from category_name
        category_name = service_data.get("category_name")
        if not category_name:
            logger.error(f"Missing category_name in service data: {service_data}")
            return None
            
        category_id = self.category_ids.get(category_name)
        if not category_id:
            logger.error(f"Category not found: {category_name}")
            return None
        
        # Transform service data to match API expectations
        payload = {
            "name": service_data["name"],
            "description": service_data["description"],
            "price_range": service_data["price_range"],
            "duration_minutes": service_data["duration_minutes"],
            "category_id": category_id
        }
        
        response = await self.make_request("POST", url, headers=headers, json=payload)
        if response:
            logger.info(f"Created service: {service_data['name']}")
            return response["service_id"]
        return None

    async def get_all_services(self, token: str) -> List[Dict]:
        """Get all services for the current provider."""
        url = f"{BASE_URL}/services/me"
        headers = {"Authorization": f"Bearer {token}"}
        response = await self.make_request("GET", url, headers=headers)
        return response if response else []

    async def create_review(self, review_data: Dict[str, Any], token: str) -> bool:
        """Create a review."""
        url = f"{BASE_URL}/reviews"
        headers = {"Authorization": f"Bearer {token}"}
        response = await self.make_request("POST", url, headers=headers, json=review_data)
        if response:
            logger.info(f"Created review for service: {review_data['service_id']}")
            return True
        return False

    async def populate_data(self):
        """Main method to populate all test data."""
        if not await self.wait_for_backend():
            return False

        if not await self.load_data_files():
            return False

        # Register and login admin
        if not await self.register_user(self.admin_data):
            logger.error("Failed to register admin user")
            return False
        
        admin_token = await self.login(self.admin_data["email"], self.admin_data["password"])
        if not admin_token:
            logger.error("Failed to login as admin")
            return False
        self.tokens["admin"] = admin_token

        # Create categories
        for category in self.categories:
            category_id = await self.create_category(category, admin_token)
            if category_id:
                self.category_ids[category["name"]] = category_id
        
        if not self.category_ids:
            logger.error("No categories created")
            return False

        # Register and login providers
        for provider in self.providers:
            if not await self.register_user(provider):
                continue
            
            token = await self.login(provider["email"], provider["password"])
            if not token:
                continue
            
            self.tokens[provider["email"]] = token
            
            # Create provider profile
            provider_id = await self.create_provider_profile(provider["profile"], token)
            if not provider_id:
                continue
            
            self.provider_ids[provider["email"]] = provider_id
            
            # Verify provider
            await self.verify_provider(provider_id, admin_token)

        if not self.provider_ids:
            logger.error("No providers available for service creation")
            return False

        # Create services - distribute among providers
        provider_emails = list(self.provider_ids.keys())
        for i, service in enumerate(self.services):
            provider_email = provider_emails[i % len(provider_emails)]
            token = self.tokens.get(provider_email)
            
            if token:
                # Map category name to ID
                category_name = service.get("category_name")
                if category_name and category_name in self.category_ids:
                    service["category_id"] = self.category_ids[category_name]
                    service_id = await self.create_service(service, token)
                    if service_id:
                        self.service_ids.append(service_id)
                else:
                    logger.warning(f"Skipping service {service['name']} - invalid category: {category_name}")

        if not self.service_ids:
            logger.error("No services created")
            return False

        # Register and login customers
        for customer in self.customers:
            if not await self.register_user(customer):
                continue
            
            token = await self.login(customer["email"], customer["password"])
            if token:
                self.tokens[customer["email"]] = token

        # Create reviews - distribute among services and customers
        customer_emails = [email for email in self.tokens.keys() if email.endswith("@example.com")]
        if customer_emails and self.service_ids:
            # Create a mapping of service IDs to customer emails to ensure each service gets reviewed by different customers
            service_customer_map = {}
            for service_id in self.service_ids:
                # Assign a unique customer to each service
                customer_email = customer_emails[len(service_customer_map) % len(customer_emails)]
                service_customer_map[service_id] = customer_email

            # Create reviews using the mapping
            for i, (service_id, customer_email) in enumerate(service_customer_map.items()):
                token = self.tokens.get(customer_email)
                if token:
                    # Get a unique review for each service
                    review = self.reviews[i % len(self.reviews)]
                    review["service_id"] = service_id
                    await self.create_review(review, token)

        logger.info("Test data population completed successfully!")
        return True

async def main():
    """Entry point for the script."""
    populator = DataPopulator()
    try:
        success = await populator.populate_data()
        if not success:
            logger.error("Test data population failed")
            exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        exit(1)

if __name__ == "__main__":
    import time
    asyncio.run(main()) 