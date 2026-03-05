# Santa Cruz Doughnut Economics Project

## Purpose

Build a complete Doughnut Economics portrait for the **City of Santa Cruz, California** using Kate Raworth's framework. The process must be reproducible so other cities can follow the same methodology.

## What is the Doughnut?

The Doughnut is a visual framework with two concentric rings:
- **Inner ring (Social Foundation)**: 12 dimensions of human wellbeing that no one should fall below
- **Outer ring (Ecological Ceiling)**: 9 planetary boundaries that humanity should not overshoot
- **The doughnut (safe and just space)**: the area between the rings where people thrive within planetary means

See `docs/doughnut-economics-framework.md` for the complete framework reference.

## The 12 Social Foundation Dimensions

1. Food — food security, nutrition access
2. Health — healthcare access, outcomes
3. Education — attainment, quality, equity
4. Income & Work — poverty, employment, living wage
5. Water & Sanitation — clean water access, quality
6. Energy — affordability, access, clean energy
7. Networks — social capital, internet access, community connections
8. Housing — affordability, adequacy, homelessness
9. Gender Equality — pay gap, representation, safety
10. Social Equity — income inequality (Gini), racial equity
11. Political Voice — voter turnout, civic engagement
12. Peace & Justice — crime rates, incarceration, trust

## The 9 Ecological Ceiling Boundaries

1. Climate Change — GHG emissions per capita
2. Ocean Acidification — marine pH / CO2 absorption impacts
3. Chemical Pollution — pesticide use, toxic releases
4. Nitrogen & Phosphorus Loading — fertilizer runoff, groundwater contamination
5. Freshwater Withdrawals — water use vs sustainable yield
6. Land Conversion — development of natural land
7. Biodiversity Loss — species decline, habitat loss
8. Air Pollution — PM2.5, ozone levels
9. Ozone Layer Depletion — stratospheric ozone (largely global, not local)

## The Four Lenses (City Portrait Method)

Every indicator should be considered through four lenses:

1. **Local-Social**: What does it mean for the people of Santa Cruz to thrive?
2. **Local-Ecological**: What does it mean for Santa Cruz to thrive within its natural habitat?
3. **Global-Social**: What does it mean for Santa Cruz to respect the wellbeing of people worldwide?
4. **Global-Ecological**: What does it mean for Santa Cruz to respect the health of the whole planet?

See `docs/city-portrait-methodology.md` for the full methodology.

## Santa Cruz Context

- Population ~65,000; coastal city 75 mi south of San Francisco
- UC Santa Cruz is a major institution (~19,000 students)
- 95% surface water supply (San Lorenzo River, Loch Lomond Reservoir)
- Severe housing affordability crisis
- Transportation = 69% of GHG emissions
- Global biodiversity hotspot (1,000+ native plant species, 35 endemic species)
- South county (Pajaro Valley) is a major agricultural region — distinct from the city

See `docs/santa-cruz-context.md` for detailed context and data sources.

## Project Structure

```
Doughnut/
├── CLAUDE.md                          # This file — project instructions
├── docs/
│   ├── doughnut-economics-framework.md  # Full framework reference
│   ├── city-portrait-methodology.md     # How to build a city portrait
│   └── santa-cruz-context.md            # Santa Cruz specific context & data sources
├── data/
│   ├── raw/                             # Raw data files and CSVs
│   │   └── ecological_ceiling_indicators.csv
│   └── processed/                       # Cleaned/transformed data
├── doughnut_spreadsheet/                # Working spreadsheet with all indicators
│   └── Santa Cruz Doughnut Indicators.xlsx
├── src/                                 # Code for data processing & visualization
└── scripts/                             # Data collection and automation scripts
```

## Data Collection Rules

1. **Always prefer City of Santa Cruz data** over county or regional data
2. **Note the geographic scale** for every data point (city, county, metro, state)
3. **Include the source URL** and publication year for every data point
4. **Flag data gaps** — missing data is important to document
5. **Disaggregate by equity dimensions** where possible (race, income, neighborhood)
6. **Use the most recent data available** — note the year for each data point
7. **Distinguish production-based vs consumption-based** metrics (especially for ecological dimensions)

## Key Data Sources (Priority Order)

### City-Level
- City of Santa Cruz Climate Action Plan 2030
- City of Santa Cruz GHG Emissions Inventories (1996-2019)
- City of Santa Cruz Water Department reports
- City of Santa Cruz Parks & Recreation data

### County/Regional
- US Census / American Community Survey (city-level estimates available)
- DataShare SCC (datasharescc.org) — community indicators dashboard
- Santa Cruz County Health Services Agency assessments
- Santa Cruz County Climate Action and Adaptation Plan (2022)
- CA Dept of Pesticide Regulation — Pesticide Use Reports (county level)

### State/Federal
- CalEnviroScreen — environmental justice mapping
- CA Air Resources Board — emissions data
- EPA Air Quality System — monitoring station data
- UC Davis Groundwater Nitrate Viewer

## Indicator Scoring

For each indicator, assess against a target/threshold:
- **Severe shortfall** — far below social foundation target
- **Shortfall** — below target
- **Near threshold** — approaching but not yet meeting target
- **Thriving** — meeting the target within ecological limits
- **Overshoot** — exceeding ecological ceiling
- **Severe overshoot** — far beyond ecological ceiling

## Workflow for Adding New Indicators

1. Identify the dimension and lens (e.g., Climate Change / Local-Ecological)
2. Search for City of Santa Cruz data first, then county, then state/federal
3. Record: category, indicator name, data point, year, geographic scale, notes, source, source URL
4. Add to the appropriate CSV in `data/raw/`
5. Update the working spreadsheet
6. Assess against threshold — is this shortfall, thriving, or overshoot?

## Reproducibility

This project should serve as a template. To adapt for another city:
1. Fork this repo
2. Replace "Santa Cruz" references with your city
3. Follow the same data collection methodology
4. Use the same indicator structure and CSV format
5. Adapt data sources to your city's available data
