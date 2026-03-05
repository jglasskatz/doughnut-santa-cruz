const OpenAI = require("openai");
const { SOCIAL_DIMENSIONS, ECOLOGICAL_DIMENSIONS, DIMENSION_SCHEMA } = require("./schema");

const SYSTEM_PROMPT = `You are a research agent for Doughnut Economics city portraits. Your job is to find real, sourced data for a specific dimension of a city's doughnut portrait.

The Doughnut Economics framework (Kate Raworth) maps 12 social foundation dimensions and 9 ecological ceiling dimensions. For each dimension, you need to find:
1. A specific, quantitative indicator (e.g., "% below poverty line", "PM2.5 annual average")
2. The actual measured value with units
3. The year of the data
4. A severity level from -100 (no problem) to 150 (severe)
5. The primary source (government report, academic study, official database)
6. A URL to that source
7. 2-3 sentences of context explaining the number, trends, comparisons
8. A target or threshold to compare against
9. 3-5 ways residents can get involved
10. The geographic scale of the data (city, county, metro, state, national)
11. Your confidence level in the data quality (high, medium, low)

CRITICAL RULES:
- Only use real, verifiable data from official sources (government agencies, peer-reviewed studies, established nonprofits)
- Always include the source URL — no made-up URLs
- If you cannot find reliable data, say so honestly and set confidence to "low"
- Prefer city-level data over county or state-level when available
- Note when data is only available at a broader geographic level
- Include the year of the data — freshness matters
- Set the severity level based on comparison to national averages or established thresholds
- Include sub-indicators when multiple data points exist for a dimension

LEVEL SCALE:
- -100: No problem (well within safe bounds)
- -50: Under control (meeting targets)
- 0: On track (at threshold, needs monitoring)
- 50: Needs attention (exceeding threshold)
- 100: Critical (significantly beyond threshold)
- 150: Severe (emergency level)
- null: Unknown (insufficient data)

SOURCE CITATION FORMAT:
Always provide:
- Full source name (e.g., "U.S. Census Bureau, American Community Survey 5-Year Estimates, 2023")
- Direct URL to the specific data (not just the homepage)
- Publication/data year
- Geographic specificity note if data isn't city-level`;

class DoughnutResearchAgent {
    constructor(options = {}) {
        this.client = new OpenAI({
            apiKey: options.apiKey || process.env.OPENAI_API_KEY || process.env.LLM_API_KEY,
            baseURL: options.baseURL || process.env.OPENAI_BASE_URL || process.env.LLM_BASE_URL || "https://api.openai.com/v1",
        });
        this.model = options.model || process.env.LLM_MODEL || "gpt-4o";
        this.verbose = options.verbose || false;
        // NVIDIA and some providers don't support response_format
        const baseURL = options.baseURL || process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || "";
        this.supportsJsonFormat = !baseURL.includes("nvidia");
        this.maxRetries = options.maxRetries || 3;
        this.retryDelayMs = options.retryDelayMs || 2000;
    }

    log(msg) {
        if (this.verbose) console.error(`  [agent] ${msg}`);
    }

    /**
     * Retry wrapper with exponential backoff
     */
    async _withRetry(fn, label) {
        let lastError;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await fn();
            } catch (err) {
                lastError = err;
                const isRetryable = err.status === 429 || err.status === 500 || err.status === 503 || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT';
                if (!isRetryable || attempt === this.maxRetries) {
                    this.log(`  ${label}: Failed after ${attempt} attempt(s): ${err.message}`);
                    throw err;
                }
                const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
                this.log(`  ${label}: Attempt ${attempt} failed (${err.status || err.code}), retrying in ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
        throw lastError;
    }

    /**
     * Parse JSON from LLM response, handling markdown code blocks
     */
    _parseJSON(content) {
        // Strip markdown code blocks if present
        let cleaned = content.trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
        }
        return JSON.parse(cleaned);
    }

    /**
     * Validate a dimension result has required fields
     */
    _validateDimension(data, dimensionName) {
        const issues = [];
        if (!data.name) data.name = dimensionName;
        if (data.name !== dimensionName) {
            this.log(`  Warning: returned name "${data.name}" doesn't match expected "${dimensionName}"`);
            data.name = dimensionName;
        }
        if (!data.indicator) issues.push('missing indicator');
        if (!data.value) issues.push('missing value');
        if (!data.source) issues.push('missing source');
        if (!data.sourceUrl) issues.push('missing sourceUrl');
        if (!data.confidence) data.confidence = 'low';
        if (!data.geographicScale) data.geographicScale = 'unknown';
        if (!Array.isArray(data.actions)) data.actions = [];

        // Validate level range
        if (data.level !== null && data.level !== undefined) {
            if (typeof data.level !== 'number') {
                data.level = parseInt(data.level);
            }
            if (isNaN(data.level)) data.level = null;
            else data.level = Math.max(-100, Math.min(150, data.level));
        }

        if (issues.length > 0) {
            this.log(`  Validation issues for ${dimensionName}: ${issues.join(', ')}`);
        }
        return data;
    }

    async researchDimension(city, state, dimension, ring) {
        this.log(`Researching ${ring}/${dimension} for ${city}, ${state}...`);

        const prompt = `Research the "${dimension}" dimension for the city of ${city}, ${state}.
This is a ${ring === "social" ? "social foundation" : "ecological ceiling"} dimension.

Find the best available data and return a JSON object with these fields:
- name: "${dimension}" (exactly)
- level: number (-100 to 150) or null
- indicator: what metric is being measured
- value: the actual data value with units
- year: year of the data (integer)
- target: goal/threshold to compare against
- context: 2-3 sentences of context
- source: full citation (e.g., "U.S. Census Bureau, ACS 5-Year Estimates, 2023")
- sourceUrl: direct URL to the data source
- confidence: "high", "medium", or "low"
- geographicScale: "city", "county", "metro", "state", "national", or "global"
- actions: array of 3-5 concrete ways residents can get involved
- subIndicators: array of additional data points, each with {name, value, year, source, sourceUrl}

Search for official data from sources like:
- U.S. Census Bureau (ACS, QuickFacts)
- EPA, NOAA, state environmental agencies
- Local government reports and plans
- County health departments
- FBI UCR crime data
- State education departments
- HUD housing data
- BLS employment data

Return ONLY valid JSON. No markdown, no explanation — just the JSON object.`;

        const makeRequest = async () => {
            const params = {
                model: this.model,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: prompt }
                ],
                temperature: 0.2,
            };

            // Only add response_format for providers/models that support it
            if (this.supportsJsonFormat && !this.model.includes('llama') && !this.model.includes('mistral')) {
                params.response_format = { type: "json_object" };
            }

            return this.client.chat.completions.create(params);
        };

        try {
            const response = await this._withRetry(makeRequest, `${ring}/${dimension}`);
            const content = response.choices[0].message.content;

            try {
                const data = this._parseJSON(content);
                const validated = this._validateDimension(data, dimension);
                this.log(`  Got: ${validated.value} (${validated.confidence} confidence, ${validated.geographicScale} scale)`);
                return validated;
            } catch (parseErr) {
                this.log(`  Failed to parse response for ${dimension}: ${parseErr.message}`);
                this.log(`  Raw content: ${content.substring(0, 200)}...`);
                return this._errorResult(dimension, `JSON parse error: ${parseErr.message}`);
            }
        } catch (apiErr) {
            this.log(`  API error for ${dimension}: ${apiErr.message}`);
            return this._errorResult(dimension, `API error: ${apiErr.message}`);
        }
    }

    _errorResult(dimension, error) {
        return {
            name: dimension,
            level: null,
            indicator: "Research failed",
            value: "Could not retrieve data",
            year: null,
            target: "",
            context: error,
            source: "",
            sourceUrl: "",
            confidence: "low",
            geographicScale: "unknown",
            actions: [],
            subIndicators: [],
            error
        };
    }

    async researchCity(city, state, options = {}) {
        const {
            dimensions = null,
            ring = "both",
            parallel = 3
        } = options;

        const results = { social: [], ecological: [] };
        const tasks = [];

        if (ring === "both" || ring === "social") {
            const dims = dimensions
                ? SOCIAL_DIMENSIONS.filter(d => dimensions.includes(d))
                : SOCIAL_DIMENSIONS;
            for (const dim of dims) tasks.push({ dim, ring: "social" });
        }

        if (ring === "both" || ring === "ecological") {
            const dims = dimensions
                ? ECOLOGICAL_DIMENSIONS.filter(d => dimensions.includes(d))
                : ECOLOGICAL_DIMENSIONS;
            for (const dim of dims) tasks.push({ dim, ring: "ecological" });
        }

        this.log(`Total tasks: ${tasks.length} (parallel: ${parallel})`);

        // Process in batches
        for (let i = 0; i < tasks.length; i += parallel) {
            const batch = tasks.slice(i, i + parallel);
            this.log(`Batch ${Math.floor(i / parallel) + 1}/${Math.ceil(tasks.length / parallel)}: ${batch.map(t => t.dim).join(', ')}`);

            const batchResults = await Promise.allSettled(
                batch.map(t => this.researchDimension(city, state, t.dim, t.ring))
            );

            for (let j = 0; j < batch.length; j++) {
                const result = batchResults[j];
                if (result.status === 'fulfilled') {
                    results[batch[j].ring].push(result.value);
                } else {
                    this.log(`  Task ${batch[j].dim} rejected: ${result.reason}`);
                    results[batch[j].ring].push(this._errorResult(batch[j].dim, String(result.reason)));
                }
            }
        }

        return results;
    }

    async buildPortrait(city, state, population, description, options = {}) {
        this.log(`Building full portrait for ${city}, ${state}...`);

        const data = await this.researchCity(city, state, options);

        const portrait = {
            meta: {
                id: city.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + state.toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 2),
                name: city,
                region: state,
                country: "US",
                population: population || "Unknown",
                description: description || `Doughnut Economics portrait for ${city}, ${state}`,
                lastUpdated: new Date().toISOString().split('T')[0],
                contributors: [`Research Agent (${this.model})`]
            },
            social: data.social,
            ecological: data.ecological
        };

        return portrait;
    }

    /**
     * Generate a data quality report
     */
    generateReport(portrait) {
        const all = [...(portrait.social || []), ...(portrait.ecological || [])];
        const high = all.filter(d => d.confidence === 'high');
        const medium = all.filter(d => d.confidence === 'medium');
        const low = all.filter(d => d.confidence === 'low');
        const errors = all.filter(d => d.error);
        const cityLevel = all.filter(d => d.geographicScale === 'city');
        const missing = all.filter(d => d.level === null);

        return {
            total: all.length,
            confidence: { high: high.length, medium: medium.length, low: low.length },
            errors: errors.length,
            cityLevelData: cityLevel.length,
            missingLevels: missing.length,
            dimensions: all.map(d => ({
                name: d.name,
                confidence: d.confidence,
                geographicScale: d.geographicScale,
                hasError: !!d.error,
                source: d.source,
                year: d.year
            }))
        };
    }
}

module.exports = { DoughnutResearchAgent };
