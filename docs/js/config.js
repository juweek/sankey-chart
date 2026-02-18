/* ========================================================================
 * CENTRALIZED CONFIGURATION
 * Contains all shared configuration constants used across visualization modules
 * Includes: API settings, color schemes, DRV profiles, dimension settings
 * ======================================================================== */

/* ========================================================================
 * API CONFIGURATION
 * Base URL for API endpoints - change this to your Cloudflare Worker URL after deployment
 * For local development with Flask, use: const API_BASE_URL = "";
 * ======================================================================== */
const API_BASE_URL = "https://sankey-usda-proxy.gourmetdata.workers.dev";


/* ========================================================================
 * COLOR SCHEMES
 * Centralized color definitions for all visualizations
 * ======================================================================== */

/* ========================================================================
 * SANKEY NODE COLORS
 * Colors for nodes in the Sankey diagram
 * ======================================================================== */
const SANKEY_NODE_COLORS = {
    "Total": "#4A5568",
    "Water": "#658394",
    "Protein": "#54886A",
    "Fat": "#B22222",
    "Sat.": "#B22222",
    "Mono": "#B22222",
    "Poly": "#B22222",
    "Trans": "#8B0000",
    "Other Fats": "#B22222",
    "Carbs": "#CC9A2E",
    "Sugars": "#CC9A2E",
    "Fiber": "#CC9A2E",
    "Starch": "#CC9A2E",
    "Sodium": "#8B5FCF",
    "Minerals": "#9370DB"
};

/* ========================================================================
 * SANKEY NODE TEXT COLORS
 * Text label colors for Sankey nodes
 * ======================================================================== */
const SANKEY_NODE_TEXT_COLORS = {
    "Total": "#4A5568",
    "Water": "#4781A3",
    "Protein": "#419162",
    "Fat": "#B12424",
    "Sat.": "#B12424",
    "Mono": "#B12424",
    "Poly": "#B12424",
    "Trans": "#B12424",
    "Other Fats": "#B12424",
    "Carbs": "#9C7522",
    "Sugars": "#9C7522",
    "Fiber": "#9C7522",
    "Starch": "#9C7522",
    "Sodium": "#5D39A7",
    "Minerals": "#5D39A7"
};

/* ========================================================================
 * SANKEY LINK COLORS
 * Colors for connections between nodes in the Sankey diagram
 * ======================================================================== */
const SANKEY_LINK_COLORS = {
    "Total-Water": "#658394",
    "Total-Protein": "#67B080",
    "Total-Carbs": "#CC9A2E",
    "Total-Sodium": "#8B5FCF",
    "Total-Minerals": "#9370DB",
    "Total-Fat": "#B22222",
    "Sat.-Fat": "#B22222",
    "Mono-Fat": "#B22222",
    "Poly-Fat": "#B22222",
    "Trans-Fat": "#8B0000",
    "Other Fats-Fat": "#B22222",
    "Total-Sat.": "#B22222",
    "Total-Mono": "#B22222",
    "Total-Poly": "#B22222",
    "Total-Trans": "#8B0000",
    "Total-Other Fats": "#B22222",
    "Carbs-Starch": "#CC9A2E",
    "Carbs-Sugars": "#CC9A2E",
    "Carbs-Fiber": "#CC9A2E",
    "Total-Sugars": "#CC9A2E",
    "Total-Fiber": "#CC9A2E",
    "Total-Starch": "#CC9A2E",
    "Fat-Sat.": "#B22222",
    "Fat-Mono": "#B22222",
    "Fat-Poly": "#B22222",
    "Fat-Trans": "#8B0000",
    "Fat-Other Fats": "#B22222"
};

/* ========================================================================
 * TREEMAP COLORS
 * Color palette for treemap visualizations including nutrients and vitamins
 * ======================================================================== */
const TREEMAP_COLORS = {
    // Macronutrients
    "Water": "#658394",
    "Protein": "#54886A",
    "Total Protein": "#54886A",
    "Fat": "#B22222",
    "Sat.": "#B22222",
    "Mono": "#C94444",
    "Poly": "#D46666",
    "Trans": "#8B0000",
    "Other Fats": "#E08888",
    "Carbs": "#CC9A2E",
    "Sugars": "#E6B84D",
    "Fiber": "#A67C1A",
    "Starch": "#BF8E26",
    "Minerals": "#9370DB",
    "Sodium": "#8B5FCF",

    // Essential amino acids (bright greens - 9 total)
    "Histidine": "#2E7D32",
    "Isoleucine": "#388E3C",
    "Leucine": "#43A047",
    "Lysine": "#4CAF50",
    "Methionine": "#558B2F",
    "Phenylalanine": "#66BB6A",
    "Threonine": "#7CB342",
    "Tryptophan": "#8BC34A",
    "Valine": "#9CCC65",

    // Conditionally essential (teals)
    "Arginine": "#00897B",
    "Cystine": "#00796B",
    "Tyrosine": "#00ACC1",
    "Glycine": "#26A69A",
    "Proline": "#4DB6AC",

    // Non-essential amino acids (blue-greens)
    "Alanine": "#0097A7",
    "Aspartic acid": "#00838F",
    "Glutamic acid": "#006064",
    "Serine": "#4DD0E1",

    // Minerals - All purples
    "Hydration & Nerves": "#7B68EE",
    "Bones & Structure": "#9370DB",
    "Energy & Circulation": "#8B5FCF",
    "Growth & Defense": "#6A5ACD",
    "Potassium": "#9370DB",
    "Chloride": "#8B5FCF",
    "Calcium": "#7B68EE",
    "Phosphorus": "#9575CD",
    "Magnesium": "#B39DDB",
    "Iron": "#8B5FCF",
    "Copper": "#9370DB",
    "Chromium": "#7B68EE",
    "Manganese": "#9575CD",
    "Molybdenum": "#B39DDB",
    "Zinc": "#6A5ACD",
    "Selenium": "#7E57C2",
    "Iodine": "#9575CD",

    // Vitamins - All oranges/yellows
    "Vitamins": "#FF9800",
    "Energy & Metabolism": "#F57C00",
    "Growth & Regulation": "#FF6F00",
    "Vitamin C": "#EF6C00",
    "Thiamin (B1)": "#F57C00",
    "Riboflavin (B2)": "#FB8C00",
    "Niacin (B3)": "#FF9800",
    "Pantothenic (B5)": "#FFA726",
    "Vitamin B-6": "#FFB74D",
    "Biotin": "#FFCC80",
    "Folate (B9)": "#FFE0B2",
    "Vitamin B-12": "#FF8F00",
    "Choline": "#FFC107",
    "Vitamin A": "#EF6C00",
    "Vitamin D": "#F57C00",
    "Vitamin E": "#FB8C00",
    "Vitamin K": "#FF9800",

    // Legacy colors for backward compatibility
    "Electrolytes": "#7B68EE",
    "Macro Minerals": "#9370DB",
    "Trace Minerals": "#8B5FCF",
    "Water-Soluble": "#F57C00",
    "Fat-Soluble": "#FF6F00"
};

/* ========================================================================
 * BAR GRAPH COLORS
 * Colors for the % Daily Value bar chart visualization
 * ======================================================================== */
const BAR_GRAPH_COLORS = {
    // Macros
    "Water": "#658394",
    "Protein": "#54886A",
    "Total Fat": "#B22222",
    "Fat": "#B22222",
    "Carbs": "#CC9A2E",
    "Carbohydrates": "#CC9A2E",
    "Fiber": "#A67C1A",
    "Sugars": "#E6B84D",
    "Starch": "#BF8E26",
    "Sat. Fat": "#B22222",
    "Mono Fat": "#C94444",
    "Poly Fat": "#D46666",
    "Trans Fat": "#8B0000",

    // Minerals
    "Sodium": "#8B5FCF",
    "Potassium": "#9370DB",
    "Calcium": "#7B68EE",
    "Iron": "#8B5FCF",
    "Magnesium": "#B39DDB",
    "Phosphorus": "#9575CD",
    "Zinc": "#6A5ACD",
    "Copper": "#9370DB",
    "Manganese": "#9575CD",
    "Selenium": "#7E57C2",
    "Chromium": "#7B68EE",
    "Iodine": "#9575CD",
    "Chloride": "#8B5FCF",

    // Vitamins
    "Vitamin A": "#EF6C00",
    "Vitamin C": "#EF6C00",
    "Vitamin D": "#F57C00",
    "Vitamin E": "#FB8C00",
    "Vitamin K": "#FF9800",
    "Thiamin (B1)": "#F57C00",
    "Riboflavin (B2)": "#FB8C00",
    "Niacin (B3)": "#FF9800",
    "Vitamin B6": "#FFB74D",
    "Folate": "#FFE0B2",
    "Vitamin B12": "#FF8F00",
    "Biotin": "#FFCC80",
    "Pantothenic Acid": "#FFA726",
    "Choline": "#FFC107"
};

/* ========================================================================
 * RADAR CHART COLORS
 * Colors for the radar chart visualization
 * ======================================================================== */
const RADAR_CHART_COLORS = {
    primary: '#4A90D9',
    secondary: '#E94E77',
    tertiary: '#50C878'
};

/* ========================================================================
 * FUNCTIONAL GROUP COLORS
 * Colors for nutrient functional groupings used in bar graphs
 * ======================================================================== */
const FUNCTIONAL_GROUP_COLORS = {
    'Hydration & Nerves': '#7B68EE',
    'Bones & Structure': '#9370DB',
    'Energy & Circulation': '#8B5FCF',
    'Growth & Defense': '#6A5ACD',
    'Energy & Metabolism': '#F57C00',
    'Growth & Regulation': '#FF6F00'
};


/* ========================================================================
 * DAILY REFERENCE VALUES (DRV) PROFILES
 * Nutrient recommendations by age, sex, and condition
 * Based on FDA/NIH guidelines
 * ======================================================================== */
const DRV_PROFILES = {
    // Default adult values (FDA Reference Daily Intakes)
    default: {
        // Macros (grams)
        protein: 50,
        fat: 78,
        carbs: 275,
        fiber: 28,
        sugars: 50,
        satFat: 20,

        // Minerals (mg unless noted)
        sodium: 2300,
        potassium: 4700,
        calcium: 1300,
        iron: 18,
        magnesium: 420,
        phosphorus: 1250,
        zinc: 11,
        copper: 0.9,
        manganese: 2.3,
        selenium: 55, // µg
        chromium: 35, // µg
        molybdenum: 45, // µg
        iodine: 150, // µg
        chloride: 2300,

        // Vitamins (mg unless noted)
        vitaminA: 900, // µg RAE
        vitaminC: 90,
        vitaminD: 20, // µg
        vitaminE: 15,
        vitaminK: 120, // µg
        thiamin: 1.2,
        riboflavin: 1.3,
        niacin: 16,
        vitaminB6: 1.7,
        folate: 400, // µg DFE
        vitaminB12: 2.4, // µg
        biotin: 30, // µg
        pantothenicAcid: 5,
        choline: 550
    },

    // Adult Male 19-50
    adult_male: {
        protein: 56,
        fat: 78,
        carbs: 275,
        fiber: 38,
        sugars: 50,
        satFat: 20,
        sodium: 2300,
        potassium: 4700,
        calcium: 1000,
        iron: 8,
        magnesium: 420,
        phosphorus: 700,
        zinc: 11,
        copper: 0.9,
        manganese: 2.3,
        selenium: 55,
        chromium: 35,
        iodine: 150,
        vitaminA: 900,
        vitaminC: 90,
        vitaminD: 15,
        vitaminE: 15,
        vitaminK: 120,
        thiamin: 1.2,
        riboflavin: 1.3,
        niacin: 16,
        vitaminB6: 1.3,
        folate: 400,
        vitaminB12: 2.4,
        biotin: 30,
        pantothenicAcid: 5,
        choline: 550
    },

    // Adult Female 19-50
    adult_female: {
        protein: 46,
        fat: 78,
        carbs: 275,
        fiber: 25,
        sugars: 50,
        satFat: 20,
        sodium: 2300,
        potassium: 4700,
        calcium: 1000,
        iron: 18,
        magnesium: 320,
        phosphorus: 700,
        zinc: 8,
        copper: 0.9,
        manganese: 1.8,
        selenium: 55,
        chromium: 25,
        iodine: 150,
        vitaminA: 700,
        vitaminC: 75,
        vitaminD: 15,
        vitaminE: 15,
        vitaminK: 90,
        thiamin: 1.1,
        riboflavin: 1.1,
        niacin: 14,
        vitaminB6: 1.3,
        folate: 400,
        vitaminB12: 2.4,
        biotin: 30,
        pantothenicAcid: 5,
        choline: 425
    },

    // Pregnant
    pregnant_female: {
        protein: 71,
        fat: 78,
        carbs: 275,
        fiber: 28,
        sugars: 50,
        satFat: 20,
        sodium: 2300,
        potassium: 4700,
        calcium: 1000,
        iron: 27,
        magnesium: 350,
        phosphorus: 700,
        zinc: 11,
        copper: 1.0,
        manganese: 2.0,
        selenium: 60,
        chromium: 30,
        iodine: 220,
        vitaminA: 770,
        vitaminC: 85,
        vitaminD: 15,
        vitaminE: 15,
        vitaminK: 90,
        thiamin: 1.4,
        riboflavin: 1.4,
        niacin: 18,
        vitaminB6: 1.9,
        folate: 600,
        vitaminB12: 2.6,
        biotin: 30,
        pantothenicAcid: 6,
        choline: 450
    },

    // Lactating
    lactating_female: {
        protein: 71,
        fat: 78,
        carbs: 275,
        fiber: 29,
        sugars: 50,
        satFat: 20,
        sodium: 2300,
        potassium: 5100,
        calcium: 1000,
        iron: 9,
        magnesium: 310,
        phosphorus: 700,
        zinc: 12,
        copper: 1.3,
        manganese: 2.6,
        selenium: 70,
        chromium: 45,
        iodine: 290,
        vitaminA: 1300,
        vitaminC: 120,
        vitaminD: 15,
        vitaminE: 19,
        vitaminK: 90,
        thiamin: 1.4,
        riboflavin: 1.6,
        niacin: 17,
        vitaminB6: 2.0,
        folate: 500,
        vitaminB12: 2.8,
        biotin: 35,
        pantothenicAcid: 7,
        choline: 550
    },

    // Child 1-3
    child: {
        protein: 13,
        fat: 40,
        carbs: 130,
        fiber: 19,
        sugars: 25,
        satFat: 10,
        sodium: 1500,
        potassium: 2000,
        calcium: 700,
        iron: 7,
        magnesium: 80,
        phosphorus: 460,
        zinc: 3,
        copper: 0.34,
        manganese: 1.2,
        selenium: 20,
        chromium: 11,
        iodine: 90,
        vitaminA: 300,
        vitaminC: 15,
        vitaminD: 15,
        vitaminE: 6,
        vitaminK: 30,
        thiamin: 0.5,
        riboflavin: 0.5,
        niacin: 6,
        vitaminB6: 0.5,
        folate: 150,
        vitaminB12: 0.9,
        biotin: 8,
        pantothenicAcid: 2,
        choline: 200
    },

    // Child 4-8
    "child4-8": {
        protein: 19,
        fat: 55,
        carbs: 175,
        fiber: 25,
        sugars: 35,
        satFat: 15,
        sodium: 1900,
        potassium: 2300,
        calcium: 1000,
        iron: 10,
        magnesium: 130,
        phosphorus: 500,
        zinc: 5,
        copper: 0.44,
        manganese: 1.5,
        selenium: 30,
        chromium: 15,
        iodine: 90,
        vitaminA: 400,
        vitaminC: 25,
        vitaminD: 15,
        vitaminE: 7,
        vitaminK: 55,
        thiamin: 0.6,
        riboflavin: 0.6,
        niacin: 8,
        vitaminB6: 0.6,
        folate: 200,
        vitaminB12: 1.2,
        biotin: 12,
        pantothenicAcid: 3,
        choline: 250
    },

    // Child 9-13
    "child9-13": {
        protein: 34,
        fat: 65,
        carbs: 225,
        fiber: 31,
        sugars: 40,
        satFat: 18,
        sodium: 2200,
        potassium: 2500,
        calcium: 1300,
        iron: 8,
        magnesium: 240,
        phosphorus: 1250,
        zinc: 8,
        copper: 0.7,
        manganese: 1.9,
        selenium: 40,
        chromium: 25,
        iodine: 120,
        vitaminA: 600,
        vitaminC: 45,
        vitaminD: 15,
        vitaminE: 11,
        vitaminK: 60,
        thiamin: 0.9,
        riboflavin: 0.9,
        niacin: 12,
        vitaminB6: 1.0,
        folate: 300,
        vitaminB12: 1.8,
        biotin: 20,
        pantothenicAcid: 4,
        choline: 375
    },

    // Teen 14-18 Male
    "teen14-18_male": {
        protein: 52,
        fat: 75,
        carbs: 275,
        fiber: 38,
        sugars: 50,
        satFat: 20,
        sodium: 2300,
        potassium: 3000,
        calcium: 1300,
        iron: 11,
        magnesium: 410,
        phosphorus: 1250,
        zinc: 11,
        copper: 0.89,
        manganese: 2.2,
        selenium: 55,
        chromium: 35,
        iodine: 150,
        vitaminA: 900,
        vitaminC: 75,
        vitaminD: 15,
        vitaminE: 15,
        vitaminK: 75,
        thiamin: 1.2,
        riboflavin: 1.3,
        niacin: 16,
        vitaminB6: 1.3,
        folate: 400,
        vitaminB12: 2.4,
        biotin: 25,
        pantothenicAcid: 5,
        choline: 550
    },

    // Teen 14-18 Female
    "teen14-18_female": {
        protein: 46,
        fat: 75,
        carbs: 275,
        fiber: 26,
        sugars: 50,
        satFat: 20,
        sodium: 2300,
        potassium: 2300,
        calcium: 1300,
        iron: 15,
        magnesium: 360,
        phosphorus: 1250,
        zinc: 9,
        copper: 0.89,
        manganese: 1.6,
        selenium: 55,
        chromium: 24,
        iodine: 150,
        vitaminA: 700,
        vitaminC: 65,
        vitaminD: 15,
        vitaminE: 15,
        vitaminK: 75,
        thiamin: 1.0,
        riboflavin: 1.0,
        niacin: 14,
        vitaminB6: 1.2,
        folate: 400,
        vitaminB12: 2.4,
        biotin: 25,
        pantothenicAcid: 5,
        choline: 400
    },

    // Senior 51+ Male
    senior_male: {
        protein: 56,
        fat: 78,
        carbs: 275,
        fiber: 30,
        sugars: 50,
        satFat: 20,
        sodium: 2300,
        potassium: 4700,
        calcium: 1200,
        iron: 8,
        magnesium: 420,
        phosphorus: 700,
        zinc: 11,
        copper: 0.9,
        manganese: 2.3,
        selenium: 55,
        chromium: 30,
        iodine: 150,
        vitaminA: 900,
        vitaminC: 90,
        vitaminD: 20,
        vitaminE: 15,
        vitaminK: 120,
        thiamin: 1.2,
        riboflavin: 1.3,
        niacin: 16,
        vitaminB6: 1.7,
        folate: 400,
        vitaminB12: 2.4,
        biotin: 30,
        pantothenicAcid: 5,
        choline: 550
    },

    // Senior 51+ Female
    senior_female: {
        protein: 46,
        fat: 78,
        carbs: 275,
        fiber: 21,
        sugars: 50,
        satFat: 20,
        sodium: 2300,
        potassium: 4700,
        calcium: 1200,
        iron: 8,
        magnesium: 320,
        phosphorus: 700,
        zinc: 8,
        copper: 0.9,
        manganese: 1.8,
        selenium: 55,
        chromium: 20,
        iodine: 150,
        vitaminA: 700,
        vitaminC: 75,
        vitaminD: 20,
        vitaminE: 15,
        vitaminK: 90,
        thiamin: 1.1,
        riboflavin: 1.1,
        niacin: 14,
        vitaminB6: 1.5,
        folate: 400,
        vitaminB12: 2.4,
        biotin: 30,
        pantothenicAcid: 5,
        choline: 425
    }
};


/* ========================================================================
 * CHART DIMENSION CONFIGURATIONS
 * Height and size settings for responsive charts
 * ======================================================================== */

/* ========================================================================
 * SANKEY CHART DIMENSIONS
 * Height settings for different size modes
 * ======================================================================== */
const SANKEY_HEIGHTS = {
    small: { mobile: 300, desktop: 380 },
    medium: { mobile: 450, desktop: 550 },
    large: { mobile: 600, desktop: 750 },
    tall: { mobile: 900, desktop: 1200 }
};

/* ========================================================================
 * TREEMAP CHART DIMENSIONS
 * Height settings for different size modes
 * ======================================================================== */
const TREEMAP_HEIGHTS = {
    small: { main: 350, fat: 300 },
    medium: { main: 450, fat: 380 },
    large: { main: 550, fat: 450 },
    tall: { main: 700, fat: 550 }
};


/* ========================================================================
 * HELPER FUNCTIONS
 * Utility functions for accessing configuration data
 * ======================================================================== */

/* ========================================================================
 * GET SANKEY LINK COLOR
 * Retrieves the color for a Sankey link, checking both directions
 * Parameters:
 *   - sourceName: Name of the source node
 *   - targetName: Name of the target node
 * Returns: Color hex code
 * ======================================================================== */
function getSankeyLinkColor(sourceName, targetName) {
    const key1 = `${sourceName}-${targetName}`;
    const key2 = `${targetName}-${sourceName}`;
    return SANKEY_LINK_COLORS[key1] || SANKEY_LINK_COLORS[key2] || "#666363";
}

/* ========================================================================
 * GET SANKEY NODE TEXT COLOR
 * Retrieves the text color for a Sankey node label
 * Parameters:
 *   - nodeName: Name of the node
 * Returns: Color hex code
 * ======================================================================== */
function getSankeyNodeTextColor(nodeName) {
    return SANKEY_NODE_TEXT_COLORS[nodeName] || "#333";
}

/* ========================================================================
 * GET DRV PROFILE
 * Retrieves the appropriate Daily Reference Value profile based on selections
 * Parameters:
 *   - age: Age group (child, adult, senior, etc.)
 *   - sex: Gender (male, female)
 *   - condition: Special condition (pregnant, lactating, none)
 * Returns: DRV profile object
 * ======================================================================== */
function getDRVProfile(age, sex, condition) {
    // Handle special conditions first
    if (condition === 'pregnant') return DRV_PROFILES.pregnant_female;
    if (condition === 'lactating') return DRV_PROFILES.lactating_female;

    // Build profile key
    let key = '';

    if (age === 'child') {
        return DRV_PROFILES.child;
    } else if (age === 'child4-8') {
        return DRV_PROFILES['child4-8'];
    } else if (age === 'child9-13') {
        return DRV_PROFILES['child9-13'];
    } else if (age === 'teen14-18') {
        key = `teen14-18_${sex}`;
    } else if (age === 'adult') {
        key = `adult_${sex}`;
    } else if (age === 'senior') {
        key = `senior_${sex}`;
    }

    return DRV_PROFILES[key] || DRV_PROFILES.default;
}

/* ========================================================================
 * GET TREEMAP COLOR
 * Retrieves color for treemap elements with fallback
 * Parameters:
 *   - name: Name of the nutrient/element
 * Returns: Color hex code
 * ======================================================================== */
function getTreemapColor(name) {
    return TREEMAP_COLORS[name] || "#999";
}

/* ========================================================================
 * GET BAR GRAPH COLOR
 * Retrieves color for bar graph elements with fallback
 * Parameters:
 *   - name: Name of the nutrient/element
 * Returns: Color hex code
 * ======================================================================== */
function getBarGraphColor(name) {
    return BAR_GRAPH_COLORS[name] || "#666";
}