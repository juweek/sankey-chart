import os
import requests
import logging
from typing import Dict, Optional, List

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

# USDA FoodData API base URL
BASE_URL = "https://api.nal.usda.gov/fdc/v1"
API_KEY = os.environ.get("USDA_API_KEY", "DEMO_KEY")

def search_foods(query: str, page_size: int = 10) -> Optional[List[Dict]]:
    """
    Search for foods in USDA FoodData API
    """
    try:
        url = f"{BASE_URL}/foods/search"
        params = {
            "api_key": API_KEY,
            "query": query,
            "pageSize": page_size,
            "dataType": ["Survey (FNDDS)", "SR Legacy"]  # Focus on standard reference data
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        return [
            {
                "fdcId": food["fdcId"],
                "description": food["description"],
                "dataType": food.get("dataType", ""),
                "brandOwner": food.get("brandOwner", "")
            }
            for food in data.get("foods", [])
        ]
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
