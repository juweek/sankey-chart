/* ========================================================================
 * TREEMAP VISUALIZATION
 * Hierarchical nutrient composition display with multiple view types
 * Dependencies: D3.js, config.js
 * ======================================================================== */

/* ========================================================================
 * API CONFIGURATION
 * Uses same API endpoint as Sankey (from config.js)
 * ======================================================================== */

// API_BASE_URL is defined in config.js and loaded before this file

/* ========================================================================
 * COLOR CONFIGURATION
 * Uses centralized color schemes from config.js
 * ======================================================================== */

// Reference to centralized treemap colors
const treemapColors = TREEMAP_COLORS;

// Legacy duplicate removed - was:
/*
const treemapColors = {
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
    
    // MINERAL COLORS - ALL PURPLES (matching Sankey)
    // Functional groups
    "Hydration & Nerves": "#7B68EE",
    "Bones & Structure": "#9370DB",
    "Energy & Circulation": "#8B5FCF",
    "Growth & Defense": "#6A5ACD",
    // Individual minerals (purple shades)
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
    
    // VITAMIN COLORS - ALL ORANGES/YELLOWS
    // Functional groups
    "Vitamins": "#FF9800",
    "Energy & Metabolism": "#F57C00",
    "Growth & Regulation": "#FF6F00",
    // Individual vitamins (orange shades)
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
*/

/* ========================================================================
 * STATE MANAGEMENT
 * Tracks current visualization data, portion sizes, and display settings
 * ======================================================================== */

// State
let currentTreemapData = null;
let currentFoodData = null; // Store raw USDA data
let currentPortionMultiplier = 1; // Default: 100g
let availablePortions = []; // Store available portion sizes
let showSubtypes = true;
let showSodiumSeparately = false;  // Synced with Sankey's showSodium toggle
let treemapChartSize = 'small';  // 'small', 'medium', 'large', 'tall'
let circlePackShowSubtypes = true;
let circlePackShowLabels = true;
let stackedBarShowSubtypes = true;
let voronoiShowSubtypes = true;
let voronoiShowLabels = true;

// Height configurations matching sankey.js
const treemapHeights = {
    small: { main: 350, fat: 300 },
    medium: { main: 450, fat: 380 },
    large: { main: 550, fat: 450 },
    tall: { main: 700, fat: 550 }
};

// Initialize treemap dimensions based on current size setting
function getTreemapDimensions(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return { width: 600, height: 400 };
    const rect = container.getBoundingClientRect();
    
    // Determine height based on chart size and container type
    const isFatTreemap = containerId === 'fatTreemapContainer';
    const heights = treemapHeights[treemapChartSize] || treemapHeights.small;
    const targetHeight = isFatTreemap ? heights.fat : heights.main;
    
    return {
        width: Math.max(rect.width, 300),
        height: targetHeight
    };
}

function getCirclePackDimensions(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return { width: 600, height: 400 };
    const rect = container.getBoundingClientRect();

    const isSecondary =
        containerId === 'circlePackFatContainer' ||
        containerId === 'circlePackCarbsContainer' ||
        containerId === 'circlePackProteinContainer';
    const heights = treemapHeights[treemapChartSize] || treemapHeights.small;
    const targetHeight = isSecondary ? heights.fat : heights.main;

    return {
        width: Math.max(rect.width, 300),
        height: targetHeight
    };
}

function getVoronoiDimensions(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return { width: 600, height: 400 };
    const rect = container.getBoundingClientRect();

    const isSecondary =
        containerId === 'voronoiFatContainer' ||
        containerId === 'voronoiCarbsContainer' ||
        containerId === 'voronoiProteinContainer';
    const heights = treemapHeights[treemapChartSize] || treemapHeights.small;
    const targetHeight = isSecondary ? heights.fat : heights.main;

    return {
        width: Math.max(rect.width, 300),
        height: targetHeight
    };
}

function getNodeDisplayValue(node) {
    if (!node) return 0;
    if (typeof node.data?.value === 'number') return node.data.value;
    if (!node.children) return 0;
    return node.children.reduce((sum, child) => sum + getNodeDisplayValue(child), 0);
}

function renderNutrientKey(container, items, unit = 'g', showAmounts = false) {
    if (!container || !Array.isArray(items) || items.length === 0) return;
    const legend = document.createElement('div');
    legend.className = 'nutrient-key';
    items
        .filter(item => item && typeof item.value === 'number' && item.value > 0)
        .sort((a, b) => b.value - a.value)
        .forEach((item) => {
            const keyItem = document.createElement('div');
            keyItem.className = 'nutrient-key-item';
            const amount = showAmounts ? ` <span class="nutrient-key-value">(${item.value.toFixed(1)}${unit})</span>` : '';
            keyItem.innerHTML = `
                <span class="nutrient-key-swatch" style="background:${item.color || '#888'}"></span>
                <span class="nutrient-key-label">${item.name}${amount}</span>
            `;
            legend.appendChild(keyItem);
        });
    container.appendChild(legend);
}

function makeCircleBoundaryPolygon(cx, cy, radius, sides = 72) {
    const points = [];
    for (let i = 0; i < sides; i++) {
        const a = (2 * Math.PI * i) / sides;
        points.push([cx + (radius * Math.cos(a)), cy + (radius * Math.sin(a))]);
    }
    return points;
}

function clipPolygonHalfPlane(polygon, a, b, c) {
    if (!polygon || polygon.length === 0) return [];
    const inside = (p) => ((a * p[0]) + (b * p[1])) <= c;
    const intersect = (p1, p2) => {
        const x1 = p1[0], y1 = p1[1];
        const x2 = p2[0], y2 = p2[1];
        const d1 = (a * x1) + (b * y1) - c;
        const d2 = (a * x2) + (b * y2) - c;
        const denom = d1 - d2;
        if (Math.abs(denom) < 1e-9) return p2;
        const t = d1 / denom;
        return [x1 + ((x2 - x1) * t), y1 + ((y2 - y1) * t)];
    };

    const out = [];
    let prev = polygon[polygon.length - 1];
    let prevInside = inside(prev);
    for (let i = 0; i < polygon.length; i++) {
        const curr = polygon[i];
        const currInside = inside(curr);
        if (currInside) {
            if (!prevInside) out.push(intersect(prev, curr));
            out.push(curr);
        } else if (prevInside) {
            out.push(intersect(prev, curr));
        }
        prev = curr;
        prevInside = currInside;
    }
    return out;
}

function polygonAreaCentroid(poly) {
    if (!poly || poly.length < 3) {
        return { area: 0, cx: 0, cy: 0 };
    }
    let twiceArea = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < poly.length; i++) {
        const [x0, y0] = poly[i];
        const [x1, y1] = poly[(i + 1) % poly.length];
        const cross = (x0 * y1) - (x1 * y0);
        twiceArea += cross;
        cx += (x0 + x1) * cross;
        cy += (y0 + y1) * cross;
    }
    const area = Math.abs(twiceArea) * 0.5;
    if (Math.abs(twiceArea) < 1e-9) {
        const avg = poly.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
        return { area, cx: avg[0] / poly.length, cy: avg[1] / poly.length };
    }
    return {
        area,
        cx: cx / (3 * twiceArea),
        cy: cy / (3 * twiceArea)
    };
}

function buildPowerCell(index, sites, weights, boundaryPoly) {
    let cell = boundaryPoly;
    const pi = sites[index];
    for (let j = 0; j < sites.length; j++) {
        if (j === index) continue;
        const pj = sites[j];
        const a = 2 * (pj.x - pi.x);
        const b = 2 * (pj.y - pi.y);
        const c = ((pj.x * pj.x) + (pj.y * pj.y) - weights[j]) - ((pi.x * pi.x) + (pi.y * pi.y) - weights[index]);
        cell = clipPolygonHalfPlane(cell, a, b, c);
        if (cell.length === 0) break;
    }
    return cell;
}

function solveWeightedVoronoi(sites, targetAreas, cx, cy, radius, options = {}) {
    const maxIterations = options.maxIterations || 64;
    const centroidStep = options.centroidStep || 0.45;
    const weightStep = options.weightStep || 0.9;
    const boundaryPoly = makeCircleBoundaryPolygon(cx, cy, radius, options.boundarySides || 72);
    const weights = sites.map(() => 0);
    const cells = sites.map(() => []);

    for (let iter = 0; iter < maxIterations; iter++) {
        let totalError = 0;

        for (let i = 0; i < sites.length; i++) {
            const cell = buildPowerCell(i, sites, weights, boundaryPoly);
            cells[i] = cell;
            const metrics = polygonAreaCentroid(cell);
            const currentArea = metrics.area;
            const targetArea = targetAreas[i];
            const areaError = targetArea - currentArea;
            totalError += Math.abs(areaError);

            // Move site toward its cell centroid for centroidal behavior.
            if (cell.length >= 3) {
                sites[i].x += (metrics.cx - sites[i].x) * centroidStep;
                sites[i].y += (metrics.cy - sites[i].y) * centroidStep;
            }

            // Adjust power weight to correct area mismatch.
            weights[i] += areaError * weightStep;

            // Keep sites within circular boundary.
            const dx = sites[i].x - cx;
            const dy = sites[i].y - cy;
            const dist = Math.sqrt((dx * dx) + (dy * dy)) || 1;
            const maxDist = Math.max(0, radius - 2);
            if (dist > maxDist) {
                sites[i].x = cx + ((dx / dist) * maxDist);
                sites[i].y = cy + ((dy / dist) * maxDist);
            }
        }

        if (totalError / Math.max(1, sites.length) < 0.35) break;
    }

    return { sites, cells };
}

function polygonPath(poly) {
    if (!poly || poly.length === 0) return '';
    return `M${poly.map(p => `${p[0]},${p[1]}`).join('L')}Z`;
}

// Build hierarchical data for main treemap
function buildMacroTreemapData(nutrients, showAllSubtypes) {
    const water = nutrients.water || 0;
    const protein = nutrients.protein || 0;
    const fat = nutrients.fat || 0;
    const carbs = nutrients.carbs || 0;
    const minerals = nutrients.minerals || 0;
    const sugars = nutrients.sugars || 0;
    const fiber = nutrients.fiber || 0;
    const starch = nutrients.starch || 0;
    const satFat = nutrients.satFat || 0;
    const monoFat = nutrients.monoFat || 0;
    const polyFat = nutrients.polyFat || 0;
    const transFat = nutrients.transFat || 0;
    const otherFat = nutrients.otherFat || 0;
    const aminoAcids = nutrients.aminoAcids || {};
    const mineralData = nutrients.mineralData || {};

    const children = [];

    // Water
    if (water > 0) {
        children.push({ name: "Water", value: water, color: treemapColors["Water"] });
    }

    // Protein - either as single block or with amino acid category subtypes
    if (protein > 0) {
        const hasAminoAcids = Object.keys(aminoAcids).length > 0;
        
        if (showAllSubtypes && hasAminoAcids) {
            // Group amino acids by category and sum totals
            const essentialNames = new Set([
                'Histidine', 'Isoleucine', 'Leucine', 'Lysine', 
                'Methionine', 'Phenylalanine', 'Threonine', 'Tryptophan', 'Valine'
            ]);
            const conditionalNames = new Set(['Arginine', 'Cystine', 'Tyrosine', 'Glycine', 'Proline']);
            
            let essentialTotal = 0;
            let conditionalTotal = 0;
            let nonEssentialTotal = 0;
            
            for (const [name, value] of Object.entries(aminoAcids)) {
                if (value > 0) {
                    if (essentialNames.has(name)) {
                        essentialTotal += value;
                    } else if (conditionalNames.has(name)) {
                        conditionalTotal += value;
                    } else {
                        nonEssentialTotal += value;
                    }
                }
            }
            
            const proteinChildren = [];
            if (essentialTotal > 0) proteinChildren.push({ name: "Essential", value: essentialTotal, color: "#43A047" });
            if (conditionalTotal > 0) proteinChildren.push({ name: "Conditional", value: conditionalTotal, color: "#00897B" });
            if (nonEssentialTotal > 0) proteinChildren.push({ name: "Non-Essential", value: nonEssentialTotal, color: "#26A69A" });
            
            if (proteinChildren.length > 0) {
                children.push({ name: "Protein", children: proteinChildren, color: treemapColors["Protein"] });
            } else {
                children.push({ name: "Protein", value: protein, color: treemapColors["Protein"] });
            }
        } else {
            children.push({ name: "Protein", value: protein, color: treemapColors["Protein"] });
        }
    }

    // Fat - either as single block or with subtypes
    if (fat > 0) {
        if (showAllSubtypes) {
            const fatChildren = [];
            if (satFat > 0) fatChildren.push({ name: "Sat.", value: satFat, color: treemapColors["Sat."] });
            if (monoFat > 0) fatChildren.push({ name: "Mono", value: monoFat, color: treemapColors["Mono"] });
            if (polyFat > 0) fatChildren.push({ name: "Poly", value: polyFat, color: treemapColors["Poly"] });
            if (transFat > 0) fatChildren.push({ name: "Trans", value: transFat, color: treemapColors["Trans"] });
            if (otherFat > 0) fatChildren.push({ name: "Other Fats", value: otherFat, color: treemapColors["Other Fats"] });
            
            if (fatChildren.length > 0) {
                children.push({ name: "Fat", children: fatChildren, color: treemapColors["Fat"] });
            } else {
                children.push({ name: "Fat", value: fat, color: treemapColors["Fat"] });
            }
        } else {
            children.push({ name: "Fat", value: fat, color: treemapColors["Fat"] });
        }
    }

    // Carbs - either as single block or with subtypes
    if (carbs > 0) {
        if (showAllSubtypes) {
            const carbChildren = [];
            if (sugars > 0) carbChildren.push({ name: "Sugars", value: sugars, color: treemapColors["Sugars"] });
            if (fiber > 0) carbChildren.push({ name: "Fiber", value: fiber, color: treemapColors["Fiber"] });
            if (starch > 0) carbChildren.push({ name: "Starch", value: starch, color: treemapColors["Starch"] });
            
            if (carbChildren.length > 0) {
                children.push({ name: "Carbs", children: carbChildren, color: treemapColors["Carbs"] });
            } else {
                children.push({ name: "Carbs", value: carbs, color: treemapColors["Carbs"] });
            }
        } else {
            children.push({ name: "Carbs", value: carbs, color: treemapColors["Carbs"] });
        }
    }

    // Minerals - split into Sodium + Minerals when showing subtypes
    if (minerals > 0) {
        if (showAllSubtypes && mineralData.sodium > 0) {
            const sodiumG = mineralData.sodium / 1000; // Convert mg to g
            const otherMinerals = Math.max(0, minerals - sodiumG);
            
            const mineralChildren = [];
            mineralChildren.push({ name: "Sodium", value: sodiumG, color: treemapColors["Sodium"] });
            if (otherMinerals > 0) {
                mineralChildren.push({ name: "Other Minerals", value: otherMinerals, color: treemapColors["Minerals"] });
            }
            children.push({ name: "Minerals", children: mineralChildren, color: treemapColors["Minerals"] });
        } else {
            children.push({ name: "Minerals", value: minerals, color: treemapColors["Minerals"] });
        }
    }

    return { name: "Nutrients", children };
}

// Build data for fat-only treemap
function buildFatTreemapData(nutrients) {
    const satFat = nutrients.satFat || 0;
    const monoFat = nutrients.monoFat || 0;
    const polyFat = nutrients.polyFat || 0;
    const transFat = nutrients.transFat || 0;
    const otherFat = nutrients.otherFat || 0;

    const children = [];
    if (satFat > 0) children.push({ name: "Saturated", value: satFat, color: treemapColors["Sat."] });
    if (monoFat > 0) children.push({ name: "Monounsaturated", value: monoFat, color: treemapColors["Mono"] });
    if (polyFat > 0) children.push({ name: "Polyunsaturated", value: polyFat, color: treemapColors["Poly"] });
    if (transFat > 0) children.push({ name: "Trans Fat", value: transFat, color: treemapColors["Trans"] });
    if (otherFat > 0) children.push({ name: "Other", value: otherFat, color: treemapColors["Other Fats"] });

    return { name: "Fat", children };
}

// Build data for carbs-only treemap
function buildCarbsTreemapData(nutrients) {
    const sugars = nutrients.sugars || 0;
    const fiber = nutrients.fiber || 0;
    const starch = nutrients.starch || 0;

    const children = [];
    if (sugars > 0) children.push({ name: "Sugars", value: sugars, color: treemapColors["Sugars"] });
    if (fiber > 0) children.push({ name: "Fiber", value: fiber, color: treemapColors["Fiber"] });
    if (starch > 0) children.push({ name: "Starch", value: starch, color: treemapColors["Starch"] });

    return { name: "Carbs", children };
}

// Build data for minerals treemap
function buildMineralsTreemapData(nutrients, showDetails) {
    const m = nutrients.mineralData || {};
    
    // Check if we have any mineral data
    const hasMineralData = Object.values(m).some(v => v > 0);
    
    if (!hasMineralData) {
        return { name: "Minerals", children: [] };
    }

    // Sodium value (for separate Salt category when showSodiumSeparately is true)
    const sodiumValue = m.sodium || 0;

    // Functional groupings for minerals:
    // 1. Hydration & Nerves: Potassium, Chloride (Sodium separate if showSodiumSeparately)
    const hydrationNerves = [];
    // Only include sodium in this group if NOT showing separately
    if (!showSodiumSeparately && m.sodium > 0) {
        hydrationNerves.push({ name: "Sodium", value: m.sodium, color: treemapColors["Sodium"] });
    }
    if (m.potassium > 0) hydrationNerves.push({ name: "Potassium", value: m.potassium, color: treemapColors["Potassium"] });
    if (m.chloride > 0) hydrationNerves.push({ name: "Chloride", value: m.chloride, color: treemapColors["Chloride"] || "#7B68EE" });
    
    // 2. Bones & Structure: Calcium, Phosphorus, Magnesium
    const bonesStructure = [];
    if (m.calcium > 0) bonesStructure.push({ name: "Calcium", value: m.calcium, color: treemapColors["Calcium"] });
    if (m.phosphorus > 0) bonesStructure.push({ name: "Phosphorus", value: m.phosphorus, color: treemapColors["Phosphorus"] });
    if (m.magnesium > 0) bonesStructure.push({ name: "Magnesium", value: m.magnesium, color: treemapColors["Magnesium"] });
    
    // 3. Energy & Circulation: Iron, Copper, Chromium, Manganese, Molybdenum
    const energyCirculation = [];
    if (m.iron > 0) energyCirculation.push({ name: "Iron", value: m.iron, color: treemapColors["Iron"] });
    if (m.copper > 0) energyCirculation.push({ name: "Copper", value: m.copper, color: treemapColors["Copper"] });
    if (m.chromium > 0) energyCirculation.push({ name: "Chromium", value: m.chromium, color: treemapColors["Chromium"] || "#8B5FCF" });
    if (m.manganese > 0) energyCirculation.push({ name: "Manganese", value: m.manganese, color: treemapColors["Manganese"] });
    if (m.molybdenum > 0) energyCirculation.push({ name: "Molybdenum", value: m.molybdenum, color: treemapColors["Molybdenum"] || "#9370DB" });
    
    // 4. Growth & Defense: Zinc, Selenium, Iodine
    const growthDefense = [];
    if (m.zinc > 0) growthDefense.push({ name: "Zinc", value: m.zinc, color: treemapColors["Zinc"] });
    if (m.selenium > 0) growthDefense.push({ name: "Selenium", value: m.selenium, color: treemapColors["Selenium"] });
    if (m.iodine > 0) growthDefense.push({ name: "Iodine", value: m.iodine, color: treemapColors["Iodine"] || "#6A5ACD" });

    const children = [];

    if (!showDetails) {
        // Show functional group totals
        // If showSodiumSeparately is true, add Salt as its own category first
        if (showSodiumSeparately && sodiumValue > 0) {
            children.push({ name: "Salt", value: sodiumValue, color: treemapColors["Sodium"] });
        }
        
        const hydrationTotal = hydrationNerves.reduce((sum, e) => sum + e.value, 0);
        const bonesTotal = bonesStructure.reduce((sum, e) => sum + e.value, 0);
        const energyTotal = energyCirculation.reduce((sum, e) => sum + e.value, 0);
        const growthTotal = growthDefense.reduce((sum, e) => sum + e.value, 0);
        
        if (hydrationTotal > 0) children.push({ name: "Hydration & Nerves", value: hydrationTotal, color: treemapColors["Hydration & Nerves"] });
        if (bonesTotal > 0) children.push({ name: "Bones & Structure", value: bonesTotal, color: treemapColors["Bones & Structure"] });
        if (energyTotal > 0) children.push({ name: "Energy & Circulation", value: energyTotal, color: treemapColors["Energy & Circulation"] });
        if (growthTotal > 0) children.push({ name: "Growth & Defense", value: growthTotal, color: treemapColors["Growth & Defense"] });
    } else {
        // Show individual minerals grouped by function
        // If showSodiumSeparately is true, add Salt as its own category first
        if (showSodiumSeparately && sodiumValue > 0) {
            children.push({ name: "Salt", value: sodiumValue, color: treemapColors["Sodium"] });
        }
        
        if (hydrationNerves.length > 0) {
            children.push({
                name: "Hydration & Nerves",
                children: hydrationNerves.sort((a, b) => b.value - a.value),
                color: treemapColors["Hydration & Nerves"]
            });
        }
        if (bonesStructure.length > 0) {
            children.push({
                name: "Bones & Structure",
                children: bonesStructure.sort((a, b) => b.value - a.value),
                color: treemapColors["Bones & Structure"]
            });
        }
        if (energyCirculation.length > 0) {
            children.push({
                name: "Energy & Circulation",
                children: energyCirculation.sort((a, b) => b.value - a.value),
                color: treemapColors["Energy & Circulation"]
            });
        }
        if (growthDefense.length > 0) {
            children.push({
                name: "Growth & Defense",
                children: growthDefense.sort((a, b) => b.value - a.value),
                color: treemapColors["Growth & Defense"]
            });
        }
    }

    return { name: "Minerals", children };
}

// Build data for vitamins treemap
function buildVitaminsTreemapData(nutrients, showDetails) {
    const v = nutrients.vitaminData || {};
    
    // Check if we have any vitamin data
    const hasVitaminData = Object.values(v).some(val => val > 0);
    
    if (!hasVitaminData) {
        return { name: "Vitamins", children: [] };
    }

    // Functional groupings for vitamins:
    // 1. Energy & Metabolism: B vitamins (help release energy from food)
    const energyMetabolism = [];
    if (v.thiamin > 0) energyMetabolism.push({ name: "Thiamin (B1)", value: v.thiamin, color: treemapColors["Thiamin (B1)"] });
    if (v.riboflavin > 0) energyMetabolism.push({ name: "Riboflavin (B2)", value: v.riboflavin, color: treemapColors["Riboflavin (B2)"] });
    if (v.niacin > 0) energyMetabolism.push({ name: "Niacin (B3)", value: v.niacin, color: treemapColors["Niacin (B3)"] });
    if (v.pantothenicAcid > 0) energyMetabolism.push({ name: "Pantothenic (B5)", value: v.pantothenicAcid, color: treemapColors["Pantothenic (B5)"] });
    if (v.vitaminB6 > 0) energyMetabolism.push({ name: "Vitamin B-6", value: v.vitaminB6, color: treemapColors["Vitamin B-6"] });
    if (v.biotin > 0) energyMetabolism.push({ name: "Biotin", value: v.biotin / 1000, color: treemapColors["Biotin"] });
    if (v.folate > 0) energyMetabolism.push({ name: "Folate (B9)", value: v.folate / 1000, color: treemapColors["Folate (B9)"] });
    if (v.vitaminB12 > 0) energyMetabolism.push({ name: "Vitamin B-12", value: v.vitaminB12 / 1000, color: treemapColors["Vitamin B-12"] });
    if (v.choline > 0) energyMetabolism.push({ name: "Choline", value: v.choline, color: treemapColors["Choline"] });
    
    // 2. Growth & Regulation: A, C, D, E, K (immunity, tissues, hormones, protection)
    const growthRegulation = [];
    if (v.vitaminA > 0) growthRegulation.push({ name: "Vitamin A", value: v.vitaminA / 1000, color: treemapColors["Vitamin A"] });
    if (v.vitaminC > 0) growthRegulation.push({ name: "Vitamin C", value: v.vitaminC, color: treemapColors["Vitamin C"] });
    if (v.vitaminD > 0) growthRegulation.push({ name: "Vitamin D", value: v.vitaminD / 1000, color: treemapColors["Vitamin D"] });
    if (v.vitaminE > 0) growthRegulation.push({ name: "Vitamin E", value: v.vitaminE, color: treemapColors["Vitamin E"] });
    if (v.vitaminK > 0) growthRegulation.push({ name: "Vitamin K", value: v.vitaminK / 1000, color: treemapColors["Vitamin K"] });

    const children = [];

    if (!showDetails) {
        // Show functional group totals
        const energyTotal = energyMetabolism.reduce((sum, e) => sum + e.value, 0);
        const growthTotal = growthRegulation.reduce((sum, e) => sum + e.value, 0);
        
        if (energyTotal > 0) children.push({ name: "Energy & Metabolism", value: energyTotal, color: treemapColors["Energy & Metabolism"] });
        if (growthTotal > 0) children.push({ name: "Growth & Regulation", value: growthTotal, color: treemapColors["Growth & Regulation"] });
    } else {
        // Show individual vitamins grouped by function
        if (energyMetabolism.length > 0) {
            children.push({
                name: "Energy & Metabolism",
                children: energyMetabolism.sort((a, b) => b.value - a.value),
                color: treemapColors["Energy & Metabolism"]
            });
        }
        if (growthRegulation.length > 0) {
            children.push({
                name: "Growth & Regulation",
                children: growthRegulation.sort((a, b) => b.value - a.value),
                color: treemapColors["Growth & Regulation"]
            });
        }
    }

    return { name: "Vitamins", children };
}

// Build data for combined micronutrients treemap (minerals + vitamins)
function buildMicronutrientsTreemapData(nutrients, showDetails) {
    const m = nutrients.mineralData || {};
    const v = nutrients.vitaminData || {};
    
    const children = [];

    // Electrolytes (minerals)
    const electrolytes = [];
    if (m.sodium > 0) electrolytes.push({ name: "Sodium", value: m.sodium, color: treemapColors["Sodium"] });
    if (m.potassium > 0) electrolytes.push({ name: "Potassium", value: m.potassium, color: treemapColors["Potassium"] });
    
    // Macro minerals
    const macroMinerals = [];
    if (m.calcium > 0) macroMinerals.push({ name: "Calcium", value: m.calcium, color: treemapColors["Calcium"] });
    if (m.phosphorus > 0) macroMinerals.push({ name: "Phosphorus", value: m.phosphorus, color: treemapColors["Phosphorus"] });
    if (m.magnesium > 0) macroMinerals.push({ name: "Magnesium", value: m.magnesium, color: treemapColors["Magnesium"] });
    
    // Trace minerals
    const traceMinerals = [];
    if (m.iron > 0) traceMinerals.push({ name: "Iron", value: m.iron, color: treemapColors["Iron"] });
    if (m.zinc > 0) traceMinerals.push({ name: "Zinc", value: m.zinc, color: treemapColors["Zinc"] });
    if (m.copper > 0) traceMinerals.push({ name: "Copper", value: m.copper, color: treemapColors["Copper"] });
    if (m.manganese > 0) traceMinerals.push({ name: "Manganese", value: m.manganese, color: treemapColors["Manganese"] });
    if (m.selenium > 0) traceMinerals.push({ name: "Selenium", value: m.selenium, color: treemapColors["Selenium"] });

    // Water-soluble vitamins (normalize to mg scale)
    const waterSolubleVits = [];
    if (v.vitaminC > 0) waterSolubleVits.push({ name: "Vitamin C", value: v.vitaminC, color: treemapColors["Vitamin C"] });
    if (v.thiamin > 0) waterSolubleVits.push({ name: "Thiamin (B1)", value: v.thiamin, color: treemapColors["Thiamin (B1)"] });
    if (v.riboflavin > 0) waterSolubleVits.push({ name: "Riboflavin (B2)", value: v.riboflavin, color: treemapColors["Riboflavin (B2)"] });
    if (v.niacin > 0) waterSolubleVits.push({ name: "Niacin (B3)", value: v.niacin, color: treemapColors["Niacin (B3)"] });
    if (v.pantothenicAcid > 0) waterSolubleVits.push({ name: "Pantothenic (B5)", value: v.pantothenicAcid, color: treemapColors["Pantothenic (B5)"] });
    if (v.vitaminB6 > 0) waterSolubleVits.push({ name: "Vitamin B-6", value: v.vitaminB6, color: treemapColors["Vitamin B-6"] });
    if (v.folate > 0) waterSolubleVits.push({ name: "Folate (B9)", value: v.folate / 1000, color: treemapColors["Folate (B9)"] });
    if (v.vitaminB12 > 0) waterSolubleVits.push({ name: "Vitamin B-12", value: v.vitaminB12 / 1000, color: treemapColors["Vitamin B-12"] });
    if (v.choline > 0) waterSolubleVits.push({ name: "Choline", value: v.choline, color: treemapColors["Choline"] });
    
    // Fat-soluble vitamins
    const fatSolubleVits = [];
    if (v.vitaminA > 0) fatSolubleVits.push({ name: "Vitamin A", value: v.vitaminA / 1000, color: treemapColors["Vitamin A"] });
    if (v.vitaminD > 0) fatSolubleVits.push({ name: "Vitamin D", value: v.vitaminD / 1000, color: treemapColors["Vitamin D"] });
    if (v.vitaminE > 0) fatSolubleVits.push({ name: "Vitamin E", value: v.vitaminE, color: treemapColors["Vitamin E"] });
    if (v.vitaminK > 0) fatSolubleVits.push({ name: "Vitamin K", value: v.vitaminK / 1000, color: treemapColors["Vitamin K"] });

    if (!showDetails) {
        // Show categories: Salt (if showing separately), Minerals, and Vitamins
        const sodiumValue = m.sodium || 0;
        
        // Calculate mineral total (exclude sodium if showing separately)
        let mineralTotal = 0;
        if (!showSodiumSeparately) {
            mineralTotal = electrolytes.reduce((sum, e) => sum + e.value, 0);
        } else {
            // Exclude sodium from electrolytes total
            mineralTotal = electrolytes.filter(e => e.name !== "Sodium").reduce((sum, e) => sum + e.value, 0);
        }
        mineralTotal += macroMinerals.reduce((sum, e) => sum + e.value, 0) +
                       traceMinerals.reduce((sum, e) => sum + e.value, 0);
        
        const vitaminTotal = waterSolubleVits.reduce((sum, e) => sum + e.value, 0) +
                            fatSolubleVits.reduce((sum, e) => sum + e.value, 0);
        
        // Add Salt as separate category if toggle is on
        if (showSodiumSeparately && sodiumValue > 0) {
            children.push({ name: "Salt", value: sodiumValue, color: treemapColors["Sodium"] });
        }
        
        if (mineralTotal > 0) children.push({ name: "Minerals", value: mineralTotal, color: treemapColors["Minerals"] });
        if (vitaminTotal > 0) children.push({ name: "Vitamins", value: vitaminTotal, color: treemapColors["Vitamins"] });
    } else {
        // Show individual items grouped
        
        // Add Salt as separate category first if toggle is on
        if (showSodiumSeparately && m.sodium > 0) {
            children.push({ name: "Salt", value: m.sodium, color: treemapColors["Sodium"] });
        }
        
        // Filter sodium from electrolytes if showing separately
        const filteredElectrolytes = showSodiumSeparately 
            ? electrolytes.filter(e => e.name !== "Sodium")
            : electrolytes;
        
        if (filteredElectrolytes.length > 0) {
            children.push({
                name: "Electrolytes",
                children: filteredElectrolytes.sort((a, b) => b.value - a.value),
                color: treemapColors["Electrolytes"]
            });
        }
        if (macroMinerals.length > 0) {
            children.push({
                name: "Macro Minerals",
                children: macroMinerals.sort((a, b) => b.value - a.value),
                color: treemapColors["Macro Minerals"]
            });
        }
        if (traceMinerals.length > 0) {
            children.push({
                name: "Trace Minerals",
                children: traceMinerals.sort((a, b) => b.value - a.value),
                color: treemapColors["Trace Minerals"]
            });
        }
        if (waterSolubleVits.length > 0) {
            children.push({
                name: "Water-Soluble Vits",
                children: waterSolubleVits.sort((a, b) => b.value - a.value),
                color: treemapColors["Water-Soluble"]
            });
        }
        if (fatSolubleVits.length > 0) {
            children.push({
                name: "Fat-Soluble Vits",
                children: fatSolubleVits.sort((a, b) => b.value - a.value),
                color: treemapColors["Fat-Soluble"]
            });
        }
    }

    return { name: "Micronutrients", children };
}

// Build data for protein/amino acids treemap
function buildProteinTreemapData(nutrients, showDetails) {
    const aminoAcids = nutrients.aminoAcids || {};
    const protein = nutrients.protein || 0;
    
    // Check if we have amino acid data
    const hasAminoAcids = Object.keys(aminoAcids).length > 0;
    
    // If no amino acid data, just show total protein
    if (!hasAminoAcids) {
        if (protein > 0) {
            return { 
                name: "Protein", 
                children: [{ name: "Total Protein", value: protein, color: treemapColors["Protein"] }] 
            };
        }
        return { name: "Protein", children: [] };
    }

    // Essential amino acids (9 essential for adults)
    const essentialNames = new Set([
        'Histidine', 'Isoleucine', 'Leucine', 'Lysine', 
        'Methionine', 'Phenylalanine', 'Threonine', 'Tryptophan', 'Valine'
    ]);
    
    // Conditionally essential (can become essential under certain conditions)
    const conditionalNames = new Set(['Arginine', 'Cystine', 'Tyrosine', 'Glycine', 'Proline']);

    // Calculate totals and group amino acids by category
    let essentialTotal = 0;
    let conditionalTotal = 0;
    let nonEssentialTotal = 0;
    const essential = [];
    const conditional = [];
    const nonEssential = [];
    
    for (const [name, value] of Object.entries(aminoAcids)) {
        if (value > 0) {
            const item = { name, value, color: treemapColors[name] || "#54886A" };
            if (essentialNames.has(name)) {
                essential.push(item);
                essentialTotal += value;
            } else if (conditionalNames.has(name)) {
                conditional.push(item);
                conditionalTotal += value;
            } else {
                nonEssential.push(item);
                nonEssentialTotal += value;
            }
        }
    }

    const children = [];
    
    if (!showDetails) {
        // Show grouped totals only (Essential, Conditional, Non-Essential as single blocks)
        if (essentialTotal > 0) {
            children.push({ 
                name: "Essential", 
                value: essentialTotal, 
                color: "#43A047" 
            });
        }
        if (conditionalTotal > 0) {
            children.push({ 
                name: "Conditional", 
                value: conditionalTotal, 
                color: "#00897B" 
            });
        }
        if (nonEssentialTotal > 0) {
            children.push({ 
                name: "Non-Essential", 
                value: nonEssentialTotal, 
                color: "#26A69A" 
            });
        }
    } else {
        // Show individual amino acids grouped by category
        
        // Add essential amino acids group (bright greens)
        if (essential.length > 0) {
            children.push({
                name: "Essential",
                children: essential.sort((a, b) => b.value - a.value),
                color: "#43A047"
            });
        }
        
        // Add conditionally essential group (teals)
        if (conditional.length > 0) {
            children.push({
                name: "Conditional",
                children: conditional.sort((a, b) => b.value - a.value),
                color: "#00897B"
            });
        }
        
        // Add non-essential amino acids group (blue-greens)
        if (nonEssential.length > 0) {
            children.push({
                name: "Non-Essential",
                children: nonEssential.sort((a, b) => b.value - a.value),
                color: "#26A69A"
            });
        }
    }

    // If no amino acids were found after grouping, show total protein
    if (children.length === 0 && protein > 0) {
        return { 
            name: "Protein", 
            children: [{ name: "Total Protein", value: protein, color: treemapColors["Protein"] }] 
        };
    }

    return { name: "Protein", children };
}

// Render macro treemap with stable parent positions
function renderMacroTreemapStable(containerId, nutrients, showSubtypes) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    const { width, height } = getTreemapDimensions(containerId);

    // Build parent-level data (always the same structure for stable layout)
    const parentData = [];
    if (nutrients.water > 0) parentData.push({ name: "Water", value: nutrients.water, color: treemapColors["Water"] });
    if (nutrients.protein > 0) parentData.push({ name: "Protein", value: nutrients.protein, color: treemapColors["Protein"] });
    if (nutrients.fat > 0) parentData.push({ name: "Fat", value: nutrients.fat, color: treemapColors["Fat"] });
    if (nutrients.carbs > 0) parentData.push({ name: "Carbs", value: nutrients.carbs, color: treemapColors["Carbs"] });
    if (nutrients.minerals > 0) parentData.push({ name: "Minerals", value: nutrients.minerals, color: treemapColors["Minerals"] });

    if (parentData.length === 0) {
        container.innerHTML = '<p class="text-center text-muted p-4">No data available</p>';
        return;
    }

    // Create SVG
    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("width", "100%")
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("class", "treemap-svg")
        .style("max-width", "100%");

    // Layout parent blocks first (stable positions)
    const parentRoot = d3.hierarchy({ name: "root", children: parentData })
        .sum(d => d.value || 0)
        .sort((a, b) => b.value - a.value);

    d3.treemap()
        .size([width, height])
        .padding(2)
        .round(true)(parentRoot);

    // Get parent positions
    const parentPositions = {};
    parentRoot.leaves().forEach(d => {
        parentPositions[d.data.name] = { x0: d.x0, y0: d.y0, x1: d.x1, y1: d.y1, color: d.data.color };
    });

    // Now render either parent blocks or subdivided blocks
    if (!showSubtypes) {
        // Just render parent blocks
        const cells = svg.selectAll("g")
            .data(parentRoot.leaves())
            .join("g")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

        const rects = cells.append("rect")
            .attr("class", "treemap-cell")
            .attr("width", d => Math.max(0, d.x1 - d.x0))
            .attr("height", d => Math.max(0, d.y1 - d.y0))
            .attr("fill", d => d.data.color || "#666")
            .attr("rx", 3)
            .style("cursor", "pointer");
        
        addTreemapTooltip(rects, 'g');
        addTreemapLabels(cells);
    } else {
        // Render subdivided blocks within parent positions
        for (const [parentName, pos] of Object.entries(parentPositions)) {
            const parentWidth = pos.x1 - pos.x0;
            const parentHeight = pos.y1 - pos.y0;
            
            let childData = [];
            
            if (parentName === "Protein" && nutrients.aminoAcids && Object.keys(nutrients.aminoAcids).length > 0) {
                // Get protein subtypes
                const essentialNames = new Set(['Histidine', 'Isoleucine', 'Leucine', 'Lysine', 'Methionine', 'Phenylalanine', 'Threonine', 'Tryptophan', 'Valine']);
                const conditionalNames = new Set(['Arginine', 'Cystine', 'Tyrosine', 'Glycine', 'Proline']);
                let essentialTotal = 0, conditionalTotal = 0, nonEssentialTotal = 0;
                for (const [name, value] of Object.entries(nutrients.aminoAcids)) {
                    if (value > 0) {
                        if (essentialNames.has(name)) essentialTotal += value;
                        else if (conditionalNames.has(name)) conditionalTotal += value;
                        else nonEssentialTotal += value;
                    }
                }
                if (essentialTotal > 0) childData.push({ name: "Essential", value: essentialTotal, color: "#43A047" });
                if (conditionalTotal > 0) childData.push({ name: "Conditional", value: conditionalTotal, color: "#00897B" });
                if (nonEssentialTotal > 0) childData.push({ name: "Non-Ess.", value: nonEssentialTotal, color: "#26A69A" });
            } else if (parentName === "Fat") {
                if (nutrients.satFat > 0) childData.push({ name: "Sat.", value: nutrients.satFat, color: treemapColors["Sat."] });
                if (nutrients.monoFat > 0) childData.push({ name: "Mono", value: nutrients.monoFat, color: treemapColors["Mono"] });
                if (nutrients.polyFat > 0) childData.push({ name: "Poly", value: nutrients.polyFat, color: treemapColors["Poly"] });
                if (nutrients.transFat > 0) childData.push({ name: "Trans", value: nutrients.transFat, color: treemapColors["Trans"] });
                if (nutrients.otherFat > 0) childData.push({ name: "Other", value: nutrients.otherFat, color: treemapColors["Other Fats"] });
            } else if (parentName === "Carbs") {
                if (nutrients.sugars > 0) childData.push({ name: "Sugars", value: nutrients.sugars, color: treemapColors["Sugars"] });
                if (nutrients.fiber > 0) childData.push({ name: "Fiber", value: nutrients.fiber, color: treemapColors["Fiber"] });
                if (nutrients.starch > 0) childData.push({ name: "Starch", value: nutrients.starch, color: treemapColors["Starch"] });
            } else if (parentName === "Minerals") {
                // Break down "Minerals" into: Sodium (if showSodiumSeparately), Other Minerals, and Vitamins
                // Use the total minerals value (from Ash) as the base, not individual mineral sums
                const m = nutrients.mineralData || {};
                const v = nutrients.vitaminData || {};
                const totalMineralsG = nutrients.minerals || 0; // This is the total from Ash (already in grams)
                
                // Calculate sodium in grams (mineralData stores in mg)
                const sodiumG = (m.sodium || 0) / 1000;
                
                // Calculate "other minerals" using the total minerals value, not sum of individual minerals
                // This ensures we don't lose minerals that aren't individually listed (like in Branded foods)
                let otherMineralsG;
                if (showSodiumSeparately) {
                    // Other minerals = total minerals - sodium
                    otherMineralsG = Math.max(0, totalMineralsG - sodiumG);
                } else {
                    // Include all minerals (sodium is part of the total)
                    otherMineralsG = totalMineralsG;
                }
                
                // Calculate total vitamins in mg (converting µg to mg where needed)
                // Note: Most vitamins are in mg or µg - we'll display in mg for the macro treemap
                let vitaminsTotal = 0;
                for (const [key, val] of Object.entries(v)) {
                    if (val > 0) {
                        vitaminsTotal += val; // Already in mg or µg from API
                    }
                }
                const vitaminsG = vitaminsTotal / 1000; // Convert to grams for display
                
                // Add Sodium/Salt if showing separately
                if (showSodiumSeparately && sodiumG > 0) {
                    childData.push({ name: "Salt", value: sodiumG, color: treemapColors["Sodium"] });
                }
                
                // Add Minerals (other than sodium if showing separately)
                if (otherMineralsG > 0) {
                    childData.push({ name: "Minerals", value: otherMineralsG, color: treemapColors["Minerals"] });
                }
                
                // Add Vitamins
                if (vitaminsG > 0) {
                    childData.push({ name: "Vitamins", value: vitaminsG, color: treemapColors["Vitamins"] || "#FFA726" });
                }
            }

            if (childData.length > 0) {
                // Create sub-treemap within parent area
                const childRoot = d3.hierarchy({ name: parentName, children: childData })
                    .sum(d => d.value || 0)
                    .sort((a, b) => b.value - a.value);

                d3.treemap()
                    .size([parentWidth - 2, parentHeight - 2])
                    .padding(1)
                    .round(true)(childRoot);

                const cells = svg.selectAll(`.cells-${parentName}`)
                    .data(childRoot.leaves())
                    .join("g")
                    .attr("class", `cells-${parentName}`)
                    .attr("transform", d => `translate(${pos.x0 + 1 + d.x0},${pos.y0 + 1 + d.y0})`);

                const childRects = cells.append("rect")
                    .attr("class", "treemap-cell")
                    .attr("width", d => Math.max(0, d.x1 - d.x0))
                    .attr("height", d => Math.max(0, d.y1 - d.y0))
                    .attr("fill", d => d.data.color || pos.color)
                    .attr("rx", 2)
                    .style("cursor", "pointer");
                
                addTreemapTooltip(childRects, 'g');
                addTreemapLabels(cells);
            } else {
                // No children, just render parent block
                const cell = svg.append("g")
                    .attr("transform", `translate(${pos.x0},${pos.y0})`);

                const nutrientValue = nutrients[parentName.toLowerCase()] || 0;
                const singleRect = cell.append("rect")
                    .attr("class", "treemap-cell")
                    .attr("id", `treemap-${parentName.replace(/[^a-zA-Z0-9]/g, '_')}`)
                    .attr("width", Math.max(0, parentWidth))
                    .attr("height", Math.max(0, parentHeight))
                    .attr("fill", pos.color)
                    .attr("rx", 3)
                    .style("cursor", "pointer");
                
                addSingleRectTooltip(singleRect, parentName, nutrientValue, 'g');
                addTreemapLabelsToCell(cell, parentName, nutrientValue, parentWidth, parentHeight);
            }
        }
    }

    return svg;
}

// Helper to add tooltips and titles to a rect selection (data-bound)
function addTreemapTooltip(rectSelection, unit = 'g') {
    const tooltip = document.getElementById('treemapTooltip');
    
    rectSelection
        .attr("id", d => `treemap-${d.data.name.replace(/[^a-zA-Z0-9]/g, '_')}`)
        .on("mouseenter", function(event, d) {
            d3.select(this).style("opacity", 0.8);
            if (tooltip) {
                const valueText = `${d.value.toFixed(2)}${unit}`;
                tooltip.innerHTML = `<strong>${d.data.name}</strong><br>${valueText}`;
                tooltip.style.opacity = 1;
                tooltip.style.left = (event.clientX + 15) + 'px';
                tooltip.style.top = (event.clientY - 10) + 'px';
            }
        })
        .on("mousemove", function(event) {
            if (tooltip) {
                tooltip.style.left = (event.clientX + 15) + 'px';
                tooltip.style.top = (event.clientY - 10) + 'px';
            }
        })
        .on("mouseleave", function() {
            d3.select(this).style("opacity", 1);
            if (tooltip) {
                tooltip.style.opacity = 0;
            }
        });
    
    // Add SVG title for accessibility and SVG viewer tooltips
    rectSelection.append("title")
        .text(d => `${d.data.name}: ${d.value.toFixed(2)}${unit}`);
}

// Helper to add tooltips and titles to a single rect (not data-bound)
function addSingleRectTooltip(rectSelection, name, value, unit = 'g') {
    const tooltip = document.getElementById('treemapTooltip');
    
    rectSelection
        .on("mouseenter", function(event) {
            d3.select(this).style("opacity", 0.8);
            if (tooltip) {
                const valueText = `${value.toFixed(2)}${unit}`;
                tooltip.innerHTML = `<strong>${name}</strong><br>${valueText}`;
                tooltip.style.opacity = 1;
                tooltip.style.left = (event.clientX + 15) + 'px';
                tooltip.style.top = (event.clientY - 10) + 'px';
            }
        })
        .on("mousemove", function(event) {
            if (tooltip) {
                tooltip.style.left = (event.clientX + 15) + 'px';
                tooltip.style.top = (event.clientY - 10) + 'px';
            }
        })
        .on("mouseleave", function() {
            d3.select(this).style("opacity", 1);
            if (tooltip) {
                tooltip.style.opacity = 0;
            }
        });
    
    // Add SVG title for accessibility and SVG viewer tooltips
    rectSelection.append("title")
        .text(`${name}: ${value.toFixed(2)}${unit}`);
}

// Helper to add labels to treemap cells
function addTreemapLabels(cells) {
    cells.each(function(d) {
        const cellWidth = d.x1 - d.x0;
        const cellHeight = d.y1 - d.y0;
        const g = d3.select(this);

        if (cellWidth > 40 && cellHeight > 25) {
            g.append("text")
                .attr("class", "treemap-label")
                .attr("x", 5)
                .attr("y", 15)
                .text(d.data.name);

            if (cellHeight > 35) {
                g.append("text")
                    .attr("class", "treemap-value")
                    .attr("x", 5)
                    .attr("y", 28)
                    .text(`${d.value.toFixed(1)}g`);
            }
        } else if (cellWidth > 25 && cellHeight > 15) {
            g.append("text")
                .attr("class", "treemap-value")
                .attr("x", 3)
                .attr("y", 12)
                .style("font-size", "9px")
                .text(`${d.value.toFixed(1)}g`);
        }
    });
}

// Helper to add labels to a single cell
function addTreemapLabelsToCell(g, name, value, cellWidth, cellHeight) {
    if (cellWidth > 40 && cellHeight > 25) {
        g.append("text")
            .attr("class", "treemap-label")
            .attr("x", 5)
            .attr("y", 15)
            .text(name);

        if (cellHeight > 35) {
            g.append("text")
                .attr("class", "treemap-value")
                .attr("x", 5)
                .attr("y", 28)
                .text(`${value.toFixed(1)}g`);
        }
    } else if (cellWidth > 25 && cellHeight > 15) {
        g.append("text")
            .attr("class", "treemap-value")
            .attr("x", 3)
            .attr("y", 12)
            .style("font-size", "9px")
            .text(`${value.toFixed(1)}g`);
    }
}

// Render a treemap
function renderTreemap(containerId, data, title, unit = 'g') {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear existing
    container.innerHTML = '';

    if (!data.children || data.children.length === 0) {
        container.innerHTML = '<p class="text-center text-muted p-4">No data available</p>';
        return;
    }

    const { width, height } = getTreemapDimensions(containerId);

    // Create SVG with responsive viewBox
    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("width", "100%")
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("class", "treemap-svg")
        .style("max-width", "100%");

    // Create hierarchy
    const root = d3.hierarchy(data)
        .sum(d => d.value || 0)
        .sort((a, b) => b.value - a.value);

    // Create treemap layout
    d3.treemap()
        .size([width, height])
        .padding(2)
        .round(true)(root);

    // Draw cells
    const cells = svg.selectAll("g")
        .data(root.leaves())
        .join("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    // Get tooltip element
    const tooltip = document.getElementById('treemapTooltip');

    // Rectangles
    const rects = cells.append("rect")
        .attr("class", "treemap-cell")
        .attr("id", d => `treemap-${d.data.name.replace(/[^a-zA-Z0-9]/g, '_')}`)
        .attr("width", d => Math.max(0, d.x1 - d.x0))
        .attr("height", d => Math.max(0, d.y1 - d.y0))
        .attr("fill", d => d.data.color || "#666")
        .attr("rx", 3)
        .style("cursor", "pointer")
        .on("mouseenter", function(event, d) {
            d3.select(this).style("opacity", 0.8);
            // Show tooltip
            if (tooltip) {
                const valueText = `${d.value.toFixed(2)}${unit}`;
                tooltip.innerHTML = `<strong>${d.data.name}</strong><br>${valueText}`;
                tooltip.style.opacity = 1;
                tooltip.style.left = (event.clientX + 15) + 'px';
                tooltip.style.top = (event.clientY - 10) + 'px';
            }
        })
        .on("mousemove", function(event, d) {
            // Update tooltip position on move
            if (tooltip) {
                tooltip.style.left = (event.clientX + 15) + 'px';
                tooltip.style.top = (event.clientY - 10) + 'px';
            }
        })
        .on("mouseleave", function(event, d) {
            d3.select(this).style("opacity", 1);
            // Hide tooltip
            if (tooltip) {
                tooltip.style.opacity = 0;
            }
        });

    // Add SVG title element for accessibility and SVG viewer tooltips
    rects.append("title")
        .text(d => `${d.data.name}: ${d.value.toFixed(2)}${unit}`);

    // Labels - only show if cell is big enough
    cells.each(function(d) {
        const cellWidth = d.x1 - d.x0;
        const cellHeight = d.y1 - d.y0;
        const g = d3.select(this);

        // Only add labels if cell is large enough
        if (cellWidth > 40 && cellHeight > 25) {
            g.append("text")
                .attr("class", "treemap-label")
                .attr("x", 5)
                .attr("y", 15)
                .text(d.data.name);

            if (cellHeight > 35) {
                g.append("text")
                    .attr("class", "treemap-value")
                    .attr("x", 5)
                    .attr("y", 28)
                    .text(`${d.value.toFixed(1)}${unit}`);
            }
        } else if (cellWidth > 25 && cellHeight > 15) {
            // Abbreviated label for smaller cells
            g.append("text")
                .attr("class", "treemap-value")
                .attr("x", 3)
                .attr("y", 12)
                .style("font-size", "9px")
                .text(`${d.value.toFixed(1)}${unit}`);
        }
    });

    return svg;
}

// Helper to show/hide a treemap container and its parent column
function toggleTreemapVisibility(containerId, show) {
    const container = document.getElementById(containerId);
    if (container) {
        // Find the parent column (col-lg-4, etc.)
        const parentCol = container.closest('.col-lg-4, .col-md-6, .col-12');
        if (parentCol) {
            parentCol.style.display = show ? '' : 'none';
        }
    }
}

// Render a stacked bar chart from treemap data
function renderStackedBar(containerId, data, title, unit = 'g') {
    const container = document.getElementById(containerId);
    if (!container || !data || !data.children || data.children.length === 0) {
        if (container) container.innerHTML = '<p class="text-center text-muted p-4">No data available</p>';
        return;
    }

    // Clear container
    container.innerHTML = '';
    container.classList.add('stackedbar-container');

    // Calculate total
    const total = data.children.reduce((sum, d) => sum + (d.value || 0), 0);
    if (total <= 0) {
        container.innerHTML = '<p class="text-center text-muted p-4">No data available</p>';
        return;
    }

    // Get dimensions
    const containerWidth = container.clientWidth || 600;
    const height = 60;
    const labelHeight = 80;
    const margin = { left: 10, right: 10, top: 5, bottom: 5 };
    const barWidth = containerWidth - margin.left - margin.right;

    // Create SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', containerWidth)
        .attr('height', height + labelHeight)
        .attr('class', 'stacked-bar-chart');

    // Create bar group
    const barGroup = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Calculate segment widths
    let currentX = 0;
    const segments = data.children.map(d => {
        const width = (d.value / total) * barWidth;
        const segment = {
            name: d.name,
            value: d.value,
            percentage: (d.value / total) * 100,
            x: currentX,
            width: width,
            color: d.color || treemapColors[d.name] || '#666'
        };
        currentX += width;
        return segment;
    }).filter(s => s.width > 0);

    // Draw segments
    const segmentGroups = barGroup.selectAll('.segment')
        .data(segments)
        .enter()
        .append('g')
        .attr('class', 'segment');

    // Segment rectangles
    segmentGroups.append('rect')
        .attr('x', d => d.x)
        .attr('y', 0)
        .attr('width', d => d.width)
        .attr('height', height - margin.top - margin.bottom)
        .attr('fill', d => d.color)
        .attr('stroke', '#f8f4ea')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.8);
            const tooltip = document.getElementById('treemapTooltip');
            if (tooltip) {
                tooltip.innerHTML = `<strong>${d.name}</strong><br>${d.value.toFixed(2)}${unit}<br>${d.percentage.toFixed(1)}%`;
                tooltip.style.opacity = 1;
                tooltip.style.left = (event.clientX + 10) + 'px';
                tooltip.style.top = (event.clientY - 10) + 'px';
            }
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
            const tooltip = document.getElementById('treemapTooltip');
            if (tooltip) tooltip.style.opacity = 0;
        });

    // Add labels below the bar
    const labelGroup = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${height + 5})`);

    // Only show labels for segments wide enough
    segments.forEach((d, i) => {
        if (d.width > 30) {
            const centerX = d.x + d.width / 2;
            
            // Name label
            labelGroup.append('text')
                .attr('x', centerX)
                .attr('y', 15)
                .attr('text-anchor', 'middle')
                .attr('fill', '#333')
                .style('font-size', d.width > 60 ? '12px' : '10px')
                .style('font-weight', '600')
                .text(d.name.length > 10 && d.width < 80 ? d.name.substring(0, 8) + '...' : d.name);

            // Value label
            labelGroup.append('text')
                .attr('x', centerX)
                .attr('y', 30)
                .attr('text-anchor', 'middle')
                .attr('fill', '#666')
                .style('font-size', '10px')
                .text(`${d.value.toFixed(1)}${unit}`);

            // Percentage label
            labelGroup.append('text')
                .attr('x', centerX)
                .attr('y', 45)
                .attr('text-anchor', 'middle')
                .attr('fill', '#888')
                .style('font-size', '10px')
                .text(`${d.percentage.toFixed(1)}%`);
        }
    });

    // Add connecting lines from bar to labels
    segments.forEach(d => {
        if (d.width > 30) {
            const centerX = d.x + d.width / 2;
            labelGroup.append('line')
                .attr('x1', centerX)
                .attr('y1', -5)
                .attr('x2', centerX)
                .attr('y2', 2)
                .attr('stroke', d.color)
                .attr('stroke-width', 2);
        }
    });

    // Add color key/legend for each stacked bar chart
    const legend = document.createElement('div');
    legend.className = 'stacked-bar-legend';
    segments.forEach((segment) => {
        const item = document.createElement('div');
        item.className = 'stacked-bar-legend-item';
        item.innerHTML = `
            <span class="stacked-bar-legend-swatch" style="background:${segment.color}"></span>
            <span class="stacked-bar-legend-label">${segment.name}</span>
        `;
        legend.appendChild(item);
    });
    container.appendChild(legend);
}

function renderCirclePack(containerId, data, title, unit = 'g') {
    const container = document.getElementById(containerId);
    if (!container || !data || !data.children || data.children.length === 0) {
        if (container) container.innerHTML = '<p class="text-center text-muted p-4">No data available</p>';
        return;
    }

    container.innerHTML = '';
    const { width, height } = getCirclePackDimensions(containerId);
    const size = Math.min(width, height);
    const tooltip = document.getElementById('treemapTooltip');

    const root = d3.hierarchy(data)
        .sum(d => d.value || 0)
        .sort((a, b) => b.value - a.value);

    d3.pack()
        .size([size, size])
        .padding(4)(root);

    const svg = d3.select(container)
        .append('svg')
        .attr('class', 'circlepack-svg')
        .attr('width', '100%')
        .attr('height', height)
        .attr('viewBox', `0 0 ${size} ${size}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const nodes = svg.append('g')
        .selectAll('g')
        .data(root.descendants().filter(d => d.depth > 0))
        .enter()
        .append('g')
        .attr('transform', d => `translate(${d.x},${d.y})`);

    nodes.append('circle')
        .attr('r', d => d.r)
        .attr('fill', d => {
            if (d.children) return d.data.color || '#ddd';
            return d.data.color || d.parent?.data?.color || '#999';
        })
        .attr('fill-opacity', d => d.children ? 0.35 : 0.9)
        .attr('stroke', d => d.data.color || '#777')
        .attr('stroke-width', d => d.children ? 2 : 1.2)
        .style('cursor', 'pointer')
        .on('mouseenter', function(event, d) {
            d3.select(this).attr('opacity', 0.85);
            if (tooltip) {
                const amount = getNodeDisplayValue(d);
                tooltip.innerHTML = `<strong>${d.data.name}</strong><br>${amount.toFixed(2)}${unit}`;
                tooltip.style.opacity = 1;
                tooltip.style.left = (event.clientX + 12) + 'px';
                tooltip.style.top = (event.clientY - 8) + 'px';
            }
        })
        .on('mousemove', function(event) {
            if (tooltip) {
                tooltip.style.left = (event.clientX + 12) + 'px';
                tooltip.style.top = (event.clientY - 8) + 'px';
            }
        })
        .on('mouseleave', function() {
            d3.select(this).attr('opacity', 1);
            if (tooltip) tooltip.style.opacity = 0;
        });

    nodes.append('title')
        .text(d => `${d.data.name}: ${getNodeDisplayValue(d).toFixed(2)}${unit}`);

    // Nutrient/category names are always on.
    nodes.filter(d => d.r > 16)
        .append('text')
        .attr('class', 'circlepack-label')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .style('font-size', d => `${Math.max(9, Math.min(13, d.r / 3))}px`)
        .text(d => {
            if (!d.data?.name) return '';
            if (d.r < 24 && d.data.name.length > 10) return `${d.data.name.slice(0, 8)}...`;
            return d.data.name;
        });

    const legendItems = root.leaves().map(leaf => ({
        name: leaf.data.name,
        value: getNodeDisplayValue(leaf),
        color: leaf.data.color || leaf.parent?.data?.color || '#888'
    }));
    renderNutrientKey(container, legendItems, unit, circlePackShowLabels);
}

function flattenVoronoiItems(data) {
    if (!data || !Array.isArray(data.children)) return [];
    const items = [];
    data.children.forEach((child) => {
        if (Array.isArray(child.children) && child.children.length > 0) {
            child.children.forEach((sub) => {
                const value = sub.value || 0;
                if (value > 0) {
                    items.push({
                        name: sub.name,
                        value,
                        color: sub.color || child.color || treemapColors[sub.name] || '#888',
                        group: child.name
                    });
                }
            });
            return;
        }
        const value = child.value || 0;
        if (value > 0) {
            items.push({
                name: child.name,
                value,
                color: child.color || treemapColors[child.name] || '#888',
                group: child.name
            });
        }
    });
    return items;
}

function renderCircularVoronoi(containerId, data, title, unit = 'g') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const rawItems = flattenVoronoiItems(data);
    if (rawItems.length === 0) {
        container.innerHTML = '<p class="text-center text-muted p-4">No data available</p>';
        return;
    }

    const items = rawItems.slice().sort((a, b) => b.value - a.value);
    const { width, height } = getVoronoiDimensions(containerId);
    const size = Math.min(width, height);
    const cx = size / 2;
    const cy = size / 2;
    const radius = (size / 2) - 8;
    const tooltip = document.getElementById('treemapTooltip');

    const svg = d3.select(container)
        .append('svg')
        .attr('class', 'voronoi-svg')
        .attr('width', '100%')
        .attr('height', height)
        .attr('viewBox', `0 0 ${size} ${size}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    svg.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', radius)
        .attr('fill', '#f7f8f3')
        .attr('stroke', '#bcc6ac')
        .attr('stroke-width', 2);

    const g = svg.append('g');

    const totalValue = Math.max(1e-9, d3.sum(items, d => d.value));
    const circleArea = Math.PI * radius * radius;
    const targetAreas = items.map(item => (item.value / totalValue) * circleArea);

    // Initial sites on a golden-angle spiral for stable convergence.
    const golden = Math.PI * (3 - Math.sqrt(5));
    const sites = items.map((_, i) => {
        const t = (i + 1) / (items.length + 1);
        const r = radius * Math.sqrt(t) * 0.85;
        const a = i * golden;
        return { x: cx + (r * Math.cos(a)), y: cy + (r * Math.sin(a)) };
    });

    const solved = solveWeightedVoronoi(sites, targetAreas, cx, cy, radius, {
        maxIterations: 70,
        centroidStep: 0.42,
        weightStep: 0.85,
        boundarySides: 80
    });

    const cellsData = items.map((item, i) => ({
        ...item,
        cell: solved.cells[i] || [],
        site: solved.sites[i] || sites[i]
    }));

    const cells = g.selectAll('path')
        .data(cellsData)
        .enter()
        .append('path')
        .attr('d', d => polygonPath(d.cell))
        .attr('fill', d => d.color || '#999')
        .attr('fill-opacity', 0.86)
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .on('mouseenter', function(event, d) {
            d3.select(this).attr('fill-opacity', 1);
            if (tooltip) {
                tooltip.innerHTML = `<strong>${d.name}</strong><br>${d.value.toFixed(2)}${unit}`;
                tooltip.style.opacity = 1;
                tooltip.style.left = (event.clientX + 12) + 'px';
                tooltip.style.top = (event.clientY - 8) + 'px';
            }
        })
        .on('mousemove', function(event) {
            if (tooltip) {
                tooltip.style.left = (event.clientX + 12) + 'px';
                tooltip.style.top = (event.clientY - 8) + 'px';
            }
        })
        .on('mouseleave', function() {
            d3.select(this).attr('fill-opacity', 0.86);
            if (tooltip) tooltip.style.opacity = 0;
        });

    cells.append('title').text(d => `${d.name}: ${d.value.toFixed(2)}${unit}`);

    // Nutrient names always on (value amounts shown in legend toggle).
    g.selectAll('text')
        .data(cellsData.filter(d => (polygonAreaCentroid(d.cell).area / circleArea) > 0.028))
        .enter()
        .append('text')
        .attr('class', 'voronoi-label')
        .attr('x', d => {
            const c = polygonAreaCentroid(d.cell);
            return c.cx;
        })
        .attr('y', d => {
            const c = polygonAreaCentroid(d.cell);
            return c.cy;
        })
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .style('font-size', d => {
            const frac = polygonAreaCentroid(d.cell).area / circleArea;
            return `${Math.max(9, Math.min(13, 8 + (frac * 28)))}px`;
        })
        .text(d => d.name.length > 12 ? `${d.name.slice(0, 10)}...` : d.name);

    renderNutrientKey(container, items, unit, voronoiShowLabels);
}

// Render stacked bar for macronutrients (special handling for layout stability)
function renderMacroStackedBar(containerId, nutrients, showAllSubtypes) {
    const data = buildMacroTreemapData(nutrients, showAllSubtypes);
    renderStackedBar(containerId, data, 'Macronutrients', 'g');
}

// Update all treemaps with current data
function updateTreemaps() {
    if (!currentTreemapData) return;

    const { fat, carbs, protein, mineralData, vitaminData } = currentTreemapData;

    // Row 1: Main macro treemap
    renderMacroTreemapStable('treemapContainer', currentTreemapData, showSubtypes);

    // Row 2: Fat, Carbs, Protein breakdowns
    // Fat-only - hide if no fat
    const hasFat = fat > 0;
    toggleTreemapVisibility('fatTreemapContainer', hasFat);
    if (hasFat) {
        const fatData = buildFatTreemapData(currentTreemapData);
        renderTreemap('fatTreemapContainer', fatData, 'Fat Breakdown');
    }

    // Carbs-only - hide if no carbs
    const hasCarbs = carbs > 0;
    toggleTreemapVisibility('carbsTreemapContainer', hasCarbs);
    if (hasCarbs) {
        const carbsData = buildCarbsTreemapData(currentTreemapData);
        renderTreemap('carbsTreemapContainer', carbsData, 'Carbs Breakdown');
    }

    // Protein/amino acids - hide if no protein
    const hasProtein = protein > 0;
    toggleTreemapVisibility('proteinTreemapContainer', hasProtein);
    if (hasProtein) {
        const proteinData = buildProteinTreemapData(currentTreemapData, showSubtypes);
        renderTreemap('proteinTreemapContainer', proteinData, 'Protein Breakdown');
    }

    // Row 3: Combined Micronutrients (Minerals + Vitamins)
    const hasMinerals = mineralData && Object.values(mineralData).some(v => v > 0);
    const hasVitamins = vitaminData && Object.values(vitaminData).some(v => v > 0);
    const hasMicronutrients = hasMinerals || hasVitamins;
    const micronutrientsContainer = document.getElementById('micronutrientsTreemapContainer');
    if (micronutrientsContainer) {
        const parentRow = micronutrientsContainer.closest('.row');
        if (parentRow) {
            parentRow.style.display = hasMicronutrients ? '' : 'none';
        }
    }
    if (hasMicronutrients) {
        const micronutrientsData = buildMicronutrientsTreemapData(currentTreemapData, showSubtypes);
        renderTreemap('micronutrientsTreemapContainer', micronutrientsData, 'Micronutrients Breakdown', 'mg');
    }

    // Row 4: Minerals
    const mineralsContainer = document.getElementById('mineralsTreemapContainer');
    if (mineralsContainer) {
        const parentRow = mineralsContainer.closest('.row');
        if (parentRow) {
            parentRow.style.display = hasMinerals ? '' : 'none';
        }
    }
    if (hasMinerals) {
        const mineralsData = buildMineralsTreemapData(currentTreemapData, showSubtypes);
        renderTreemap('mineralsTreemapContainer', mineralsData, 'Minerals Breakdown', 'mg');
    }

    // Row 5: Vitamins treemap
    const vitaminsContainer = document.getElementById('vitaminsTreemapContainer');
    if (vitaminsContainer) {
        const parentRow = vitaminsContainer.closest('.row');
        if (parentRow) {
            parentRow.style.display = hasVitamins ? '' : 'none';
        }
    }
    if (hasVitamins) {
        const vitaminsData = buildVitaminsTreemapData(currentTreemapData, showSubtypes);
        renderTreemap('vitaminsTreemapContainer', vitaminsData, 'Vitamins Breakdown', 'mg');
    }

    // Enable/disable download buttons based on data availability
    document.getElementById('downloadTreemapSvg').disabled = false;
    
    const fatBtn = document.getElementById('downloadFatTreemapSvg');
    if (fatBtn) fatBtn.disabled = !hasFat;
    
    const carbsBtn = document.getElementById('downloadCarbsTreemapSvg');
    if (carbsBtn) carbsBtn.disabled = !hasCarbs;
    
    const proteinBtn = document.getElementById('downloadProteinTreemapSvg');
    if (proteinBtn) proteinBtn.disabled = !hasProtein;
    
    const micronutrientsBtn = document.getElementById('downloadMicronutrientsTreemapSvg');
    if (micronutrientsBtn) micronutrientsBtn.disabled = !hasMicronutrients;
    
    const mineralsBtn = document.getElementById('downloadMineralsTreemapSvg');
    if (mineralsBtn) mineralsBtn.disabled = !hasMinerals;
    
    const vitaminsBtn = document.getElementById('downloadVitaminsTreemapSvg');
    if (vitaminsBtn) vitaminsBtn.disabled = !hasVitamins;
}

function updateStackedBars() {
    if (!currentTreemapData) return;

    const { fat, carbs, protein, mineralData, vitaminData } = currentTreemapData;
    const showAllSubtypes = stackedBarShowSubtypes;

    renderMacroStackedBar('stackedBarMacroContainer', currentTreemapData, showAllSubtypes);

    const hasFat = fat > 0;
    toggleTreemapVisibility('stackedBarFatContainer', hasFat);
    if (hasFat) {
        const fatData = buildFatTreemapData(currentTreemapData);
        renderStackedBar('stackedBarFatContainer', fatData, 'Fat Breakdown', 'g');
    }

    const hasCarbs = carbs > 0;
    toggleTreemapVisibility('stackedBarCarbsContainer', hasCarbs);
    if (hasCarbs) {
        const carbsData = buildCarbsTreemapData(currentTreemapData);
        renderStackedBar('stackedBarCarbsContainer', carbsData, 'Carbs Breakdown', 'g');
    }

    const hasProtein = protein > 0;
    toggleTreemapVisibility('stackedBarProteinContainer', hasProtein);
    if (hasProtein) {
        const proteinData = buildProteinTreemapData(currentTreemapData, showAllSubtypes);
        renderStackedBar('stackedBarProteinContainer', proteinData, 'Protein Breakdown', 'g');
    }

    const hasMinerals = mineralData && Object.values(mineralData).some(v => v > 0);
    const hasVitamins = vitaminData && Object.values(vitaminData).some(v => v > 0);
    const hasMicronutrients = hasMinerals || hasVitamins;

    const micronutrientsContainer = document.getElementById('stackedBarMicronutrientsContainer');
    if (micronutrientsContainer) {
        const parentRow = micronutrientsContainer.closest('.row');
        if (parentRow) parentRow.style.display = hasMicronutrients ? '' : 'none';
    }
    if (hasMicronutrients) {
        const micronutrientsData = buildMicronutrientsTreemapData(currentTreemapData, showAllSubtypes);
        renderStackedBar('stackedBarMicronutrientsContainer', micronutrientsData, 'Micronutrients Breakdown', 'mg');
    }

    const mineralsContainer = document.getElementById('stackedBarMineralsContainer');
    if (mineralsContainer) {
        const parentRow = mineralsContainer.closest('.row');
        if (parentRow) parentRow.style.display = hasMinerals ? '' : 'none';
    }
    if (hasMinerals) {
        const mineralsData = buildMineralsTreemapData(currentTreemapData, showAllSubtypes);
        renderStackedBar('stackedBarMineralsContainer', mineralsData, 'Minerals Breakdown', 'mg');
    }

    const vitaminsContainer = document.getElementById('stackedBarVitaminsContainer');
    if (vitaminsContainer) {
        const parentRow = vitaminsContainer.closest('.row');
        if (parentRow) parentRow.style.display = hasVitamins ? '' : 'none';
    }
    if (hasVitamins) {
        const vitaminsData = buildVitaminsTreemapData(currentTreemapData, showAllSubtypes);
        renderStackedBar('stackedBarVitaminsContainer', vitaminsData, 'Vitamins Breakdown', 'mg');
    }

    const macroBtn = document.getElementById('downloadStackedBarSvg');
    if (macroBtn) macroBtn.disabled = false;
    const fatBtn = document.getElementById('downloadFatStackedBarSvg');
    if (fatBtn) fatBtn.disabled = !hasFat;
    const carbsBtn = document.getElementById('downloadCarbsStackedBarSvg');
    if (carbsBtn) carbsBtn.disabled = !hasCarbs;
    const proteinBtn = document.getElementById('downloadProteinStackedBarSvg');
    if (proteinBtn) proteinBtn.disabled = !hasProtein;
    const microBtn = document.getElementById('downloadMicronutrientsStackedBarSvg');
    if (microBtn) microBtn.disabled = !hasMicronutrients;
    const mineralsBtn = document.getElementById('downloadMineralsStackedBarSvg');
    if (mineralsBtn) mineralsBtn.disabled = !hasMinerals;
    const vitaminsBtn = document.getElementById('downloadVitaminsStackedBarSvg');
    if (vitaminsBtn) vitaminsBtn.disabled = !hasVitamins;
}

function updateCirclePacking() {
    if (!currentTreemapData) return;

    const { fat, carbs, protein, mineralData, vitaminData } = currentTreemapData;

    const macroData = buildMacroTreemapData(currentTreemapData, circlePackShowSubtypes);
    renderCirclePack('circlePackMacroContainer', macroData, 'Macronutrients', 'g');

    const hasFat = fat > 0;
    toggleTreemapVisibility('circlePackFatContainer', hasFat);
    if (hasFat) {
        const fatData = buildFatTreemapData(currentTreemapData);
        renderCirclePack('circlePackFatContainer', fatData, 'Fat Breakdown', 'g');
    }

    const hasCarbs = carbs > 0;
    toggleTreemapVisibility('circlePackCarbsContainer', hasCarbs);
    if (hasCarbs) {
        const carbsData = buildCarbsTreemapData(currentTreemapData);
        renderCirclePack('circlePackCarbsContainer', carbsData, 'Carbs Breakdown', 'g');
    }

    const hasProtein = protein > 0;
    toggleTreemapVisibility('circlePackProteinContainer', hasProtein);
    if (hasProtein) {
        const proteinData = buildProteinTreemapData(currentTreemapData, circlePackShowSubtypes);
        renderCirclePack('circlePackProteinContainer', proteinData, 'Protein Breakdown', 'g');
    }

    const hasMinerals = mineralData && Object.values(mineralData).some(v => v > 0);
    const hasVitamins = vitaminData && Object.values(vitaminData).some(v => v > 0);
    const hasMicronutrients = hasMinerals || hasVitamins;

    const micronutrientsContainer = document.getElementById('circlePackMicronutrientsContainer');
    if (micronutrientsContainer) {
        const parentRow = micronutrientsContainer.closest('.row');
        if (parentRow) parentRow.style.display = hasMicronutrients ? '' : 'none';
    }
    if (hasMicronutrients) {
        const microData = buildMicronutrientsTreemapData(currentTreemapData, circlePackShowSubtypes);
        renderCirclePack('circlePackMicronutrientsContainer', microData, 'Micronutrients Breakdown', 'mg');
    }

    const mineralsContainer = document.getElementById('circlePackMineralsContainer');
    if (mineralsContainer) {
        const parentRow = mineralsContainer.closest('.row');
        if (parentRow) parentRow.style.display = hasMinerals ? '' : 'none';
    }
    if (hasMinerals) {
        const mineralsData = buildMineralsTreemapData(currentTreemapData, circlePackShowSubtypes);
        renderCirclePack('circlePackMineralsContainer', mineralsData, 'Minerals Breakdown', 'mg');
    }

    const vitaminsContainer = document.getElementById('circlePackVitaminsContainer');
    if (vitaminsContainer) {
        const parentRow = vitaminsContainer.closest('.row');
        if (parentRow) parentRow.style.display = hasVitamins ? '' : 'none';
    }
    if (hasVitamins) {
        const vitaminsData = buildVitaminsTreemapData(currentTreemapData, circlePackShowSubtypes);
        renderCirclePack('circlePackVitaminsContainer', vitaminsData, 'Vitamins Breakdown', 'mg');
    }

    const macroBtn = document.getElementById('downloadCirclePackSvg');
    if (macroBtn) macroBtn.disabled = false;
    const fatBtn = document.getElementById('downloadFatCirclePackSvg');
    if (fatBtn) fatBtn.disabled = !hasFat;
    const carbsBtn = document.getElementById('downloadCarbsCirclePackSvg');
    if (carbsBtn) carbsBtn.disabled = !hasCarbs;
    const proteinBtn = document.getElementById('downloadProteinCirclePackSvg');
    if (proteinBtn) proteinBtn.disabled = !hasProtein;
    const microBtn = document.getElementById('downloadMicronutrientsCirclePackSvg');
    if (microBtn) microBtn.disabled = !hasMicronutrients;
    const mineralsBtn = document.getElementById('downloadMineralsCirclePackSvg');
    if (mineralsBtn) mineralsBtn.disabled = !hasMinerals;
    const vitaminsBtn = document.getElementById('downloadVitaminsCirclePackSvg');
    if (vitaminsBtn) vitaminsBtn.disabled = !hasVitamins;
}

function updateVoronoiCharts() {
    if (!currentTreemapData) return;

    const { fat, carbs, protein, mineralData, vitaminData } = currentTreemapData;

    const macroData = buildMacroTreemapData(currentTreemapData, voronoiShowSubtypes);
    renderCircularVoronoi('voronoiMacroContainer', macroData, 'Macronutrients', 'g');

    const hasFat = fat > 0;
    toggleTreemapVisibility('voronoiFatContainer', hasFat);
    if (hasFat) {
        const fatData = buildFatTreemapData(currentTreemapData);
        renderCircularVoronoi('voronoiFatContainer', fatData, 'Fat Breakdown', 'g');
    }

    const hasCarbs = carbs > 0;
    toggleTreemapVisibility('voronoiCarbsContainer', hasCarbs);
    if (hasCarbs) {
        const carbsData = buildCarbsTreemapData(currentTreemapData);
        renderCircularVoronoi('voronoiCarbsContainer', carbsData, 'Carbs Breakdown', 'g');
    }

    const hasProtein = protein > 0;
    toggleTreemapVisibility('voronoiProteinContainer', hasProtein);
    if (hasProtein) {
        const proteinData = buildProteinTreemapData(currentTreemapData, voronoiShowSubtypes);
        renderCircularVoronoi('voronoiProteinContainer', proteinData, 'Protein Breakdown', 'g');
    }

    const hasMinerals = mineralData && Object.values(mineralData).some(v => v > 0);
    const hasVitamins = vitaminData && Object.values(vitaminData).some(v => v > 0);
    const hasMicronutrients = hasMinerals || hasVitamins;

    const microContainer = document.getElementById('voronoiMicronutrientsContainer');
    if (microContainer) {
        const parentRow = microContainer.closest('.row');
        if (parentRow) parentRow.style.display = hasMicronutrients ? '' : 'none';
    }
    if (hasMicronutrients) {
        const microData = buildMicronutrientsTreemapData(currentTreemapData, voronoiShowSubtypes);
        renderCircularVoronoi('voronoiMicronutrientsContainer', microData, 'Micronutrients Breakdown', 'mg');
    }

    const mineralsContainer = document.getElementById('voronoiMineralsContainer');
    if (mineralsContainer) {
        const parentRow = mineralsContainer.closest('.row');
        if (parentRow) parentRow.style.display = hasMinerals ? '' : 'none';
    }
    if (hasMinerals) {
        const mineralsData = buildMineralsTreemapData(currentTreemapData, voronoiShowSubtypes);
        renderCircularVoronoi('voronoiMineralsContainer', mineralsData, 'Minerals Breakdown', 'mg');
    }

    const vitaminsContainer = document.getElementById('voronoiVitaminsContainer');
    if (vitaminsContainer) {
        const parentRow = vitaminsContainer.closest('.row');
        if (parentRow) parentRow.style.display = hasVitamins ? '' : 'none';
    }
    if (hasVitamins) {
        const vitaminsData = buildVitaminsTreemapData(currentTreemapData, voronoiShowSubtypes);
        renderCircularVoronoi('voronoiVitaminsContainer', vitaminsData, 'Vitamins Breakdown', 'mg');
    }

    const macroBtn = document.getElementById('downloadVoronoiSvg');
    if (macroBtn) macroBtn.disabled = false;
    const fatBtn = document.getElementById('downloadFatVoronoiSvg');
    if (fatBtn) fatBtn.disabled = !hasFat;
    const carbsBtn = document.getElementById('downloadCarbsVoronoiSvg');
    if (carbsBtn) carbsBtn.disabled = !hasCarbs;
    const proteinBtn = document.getElementById('downloadProteinVoronoiSvg');
    if (proteinBtn) proteinBtn.disabled = !hasProtein;
    const microBtn = document.getElementById('downloadMicronutrientsVoronoiSvg');
    if (microBtn) microBtn.disabled = !hasMicronutrients;
    const mineralsBtn = document.getElementById('downloadMineralsVoronoiSvg');
    if (mineralsBtn) mineralsBtn.disabled = !hasMinerals;
    const vitaminsBtn = document.getElementById('downloadVitaminsVoronoiSvg');
    if (vitaminsBtn) vitaminsBtn.disabled = !hasVitamins;
}

// Parse and populate portion sizes from USDA data
function parseAndPopulatePortions(foodData) {
    availablePortions = [];
    
    // Always include the default 100g option
    availablePortions.push({
        description: '100g (default)',
        gramWeight: 100,
        multiplier: 1
    });
    
    // Extract foodPortions from USDA data
    const foodPortions = foodData.foodPortions || [];
    
    console.log('Food Portions from API:', foodPortions); // Debug log
    
    // Add each available portion
    foodPortions.forEach(portion => {
        if (portion.gramWeight && portion.gramWeight > 0) {
            let description = '';
            
            // Try different fields to build a meaningful description
            // Priority: portionDescription > modifier > measureUnit.name
            if (portion.portionDescription) {
                // Use portionDescription if available
                description = `${portion.portionDescription} (${Math.round(portion.gramWeight)}g)`;
            } else if (portion.modifier && portion.modifier.trim()) {
                // Use modifier if available (e.g., "cup, sliced")
                const amount = portion.amount && portion.amount !== 1 ? portion.amount + ' ' : '';
                description = `${amount}${portion.modifier} (${Math.round(portion.gramWeight)}g)`;
            } else if (portion.measureUnit?.name) {
                // Use measure unit name (e.g., "cup", "tablespoon")
                const amount = portion.amount && portion.amount !== 1 ? portion.amount + ' ' : '';
                const unit = portion.measureUnit.name;
                description = `${amount}${unit} (${Math.round(portion.gramWeight)}g)`;
            } else if (portion.measureUnit?.abbreviation) {
                // Use abbreviation as fallback
                const amount = portion.amount && portion.amount !== 1 ? portion.amount + ' ' : '';
                const unit = portion.measureUnit.abbreviation;
                description = `${amount}${unit} (${Math.round(portion.gramWeight)}g)`;
            } else {
                // Last resort: use "serving" with gram weight
                description = `Serving (${Math.round(portion.gramWeight)}g)`;
            }
            
            // Clean up the description (remove extra spaces, etc.)
            description = description.replace(/\s+/g, ' ').trim();
            
            availablePortions.push({
                description: description,
                gramWeight: portion.gramWeight,
                multiplier: portion.gramWeight / 100 // Calculate multiplier relative to 100g
            });
        }
    });
    
    // Populate the dropdown
    const portionSelect = document.getElementById('portionSize');
    if (portionSelect) {
        portionSelect.innerHTML = '';
        
        availablePortions.forEach((portion, index) => {
            const option = document.createElement('option');
            option.value = portion.multiplier;
            option.textContent = portion.description;
            if (portion.multiplier === 1) {
                option.selected = true;
            }
            portionSelect.appendChild(option);
        });
        
        // Show the portion selector
        const portionContainer = document.getElementById('portionSizeContainer');
        if (portionContainer && availablePortions.length > 1) {
            portionContainer.style.display = 'flex';
        }
    }
}

// Handle portion size change
function handlePortionChange() {
    const portionSelect = document.getElementById('portionSize');
    if (portionSelect && currentFoodData) {
        currentPortionMultiplier = parseFloat(portionSelect.value);
        
        // Reparse nutrients with new multiplier
        currentTreemapData = parseNutrientsFromUSDA(currentFoodData, currentPortionMultiplier);
        
        // Update portion info in titles
        updateChartTitles();
        
        // Update all visualizations
        updateTreemaps();
        updateStackedBars();
        updateCirclePacking();
        updateVoronoiCharts();
        
        // Update bar graphs if available
        if (typeof window.updateDRVBarGraphs === 'function') {
            window.updateDRVBarGraphs(currentTreemapData);
        }
        
        // Update radar chart if available
        if (typeof window.updateRadarChartData === 'function') {
            window.updateRadarChartData(currentTreemapData);
        }
        
        // Note: Sankey diagram currently uses server-side transformation
        // and would need Cloudflare Worker updates to support portion sizes
        // The Sankey will still show per 100g data
    }
}

// Update chart titles with portion information
function updateChartTitles() {
    const portionSelect = document.getElementById('portionSize');
    if (!portionSelect || !currentFoodData) return;
    
    const selectedOption = portionSelect.options[portionSelect.selectedIndex];
    const portionText = selectedOption.textContent;
    const description = currentFoodData.description || 'Food Item';
    
    // Determine serving size text
    let servingText = 'per ' + portionText;
    
    // Update Sankey titles (note: Sankey data itself is still per 100g from server)
    const sankeySubhead = document.getElementById('sankeyDiagram_graphSubhead');
    if (sankeySubhead) {
        if (currentPortionMultiplier === 1) {
            sankeySubhead.textContent = 'Nutrient flow breakdown per 100g';
        } else {
            sankeySubhead.textContent = `Nutrient flow shown per 100g (other charts show ${servingText})`;
        }
    }
    
    // Update treemap titles
    document.getElementById('treemap_graphSubhead').textContent = `Nutrient composition ${servingText}`;
    const stackedBarSubhead = document.getElementById('stackedbar_graphSubhead');
    if (stackedBarSubhead) {
        stackedBarSubhead.textContent = `Stacked nutrient composition ${servingText}`;
    }
    const circlePackSubhead = document.getElementById('circlepack_graphSubhead');
    if (circlePackSubhead) {
        circlePackSubhead.textContent = `Nested nutrient circles ${servingText}`;
    }
    const voronoiSubhead = document.getElementById('voronoi_graphSubhead');
    if (voronoiSubhead) {
        voronoiSubhead.textContent = `Circular Voronoi nutrient map ${servingText}`;
    }
    
    // Update bar graph titles
    const bargraphSubhead = document.getElementById('bargraph_graphSubhead');
    if (bargraphSubhead) {
        bargraphSubhead.textContent = `% Daily Value ${servingText}`;
    }
    
    // Update radar chart titles
    const radarSubhead = document.getElementById('radar_graphSubhead');
    if (radarSubhead) {
        radarSubhead.textContent = `Nutrient % DRV ${servingText}`;
    }
}

// Parse nutrients from raw USDA data
function parseNutrientsFromUSDA(foodData, multiplier = 1) {
    const nutrients = foodData.foodNutrients || [];

    function getNutrient(...names) {
        for (const name of names) {
            const nutrient = nutrients.find(n =>
                n.nutrient?.name?.toLowerCase() === name.toLowerCase()
            );
            if (nutrient && nutrient.amount > 0) {
                return nutrient.amount * multiplier; // Apply portion multiplier
            }
        }
        return 0;
    }

    const water = getNutrient('Water');
    const protein = getNutrient('Protein');
    const fat = getNutrient('Total lipid (fat)');
    const carbs = getNutrient('Carbohydrate, by difference');
    const satFat = getNutrient('Fatty acids, total saturated');
    const monoFat = getNutrient('Fatty acids, total monounsaturated');
    const polyFat = getNutrient('Fatty acids, total polyunsaturated');
    const transFat = getNutrient('Fatty acids, total trans', 'Trans fat');
    const otherFat = Math.max(0, fat - satFat - monoFat - polyFat - transFat);

    let sugars = getNutrient('Total Sugars', 'Sugars, total');
    const fiber = getNutrient('Fiber, total dietary');
    const starch = Math.max(0, carbs - sugars - fiber);

    let minerals = getNutrient('Ash');
    if (minerals === 0) {
        minerals = Math.max(0, 100 - water - protein - fat - carbs);
    }

    // Extract amino acids
    const aminoAcidNames = [
        'Tryptophan', 'Threonine', 'Isoleucine', 'Leucine', 'Lysine',
        'Methionine', 'Cystine', 'Phenylalanine', 'Tyrosine', 'Valine',
        'Arginine', 'Histidine', 'Alanine', 'Aspartic acid', 'Glutamic acid',
        'Glycine', 'Proline', 'Serine'
    ];
    
    const aminoAcids = {};
    aminoAcidNames.forEach(name => {
        const value = getNutrient(name);
        if (value > 0) {
            aminoAcids[name] = value;
        }
    });

    // Extract individual minerals (in mg, will convert to display)
    const mineralData = {
        // Hydration & Nerves
        sodium: getNutrient('Sodium, Na'),
        potassium: getNutrient('Potassium, K'),
        chloride: getNutrient('Chloride, Cl'),
        // Bones & Structure
        calcium: getNutrient('Calcium, Ca'),
        phosphorus: getNutrient('Phosphorus, P'),
        magnesium: getNutrient('Magnesium, Mg'),
        // Energy & Circulation
        iron: getNutrient('Iron, Fe'),
        copper: getNutrient('Copper, Cu'),
        chromium: getNutrient('Chromium, Cr'),
        manganese: getNutrient('Manganese, Mn'),
        molybdenum: getNutrient('Molybdenum, Mo'),
        // Growth & Defense
        zinc: getNutrient('Zinc, Zn'),
        selenium: getNutrient('Selenium, Se'),
        iodine: getNutrient('Iodine, I')
    };

    // Extract vitamins
    const vitaminData = {
        // Energy & Metabolism (B vitamins)
        thiamin: getNutrient('Thiamin'),  // mg (B1)
        riboflavin: getNutrient('Riboflavin'),  // mg (B2)
        niacin: getNutrient('Niacin'),  // mg (B3)
        pantothenicAcid: getNutrient('Pantothenic acid'),  // mg (B5)
        vitaminB6: getNutrient('Vitamin B-6'),  // mg
        biotin: getNutrient('Biotin'),  // µg (B7)
        folate: getNutrient('Folate, total'),  // µg (B9)
        vitaminB12: getNutrient('Vitamin B-12'),  // µg
        choline: getNutrient('Choline, total'),  // mg
        // Growth & Regulation
        vitaminA: getNutrient('Vitamin A, RAE'),  // µg
        vitaminC: getNutrient('Vitamin C, total ascorbic acid'),  // mg
        vitaminD: getNutrient('Vitamin D (D2 + D3)'),  // µg
        vitaminE: getNutrient('Vitamin E (alpha-tocopherol)'),  // mg
        vitaminK: getNutrient('Vitamin K (phylloquinone)')  // µg
    };

    return {
        water, protein, fat, carbs, minerals,
        satFat, monoFat, polyFat, transFat, otherFat,
        sugars, fiber, starch,
        aminoAcids,
        mineralData,
        vitaminData
    };
}

// Fetch and display treemaps for a food item
async function fetchAndDisplayTreemaps(foodId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/food/${foodId}/raw`);
        if (!response.ok) throw new Error('Failed to fetch food data');
        
        const foodData = await response.json();
        currentFoodData = foodData; // Store raw data for portion changes
        
        // Parse and populate available portions
        parseAndPopulatePortions(foodData);
        
        // Reset portion multiplier to 100g default
        currentPortionMultiplier = 1;
        const portionSelect = document.getElementById('portionSize');
        if (portionSelect) {
            portionSelect.value = '1';
        }
        
        // Parse nutrients with current multiplier
        currentTreemapData = parseNutrientsFromUSDA(foodData, currentPortionMultiplier);
        
        // Update titles
        const description = foodData.description || 'Food Item';
        document.getElementById('treemap_graphTitle').textContent = description;
        const stackedBarTitle = document.getElementById('stackedbar_graphTitle');
        if (stackedBarTitle) stackedBarTitle.textContent = description;
        const circlePackTitle = document.getElementById('circlepack_graphTitle');
        if (circlePackTitle) circlePackTitle.textContent = description;
        const voronoiTitle = document.getElementById('voronoi_graphTitle');
        if (voronoiTitle) voronoiTitle.textContent = description;
        
        // Update bar graph titles
        const bargraphTitle = document.getElementById('bargraph_graphTitle');
        if (bargraphTitle) bargraphTitle.textContent = description;
        
        // Update radar chart titles
        const radarTitle = document.getElementById('radar_graphTitle');
        if (radarTitle) radarTitle.textContent = description;
        
        // Update chart subtitles with portion info
        updateChartTitles();
        
        updateTreemaps();
        updateStackedBars();
        updateCirclePacking();
        updateVoronoiCharts();
        
        // Update bar graphs if the function is available
        if (typeof window.updateDRVBarGraphs === 'function') {
            window.updateDRVBarGraphs(currentTreemapData);
        }
        
        // Update radar chart if the function is available
        if (typeof window.updateRadarChartData === 'function') {
            window.updateRadarChartData(currentTreemapData);
        }
    } catch (error) {
        console.error('Treemap error:', error);
        document.getElementById('treemapContainer').innerHTML = 
            '<p class="text-center text-danger p-4">Failed to load treemap data</p>';
        const stackedMacroContainer = document.getElementById('stackedBarMacroContainer');
        if (stackedMacroContainer) {
            stackedMacroContainer.innerHTML = '<p class="text-center text-danger p-4">Failed to load stacked bar data</p>';
        }
        const circlePackContainer = document.getElementById('circlePackMacroContainer');
        if (circlePackContainer) {
            circlePackContainer.innerHTML = '<p class="text-center text-danger p-4">Failed to load circle packing data</p>';
        }
        const voronoiContainer = document.getElementById('voronoiMacroContainer');
        if (voronoiContainer) {
            voronoiContainer.innerHTML = '<p class="text-center text-danger p-4">Failed to load voronoi data</p>';
        }
    }
}

// Download treemap as SVG
function downloadTreemapSVG(containerId, filename) {
    const container = document.getElementById(containerId);
    const svg = container.querySelector('svg');
    if (!svg) return;

    // Clone SVG
    const clone = svg.cloneNode(true);
    
    // Add styles inline
    clone.querySelectorAll('.treemap-cell').forEach(el => {
        el.style.stroke = '#1a1a2e';
        el.style.strokeWidth = '2px';
    });
    clone.querySelectorAll('.treemap-label').forEach(el => {
        el.style.fontSize = '12px';
        el.style.fontWeight = '500';
        el.style.fill = '#fff';
    });
    clone.querySelectorAll('.treemap-value').forEach(el => {
        el.style.fontSize = '10px';
        el.style.fill = 'rgba(255,255,255,0.8)';
    });

    const isStackedBar = clone.classList.contains('stacked-bar-chart');
    const isCirclePack = clone.classList.contains('circlepack-svg');
    const isVoronoi = clone.classList.contains('voronoi-svg');

    // Add background
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', '100%');
    bg.setAttribute('height', '100%');
    bg.setAttribute('fill', (isStackedBar || isCirclePack || isVoronoi) ? '#f8f4ea' : '#1a1a2e');
    clone.insertBefore(bg, clone.firstChild);

    // Create download
    const svgData = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Portion size selector
    const portionSelect = document.getElementById('portionSize');
    if (portionSelect) {
        portionSelect.addEventListener('change', handlePortionChange);
    }
    
    // Subtypes toggle (applies to both fat and carbs)
    const subtypesToggle = document.getElementById('treemapShowSubtypes');
    if (subtypesToggle) {
        subtypesToggle.addEventListener('change', (e) => {
            showSubtypes = e.target.checked;
            updateTreemaps();
        });
    }

    const stackedBarSubtypesToggle = document.getElementById('stackedBarShowSubtypes');
    if (stackedBarSubtypesToggle) {
        stackedBarSubtypesToggle.addEventListener('change', (e) => {
            stackedBarShowSubtypes = e.target.checked;
            if (currentTreemapData) {
                updateStackedBars();
            }
        });
    }

    const circlePackSubtypesToggle = document.getElementById('circlePackShowSubtypes');
    if (circlePackSubtypesToggle) {
        circlePackSubtypesToggle.addEventListener('change', (e) => {
            circlePackShowSubtypes = e.target.checked;
            if (currentTreemapData) {
                updateCirclePacking();
            }
        });
    }
    const circlePackLabelsToggle = document.getElementById('circlePackShowLabels');
    if (circlePackLabelsToggle) {
        circlePackLabelsToggle.addEventListener('change', (e) => {
            circlePackShowLabels = e.target.checked;
            if (currentTreemapData) {
                updateCirclePacking();
            }
        });
    }
    const voronoiSubtypesToggle = document.getElementById('voronoiShowSubtypes');
    if (voronoiSubtypesToggle) {
        voronoiSubtypesToggle.addEventListener('change', (e) => {
            voronoiShowSubtypes = e.target.checked;
            if (currentTreemapData) {
                updateVoronoiCharts();
            }
        });
    }
    const voronoiLabelsToggle = document.getElementById('voronoiShowLabels');
    if (voronoiLabelsToggle) {
        voronoiLabelsToggle.addEventListener('change', (e) => {
            voronoiShowLabels = e.target.checked;
            if (currentTreemapData) {
                updateVoronoiCharts();
            }
        });
    }

    // Listen for "Show sodium separately" toggle from Sankey side panel
    const showSodiumToggle = document.getElementById('toggleShowSodium');
    if (showSodiumToggle) {
        showSodiumToggle.addEventListener('change', (e) => {
            showSodiumSeparately = e.target.checked;
            // Only update treemaps if we have data
            if (currentTreemapData) {
                updateTreemaps();
                updateStackedBars();
                updateCirclePacking();
                updateVoronoiCharts();
            }
        });
    }

    // Download buttons
    const downloadMacroBtn = document.getElementById('downloadTreemapSvg');
    if (downloadMacroBtn) {
        downloadMacroBtn.addEventListener('click', () => {
            const foodName = document.getElementById('treemap_graphTitle')?.textContent || 'nutrients';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('treemapContainer', `${safeName}_treemap.svg`);
        });
    }

    const downloadMicronutrientsBtn = document.getElementById('downloadMicronutrientsTreemapSvg');
    if (downloadMicronutrientsBtn) {
        downloadMicronutrientsBtn.addEventListener('click', () => {
            const foodName = document.getElementById('treemap_graphTitle')?.textContent || 'micronutrients';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('micronutrientsTreemapContainer', `${safeName}_micronutrients_treemap.svg`);
        });
    }

    const downloadMineralsBtn = document.getElementById('downloadMineralsTreemapSvg');
    if (downloadMineralsBtn) {
        downloadMineralsBtn.addEventListener('click', () => {
            const foodName = document.getElementById('treemap_graphTitle')?.textContent || 'minerals';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('mineralsTreemapContainer', `${safeName}_minerals_treemap.svg`);
        });
    }

    const downloadVitaminsBtn = document.getElementById('downloadVitaminsTreemapSvg');
    if (downloadVitaminsBtn) {
        downloadVitaminsBtn.addEventListener('click', () => {
            const foodName = document.getElementById('treemap_graphTitle')?.textContent || 'vitamins';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('vitaminsTreemapContainer', `${safeName}_vitamins_treemap.svg`);
        });
    }

    const downloadFatBtn = document.getElementById('downloadFatTreemapSvg');
    if (downloadFatBtn) {
        downloadFatBtn.addEventListener('click', () => {
            const foodName = document.getElementById('treemap_graphTitle')?.textContent || 'fat';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('fatTreemapContainer', `${safeName}_fat_treemap.svg`);
        });
    }

    const downloadCarbsBtn = document.getElementById('downloadCarbsTreemapSvg');
    if (downloadCarbsBtn) {
        downloadCarbsBtn.addEventListener('click', () => {
            const foodName = document.getElementById('treemap_graphTitle')?.textContent || 'carbs';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('carbsTreemapContainer', `${safeName}_carbs_treemap.svg`);
        });
    }

    const downloadProteinBtn = document.getElementById('downloadProteinTreemapSvg');
    if (downloadProteinBtn) {
        downloadProteinBtn.addEventListener('click', () => {
            const foodName = document.getElementById('treemap_graphTitle')?.textContent || 'protein';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('proteinTreemapContainer', `${safeName}_protein_treemap.svg`);
        });
    }

    const downloadStackedMacroBtn = document.getElementById('downloadStackedBarSvg');
    if (downloadStackedMacroBtn) {
        downloadStackedMacroBtn.addEventListener('click', () => {
            const foodName = document.getElementById('stackedbar_graphTitle')?.textContent || 'nutrients';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('stackedBarMacroContainer', `${safeName}_stacked_macro.svg`);
        });
    }
    const downloadStackedFatBtn = document.getElementById('downloadFatStackedBarSvg');
    if (downloadStackedFatBtn) {
        downloadStackedFatBtn.addEventListener('click', () => {
            const foodName = document.getElementById('stackedbar_graphTitle')?.textContent || 'fat';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('stackedBarFatContainer', `${safeName}_stacked_fat.svg`);
        });
    }
    const downloadStackedCarbsBtn = document.getElementById('downloadCarbsStackedBarSvg');
    if (downloadStackedCarbsBtn) {
        downloadStackedCarbsBtn.addEventListener('click', () => {
            const foodName = document.getElementById('stackedbar_graphTitle')?.textContent || 'carbs';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('stackedBarCarbsContainer', `${safeName}_stacked_carbs.svg`);
        });
    }
    const downloadStackedProteinBtn = document.getElementById('downloadProteinStackedBarSvg');
    if (downloadStackedProteinBtn) {
        downloadStackedProteinBtn.addEventListener('click', () => {
            const foodName = document.getElementById('stackedbar_graphTitle')?.textContent || 'protein';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('stackedBarProteinContainer', `${safeName}_stacked_protein.svg`);
        });
    }
    const downloadStackedMicroBtn = document.getElementById('downloadMicronutrientsStackedBarSvg');
    if (downloadStackedMicroBtn) {
        downloadStackedMicroBtn.addEventListener('click', () => {
            const foodName = document.getElementById('stackedbar_graphTitle')?.textContent || 'micronutrients';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('stackedBarMicronutrientsContainer', `${safeName}_stacked_micronutrients.svg`);
        });
    }
    const downloadStackedMineralsBtn = document.getElementById('downloadMineralsStackedBarSvg');
    if (downloadStackedMineralsBtn) {
        downloadStackedMineralsBtn.addEventListener('click', () => {
            const foodName = document.getElementById('stackedbar_graphTitle')?.textContent || 'minerals';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('stackedBarMineralsContainer', `${safeName}_stacked_minerals.svg`);
        });
    }
    const downloadStackedVitaminsBtn = document.getElementById('downloadVitaminsStackedBarSvg');
    if (downloadStackedVitaminsBtn) {
        downloadStackedVitaminsBtn.addEventListener('click', () => {
            const foodName = document.getElementById('stackedbar_graphTitle')?.textContent || 'vitamins';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('stackedBarVitaminsContainer', `${safeName}_stacked_vitamins.svg`);
        });
    }

    const downloadCirclePackMacroBtn = document.getElementById('downloadCirclePackSvg');
    if (downloadCirclePackMacroBtn) {
        downloadCirclePackMacroBtn.addEventListener('click', () => {
            const foodName = document.getElementById('circlepack_graphTitle')?.textContent || 'nutrients';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('circlePackMacroContainer', `${safeName}_circlepack_macro.svg`);
        });
    }
    const downloadCirclePackFatBtn = document.getElementById('downloadFatCirclePackSvg');
    if (downloadCirclePackFatBtn) {
        downloadCirclePackFatBtn.addEventListener('click', () => {
            const foodName = document.getElementById('circlepack_graphTitle')?.textContent || 'fat';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('circlePackFatContainer', `${safeName}_circlepack_fat.svg`);
        });
    }
    const downloadCirclePackCarbsBtn = document.getElementById('downloadCarbsCirclePackSvg');
    if (downloadCirclePackCarbsBtn) {
        downloadCirclePackCarbsBtn.addEventListener('click', () => {
            const foodName = document.getElementById('circlepack_graphTitle')?.textContent || 'carbs';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('circlePackCarbsContainer', `${safeName}_circlepack_carbs.svg`);
        });
    }
    const downloadCirclePackProteinBtn = document.getElementById('downloadProteinCirclePackSvg');
    if (downloadCirclePackProteinBtn) {
        downloadCirclePackProteinBtn.addEventListener('click', () => {
            const foodName = document.getElementById('circlepack_graphTitle')?.textContent || 'protein';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('circlePackProteinContainer', `${safeName}_circlepack_protein.svg`);
        });
    }
    const downloadCirclePackMicroBtn = document.getElementById('downloadMicronutrientsCirclePackSvg');
    if (downloadCirclePackMicroBtn) {
        downloadCirclePackMicroBtn.addEventListener('click', () => {
            const foodName = document.getElementById('circlepack_graphTitle')?.textContent || 'micronutrients';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('circlePackMicronutrientsContainer', `${safeName}_circlepack_micronutrients.svg`);
        });
    }
    const downloadCirclePackMineralsBtn = document.getElementById('downloadMineralsCirclePackSvg');
    if (downloadCirclePackMineralsBtn) {
        downloadCirclePackMineralsBtn.addEventListener('click', () => {
            const foodName = document.getElementById('circlepack_graphTitle')?.textContent || 'minerals';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('circlePackMineralsContainer', `${safeName}_circlepack_minerals.svg`);
        });
    }
    const downloadCirclePackVitaminsBtn = document.getElementById('downloadVitaminsCirclePackSvg');
    if (downloadCirclePackVitaminsBtn) {
        downloadCirclePackVitaminsBtn.addEventListener('click', () => {
            const foodName = document.getElementById('circlepack_graphTitle')?.textContent || 'vitamins';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('circlePackVitaminsContainer', `${safeName}_circlepack_vitamins.svg`);
        });
    }

    const downloadVoronoiMacroBtn = document.getElementById('downloadVoronoiSvg');
    if (downloadVoronoiMacroBtn) {
        downloadVoronoiMacroBtn.addEventListener('click', () => {
            const foodName = document.getElementById('voronoi_graphTitle')?.textContent || 'nutrients';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('voronoiMacroContainer', `${safeName}_voronoi_macro.svg`);
        });
    }
    const downloadVoronoiFatBtn = document.getElementById('downloadFatVoronoiSvg');
    if (downloadVoronoiFatBtn) {
        downloadVoronoiFatBtn.addEventListener('click', () => {
            const foodName = document.getElementById('voronoi_graphTitle')?.textContent || 'fat';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('voronoiFatContainer', `${safeName}_voronoi_fat.svg`);
        });
    }
    const downloadVoronoiCarbsBtn = document.getElementById('downloadCarbsVoronoiSvg');
    if (downloadVoronoiCarbsBtn) {
        downloadVoronoiCarbsBtn.addEventListener('click', () => {
            const foodName = document.getElementById('voronoi_graphTitle')?.textContent || 'carbs';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('voronoiCarbsContainer', `${safeName}_voronoi_carbs.svg`);
        });
    }
    const downloadVoronoiProteinBtn = document.getElementById('downloadProteinVoronoiSvg');
    if (downloadVoronoiProteinBtn) {
        downloadVoronoiProteinBtn.addEventListener('click', () => {
            const foodName = document.getElementById('voronoi_graphTitle')?.textContent || 'protein';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('voronoiProteinContainer', `${safeName}_voronoi_protein.svg`);
        });
    }
    const downloadVoronoiMicroBtn = document.getElementById('downloadMicronutrientsVoronoiSvg');
    if (downloadVoronoiMicroBtn) {
        downloadVoronoiMicroBtn.addEventListener('click', () => {
            const foodName = document.getElementById('voronoi_graphTitle')?.textContent || 'micronutrients';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('voronoiMicronutrientsContainer', `${safeName}_voronoi_micronutrients.svg`);
        });
    }
    const downloadVoronoiMineralsBtn = document.getElementById('downloadMineralsVoronoiSvg');
    if (downloadVoronoiMineralsBtn) {
        downloadVoronoiMineralsBtn.addEventListener('click', () => {
            const foodName = document.getElementById('voronoi_graphTitle')?.textContent || 'minerals';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('voronoiMineralsContainer', `${safeName}_voronoi_minerals.svg`);
        });
    }
    const downloadVoronoiVitaminsBtn = document.getElementById('downloadVitaminsVoronoiSvg');
    if (downloadVoronoiVitaminsBtn) {
        downloadVoronoiVitaminsBtn.addEventListener('click', () => {
            const foodName = document.getElementById('voronoi_graphTitle')?.textContent || 'vitamins';
            const safeName = foodName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            downloadTreemapSVG('voronoiVitaminsContainer', `${safeName}_voronoi_vitamins.svg`);
        });
    }

    // Listen for tab changes to resize treemaps
    const treemapTab = document.getElementById('treemap-tab');
    if (treemapTab) {
        treemapTab.addEventListener('shown.bs.tab', () => {
            if (currentTreemapData) {
                updateTreemaps();
            }
        });
    }
    const circlePackTab = document.getElementById('circlepack-tab');
    if (circlePackTab) {
        circlePackTab.addEventListener('shown.bs.tab', () => {
            if (currentTreemapData) {
                updateCirclePacking();
            }
        });
    }
    const voronoiTab = document.getElementById('voronoi-tab');
    if (voronoiTab) {
        voronoiTab.addEventListener('shown.bs.tab', () => {
            if (currentTreemapData) {
                updateVoronoiCharts();
            }
        });
    }
    const stackedBarTab = document.getElementById('stackedbar-tab');
    if (stackedBarTab) {
        stackedBarTab.addEventListener('shown.bs.tab', () => {
            if (currentTreemapData) {
                updateStackedBars();
            }
        });
    }
    
    // Listen for chart size changes from sankey.js
    // The size buttons trigger a custom event that we listen for
    document.querySelectorAll('input[name="chartMode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const sizeMap = {
                'modeSmall': 'small',
                'modeMedium': 'medium',
                'modeLarge': 'large',
                'modeTall': 'tall'
            };
            treemapChartSize = sizeMap[e.target.id] || 'small';
            if (currentTreemapData) {
                updateTreemaps();
                updateStackedBars();
                updateCirclePacking();
                updateVoronoiCharts();
            }
        });
    });
});

// Expose function for sankey.js to call when a food is selected
window.updateTreemapsForFood = function(foodId) {
    fetchAndDisplayTreemaps(foodId);
};

// Debounced resize handler for responsive treemaps
let treemapResizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(treemapResizeTimeout);
    treemapResizeTimeout = setTimeout(() => {
        if (currentTreemapData) {
            updateTreemaps();
            updateStackedBars();
            updateCirclePacking();
            updateVoronoiCharts();
        }
    }, 250);
});

