// Define color schemes
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
    "Fatty Acids": "#FFD700",
    "Glycerol": "#FF4500",
    "Other Fats": "#FF4500",
    "Carbs": "#AA3D3D",
    "Sugars": "#AA3D3D",
    "Fiber": "#ff0000",
    "Nutr./Mins.": "#0000ff"
};

const linkColor = {
    "Total-Water": "#9CBBC8",
    "Total-Protein": "#67B080",
    "Total-Fat": "#FFA500",
    "Total-Nutr./Mins.": "#9386A4",
    "Protein-Amino Acids": "#67B080",
    "Protein-Waste": "#875B27",
    "Fat-Mono": "#FBBD69",
    "Fat-Sat.": "#FBBD69",
    "Fat-Poly": "#FBBD69",
    "Mono-Fatty Acids": "#EAC542",
    "Sat.-Fatty Acids": "#EAC542",
    "Poly-Fatty Acids": "#EAC542",
    "Mono-Glycerol": "#FF4500",
    "Poly-Glycerol": "#FF4500",
    "Sat.-Glycerol": "#FF4500",
    "Fat-Other Fats": "#F27648"
};

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
            .style("stroke", d => {
                const linkId = `${d.source.name}-${d.target.name}`;
                return linkColor[linkId] || "#666363";
            })
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
            .attr("fill", d => nodeColor[d.name] || "#666")
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
    
    // Update source link with direct USDA food data link
    const usdaLink = `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${foodId}/nutrients`;
    document.getElementById("sankeyDiagram_graphSource").innerHTML = 
        `Source: <a href="${usdaLink}" target="_blank">USDA FoodData Central Database</a>`;
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
