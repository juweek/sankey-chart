// Define color schemes
// Search functionality
document.getElementById('searchButton').addEventListener('click', performSearch);
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});

let lastSearchQuery = '';

function performSearch(queryParam) {
    const query = (typeof queryParam === 'string' ? queryParam : document.getElementById('searchInput').value.trim());
    if (!query) return;
    lastSearchQuery = query;

    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    searchResults.style.display = 'block';

    fetch(`/api/search?q=${encodeURIComponent(query)}`)
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
    "Waste": "#875B27",
    "Fat": "#CE944D",
    "Sat.": "#CE944D",
    "Mono": "#CE944D",
    "Poly": "#CE944D",
    "Fatty Acids": "#CE944D",
    "Glycerol": "#FF4500",
    "Other Fats": "#CE944D",
    "Carbs": "#c70000",
    "Sugars": "#c70000",
    "Fiber": "#c70000",
    "Starch": "#c70000",
    "Nutr./Mins.": "#0000ff",
};

const linkColor = {
    "Total-Water": "#658394",
    "Total-Protein": "#67B080",
    "Total-Carbs": "#c70000",
    "Total-Fat": "#FFA500",
    "Total-Nutr./Mins.": "#9386A4",
    "Protein-Amino Acids": "#67B080",
    "Protein-Waste": "#875B27",
    "Fat-Mono": "#FFA500",
    "Fat-Sat.": "#FFA500",
    "Fat-Poly": "#FFA500",
    "Mono-Fatty Acids": "#FFA500",
    "Sat.-Fatty Acids": "#FFA500",
    "Poly-Fatty Acids": "#FFA500",
    "Mono-Glycerol": "#FF4500",
    "Poly-Glycerol": "#FF4500",
    "Sat.-Glycerol": "#FF4500",
    "Fat-Other Fats": "#FFA500", 
    "Carbs-Starch": "#c70000", 
    "Carbs-Sugars": "#c70000", 
     "Carbs-Fiber": "#c70000"
};

// Set up dimensions and margins
const margin = { top: 30, right: 10, bottom: 30, left: 10 };
let width = document.getElementById('sankeyDiagram_my_dataviz').clientWidth - margin.left - margin.right;
let height = 450 - margin.top - margin.bottom;

// Track the currently selected food id for safe re-renders
let currentFoodId = null;

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
        const response = await fetch(`/api/food/${foodId}`);
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

        // Add links
        svg.append("g")
            .selectAll("path")
            .data(links)
            .join("path")
            .attr("class", "link")
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke-width", d => Math.max(1, d.width))
            .style("stroke", d => {
                const linkId = `${d.source.name}-${d.target.name}`;
                return linkColor[linkId] || "#666363";
            })
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
        node.append("text")
            .attr("x", d => d.x0 < width / 2 ? 6 + (d.x1 - d.x0) : -6)
            .attr("y", d => (d.y1 - d.y0) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
            .text(d => d.name)
            .style("fill", "#333");

        // Update title and subhead will be handled by the click handler

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

// Handle window resize
window.addEventListener('resize', () => {
    width = document.getElementById('sankeyDiagram_my_dataviz').clientWidth - margin.left - margin.right;
    d3.select("#sankeyDiagram_my_dataviz svg")
        .attr("width", width + margin.left + margin.right);
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
    const fatHTML = `
        <ul class="list-unstyled">
            <li>Saturated Fat: ${findNodeValue('Sat.').toFixed(1)}g</li>
            <li>Monounsaturated Fat: ${findNodeValue('Mono').toFixed(1)}g</li>
            <li>Polyunsaturated Fat: ${findNodeValue('Poly').toFixed(1)}g</li>
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