import logging
from typing import Dict, Optional
import requests

logger = logging.getLogger(__name__)

BASE_URL = "https://world.openfoodfacts.org/cgi/search.pl"
PAGE_SIZE = 10

def search_foods(query: str, page: int = 1) -> Optional[Dict]:
    """
    Search for foods using the Open Food Facts API with pagination
    
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
        fields = [
            'code', 'product_name', 'brands', 'image_front_url', 'nutriments',
            'serving_size', 'nutriscore_grade', 'nutriscore_score', 'allergens',
            'ingredients_text'
        ]
        
        params = {
            'search_terms': query,
            'json': 1,
            'page': page,
            'page_size': PAGE_SIZE,
            'fields': ','.join(fields),
            'countries_tags': 'en:united-states'
        }
        
        response = requests.get(BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Process results
        results = []
        for product in data.get('products', []):
            if product.get('product_name'):  # Only include products with names
                results.append({
                    'fdcId': product.get('code'),
                    'description': product.get('product_name'),
                    'dataType': 'Open Food Facts',
                    'brandOwner': product.get('brands'),
                    'imageUrl': product.get('image_front_url'),
                    'nutriments': product.get('nutriments', {}),
                    'servingSize': product.get('serving_size'),
                    'nutriscore': product.get('nutriscore_grade'),
                    'allergens': product.get('allergens'),
                })
        
        return {
            'results': results,
            'totalPages': data.get('page_count', 1),
            'currentPage': data.get('page', 1)
        }
    except requests.RequestException as e:
        logger.error(f"Error searching Open Food Facts: {str(e)}")
        return None
