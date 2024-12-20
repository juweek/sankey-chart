import logging
from typing import Dict, Optional
import requests

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

class OpenFoodFactsAPI:
    def __init__(self):
        self.base_url = 'https://world.openfoodfacts.org/cgi/search.pl'
        self.page_size = 10  # Match USDA API pagination
        
    def search_foods(self, query: str, page: int = 1) -> Optional[Dict]:
        """
        Search for foods in OpenFoodFacts API with pagination
        
        Args:
            query: Search term
            page: Page number (1-based)
            
        Returns:
            Dictionary containing:
            - results: List of food items
            - totalPages: Total number of pages
            - currentPage: Current page number
        """
        try:
            fields = "code,product_name,brands,image_front_url,nutriments,ingredients_text"
            url = f"{self.base_url}?search_terms={query}&json=1&page={page}&page_size={self.page_size}&fields={fields}&countries_tags=en:united-states"
            
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            
            # Process results
            results = []
            for product in data.get('products', []):
                if not product.get('product_name'):
                    continue
                    
                results.append({
                    'code': product.get('code', ''),
                    'description': product.get('product_name', ''),
                    'brand': product.get('brands', ''),
                    'image_url': product.get('image_front_url', ''),
                    'ingredients': product.get('ingredients_text', ''),
                    'nutriments': product.get('nutriments', {})
                })
            
            return {
                'results': results,
                'totalPages': data.get('page_count', 1),
                'currentPage': data.get('page', 1)
            }
            
        except requests.RequestException as e:
            logger.error(f"Error searching OpenFoodFacts: {str(e)}")
            return None
            
    def get_food_data(self, code: str) -> Optional[Dict]:
        """
        Get detailed food data from OpenFoodFacts API
        """
        try:
            url = f"https://world.openfoodfacts.org/api/v0/product/{code}.json"
            response = requests.get(url)
            response.raise_for_status()
            
            data = response.json()
            if data.get('status') != 1:
                return None
                
            product = data.get('product', {})
            return {
                'code': product.get('code', ''),
                'name': product.get('product_name', ''),
                'brand': product.get('brands', ''),
                'image_url': product.get('image_front_url', ''),
                'ingredients': product.get('ingredients_text', ''),
                'nutriments': product.get('nutriments', {})
            }
            
        except requests.RequestException as e:
            logger.error(f"Error fetching OpenFoodFacts data: {str(e)}")
            return None
