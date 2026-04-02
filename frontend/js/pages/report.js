// ═══════════════════════════════════════════════════════════════
// BioGuard — Report Page Controller
// Renders the full analysis report from saved session data
// ═══════════════════════════════════════════════════════════════

import ChartManager from '../classes/ChartManager.js';
import AnimationManager from '../classes/AnimationManager.js';
import { JOINTS, JOINT_LABELS, JOINT_SAFE_LIMITS } from '../utils/constants.js';
import { loadFromStorage, getRiskColor, getRiskLevel, formatForce, formatDuration } from '../utils/helpers.js';

document.addEventListener('DOMContentLoaded', () => {
    const charts = new ChartManager();
    const anim = new AnimationManager();

    // ── Load Session Data ────────────────────────────────────
    const session = loadFromStorage('lastSession');
    const profile = loadFromStorage('profile');

    if (!session || !session.analysis) {
        // No data — show placeholder
        document.querySelector('.report-container').innerHTML = `
            <div style="text-align:center; padding:120px 24px;">
                <div style="font-size:64px; margin-bottom:24px; opacity:0.3;">📋</div>
                <h2 style="font-family:var(--font-display); color:var(--text-dim); letter-spacing:3px; margin-bottom:16px;">NO REPORT DATA</h2>
                <p style="color:var(--text-muted); margin-bottom:32px; font-family:var(--font-mono); font-size:12px; letter-spacing:1px;">
                    Run a simulation first to generate a report.
                </p>
                <a href="simulation.html" class="btn btn-primary">▶ GO TO SIMULATION</a>
            </div>
        `;
        return;
    }

    const { analysis, scenario, angles, loadWeight, duration, timestamp } = session;
    const { jointForces, riskScores, longTermProjection, recommendations, riskLevel, profileSummary } = analysis;

    // ── Report Header ────────────────────────────────────────
    const ts = document.getElementById('reportTimestamp');
    if (ts) {
        const date = new Date(timestamp);
        ts.textContent = `Generated: ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
    }

    // ── Profile Summary ──────────────────────────────────────
    const rp = profileSummary || {};
    setText('rpName', rp.name || 'User');
    setText('rpAge', rp.age || '—');
    setText('rpBMI', rp.bmi ? rp.bmi.toFixed(1) : '—');
    setText('rpBodyType', (rp.bodyType || '—').charAt(0).toUpperCase() + (rp.bodyType || '').slice(1));

    // ── Simulation Summary ───────────────────────────────────
    setText('ssScenario', scenario ? `${scenario.icon} ${scenario.name}` : 'Custom');
    setText('ssDuration', formatDuration(duration || 60));
    setText('ssLoad', `${loadWeight || 0} kg`);
    setText('ssAngles', angles ? `T:${angles.trunk}° K:${angles.knee}° H:${angles.hip}°` : '—');

    // Overall risk
    const rbScore = document.getElementById('rbScore');
    if (rbScore) anim.countUp(rbScore, riskScores.overall, 1500);

    const rbBadge = document.getElementById('rbBadge');
    if (rbBadge) {
        rbBadge.className = `status-badge ${riskLevel}`;
        rbBadge.textContent = riskLevel.toUpperCase();
    }

    // ── Joint Accordion ──────────────────────────────────────
    const accordion = document.getElementById('jointAccordion');
    if (accordion) {
        JOINTS.forEach(joint => {
            const score = riskScores[joint] || 0;
            const force = jointForces[joint] || 0;
            const level = getRiskLevel(score);
            const safeLimit = JOINT_SAFE_LIMITS[joint];
            const utilization = Math.round((force / safeLimit) * 100);

            // Joint-specific recommendations
            const jointRecs = recommendations?.filter(r => {
                const jLabel = JOINT_LABELS[joint].toLowerCase();
                return r.toLowerCase().includes(jLabel) || r.toLowerCase().includes(joint);
            }) || [];

            const item = document.createElement('div');
            item.className = 'accordion-item';
            item.innerHTML = `
                <button class="accordion-header">
                    <div class="joint-header-info">
                        <div class="joint-status-dot" style="background:${level.color}; box-shadow:0 0 8px ${level.glow};"></div>
                        <span class="joint-header-name">${JOINT_LABELS[joint]}</span>
                        <span class="joint-header-score" style="color:${level.color}">${score}% risk</span>
                    </div>
                    <span class="accordion-arrow">▼</span>
                </button>
                <div class="accordion-body">
                    <div class="accordion-content">
                        <div class="joint-detail-grid">
                            <div class="joint-detail-item">
                                <div class="joint-detail-label">Force Applied</div>
                                <div class="joint-detail-value">${formatForce(force)}</div>
                            </div>
                            <div class="joint-detail-item">
                                <div class="joint-detail-label">Risk Score</div>
                                <div class="joint-detail-value" style="color:${level.color}">${score}/100</div>
                            </div>
                            <div class="joint-detail-item">
                                <div class="joint-detail-label">Safe Limit</div>
                                <div class="joint-detail-value">${formatForce(safeLimit)}</div>
                            </div>
                            <div class="joint-detail-item">
                                <div class="joint-detail-label">Utilization</div>
                                <div class="joint-detail-value" style="color:${utilization > 80 ? '#ff3b3b' : utilization > 50 ? '#ffd700' : '#00ff88'}">${utilization}%</div>
                            </div>
                        </div>
                        <div class="joint-detail-item" style="margin-top:8px;">
                            <div class="joint-detail-label">Status</div>
                            <div class="status-badge ${riskLevel}" style="margin-top:6px;">${level.label}</div>
                        </div>
                        ${jointRecs.length > 0 ? `
                            <div class="joint-detail-recs" style="margin-top:12px;">
                                <div class="joint-detail-label" style="margin-bottom:6px;">Specific Recommendations</div>
                                ${jointRecs.map(r => `<div style="padding:4px 0;font-size:12px;color:var(--text-dim);">${r}</div>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;

            // Toggle accordion
            const header = item.querySelector('.accordion-header');
            header.addEventListener('click', () => {
                item.classList.toggle('open');
            });

            accordion.appendChild(item);
        });

        // Auto-open the highest risk joint
        const highestJoint = JOINTS.reduce((a, b) => (riskScores[a] > riskScores[b] ? a : b));
        const items = accordion.querySelectorAll('.accordion-item');
        const highIdx = JOINTS.indexOf(highestJoint);
        if (items[highIdx]) items[highIdx].classList.add('open');
    }

    // ── Projection Chart ─────────────────────────────────────
    if (longTermProjection) {
        // Find top 3 at-risk joints
        const topJoints = JOINTS
            .sort((a, b) => (riskScores[b] || 0) - (riskScores[a] || 0))
            .slice(0, 3);

        const chartJoints = ['overall', ...topJoints];
        const projData = {
            ...longTermProjection,
            currentScores: riskScores
        };

        charts.createLineChart('projectionChart', projData, chartJoints);
    }

    // ── Recommendations ──────────────────────────────────────
    const recsList = document.getElementById('recommendationsList');
    if (recsList && recommendations) {
        recommendations.forEach(rec => {
            const card = document.createElement('div');
            const isDanger = rec.includes('CRITICAL') || rec.includes('HIGH RISK');
            const isWarning = rec.includes('⚠️') || rec.includes('MODERATE');
            card.className = `recommendation-card${isDanger ? ' danger' : isWarning ? ' warning' : ''}`;

            // Extract emoji icon
            const emojiMatch = rec.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)/u);
            const icon = emojiMatch ? emojiMatch[0] : '💡';
            const text = emojiMatch ? rec.slice(emojiMatch[0].length).trim() : rec;

            card.innerHTML = `
                <span class="rec-icon">${icon}</span>
                <span class="rec-text">${text}</span>
            `;
            recsList.appendChild(card);
        });

        // Stagger animation
        anim.staggerIn(recsList, '.recommendation-card', 80, 'left');
    }

    // ── Download PDF ─────────────────────────────────────────
    const pdfBtn = document.getElementById('btnDownloadPdf');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', () => {
            pdfBtn.classList.add('loading');
            pdfBtn.textContent = '';

            // Use browser print as PDF fallback
            setTimeout(() => {
                pdfBtn.classList.remove('loading');
                pdfBtn.textContent = '📥 Download PDF';
                window.print();
            }, 800);
        });
    }

    // ── Share Report ─────────────────────────────────────────
    const shareBtn = document.getElementById('btnShareReport');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            // Copy current URL to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                const original = shareBtn.textContent;
                shareBtn.textContent = '✓ Link Copied!';
                shareBtn.style.borderColor = 'var(--success-green)';
                shareBtn.style.color = 'var(--success-green)';
                setTimeout(() => {
                    shareBtn.textContent = original;
                    shareBtn.style.borderColor = '';
                    shareBtn.style.color = '';
                }, 2000);
            }).catch(() => {
                // Fallback
                const el = document.createElement('textarea');
                el.value = window.location.href;
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
                shareBtn.textContent = '✓ Link Copied!';
                setTimeout(() => {
                    shareBtn.textContent = '🔗 Share Report';
                }, 2000);
            });
        });
    }

    // ── Scroll Animation Observer ────────────────────────────
    const cards = document.querySelectorAll('.report-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
            }
        });
    }, { threshold: 0.1 });
    cards.forEach(card => observer.observe(card));

    // ── Helper ───────────────────────────────────────────────
    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }
});
