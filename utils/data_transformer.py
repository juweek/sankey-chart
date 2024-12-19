from typing import Dict, List

def transform_to_sankey(food_data: Dict) -> Dict:
    """
    Transform USDA food data into Sankey diagram format
    """
    nodes = []
    links = []
    node_index = {}
    
    # Add total as first node
    nodes.append({"node": 0, "name": "Total"})
    node_index["Total"] = 0
    
    # Main nutrient categories
    categories = {
        "Water": ["Water"],
        "Protein": ["Protein"],
        "Fat": ["Total lipid (fat)"],
        "Carbs": ["Carbohydrate, by difference"],
        "Minerals": ["Minerals"]
    }
    
    current_node = 1
    total_weight = 100  # Assume 100g serving
    
    # Process each nutrient category
    for category, nutrients in categories.items():
        amount = 0
        for nutrient in nutrients:
            for food_nutrient in food_data.get("foodNutrients", []):
                if food_nutrient.get("nutrient", {}).get("name") == nutrient:
                    amount = food_nutrient.get("amount", 0)
                    break
        
        if amount > 0:
            nodes.append({"node": current_node, "name": category})
            node_index[category] = current_node
            links.append({
                "source": node_index["Total"],
                "target": current_node,
                "value": amount
            })
            current_node += 1
    
    return {
        "nodes": nodes,
        "links": links
    }
