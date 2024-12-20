// OpenFoodFacts Search functionality
document.getElementById('offSearchButton').addEventListener('click', performOffSearch);
document.getElementById('offSearchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performOffSearch();
    }
});

function performOffSearch(page = 1) {
    const query = document.getElementById('offSearchInput').value.trim();
    if (!query) return;

    const searchResults = document.getElementById('offSearchResults');
    const foodDetails = document.getElementById('offFoodDetails');
    
    searchResults.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    searchResults.style.display = 'block';

    fetch(`/api/off/search?q=${encodeURIComponent(query)}&page=${page}`)
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
                        <small>${food.brand || 'Unknown Brand'}</small>
                    </div>
                    ${food.ingredients ? `<small class="text-muted">Ingredients: ${food.ingredients}</small>` : ''}
                `;
                button.addEventListener('click', () => {
                    // Show food details
                    showFoodDetails(food.code);
                    
                    // Hide search results
                    searchResults.style.display = 'none';
                    
                    // Clear search input
                    document.getElementById('offSearchInput').value = '';
                    
                    // Update title
                    document.getElementById('offDetailsTitle').innerHTML = 
                        `<b>${food.description}</b>`;
                });
                searchResults.appendChild(button);
            });

            // Add pagination controls
            if (data.totalPages > 1) {
                const paginationDiv = document.createElement('div');
                paginationDiv.className = 'pagination justify-content-center mt-3';
                
                if (data.currentPage > 1) {
                    const prevButton = document.createElement('button');
                    prevButton.className = 'btn btn-outline-secondary me-2';
                    prevButton.textContent = 'Previous';
                    prevButton.onclick = () => performOffSearch(data.currentPage - 1);
                    paginationDiv.appendChild(prevButton);
                }
                
                const pageInfo = document.createElement('span');
                pageInfo.className = 'mx-2 align-self-center';
                pageInfo.textContent = `Page ${data.currentPage} of ${data.totalPages}`;
                paginationDiv.appendChild(pageInfo);
                
                if (data.currentPage < data.totalPages) {
                    const nextButton = document.createElement('button');
                    nextButton.className = 'btn btn-outline-secondary ms-2';
                    nextButton.textContent = 'Next';
                    nextButton.onclick = () => performOffSearch(data.currentPage + 1);
                    paginationDiv.appendChild(nextButton);
                }
                
                searchResults.appendChild(paginationDiv);
            }
        })
        .catch(error => {
            searchResults.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        });
}

function showFoodDetails(code) {
    const foodDetails = document.getElementById('offFoodDetails');
    foodDetails.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    fetch(`/api/off/food/${code}`)
        .then(response => response.json())
        .then(food => {
            if (food.error) {
                throw new Error(food.error);
            }

            let nutrientsHtml = '';
            if (food.nutriments) {
                const nutrients = food.nutriments;
                nutrientsHtml = `
                    <div class="row mt-4">
                        <div class="col-md-6">
                            <h6>Nutrition Facts (per 100g)</h6>
                            <ul class="list-unstyled">
                                <li>Energy: ${nutrients.energy_100g || 0} kcal</li>
                                <li>Proteins: ${nutrients.proteins_100g || 0}g</li>
                                <li>Carbohydrates: ${nutrients.carbohydrates_100g || 0}g</li>
                                <li>Fat: ${nutrients.fat_100g || 0}g</li>
                                <li>Fiber: ${nutrients.fiber_100g || 0}g</li>
                                <li>Sugars: ${nutrients.sugars_100g || 0}g</li>
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <h6>Additional Information</h6>
                            <ul class="list-unstyled">
                                <li>Serving Size: ${food.serving_size || 'Not specified'}</li>
                                <li>Brand: ${food.brand || 'Not specified'}</li>
                                ${food.ingredients ? `<li>Ingredients: ${food.ingredients}</li>` : ''}
                            </ul>
                        </div>
                    </div>
                `;
            }

            foodDetails.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        ${food.image_url ? `
                            <div class="text-center mb-4">
                                <img src="${food.image_url}" alt="${food.name}" class="img-fluid" style="max-height: 200px;">
                            </div>
                        ` : ''}
                        <h5 class="card-title">${food.name}</h5>
                        ${nutrientsHtml}
                    </div>
                </div>
            `;
        })
        .catch(error => {
            foodDetails.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        });
}
