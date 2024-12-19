import os
import logging
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
        query = request.args.get('q', '')
        if not query:
            return jsonify({"error": "Query parameter 'q' is required"}), 400
            
        results = search_foods(query)
        if results is None:
            return jsonify({"error": "Failed to search foods"}), 500
            
        return jsonify({"results": results})
    except Exception as e:
        logger.error(f"Error searching foods: {str(e)}")
        return jsonify({"error": "Failed to search foods"}), 500

@app.route('/api/food/<food_id>')
def get_food_nutrients(food_id):
    try:
        # Fetch data from USDA API
        food_data = get_food_data(food_id)
        if not food_data:
            return jsonify({"error": "Food not found"}), 404
        
        # Transform data for Sankey diagram
        sankey_data = transform_to_sankey(food_data)
        return jsonify(sankey_data)
    except Exception as e:
        logger.error(f"Error processing food data: {str(e)}")
        return jsonify({"error": "Failed to process food data"}), 500
