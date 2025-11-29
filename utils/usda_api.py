import os
import requests
import logging
from typing import Dict, Optional, List
import time

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

# USDA FoodData API base URL
BASE_URL = "https://api.nal.usda.gov/fdc/v1"
API_KEY = os.environ.get("USDA_API_KEY", "DEMO_KEY")
TIMEOUT_SECONDS = 10
MAX_RETRIES = 3
RETRY_STATUSES = {429, 500, 502, 503}

def _mask_api_key(params: Dict) -> Dict:
    safe = dict(params or {})
    if "api_key" in safe and isinstance(safe["api_key"], str):
        key = safe["api_key"]
        safe["api_key"] = f"***{key[-4:]}" if len(key) >= 4 else "***"
    return safe

def _request_with_retries(
    method: str,
    url: str,
    *,
    params: Dict,
    allow_404_retry: bool = False,
    request_id: Optional[str] = None,
) -> requests.Response:
    """
    Perform an HTTP request with limited retries for transient errors.
    Optionally retry once on 404 when allow_404_retry is True.
    """
    backoff_seconds = 0.3
    last_exc: Optional[Exception] = None
    safe_params = _mask_api_key(params)
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            t0 = time.time()
            response = requests.request(method, url, params=params, timeout=TIMEOUT_SECONDS)
            elapsed = (time.time() - t0) * 1000.0
            # Retry on certain HTTP statuses
            if response.status_code in RETRY_STATUSES or (allow_404_retry and response.status_code == 404 and attempt == 1):
                logger.warning(
                    f"[{request_id}] Transient HTTP {response.status_code} for {url} params={safe_params} "
                    f"(attempt {attempt}, {elapsed:.1f}ms); retrying in {backoff_seconds:.1f}s..."
                )
                time.sleep(backoff_seconds)
                backoff_seconds *= 2
                continue
            logger.debug(
                f"[{request_id}] HTTP {response.status_code} for {url} params={safe_params} "
                f"(attempt {attempt}, {elapsed:.1f}ms)"
            )
            return response
        except requests.RequestException as e:
            last_exc = e
            logger.warning(
                f"[{request_id}] Network error for {url} params={safe_params} "
                f"(attempt {attempt}): {str(e)}; retrying in {backoff_seconds:.1f}s..."
            )
            time.sleep(backoff_seconds)
            backoff_seconds *= 2
    # If we get here, either we exhausted retries or had persistent error
    if last_exc:
        raise last_exc
    # No exception but never returned a response (should not happen)
    raise requests.RequestException(f"Failed to get a successful response after {MAX_RETRIES} attempts for {url}")

def search_foods(query: str, page_size: int = 10, page: int = 1, *, request_id: Optional[str] = None, data_types: Optional[List[str]] = None) -> Dict:
    """
    Search for foods in USDA FoodData API with pagination support
    
    Args:
        query: Search term
        page_size: Number of results per page
        page: Page number (1-based)
        data_types: List of USDA data types to include (e.g., ["Branded", "SR Legacy", "Survey (FNDDS)", "Foundation"])
        
    Returns:
        On success, a dictionary containing:
          - results: List of food items
          - totalPages: Total number of pages
          - currentPage: Current page number
        On failure, a dictionary containing:
          - error: error message
          - status: upstream HTTP status code (if available)
    """
    try:
        url = f"{BASE_URL}/foods/search"
        # Default data types if none specified
        if not data_types:
            data_types = ["Survey (FNDDS)", "SR Legacy", "Branded", "Foundation"]
        params = {
            "api_key": API_KEY,
            "query": query,
            "pageSize": page_size,
            "pageNumber": page,
            "dataType": data_types
        }
        
        response = _request_with_retries("GET", url, params=params, allow_404_retry=True, request_id=request_id)
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
    except requests.HTTPError as e:
        status_code = e.response.status_code if e.response is not None else 0
        text = ""
        try:
            text = e.response.text if e.response is not None else ""
        except Exception:
            text = ""
        logger.error(f"[{request_id}] HTTP error searching foods (status={status_code}): {str(e)}; body={text}")
        return {"error": f"USDA search failed with status {status_code}", "status": status_code, "requestId": request_id}
    except requests.RequestException as e:
        logger.error(f"[{request_id}] Network error searching foods: {str(e)}")
        return {"error": "Network error contacting USDA API", "status": 0, "requestId": request_id}

def get_food_data(food_id: str, *, request_id: Optional[str] = None) -> Dict:
    """
    Fetch food data from USDA FoodData API
    """
    try:
        url = f"{BASE_URL}/food/{food_id}"
        params = {
            "api_key": API_KEY,
            "format": "full"
        }
        
        # Allow a single retry on 404 because USDA sometimes transiently returns 404
        response = _request_with_retries("GET", url, params=params, allow_404_retry=True, request_id=request_id)
        response.raise_for_status()
        
        return response.json()
    except requests.HTTPError as e:
        status_code = e.response.status_code if e.response is not None else 0
        text = ""
        try:
            text = e.response.text if e.response is not None else ""
        except Exception:
            text = ""
        logger.error(f"[{request_id}] HTTP error fetching food data id={food_id} (status={status_code}): {str(e)}; body={text}")
        return {"error": f"USDA food {food_id} failed with status {status_code}", "status": status_code, "requestId": request_id}
    except requests.RequestException as e:
        logger.error(f"[{request_id}] Network error fetching food data id={food_id}: {str(e)}")
        return {"error": "Network error contacting USDA API", "status": 0, "requestId": request_id}
