from typing import Dict, List

def transform_to_sankey(food_data: Dict, reverse_hierarchy: bool = False) -> Dict:
    """
    Transform USDA food data into Sankey diagram format with detailed nutrient breakdown
    
    Args:
        food_data: USDA food data dictionary
        reverse_hierarchy: If True, flow goes from subtypes → macros (detail first, aggregate at end)
                          If False (default), flow goes from macros → subtypes (aggregate first)
    """
    nodes = []
    links = []
    node_index = {}
    current_node = 0

    # Initialize nodes (Amino Acids removed - it's 1:1 with Protein)
    node_names = [
        "Total", "Water", "Minerals", "Protein",
        "Fat", "Sat.", "Mono", "Poly", "Trans", "Other Fats", "Fatty Acids",
        "Carbs", "Sugars", "Fiber", "Starch"
    ]
    
    for name in node_names:
        nodes.append({"node": current_node, "name": name})
        node_index[name] = current_node
        current_node += 1

    # Helper function to find nutrient amount
    def get_nutrient_amount(nutrient_names: List[str]) -> float:
        """
        Sum the amount for any nutrient whose name matches one of the provided aliases.
        Avoid double-counting by scanning the nutrient list once and matching against a set.
        """
        aliases = {n.lower() for n in nutrient_names}
        amount = 0.0
        for nutrient in food_data.get("foodNutrients", []):
            name = nutrient.get("nutrient", {}).get("name", "").lower()
            if name in aliases:
                amount += nutrient.get("amount", 0) or 0.0
        return amount

    # Helper to add link (respects reverse_hierarchy by swapping source/target)
    def add_link(source_name: str, target_name: str, value: float):
        if value > 0:
            if reverse_hierarchy:
                links.append({"source": node_index[target_name], "target": node_index[source_name], "value": value})
            else:
                links.append({"source": node_index[source_name], "target": node_index[target_name], "value": value})

    # Get all nutrient values
    water = get_nutrient_amount(["Water"])
    protein = get_nutrient_amount(["Protein"])
    fat = get_nutrient_amount(["Total lipid (fat)"])
    carbs = get_nutrient_amount(["Carbohydrate, by difference"])
    
    # Minerals/Ash - if not available, calculate as remainder of 100g
    ash_value = get_nutrient_amount(["Ash"])
    if ash_value > 0:
        minerals = ash_value
    else:
        # Calculate as remainder: 100 - (water + protein + fat + carbs)
        total_macros = water + protein + fat + carbs
        minerals = max(0, 100 - total_macros) if total_macros < 100 else 0

    # Fat subtypes
    sat_fat = get_nutrient_amount(["Fatty acids, total saturated"]) or (fat * 0.42 if fat > 0 else 0)
    mono_fat = get_nutrient_amount(["Fatty acids, total monounsaturated"]) or (fat * 0.45 if fat > 0 else 0)
    poly_fat = get_nutrient_amount(["Fatty acids, total polyunsaturated"]) or (fat * 0.07 if fat > 0 else 0)
    trans_fat = get_nutrient_amount(["Fatty acids, total trans", "Trans fat", "Trans fatty acids"])
    other_fat = fat - (sat_fat + mono_fat + poly_fat + trans_fat) if fat > 0 else 0

    # Carb subtypes
    sugars = get_nutrient_amount([
        "Sugars, total including NLEA",
        "Sugars, total",
        "Total Sugars",
        "Sugars, total NLEA"
    ]) or (carbs * 0.1 if carbs > 0 else 0)
    fiber = get_nutrient_amount([
        "Fiber, total dietary",
        "Dietary fiber, total",
        "Dietary Fiber"
    ]) or (carbs * 0.05 if carbs > 0 else 0)
    starch = carbs - (sugars + fiber) if carbs > 0 else 0

    if reverse_hierarchy:
        # Reverse hierarchy: Total → subtypes → macros
        # Total feeds directly into the most detailed level
        
        # Water stays simple (no subtypes)
        add_link("Total", "Water", water)
        
        # Minerals stays simple
        add_link("Total", "Minerals", minerals)
        
        # Protein goes directly to Total (no Amino Acids layer)
        add_link("Total", "Protein", protein)
        
        # Fat: Total → Fatty Acids → (Sat/Mono/Poly/Trans) → Fat
        # Also Total → Other Fats → Fat
        fatty_acids_total = sat_fat + mono_fat + poly_fat + trans_fat
        add_link("Total", "Fatty Acids", fatty_acids_total)
        add_link("Total", "Other Fats", other_fat)
        
        add_link("Fatty Acids", "Sat.", sat_fat)
        add_link("Fatty Acids", "Mono", mono_fat)
        add_link("Fatty Acids", "Poly", poly_fat)
        add_link("Fatty Acids", "Trans", trans_fat)
        
        add_link("Sat.", "Fat", sat_fat)
        add_link("Mono", "Fat", mono_fat)
        add_link("Poly", "Fat", poly_fat)
        add_link("Trans", "Fat", trans_fat)
        add_link("Other Fats", "Fat", other_fat)
        
        # Carbs: Total → (Sugars/Fiber/Starch) → Carbs
        add_link("Total", "Sugars", sugars)
        add_link("Total", "Fiber", fiber)
        add_link("Total", "Starch", starch)
        
        add_link("Sugars", "Carbs", sugars)
        add_link("Fiber", "Carbs", fiber)
        add_link("Starch", "Carbs", starch)
        
    else:
        # Normal hierarchy: Total → macros → subtypes
        
        # Water content
        add_link("Total", "Water", water)

        # Protein (terminal node - no Amino Acids layer)
        add_link("Total", "Protein", protein)

        # Fat breakdown
        add_link("Total", "Fat", fat)
        add_link("Fat", "Sat.", sat_fat)
        add_link("Sat.", "Fatty Acids", sat_fat)
        add_link("Fat", "Mono", mono_fat)
        add_link("Mono", "Fatty Acids", mono_fat)
        add_link("Fat", "Poly", poly_fat)
        add_link("Poly", "Fatty Acids", poly_fat)
        add_link("Fat", "Trans", trans_fat)
        add_link("Trans", "Fatty Acids", trans_fat)
        add_link("Fat", "Other Fats", other_fat)

        # Carbohydrates breakdown
        add_link("Total", "Carbs", carbs)
        add_link("Carbs", "Sugars", sugars)
        add_link("Carbs", "Fiber", fiber)
        add_link("Carbs", "Starch", starch)

        # Minerals
        add_link("Total", "Minerals", minerals)

    return {
        "nodes": nodes,
        "links": links
    }
