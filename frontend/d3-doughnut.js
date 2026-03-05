/**
 * D3.js Interactive Doughnut Economics Visualization
 * 
 * Renders a responsive doughnut chart with:
 * - Color-coded overshoot/shortfall segments
 * - Hover tooltips with indicator values and sources
 * - Click to expand details in side panel
 * - Smooth transitions between jurisdictions
 * - Responsive design
 * 
 * License: MIT
 */

class D3Doughnut {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        if (!this.container) throw new Error(`Container #${containerId} not found`);

        // Dimensions
        this.size = options.size || 640;
        this.margin = options.margin || 40;

        // Callbacks
        this.onSelect = options.onSelect || null;
        this.onHover = options.onHover || null;

        // State
        this.data = null;
        this.selectedDim = null;
        this.hoveredDim = null;

        // Color scales
        this.socialColors = {
            severe:   '#883251',
            bad:      '#c0566b',
            caution:  '#e096c6',
            ok:       '#a8d65c',
            good:     '#4a8c1c',
            unknown:  '#ccc'
        };
        this.ecoColors = {
            severe:   '#8b0000',
            bad:      '#d63c36',
            caution:  '#f0c929',
            ok:       '#a8d65c',
            good:     '#2d7d2d',
            unknown:  '#ccc'
        };

        this._initSVG();
        this._initTooltip();
    }

    _initSVG() {
        this.container.innerHTML = '';
        const svg = d3.select(this.container)
            .append('svg')
            .attr('viewBox', `0 0 ${this.size} ${this.size}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .style('width', '100%')
            .style('max-width', `${this.size}px`)
            .style('height', 'auto');

        this.svg = svg;
        this.center = this.size / 2;
        this.g = svg.append('g')
            .attr('transform', `translate(${this.center},${this.center})`);

        // Layers
        this.layerBg = this.g.append('g').attr('class', 'layer-bg');
        this.layerEco = this.g.append('g').attr('class', 'layer-eco');
        this.layerDoughnut = this.g.append('g').attr('class', 'layer-doughnut');
        this.layerSocial = this.g.append('g').attr('class', 'layer-social');
        this.layerLabels = this.g.append('g').attr('class', 'layer-labels');
        this.layerCenter = this.g.append('g').attr('class', 'layer-center');
    }

    _initTooltip() {
        this.tooltip = d3.select(this.container)
            .append('div')
            .attr('class', 'd3-doughnut-tooltip')
            .style('position', 'absolute')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('background', 'rgba(0,0,0,0.85)')
            .style('color', 'white')
            .style('padding', '10px 14px')
            .style('border-radius', '8px')
            .style('font-size', '13px')
            .style('line-height', '1.4')
            .style('max-width', '280px')
            .style('z-index', '100')
            .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)');
    }

    // Radius configuration
    get radii() {
        const r = this.center - this.margin;
        return {
            innerHole: r * 0.18,
            socialInner: r * 0.18,
            socialOuter: r * 0.52,
            doughnutInner: r * 0.52,
            doughnutOuter: r * 0.65,
            ecoInner: r * 0.65,
            ecoOuter: r * 0.95,
            labelSocial: r * 0.36,
            labelEco: r * 0.81,
        };
    }

    _levelToRadius(level, innerR, outerR) {
        if (level === null || level === undefined || isNaN(level)) return null;
        // Map level (-100 to 150) to radius (innerR to outerR)
        const range = outerR - innerR;
        const normalized = (level + 100) / 250; // 0 to 1
        return innerR + Math.min(1, Math.max(0, normalized)) * range;
    }

    _getColor(level, ring) {
        const colors = ring === 'social' ? this.socialColors : this.ecoColors;
        if (level === null || level === undefined || isNaN(level)) return colors.unknown;
        if (level <= -50) return colors.good;
        if (level <= 0) return colors.ok;
        if (level <= 50) return colors.caution;
        if (level <= 100) return colors.bad;
        return colors.severe;
    }

    _getStatusLabel(level) {
        if (level === null || level === undefined || isNaN(level)) return 'Unknown';
        if (level <= -100) return 'No problem';
        if (level <= -50) return 'Under control';
        if (level <= 0) return 'On track';
        if (level <= 50) return 'Needs attention';
        if (level <= 100) return 'Critical';
        return 'Severe';
    }

    setData(jurisdictionData) {
        this.data = jurisdictionData;
        this.selectedDim = null;
        this.render();
    }

    render() {
        if (!this.data) return;
        const R = this.radii;

        // Background rings
        this._drawBackgroundRings(R);
        // Ecological segments (outer)
        this._drawSegments(this.layerEco, this.data.ecological, 'ecological', R.ecoInner, R.ecoOuter);
        // Doughnut ring (safe space)
        this._drawDoughnutRing(R);
        // Social segments (inner)
        this._drawSegments(this.layerSocial, this.data.social, 'social', R.socialInner, R.socialOuter);
        // Labels
        this._drawLabels(R);
        // Center text
        this._drawCenter();
    }

    _drawBackgroundRings(R) {
        this.layerBg.selectAll('*').remove();

        // Faint radial guide circles
        [R.socialInner, R.socialOuter, R.ecoInner, R.ecoOuter].forEach(r => {
            this.layerBg.append('circle')
                .attr('r', r)
                .attr('fill', 'none')
                .attr('stroke', '#e0e0e0')
                .attr('stroke-width', 0.5)
                .attr('stroke-dasharray', '4,4');
        });
    }

    _drawDoughnutRing(R) {
        this.layerDoughnut.selectAll('*').remove();

        const arc = d3.arc()
            .innerRadius(R.doughnutInner)
            .outerRadius(R.doughnutOuter)
            .startAngle(0)
            .endAngle(Math.PI * 2);

        this.layerDoughnut.append('path')
            .attr('d', arc)
            .attr('fill', '#8cd755')
            .attr('stroke', '#477020')
            .attr('stroke-width', 2)
            .attr('opacity', 0.7);

        // Inner and outer border
        [R.doughnutInner, R.doughnutOuter].forEach(r => {
            this.layerDoughnut.append('circle')
                .attr('r', r)
                .attr('fill', 'none')
                .attr('stroke', '#477020')
                .attr('stroke-width', 2);
        });
    }

    _drawSegments(layer, dims, ring, innerR, outerR) {
        layer.selectAll('*').remove();
        if (!dims || dims.length === 0) return;

        const arcAngle = (Math.PI * 2) / dims.length;
        const padAngle = 0.02;
        const isSocial = ring === 'social';

        dims.forEach((dim, i) => {
            const startAngle = i * arcAngle - Math.PI / 2;
            const endAngle = startAngle + arcAngle;

            const level = (typeof dim.level === 'string' && dim.level === 'NaN') ? null : dim.level;
            const color = this._getColor(level, isSocial ? 'social' : 'eco');

            // For social: level determines how far inward from the doughnut ring
            // For eco: level determines how far outward from the doughnut ring
            let segInner, segOuter;
            if (level === null || level === undefined || isNaN(level)) {
                // Unknown — show full segment in gray
                segInner = innerR;
                segOuter = outerR;
            } else {
                const fraction = Math.min(1, Math.max(0, (Math.abs(level) + (level < 0 ? 0 : 0)) / 150));
                if (isSocial) {
                    // Social: shortfall goes inward from doughnut
                    if (level >= 0) {
                        segInner = outerR - (outerR - innerR) * fraction;
                        segOuter = outerR;
                    } else {
                        // Thriving — small segment near doughnut
                        const absFrac = Math.abs(level) / 100;
                        segInner = outerR - (outerR - innerR) * 0.15;
                        segOuter = outerR;
                    }
                } else {
                    // Ecological: overshoot goes outward from doughnut
                    if (level >= 0) {
                        segInner = innerR;
                        segOuter = innerR + (outerR - innerR) * fraction;
                    } else {
                        // Under control — small segment near doughnut
                        segInner = innerR;
                        segOuter = innerR + (outerR - innerR) * 0.15;
                    }
                }
            }

            const arc = d3.arc()
                .innerRadius(segInner)
                .outerRadius(segOuter)
                .startAngle(startAngle + padAngle)
                .endAngle(endAngle - padAngle)
                .cornerRadius(2);

            // Hit area (full segment for interaction)
            const hitArc = d3.arc()
                .innerRadius(innerR)
                .outerRadius(outerR)
                .startAngle(startAngle + padAngle)
                .endAngle(endAngle - padAngle);

            const g = layer.append('g')
                .attr('class', 'segment')
                .style('cursor', 'pointer');

            // Invisible hit area
            g.append('path')
                .attr('d', hitArc)
                .attr('fill', 'transparent')
                .attr('stroke', 'none');

            // Visible segment
            const path = g.append('path')
                .attr('d', arc)
                .attr('fill', color)
                .attr('stroke', 'white')
                .attr('stroke-width', 1)
                .attr('opacity', 0.85)
                .style('transition', 'opacity 0.2s');

            // Interactions
            g.on('mouseenter', (event) => {
                path.attr('opacity', 1).attr('stroke-width', 2).attr('stroke', '#333');
                this._showTooltip(event, dim, isSocial ? 'social' : 'ecological');
                if (this.onHover) this.onHover(dim, ring);
            })
            .on('mousemove', (event) => {
                this._moveTooltip(event);
            })
            .on('mouseleave', () => {
                const isSelected = this.selectedDim && this.selectedDim.name === dim.name;
                path.attr('opacity', isSelected ? 1 : 0.85)
                    .attr('stroke-width', isSelected ? 3 : 1)
                    .attr('stroke', isSelected ? '#0066cc' : 'white');
                this._hideTooltip();
                if (this.onHover) this.onHover(null, null);
            })
            .on('click', () => {
                this._selectDimension(dim, ring, layer);
            });

            // Highlight if selected
            if (this.selectedDim && this.selectedDim.name === dim.name) {
                path.attr('opacity', 1).attr('stroke-width', 3).attr('stroke', '#0066cc');
            }
        });
    }

    _drawLabels(R) {
        this.layerLabels.selectAll('*').remove();

        const drawRingLabels = (dims, radius, color) => {
            if (!dims || dims.length === 0) return;
            const arcAngle = (Math.PI * 2) / dims.length;

            dims.forEach((dim, i) => {
                const angle = i * arcAngle - Math.PI / 2 + arcAngle / 2;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                const words = dim.name.split(' ');
                const lines = [];
                if (words.length <= 2) {
                    lines.push(dim.name);
                } else {
                    const mid = Math.ceil(words.length / 2);
                    lines.push(words.slice(0, mid).join(' '));
                    lines.push(words.slice(mid).join(' '));
                }

                const text = this.layerLabels.append('text')
                    .attr('x', x)
                    .attr('y', y)
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'central')
                    .attr('fill', color)
                    .attr('font-size', '11px')
                    .attr('font-weight', '600')
                    .style('text-shadow', `1px 1px 2px ${color === 'white' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)'}`)
                    .style('pointer-events', 'none');

                lines.forEach((line, li) => {
                    text.append('tspan')
                        .attr('x', x)
                        .attr('dy', li === 0 ? `-${(lines.length - 1) * 6}px` : '14px')
                        .text(line);
                });
            });
        };

        drawRingLabels(this.data.social, R.labelSocial, 'white');
        drawRingLabels(this.data.ecological, R.labelEco, '#333');
    }

    _drawCenter() {
        this.layerCenter.selectAll('*').remove();

        this.layerCenter.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('fill', '#2d5016')
            .attr('font-size', '16px')
            .attr('font-weight', '700')
            .attr('y', -10)
            .text('Doughnut');

        this.layerCenter.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('fill', '#2d5016')
            .attr('font-size', '16px')
            .attr('font-weight', '700')
            .attr('y', 12)
            .text('Economics');
    }

    _showTooltip(event, dim, ring) {
        const level = (typeof dim.level === 'string' && dim.level === 'NaN') ? null : dim.level;
        const status = this._getStatusLabel(level);
        const color = this._getColor(level, ring === 'social' ? 'social' : 'eco');

        let html = `<div style="margin-bottom:4px"><strong style="text-transform:capitalize">${dim.name}</strong>`;
        html += ` <span style="background:${color};padding:2px 6px;border-radius:10px;font-size:11px;color:white;margin-left:4px">${status}</span></div>`;
        html += `<div style="font-size:12px;opacity:0.9">${dim.indicator || ''}</div>`;
        html += `<div style="font-size:14px;font-weight:bold;margin:4px 0">${dim.value || 'Data needed'}</div>`;
        if (dim.year) html += `<div style="font-size:11px;opacity:0.7">Year: ${dim.year}</div>`;
        if (dim.source) html += `<div style="font-size:11px;opacity:0.7;margin-top:2px">Source: ${dim.source}</div>`;
        html += `<div style="font-size:10px;opacity:0.5;margin-top:4px">Click for details</div>`;

        this.tooltip.html(html).style('opacity', 1);
        this._moveTooltip(event);
    }

    _moveTooltip(event) {
        const rect = this.container.getBoundingClientRect();
        let x = event.clientX - rect.left + 15;
        let y = event.clientY - rect.top - 10;
        // Keep tooltip in bounds
        const tw = 280;
        if (x + tw > rect.width) x = event.clientX - rect.left - tw - 10;
        if (y < 0) y = 10;
        this.tooltip.style('left', x + 'px').style('top', y + 'px');
    }

    _hideTooltip() {
        this.tooltip.style('opacity', 0);
    }

    _selectDimension(dim, ring, layer) {
        if (this.selectedDim && this.selectedDim.name === dim.name) {
            this.selectedDim = null;
        } else {
            this.selectedDim = { ...dim, ring };
        }
        this.render(); // Re-render to update highlight
        if (this.onSelect) this.onSelect(this.selectedDim);
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { D3Doughnut };
}
