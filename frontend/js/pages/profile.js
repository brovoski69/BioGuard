// ═══════════════════════════════════════════════════════════════
// BioGuard — Profile Page Controller
// ═══════════════════════════════════════════════════════════════

import { HEALTH_CONDITIONS } from '../utils/constants.js';
import { saveToStorage, calculateBMI } from '../utils/helpers.js';

document.addEventListener('DOMContentLoaded', () => {
    const state = {
        name: '',
        age: 25,
        weight: 70,
        height: 170,
        body_type: '',
        health_conditions: []
    };

    // ── Initialize Sliders ───────────────────────────────────
    document.querySelectorAll('.range-slider').forEach(slider => {
        const container = slider.closest('.slider-container');
        const valueEl = container?.querySelector('.slider-value');
        const bubble = container?.querySelector('.slider-bubble');
        const suffix = slider.dataset.suffix || '';

        const update = () => {
            const val = slider.value;
            if (valueEl) valueEl.textContent = val + suffix;
            if (bubble) {
                const pct = (val - slider.min) / (slider.max - slider.min);
                bubble.style.left = (pct * slider.offsetWidth) + 'px';
                bubble.textContent = val + suffix;
            }
            const percent = ((val - slider.min) / (slider.max - slider.min)) * 100;
            slider.style.background = `linear-gradient(90deg, #00f5ff ${percent}%, #111d32 ${percent}%)`;
        };

        slider.addEventListener('input', () => {
            update();
            // Update state
            if (slider.id === 'ageSlider') state.age = parseInt(slider.value);
            if (slider.id === 'weightSlider') state.weight = parseInt(slider.value);
            if (slider.id === 'heightSlider') state.height = parseInt(slider.value);
            updateSilhouette();
            updateProgress();
        });

        update();
    });

    // ── Name Input ───────────────────────────────────────────
    const nameInput = document.getElementById('nameInput');
    if (nameInput) {
        nameInput.addEventListener('input', () => {
            state.name = nameInput.value.trim();
            updateProgress();
        });
    }

    // ── Body Type Cards ──────────────────────────────────────
    document.querySelectorAll('.body-type-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.body-type-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            state.body_type = card.dataset.type;
            document.getElementById('bodyTypeLabel').textContent = card.dataset.type.toUpperCase();
            updateSilhouette();
            updateProgress();
        });
    });

    // ── Health Condition Chips ────────────────────────────────
    const chipsContainer = document.getElementById('healthChips');
    if (chipsContainer) {
        HEALTH_CONDITIONS.forEach(cond => {
            const chip = document.createElement('button');
            chip.className = 'health-chip';
            chip.dataset.condition = cond.id;
            chip.innerHTML = `<span class="chip-icon">${cond.icon}</span> ${cond.label}`;

            chip.addEventListener('click', () => {
                if (cond.id === 'none') {
                    // Deselect all others
                    state.health_conditions = ['none'];
                    document.querySelectorAll('.health-chip').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                } else {
                    // Deselect "none"
                    const noneChip = chipsContainer.querySelector('[data-condition="none"]');
                    noneChip?.classList.remove('active');
                    state.health_conditions = state.health_conditions.filter(c => c !== 'none');

                    chip.classList.toggle('active');
                    if (chip.classList.contains('active')) {
                        state.health_conditions.push(cond.id);
                    } else {
                        state.health_conditions = state.health_conditions.filter(c => c !== cond.id);
                    }
                }
                updateConditionHighlights();
                updateProgress();
            });

            chipsContainer.appendChild(chip);
        });
    }

    // ── Body Silhouette Drawing ──────────────────────────────
    const silCanvas = document.getElementById('silhouetteCanvas');
    const silCtx = silCanvas?.getContext('2d');
    let breathPhase = 0;

    function updateSilhouette() {
        if (!silCtx) return;
        const w = silCanvas.width;
        const h = silCanvas.height;
        silCtx.clearRect(0, 0, w, h);

        const cx = w / 2;
        const breathOffset = Math.sin(breathPhase) * 1.5;

        // Body proportions based on type
        let shoulderW = 40, hipW = 30, waistW = 26, legGap = 14;
        if (state.body_type === 'ectomorph') {
            shoulderW = 32; hipW = 24; waistW = 20; legGap = 12;
        } else if (state.body_type === 'endomorph') {
            shoulderW = 48; hipW = 42; waistW = 38; legGap = 18;
        }

        // Draw body outline
        silCtx.strokeStyle = '#e8e0d0';
        silCtx.lineWidth = 2;
        silCtx.shadowBlur = 10;
        silCtx.shadowColor = '#e8e0d0';
        silCtx.globalAlpha = 0.8;

        // Head
        const headY = 50;
        const headR = 20;
        silCtx.beginPath();
        silCtx.arc(cx, headY, headR, 0, Math.PI * 2);
        silCtx.stroke();

        // Neck
        silCtx.beginPath();
        silCtx.moveTo(cx - 6, headY + headR);
        silCtx.lineTo(cx - 6, headY + headR + 15);
        silCtx.moveTo(cx + 6, headY + headR);
        silCtx.lineTo(cx + 6, headY + headR + 15);
        silCtx.stroke();

        // Torso
        const shoulderY = headY + headR + 15 + breathOffset;
        const waistY = shoulderY + 80;
        const hipY = waistY + 25;

        silCtx.beginPath();
        // Left side
        silCtx.moveTo(cx - shoulderW, shoulderY);
        silCtx.quadraticCurveTo(cx - waistW - 2, shoulderY + 40, cx - waistW, waistY);
        silCtx.quadraticCurveTo(cx - hipW + 2, waistY + 10, cx - hipW, hipY);
        // Right side
        silCtx.moveTo(cx + shoulderW, shoulderY);
        silCtx.quadraticCurveTo(cx + waistW + 2, shoulderY + 40, cx + waistW, waistY);
        silCtx.quadraticCurveTo(cx + hipW - 2, waistY + 10, cx + hipW, hipY);
        // Bottom
        silCtx.moveTo(cx - hipW, hipY);
        silCtx.lineTo(cx + hipW, hipY);
        // Shoulders
        silCtx.moveTo(cx - shoulderW, shoulderY);
        silCtx.lineTo(cx + shoulderW, shoulderY);
        silCtx.stroke();

        // Arms
        const armLen = 100;
        silCtx.beginPath();
        // Left arm
        silCtx.moveTo(cx - shoulderW, shoulderY);
        silCtx.quadraticCurveTo(cx - shoulderW - 10, shoulderY + armLen * 0.5, cx - shoulderW - 5, shoulderY + armLen);
        // Right arm
        silCtx.moveTo(cx + shoulderW, shoulderY);
        silCtx.quadraticCurveTo(cx + shoulderW + 10, shoulderY + armLen * 0.5, cx + shoulderW + 5, shoulderY + armLen);
        silCtx.stroke();

        // Legs
        const legTop = hipY;
        const kneeY = legTop + 80;
        const ankleY = kneeY + 80;

        silCtx.beginPath();
        // Left leg
        silCtx.moveTo(cx - legGap, legTop);
        silCtx.lineTo(cx - legGap - 3, kneeY);
        silCtx.lineTo(cx - legGap - 1, ankleY);
        // Foot
        silCtx.lineTo(cx - legGap - 12, ankleY + 10);
        // Right leg
        silCtx.moveTo(cx + legGap, legTop);
        silCtx.lineTo(cx + legGap + 3, kneeY);
        silCtx.lineTo(cx + legGap + 1, ankleY);
        // Foot
        silCtx.lineTo(cx + legGap + 12, ankleY + 10);
        silCtx.stroke();

        // Draw joint dots for selected conditions
        silCtx.shadowBlur = 15;
        const jointMap = {
            knee: [{ x: cx - legGap - 3, y: kneeY }, { x: cx + legGap + 3, y: kneeY }],
            hip: [{ x: cx - hipW, y: hipY }, { x: cx + hipW, y: hipY }],
            shoulder: [{ x: cx - shoulderW, y: shoulderY }, { x: cx + shoulderW, y: shoulderY }],
            spine: [{ x: cx, y: waistY - 20 }],
            ankle: [{ x: cx - legGap - 1, y: ankleY }, { x: cx + legGap + 1, y: ankleY }]
        };

        // Highlight joints affected by conditions
        const condJointMap = {
            arthritis: ['knee', 'hip', 'shoulder'],
            osteoporosis: ['spine', 'hip'],
            herniated_disc: ['spine'],
            knee_injury: ['knee'],
            hip_replacement: ['hip'],
            scoliosis: ['spine'],
            sciatica: ['spine', 'hip'],
            carpal_tunnel: ['shoulder'],
            tendonitis: ['shoulder', 'knee'],
            bursitis: ['shoulder', 'hip'],
            fibromyalgia: ['knee', 'spine', 'hip', 'shoulder', 'ankle']
        };

        const highlightedJoints = new Set();
        state.health_conditions.forEach(cond => {
            (condJointMap[cond] || []).forEach(j => highlightedJoints.add(j));
        });

        highlightedJoints.forEach(joint => {
            const positions = jointMap[joint] || [];
            positions.forEach(pos => {
                const pulse = Math.sin(breathPhase * 3) * 0.3 + 0.7;
                silCtx.globalAlpha = pulse;
                silCtx.fillStyle = '#ffd700';
                silCtx.shadowColor = '#ffd700';
                silCtx.beginPath();
                silCtx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
                silCtx.fill();
            });
        });

        silCtx.globalAlpha = 1;
        silCtx.shadowBlur = 0;
    }

    // Breathing animation
    function animateBreath() {
        breathPhase += 0.02;
        updateSilhouette();
        requestAnimationFrame(animateBreath);
    }
    animateBreath();

    // ── Condition Highlights ─────────────────────────────────
    function updateConditionHighlights() {
        const container = document.getElementById('conditionHighlights');
        if (!container) return;
        container.innerHTML = '';
        state.health_conditions.filter(c => c !== 'none').forEach(cond => {
            const el = document.createElement('div');
            el.className = 'condition-highlight';
            const info = HEALTH_CONDITIONS.find(h => h.id === cond);
            el.textContent = info ? `${info.icon} ${info.label}` : cond;
            container.appendChild(el);
        });
    }

    // ── Progress Tracking ────────────────────────────────────
    function updateProgress() {
        let progress = 0;

        // Basic info: 40%
        const basicFilled = (state.name.length > 0 ? 1 : 0) + 1 + 1 + 1; // name + age + weight + height (sliders always filled)
        progress += (Math.min(basicFilled, 4) / 4) * 40;

        // Body type: 30%
        if (state.body_type) progress += 30;

        // Health: 30%
        if (state.health_conditions.length > 0) progress += 30;

        // Update progress bar
        const fill = document.getElementById('progressFill');
        if (fill) fill.style.width = `${progress}%`;

        // Update step indicators
        const step1 = document.getElementById('step1');
        const step2 = document.getElementById('step2');
        const step3 = document.getElementById('step3');
        const conn1 = document.getElementById('conn1');
        const conn2 = document.getElementById('conn2');

        if (state.name.length > 0) {
            step1.classList.add('done');
            step1.classList.remove('active');
            conn1.classList.add('done');
            step2.classList.add('active');
        }
        if (state.body_type) {
            step2.classList.add('done');
            step2.classList.remove('active');
            conn2.classList.add('done');
            step3.classList.add('active');
        }
        if (state.health_conditions.length > 0) {
            step3.classList.add('done');
            step3.classList.remove('active');
        }

        // Enable submit button
        const btn = document.getElementById('btnSubmit');
        const canSubmit = state.name.length > 0 && state.body_type && state.health_conditions.length > 0;
        if (btn) btn.disabled = !canSubmit;
    }

    // ── Submit ───────────────────────────────────────────────
    const submitBtn = document.getElementById('btnSubmit');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            if (submitBtn.disabled) return;
            saveToStorage('profile', state);
            // Animate button
            submitBtn.classList.add('loading');
            submitBtn.textContent = '';
            setTimeout(() => {
                window.location.href = 'simulation.html';
            }, 800);
        });
    }

    // Initial state
    updateSilhouette();
    updateProgress();
});
