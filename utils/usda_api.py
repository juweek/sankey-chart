import os
import requests
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

# USDA FoodData API base URL
BASE_URL = "https://api.nal.usda.gov/fdc/v1"
API_KEY = os.environ.get("USDA_API_KEY", "DEMO_KEY")

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
