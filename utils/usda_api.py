import os
import requests
import logging
from typing import Dict, Optional, List

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

# USDA FoodData API base URL
BASE_URL = "https://api.nal.usda.gov/fdc/v1"
API_KEY = os.environ.get("USDA_API_KEY", "DEMO_KEY")

def search_foods(query: str, page_size: int = 10, page: int = 1) -> Optional[Dict]:
    """
    Search for foods in USDA FoodData API with pagination support
    
    Args:
        query: Search term
        page_size: Number of results per page
        page: Page number (1-based)
        
    Returns:
        Dictionary containing:
        - results: List of food items
        - totalPages: Total number of pages
        - currentPage: Current page number
    """
    try:
        url = f"{BASE_URL}/foods/search"
        params = {
            "api_key": API_KEY,
            "query": query,
            "pageSize": page_size,
            "pageNumber": page,
            "dataType": ["Survey (FNDDS)", "SR Legacy", "Branded"]  # Include branded foods
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        total_hits = data.get("totalHits", 0)
        total_pages = (total_hits + page_size - 1) // page_size
        
        return {
            "results": [
                {
                    "fdcId": food["fdcId"],
                    "description": food["description"],
                    "dataType": food.get("dataType", ""),
                    "brandOwner": food.get("brandOwner", "")
                }
                for food in data.get("foods", [])
            ],
            "totalPages": total_pages,
            "currentPage": page
        }
    except requests.RequestException as e:
        logger.error(f"Error searching foods: {str(e)}")
        return None

def get_food_data(food_id: str) -> Optional[Dict]:
    """
    Fetch food data from USDA FoodData API
    """
    try:
        url = f"{BASE_URL}/food/{food_id}"
        params = {
            "api_key": API_KEY,
            "format": "full"
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        return response.json()
    except requests.RequestException as e:
        logger.error(f"Error fetching food data: {str(e)}")
        return None
