import os
import logging
import time
import uuid
from flask import Flask, render_template, jsonify, request
from utils.usda_api import get_food_data, search_foods
from utils.data_transformer import transform_to_sankey

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "development_key")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/search')
def search_food():
    try:
        request_id = uuid.uuid4().hex
        query = request.args.get('q', '')
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('pageSize', 10))
        logger.info(f"[{request_id}] /api/search start query='{query}' page={page} pageSize={page_size}")
        
        if not query:
            return jsonify({"error": "Query parameter 'q' is required", "requestId": request_id}), 400
            
        t0 = time.time()
        search_result = search_foods(query, page_size=page_size, page=page, request_id=request_id)
        elapsed = (time.time() - t0) * 1000.0
        if isinstance(search_result, dict) and "error" in search_result:
            # Propagate upstream error status if available
            status = search_result.get("status", 502)
            logger.warning(f"[{request_id}] /api/search error status={status} elapsedMs={elapsed:.1f} msg={search_result.get('error')}")
            body = dict(search_result)
            body.setdefault("requestId", request_id)
            return jsonify(body), status
            
        logger.info(f"[{request_id}] /api/search success results={len(search_result.get('results', []))} totalPages={search_result.get('totalPages')} elapsedMs={elapsed:.1f}")
        return jsonify(search_result)
    except Exception as e:
        request_id = request.headers.get("X-Request-Id") or uuid.uuid4().hex
        logger.error(f"[{request_id}] Error searching foods: {str(e)}")
        return jsonify({"error": "Failed to search foods", "requestId": request_id}), 500

@app.route('/api/food/<food_id>')
def get_food_nutrients(food_id):
    try:
        request_id = uuid.uuid4().hex
        logger.info(f"[{request_id}] /api/food start id={food_id}")
        # Fetch data from USDA API
        t0 = time.time()
        food_data = get_food_data(food_id, request_id=request_id)
        elapsed = (time.time() - t0) * 1000.0
        if isinstance(food_data, dict) and "error" in food_data:
            status = food_data.get("status", 502)
            # Map a 404 from upstream to 404
            logger.warning(f"[{request_id}] /api/food error id={food_id} status={status} elapsedMs={elapsed:.1f} msg={food_data.get('error')}")
            body = dict(food_data)
            body.setdefault("requestId", request_id)
            return jsonify(body), status if status in (404, 429, 500, 502, 503) else 502
        
        # Transform data for Sankey diagram
        sankey_data = transform_to_sankey(food_data)
        logger.info(f"[{request_id}] /api/food success id={food_id} nodes={len(sankey_data.get('nodes', []))} links={len(sankey_data.get('links', []))} elapsedMs={elapsed:.1f}")
        return jsonify(sankey_data)
    except Exception as e:
        request_id = uuid.uuid4().hex
        logger.error(f"[{request_id}] Error processing food data: {str(e)}")
        return jsonify({"error": "Failed to process food data", "requestId": request_id}), 500
