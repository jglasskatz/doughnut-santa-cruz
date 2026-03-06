# Adding a New City to Doughnut Economics

This guide explains how to create a Doughnut Economics portrait for any city.

## Quick Start

### Option 1: AI-Powered Research (requires API key)

```bash
cd tools
npm install
node cli.js "Austin" "Texas" --population "~980,000" --verbose --output ../data/austin_tx.json
```

### Option 2: Empty Template (no API needed)

```bash
node cli.js --template "Austin" "Texas" --population "~980,000" --output ../data/austin_tx.json
```

Then manually fill in each dimension with real data.

### Option 3: Manual JSON

Copy `data/schema.json` as your guide and create a new JSON file following the schema.

## Data Schema

Every city portrait follows the same structure defined in `data/schema.json`:

```json
{
  "meta": {
    "id": "austin_tx",
    "name": "City of Austin",
    "region": "Texas",
    "country": "US",
    "population": "~980,000",
    "description": "...",
    "lastUpdated": "2026-03-05",
    "contributors": ["Your Name"]
  },
  "social": [
    {
      "name": "food",
      "level": 50,
      "indicator": "Food insecurity rate",
      "value": "15% of households",
      "year": 2023,
      "target": "Zero hunger",
      "context": "...",
      "source": "Feeding America, Map the Meal Gap 2023",
      "sourceUrl": "https://...",
      "confidence": "high",
      "geographicScale": "county",
      "actions": ["Donate to Central TX Food Bank", "..."],
      "subIndicators": []
    }
    // ... 11 more social dimensions
  ],
  "ecological": [
    // ... 9 ecological dimensions
  ]
}
```

## The 12 Social Foundation Dimensions

| # | Dimension | Key Indicators to Find |
|---|-----------|----------------------|
| 1 | food | Food insecurity rate, SNAP enrollment |
| 2 | health | Uninsured rate, life expectancy |
| 3 | education | Graduation rate, test proficiency |
| 4 | income & work | Poverty rate, median income, unemployment |
| 5 | housing | Homelessness, rent burden, median rent |
| 6 | water & sanitation | Water quality, access, contamination |
| 7 | energy | Electricity cost, renewable share, energy burden |
| 8 | social equity | Gini coefficient, racial disparities |
| 9 | peace & justice | Crime rates, incarceration |
| 10 | political voice | Voter turnout, civic engagement |
| 11 | gender equality | Pay gap, representation |
| 12 | networks | Broadband access, digital divide |

## The 9 Ecological Ceiling Dimensions

| # | Dimension | Key Indicators to Find |
|---|-----------|----------------------|
| 1 | climate change | GHG emissions per capita |
| 2 | ocean acidification | Coastal pH (if applicable) |
| 3 | chemical pollution | Superfund sites, TRI releases, pesticides |
| 4 | nitrogen & phosphorus loading | Water nutrient levels |
| 5 | freshwater withdrawals | Water supply vs. demand |
| 6 | land conversion | Protected land %, sprawl |
| 7 | biodiversity loss | Endangered species, habitat loss |
| 8 | air pollution | PM2.5 annual average |
| 9 | ozone layer depletion | Global (usually -100) |

## Severity Level Scale

| Level | Label | Description |
|-------|-------|-------------|
| -100 | No problem | Well within safe bounds |
| -50 | Under control | Meeting targets |
| 0 | On track | At threshold, needs monitoring |
| 50 | Needs attention | Exceeding threshold |
| 100 | Critical | Significantly beyond threshold |
| 150 | Severe | Emergency level |
| null | Unknown | Insufficient data |

## Data Sources Priority

1. **City government** reports and open data portals
2. **U.S. Census Bureau** (ACS 5-year for small cities)
3. **EPA / NOAA / USDA** federal agency data
4. **State agencies** (education, environment, health)
5. **County/metro** data when city-level unavailable
6. **Academic studies** and nonprofit reports

## Quality Checklist

Before publishing a city portrait:

- [ ] All 12 social dimensions have data (or documented gaps)
- [ ] All 9 ecological dimensions have data (or documented gaps)
- [ ] Every data point has a source URL
- [ ] Geographic scale noted for each indicator
- [ ] Data is from the last 5 years where possible
- [ ] Actions are specific and local (not generic)
- [ ] Run `node cli.js --report data/your_city.json` to check quality

## Adding to the Frontend

1. Add your JSON file to `data/`
2. In `frontend/data.js`, add your city to the `JURISDICTIONS` object
3. The city selector buttons auto-generate from JURISDICTIONS keys

## Contributing

PRs welcome! Follow the data collection rules in CLAUDE.md:
- Always prefer city-level data over county/state
- Include source URLs for everything
- Flag data gaps honestly
- Disaggregate by equity dimensions where possible
