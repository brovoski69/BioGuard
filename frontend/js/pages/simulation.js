// ═══════════════════════════════════════════════════════════════
// BioGuard — Simulation Page Controller
// Orchestrates 3D renderer, physics, charts, and UI
// ═══════════════════════════════════════════════════════════════

import SimulationRenderer from '../classes/SimulationRenderer.js';
import UIController from '../classes/UIController.js';
import ChartManager from '../classes/ChartManager.js';
import ScenarioLoader from '../classes/ScenarioLoader.js';
import PhysicsEngine from '../classes/PhysicsEngine.js';
import AnimationManager from '../classes/AnimationManager.js';
import { JOINTS, JOINT_LABELS } from '../utils/constants.js';
import { loadFromStorage, saveToStorage, getRiskColor, formatForce } from '../utils/helpers.js';

document.addEventListener('DOMContentLoaded', () => {
    // ── Load Profile ─────────────────────────────────────────
    let profile = loadFromStorage('profile');
    const isDemo = new URLSearchParams(window.location.search).get('demo') === 'true';

    if (!profile) {
        // Default demo profile
        profile = {
            name: 'Demo User',
            age: 30,
            weight: 75,
            height: 175,
            body_type: 'mesomorph',
            health_conditions: ['none']
        };
    }

    // ── Initialize Modules ───────────────────────────────────
    const scenarioLoader = new ScenarioLoader();
    const physics = new PhysicsEngine(profile);
    const charts = new ChartManager();
    const ui = new UIController();
    const anim = new AnimationManager();

    let currentScenario = null;
    let renderer = null;
    let showForceVectors = true;
    let lastAnalysis = null;

    // ── Initialize 3D Renderer ───────────────────────────────
    const container3d = document.getElementById('skeleton3d');
    if (container3d && typeof THREE !== 'undefined') {
        try {
            renderer = new SimulationRenderer(container3d);

            // Joint hover callback
            renderer.onJointHover = (jointName) => {
                const hudBottom = document.getElementById('hudBottom');
                const hudInfo = document.getElementById('hudJointInfo');
                if (hudBottom && hudInfo && lastAnalysis) {
                    const category = Object.entries(renderer.trackedJoints || {})
                        .find(([cat, names]) => names.includes(jointName));
                    if (category) {
                        const [cat] = category;
                        const force = lastAnalysis.jointForces[cat];
                        const risk = lastAnalysis.riskScores[cat];
                        hudInfo.textContent = `${JOINT_LABELS[cat] || cat}: ${formatForce(force || 0)} | Risk: ${risk || 0}%`;
                        hudBottom.classList.add('visible');
                    }
                }
            };
        } catch (e) {
            console.warn('3D renderer init failed:', e);
            renderer = null;
        }
    } else if (container3d) {
        // Three.js not loaded — show fallback
        container3d.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:16px;opacity:0.5;">
                <div style="font-size:64px;">🦴</div>
                <div style="font-family:var(--font-mono);font-size:12px;letter-spacing:2px;color:var(--text-dim);text-align:center;">
                    3D VIEWER<br>
                    <span style="font-size:10px;">Three.js library loading...</span>
                </div>
            </div>
        `;
    }

    // ── Initialize Scenario Cards ────────────────────────────
    const scenarioList = document.getElementById('scenarioList');
    const scenarios = scenarioLoader.getAllScenarios();
    ui.initScenarioCards(scenarios, scenarioList);

    // ── Initialize Category Filters ──────────────────────────
    const filterContainer = document.getElementById('categoryFilters');
    ui.initFilterPills(scenarioLoader.getCategories(), filterContainer, (category) => {
        const filtered = scenarioLoader.filterByCategory(category);
        ui.initScenarioCards(filtered, scenarioList);
        // Re-bind scenario select
        ui.onScenarioSelect = onScenarioSelect;
    });

    // ── Scenario Selection Handler ───────────────────────────
    function onScenarioSelect(scenarioId) {
        currentScenario = scenarioLoader.loadScenario(scenarioId);
        if (!currentScenario) return;

        // Update HUD
        document.getElementById('hudIcon').textContent = currentScenario.icon;
        document.getElementById('hudName').textContent = currentScenario.name;

        // Set slider values to scenario defaults
        ui.setSliderValues(currentScenario.defaultAngles);

        // Pulse the run button
        const runBtn = document.getElementById('runSimBtn');
        if (runBtn) {
            runBtn.classList.add('pulse-ready');
            anim.pulse(runBtn, 1.05);
        }

        // Auto-run simulation
        runSimulation();
    }
    ui.onScenarioSelect = onScenarioSelect;

    // ── Initialize Sliders ───────────────────────────────────
    ui.initSliders();
    ui.onSliderChange = (sliderId, value) => {
        const runBtn = document.getElementById('runSimBtn');
        if (runBtn) runBtn.classList.add('pulse-ready');
    };

    // ── Duration Presets ─────────────────────────────────────
    document.querySelectorAll('.duration-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.duration-preset').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const slider = document.getElementById('durationSlider');
            if (slider) {
                slider.value = btn.dataset.value;
                slider.dispatchEvent(new Event('input'));
            }
        });
    });

    // ── Initialize Joint Risk Bars ───────────────────────────
    const jointRisksContainer = document.getElementById('jointRisks');
    if (jointRisksContainer) {
        JOINTS.forEach(joint => {
            const row = document.createElement('div');
            row.className = 'joint-risk-row';
            row.innerHTML = `
                <div class="joint-risk-name">${JOINT_LABELS[joint]}</div>
                <div class="joint-risk-bar">
                    <div class="joint-risk-fill" id="risk-${joint}" style="width:0%"></div>
                </div>
                <div class="joint-risk-val" id="riskval-${joint}">0</div>
            `;
            jointRisksContainer.appendChild(row);
        });
    }

    // ── Run Simulation ───────────────────────────────────────
    function runSimulation() {
        const formData = ui.getFormData();
        const angles = { trunk: formData.trunk, knee: formData.knee, hip: formData.hip };
        const loadWeight = formData.loadWeight;
        const duration = formData.duration;

        // Run physics
        const analysis = physics.getFullAnalysis(angles, loadWeight, duration);
        lastAnalysis = analysis;

        // Save session for report
        saveToStorage('lastSession', {
            scenario: currentScenario,
            angles,
            loadWeight,
            duration,
            analysis,
            timestamp: new Date().toISOString()
        });

        // ── Update 3D Viewer ─────────────────────────────────
        if (renderer) {
            renderer.updateJointColors(analysis.riskScores);
            renderer.renderForceVectors(analysis.jointForces, showForceVectors);
        }

        // ── Update Gauges ────────────────────────────────────
        ui.updateGauges(analysis.riskScores);

        // ── Update Force Chart ───────────────────────────────
        charts.createBarChart('forceChart', analysis.jointForces);

        // ── Update Risk Display ──────────────────────────────
        ui.updateRiskDisplay(analysis.riskScores);

        // Update per-joint risk bars
        JOINTS.forEach(joint => {
            const fill = document.getElementById(`risk-${joint}`);
            const val = document.getElementById(`riskval-${joint}`);
            const score = analysis.riskScores[joint] || 0;
            if (fill) {
                fill.style.width = `${score}%`;
                fill.style.background = getRiskColor(score);
            }
            if (val) {
                anim.countUp(val, score, 800);
            }
        });

        // ── Show Warnings ────────────────────────────────────
        const warningsContainer = document.getElementById('warningsContainer');
        if (warningsContainer) {
            warningsContainer.innerHTML = '';
            JOINTS.forEach(joint => {
                if (analysis.riskScores[joint] >= 70) {
                    ui.showWarning(
                        warningsContainer,
                        JOINT_LABELS[joint],
                        `High stress detected (${analysis.riskScores[joint]}%). Consider reducing activity duration or modifying posture.`
                    );
                }
            });
        }

        // ── Remove pulse from run button ─────────────────────
        const runBtn = document.getElementById('runSimBtn');
        if (runBtn) runBtn.classList.remove('pulse-ready');
    }

    // ── Run Button Click ─────────────────────────────────────
    const runBtn = document.getElementById('runSimBtn');
    if (runBtn) {
        runBtn.addEventListener('click', () => {
            ui.showLoading(runBtn);
            setTimeout(() => {
                runSimulation();
                ui.hideLoading(runBtn);
            }, 400);
        });
    }

    // ── Fix-It Mode Toggle ───────────────────────────────────
    const fixitBtn = document.getElementById('fixitBtn');
    if (fixitBtn) {
        fixitBtn.addEventListener('click', () => {
            fixitBtn.classList.toggle('active');
            if (renderer) {
                renderer.enableFixItMode(fixitBtn.classList.contains('active'));
            }
        });
    }

    // ── View Controls ────────────────────────────────────────
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (renderer) renderer.setCameraPosition(btn.dataset.view);
        });
    });

    // ── Mobile Tab System ────────────────────────────────────
    const tabs = document.querySelectorAll('.sim-tab');
    const panels = {
        controls: document.getElementById('panelControls'),
        viewer: document.getElementById('panelViewer'),
        dashboard: document.getElementById('panelDashboard')
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            Object.values(panels).forEach(p => {
                if (p) p.classList.remove('mobile-visible');
            });

            const target = panels[tab.dataset.panel];
            if (target) target.classList.add('mobile-visible');

            // Resize renderer when switching to viewer tab
            if (tab.dataset.panel === 'viewer' && renderer) {
                setTimeout(() => renderer._onResize(), 100);
            }
        });
    });

    // ── Auto-run demo if demo mode ───────────────────────────
    if (isDemo) {
        setTimeout(() => {
            // Select first scenario
            const firstCard = document.querySelector('.scenario-card');
            if (firstCard) firstCard.click();
        }, 500);
    }
});
