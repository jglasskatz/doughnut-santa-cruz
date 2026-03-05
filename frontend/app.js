// App state
let currentJurisdiction = "city_santa_cruz";
let myDonut = null;
let currentData = null;

// Map dimension names to data objects for detail panel lookup
let dimensionDataMap = {};

function getStatusClass(level) {
    if (typeof level === 'string' || isNaN(level)) return 'status-unknown';
    if (level <= -50) return 'status-good';
    if (level <= 0) return 'status-caution';
    if (level <= 50) return 'status-caution';
    if (level <= 100) return 'status-bad';
    return 'status-severe';
}

function getStatusLabel(level) {
    if (typeof level === 'string' || isNaN(level)) return 'Unknown';
    if (level <= -100) return 'No problem';
    if (level <= -50) return 'Under control';
    if (level <= 0) return 'On track';
    if (level <= 50) return 'Needs attention';
    if (level <= 100) return 'Critical';
    return 'Severe';
}

function loadDoughnut(jurisdictionKey) {
    currentJurisdiction = jurisdictionKey;
    currentData = JURISDICTIONS[jurisdictionKey];
    dimensionDataMap = {};

    // Update header info
    document.getElementById('jurisdictionName').textContent = currentData.name;
    document.getElementById('jurisdictionPop').textContent = 'Population: ' + currentData.population;
    document.getElementById('jurisdictionDesc').textContent = currentData.description;

    // Update active button
    document.querySelectorAll('.jurisdiction-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.key === jurisdictionKey);
    });

    // Recreate doughnut fresh each time (library's clearDoughnut has confirm dialog)
    myDonut = new Doughnut(640, 1.0, 14, "doughnutCanvas", "doughnutDiv", null, null, null, null);

    // Set global/local type (colored red gradient for overshoot)
    myDonut.setColours(2, 1, "#883251", "#E096C6");

    // Add social foundation (inner) dimensions
    currentData.social.forEach(dim => {
        // Invert level for inner ring: positive values = shortfall (bad, shows inside doughnut)
        dimensionDataMap['inner:' + dim.name] = { ...dim, ring: 'social' };
        myDonut.addDimension("inner", dim.name, dim.level, "");
    });

    // Add ecological ceiling (outer) dimensions
    currentData.ecological.forEach(dim => {
        dimensionDataMap['outer:' + dim.name] = { ...dim, ring: 'ecological' };
        myDonut.addDimension("outer", dim.name, dim.level, "");
    });

    // Hide detail panel content
    document.getElementById('detailEmpty').style.display = 'flex';
    document.getElementById('detailContent').style.display = 'none';

    // Re-attach click interceptor since canvas is recreated
    setupClickInterceptor();
}

function showDetail(dimType, dimName) {
    const key = dimType + ':' + dimName;
    const data = dimensionDataMap[key];
    if (!data) return;

    const content = document.getElementById('detailContent');
    const isEco = data.ring === 'ecological';

    let html = '';

    // Header
    html += '<div class="detail-header">';
    html += `<span class="detail-ring ${isEco ? 'ring-ecological' : 'ring-social'}"></span>`;
    html += `<h3>${data.name}</h3>`;
    html += `<span class="detail-status ${getStatusClass(data.level)}">${getStatusLabel(data.level)}</span>`;
    html += '</div>';

    // Severity bar
    if (typeof data.level === 'number' && !isNaN(data.level)) {
        const pct = Math.min(100, Math.max(0, (data.level + 100) / 2.5));
        const barColor = data.level <= -50 ? '#4a8c1c' : data.level <= 0 ? '#a8d65c' : data.level <= 50 ? '#f0c929' : data.level <= 100 ? '#e17055' : '#d63031';
        html += '<div class="detail-bar">';
        html += `<div style="background:#eee;border-radius:4px;height:8px;margin-bottom:0.5rem;"><div style="width:${pct}%;height:100%;border-radius:4px;background:${barColor};transition:width 0.3s;"></div></div>`;
        html += '</div>';
    }

    // Metric card
    html += '<div class="detail-metric">';
    html += `<div class="label">${data.indicator || 'Indicator'}</div>`;
    html += `<div class="value">${data.value || 'Data needed'}</div>`;
    if (data.year) html += `<div class="year">Year: ${data.year}</div>`;
    if (data.target) html += `<div class="target">Target: ${data.target}</div>`;
    if (data.context) html += `<div class="context">${data.context}</div>`;
    html += '</div>';

    // Source
    if (data.source) {
        html += '<div class="detail-source">';
        html += '<h4>Primary Source</h4>';
        if (data.sourceUrl) {
            html += `<a href="${data.sourceUrl}" target="_blank">${data.source}</a>`;
        } else {
            html += `<span style="font-size:0.9rem">${data.source}</span>`;
        }
        if (data.screenshot) {
            html += `<img class="source-screenshot" src="${data.screenshot}" alt="Source document" onclick="openLightbox('${data.screenshot}')">`;
        }
        html += '</div>';
    }

    // Actions
    if (data.actions && data.actions.length > 0) {
        html += '<div class="detail-actions">';
        html += '<h4>Ways to Get Involved</h4>';
        html += '<ul>';
        data.actions.forEach(action => {
            html += `<li>${action}</li>`;
        });
        html += '</ul>';
        html += '</div>';
    }

    content.innerHTML = html;
    document.getElementById('detailEmpty').style.display = 'none';
    content.style.display = 'block';
}

function openLightbox(src) {
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightbox').classList.add('active');
}

// Close lightbox on click
document.getElementById('lightbox').addEventListener('click', () => {
    document.getElementById('lightbox').classList.remove('active');
});

// Poll for doughnut clicks since the library uses its own event system
// We override the canvas click handler to intercept dimension selections
function setupClickInterceptor() {
    const canvas = document.getElementById('doughnutCanvas');

    canvas.addEventListener('click', (e) => {
        // After the doughnut library processes the click, check what's selected
        setTimeout(() => {
            const dim = myDonut.getSelectedDimension();
            if (dim) {
                showDetail(dim.type, dim.name);
            }
        }, 50);
    });
}

// Jurisdiction switcher buttons
document.querySelectorAll('.jurisdiction-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        loadDoughnut(btn.dataset.key);
    });
});

// Keyboard shortcuts for switching (only when not in an input)
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === '1') loadDoughnut('city_santa_cruz');
    if (e.key === '2') loadDoughnut('santa_cruz_county');
    if (e.key === '3') loadDoughnut('watsonville');
});

// Initialize
loadDoughnut('city_santa_cruz');
setupClickInterceptor();
