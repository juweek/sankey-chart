/**
 * Cloudflare Worker - USDA API Proxy
 * 
 * This worker proxies requests to the USDA FoodData Central API
 * and transforms the data for the Sankey diagram.
 * 
 * Environment variable required:
 * - USDA_API_KEY: Your USDA FoodData Central API key
 */

const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/api/search') {
        return await handleSearch(url, env);
      } else if (path.startsWith('/api/food/')) {
        return await handleFood(url, path, env);
      } else {
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

async function handleSearch(url, env) {
  const query = url.searchParams.get('q');
  if (!query) {
    return new Response(JSON.stringify({ error: 'Query parameter "q" is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const dataTypesParam = url.searchParams.get('dataTypes');
  const dataTypes = dataTypesParam ? dataTypesParam.split(',') : null;
  const page = parseInt(url.searchParams.get('page')) || 1;
  const pageSize = 50;

  const searchUrl = `${USDA_BASE_URL}/foods/search?api_key=${env.USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=${pageSize}&pageNumber=${page}`;
  
  const response = await fetch(searchUrl);
  if (!response.ok) {
    throw new Error(`USDA API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Filter by data types if specified
  let foods = data.foods || [];
  if (dataTypes && dataTypes.length > 0) {
    foods = foods.filter(f => dataTypes.includes(f.dataType));
  }

  const results = foods.map(food => ({
    fdcId: food.fdcId,
    description: food.description,
    dataType: food.dataType,
    brandOwner: food.brandOwner || null,
  }));

  // Include pagination info
  const totalHits = data.totalHits || 0;
  const totalPages = Math.ceil(totalHits / pageSize);
  const hasMore = page < totalPages;

  return new Response(JSON.stringify({ 
    results, 
    page, 
    totalPages, 
    totalHits,
    hasMore 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleFood(url, path, env) {
  // Check if raw data is requested (for treemaps)
  const isRaw = path.endsWith('/raw');
  const foodId = path.replace('/api/food/', '').replace('/raw', '');
  const reverseHierarchy = url.searchParams.get('reverseHierarchy') === 'true';
  const showSodium = url.searchParams.get('showSodium') === 'true';
  const showFatBreakdown = url.searchParams.get('showFatBreakdown') !== 'false'; // Default true

  const foodUrl = `${USDA_BASE_URL}/food/${foodId}?api_key=${env.USDA_API_KEY}`;
  
  const response = await fetch(foodUrl);
  if (!response.ok) {
    if (response.status === 404) {
      return new Response(JSON.stringify({ error: 'Food not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    throw new Error(`USDA API error: ${response.status}`);
  }

  const foodData = await response.json();

  // Return raw data for treemaps, or transformed data for Sankey
  if (isRaw) {
    return new Response(JSON.stringify(foodData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const sankeyData = transformToSankey(foodData, reverseHierarchy, showSodium, showFatBreakdown);

  return new Response(JSON.stringify(sankeyData), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Transform USDA food data to Sankey diagram format
 * 
 * Normal hierarchy (Macro → Detail):
 *   Total → Protein (terminal)
 *   Total → Carbs → Sugars/Fiber/Starch
 *   Total → Sat/Mono/Poly/Trans/Other Fats → Fat (terminal)
 *   Total → Water (terminal)
 *   Total → Minerals (terminal)
 * 
 * Reverse hierarchy (Detail → Macro):
 *   Protein → Total
 *   Sugars/Fiber/Starch → Carbs → Total
 *   Fat → Sat/Mono/Poly/Trans/Other Fats → Total
 *   Water → Total
 *   Minerals → Total
 */
function transformToSankey(foodData, reverseHierarchy = false, showSodium = false, showFatBreakdown = true) {
  const nutrients = foodData.foodNutrients || [];

  // Helper to get nutrient amount
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

  // Get main macronutrients
  const water = getNutrient('Water');
  const protein = getNutrient('Protein');
  const totalFat = getNutrient('Total lipid (fat)');
  const carbs = getNutrient('Carbohydrate, by difference');

  // Fat breakdown
  const satFat = getNutrient('Fatty acids, total saturated');
  const monoFat = getNutrient('Fatty acids, total monounsaturated');
  const polyFat = getNutrient('Fatty acids, total polyunsaturated');
  const transFat = getNutrient('Fatty acids, total trans', 'Trans fat', 'Trans fatty acids');
  const otherFats = Math.max(0, totalFat - satFat - monoFat - polyFat - transFat);

  // Carbs breakdown
  // Use Total Sugars if available, otherwise sum individual sugars
  let sugars = getNutrient('Total Sugars', 'Sugars, total');
  if (sugars === 0) {
    // Fallback: sum individual sugar types
    const glucose = getNutrient('Glucose');
    const fructose = getNutrient('Fructose');
    const sucrose = getNutrient('Sucrose');
    const maltose = getNutrient('Maltose');
    const lactose = getNutrient('Lactose');
    const galactose = getNutrient('Galactose');
    sugars = glucose + fructose + sucrose + maltose + lactose + galactose;
  }
  const fiber = getNutrient('Fiber, total dietary');
  // Use explicit starch if available, otherwise calculate as remainder
  let starch = getNutrient('Starch');
  if (starch === 0 && carbs > 0) {
    starch = Math.max(0, carbs - sugars - fiber);
  }

  // Minerals (Ash or calculated)
  let minerals = getNutrient('Ash');
  if (minerals === 0) {
    minerals = Math.max(0, 100 - water - protein - totalFat - carbs);
  }

  // Extract sodium (in mg, convert to grams for Sankey)
  const sodiumMg = getNutrient('Sodium, Na');
  const sodium = sodiumMg / 1000; // Convert mg to grams
  const otherMinerals = Math.max(0, minerals - sodium);

  // Log values for debugging
  console.log('Sankey Data:', {
    reverseHierarchy, showSodium, showFatBreakdown,
    water, protein, totalFat, carbs, minerals, sodium, otherMinerals,
    satFat, monoFat, polyFat, transFat, otherFats,
    sugars, fiber, starch
  });

  // Build node names based on options
  let nodeNames = ["Total", "Water", "Protein", "Fat", "Carbs"];
  
  // Add sodium/minerals nodes
  if (showSodium) {
    nodeNames.push("Sodium", "Minerals");
  } else {
    nodeNames.push("Minerals");
  }
  
  // Add fat subtypes only if showFatBreakdown is true
  if (showFatBreakdown) {
    nodeNames.push("Sat.", "Mono", "Poly", "Trans", "Other Fats");
  }
  
  // Add carb subtypes
  nodeNames.push("Sugars", "Fiber", "Starch");

  const nodes = nodeNames.map((name, i) => ({ node: i, name }));
  const nodeIndex = {};
  nodeNames.forEach((name, i) => { nodeIndex[name] = i; });

  const links = [];

  function addLink(source, target, value) {
    if (value > 0 && nodeIndex[source] !== undefined && nodeIndex[target] !== undefined) {
      links.push({ source: nodeIndex[source], target: nodeIndex[target], value });
    }
  }

  if (reverseHierarchy) {
    // Detail → Macro view:
    // Fat → Sat/Mono/Poly/Trans/Other Fats → Total (if showFatBreakdown)
    // Fat → Total (if !showFatBreakdown)
    // Carbs → Sugars/Fiber/Starch → Total
    // Protein → Total
    // Water → Total
    // Minerals (or Sodium + Minerals if showSodium) → Total

    if (showFatBreakdown) {
      // Fat to subtypes
      addLink("Fat", "Sat.", satFat);
      addLink("Fat", "Mono", monoFat);
      addLink("Fat", "Poly", polyFat);
      addLink("Fat", "Trans", transFat);
      addLink("Fat", "Other Fats", otherFats);
      
      // Fat subtypes to Total
      addLink("Sat.", "Total", satFat);
      addLink("Mono", "Total", monoFat);
      addLink("Poly", "Total", polyFat);
      addLink("Trans", "Total", transFat);
      addLink("Other Fats", "Total", otherFats);
    } else {
      // Fat directly to Total
      addLink("Fat", "Total", totalFat);
    }
    
    // Carbs to subtypes
    addLink("Carbs", "Sugars", sugars);
    addLink("Carbs", "Fiber", fiber);
    addLink("Carbs", "Starch", starch);

    // All sub-nutrients to Total
    addLink("Protein", "Total", protein);
    addLink("Sugars", "Total", sugars);
    addLink("Fiber", "Total", fiber);
    addLink("Starch", "Total", starch);
    addLink("Water", "Total", water);
    
    // Minerals - conditional on showSodium
    if (showSodium) {
      addLink("Sodium", "Total", sodium);
      addLink("Minerals", "Total", otherMinerals);
    } else {
      addLink("Minerals", "Total", minerals);
    }

  } else {
    // Normal Macro → Detail view:
    // Total → Sat/Mono/Poly/Trans/Other Fats → Fat (if showFatBreakdown)
    // Total → Fat (if !showFatBreakdown)
    // Total → Carbs → Sugars/Fiber/Starch
    // Total → Protein/Water/Minerals (terminal)

    // Total to terminal nodes
    addLink("Total", "Water", water);
    addLink("Total", "Protein", protein);
    
    // Minerals - conditional on showSodium
    if (showSodium) {
      addLink("Total", "Sodium", sodium);
      addLink("Total", "Minerals", otherMinerals);
    } else {
      addLink("Total", "Minerals", minerals);
    }

    if (showFatBreakdown) {
      // Total to fat subtypes, then subtypes to Fat (terminal)
      addLink("Total", "Sat.", satFat);
      addLink("Total", "Mono", monoFat);
      addLink("Total", "Poly", polyFat);
      addLink("Total", "Trans", transFat);
      addLink("Total", "Other Fats", otherFats);
      addLink("Sat.", "Fat", satFat);
      addLink("Mono", "Fat", monoFat);
      addLink("Poly", "Fat", polyFat);
      addLink("Trans", "Fat", transFat);
      addLink("Other Fats", "Fat", otherFats);
    } else {
      // Total directly to Fat (terminal)
      addLink("Total", "Fat", totalFat);
    }

    // Total to Carbs, then Carbs to subtypes
    addLink("Total", "Carbs", carbs);
    addLink("Carbs", "Sugars", sugars);
    addLink("Carbs", "Fiber", fiber);
    addLink("Carbs", "Starch", starch);
  }

  return { nodes, links };
}

