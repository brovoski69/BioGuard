// ═══════════════════════════════════════════════════════════════
// BioGuard — Scenario Loader
// Manages scenario data, filtering, and posture angle defaults
// ═══════════════════════════════════════════════════════════════

import { SCENARIOS, SCENARIO_CATEGORIES } from '../utils/constants.js';

export default class ScenarioLoader {
    constructor() {
        this.scenarios = SCENARIOS;
        this.categories = SCENARIO_CATEGORIES;
    }

    getAllScenarios() {
        return Object.entries(this.scenarios).map(([id, data]) => ({
            id,
            ...data
        }));
    }

    loadScenario(scenarioId) {
        const scenario = this.scenarios[scenarioId];
        if (!scenario) return null;
        return { id: scenarioId, ...scenario };
    }

    getDefaultAngles(scenarioId) {
        const scenario = this.scenarios[scenarioId];
        return scenario ? { ...scenario.defaultAngles } : { trunk: 0, knee: 0, hip: 0 };
    }

    filterByCategory(category) {
        if (category === 'all') return this.getAllScenarios();
        return this.getAllScenarios().filter(s => s.category === category);
    }

    getCategories() {
        return this.categories;
    }

    getScenariosByCategory(category) {
        return this.filterByCategory(category);
    }

    // Recommendations based on health conditions
    getRecommendationsForConditions(conditions = []) {
        const avoid = [];
        const recommended = [];

        conditions.forEach(cond => {
            switch (cond) {
                case 'arthritis':
                case 'knee_injury':
                    avoid.push('squatting', 'running', 'climbing_stairs');
                    recommended.push('cycling', 'yoga_downdog', 'sleeping_side');
                    break;
                case 'herniated_disc':
                case 'sciatica':
                    avoid.push('heavy_lifting', 'gardening', 'sitting_desk');
                    recommended.push('yoga_downdog', 'standing_long');
                    break;
                case 'hip_replacement':
                    avoid.push('squatting', 'running', 'heavy_lifting');
                    recommended.push('cycling', 'driving', 'sleeping_side');
                    break;
                case 'osteoporosis':
                    avoid.push('heavy_lifting', 'squatting');
                    recommended.push('cycling', 'yoga_downdog');
                    break;
                case 'obesity':
                    avoid.push('running', 'squatting', 'heavy_lifting');
                    recommended.push('cycling', 'yoga_downdog', 'gardening');
                    break;
                case 'scoliosis':
                    avoid.push('heavy_lifting', 'high_heels');
                    recommended.push('yoga_downdog', 'sleeping_side');
                    break;
            }
        });

        return {
            avoid: [...new Set(avoid)],
            recommended: [...new Set(recommended)]
        };
    }
}
