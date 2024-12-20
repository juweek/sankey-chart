import logging
import os
from flask import Flask, render_template, jsonify, request
from utils.usda_api import get_food_data, search_foods
from utils.data_transformer import transform_to_sankey
from utils.openfoodfacts_api import OpenFoodFactsAPI

off_api = OpenFoodFactsAPI()

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/search')
def search_food():
    try:
        query = request.args.get('q', '')
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('pageSize', 10))
        
        if not query:
            return jsonify({"error": "Query parameter 'q' is required"}), 400
            
        search_result = search_foods(query, page_size=page_size, page=page)
        if search_result is None:
            return jsonify({"error": "Failed to search foods"}), 500
            
        return jsonify(search_result)
    except Exception as e:
        logger.error(f"Error searching foods: {str(e)}")
        return jsonify({"error": "Failed to search foods"}), 500

@app.route('/api/food/<food_id>')
def get_food_details(food_id):
    try:
        food_data = get_food_data(food_id)
        if not food_data:
            return jsonify({"error": "Food not found"}), 404
            
        sankey_data = transform_to_sankey(food_data)
        return jsonify(sankey_data)
    except Exception as e:
        logger.error(f"Error processing food data: {str(e)}")
        return jsonify({"error": "Failed to process food data"}), 500

@app.route('/api/off/search')
def search_off_food():
    try:
        query = request.args.get('q', '')
        page = int(request.args.get('page', 1))
        
        if not query:
            return jsonify({"error": "Query parameter 'q' is required"}), 400
            
        search_result = off_api.search_foods(query, page=page)
        if search_result is None:
            return jsonify({"error": "Failed to search foods"}), 500
            
        return jsonify(search_result)
    except Exception as e:
        logger.error(f"Error searching OpenFoodFacts: {str(e)}")
        return jsonify({"error": "Failed to search foods"}), 500

@app.route('/api/off/food/<code>')
def get_off_food_data(code):
    try:
        food_data = off_api.get_food_data(code)
        if not food_data:
            return jsonify({"error": "Food not found"}), 404
        
        return jsonify(food_data)
    except Exception as e:
        logger.error(f"Error fetching OpenFoodFacts data: {str(e)}")
        return jsonify({"error": "Failed to fetch food data"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
