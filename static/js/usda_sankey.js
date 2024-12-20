// Define color schemes
// Search functionality
document.getElementById('usdaSearchButton').addEventListener('click', performSearch);
document.getElementById('usdaSearchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});

function performSearch(page = 1) {
    const query = document.getElementById('usdaSearchInput').value.trim();
    if (!query) return;

    const searchResults = document.getElementById('usdaSearchResults');
    searchResults.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    searchResults.style.display = 'block';

    fetch(`/api/search?q=${encodeURIComponent(query)}&page=${page}&pageSize=10`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            searchResults.innerHTML = '';
            if (data.results.length === 0) {
                searchResults.innerHTML = '<div class="alert alert-info">No results found</div>';
                return;
            }

            // Add search results
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
                    // Store current food ID
                    currentFoodId = food.fdcId;
                    
                    // Update Sankey diagram
                    updateSankey(food.fdcId);
                    
                    // Hide search results
                    searchResults.style.display = 'none';
                    
                    // Clear search input
                    document.getElementById('usdaSearchInput').value = '';
                    
                    // Update title to show selected food
                    document.getElementById('usdaSankeyTitle').innerHTML = 
                        `<b>Nutrient Breakdown for ${food.description}</b>`;
                });
                searchResults.appendChild(button);
            });

            // Add pagination controls if there are multiple pages
            if (data.totalPages > 1) {
                const paginationDiv = document.createElement('div');
                paginationDiv.className = 'pagination justify-content-center mt-3';
                
                // Previous page button
                if (data.currentPage > 1) {
                    const prevButton = document.createElement('button');
                    prevButton.className = 'btn btn-outline-secondary me-2';
                    prevButton.textContent = 'Previous';
                    prevButton.onclick = () => performSearch(data.currentPage - 1);
                    paginationDiv.appendChild(prevButton);
                }
                
                // Current page indicator
                const pageInfo = document.createElement('span');
                pageInfo.className = 'mx-2 align-self-center';
                pageInfo.textContent = `Page ${data.currentPage} of ${data.totalPages}`;
                paginationDiv.appendChild(pageInfo);
                
                // Next page button
                if (data.currentPage < data.totalPages) {
                    const nextButton = document.createElement('button');
                    nextButton.className = 'btn btn-outline-secondary ms-2';
                    nextButton.textContent = 'Next';
                    nextButton.onclick = () => performSearch(data.currentPage + 1);
                    paginationDiv.appendChild(nextButton);
                }
                
                searchResults.appendChild(paginationDiv);
            }
        })
        .catch(error => {
            searchResults.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        });
}

// Rest of the existing Sankey diagram code...
[Previous Sankey diagram code continues...]
