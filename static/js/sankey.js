// Define color schemes
// Search functionality
document.getElementById('searchButton').addEventListener('click', performSearch);
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});

let lastSearchQuery = '';

// Get selected data types from checkboxes
function getSelectedDataTypes() {
    const types = [];
    const checkboxes = [
        { id: 'dtBranded', value: 'Branded' },
        { id: 'dtSRLegacy', value: 'SR Legacy' },
        { id: 'dtFNDDS', value: 'Survey (FNDDS)' },
        { id: 'dtFoundation', value: 'Foundation' }
    ];
    checkboxes.forEach(cb => {
        const el = document.getElementById(cb.id);
        if (el && el.checked) {
            types.push(cb.value);
        }
    });
    return types;
}

function performSearch(queryParam) {
    const query = (typeof queryParam === 'string' ? queryParam : document.getElementById('searchInput').value.trim());
    if (!query) return;
    lastSearchQuery = query;

    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    searchResults.style.display = 'block';

    // Build URL with selected data types
    const dataTypes = getSelectedDataTypes();
    let url = `/api/search?q=${encodeURIComponent(query)}`;
    if (dataTypes.length > 0) {
        url += '&dataTypes=' + encodeURIComponent(dataTypes.join(','));
    }

    fetch(url)
        .then(async response => {
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                const msg = err.error || `Search failed (HTTP ${response.status})`;
                throw new Error(msg);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            searchResults.innerHTML = '';
            if (data.results.length === 0) {
                searchResults.innerHTML = '<div class="alert alert-info">No results found</div>';
                return;
            }

            data.results.forEach(food => {
                const button = document.createElement('button');
                button.className = 'list-group-item list-group-item-action';
                button.innerHTML = `
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${food.description}</h6>
                        <small>${food.dataType}</small>
                    </div>
                    ${food.brandOwner ? `<small class="text-muted">Brand: ${food.brandOwner}</small>` : ''}
                `;
                button.addEventListener('click', () => {
                    // Remember the current selection
                    currentFoodId = food.fdcId;

                    // Update Sankey diagram
                    updateSankey(food.fdcId);
                    
                    // Update graph details with food description
                    updateGraphDetails(food.fdcId, food.description);
                    
                    // Hide search results
                    searchResults.style.display = 'none';
                    
                    // Clear search input
                    document.getElementById('searchInput').value = '';
                });
                searchResults.appendChild(button);
            });
        })
        .catch(error => {
            searchResults.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
            showToast(error.message, () => performSearch(lastSearchQuery));
        });
}

const nodeColor = {
    "Total": "#658394",
    "Water": "#658394",
    "Protein": "#54886A",
    "Amino Acids": "#54886A",
    "Fat": "#B22222",
    "Sat.": "#B22222",
    "Mono": "#B22222",
    "Poly": "#B22222",
    "Trans": "#8B0000",
    "Fatty Acids": "#B22222",
    "Other Fats": "#B22222",
    "Carbs": "#CC9A2E",
    "Sugars": "#CC9A2E",
    "Fiber": "#CC9A2E",
    "Starch": "#CC9A2E",
    "Nutr./Mins.": "#0000ff",
};

// Base link colors - we'll look up both directions
const linkColorBase = {
    "Total-Water": "#658394",
    "Total-Protein": "#67B080",
    "Total-Carbs": "#CC9A2E",
    "Total-Fat": "#B22222",
    "Total-Nutr./Mins.": "#9386A4",
    "Protein-Amino Acids": "#67B080",
    "Fat-Mono": "#B22222",
    "Fat-Sat.": "#B22222",
    "Fat-Poly": "#B22222",
    "Fat-Trans": "#8B0000",
    "Mono-Fatty Acids": "#B22222",
    "Sat.-Fatty Acids": "#B22222",
    "Poly-Fatty Acids": "#B22222",
    "Trans-Fatty Acids": "#8B0000",
    "Fat-Other Fats": "#B22222", 
    "Carbs-Starch": "#CC9A2E", 
    "Carbs-Sugars": "#CC9A2E", 
    "Carbs-Fiber": "#CC9A2E",
    // Reverse hierarchy specific
    "Total-Amino Acids": "#67B080",
    "Total-Fatty Acids": "#B22222",
    "Total-Other Fats": "#B22222",
    "Total-Sugars": "#CC9A2E",
    "Total-Fiber": "#CC9A2E",
    "Total-Starch": "#CC9A2E",
};

// Get link color - checks both directions (A-B and B-A)
function getLinkColor(sourceName, targetName) {
    const key1 = `${sourceName}-${targetName}`;
    const key2 = `${targetName}-${sourceName}`;
    return linkColorBase[key1] || linkColorBase[key2] || "#666363";
}

// Set up dimensions and margins - adjust for mobile
const isMobile = window.innerWidth <= 768;
const margin = { 
    top: isMobile ? 20 : 30, 
    right: isMobile ? 100 : 160, 
    bottom: isMobile ? 20 : 30, 
    left: isMobile ? 5 : 10 
};
let width = document.getElementById('sankeyDiagram_my_dataviz').clientWidth - margin.left - margin.right;

// Different heights for mobile vs desktop
let chartHeightSmall = isMobile ? 350 : 550;
let chartHeightMedium = isMobile ? 500 : 1000;
let chartHeightLarge = isMobile ? 650 : 1100;
let chartHeightCurrent = chartHeightSmall;
let height = chartHeightCurrent - margin.top - margin.bottom;

// Track the currently selected food id for safe re-renders
let currentFoodId = null;
let showValueLabels = false;
let reverseFlow = false;
let reverseHierarchy = false;

// Initialize the Sankey diagram
const sankey = d3.sankey()
    .nodeWidth(20)
    .nodePadding(17)
    .extent([[0, 2], [width - 1, height - 5]]);

// Create SVG container
const svg = d3.select("#sankeyDiagram_my_dataviz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

/*
  ===============
    // Function to highlight the opacity of the nodes and its connected links
  ===============
  */
  function highlightNode(event, d) {
    const allLinks = svg.selectAll(".link");
    const allNodes = svg.selectAll(".node rect");
    const allTexts = svg.selectAll(".node text");
    const allLabels = svg.selectAll(".node-label");

    if (event.type === "mouseover") {
        let highlightedNodes = new Set([d]); // Start with the current node
        let highlightedLinks = new Set();

        // Function to highlight downstream nodes
        function highlightChildren(node) {
            allLinks.each(function(link) {
                if (link.source === node) {
                    highlightedLinks.add(link);
                    if (!highlightedNodes.has(link.target)) {
                        highlightedNodes.add(link.target);
                        highlightChildren(link.target); // Recursively highlight children
                    }
                }
            });
        }

        // Function to highlight upstream nodes
        function highlightParents(node) {
            allLinks.each(function(link) {
                if (link.target === node) {
                    highlightedLinks.add(link);
                    if (!highlightedNodes.has(link.source)) {
                        highlightedNodes.add(link.source);
                        highlightParents(link.source); // Recursively highlight parents
                    }
                }
            });
        }

        // Start highlighting process for both children and parents
        highlightChildren(d);
        highlightParents(d);

        // Set opacity for all links and nodes based on whether they are highlighted
        allLinks
            .style("stroke-opacity", link => highlightedLinks.has(link) ? 0.8 : 0.05)
            .style("transition", "stroke-opacity 0.3s ease");
            
        allNodes
            .style("opacity", node => highlightedNodes.has(node) ? 1 : 0.05)
            .style("transition", "opacity 0.3s ease");
            
        allTexts
            .style("opacity", function() {
                const bound = this.parentNode && this.parentNode.__data__;
                return highlightedNodes.has(bound) ? 1 : 0.1;
            })
            .style("transition", "opacity 0.3s ease");

    } else if (event.type === "mouseout") {
        // Reset opacities to normal
        allLinks.style("stroke-opacity", 0.2);
        allNodes.style("opacity", 1);
        allTexts.style("opacity", 1);  // Reset text opacity
    }
}

// Function to update the Sankey diagram
async function updateSankey(foodId) {
    try {
        // Show loading state
        d3.select("#sankeyDiagram_my_dataviz").selectAll(".loading").remove();
        d3.select("#sankeyDiagram_my_dataviz").append("div")
            .attr("class", "loading")
            .text("Loading...");

        // Fetch data from our Flask API
        const url = `/api/food/${foodId}?reverseHierarchy=${reverseHierarchy}`;
        const response = await fetch(url);
        if (!response.ok) {
            let message = `Failed to fetch data (HTTP ${response.status})`;
            try {
                const body = await response.json();
                if (body && body.error) message = body.error;
            } catch (e) {}
            throw new Error(message);
        }
        const data = await response.json();

        // Remove loading state
        d3.select(".loading").remove();

        // Clear existing diagram and nutrient details
        svg.selectAll("*").remove();
        updateNutrientDetails(data);

        // Generate the Sankey layout
        const { nodes, links } = sankey(data);
        // Optionally mirror layout horizontally for reverse flow
        if (reverseFlow) {
            nodes.forEach(d => {
                const oldX0 = d.x0;
                const oldX1 = d.x1;
                d.x0 = width - oldX1;
                d.x1 = width - oldX0;
            });
        }

        // Add links
        svg.append("g")
            .selectAll("path")
            .data(links)
            .join("path")
            .attr("class", "link")
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke-width", d => Math.max(1, d.width))
            .style("stroke", d => getLinkColor(d.source.name, d.target.name))
            .style("stroke-opacity", 0.2)
            .on("mouseover", function(event, d) {
                showTooltip(event, d);
                highlightNode(event, d);
            })
            .on("mouseout", function(event, d) {
                hideTooltip();
                highlightNode(event, d);
            });

        // Add nodes
        const node = svg.append("g")
            .selectAll("g")
            .data(nodes)
            .join("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

        // Add rectangles for nodes
        node.append("rect")
            .attr("height", d => d.y1 - d.y0)
            .attr("width", d => d.x1 - d.x0)
            .attr("fill", d => nodeColor[d.name] || "#666")
            .on("mouseover", function(event, d) {
                showTooltip(event, d);
                highlightNode(event, d);
            })
            .on("mouseout", function(event, d) {
                hideTooltip();
                highlightNode(event, d);
            });

        // Add labels
        // Determine label placement based on node type, flow direction, and hierarchy mode
        
        // Fat subtypes always get labels on the right (they're squeezed in the middle)
        const fatSubtypes = new Set(["Sat.", "Mono", "Poly", "Trans"]);
        
        node.append("text")
            .attr("x", d => {
                const isSource = d.targetLinks.length === 0 && d.sourceLinks.length > 0;
                const isSink = d.sourceLinks.length === 0 && d.targetLinks.length > 0;
                const nodeWidth = d.x1 - d.x0;
                
                // Detail→Macro + Normal flow: ALL labels on LEFT of bars
                if (reverseHierarchy && !reverseFlow) {
                    return -6;  // All labels on left, including fat subtypes
                }
                
                // Fat subtypes: always label on right (they're in a tight middle column)
                if (fatSubtypes.has(d.name)) {
                    return nodeWidth + 6;
                }
                
                // Special handling for Fatty Acids in reverse flow
                if (d.name === "Fatty Acids" && reverseFlow) {
                    return -6;
                }
                
                if (reverseFlow) {
                    // Reverse flow: chart is mirrored
                    // Sources appear on right, sinks on left
                    if (isSource) return nodeWidth + 6;  // label to right
                    if (isSink) return -6;               // label to left
                    // Middle nodes: based on position
                    const nodeCenter = (d.x0 + d.x1) / 2;
                    return nodeCenter > width / 2 ? nodeWidth + 6 : -6;
                } else {
                    // Normal flow + Normal hierarchy: sources on left, sinks on right
                    if (isSource) return nodeWidth + 6;  // label to right of source
                    if (isSink) return nodeWidth + 6;    // label to right of sink
                    // Middle nodes: based on position
                    const nodeCenter = (d.x0 + d.x1) / 2;
                    return nodeCenter < width / 2 ? nodeWidth + 6 : -6;
                }
            })
            .attr("y", d => (d.y1 - d.y0) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", d => {
                const isSource = d.targetLinks.length === 0 && d.sourceLinks.length > 0;
                const isSink = d.sourceLinks.length === 0 && d.targetLinks.length > 0;
                
                // Detail→Macro + Normal flow: ALL labels on LEFT (anchor end)
                if (reverseHierarchy && !reverseFlow) {
                    return "end";  // All labels anchor end (right-aligned, to left of bar)
                }
                
                if (fatSubtypes.has(d.name)) {
                    return "start";
                }
                
                if (d.name === "Fatty Acids" && reverseFlow) {
                    return "end";
                }
                
                if (reverseFlow) {
                    if (isSource) return "start";
                    if (isSink) return "end";
                    const nodeCenter = (d.x0 + d.x1) / 2;
                    return nodeCenter > width / 2 ? "start" : "end";
                } else {
                    if (isSource) return "start";
                    if (isSink) return "start";
                    const nodeCenter = (d.x0 + d.x1) / 2;
                    return nodeCenter < width / 2 ? "start" : "end";
                }
            })
            .text(d => formatNodeLabel(d))
            .style("fill", "#333")
            .style("display", d => shouldShowLabel(d) ? null : "none");

        // Update title and subhead will be handled by the click handler
        const dlBtn = document.getElementById('downloadSvgBtn');
        if (dlBtn) dlBtn.disabled = false;

    } catch (error) {
        console.error('Error updating Sankey diagram:', error);
        // Show error message to user
        d3.select(".loading").remove();
        d3.select("#sankeyDiagram_my_dataviz").append("div")
            .attr("class", "alert alert-danger")
            .text(String(error.message || error));
        // Offer retry toast
        showToast(String(error.message || 'Failed to load data'), () => {
            if (currentFoodId) updateSankey(currentFoodId);
        });
        const dlBtn = document.getElementById('downloadSvgBtn');
        if (dlBtn) dlBtn.disabled = true;
    }
}

// Toast helper
function showToast(message, retryFn) {
    const container = document.getElementById('toastContainer') || (function() {
        const c = document.createElement('div');
        c.id = 'toastContainer';
        c.className = 'toast-container';
        document.body.appendChild(c);
        return c;
    })();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="toast-title">Request failed</div>
        <div class="toast-body">${escapeHtml(message)}</div>
        <div class="toast-actions">
            ${retryFn ? '<button class="retry-btn">Retry</button>' : ''}
            <button class="secondary close-btn">Dismiss</button>
        </div>
    `;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    function cleanup() {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 180);
    }
    const closeBtn = toast.querySelector('.close-btn');
    if (closeBtn) closeBtn.addEventListener('click', cleanup);
    const retryBtn = toast.querySelector('.retry-btn');
    if (retryBtn && typeof retryFn === 'function') {
        retryBtn.addEventListener('click', () => {
            cleanup();
            retryFn();
        });
    }
    setTimeout(cleanup, 6000);
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// SVG download
function downloadSankeySVG(options) {
    const svg = document.querySelector('#sankeyDiagram_my_dataviz svg');
    if (!svg) return;
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    // Ensure no element uses pure black fills in the exported SVG
    sanitizeBlackFills(clone);
    // Add export-specific CSS to remove fills and keep strokes/text visible
    insertExportStyles(clone);
    // Optional: ensure background is white by default
    // const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    // rect.setAttribute("width", clone.getAttribute("width"));
    // rect.setAttribute("height", clone.getAttribute("height"));
    // rect.setAttribute("fill", "#ffffff");
    // clone.insertBefore(rect, clone.firstChild);
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(clone);
    if (!source.match(/^<\?xml/)) {
        source = '<?xml version="1.0" encoding="UTF-8"?>\n' + source;
    }
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = `sankey_${currentFoodId || 'chart'}.svg`;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

const downloadBtn = document.getElementById('downloadSvgBtn');
if (downloadBtn) {
    downloadBtn.addEventListener('click', () => downloadSankeySVG({ tall: false }));
}
// no tall button; chart mode controls screen size, download reflects what's on screen

// Format node label based on toggle
function formatNodeLabel(d) {
    if (showValueLabels && typeof d.value === 'number') {
        return `${d.name} (${d.value.toFixed(1)}g)`;
    }
    return d.name;
}

function shouldShowLabel(d) {
    const v = typeof d.value === 'number' ? d.value : 0;
    return v > 0;
}

// Toggle handler for showing values in labels
const toggleValueLabelsEl = document.getElementById('toggleValueLabels');
if (toggleValueLabelsEl) {
    toggleValueLabelsEl.addEventListener('change', (e) => {
        showValueLabels = !!e.target.checked;
        // Update existing labels without full re-render
        d3.selectAll('#sankeyDiagram_my_dataviz .node text')
            .text(d => formatNodeLabel(d))
            .style("display", d => shouldShowLabel(d) ? null : "none");
    });
}

// Reverse flow toggle (mirrors chart horizontally)
const toggleReverseFlowEl = document.getElementById('toggleReverseFlow');
if (toggleReverseFlowEl) {
    toggleReverseFlowEl.addEventListener('change', (e) => {
        reverseFlow = !!e.target.checked;
        applyFlowMargins();
        if (currentFoodId) updateSankey(currentFoodId);
    });
}

// Reverse hierarchy toggle (swaps macro/subtype order: detail → macro)
const toggleReverseHierarchyEl = document.getElementById('toggleReverseHierarchy');
if (toggleReverseHierarchyEl) {
    toggleReverseHierarchyEl.addEventListener('change', (e) => {
        reverseHierarchy = !!e.target.checked;
        // Re-fetch data with new hierarchy mode (margins stay the same)
        applyFlowMargins();
        if (currentFoodId) updateSankey(currentFoodId);
    });
}
// Replace any black fills with a dark gray to avoid #000 in the exported SVG
function sanitizeBlackFills(root) {
    const candidates = new Set(['#000', '#000000', 'black', 'rgb(0, 0, 0)', '#000000ff']);
    const shapeTags = new Set(['rect','path','circle','ellipse','polygon','polyline','line','g']); // leave text fills intact
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) {
        const el = walker.currentNode;
        if (!el.getAttribute) continue;
        const tag = (el.tagName || '').toLowerCase();
        const isShape = shapeTags.has(tag);
        if (!isShape) {
            // Skip non-shape elements (e.g., text), keep their fills
            continue;
        }
        const fillAttr = el.getAttribute('fill');
        if (fillAttr && candidates.has(fillAttr.trim().toLowerCase())) {
            el.setAttribute('fill', 'none');
        }
        const styleAttr = el.getAttribute('style');
        if (styleAttr) {
            const newStyle = styleAttr.replace(/fill\s*:\s*(#?000(?:000)?|black|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))/ig, 'fill:none');
            if (newStyle !== styleAttr) {
                el.setAttribute('style', newStyle);
            }
        }
    }
}

// Insert CSS to remove fills for shapes while preserving strokes and text color
function insertExportStyles(rootSvg) {
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.setAttribute("type", "text/css");
    style.textContent = `
      /* Remove fills for shapes in export; keep strokes and text */
      .node rect { fill: none !important; stroke: #333333 !important; stroke-width: 1; }
      rect, path, circle, ellipse, polygon, polyline { fill: none !important; }
      text { fill: #333333 !important; }
    `;
    defs.appendChild(style);
    // Insert at the top for precedence
    const first = rootSvg.firstChild;
    if (first) {
        rootSvg.insertBefore(defs, first);
    } else {
        rootSvg.appendChild(defs);
    }
}

// Tooltip functions
function showTooltip(event, d) {
    const tooltip = d3.select("#sankeyTooltip");
    const [x, y] = d3.pointer(event);
    
    let content = d.source ? 
        `${d.source.name} → ${d.target.name}<br>${d.value.toFixed(2)}g` :
        `${d.name}<br>${d.value.toFixed(2)}g`;

    tooltip.html(content)
        .style("left", (x + margin.left) + "px")
        .style("top", (y + margin.top) + "px")
        .transition()
        .duration(200)
        .style("opacity", 1);
}

function hideTooltip() {
    d3.select("#sankeyTooltip")
        .transition()
        .duration(200)
        .style("opacity", 0);
}

// Update graph details
function updateGraphDetails(foodId, foodDescription) {
    // Create title from food description
    const title = `What nutrients make up ${foodDescription.toUpperCase()}?`;
    const subhead = "Nutrient breakdown per 100g serving";

    document.getElementById("sankeyDiagram_graphTitle").innerHTML = `<b>${title}</b>`;
    document.getElementById("sankeyDiagram_graphSubhead").textContent = subhead;
    
    // Update source link with direct USDA food data link
    const usdaLink = `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${foodId}/nutrients`;
    document.getElementById("sankeyDiagram_graphSource").innerHTML = 
        `Source: <a href="${usdaLink}" target="_blank">USDA FoodData Central Database</a>`;
}

// No default button controls on this page; search triggers rendering
// Chart height mode controls (Default/Tall)
function recomputeHeight() {
    height = chartHeightCurrent - margin.top - margin.bottom;
}
function applyFlowMargins() {
    // Reserve label gap for labels that extend outside the chart area
    // Use consistent total margins so sankey width stays the same across all modes
    const nowMobile = window.innerWidth <= 768;
    const labelGap = nowMobile ? 100 : 160;
    const smallGap = nowMobile ? 10 : 10;
    
    // Total margin should be consistent: labelGap + smallGap on each configuration
    if (reverseFlow) {
        // Reverse flow: labels on both sides, split evenly
        const halfMargin = (labelGap + smallGap) / 2;
        margin.left = halfMargin;
        margin.right = halfMargin;
    } else if (reverseHierarchy) {
        // Detail→Macro + Normal flow: labels on LEFT
        margin.left = labelGap;
        margin.right = smallGap;
    } else {
        // Normal hierarchy + Normal flow: labels on RIGHT
        margin.left = smallGap;
        margin.right = labelGap;
    }
    width = document.getElementById('sankeyDiagram_my_dataviz').clientWidth - margin.left - margin.right;
    // Update outer svg size and inner group transform
    d3.select("#sankeyDiagram_my_dataviz svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
    svg.attr("transform", `translate(${margin.left},${margin.top})`);
    sankey.extent([[0, 2], [width - 1, height - 5]]);
}
function applyChartSizing() {
    recomputeHeight();
    applyFlowMargins();
    if (currentFoodId) {
        updateSankey(currentFoodId);
    }
}
const modeSmallEl = document.getElementById('modeSmall');
const modeMediumEl = document.getElementById('modeMedium');
const modeLargeEl = document.getElementById('modeLarge');
if (modeSmallEl) {
    modeSmallEl.addEventListener('change', (e) => {
        if (e.target.checked) {
            chartHeightCurrent = chartHeightSmall;
            applyChartSizing();
        }
    });
}
if (modeMediumEl) {
    modeMediumEl.addEventListener('change', (e) => {
        if (e.target.checked) {
            chartHeightCurrent = chartHeightMedium;
            applyChartSizing();
        }
    });
}
if (modeLargeEl) {
    modeLargeEl.addEventListener('change', (e) => {
        if (e.target.checked) {
            chartHeightCurrent = chartHeightLarge;
            applyChartSizing();
        }
    });
}

// Handle window resize
window.addEventListener('resize', () => {
    // Recalculate mobile state and update heights/margins accordingly
    const nowMobile = window.innerWidth <= 768;
    margin.top = nowMobile ? 20 : 30;
    margin.right = nowMobile ? 100 : 160;
    margin.bottom = nowMobile ? 20 : 30;
    margin.left = nowMobile ? 5 : 10;
    
    // Update chart height options based on screen size
    chartHeightSmall = nowMobile ? 350 : 550;
    chartHeightMedium = nowMobile ? 500 : 1000;
    chartHeightLarge = nowMobile ? 650 : 1100;
    
    // Reapply current size mode with new heights
    if (document.getElementById('modeSmall').checked) {
        chartHeightCurrent = chartHeightSmall;
    } else if (document.getElementById('modeMedium').checked) {
        chartHeightCurrent = chartHeightMedium;
    } else if (document.getElementById('modeLarge').checked) {
        chartHeightCurrent = chartHeightLarge;
    }
    height = chartHeightCurrent - margin.top - margin.bottom;
    
    width = document.getElementById('sankeyDiagram_my_dataviz').clientWidth - margin.left - margin.right;
    d3.select("#sankeyDiagram_my_dataviz svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
    sankey.extent([[0, 2], [width - 1, height - 5]]);
    // Only re-render if we have a current selection
    if (currentFoodId) {
        updateSankey(currentFoodId);
    }
});

// Function to update the nutrient details text view
function updateNutrientDetails(data) {
    const macroNutrients = document.getElementById('macroNutrients');
    const fatBreakdown = document.getElementById('fatBreakdown');
    const additionalInfo = document.getElementById('additionalInfo');

    // Find node values
    const findNodeValue = (name) => {
        const node = data.nodes.find(n => n.name === name);
        const links = data.links.filter(l => l.target === node?.node);
        return links.reduce((sum, link) => sum + link.value, 0);
    };

    // Format macronutrients
    const macroHTML = `
        <ul class="list-unstyled">
            <li>Water: ${findNodeValue('Water').toFixed(1)}g</li>
            <li>Protein: ${findNodeValue('Protein').toFixed(1)}g</li>
            <li>Carbohydrates: ${findNodeValue('Carbs').toFixed(1)}g</li>
            <li>Total Fat: ${findNodeValue('Fat').toFixed(1)}g</li>
        </ul>
    `;

    // Format fat breakdown
    const transFat = findNodeValue('Trans');
    const fatHTML = `
        <ul class="list-unstyled">
            <li>Saturated Fat: ${findNodeValue('Sat.').toFixed(1)}g</li>
            <li>Monounsaturated Fat: ${findNodeValue('Mono').toFixed(1)}g</li>
            <li>Polyunsaturated Fat: ${findNodeValue('Poly').toFixed(1)}g</li>
            ${transFat > 0 ? `<li><strong>Trans Fat: ${transFat.toFixed(2)}g</strong></li>` : ''}
            <li>Other Fats: ${findNodeValue('Other Fats').toFixed(1)}g</li>
        </ul>
    `;

    // Format additional information
    const additionalHTML = `
        <ul class="list-unstyled">
            <li>Sugars: ${findNodeValue('Sugars').toFixed(1)}g</li>
            <li>Fiber: ${findNodeValue('Fiber').toFixed(1)}g</li>
            <li>Minerals & Nutrients: ${findNodeValue('Nutr./Mins.').toFixed(1)}g</li>
        </ul>
    `;

    macroNutrients.innerHTML = macroHTML;
    fatBreakdown.innerHTML = fatHTML;
    additionalInfo.innerHTML = additionalHTML;
}