// Doughnut Economics data schema
// Defines the structure for city portrait data that the research agent produces

const SOCIAL_DIMENSIONS = [
    "food", "health", "education", "income & work", "housing",
    "water & sanitation", "energy", "social equity",
    "peace & justice", "political voice", "gender equality", "networks"
];

const ECOLOGICAL_DIMENSIONS = [
    "climate change", "ocean acidification", "chemical pollution",
    "nitrogen & phosphorus loading", "freshwater withdrawals",
    "land conversion", "biodiversity loss", "air pollution",
    "ozone layer depletion"
];

// Level scale: -100 (no problem) to 150 (severe). null = unknown.
const LEVEL_SCALE = {
    "-100": "No problem",
    "-50": "Under control",
    "0": "On track",
    "50": "Needs attention",
    "100": "Critical",
    "150": "Severe"
};

// JSON Schema for a single dimension data point
const DIMENSION_SCHEMA = {
    type: "object",
    properties: {
        name: { type: "string", description: "Dimension name (e.g., 'food', 'climate change')" },
        level: { type: ["number", "null"], description: "Severity level from -100 to 150. null if unknown." },
        indicator: { type: "string", description: "What metric is being measured" },
        value: { type: "string", description: "The actual data value with units" },
        year: { type: ["integer", "null"], description: "Year of the data" },
        target: { type: "string", description: "Goal or threshold to compare against" },
        context: { type: "string", description: "2-3 sentences of context" },
        source: { type: "string", description: "Full citation of the primary source" },
        sourceUrl: { type: "string", description: "Direct URL to the source data" },
        screenshot: { type: ["string", "null"], description: "Path to source screenshot image" },
        confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "Confidence in the data quality and accuracy"
        },
        geographicScale: {
            type: "string",
            enum: ["city", "county", "metro", "state", "national", "global", "unknown"],
            description: "Geographic level of the data"
        },
        actions: {
            type: "array",
            items: { type: "string" },
            description: "3-5 concrete ways residents can get involved"
        },
        subIndicators: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    value: { type: "string" },
                    year: { type: "integer" },
                    source: { type: "string" },
                    sourceUrl: { type: "string" }
                }
            },
            description: "Additional data points for this dimension"
        }
    },
    required: ["name", "indicator", "value", "source", "sourceUrl", "confidence"]
};

// JSON Schema for city metadata
const META_SCHEMA = {
    type: "object",
    properties: {
        id: { type: "string", description: "URL-safe identifier" },
        name: { type: "string" },
        region: { type: "string" },
        country: { type: "string" },
        population: { type: "string" },
        description: { type: "string" },
        coordinates: {
            type: "object",
            properties: {
                lat: { type: "number" },
                lng: { type: "number" }
            }
        },
        lastUpdated: { type: "string", format: "date" },
        contributors: { type: "array", items: { type: "string" } }
    },
    required: ["id", "name", "region", "country", "population"]
};

// JSON Schema for a full city portrait
const PORTRAIT_SCHEMA = {
    type: "object",
    properties: {
        meta: META_SCHEMA,
        ecological: { type: "array", items: DIMENSION_SCHEMA },
        social: { type: "array", items: DIMENSION_SCHEMA }
    },
    required: ["meta", "social", "ecological"]
};

// Template for creating a new city portrait with empty dimensions
function createEmptyPortrait(id, name, region, country, population, description) {
    const emptyDim = (dimName) => ({
        name: dimName,
        level: null,
        indicator: "Data needed",
        value: "Not yet researched",
        year: null,
        target: "",
        context: "",
        source: "",
        sourceUrl: "",
        confidence: "low",
        geographicScale: "unknown",
        actions: [],
        subIndicators: []
    });

    return {
        meta: {
            id, name, region, country, population, description,
            lastUpdated: new Date().toISOString().split('T')[0],
            contributors: []
        },
        social: SOCIAL_DIMENSIONS.map(emptyDim),
        ecological: ECOLOGICAL_DIMENSIONS.map(emptyDim)
    };
}

module.exports = {
    SOCIAL_DIMENSIONS,
    ECOLOGICAL_DIMENSIONS,
    LEVEL_SCALE,
    DIMENSION_SCHEMA,
    META_SCHEMA,
    PORTRAIT_SCHEMA,
    createEmptyPortrait
};
