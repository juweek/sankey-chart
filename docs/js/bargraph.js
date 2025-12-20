// Bar Graph visualization for % Daily Value
// Uses same API and data as treemap.js

// Daily Recommended Values (DRV) based on FDA/NIH guidelines
// Values are per day, organized by age/sex/condition
const DRV_PROFILES = {
    // Default adult values (FDA Reference Daily Intakes)
    default: {
        // Macros (grams)
        protein: 50,
        fat: 78,
        carbs: 275,
        fiber: 28,
        sugars: 50, // Added sugars limit
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
    
    // Teen 14-18
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
    
    // Senior 51+
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

// Color mapping (same as treemap)
const BAR_COLORS = {
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

// Current DRV data
let currentDRVData = null;
let showDRVGroups = false;

// Functional groupings for minerals
const MINERAL_GROUPS = {
    'Hydration & Nerves': ['Sodium', 'Potassium', 'Chloride'],
    'Bones & Structure': ['Calcium', 'Phosphorus', 'Magnesium'],
    'Energy & Circulation': ['Iron', 'Copper', 'Chromium', 'Manganese'],
    'Growth & Defense': ['Zinc', 'Selenium', 'Iodine']
};

// Functional groupings for vitamins
const VITAMIN_GROUPS = {
    'Energy & Metabolism': ['Thiamin (B1)', 'Riboflavin (B2)', 'Niacin (B3)', 'Pantothenic Acid', 'Vitamin B6', 'Biotin', 'Folate', 'Vitamin B12', 'Choline'],
    'Growth & Regulation': ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin E', 'Vitamin K']
};

// Group colors
const GROUP_COLORS = {
    'Hydration & Nerves': '#7B68EE',
    'Bones & Structure': '#9370DB',
    'Energy & Circulation': '#8B5FCF',
    'Growth & Defense': '#6A5ACD',
    'Energy & Metabolism': '#F57C00',
    'Growth & Regulation': '#FF6F00'
};

// Get the appropriate DRV profile based on selections
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

// Calculate percentage of DRV
function calculatePercentage(value, drv) {
    if (!drv || drv === 0) return 0;
    return (value / drv) * 100;
}

// Format number without trailing zeros
function formatNumber(num) {
    if (num === 0) return '0';
    if (num >= 100) return Math.round(num).toString();
    if (num >= 10) return num.toFixed(1).replace(/\.0$/, '');
    if (num >= 1) return num.toFixed(1).replace(/\.0$/, '');
    if (num >= 0.1) return num.toFixed(2).replace(/\.?0+$/, '');
    return num.toFixed(3).replace(/\.?0+$/, '');
}

// Render a single bar
function renderBar(containerId, name, value, unit, drv, drvUnit, color, groupName = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const percentage = calculatePercentage(value, drv);
    const displayPercentage = Math.min(percentage, 135); // Cap display at 135%
    const barWidth = (displayPercentage / 135) * 100; // Scale to 135% = 100% width
    const markerPosition = (100 / 135) * 100; // 100% DRV position
    
    const exceedsDRV = percentage > 100;
    const levelClass = percentage < 25 ? 'low' : percentage < 100 ? 'good' : 'high';
    const groupAttr = groupName ? `data-group="${groupName}"` : '';
    
    const barHTML = `
        <div class="drv-bar-item" data-nutrient="${name}" data-value="${value}" data-unit="${unit}" data-drv="${drv}" data-percentage="${percentage.toFixed(1)}" ${groupAttr}>
            <div class="drv-bar-header">
                <span class="drv-bar-name">${name}</span>
                <span class="drv-bar-values">${formatNumber(value)}${unit} / ${formatNumber(drv)}${drvUnit}</span>
            </div>
            <div class="drv-bar-track">
                <div class="drv-bar-fill ${levelClass} ${exceedsDRV ? 'exceeds-drv' : ''}" 
                     style="width: ${barWidth}%; background-color: ${color}; --bar-color: ${color};">
                </div>
                <div class="drv-bar-marker" style="left: ${markerPosition}%;">
                    <span class="drv-bar-marker-label">DRV</span>
                </div>
                <span class="drv-bar-percentage">${percentage.toFixed(0)}%</span>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', barHTML);
}

// Parse nutrients from treemap data format
function parseNutrientsForDRV(nutrients) {
    if (!nutrients) return null;
    
    const m = nutrients.mineralData || {};
    const v = nutrients.vitaminData || {};
    
    return {
        // Macros (in grams)
        macros: {
            protein: { value: nutrients.protein || 0, unit: 'g' },
            fat: { value: nutrients.fat || 0, unit: 'g' },
            carbs: { value: nutrients.carbs || 0, unit: 'g' }
        },
        
        // Carb subtypes (in grams)
        carbSubtypes: {
            fiber: { value: nutrients.fiber || 0, unit: 'g' },
            sugars: { value: nutrients.sugars || 0, unit: 'g' },
            starch: { value: nutrients.starch || 0, unit: 'g' }
        },
        
        // Fat subtypes (in grams)
        fatSubtypes: {
            satFat: { value: nutrients.satFat || 0, unit: 'g' },
            monoFat: { value: nutrients.monoFat || 0, unit: 'g' },
            polyFat: { value: nutrients.polyFat || 0, unit: 'g' },
            transFat: { value: nutrients.transFat || 0, unit: 'g' }
        },
        
        // Minerals (in mg)
        minerals: {
            sodium: { value: m.sodium || 0, unit: 'mg' },
            potassium: { value: m.potassium || 0, unit: 'mg' },
            calcium: { value: m.calcium || 0, unit: 'mg' },
            iron: { value: m.iron || 0, unit: 'mg' },
            magnesium: { value: m.magnesium || 0, unit: 'mg' },
            phosphorus: { value: m.phosphorus || 0, unit: 'mg' },
            zinc: { value: m.zinc || 0, unit: 'mg' },
            copper: { value: m.copper || 0, unit: 'mg' },
            manganese: { value: m.manganese || 0, unit: 'mg' },
            selenium: { value: m.selenium || 0, unit: 'µg' },
            chromium: { value: m.chromium || 0, unit: 'µg' },
            iodine: { value: m.iodine || 0, unit: 'µg' }
        },
        
        // Vitamins (mixed units)
        vitamins: {
            vitaminA: { value: v.vitaminA || 0, unit: 'µg' },
            vitaminC: { value: v.vitaminC || 0, unit: 'mg' },
            vitaminD: { value: v.vitaminD || 0, unit: 'µg' },
            vitaminE: { value: v.vitaminE || 0, unit: 'mg' },
            vitaminK: { value: v.vitaminK || 0, unit: 'µg' },
            thiamin: { value: v.thiamin || 0, unit: 'mg' },
            riboflavin: { value: v.riboflavin || 0, unit: 'mg' },
            niacin: { value: v.niacin || 0, unit: 'mg' },
            vitaminB6: { value: v.vitaminB6 || 0, unit: 'mg' },
            folate: { value: v.folate || 0, unit: 'µg' },
            vitaminB12: { value: v.vitaminB12 || 0, unit: 'µg' },
            biotin: { value: v.biotin || 0, unit: 'µg' },
            pantothenicAcid: { value: v.pantothenicAcid || 0, unit: 'mg' },
            choline: { value: v.choline || 0, unit: 'mg' }
        }
    };
}

// Display name mapping
const DISPLAY_NAMES = {
    protein: 'Protein',
    fat: 'Total Fat',
    carbs: 'Carbohydrates',
    fiber: 'Fiber',
    sugars: 'Sugars',
    starch: 'Starch',
    satFat: 'Sat. Fat',
    monoFat: 'Mono Fat',
    polyFat: 'Poly Fat',
    transFat: 'Trans Fat',
    sodium: 'Sodium',
    potassium: 'Potassium',
    calcium: 'Calcium',
    iron: 'Iron',
    magnesium: 'Magnesium',
    phosphorus: 'Phosphorus',
    zinc: 'Zinc',
    copper: 'Copper',
    manganese: 'Manganese',
    selenium: 'Selenium',
    chromium: 'Chromium',
    iodine: 'Iodine',
    vitaminA: 'Vitamin A',
    vitaminC: 'Vitamin C',
    vitaminD: 'Vitamin D',
    vitaminE: 'Vitamin E',
    vitaminK: 'Vitamin K',
    thiamin: 'Thiamin (B1)',
    riboflavin: 'Riboflavin (B2)',
    niacin: 'Niacin (B3)',
    vitaminB6: 'Vitamin B6',
    folate: 'Folate',
    vitaminB12: 'Vitamin B12',
    biotin: 'Biotin',
    pantothenicAcid: 'Pantothenic Acid',
    choline: 'Choline'
};

// Get DRV unit for display
function getDRVUnit(key, profile) {
    const drvValue = profile[key];
    // Most minerals are in mg, some vitamins are in µg
    if (['selenium', 'chromium', 'molybdenum', 'iodine', 'vitaminA', 'vitaminD', 'vitaminK', 'folate', 'vitaminB12', 'biotin'].includes(key)) {
        return 'µg';
    }
    if (['protein', 'fat', 'carbs', 'fiber', 'sugars', 'satFat'].includes(key)) {
        return 'g';
    }
    return 'mg';
}

// Render all bar graphs
function renderDRVBars(nutrients) {
    if (!nutrients) return;
    
    const age = document.getElementById('drvAge')?.value || 'adult';
    const sex = document.getElementById('drvSex')?.value || 'female';
    const condition = document.getElementById('drvCondition')?.value || 'none';
    
    const profile = getDRVProfile(age, sex, condition);
    const parsedNutrients = parseNutrientsForDRV(nutrients);
    
    if (!parsedNutrients) return;
    
    // Clear containers
    ['drvMacros', 'drvCarbSubtypes', 'drvFatSubtypes', 'drvMinerals', 'drvVitamins'].forEach(id => {
        const container = document.getElementById(id);
        if (container) container.innerHTML = '';
    });
    
    // Render Macros
    for (const [key, data] of Object.entries(parsedNutrients.macros)) {
        if (data.value > 0 && profile[key]) {
            const displayName = DISPLAY_NAMES[key] || key;
            const color = BAR_COLORS[displayName] || '#666';
            const drvUnit = getDRVUnit(key, profile);
            renderBar('drvMacros', displayName, data.value, data.unit, profile[key], drvUnit, color);
        }
    }
    
    // Render Carb Subtypes
    for (const [key, data] of Object.entries(parsedNutrients.carbSubtypes)) {
        if (data.value > 0 && profile[key]) {
            const displayName = DISPLAY_NAMES[key] || key;
            const color = BAR_COLORS[displayName] || '#CC9A2E';
            const drvUnit = getDRVUnit(key, profile);
            renderBar('drvCarbSubtypes', displayName, data.value, data.unit, profile[key], drvUnit, color);
        }
    }
    
    // Render Fat Subtypes
    for (const [key, data] of Object.entries(parsedNutrients.fatSubtypes)) {
        if (data.value > 0 && profile[key]) {
            const displayName = DISPLAY_NAMES[key] || key;
            const color = BAR_COLORS[displayName] || '#B22222';
            const drvUnit = getDRVUnit(key, profile);
            renderBar('drvFatSubtypes', displayName, data.value, data.unit, profile[key], drvUnit, color);
        }
    }
    
    // Render Minerals
    if (showDRVGroups) {
        // Grouped rendering
        renderGroupedBars('drvMinerals', parsedNutrients.minerals, MINERAL_GROUPS, profile, '#9370DB');
    } else {
        // Flat rendering
        for (const [key, data] of Object.entries(parsedNutrients.minerals)) {
            if (data.value > 0 && profile[key]) {
                const displayName = DISPLAY_NAMES[key] || key;
                const color = BAR_COLORS[displayName] || '#9370DB';
                const drvUnit = getDRVUnit(key, profile);
                renderBar('drvMinerals', displayName, data.value, data.unit, profile[key], drvUnit, color);
            }
        }
    }
    
    // Render Vitamins
    if (showDRVGroups) {
        // Grouped rendering
        renderGroupedBars('drvVitamins', parsedNutrients.vitamins, VITAMIN_GROUPS, profile, '#FF9800');
    } else {
        // Flat rendering
        for (const [key, data] of Object.entries(parsedNutrients.vitamins)) {
            if (data.value > 0 && profile[key]) {
                const displayName = DISPLAY_NAMES[key] || key;
                const color = BAR_COLORS[displayName] || '#FF9800';
                const drvUnit = getDRVUnit(key, profile);
                renderBar('drvVitamins', displayName, data.value, data.unit, profile[key], drvUnit, color);
            }
        }
    }
    
    // Add tooltips
    addBarTooltips();
}

// Render bars grouped by functional category
function renderGroupedBars(containerId, nutrients, groups, profile, defaultColor) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Build a map of nutrient display name to key
    const displayNameToKey = {};
    for (const [key, data] of Object.entries(nutrients)) {
        const displayName = DISPLAY_NAMES[key] || key;
        displayNameToKey[displayName] = key;
    }
    
    // Render each group
    for (const [groupName, memberNames] of Object.entries(groups)) {
        const groupColor = GROUP_COLORS[groupName] || defaultColor;
        let hasMembers = false;
        let memberCount = 0;
        
        // Check if any members have data and count them
        for (const memberName of memberNames) {
            const key = displayNameToKey[memberName];
            if (key && nutrients[key] && nutrients[key].value > 0 && profile[key]) {
                hasMembers = true;
                memberCount++;
            }
        }
        
        if (!hasMembers) continue;
        
        // Create unique ID for this group
        const groupId = `drv-subgroup-${containerId}-${groupName.replace(/[^a-zA-Z0-9]/g, '')}`;
        
        // Add collapsible group container
        container.insertAdjacentHTML('beforeend', `
            <div class="drv-subgroup" data-group="${groupName}">
                <div class="drv-subgroup-header" onclick="toggleDRVSubgroup(this)" style="border-left: 4px solid ${groupColor};">
                    <span class="drv-subgroup-icon">▼</span>
                    <span class="drv-subgroup-name" style="color: ${groupColor};">${groupName}</span>
                    <span class="drv-subgroup-count">${memberCount} items</span>
                </div>
                <div class="drv-subgroup-content" id="${groupId}"></div>
            </div>
        `);
        
        // Render bars for this group into the subgroup container
        for (const memberName of memberNames) {
            const key = displayNameToKey[memberName];
            if (key && nutrients[key] && nutrients[key].value > 0 && profile[key]) {
                const data = nutrients[key];
                const color = BAR_COLORS[memberName] || groupColor;
                const drvUnit = getDRVUnit(key, profile);
                renderBar(groupId, memberName, data.value, data.unit, profile[key], drvUnit, color, groupName);
            }
        }
    }
}

// Toggle DRV subgroup collapse/expand
function toggleDRVSubgroup(headerElement) {
    const subgroup = headerElement.closest('.drv-subgroup');
    if (subgroup) {
        subgroup.classList.toggle('collapsed');
    }
}

// Add tooltip interactions
function addBarTooltips() {
    const tooltip = document.getElementById('bargraphTooltip');
    if (!tooltip) return;
    
    document.querySelectorAll('.drv-bar-item').forEach(item => {
        item.addEventListener('mouseenter', (e) => {
            const name = item.dataset.nutrient;
            const value = parseFloat(item.dataset.value);
            const unit = item.dataset.unit;
            const drv = parseFloat(item.dataset.drv);
            const percentage = parseFloat(item.dataset.percentage);
            
            let status = '';
            if (percentage < 25) status = '<span style="color: #ef4444;">Low intake</span>';
            else if (percentage < 100) status = '<span style="color: #f59e0b;">Moderate intake</span>';
            else if (percentage <= 135) status = '<span style="color: #22c55e;">Meets DRV</span>';
            else status = '<span style="color: #ef4444;">Exceeds limit</span>';
            
            tooltip.innerHTML = `
                <strong>${name}</strong><br>
                Amount: ${value.toFixed(2)}${unit}<br>
                DRV: ${drv}${unit}<br>
                <strong>${percentage.toFixed(1)}% of daily value</strong><br>
                ${status}
            `;
            tooltip.style.opacity = 1;
        });
        
        item.addEventListener('mousemove', (e) => {
            tooltip.style.left = (e.clientX + 15) + 'px';
            tooltip.style.top = (e.clientY - 10) + 'px';
        });
        
        item.addEventListener('mouseleave', () => {
            tooltip.style.opacity = 0;
        });
    });
}

// Update bars when profile changes
function updateDRVBars() {
    if (currentDRVData) {
        renderDRVBars(currentDRVData);
    }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Profile selectors
    const ageSelect = document.getElementById('drvAge');
    const sexSelect = document.getElementById('drvSex');
    const conditionSelect = document.getElementById('drvCondition');
    const groupToggle = document.getElementById('drvShowGroups');
    
    if (ageSelect) ageSelect.addEventListener('change', updateDRVBars);
    if (sexSelect) sexSelect.addEventListener('change', updateDRVBars);
    if (conditionSelect) {
        conditionSelect.addEventListener('change', (e) => {
            // Disable sex selector if pregnant/lactating
            if (sexSelect) {
                if (e.target.value === 'pregnant' || e.target.value === 'lactating') {
                    sexSelect.value = 'female';
                    sexSelect.disabled = true;
                } else {
                    sexSelect.disabled = false;
                }
            }
            updateDRVBars();
        });
    }
    
    // Group toggle
    if (groupToggle) {
        groupToggle.addEventListener('change', (e) => {
            showDRVGroups = e.target.checked;
            updateDRVBars();
        });
    }
});

// Public function to update bar graphs with new data
function updateDRVBarGraphs(nutrients) {
    currentDRVData = nutrients;
    renderDRVBars(nutrients);
}

// Download DRV section as SVG
function downloadDRVSection(containerId, sectionName) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const bars = container.querySelectorAll('.drv-bar-item');
    if (bars.length === 0) return;
    
    // Create SVG
    const barHeight = 50;
    const barSpacing = 16;
    const width = 500;
    const height = bars.length * (barHeight + barSpacing) + 40;
    const margin = { left: 20, right: 20, top: 30, bottom: 10 };
    
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
    
    // Background
    svgContent += `<rect width="100%" height="100%" fill="#1a1a2e"/>`;
    
    // Title
    const sectionTitles = {
        macros: 'Macronutrients - % Daily Value',
        carbs: 'Carbs Breakdown - % Daily Value',
        fat: 'Fat Breakdown - % Daily Value',
        minerals: 'Minerals - % Daily Value',
        vitamins: 'Vitamins - % Daily Value'
    };
    svgContent += `<text x="${width/2}" y="20" fill="#fff" font-size="14" font-weight="bold" text-anchor="middle">${sectionTitles[sectionName] || sectionName}</text>`;
    
    // Draw each bar
    let y = margin.top + 10;
    bars.forEach(bar => {
        const name = bar.dataset.nutrient;
        const value = parseFloat(bar.dataset.value);
        const unit = bar.dataset.unit;
        const drv = parseFloat(bar.dataset.drv);
        const percentage = parseFloat(bar.dataset.percentage);
        
        const barWidth = width - margin.left - margin.right;
        const fillWidth = Math.min(percentage / 135, 1) * barWidth;
        const markerX = (100 / 135) * barWidth + margin.left;
        
        // Get color from the bar fill
        const barFill = bar.querySelector('.drv-bar-fill');
        const color = barFill ? barFill.style.backgroundColor || '#666' : '#666';
        
        // Background track
        svgContent += `<rect x="${margin.left}" y="${y + 16}" width="${barWidth}" height="20" fill="#374151" rx="3"/>`;
        
        // Fill bar
        svgContent += `<rect x="${margin.left}" y="${y + 16}" width="${fillWidth}" height="20" fill="${color}" rx="3"/>`;
        
        // 100% marker line
        svgContent += `<line x1="${markerX}" y1="${y + 12}" x2="${markerX}" y2="${y + 40}" stroke="#fff" stroke-width="2" stroke-dasharray="4,2"/>`;
        
        // DRV label
        svgContent += `<text x="${markerX}" y="${y + 8}" fill="#fff" font-size="8" text-anchor="middle">DRV</text>`;
        
        // Nutrient name
        svgContent += `<text x="${margin.left}" y="${y + 12}" fill="#e5e7eb" font-size="11">${name}</text>`;
        
        // Values
        svgContent += `<text x="${width - margin.right}" y="${y + 12}" fill="#9ca3af" font-size="10" text-anchor="end">${value.toFixed(1)}${unit} / ${drv}${unit}</text>`;
        
        // Percentage
        svgContent += `<text x="${width - margin.right - 5}" y="${y + 30}" fill="#fff" font-size="11" font-weight="bold" text-anchor="end">${percentage.toFixed(0)}%</text>`;
        
        y += barHeight + barSpacing;
    });
    
    svgContent += `</svg>`;
    
    // Download
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Get food name for filename
    const foodTitle = document.getElementById('bargraph_graphTitle')?.textContent || 'food';
    const cleanTitle = foodTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    
    link.href = url;
    link.download = `${cleanTitle}_${sectionName}_drv.svg`;
    link.click();
    URL.revokeObjectURL(url);
}

// Toggle DRV section collapse/expand
function toggleDRVSection(headerElement) {
    const section = headerElement.closest('.drv-section');
    if (section) {
        section.classList.toggle('collapsed');
    }
}

// Export for use by other modules
window.updateDRVBarGraphs = updateDRVBarGraphs;
window.downloadDRVSection = downloadDRVSection;
window.toggleDRVSection = toggleDRVSection;
window.toggleDRVSubgroup = toggleDRVSubgroup;

