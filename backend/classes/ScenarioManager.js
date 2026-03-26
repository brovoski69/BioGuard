/**
 * ScenarioManager - Manages predefined simulation scenarios
 * Provides preset posture configurations for common activities
 */

class ScenarioManager {
    constructor() {
        // Define all preset scenarios with metadata
        this.scenarios = {
            sitting_desk: {
                name: 'Sitting at Desk',
                description: 'Office work at a desk with typical sitting posture',
                category: 'work',
                icon: '🪑',
                postureAngles: {
                    trunk: 85,
                    knee: 90,
                    hip: 90
                },
                typicalDuration: 480, // minutes (8 hours)
                typicalLoad: 0,
                riskFactors: ['prolonged sitting', 'poor posture', 'static position']
            },
            running: {
                name: 'Running',
                description: 'Jogging or running at moderate pace',
                category: 'exercise',
                icon: '🏃',
                postureAngles: {
                    trunk: 10,
                    knee: 45,
                    hip: 30
                },
                typicalDuration: 30,
                typicalLoad: 0,
                riskFactors: ['impact stress', 'repetitive motion', 'joint wear']
            },
            heavy_lifting: {
                name: 'Heavy Lifting',
                description: 'Lifting heavy objects with bent posture',
                category: 'work',
                icon: '🏋️',
                postureAngles: {
                    trunk: 45,
                    knee: 60,
                    hip: 50
                },
                typicalDuration: 15,
                typicalLoad: 20, // kg
                riskFactors: ['spinal compression', 'muscle strain', 'disc herniation']
            },
            high_heels: {
                name: 'Walking in High Heels',
                description: 'Walking or standing in high-heeled shoes',
                category: 'lifestyle',
                icon: '👠',
                postureAngles: {
                    trunk: 5,
                    knee: 15,
                    hip: 10
                },
                typicalDuration: 120,
                typicalLoad: 0,
                riskFactors: ['ankle instability', 'calf strain', 'lower back stress']
            },
            standing_long: {
                name: 'Prolonged Standing',
                description: 'Standing in one position for extended periods',
                category: 'work',
                icon: '🧍',
                postureAngles: {
                    trunk: 0,
                    knee: 5,
                    hip: 0
                },
                typicalDuration: 240,
                typicalLoad: 0,
                riskFactors: ['venous pooling', 'lower back fatigue', 'foot strain']
            },
            squatting: {
                name: 'Squatting',
                description: 'Deep squat position for exercises or tasks',
                category: 'exercise',
                icon: '🏋️‍♂️',
                postureAngles: {
                    trunk: 30,
                    knee: 120,
                    hip: 110
                },
                typicalDuration: 10,
                typicalLoad: 0,
                riskFactors: ['knee stress', 'hip flexion', 'ankle mobility']
            },
            cycling: {
                name: 'Cycling',
                description: 'Riding a bicycle in standard position',
                category: 'exercise',
                icon: '🚴',
                postureAngles: {
                    trunk: 45,
                    knee: 75,
                    hip: 70
                },
                typicalDuration: 45,
                typicalLoad: 0,
                riskFactors: ['knee tracking', 'lower back flexion', 'wrist pressure']
            },
            climbing_stairs: {
                name: 'Climbing Stairs',
                description: 'Walking up stairs or steps',
                category: 'daily',
                icon: '🪜',
                postureAngles: {
                    trunk: 15,
                    knee: 70,
                    hip: 60
                },
                typicalDuration: 5,
                typicalLoad: 0,
                riskFactors: ['knee stress', 'hip flexion', 'cardiovascular demand']
            },
            gardening: {
                name: 'Gardening',
                description: 'Bending and kneeling for garden work',
                category: 'leisure',
                icon: '🌱',
                postureAngles: {
                    trunk: 60,
                    knee: 100,
                    hip: 80
                },
                typicalDuration: 60,
                typicalLoad: 5,
                riskFactors: ['back strain', 'knee pressure', 'repetitive motion']
            },
            driving: {
                name: 'Driving',
                description: 'Sitting in a car driver position',
                category: 'daily',
                icon: '🚗',
                postureAngles: {
                    trunk: 100,
                    knee: 110,
                    hip: 100
                },
                typicalDuration: 60,
                typicalLoad: 0,
                riskFactors: ['hip tightness', 'lower back compression', 'neck strain']
            },
            sleeping_side: {
                name: 'Side Sleeping',
                description: 'Lying on side for sleep',
                category: 'rest',
                icon: '😴',
                postureAngles: {
                    trunk: 0,
                    knee: 30,
                    hip: 30
                },
                typicalDuration: 480,
                typicalLoad: 0,
                riskFactors: ['shoulder pressure', 'hip alignment', 'spinal twist']
            },
            yoga_downdog: {
                name: 'Yoga - Downward Dog',
                description: 'Classic yoga pose with inverted V position',
                category: 'exercise',
                icon: '🧘',
                postureAngles: {
                    trunk: 80,
                    knee: 10,
                    hip: 90
                },
                typicalDuration: 2,
                typicalLoad: 0,
                riskFactors: ['wrist strain', 'hamstring stretch', 'shoulder mobility']
            }
        };
    }

    /**
     * Load a specific scenario by name
     * @param {string} scenarioName - Name of the scenario
     * @returns {{scenario: Object|null, error: string|null}}
     */
    loadScenario(scenarioName) {
        const scenario = this.scenarios[scenarioName];
        
        if (!scenario) {
            return { 
                scenario: null, 
                error: `Scenario '${scenarioName}' not found. Use getAllScenarios() to see available options.` 
            };
        }

        return { 
            scenario: {
                id: scenarioName,
                ...scenario
            }, 
            error: null 
        };
    }

    /**
     * Get posture angles for a scenario
     * @param {string} scenarioName - Name of the scenario
     * @returns {Object|null} Posture angles object or null if not found
     */
    getPostureAngles(scenarioName) {
        const scenario = this.scenarios[scenarioName];
        return scenario ? scenario.postureAngles : null;
    }

    /**
     * Get all available scenarios with metadata
     * @returns {Array<Object>} Array of scenario objects
     */
    getAllScenarios() {
        return Object.entries(this.scenarios).map(([id, scenario]) => ({
            id,
            name: scenario.name,
            description: scenario.description,
            category: scenario.category,
            icon: scenario.icon,
            postureAngles: scenario.postureAngles,
            typicalDuration: scenario.typicalDuration,
            typicalLoad: scenario.typicalLoad,
            riskFactors: scenario.riskFactors
        }));
    }

    /**
     * Get scenarios by category
     * @param {string} category - Category name (work, exercise, daily, leisure, rest, lifestyle)
     * @returns {Array<Object>} Filtered array of scenarios
     */
    getScenariosByCategory(category) {
        return this.getAllScenarios().filter(s => s.category === category);
    }

    /**
     * Get all available categories
     * @returns {Array<string>} Array of category names
     */
    getCategories() {
        const categories = new Set(Object.values(this.scenarios).map(s => s.category));
        return Array.from(categories);
    }

    /**
     * Search scenarios by name or description
     * @param {string} query - Search query
     * @returns {Array<Object>} Matching scenarios
     */
    searchScenarios(query) {
        const lowerQuery = query.toLowerCase();
        return this.getAllScenarios().filter(s => 
            s.name.toLowerCase().includes(lowerQuery) ||
            s.description.toLowerCase().includes(lowerQuery) ||
            s.riskFactors.some(rf => rf.toLowerCase().includes(lowerQuery))
        );
    }

    /**
     * Create a custom scenario
     * @param {string} name - Scenario name
     * @param {Object} postureAngles - Custom posture angles
     * @param {Object} metadata - Additional metadata
     * @returns {Object} The created scenario
     */
    createCustomScenario(name, postureAngles, metadata = {}) {
        const id = name.toLowerCase().replace(/\s+/g, '_');
        
        const customScenario = {
            name,
            description: metadata.description || 'Custom scenario',
            category: 'custom',
            icon: metadata.icon || '⚙️',
            postureAngles: {
                trunk: postureAngles.trunk || 0,
                knee: postureAngles.knee || 0,
                hip: postureAngles.hip || 0
            },
            typicalDuration: metadata.duration || 30,
            typicalLoad: metadata.load || 0,
            riskFactors: metadata.riskFactors || []
        };

        // Add to scenarios (temporary, not persisted)
        this.scenarios[id] = customScenario;

        return { id, ...customScenario };
    }

    /**
     * Get scenario recommendations based on user conditions
     * @param {Array<string>} healthConditions - User's health conditions
     * @returns {Object} Scenarios to avoid and recommended scenarios
     */
    getRecommendationsForConditions(healthConditions) {
        const avoid = [];
        const recommended = [];

        const conditionMap = {
            arthritis: {
                avoid: ['heavy_lifting', 'squatting', 'running'],
                recommend: ['cycling', 'yoga_downdog', 'swimming']
            },
            osteoporosis: {
                avoid: ['running', 'heavy_lifting'],
                recommend: ['walking', 'cycling', 'yoga_downdog']
            },
            knee_injury: {
                avoid: ['running', 'squatting', 'climbing_stairs'],
                recommend: ['cycling', 'swimming']
            },
            herniated_disc: {
                avoid: ['heavy_lifting', 'gardening', 'running'],
                recommend: ['walking', 'yoga_downdog']
            },
            hip_replacement: {
                avoid: ['squatting', 'running', 'high_heels'],
                recommend: ['cycling', 'swimming', 'walking']
            }
        };

        for (const condition of healthConditions) {
            const mapping = conditionMap[condition.toLowerCase()];
            if (mapping) {
                avoid.push(...mapping.avoid);
                recommended.push(...mapping.recommend);
            }
        }

        return {
            avoid: [...new Set(avoid)].map(id => this.loadScenario(id).scenario).filter(Boolean),
            recommended: [...new Set(recommended)].map(id => this.loadScenario(id).scenario).filter(Boolean)
        };
    }
}

export default ScenarioManager;
