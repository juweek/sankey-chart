from typing import Dict, List

def transform_to_sankey(food_data: Dict) -> Dict:
    """
    Transform USDA food data into Sankey diagram format with detailed nutrient breakdown
    """
    nodes = []
    links = []
    node_index = {}
    current_node = 0

    # Initialize nodes
    node_names = [
        "Total", "Water", "Nutr./Mins.", "Protein", "Amino Acids", "Waste",
        "Fat", "Sat.", "Mono", "Poly", "Other Fats", "Fatty Acids", "Glycerol",
        "Carbs", "Sugars", "Fiber", "Starch"
    ]
    
    for name in node_names:
        nodes.append({"node": current_node, "name": name})
        node_index[name] = current_node
        current_node += 1

    # Helper function to find nutrient amount
    def get_nutrient_amount(nutrient_names: List[str]) -> float:
        amount = 0
        for name in nutrient_names:
            for nutrient in food_data.get("foodNutrients", []):
                if nutrient.get("nutrient", {}).get("name", "").lower() in [n.lower() for n in nutrient_names]:
                    amount += nutrient.get("amount", 0)
        return amount

    # Water content
    water = get_nutrient_amount(["Water"])
    if water > 0:
        links.append({"source": node_index["Total"], "target": node_index["Water"], "value": water})

    # Protein breakdown
    protein = get_nutrient_amount(["Protein"])
    if protein > 0:
        links.append({"source": node_index["Total"], "target": node_index["Protein"], "value": protein})
        # Assume 90% of protein is amino acids, 10% is waste
        amino_acids = protein * 0.9
        waste = protein * 0.1
        links.append({"source": node_index["Protein"], "target": node_index["Amino Acids"], "value": amino_acids})
        links.append({"source": node_index["Protein"], "target": node_index["Waste"], "value": waste})

    # Fat breakdown
    fat = get_nutrient_amount(["Total lipid (fat)"])
    if fat > 0:
        links.append({"source": node_index["Total"], "target": node_index["Fat"], "value": fat})
        
        # Fat composition (estimated proportions if not available)
        sat_fat = get_nutrient_amount(["Fatty acids, total saturated"]) or fat * 0.42
        mono_fat = get_nutrient_amount(["Fatty acids, total monounsaturated"]) or fat * 0.45
        poly_fat = get_nutrient_amount(["Fatty acids, total polyunsaturated"]) or fat * 0.07
        other_fat = fat - (sat_fat + mono_fat + poly_fat)
        
        # Add fat breakdown links
        if sat_fat > 0:
            links.append({"source": node_index["Fat"], "target": node_index["Sat."], "value": sat_fat})
            links.append({"source": node_index["Sat."], "target": node_index["Fatty Acids"], "value": sat_fat * 0.95})
            links.append({"source": node_index["Sat."], "target": node_index["Glycerol"], "value": sat_fat * 0.05})
        
        if mono_fat > 0:
            links.append({"source": node_index["Fat"], "target": node_index["Mono"], "value": mono_fat})
            links.append({"source": node_index["Mono"], "target": node_index["Fatty Acids"], "value": mono_fat * 0.95})
            links.append({"source": node_index["Mono"], "target": node_index["Glycerol"], "value": mono_fat * 0.05})
        
        if poly_fat > 0:
            links.append({"source": node_index["Fat"], "target": node_index["Poly"], "value": poly_fat})
            links.append({"source": node_index["Poly"], "target": node_index["Fatty Acids"], "value": poly_fat * 0.95})
            links.append({"source": node_index["Poly"], "target": node_index["Glycerol"], "value": poly_fat * 0.05})
        
        if other_fat > 0:
            links.append({"source": node_index["Fat"], "target": node_index["Other Fats"], "value": other_fat})

    # Carbohydrates breakdown
    carbs = get_nutrient_amount(["Carbohydrate, by difference"])
    if carbs > 0:
        links.append({"source": node_index["Total"], "target": node_index["Carbs"], "value": carbs})
        
        # Carb composition
        sugars = get_nutrient_amount(["Sugars, total including NLEA"]) or carbs * 0.1
        fiber = get_nutrient_amount(["Fiber, total dietary"]) or carbs * 0.05
        starch = carbs - (sugars + fiber)  # Remaining carbs assumed to be starch
        
        if sugars > 0:
            links.append({"source": node_index["Carbs"], "target": node_index["Sugars"], "value": sugars})
        if fiber > 0:
            links.append({"source": node_index["Carbs"], "target": node_index["Fiber"], "value": fiber})
        if starch > 0:
            links.append({"source": node_index["Carbs"], "target": node_index["Starch"], "value": starch})

    # Minerals and micronutrients
    minerals = get_nutrient_amount(["Ash"]) or 2  # Default to 2g if not specified
    if minerals > 0:
        links.append({"source": node_index["Total"], "target": node_index["Nutr./Mins."], "value": minerals})

    return {
        "nodes": nodes,
        "links": links
    }
