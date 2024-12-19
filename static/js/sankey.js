// Set up dimensions and margins
const margin = { top: 30, right: 10, bottom: 30, left: 10 };
let width = document.getElementById('sankeyDiagram_my_dataviz').clientWidth - margin.left - margin.right;
let height = 450 - margin.top - margin.bottom;

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

// Function to update the Sankey diagram
async function updateSankey(foodId) {
    try {
        // Show loading state
        d3.select("#sankeyDiagram_my_dataviz").append("div")
            .attr("class", "loading")
            .text("Loading...");

        // Fetch data from our Flask API
        const response = await fetch(`/api/food/${foodId}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();

        // Remove loading state
        d3.select(".loading").remove();

        // Clear existing diagram
        svg.selectAll("*").remove();

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
            .style("stroke-opacity", 0.2)
            .on("mouseover", showTooltip)
            .on("mouseout", hideTooltip);

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
            .attr("fill", "#666")
            .on("mouseover", showTooltip)
            .on("mouseout", hideTooltip);

        // Add labels
        node.append("text")
            .attr("x", d => d.x0 < width / 2 ? 6 + (d.x1 - d.x0) : -6)
            .attr("y", d => (d.y1 - d.y0) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
            .text(d => d.name)
            .style("fill", "#333");

        // Update title and subhead
        updateGraphDetails(foodId);

    } catch (error) {
        console.error('Error updating Sankey diagram:', error);
        // Show error message to user
        d3.select(".loading").text("Error loading data. Please try again.");
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
function updateGraphDetails(foodId) {
    const titles = {
        "170208": {
            title: "What nutrients make up RAW BEEF?",
            subhead: "Nutrient breakdown per 100g serving"
        },
        "170386": {
            title: "What nutrients make up COOKED BEEF?",
            subhead: "Nutrient breakdown per 100g serving"
        }
    };

    const details = titles[foodId];
    document.getElementById("sankeyDiagram_graphTitle").innerHTML = `<b>${details.title}</b>`;
    document.getElementById("sankeyDiagram_graphSubhead").textContent = details.subhead;
}

// Event listeners for buttons
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('#foodControls button');
    
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            updateSankey(button.dataset.foodId);
        });
    });

    // Load initial data
    updateSankey('170208');
});

// Handle window resize
window.addEventListener('resize', () => {
    width = document.getElementById('sankeyDiagram_my_dataviz').clientWidth - margin.left - margin.right;
    d3.select("#sankeyDiagram_my_dataviz svg")
        .attr("width", width + margin.left + margin.right);
    sankey.extent([[0, 2], [width - 1, height - 5]]);
    updateSankey(document.querySelector('#foodControls button.active').dataset.foodId);
});
