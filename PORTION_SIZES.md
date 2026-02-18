# Portion Size Feature

## Overview

The nutrition charts now support displaying data for different portion sizes beyond the standard 100g serving. This feature uses the `foodPortions` data provided by the USDA FoodData Central API.

## How It Works

### Data Source

The USDA FoodData Central API provides portion size information in the `foodPortions` array for many foods. This includes common serving sizes like:
- Cups
- Tablespoons
- Ounces
- Individual items (e.g., "1 medium apple")
- Package servings

Each portion includes:
- A description (e.g., "1 cup")
- The gram weight equivalent
- The amount and measure unit

### Implementation

1. **Portion Dropdown**: A dropdown menu appears below the search bar when a food is selected (only if the food has multiple portion sizes available)

2. **Supported Charts**: The following charts update when you change the portion size:
   - ✅ **Treemaps** - All treemap visualizations (macro, fat, carbs, protein, minerals, vitamins)
   - ✅ **Bar Graphs** - % Daily Value charts
   - ✅ **Radar Chart** - Nutrient profile visualization
   - ⚠️ **Sankey Diagram** - Currently shows 100g only (requires server-side updates)

3. **Calculation**: Nutrients are scaled using the formula:
   ```
   Nutrient Value = (Base Value per 100g) × (Portion Weight in grams / 100)
   ```

### User Interface

When you select a food:
1. The portion size dropdown appears with all available serving sizes
2. The default selection is always "100g (default)"
3. Changing the dropdown immediately updates all applicable charts
4. Chart subtitles update to reflect the current portion size

### Example Portion Sizes

For an apple, you might see options like:
- 100g (default)
- 1 small (149g)
- 1 medium (182g)
- 1 large (223g)
- 1 cup sliced (110g)

## Technical Details

### Files Modified

1. **docs/index.html**
   - Added portion size dropdown UI element

2. **docs/js/treemap.js**
   - Added `parseAndPopulatePortions()` - Extracts portions from USDA data
   - Added `handlePortionChange()` - Updates charts when portion changes
   - Added `updateChartTitles()` - Updates all chart subtitles
   - Modified `parseNutrientsFromUSDA()` - Accepts multiplier parameter
   - Modified `fetchAndDisplayTreemaps()` - Stores raw food data and initializes portions

### Variables Tracking State

```javascript
let currentFoodData = null;          // Stores raw USDA API response
let currentPortionMultiplier = 1;    // Current scaling factor (1 = 100g)
let availablePortions = [];          // Array of available portion objects
```

## Limitations

1. **Sankey Diagram**: The Sankey diagram uses server-side transformation via the Cloudflare Worker, so it currently only displays 100g data. To support portion sizes in the Sankey, the Worker would need to be updated to accept a portion multiplier parameter.

2. **Not All Foods Have Portions**: Some foods in the USDA database only have 100g data and don't include common serving sizes. In these cases, the portion dropdown will only show the 100g option.

3. **Portion Descriptions**: The quality and variety of portion descriptions varies by food and data source (Branded, SR Legacy, Survey, Foundation).

## Future Enhancements

Possible improvements:
- Add Sankey diagram support by updating the Cloudflare Worker
- Allow custom portion size input (e.g., "enter grams")
- Remember user's last selected portion preference
- Add metric/imperial unit conversion (grams ↔ ounces)
- Show portion size comparisons side-by-side

## API Reference

### USDA FoodData Central - foodPortions

Example structure from the API:
```json
{
  "foodPortions": [
    {
      "id": 12345,
      "amount": 1.0,
      "modifier": "cup, sliced",
      "gramWeight": 110.0,
      "measureUnit": {
        "id": 123,
        "name": "cup",
        "abbreviation": "cup"
      }
    }
  ]
}
```

## Testing

To test the feature:
1. Search for a food (try "apple" or "chicken breast")
2. Select a food from the results
3. Look for the "Portion Size:" dropdown below the search bar
4. Change the portion size and observe all charts update
5. Switch between chart tabs to verify all visualizations update correctly




