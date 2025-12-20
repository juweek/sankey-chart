// API Configuration - Change this to your Cloudflare Worker URL after deployment
const API_BASE_URL = "https://sankey-usda-proxy.gourmetdata.workers.dev";
// For local development with Flask, use: const API_BASE_URL = "";

// Side Panel Toggle
const sidePanel = document.getElementById('sidePanel');
const openPanelBtn = document.getElementById('openPanelBtn');
const closePanelBtn = document.getElementById('closePanelBtn');
const panelOverlay = document.getElementById('panelOverlay');

function openPanel() {
    sidePanel.classList.add('open');
    panelOverlay.classList.add('active');
    openPanelBtn.classList.add('hidden');
}

function closePanel() {
    sidePanel.classList.remove('open');
    panelOverlay.classList.remove('active');
    openPanelBtn.classList.remove('hidden');
}

if (openPanelBtn) openPanelBtn.addEventListener('click', openPanel);
if (closePanelBtn) closePanelBtn.addEventListener('click', closePanel);
if (panelOverlay) panelOverlay.addEventListener('click', closePanel);

// Close panel on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidePanel.classList.contains('open')) {
        closePanel();
    }
});

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

let currentSearchPage = 1;

function performSearch(queryParam, page = 1) {
    const query = (typeof queryParam === 'string' ? queryParam : document.getElementById('searchInput').value.trim());
    if (!query) return;
    lastSearchQuery = query;
    currentSearchPage = page;

    const searchResults = document.getElementById('searchResults');
    
    // Show loading, but keep existing results if loading more
    if (page === 1) {
        searchResults.innerHTML = '<div class="text-center py-3"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    }
    searchResults.style.display = 'block';

    // Build URL with selected data types and page
    const dataTypes = getSelectedDataTypes();
    let url = `${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}&page=${page}`;
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
            
            // Clear results only on first page
            if (page === 1) {
                searchResults.innerHTML = '';
            } else {
                // Remove the "Load More" button if it exists
                const loadMoreBtn = searchResults.querySelector('.load-more-btn');
                if (loadMoreBtn) loadMoreBtn.remove();
            }
            
            if (data.results.length === 0 && page === 1) {
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
                    currentFoodName = food.description;

                    // Update Sankey diagram
                    updateSankey(food.fdcId);
                    
                    // Update treemaps if function exists
                    if (typeof window.updateTreemapsForFood === 'function') {
                        window.updateTreemapsForFood(food.fdcId);
                    }
                    
                    // Update graph details with food description
                    updateGraphDetails(food.fdcId, food.description);
                    
                    // Hide search results
                    searchResults.style.display = 'none';
                    
                    // Clear search input
                    document.getElementById('searchInput').value = '';
                });
                searchResults.appendChild(button);
            });

            // Add "Load More" button if there are more results
            if (data.hasMore) {
                const loadMoreDiv = document.createElement('div');
                loadMoreDiv.className = 'load-more-btn text-center py-2';
                loadMoreDiv.innerHTML = `
                    <button class="btn btn-outline-primary btn-sm">
                        Load More (Page ${data.page} of ${data.totalPages})
                    </button>
                `;
                loadMoreDiv.querySelector('button').addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Show loading indicator on button
                    loadMoreDiv.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div>';
                    performSearch(lastSearchQuery, currentSearchPage + 1);
                });
                searchResults.appendChild(loadMoreDiv);
            }
        })
        .catch(error => {
            searchResults.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
            showToast(error.message, () => performSearch(lastSearchQuery));
        });
}

const nodeColor = {
    "Total": "#4A5568",  // Darker slate gray for the aggregate node
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
    "Sodium": "#8B5FCF",      // Darker purple for sodium
    "Minerals": "#9370DB",    // Purple for minerals
};

// Text colors for node labels
const nodeTextColor = {
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
    "Minerals": "#5D39A7",
};

// Get text color for a node
function getNodeTextColor(nodeName) {
    return nodeTextColor[nodeName] || "#333";
}

// Base link colors - we'll look up both directions
const linkColorBase = {
    "Total-Water": "#658394",
    "Total-Protein": "#67B080",
    "Total-Carbs": "#CC9A2E",
    "Total-Sodium": "#8B5FCF",
    "Total-Minerals": "#9370DB",
    "Total-Fat": "#B22222",  // Direct link when fat breakdown is disabled
    // Fat subtypes to Fat (normal mode: Total → Sat/Mono/Poly → Fat)
    "Sat.-Fat": "#B22222",
    "Mono-Fat": "#B22222",
    "Poly-Fat": "#B22222",
    "Trans-Fat": "#8B0000",
    "Other Fats-Fat": "#B22222",
    // Total to fat subtypes (normal mode)
    "Total-Sat.": "#B22222",
    "Total-Mono": "#B22222",
    "Total-Poly": "#B22222",
    "Total-Trans": "#8B0000",
    "Total-Other Fats": "#B22222",
    // Carbs breakdown
    "Carbs-Starch": "#CC9A2E", 
    "Carbs-Sugars": "#CC9A2E", 
    "Carbs-Fiber": "#CC9A2E",
    // Reverse hierarchy: subtypes to Total
    "Total-Sugars": "#CC9A2E",
    "Total-Fiber": "#CC9A2E",
    "Total-Starch": "#CC9A2E",
    // Detail → Macro: Fat to subtypes
    "Fat-Sat.": "#B22222",
    "Fat-Mono": "#B22222",
    "Fat-Poly": "#B22222",
    "Fat-Trans": "#8B0000",
    "Fat-Other Fats": "#B22222",
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

// Different heights for mobile vs desktop (adjusted for thinner flows)
let chartHeightSmall = isMobile ? 300 : 380;
let chartHeightMedium = isMobile ? 450 : 550;
let chartHeightLarge = isMobile ? 600 : 750;
let chartHeightTall = isMobile ? 900 : 1200;  // Tall skinny mode
let chartHeightCurrent = chartHeightSmall;
let height = chartHeightCurrent - margin.top - margin.bottom;

// Track the currently selected food id and name for safe re-renders
let currentFoodId = null;
let currentFoodName = null;
let showValueLabels = false;
let reverseFlow = false;
let reverseHierarchy = false;
let showSodium = false;  // Whether to show sodium as separate node
let showFatBreakdown = true;  // Whether to show fat breakdown (Sat, Mono, Poly, Trans)
let nodeSortMode = 'auto';  // 'auto', 'value', or 'custom'

// Custom order for end nodes when custom mode is selected
const customEndNodeOrder = {
    "Water": 0,
    "Sodium": 1,
    "Minerals": 2,
    "Protein": 3,
    "Fat": 4,
    "Sugars": 5,
    "Fiber": 6,
    "Starch": 7,
    // Middle column nodes - keep them grouped
    "Total": -10,
    "Carbs": 10,
    "Sat.": 11,
    "Mono": 12,
    "Poly": 13,
    "Trans": 14,
    "Other Fats": 15
};

// Initialize the Sankey diagram
// Use 85% of vertical space to minimize whitespace
const verticalScale = 0.85;
const sankey = d3.sankey()
    .nodeWidth(20)
    .nodePadding(18)
    .nodeSort(null)  // Let d3-sankey use its built-in crossing minimization
    .linkSort(null)  // Let d3-sankey optimize link ordering
    .iterations(64)  // More iterations = better node positioning (default is 6)
    .extent([[0, 2], [width - 1, (height - 5) * verticalScale]]);

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
        // Show loading overlay
        d3.select("#sankeyDiagram_my_dataviz").selectAll(".loading-overlay").remove();
        const loadingOverlay = d3.select("#sankeyDiagram_my_dataviz").append("div")
            .attr("class", "loading-overlay")
            .html(`
                <div class="loading-spinner"></div>
                <div class="loading-text">Loading...</div>
            `);

        // Fetch data from API
        const url = `${API_BASE_URL}/api/food/${foodId}?reverseHierarchy=${reverseHierarchy}&showSodium=${showSodium}&showFatBreakdown=${showFatBreakdown}`;
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

        // Debug: Log the data structure
        console.log('=== Sankey Data ===');
        console.log('Reverse Hierarchy:', reverseHierarchy);
        console.log('Nodes:', data.nodes.map(n => n.name));
        console.log('Links:', data.links.map(l => {
            const sourceName = data.nodes[l.source]?.name || l.source;
            const targetName = data.nodes[l.target]?.name || l.target;
            return `${sourceName} → ${targetName}: ${l.value}g`;
        }));

        // Remove loading overlay
        d3.select(".loading-overlay").remove();

        // Clear existing diagram and nutrient details
        svg.selectAll("*").remove();
        updateNutrientDetails(data);

        // Generate the Sankey layout with dynamic padding
        // First pass: compute with base padding
        let basePadding = 18;
        if (chartHeightCurrent === chartHeightLarge) {
            basePadding = 22;
        } else if (chartHeightCurrent === chartHeightTall) {
            basePadding = 30;
        }
        sankey.nodePadding(basePadding);
        
        // Apply node sorting based on selected mode
        if (nodeSortMode === 'custom') {
            sankey.nodeSort((a, b) => {
                const orderA = customEndNodeOrder[a.name] ?? 50;
                const orderB = customEndNodeOrder[b.name] ?? 50;
                return orderA - orderB;
            });
        } else if (nodeSortMode === 'value') {
            sankey.nodeSort((a, b) => {
                // Sort by value - larger nodes higher
                return (b.value || 0) - (a.value || 0);
            });
        } else {
            // 'auto' - Let d3 optimize to minimize crossings
            sankey.nodeSort(null);
        }
        
        let { nodes, links } = sankey(data);
        
        // Check height ratio between left (source) and right (sink) columns
        // and increase padding if right side is too compressed
        const xPositionsForPadding = [...new Set(nodes.map(d => Math.round(d.x0)))].sort((a, b) => a - b);
        if (xPositionsForPadding.length >= 2) {
            const leftX = xPositionsForPadding[0];
            const rightX = xPositionsForPadding[xPositionsForPadding.length - 1];
            
            // Get nodes on each side
            const leftNodes = nodes.filter(d => Math.round(d.x0) === leftX);
            const rightNodes = nodes.filter(d => Math.round(d.x0) === rightX);
            
            if (leftNodes.length > 0 && rightNodes.length > 1) {
                // Calculate total height used by each side (including padding)
                const leftHeight = Math.max(...leftNodes.map(d => d.y1)) - Math.min(...leftNodes.map(d => d.y0));
                const rightMinY = Math.min(...rightNodes.map(d => d.y0));
                const rightMaxY = Math.max(...rightNodes.map(d => d.y1));
                const rightHeight = rightMaxY - rightMinY;
                
                // If right side is less than 130% of left side, increase padding
                const targetRatio = 1.30;
                const currentRatio = rightHeight / leftHeight;
                
                if (currentRatio < targetRatio && rightNodes.length > 1) {
                    // Calculate how much extra height we need
                    const targetHeight = leftHeight * targetRatio;
                    const extraHeightNeeded = targetHeight - rightHeight;
                    
                    // Distribute extra height as padding between nodes
                    const extraPaddingPerGap = extraHeightNeeded / (rightNodes.length - 1);
                    const newPadding = Math.min(basePadding + extraPaddingPerGap, 30); // cap at 35px
                    
                    // Recompute layout with new padding
                    sankey.nodePadding(newPadding);
                    const result = sankey(data);
                    nodes = result.nodes;
                    links = result.links;
                    
                    console.log(`Dynamic padding: ${basePadding}px → ${newPadding.toFixed(1)}px (ratio: ${currentRatio.toFixed(2)} → 1.30)`);
                }
            }
        }
        
        // Fan out effect: spread end nodes vertically for less overlap
        // Find unique x positions (columns)
        const xPositions = [...new Set(nodes.map(d => Math.round(d.x0)))].sort((a, b) => a - b);
        
        if (xPositions.length > 1) {
            // Determine which side to fan out based on hierarchy mode
            // In normal mode: fan out the right side (details)
            // In reverse hierarchy: fan out the left side (macros/details)
            const fanOutX = reverseHierarchy ? xPositions[0] : xPositions[xPositions.length - 1];
            const fanOutNodes = nodes.filter(d => Math.round(d.x0) === fanOutX);
            
            if (fanOutNodes.length > 1) {
                // Calculate current bounds of these nodes
                const minY = Math.min(...fanOutNodes.map(d => d.y0));
                const maxY = Math.max(...fanOutNodes.map(d => d.y1));
                const currentHeight = maxY - minY;
                
                // Target height: use more vertical space, more dramatic for large size
                const availableHeight = (height - 5) * verticalScale;
                // Adjust fan-out based on chart size
                let fanOutScale = 1.4;  // default for small
                let heightCap = 0.95;   // default cap at 95% of available height
                if (chartHeightCurrent === chartHeightMedium) {
                    fanOutScale = 1.8;
                } else if (chartHeightCurrent === chartHeightLarge) {
                    fanOutScale = 2.0;
                } else if (chartHeightCurrent === chartHeightTall) {
                    fanOutScale = 4.0;   // most dramatic spread for tall
                    heightCap = 1.0;     // use 100% of available height
                }
                const targetHeight = Math.min(currentHeight * fanOutScale, availableHeight * heightCap);
                const scale = targetHeight / currentHeight;
                
                // Center point for scaling
                const centerY = (minY + maxY) / 2;
                
                // Track how each node moved so we can update links
                const nodeOffsets = new Map();
                
                // Scale each node's y position around the center
                fanOutNodes.forEach(d => {
                    const oldY0 = d.y0;
                    const nodeHeight = d.y1 - d.y0;
                    const nodeCenterY = (d.y0 + d.y1) / 2;
                    const newCenterY = centerY + (nodeCenterY - centerY) * scale;
                    d.y0 = newCenterY - nodeHeight / 2;
                    d.y1 = newCenterY + nodeHeight / 2;
                    nodeOffsets.set(d, d.y0 - oldY0);
                });
                
                // Update link y-positions for affected nodes
                links.forEach(link => {
                    const sourceOffset = nodeOffsets.get(link.source);
                    const targetOffset = nodeOffsets.get(link.target);
                    if (sourceOffset !== undefined) {
                        link.y0 += sourceOffset;
                    }
                    if (targetOffset !== undefined) {
                        link.y1 += targetOffset;
                    }
                });
            }
        }
        
        // Optionally mirror layout horizontally for reverse flow
        if (reverseFlow) {
            nodes.forEach(d => {
                const oldX0 = d.x0;
                const oldX1 = d.x1;
                d.x0 = width - oldX1;
                d.x1 = width - oldX0;
            });
        }

        // Add links (highlight connected path on hover, no tooltip)
        svg.append("g")
            .selectAll("path")
            .data(links)
            .join("path")
            .attr("class", "link")
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke-width", d => Math.max(1, d.width))
            .attr("fill", "none")
            .style("stroke", d => getLinkColor(d.source.name, d.target.name))
            .style("stroke-opacity", 0.2)
            .on("mouseenter", function(event, d) {
                // Highlight the source node's full path (same as hovering on the source rect)
                highlightNode({ type: "mouseover" }, d.source);
            })
            .on("mouseleave", function(event, d) {
                highlightNode({ type: "mouseout" }, d.source);
            });

        // Add nodes
        const node = svg.append("g")
            .selectAll("g")
            .data(nodes)
            .join("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

        // Add rectangles for nodes - use natural height from layout
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
            .style("fill", d => getNodeTextColor(d.name))
            .style("display", d => shouldShowLabel(d) ? null : "none")
            .each(function(d) {
                const textEl = d3.select(this);
                textEl.selectAll("*").remove(); // Clear existing content
                
                // Add bold name
                textEl.append("tspan")
                    .attr("class", "node-name")
                    .style("font-weight", "bold")
                    .text(d.name.toUpperCase());
                
                // Add normal weight value if toggle is on
                if (showValueLabels && typeof d.value === 'number') {
                    textEl.append("tspan")
                        .attr("class", "node-value")
                        .style("font-weight", "normal")
                        .style("font-size", "0.85em")
                        .text(` (${d.value.toFixed(1)}g)`);
                }
            });

        // Update title and subhead will be handled by the click handler
        const dlBtn = document.getElementById('downloadSvgBtn');
        if (dlBtn) dlBtn.disabled = false;

    } catch (error) {
        console.error('Error updating Sankey diagram:', error);
        // Remove loading overlay and show error message
        d3.select(".loading-overlay").remove();
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
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(clone);
    if (!source.match(/^<\?xml/)) {
        source = '<?xml version="1.0" encoding="UTF-8"?>\n' + source;
    }
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    // Use food name for filename, sanitized for filesystem compatibility
    let fileNameBase = currentFoodName || currentFoodId || 'chart';
    // Sanitize: replace invalid chars with underscore, limit length
    fileNameBase = fileNameBase
        .replace(/[<>:"/\\|?*]/g, '_')  // Remove invalid filename chars
        .replace(/\s+/g, '_')            // Replace spaces with underscores
        .replace(/_+/g, '_')             // Collapse multiple underscores
        .substring(0, 80);               // Limit length
    const filename = `sankey_${fileNameBase}.svg`;
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

// Format node label based on toggle
function formatNodeLabel(d) {
    const upperName = d.name.toUpperCase();
    if (showValueLabels && typeof d.value === 'number') {
        return `${upperName} (${d.value.toFixed(1)}g)`;
    }
    return upperName;
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
            .style("display", d => shouldShowLabel(d) ? null : "none")
            .each(function(d) {
                const textEl = d3.select(this);
                textEl.selectAll("*").remove(); // Clear existing content
                
                // Add bold name
                textEl.append("tspan")
                    .attr("class", "node-name")
                    .style("font-weight", "bold")
                    .text(d.name.toUpperCase());
                
                // Add normal weight value if toggle is on
                if (showValueLabels && typeof d.value === 'number') {
                    textEl.append("tspan")
                        .attr("class", "node-value")
                        .style("font-weight", "normal")
                        .style("font-size", "0.85em")
                        .text(` (${d.value.toFixed(1)}g)`);
                }
            });
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

// Show sodium toggle (shows sodium as separate node from minerals)
const toggleShowSodiumEl = document.getElementById('toggleShowSodium');
if (toggleShowSodiumEl) {
    toggleShowSodiumEl.addEventListener('change', (e) => {
        showSodium = !!e.target.checked;
        if (currentFoodId) updateSankey(currentFoodId);
    });
}

// Show fat breakdown toggle (shows Sat, Mono, Poly, Trans as separate nodes)
const toggleShowFatBreakdownEl = document.getElementById('toggleShowFatBreakdown');
if (toggleShowFatBreakdownEl) {
    toggleShowFatBreakdownEl.addEventListener('change', (e) => {
        showFatBreakdown = !!e.target.checked;
        if (currentFoodId) updateSankey(currentFoodId);
    });
}

// Node sort mode dropdown
const nodeSortModeEl = document.getElementById('nodeSortMode');
if (nodeSortModeEl) {
    nodeSortModeEl.addEventListener('change', (e) => {
        nodeSortMode = e.target.value;
        if (currentFoodId) updateSankey(currentFoodId);
    });
}

// Fatty Acids toggle removed - Fat is now a terminal node

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
    const sourceHtml = `Source: <a href="${usdaLink}" target="_blank" rel="noopener noreferrer">USDA FoodData Central Database</a>`;
    
    // Update Sankey, Treemap, and Bar Graph source links to the same URL
    document.getElementById("sankeyDiagram_graphSource").innerHTML = sourceHtml;
    const treemapSource = document.getElementById("treemap_graphSource");
    if (treemapSource) {
        treemapSource.innerHTML = sourceHtml;
    }
    const bargraphSource = document.getElementById("bargraph_graphSource");
    if (bargraphSource) {
        bargraphSource.innerHTML = sourceHtml;
    }
}

// Chart height mode controls
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
    sankey.extent([[0, 2], [width - 1, (height - 5) * verticalScale]]);
}
function applyChartSizing() {
    recomputeHeight();
    applyFlowMargins();
    // Adjust node padding based on chart size (more space for Tall mode)
    if (chartHeightCurrent === chartHeightTall) {
        sankey.nodePadding(30);  // more space between nodes for Tall
    } else if (chartHeightCurrent === chartHeightLarge) {
        sankey.nodePadding(22);
    } else {
        sankey.nodePadding(18);  // default for Small/Medium
    }
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
const modeTallEl = document.getElementById('modeTall');
if (modeTallEl) {
    modeTallEl.addEventListener('change', (e) => {
        if (e.target.checked) {
            chartHeightCurrent = chartHeightTall;
            applyChartSizing();
        }
    });
}

// Handle window resize - debounced and only on width changes (not mobile scroll)
let lastWidth = window.innerWidth;
let resizeTimeout = null;
window.addEventListener('resize', () => {
    // Only respond to actual width changes (ignore mobile scroll height changes)
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    
    // Debounce resize events
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Recalculate mobile state and update heights/margins accordingly
        const nowMobile = window.innerWidth <= 768;
        margin.top = nowMobile ? 20 : 30;
        margin.right = nowMobile ? 100 : 160;
        margin.bottom = nowMobile ? 20 : 30;
        margin.left = nowMobile ? 5 : 10;
        
        // Update chart height options based on screen size
        chartHeightSmall = nowMobile ? 300 : 380;
        chartHeightMedium = nowMobile ? 450 : 550;
        chartHeightLarge = nowMobile ? 600 : 750;
        chartHeightTall = nowMobile ? 900 : 1200;
        
        // Reapply current size mode with new heights
        if (document.getElementById('modeSmall').checked) {
            chartHeightCurrent = chartHeightSmall;
        } else if (document.getElementById('modeMedium').checked) {
            chartHeightCurrent = chartHeightMedium;
        } else if (document.getElementById('modeLarge').checked) {
            chartHeightCurrent = chartHeightLarge;
        } else if (document.getElementById('modeTall').checked) {
            chartHeightCurrent = chartHeightTall;
        }
        height = chartHeightCurrent - margin.top - margin.bottom;
        
        width = document.getElementById('sankeyDiagram_my_dataviz').clientWidth - margin.left - margin.right;
        d3.select("#sankeyDiagram_my_dataviz svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);
        sankey.extent([[0, 2], [width - 1, (height - 5) * verticalScale]]);
        // Only re-render if we have a current selection
        if (currentFoodId) {
            updateSankey(currentFoodId);
        }
    }, 250);
});

// Function to update the nutrient details text view
function updateNutrientDetails(data) {
    const macroNutrients = document.getElementById('macroNutrients');
    const fatBreakdown = document.getElementById('fatBreakdown');
    const additionalInfo = document.getElementById('additionalInfo');

    // Build a map of node index to name for quick lookup
    const nodeNameMap = {};
    data.nodes.forEach(n => { nodeNameMap[n.node] = n.name; });

    // Find node values - look at links and sum values flowing into this node
    const findNodeValue = (name) => {
        const node = data.nodes.find(n => n.name === name);
        if (!node) return 0;
        
        // Sum all links where this node is the target
        let total = 0;
        data.links.forEach(link => {
            // Handle both raw data (source/target are indices) and processed data (source/target are objects)
            const targetId = typeof link.target === 'object' ? link.target.node : link.target;
            const sourceId = typeof link.source === 'object' ? link.source.node : link.source;
            
            if (targetId === node.node) {
                total += link.value || 0;
            }
        });
        
        // If no incoming, check outgoing (for Total node)
        if (total === 0) {
            data.links.forEach(link => {
                const sourceId = typeof link.source === 'object' ? link.source.node : link.source;
                if (sourceId === node.node) {
                    total += link.value || 0;
                }
            });
        }
        
        return total;
    };

    // Helper to create a nutrient row with horizontal bar chart
    // maxValue is typically 100 (for 100g serving)
    function nutrientBar(label, value, color, maxValue = 100) {
        const percentage = Math.min((value / maxValue) * 100, 100);
        return `
            <div class="nutrient-row">
                <div class="nutrient-label">${label}</div>
                <div class="nutrient-value">${value.toFixed(1)}g</div>
                <div class="nutrient-bar-container">
                    <div class="nutrient-bar" style="width: ${percentage}%; background-color: ${color};"></div>
                </div>
            </div>
        `;
    }

    // Get all values
    const water = findNodeValue('Water');
    const protein = findNodeValue('Protein');
    const carbs = findNodeValue('Carbs');
    const fat = findNodeValue('Fat');
    const satFat = findNodeValue('Sat.');
    const monoFat = findNodeValue('Mono');
    const polyFat = findNodeValue('Poly');
    const transFat = findNodeValue('Trans');
    const otherFat = findNodeValue('Other Fats');
    const sugars = findNodeValue('Sugars');
    const fiber = findNodeValue('Fiber');
    const minerals = findNodeValue('Minerals');

    // Format macronutrients with bar charts (includes Minerals & Nutrients)
    const macroHTML = `
        <div class="nutrient-bars">
            ${nutrientBar('Water', water, nodeColor['Water'])}
            ${nutrientBar('Protein', protein, nodeColor['Protein'])}
            ${nutrientBar('Carbohydrates', carbs, nodeColor['Carbs'])}
            ${nutrientBar('Total Fat', fat, nodeColor['Fat'])}
            ${nutrientBar('Minerals', minerals, nodeColor['Minerals'])}
        </div>
    `;

    // Format fat breakdown with bar charts (scaled to 100g) - always show Total Fat, others only if > 0
    const fatHTML = `
        <div class="nutrient-bars">
            ${nutrientBar('Total Fat', fat, nodeColor['Fat'], 100)}
            ${satFat > 0 ? nutrientBar('Saturated', satFat, nodeColor['Sat.'], 100) : ''}
            ${monoFat > 0 ? nutrientBar('Monounsaturated', monoFat, nodeColor['Mono'], 100) : ''}
            ${polyFat > 0 ? nutrientBar('Polyunsaturated', polyFat, nodeColor['Poly'], 100) : ''}
            ${transFat > 0 ? nutrientBar('Trans Fat', transFat, nodeColor['Trans'], 100) : ''}
            ${otherFat > 0 ? nutrientBar('Other Fats', otherFat, nodeColor['Other Fats'], 100) : ''}
        </div>
    `;

    // Format carbs breakdown with bar charts (scaled to 100g) - always show Carbohydrates, others only if > 0
    const starch = findNodeValue('Starch');
    const carbsHTML = `
        <div class="nutrient-bars">
            ${nutrientBar('Carbohydrates', carbs, nodeColor['Carbs'], 100)}
            ${sugars > 0 ? nutrientBar('Sugars', sugars, nodeColor['Sugars'], 100) : ''}
            ${fiber > 0 ? nutrientBar('Fiber', fiber, nodeColor['Fiber'], 100) : ''}
            ${starch > 0 ? nutrientBar('Starch', starch, nodeColor['Starch'], 100) : ''}
        </div>
    `;

    macroNutrients.innerHTML = macroHTML;
    fatBreakdown.innerHTML = fatHTML;
    additionalInfo.innerHTML = carbsHTML;
}

