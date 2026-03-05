# 🍩 Doughnut Economics City Portraits

Interactive visualizations of social foundations and ecological ceilings for cities, based on [Kate Raworth's Doughnut Economics](https://doughnuteconomics.org/) framework.

## Live Demo

Open `frontend/index-d3.html` in a browser — no build step needed.

## Cities Included

| City | Status | Data Points |
|------|--------|-------------|
| **City of Santa Cruz, CA** | ✅ Complete | 21 dimensions, 3 jurisdictions (City, County, Watsonville) |
| **Portland, OR** | ✅ Complete | 21 dimensions with sub-indicators |
| *Your city?* | [Add one →](docs/adding-a-city.md) | |

## Features

- **D3.js interactive doughnut chart** with hover tooltips, click-to-expand details, responsive design
- **Color-coded segments** showing severity (no problem → severe)
- **Detail panel** with indicator values, sources, targets, and community actions
- **Energy deep-dive** connecting to [microgridme.xyz](https://microgridme.xyz) for distributed energy analysis
- **Multi-city support** — switch between cities with keyboard shortcuts
- **AI research agent** to auto-populate new city portraits with sourced data
- **Templatized data schema** (JSON) for easy replication

## Project Structure

```
├── frontend/
│   ├── index-d3.html          # Main D3.js interactive visualization
│   ├── d3-doughnut.js         # D3.js doughnut chart component
│   ├── data.js                # All city data (Santa Cruz jurisdictions)
│   ├── energy-deepdive.html   # Energy dimension deep-dive (→ microgridme.xyz)
│   ├── index.html             # Legacy Canvas-based visualization
│   └── app.js                 # Legacy app logic
├── data/
│   ├── schema.json            # JSON Schema for city portraits
│   └── portland_or.json       # Portland, OR portrait data
├── tools/
│   ├── cli.js                 # CLI for research agent
│   ├── research-agent.js      # AI-powered data collection
│   ├── schema.js              # Data schema definitions
│   └── package.json
├── docs/
│   ├── adding-a-city.md       # Guide to add new cities
│   ├── doughnut-economics-framework.md
│   ├── city-portrait-methodology.md
│   └── santa-cruz-context.md
└── sources/                   # Source document screenshots
```

## Quick Start

### View the visualization
```bash
# Just open in a browser — no build step needed
open frontend/index-d3.html
```

### Add a new city (AI-powered)
```bash
cd tools
npm install
LLM_API_KEY=your-key node cli.js "Austin" "Texas" --verbose --output ../data/austin_tx.json
```

### Add a new city (manual template)
```bash
cd tools
node cli.js --template "Austin" "Texas" --output ../data/austin_tx.json
# Then fill in data manually
```

### Check data quality
```bash
node tools/cli.js --report data/portland_or.json
```

## The Framework

### Social Foundation (Inner Ring)
12 dimensions no one should fall below: food, health, education, income & work, housing, water & sanitation, energy, social equity, peace & justice, political voice, gender equality, networks.

### Ecological Ceiling (Outer Ring)
9 planetary boundaries not to overshoot: climate change, ocean acidification, chemical pollution, nitrogen & phosphorus loading, freshwater withdrawals, land conversion, biodiversity loss, air pollution, ozone layer depletion.

### The Safe and Just Space
The doughnut — between the social foundation and ecological ceiling — is where people thrive within planetary means.

## Data Sources

All data points include source citations. Priority order:
1. City government reports and open data
2. U.S. Census Bureau (ACS)
3. Federal agencies (EPA, NOAA, BLS)
4. State agencies
5. Academic studies and nonprofits

## Energy Deep-Dive

The energy dimension includes a deep-dive page connecting to [microgridme.xyz](https://microgridme.xyz) with:
- Energy burden analysis by income level
- Renewable energy share by city/state
- Distributed generation and storage potential
- Virtual Power Plant (VPP) revenue estimates
- Local energy programs and incentive databases

## Contributing

See [docs/adding-a-city.md](docs/adding-a-city.md) for how to add your city.

## License

MIT — Original doughnut.js visualization by Jeremy Johnson (2021-23).
