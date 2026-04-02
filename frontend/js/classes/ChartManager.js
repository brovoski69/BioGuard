// ═══════════════════════════════════════════════════════════════
// BioGuard — Chart Manager
// Chart.js wrapper with dark sci-fi theme
// ═══════════════════════════════════════════════════════════════

import { getRiskColor } from '../utils/helpers.js';
import { JOINT_LABELS, JOINT_SAFE_LIMITS } from '../utils/constants.js';

export default class ChartManager {
    constructor() {
        this.charts = {};
        this._setDefaults();
    }

    _setDefaults() {
        if (typeof Chart !== 'undefined') {
            Chart.defaults.color = '#4a6a8a';
            Chart.defaults.font.family = "'Share Tech Mono', monospace";
            Chart.defaults.font.size = 11;
            Chart.defaults.plugins.legend.labels.usePointStyle = true;
            Chart.defaults.plugins.legend.labels.padding = 16;
        }
    }

    // ── Horizontal Bar Chart (Joint Forces) ──────────────────
    createBarChart(canvasId, forcesData) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        this.destroy(canvasId);

        const joints = Object.keys(forcesData);
        const values = joints.map(j => Math.round(forcesData[j]));
        const colors = joints.map(j => {
            const risk = (forcesData[j] / JOINT_SAFE_LIMITS[j]) * 60;
            return getRiskColor(risk);
        });
        const safeLimits = joints.map(j => JOINT_SAFE_LIMITS[j]);

        const chart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: joints.map(j => JOINT_LABELS[j] || j),
                datasets: [
                    {
                        label: 'Force (N)',
                        data: values,
                        backgroundColor: colors.map(c => c + '33'),
                        borderColor: colors,
                        borderWidth: 2,
                        borderRadius: 4,
                        barPercentage: 0.6
                    },
                    {
                        label: 'Safe Limit',
                        data: safeLimits,
                        type: 'line',
                        borderColor: '#ff3b3b44',
                        borderDash: [5, 5],
                        borderWidth: 1.5,
                        pointStyle: false,
                        fill: false
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1200,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: { font: { size: 10 }, padding: 12 }
                    },
                    tooltip: {
                        backgroundColor: '#0d1528ee',
                        borderColor: '#00f5ff33',
                        borderWidth: 1,
                        titleFont: { family: "'Rajdhani', sans-serif", weight: 700, size: 13 },
                        bodyFont: { family: "'Share Tech Mono', monospace", size: 11 },
                        padding: 12,
                        callbacks: {
                            label: (ctx) => {
                                if (ctx.datasetIndex === 0) {
                                    return ` ${ctx.parsed.x.toLocaleString()} N`;
                                }
                                return ` Safe limit: ${ctx.parsed.x.toLocaleString()} N`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: '#ffffff08', drawBorder: false },
                        ticks: {
                            callback: v => v >= 1000 ? (v / 1000).toFixed(1) + 'kN' : v + 'N'
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: {
                            font: { family: "'Rajdhani', sans-serif", weight: 600, size: 12 },
                            color: '#d0e4f7'
                        }
                    }
                }
            }
        });

        this.charts[canvasId] = chart;
        return chart;
    }

    // ── Line Chart (Long-Term Projection) ────────────────────
    createLineChart(canvasId, projectionData, highlightJoints = ['overall']) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        this.destroy(canvasId);

        const labels = ['Current', '6 Months', '1 Year', '2 Years', '5 Years', '10 Years'];
        const periodKeys = ['current', '6months', '1year', '2years', '5years', '10years'];
        
        const jointColors = {
            overall: '#00f5ff',
            knee: '#ff3b3b',
            spine: '#ffd700',
            hip: '#00ff88',
            ankle: '#0066ff',
            shoulder: '#ff66ff'
        };

        const datasets = highlightJoints.map(joint => {
            const data = periodKeys.map((key, i) => {
                if (i === 0) return projectionData.currentScores?.[joint] || 0;
                return projectionData[key]?.[joint] || 0;
            });

            return {
                label: JOINT_LABELS[joint] || 'Overall',
                data,
                borderColor: jointColors[joint] || '#00f5ff',
                backgroundColor: (jointColors[joint] || '#00f5ff') + '15',
                fill: joint === 'overall',
                tension: 0.4,
                borderWidth: joint === 'overall' ? 3 : 1.5,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: jointColors[joint] || '#00f5ff',
                pointBorderColor: '#0a0f1e',
                pointBorderWidth: 2
            };
        });

        const chart = new Chart(canvas, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1500,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 16, font: { size: 10 } }
                    },
                    tooltip: {
                        backgroundColor: '#0d1528ee',
                        borderColor: '#00f5ff33',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}% risk`
                        }
                    }
                },
                scales: {
                    y: {
                        min: 0,
                        max: 100,
                        grid: { color: '#ffffff06' },
                        ticks: { callback: v => v + '%' }
                    },
                    x: {
                        grid: { color: '#ffffff06' }
                    }
                }
            }
        });

        this.charts[canvasId] = chart;
        return chart;
    }

    // ── Update Existing Chart ────────────────────────────────
    updateChart(canvasId, newData) {
        const chart = this.charts[canvasId];
        if (!chart) return;

        if (Array.isArray(newData)) {
            chart.data.datasets.forEach((ds, i) => {
                if (newData[i]) ds.data = newData[i];
            });
        } else {
            const joints = Object.keys(newData);
            chart.data.datasets[0].data = joints.map(j => Math.round(newData[j]));
            
            // Update bar colors
            if (chart.config.type === 'bar' || chart.data.datasets[0].type === undefined) {
                chart.data.datasets[0].borderColor = joints.map(j => {
                    const risk = (newData[j] / (JOINT_SAFE_LIMITS[j] || 3000)) * 60;
                    return getRiskColor(risk);
                });
                chart.data.datasets[0].backgroundColor = chart.data.datasets[0].borderColor.map(c => c + '33');
            }
        }
        chart.update('active');
    }

    // ── Destroy Chart ────────────────────────────────────────
    destroy(canvasId) {
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
            delete this.charts[canvasId];
        }
    }

    destroyAll() {
        Object.keys(this.charts).forEach(id => this.destroy(id));
    }
}
