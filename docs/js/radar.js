// Radar Chart visualization for nutrient % DRV comparison
// Uses D3.js and integrates with the same data as other visualizations

// DRV Profiles (reuse from bargraph.js structure)
const RADAR_DRV_PROFILES = {
    default: {
        protein: 50, fat: 78, carbs: 275, fiber: 28, sugars: 50, satFat: 20,
        sodium: 2300, potassium: 4700, calcium: 1300, iron: 18, magnesium: 420,
        phosphorus: 1250, zinc: 11, copper: 0.9, manganese: 2.3, selenium: 55,
        chromium: 35, iodine: 150,
        vitaminA: 900, vitaminC: 90, vitaminD: 20, vitaminE: 15, vitaminK: 120,
        thiamin: 1.2, riboflavin: 1.3, niacin: 16, vitaminB6: 1.7, folate: 400,
        vitaminB12: 2.4, biotin: 30, pantothenicAcid: 5, choline: 550
    },
    adult_male: {
        protein: 56, fat: 78, carbs: 275, fiber: 38, sugars: 50, satFat: 20,
        sodium: 2300, potassium: 4700, calcium: 1000, iron: 8, magnesium: 420,
        phosphorus: 700, zinc: 11, copper: 0.9, manganese: 2.3, selenium: 55,
        chromium: 35, iodine: 150,
        vitaminA: 900, vitaminC: 90, vitaminD: 15, vitaminE: 15, vitaminK: 120,
        thiamin: 1.2, riboflavin: 1.3, niacin: 16, vitaminB6: 1.3, folate: 400,
        vitaminB12: 2.4, biotin: 30, pantothenicAcid: 5, choline: 550
    },
    adult_female: {
        protein: 46, fat: 78, carbs: 275, fiber: 25, sugars: 50, satFat: 20,
        sodium: 2300, potassium: 4700, calcium: 1000, iron: 18, magnesium: 320,
        phosphorus: 700, zinc: 8, copper: 0.9, manganese: 1.8, selenium: 55,
        chromium: 25, iodine: 150,
        vitaminA: 700, vitaminC: 75, vitaminD: 15, vitaminE: 15, vitaminK: 90,
        thiamin: 1.1, riboflavin: 1.1, niacin: 14, vitaminB6: 1.3, folate: 400,
        vitaminB12: 2.4, biotin: 30, pantothenicAcid: 5, choline: 425
    },
    child: {
        protein: 13, fat: 40, carbs: 130, fiber: 19, sugars: 25, satFat: 10,
        sodium: 1500, potassium: 2000, calcium: 700, iron: 7, magnesium: 80,
        phosphorus: 460, zinc: 3, copper: 0.34, manganese: 1.2, selenium: 20,
        chromium: 11, iodine: 90,
        vitaminA: 300, vitaminC: 15, vitaminD: 15, vitaminE: 6, vitaminK: 30,
        thiamin: 0.5, riboflavin: 0.5, niacin: 6, vitaminB6: 0.5, folate: 150,
        vitaminB12: 0.9, biotin: 8, pantothenicAcid: 2, choline: 200
    },
    "child4-8": {
        protein: 19, fat: 55, carbs: 175, fiber: 25, sugars: 35, satFat: 15,
        sodium: 1900, potassium: 2300, calcium: 1000, iron: 10, magnesium: 130,
        phosphorus: 500, zinc: 5, copper: 0.44, manganese: 1.5, selenium: 30,
        chromium: 15, iodine: 90,
        vitaminA: 400, vitaminC: 25, vitaminD: 15, vitaminE: 7, vitaminK: 55,
        thiamin: 0.6, riboflavin: 0.6, niacin: 8, vitaminB6: 0.6, folate: 200,
        vitaminB12: 1.2, biotin: 12, pantothenicAcid: 3, choline: 250
    },
    "child9-13": {
        protein: 34, fat: 65, carbs: 225, fiber: 31, sugars: 40, satFat: 18,
        sodium: 2200, potassium: 2500, calcium: 1300, iron: 8, magnesium: 240,
        phosphorus: 1250, zinc: 8, copper: 0.7, manganese: 1.9, selenium: 40,
        chromium: 25, iodine: 120,
        vitaminA: 600, vitaminC: 45, vitaminD: 15, vitaminE: 11, vitaminK: 60,
        thiamin: 0.9, riboflavin: 0.9, niacin: 12, vitaminB6: 1.0, folate: 300,
        vitaminB12: 1.8, biotin: 20, pantothenicAcid: 4, choline: 375
    },
    "teen14-18_male": {
        protein: 52, fat: 75, carbs: 275, fiber: 38, sugars: 50, satFat: 20,
        sodium: 2300, potassium: 3000, calcium: 1300, iron: 11, magnesium: 410,
        phosphorus: 1250, zinc: 11, copper: 0.89, manganese: 2.2, selenium: 55,
        chromium: 35, iodine: 150,
        vitaminA: 900, vitaminC: 75, vitaminD: 15, vitaminE: 15, vitaminK: 75,
        thiamin: 1.2, riboflavin: 1.3, niacin: 16, vitaminB6: 1.3, folate: 400,
        vitaminB12: 2.4, biotin: 25, pantothenicAcid: 5, choline: 550
    },
    "teen14-18_female": {
        protein: 46, fat: 75, carbs: 275, fiber: 26, sugars: 50, satFat: 20,
        sodium: 2300, potassium: 2300, calcium: 1300, iron: 15, magnesium: 360,
        phosphorus: 1250, zinc: 9, copper: 0.89, manganese: 1.6, selenium: 55,
        chromium: 24, iodine: 150,
        vitaminA: 700, vitaminC: 65, vitaminD: 15, vitaminE: 15, vitaminK: 75,
        thiamin: 1.0, riboflavin: 1.0, niacin: 14, vitaminB6: 1.2, folate: 400,
        vitaminB12: 2.4, biotin: 25, pantothenicAcid: 5, choline: 400
    },
    senior_male: {
        protein: 56, fat: 78, carbs: 275, fiber: 30, sugars: 50, satFat: 20,
        sodium: 2300, potassium: 4700, calcium: 1200, iron: 8, magnesium: 420,
        phosphorus: 700, zinc: 11, copper: 0.9, manganese: 2.3, selenium: 55,
        chromium: 30, iodine: 150,
        vitaminA: 900, vitaminC: 90, vitaminD: 20, vitaminE: 15, vitaminK: 120,
        thiamin: 1.2, riboflavin: 1.3, niacin: 16, vitaminB6: 1.7, folate: 400,
        vitaminB12: 2.4, biotin: 30, pantothenicAcid: 5, choline: 550
    },
    senior_female: {
        protein: 46, fat: 78, carbs: 275, fiber: 21, sugars: 50, satFat: 20,
        sodium: 2300, potassium: 4700, calcium: 1200, iron: 8, magnesium: 320,
        phosphorus: 700, zinc: 8, copper: 0.9, manganese: 1.8, selenium: 55,
        chromium: 20, iodine: 150,
        vitaminA: 700, vitaminC: 75, vitaminD: 20, vitaminE: 15, vitaminK: 90,
        thiamin: 1.1, riboflavin: 1.1, niacin: 14, vitaminB6: 1.5, folate: 400,
        vitaminB12: 2.4, biotin: 30, pantothenicAcid: 5, choline: 425
    }
};

// Axis presets
const RADAR_PRESETS = {
    macros: ['protein', 'fat', 'carbs', 'fiber'],
    vitamins: ['vitaminA', 'vitaminC', 'vitaminD', 'vitaminE', 'vitaminK', 'vitaminB6', 'vitaminB12', 'folate'],
    minerals: ['calcium', 'iron', 'magnesium', 'potassium', 'zinc', 'phosphorus'],
    all: ['protein', 'fat', 'carbs', 'fiber', 'calcium', 'iron', 'magnesium', 'vitaminA', 'vitaminC', 'vitaminD', 'vitaminB12']
};

// Display names for axes
const RADAR_DISPLAY_NAMES = {
    // Macros
    protein: 'Protein',
    fat: 'Fat',
    carbs: 'Carbs',
    fiber: 'Fiber',
    // Carb subtypes
    sugars: 'Sugars',
    starch: 'Starch',
    // Fat subtypes
    satFat: 'Sat. Fat',
    monoFat: 'Mono Fat',
    polyFat: 'Poly Fat',
    transFat: 'Trans Fat',
    // Minerals
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
    // Vitamins
    vitaminA: 'Vitamin A',
    vitaminC: 'Vitamin C',
    vitaminD: 'Vitamin D',
    vitaminE: 'Vitamin E',
    vitaminK: 'Vitamin K',
    thiamin: 'Thiamin',
    riboflavin: 'Riboflavin',
    niacin: 'Niacin',
    vitaminB6: 'Vitamin B6',
    folate: 'Folate',
    vitaminB12: 'Vitamin B12',
    biotin: 'Biotin',
    pantothenicAcid: 'Panto. Acid',
    choline: 'Choline'
};

// Colors for the radar chart
const RADAR_COLORS = {
    primary: '#4A90D9',
    secondary: '#E94E77',
    tertiary: '#50C878'
};

// Current radar data
let currentRadarData = null;
let currentRadarAxes = ['protein', 'fat', 'carbs'];

// Get DRV profile based on selection
function getRadarDRVProfile(age, sex) {
    if (age === 'child') return RADAR_DRV_PROFILES.child;
    if (age === 'child4-8') return RADAR_DRV_PROFILES['child4-8'];
    if (age === 'child9-13') return RADAR_DRV_PROFILES['child9-13'];
    if (age === 'teen14-18') return RADAR_DRV_PROFILES[`teen14-18_${sex}`] || RADAR_DRV_PROFILES.default;
    if (age === 'adult') return RADAR_DRV_PROFILES[`adult_${sex}`] || RADAR_DRV_PROFILES.default;
    if (age === 'senior') return RADAR_DRV_PROFILES[`senior_${sex}`] || RADAR_DRV_PROFILES.default;
    return RADAR_DRV_PROFILES.default;
}

// Text wrap function for D3
function wrap(text, width) {
    text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            x = text.attr("x"),
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy") || 0),
            tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
        
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}

// Main RadarChart function - D3 v6 compatible
function RadarChart(id, data, options) {
    const cfg = {
        w: 450,
        h: 450,
        margin: { top: 80, right: 80, bottom: 80, left: 80 },
        levels: 5,
        maxValue: 1.0, // 100% DRV = 1.0
        labelFactor: 1.3,
        wrapWidth: 70,
        opacityArea: 0.35,
        dotRadius: 5,
        opacityCircles: 0.15,
        strokeWidth: 2,
        roundStrokes: true,
        color: d3.scaleOrdinal().range([RADAR_COLORS.primary, RADAR_COLORS.secondary, RADAR_COLORS.tertiary]),
        format: '.0%',
        unit: '% DRV'
    };

    // Apply options
    if (options) {
        Object.keys(options).forEach(key => {
            if (options[key] !== undefined) cfg[key] = options[key];
        });
    }

    // Calculate max value from data
    const maxValue = Math.max(cfg.maxValue, 
        d3.max(data, d => d3.max(d.map(o => o.value)))
    );

    const allAxis = data[0].map(d => d.axis);
    const total = allAxis.length;
    const radius = Math.min(cfg.w / 2, cfg.h / 2);
    const Format = d3.format(cfg.format);
    const angleSlice = (Math.PI * 2) / total;

    // Scale for radius
    const rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([0, maxValue]);

    // Remove existing SVG
    d3.select(id).select("svg").remove();

    // Create SVG
    const svg = d3.select(id).append("svg")
        .attr("width", cfg.w + cfg.margin.left + cfg.margin.right)
        .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
        .attr("class", "radar-chart");

    // Create main group
    const g = svg.append("g")
        .attr("transform", `translate(${cfg.w / 2 + cfg.margin.left}, ${cfg.h / 2 + cfg.margin.top})`);

    // Glow filter (subtle for light background)
    const defs = g.append('defs');
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '1.5').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Grid wrapper
    const axisGrid = g.append("g").attr("class", "axisWrapper");

    // Background circles
    axisGrid.selectAll(".levels")
        .data(d3.range(1, cfg.levels + 1).reverse())
        .enter()
        .append("circle")
        .attr("class", "gridCircle")
        .attr("r", d => radius / cfg.levels * d)
        .style("fill", "rgba(255, 255, 255, 0.25)")
        .style("stroke", "#999")
        .style("stroke-width", "1px")
        .style("fill-opacity", cfg.opacityCircles);

    // Axis labels (percentage markers)
    axisGrid.selectAll(".axisLabel")
        .data(d3.range(1, cfg.levels + 1).reverse())
        .enter()
        .append("text")
        .attr("class", "axisLabel")
        .attr("x", 4)
        .attr("y", d => -d * radius / cfg.levels)
        .attr("dy", "0.4em")
        .style("font-size", "10px")
        .attr("fill", "#555")
        .text(d => Format(maxValue * d / cfg.levels));

    // Create axes
    const axis = axisGrid.selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");

    // Axis lines
    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => rScale(maxValue * 1.05) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y2", (d, i) => rScale(maxValue * 1.05) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("class", "line")
        .style("stroke", "#888")
        .style("stroke-width", "1px");

    // Axis labels
    axis.append("text")
        .attr("class", "legend")
        .style("font-size", "11px")
        .style("font-weight", "700")
        .style("text-transform", "uppercase")
        .style("letter-spacing", "0.5px")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", (d, i) => rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y", (d, i) => rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("fill", "#333")
        .text(d => d)
        .call(wrap, cfg.wrapWidth);

    // Radial line generator
    const radarLine = d3.lineRadial()
        .curve(cfg.roundStrokes ? d3.curveCardinalClosed : d3.curveLinearClosed)
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice);

    // Create blob wrapper
    const blobWrapper = g.selectAll(".radarWrapper")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "radarWrapper");

    // Append backgrounds (filled areas)
    blobWrapper.append("path")
        .attr("class", "radarArea")
        .attr("d", d => radarLine(d))
        .style("fill", (d, i) => cfg.color(i))
        .style("fill-opacity", cfg.opacityArea)
        .on('mouseover', function(event, d) {
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", 0.1);
            d3.select(this)
                .transition().duration(200)
                .style("fill-opacity", 0.7);
        })
        .on('mouseout', function() {
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", cfg.opacityArea);
        });

    // Append outlines
    blobWrapper.append("path")
        .attr("class", "radarStroke")
        .attr("d", d => radarLine(d))
        .style("stroke-width", cfg.strokeWidth + "px")
        .style("stroke", (d, i) => cfg.color(i))
        .style("fill", "none")
        .style("filter", "url(#glow)");

    // Append dots
    blobWrapper.selectAll(".radarCircle")
        .data(d => d)
        .enter()
        .append("circle")
        .attr("class", "radarCircle")
        .attr("r", cfg.dotRadius)
        .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
        .style("fill", function() {
            const wrapper = d3.select(this.parentNode);
            const idx = data.indexOf(wrapper.datum());
            return cfg.color(idx);
        })
        .style("fill-opacity", 0.8);

    // Tooltip circles (invisible for hover)
    const tooltip = d3.select(id).select(".radar-tooltip-text");
    
    const blobCircleWrapper = g.selectAll(".radarCircleWrapper")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "radarCircleWrapper");

    blobCircleWrapper.selectAll(".radarInvisibleCircle")
        .data(d => d)
        .enter()
        .append("circle")
        .attr("class", "radarInvisibleCircle")
        .attr("r", cfg.dotRadius * 2)
        .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function(event, d) {
            const radarTooltip = document.getElementById('radarTooltip');
            if (radarTooltip) {
                radarTooltip.innerHTML = `
                    <strong>${d.axis}</strong><br>
                    ${(d.value * 100).toFixed(1)}% of DRV<br>
                    <small>${d.rawValue.toFixed(2)} ${d.unit}</small>
                `;
                radarTooltip.style.opacity = 1;
                radarTooltip.style.left = (event.clientX + 15) + 'px';
                radarTooltip.style.top = (event.clientY - 10) + 'px';
            }
        })
        .on("mouseout", function() {
            const radarTooltip = document.getElementById('radarTooltip');
            if (radarTooltip) {
                radarTooltip.style.opacity = 0;
            }
        });
}

// Parse nutrients for radar chart
function parseNutrientsForRadar(nutrients) {
    if (!nutrients) return null;
    
    const m = nutrients.mineralData || {};
    const v = nutrients.vitaminData || {};
    
    return {
        // Macros
        protein: { value: nutrients.protein || 0, unit: 'g' },
        fat: { value: nutrients.fat || 0, unit: 'g' },
        carbs: { value: nutrients.carbs || 0, unit: 'g' },
        fiber: { value: nutrients.fiber || 0, unit: 'g' },
        // Carb subtypes
        sugars: { value: nutrients.sugars || 0, unit: 'g' },
        starch: { value: nutrients.starch || 0, unit: 'g' },
        // Fat subtypes
        satFat: { value: nutrients.satFat || 0, unit: 'g' },
        monoFat: { value: nutrients.monoFat || 0, unit: 'g' },
        polyFat: { value: nutrients.polyFat || 0, unit: 'g' },
        transFat: { value: nutrients.transFat || 0, unit: 'g' },
        // Minerals
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
        iodine: { value: m.iodine || 0, unit: 'µg' },
        // Vitamins
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
    };
}

// Build radar data from nutrients
function buildRadarData(parsedNutrients, axes, profile) {
    const data = [];
    
    axes.forEach(key => {
        if (parsedNutrients[key] && profile[key]) {
            const value = parsedNutrients[key].value;
            const drv = profile[key];
            const percentage = drv > 0 ? value / drv : 0;
            
            data.push({
                axis: RADAR_DISPLAY_NAMES[key] || key,
                value: Math.min(percentage, 2), // Cap at 200% for display
                rawValue: value,
                drv: drv,
                unit: parsedNutrients[key].unit
            });
        }
    });
    
    return data;
}

// Render radar chart
function renderRadarChart(nutrients) {
    if (!nutrients) return;
    
    const age = document.getElementById('radarAge')?.value || 'adult';
    const sex = document.getElementById('radarSex')?.value || 'male';
    const roundStrokes = document.getElementById('radarRoundStrokes')?.checked ?? true;
    const preset = document.getElementById('radarPreset')?.value || 'macros';
    const maxValueSetting = parseFloat(document.getElementById('radarMaxValue')?.value) || 1.0;
    
    const profile = getRadarDRVProfile(age, sex);
    const parsedNutrients = parseNutrientsForRadar(nutrients);
    
    if (!parsedNutrients) return;
    
    // Determine axes based on preset
    let axes;
    if (preset === 'custom') {
        axes = Array.from(document.querySelectorAll('.radar-axis-toggle:checked'))
            .map(el => el.dataset.axis);
        if (axes.length < 3) {
            axes = ['protein', 'fat', 'carbs']; // Fallback
        }
    } else {
        axes = RADAR_PRESETS[preset] || RADAR_PRESETS.macros;
    }
    
    currentRadarAxes = axes;
    
    // Build data
    const radarData = buildRadarData(parsedNutrients, axes, profile);
    
    if (radarData.length < 3) {
        document.getElementById('radarChartContainer').innerHTML = 
            '<p class="text-center text-muted">Not enough data to display radar chart (need at least 3 axes)</p>';
        return;
    }
    
    // Get container dimensions
    const container = document.getElementById('radarChartContainer');
    const containerWidth = container.clientWidth || 600;
    
    // Adjust size based on number of axes (more axes = need more margin for labels)
    const axisCount = radarData.length;
    const marginSize = axisCount > 6 ? 100 : 80;
    const size = Math.min(containerWidth - marginSize * 2, 420);
    
    // Chart options
    const options = {
        w: size,
        h: size,
        margin: { top: marginSize, right: marginSize, bottom: marginSize, left: marginSize },
        levels: 5,
        maxValue: maxValueSetting, // Scale based on user selection
        roundStrokes: roundStrokes,
        labelFactor: axisCount > 6 ? 1.35 : 1.3,
        wrapWidth: axisCount > 6 ? 60 : 70,
        color: d3.scaleOrdinal().range([RADAR_COLORS.primary])
    };
    
    // Render chart
    RadarChart('#radarChartContainer', [radarData], options);
    
    // Update legend
    renderRadarLegend(radarData);
    
    // Enable download button
    const downloadBtn = document.getElementById('downloadRadarSvg');
    if (downloadBtn) downloadBtn.disabled = false;
}

// Render legend
function renderRadarLegend(data) {
    const legendContainer = document.getElementById('radarLegend');
    if (!legendContainer) return;
    
    let html = '<div class="radar-legend-items">';
    
    data.forEach(d => {
        const percentage = (d.value * 100).toFixed(0);
        const statusClass = d.value < 0.25 ? 'low' : d.value < 1 ? 'good' : 'high';
        html += `
            <span class="radar-legend-item ${statusClass}">
                <span class="radar-legend-dot"></span>
                ${d.axis}: ${percentage}%
            </span>
        `;
    });
    
    html += '</div>';
    legendContainer.innerHTML = html;
}

// Update radar chart
function updateRadarChart() {
    if (currentRadarData) {
        renderRadarChart(currentRadarData);
    }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    const presetSelect = document.getElementById('radarPreset');
    const ageSelect = document.getElementById('radarAge');
    const sexSelect = document.getElementById('radarSex');
    const roundStrokesToggle = document.getElementById('radarRoundStrokes');
    const customAxesContainer = document.getElementById('radarCustomAxes');
    
    // Preset change
    if (presetSelect) {
        presetSelect.addEventListener('change', (e) => {
            if (customAxesContainer) {
                customAxesContainer.style.display = e.target.value === 'custom' ? 'block' : 'none';
            }
            updateRadarChart();
        });
    }
    
    // Age/Sex change
    if (ageSelect) ageSelect.addEventListener('change', updateRadarChart);
    if (sexSelect) sexSelect.addEventListener('change', updateRadarChart);
    if (roundStrokesToggle) roundStrokesToggle.addEventListener('change', updateRadarChart);
    
    // Max value (scale) change
    const maxValueSelect = document.getElementById('radarMaxValue');
    if (maxValueSelect) maxValueSelect.addEventListener('change', updateRadarChart);
    
    // Custom axis toggles
    document.querySelectorAll('.radar-axis-toggle').forEach(toggle => {
        toggle.addEventListener('change', () => {
            if (document.getElementById('radarPreset')?.value === 'custom') {
                updateRadarChart();
            }
        });
    });
    
    // Handle tab visibility
    document.getElementById('radar-tab')?.addEventListener('shown.bs.tab', () => {
        if (currentRadarData) {
            // Re-render on tab show to handle container sizing
            setTimeout(updateRadarChart, 50);
        }
    });
});

// Public function to update radar chart with new data
function updateRadarChartData(nutrients) {
    currentRadarData = nutrients;
    renderRadarChart(nutrients);
}

// Download radar chart as SVG
function downloadRadarSVG() {
    const container = document.getElementById('radarChartContainer');
    const svg = container.querySelector('svg');
    if (!svg) return;
    
    // Clone the SVG
    const clone = svg.cloneNode(true);
    
    // Add a background rect
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', '100%');
    bg.setAttribute('height', '100%');
    bg.setAttribute('fill', '#eae5e3'); // Match the page background
    clone.insertBefore(bg, clone.firstChild);
    
    // Add inline styles for elements
    clone.querySelectorAll('.gridCircle').forEach(el => {
        el.style.fill = 'rgba(255, 255, 255, 0.25)';
        el.style.stroke = '#999';
        el.style.strokeWidth = '1px';
    });
    
    clone.querySelectorAll('.axisLabel').forEach(el => {
        el.style.fill = '#555';
        el.style.fontSize = '10px';
    });
    
    clone.querySelectorAll('.legend').forEach(el => {
        el.style.fill = '#333';
        el.style.fontSize = '11px';
        el.style.fontWeight = '700';
        el.style.textTransform = 'uppercase';
        el.style.letterSpacing = '0.5px';
    });
    
    clone.querySelectorAll('.line').forEach(el => {
        el.style.stroke = '#888';
        el.style.strokeWidth = '1px';
    });
    
    clone.querySelectorAll('.radarArea').forEach(el => {
        el.style.fillOpacity = '0.35';
    });
    
    clone.querySelectorAll('.radarStroke').forEach(el => {
        el.style.strokeWidth = '2px';
        el.style.fill = 'none';
    });
    
    clone.querySelectorAll('.radarCircle').forEach(el => {
        el.style.fillOpacity = '0.8';
    });
    
    // Serialize to string
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(clone);
    
    // Add XML declaration
    svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
    
    // Create blob and download
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Get food name for filename
    const foodTitle = document.getElementById('radar_graphTitle')?.textContent || 'radar-chart';
    const cleanTitle = foodTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const preset = document.getElementById('radarPreset')?.value || 'macros';
    
    link.href = url;
    link.download = `${cleanTitle}_radar_${preset}.svg`;
    link.click();
    URL.revokeObjectURL(url);
}

// Set up download button
document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.getElementById('downloadRadarSvg');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadRadarSVG);
    }
});

// Export for use by other modules
window.updateRadarChartData = updateRadarChartData;
window.downloadRadarSVG = downloadRadarSVG;

