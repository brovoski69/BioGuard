// ═══════════════════════════════════════════════════════════════
// BioGuard — UI Controller
// Handles all UI state, input binding, and DOM updates
// ═══════════════════════════════════════════════════════════════

import { $, $$, createElement, debounce } from '../utils/helpers.js';
import AnimationManager from './AnimationManager.js';

export default class UIController {
    constructor() {
        this.anim = new AnimationManager();
        this.onSliderChange = null;
        this.onScenarioSelect = null;
        this.onRunSimulation = null;
    }

    // ── Initialize Sliders ───────────────────────────────────
    initSliders() {
        $$('.range-slider').forEach(slider => {
            const container = slider.closest('.slider-container');
            const valueEl = container?.querySelector('.slider-value');
            const bubble = container?.querySelector('.slider-bubble');
            const suffix = slider.dataset.suffix || '';

            const update = () => {
                const val = slider.value;
                if (valueEl) valueEl.textContent = val + suffix;

                // Update bubble position
                if (bubble) {
                    const pct = (val - slider.min) / (slider.max - slider.min);
                    const offset = pct * slider.offsetWidth;
                    bubble.style.left = offset + 'px';
                    bubble.textContent = val + suffix;
                }

                // Update track fill via CSS gradient
                const percent = ((val - slider.min) / (slider.max - slider.min)) * 100;
                slider.style.background = `linear-gradient(90deg, #00f5ff ${percent}%, #111d32 ${percent}%)`;
            };

            slider.addEventListener('input', debounce(() => {
                update();
                if (this.onSliderChange) this.onSliderChange(slider.id, parseFloat(slider.value));
            }, 16));

            // Initial update
            update();
        });
    }

    // ── Initialize Scenario Cards ────────────────────────────
    initScenarioCards(scenarios, container) {
        if (!container) return;
        container.innerHTML = '';

        scenarios.forEach(scenario => {
            const card = createElement('div', {
                className: 'scenario-card',
                'data-scenario': scenario.id,
                innerHTML: `
                    <div class="scenario-icon">${scenario.icon}</div>
                    <div class="scenario-info">
                        <div class="scenario-name">${scenario.name}</div>
                        <div class="scenario-category">${scenario.category}</div>
                    </div>
                `
            });

            card.addEventListener('click', () => {
                $$('.scenario-card', container).forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                if (this.onScenarioSelect) this.onScenarioSelect(scenario.id);
            });

            container.appendChild(card);
        });
    }

    // ── Initialize Filter Pills ──────────────────────────────
    initFilterPills(categories, container, onFilter) {
        if (!container) return;
        container.innerHTML = '';

        categories.forEach(cat => {
            const pill = createElement('button', {
                className: `filter-pill${cat.id === 'all' ? ' active' : ''}`,
                textContent: cat.label,
                'data-category': cat.id
            });

            pill.addEventListener('click', () => {
                $$('.filter-pill', container).forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                if (onFilter) onFilter(cat.id);
            });

            container.appendChild(pill);
        });
    }

    // ── Bind Events ──────────────────────────────────────────
    bindEvents() {
        // Run simulation button
        const runBtn = $('#runSimBtn');
        if (runBtn) {
            runBtn.addEventListener('click', () => {
                if (this.onRunSimulation) this.onRunSimulation();
            });
        }

        // Duration presets
        $$('.duration-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.duration-preset').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const slider = $('#durationSlider');
                if (slider) {
                    slider.value = btn.dataset.value;
                    slider.dispatchEvent(new Event('input'));
                }
            });
        });
    }

    // ── Get Form Data ────────────────────────────────────────
    getFormData() {
        return {
            trunk: parseFloat($('#trunkSlider')?.value || 0),
            knee: parseFloat($('#kneeSlider')?.value || 0),
            hip: parseFloat($('#hipSlider')?.value || 0),
            loadWeight: parseFloat($('#loadSlider')?.value || 0),
            duration: parseFloat($('#durationSlider')?.value || 60)
        };
    }

    // ── Show / Hide Loading ──────────────────────────────────
    showLoading(btn) {
        if (!btn) return;
        btn.classList.add('loading');
        btn.disabled = true;
    }

    hideLoading(btn) {
        if (!btn) return;
        btn.classList.remove('loading');
        btn.disabled = false;
    }

    // ── Show Warning ─────────────────────────────────────────
    showWarning(container, joint, message) {
        if (!container) return;
        const card = createElement('div', {
            className: 'warning-card',
            innerHTML: `
                <div class="warning-icon">⚠️</div>
                <div class="warning-content">
                    <div class="warning-title">${joint}</div>
                    <div class="warning-text">${message}</div>
                </div>
                <button class="warning-close" onclick="this.closest('.warning-card').remove()">✕</button>
            `
        });

        container.prepend(card);

        // Auto-dismiss after 10s
        setTimeout(() => {
            if (card.parentElement) {
                card.style.transition = 'opacity 0.3s, transform 0.3s';
                card.style.opacity = '0';
                card.style.transform = 'translateX(40px)';
                setTimeout(() => card.remove(), 300);
            }
        }, 10000);
    }

    // ── Update Progress Bar ──────────────────────────────────
    updateProgressBar(element, percent) {
        if (!element) return;
        const fill = element.querySelector('.progress-fill') || element;
        fill.style.width = `${Math.min(percent, 100)}%`;
    }

    // ── Update Risk Display ──────────────────────────────────
    updateRiskDisplay(scores) {
        // Overall risk badge
        const badge = $('#overallRiskBadge');
        if (badge && scores.overall !== undefined) {
            const level = scores.overall >= 80 ? 'critical' :
                          scores.overall >= 60 ? 'high' :
                          scores.overall >= 40 ? 'moderate' :
                          scores.overall >= 20 ? 'low' : 'minimal';
            badge.className = `status-badge ${level}`;
            badge.textContent = level.toUpperCase();
        }

        // Overall score number
        const scoreEl = $('#overallScore');
        if (scoreEl) {
            this.anim.countUp(scoreEl, scores.overall || 0, 1000);
        }
    }

    // ── Update Radial Gauges ─────────────────────────────────
    updateGauges(riskScores) {
        const gaugeEls = $$('.radial-gauge');
        const topJoints = Object.entries(riskScores)
            .filter(([k]) => k !== 'overall')
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);

        gaugeEls.forEach((gauge, i) => {
            if (!topJoints[i]) return;
            const [joint, score] = topJoints[i];
            const valueEl = gauge.querySelector('.gauge-value');
            const labelEl = gauge.querySelector('.gauge-label');
            const fillEl = gauge.querySelector('.gauge-fill');

            if (labelEl) labelEl.textContent = joint.toUpperCase();
            if (valueEl) this.anim.countUp(valueEl, score, 1000);
            if (fillEl) {
                const radius = parseFloat(fillEl.getAttribute('r'));
                const circ = 2 * Math.PI * radius;
                fillEl.style.strokeDasharray = `${circ}`;
                fillEl.style.strokeDashoffset = `${circ * (1 - score / 100)}`;
                
                // Color based on risk
                const color = score >= 80 ? '#ff0040' :
                              score >= 60 ? '#ff3b3b' :
                              score >= 40 ? '#ffd700' :
                              score >= 20 ? '#7dff7a' : '#00ff88';
                fillEl.style.stroke = color;
            }
        });
    }

    // ── Set Slider Values ────────────────────────────────────
    setSliderValues(angles) {
        const sliders = {
            trunkSlider: angles.trunk,
            kneeSlider: angles.knee,
            hipSlider: angles.hip
        };
        Object.entries(sliders).forEach(([id, val]) => {
            const slider = $(`#${id}`);
            if (slider) {
                slider.value = val;
                slider.dispatchEvent(new Event('input'));
            }
        });
    }
}
