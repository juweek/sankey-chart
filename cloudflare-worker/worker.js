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
  const foodId = path.replace('/api/food/', '');
  const reverseHierarchy = url.searchParams.get('reverseHierarchy') === 'true';

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
  const sankeyData = transformToSankey(foodData, reverseHierarchy);

  return new Response(JSON.stringify(sankeyData), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Transform USDA food data to Sankey diagram format
 * 
 * Normal hierarchy (Macro → Detail):
 *   Total → Protein → Amino Acids
 *   Total → Carbs → Sugars/Fiber/Starch
 *   Total → Fat → Sat/Mono/Poly/Trans → Fatty Acids
 *   Total → Water
 *   Total → Minerals
 * 
 * Reverse hierarchy (Detail → Macro):
 *   Amino Acids → Protein → Total
 *   Sugars/Fiber/Starch → Carbs → Total
 *   Fatty Acids → Sat/Mono/Poly/Trans → Fat → Total
 *   Water → Total
 *   Minerals → Total
 */
function transformToSankey(foodData, reverseHierarchy = false) {
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

  // Log values for debugging
  console.log('Sankey Data:', {
    reverseHierarchy,
    water, protein, totalFat, carbs, minerals,
    satFat, monoFat, polyFat, transFat, otherFats,
    sugars, fiber, starch
  });

  // Same node structure for both modes
  const nodeNames = [
    "Total", "Water", "Protein", "Fat", "Carbs", "Minerals",
    "Amino Acids", "Sat.", "Mono", "Poly", "Trans", "Fatty Acids", "Other Fats",
    "Sugars", "Fiber", "Starch"
  ];

  const nodes = nodeNames.map((name, i) => ({ node: i, name }));
  const nodeIndex = {};
  nodeNames.forEach((name, i) => { nodeIndex[name] = i; });

  const links = [];

  function addLink(source, target, value) {
    if (value > 0) {
      links.push({ source: nodeIndex[source], target: nodeIndex[target], value });
    }
  }

  if (reverseHierarchy) {
    // Detail → Macro view:
    // Macros → Sub-nutrients → Fat types → Total
    //
    // Protein → Amino Acids → Total
    // Fat → Sat/Mono/Poly/Trans → Fatty Acids → Total
    // Fat → Other Fats → Total
    // Carbs → Sugars/Fiber/Starch → Total
    // Water → Total
    // Minerals → Total

    // Macros to sub-nutrients
    addLink("Protein", "Amino Acids", protein);
    addLink("Fat", "Sat.", satFat);
    addLink("Fat", "Mono", monoFat);
    addLink("Fat", "Poly", polyFat);
    addLink("Fat", "Trans", transFat);
    addLink("Fat", "Other Fats", otherFats);
    addLink("Carbs", "Sugars", sugars);
    addLink("Carbs", "Fiber", fiber);
    addLink("Carbs", "Starch", starch);

    // Fat subtypes to Fatty Acids
    addLink("Sat.", "Fatty Acids", satFat);
    addLink("Mono", "Fatty Acids", monoFat);
    addLink("Poly", "Fatty Acids", polyFat);
    addLink("Trans", "Fatty Acids", transFat);

    // Sub-nutrients to Total
    addLink("Amino Acids", "Total", protein);
    addLink("Fatty Acids", "Total", satFat + monoFat + polyFat + transFat);
    addLink("Other Fats", "Total", otherFats);
    addLink("Sugars", "Total", sugars);
    addLink("Fiber", "Total", fiber);
    addLink("Starch", "Total", starch);
    addLink("Water", "Total", water);
    addLink("Minerals", "Total", minerals);

  } else {
    // Normal Macro → Detail view:
    // Total → Macros → Sub-nutrients → Fat types

    // Total to main categories
    addLink("Total", "Water", water);
    addLink("Total", "Protein", protein);
    addLink("Total", "Fat", totalFat);
    addLink("Total", "Carbs", carbs);
    addLink("Total", "Minerals", minerals);

    // Protein to Amino Acids
    addLink("Protein", "Amino Acids", protein);

    // Fat breakdown
    addLink("Fat", "Sat.", satFat);
    addLink("Fat", "Mono", monoFat);
    addLink("Fat", "Poly", polyFat);
    addLink("Fat", "Trans", transFat);
    addLink("Fat", "Other Fats", otherFats);

    // Fat subtypes to Fatty Acids
    addLink("Sat.", "Fatty Acids", satFat);
    addLink("Mono", "Fatty Acids", monoFat);
    addLink("Poly", "Fatty Acids", polyFat);
    addLink("Trans", "Fatty Acids", transFat);

    // Carbs breakdown
    addLink("Carbs", "Sugars", sugars);
    addLink("Carbs", "Fiber", fiber);
    addLink("Carbs", "Starch", starch);
  }

  return { nodes, links };
}

