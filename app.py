import os
import logging
from flask import Flask, render_template, jsonify
from utils.usda_api import get_food_data
from utils.data_transformer import transform_to_sankey

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "development_key")

@app.route('/')
def index():
    return render_template('index.html')

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
