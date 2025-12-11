// Treemap visualization for food nutrients
// Uses the same USDA API as the Sankey diagram (API_BASE_URL defined in sankey.js)

// Use the same API_BASE_URL from sankey.js (loaded before this file)
// sankey.js defines: const API_BASE_URL = "https://sankey-usda-proxy.gourmetdata.workers.dev";

// Color palette (matching Sankey)
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
    // Essential amino acids (bright greens - 9 total)
    "Histidine": "#2E7D32",
    "Isoleucine": "#388E3C",
    "Leucine": "#43A047",      // Often highest, good visibility
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
    "Glutamic acid": "#006064",  // Often highest non-essential
    "Serine": "#4DD0E1"
};

// State
let currentTreemapData = null;
let showSubtypes = true;
let treemapChartSize = 'small';  // 'small', 'medium', 'large', 'tall'

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

    const children = [];

    // Water
    if (water > 0) {
        children.push({ name: "Water", value: water, color: treemapColors["Water"] });
    }

    // Protein (no subtypes in our data)
    if (protein > 0) {
        children.push({ name: "Protein", value: protein, color: treemapColors["Protein"] });
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

    // Minerals
    if (minerals > 0) {
        children.push({ name: "Minerals", value: minerals, color: treemapColors["Minerals"] });
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

// Render a treemap
function renderTreemap(containerId, data, title) {
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

    // Rectangles
    cells.append("rect")
        .attr("class", "treemap-cell")
        .attr("width", d => Math.max(0, d.x1 - d.x0))
        .attr("height", d => Math.max(0, d.y1 - d.y0))
        .attr("fill", d => d.data.color || "#666")
        .attr("rx", 3)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            d3.select(this).style("opacity", 0.8);
        })
        .on("mouseout", function(event, d) {
            d3.select(this).style("opacity", 1);
        });

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
                    .text(`${d.value.toFixed(1)}g`);
            }
        } else if (cellWidth > 25 && cellHeight > 15) {
            // Abbreviated label for smaller cells
            g.append("text")
                .attr("class", "treemap-value")
                .attr("x", 3)
                .attr("y", 12)
                .style("font-size", "9px")
                .text(`${d.value.toFixed(1)}g`);
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

// Update both treemaps with current data
function updateTreemaps() {
    if (!currentTreemapData) return;

    const { fat, carbs, protein } = currentTreemapData;

    // Main macro treemap (always show)
    const macroData = buildMacroTreemapData(currentTreemapData, showSubtypes);
    renderTreemap('treemapContainer', macroData, 'All Macronutrients');

    // Fat-only treemap - hide if no fat
    const hasFat = fat > 0;
    toggleTreemapVisibility('fatTreemapContainer', hasFat);
    if (hasFat) {
        const fatData = buildFatTreemapData(currentTreemapData);
        renderTreemap('fatTreemapContainer', fatData, 'Fat Breakdown');
    }

    // Carbs-only treemap - hide if no carbs
    const hasCarbs = carbs > 0;
    toggleTreemapVisibility('carbsTreemapContainer', hasCarbs);
    if (hasCarbs) {
        const carbsData = buildCarbsTreemapData(currentTreemapData);
        renderTreemap('carbsTreemapContainer', carbsData, 'Carbs Breakdown');
    }

    // Protein/amino acids treemap - hide if no protein
    const hasProtein = protein > 0;
    toggleTreemapVisibility('proteinTreemapContainer', hasProtein);
    if (hasProtein) {
        const proteinData = buildProteinTreemapData(currentTreemapData, showSubtypes);
        renderTreemap('proteinTreemapContainer', proteinData, 'Protein Breakdown');
    }

    // Enable/disable download buttons based on data availability
    document.getElementById('downloadTreemapSvg').disabled = false;
    
    const fatBtn = document.getElementById('downloadFatTreemapSvg');
    if (fatBtn) fatBtn.disabled = !hasFat;
    
    const carbsBtn = document.getElementById('downloadCarbsTreemapSvg');
    if (carbsBtn) carbsBtn.disabled = !hasCarbs;
    
    const proteinBtn = document.getElementById('downloadProteinTreemapSvg');
    if (proteinBtn) proteinBtn.disabled = !hasProtein;
}

// Parse nutrients from raw USDA data
function parseNutrientsFromUSDA(foodData) {
    const nutrients = foodData.foodNutrients || [];

    function getNutrient(...names) {
        for (const name of names) {
            const nutrient = nutrients.find(n =>
                n.nutrient?.name?.toLowerCase() === name.toLowerCase()
            );
            if (nutrient && nutrient.amount > 0) {
                return nutrient.amount;
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

    return {
        water, protein, fat, carbs, minerals,
        satFat, monoFat, polyFat, transFat, otherFat,
        sugars, fiber, starch,
        aminoAcids
    };
}

// Fetch and display treemaps for a food item
async function fetchAndDisplayTreemaps(foodId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/food/${foodId}/raw`);
        if (!response.ok) throw new Error('Failed to fetch food data');
        
        const foodData = await response.json();
        currentTreemapData = parseNutrientsFromUSDA(foodData);
        
        // Update titles
        const description = foodData.description || 'Food Item';
        document.getElementById('treemap_graphTitle').textContent = description;
        document.getElementById('treemap_graphSubhead').textContent = 'Nutrient composition per 100g';
        
        updateTreemaps();
    } catch (error) {
        console.error('Treemap error:', error);
        document.getElementById('treemapContainer').innerHTML = 
            '<p class="text-center text-danger p-4">Failed to load treemap data</p>';
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

    // Add background
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', '100%');
    bg.setAttribute('height', '100%');
    bg.setAttribute('fill', '#1a1a2e');
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
    // Subtypes toggle (applies to both fat and carbs)
    const subtypesToggle = document.getElementById('treemapShowSubtypes');
    if (subtypesToggle) {
        subtypesToggle.addEventListener('change', (e) => {
            showSubtypes = e.target.checked;
            updateTreemaps();
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

    // Listen for tab changes to resize treemaps
    const treemapTab = document.getElementById('treemap-tab');
    if (treemapTab) {
        treemapTab.addEventListener('shown.bs.tab', () => {
            if (currentTreemapData) {
                updateTreemaps();
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
        }
    }, 250);
});

