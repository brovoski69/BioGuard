/**
 * BioGuard Backend - Main Entry Point
 * Exports all classes for use throughout the application
 */

// Core client
export { default as SupabaseClient, supabase } from './classes/SupabaseClient.js';

// Manager classes
export { default as AuthManager } from './classes/AuthManager.js';
export { default as ProfileManager } from './classes/ProfileManager.js';
export { default as SessionManager } from './classes/SessionManager.js';
export { default as ReportManager } from './classes/ReportManager.js';

// Core simulation classes
export { default as PhysicsEngine } from './classes/PhysicsEngine.js';
export { default as ScenarioManager } from './classes/ScenarioManager.js';

// Import classes for BioGuard main class (ES module compatible)
import AuthManager from './classes/AuthManager.js';
import ProfileManager from './classes/ProfileManager.js';
import SessionManager from './classes/SessionManager.js';
import ReportManager from './classes/ReportManager.js';
import PhysicsEngine from './classes/PhysicsEngine.js';
import ScenarioManager from './classes/ScenarioManager.js';

/**
 * BioGuard - Main Application Class
 * Provides a unified interface for all backend operations
 */
class BioGuard {
    constructor() {
        // Lazy initialization - managers created on first access
        this._authManager = null;
        this._profileManager = null;
        this._sessionManager = null;
        this._reportManager = null;
        this._scenarioManager = null;
        this._physicsEngine = null;
        this._currentProfile = null;
    }

    // Getters for lazy initialization
    get auth() {
        if (!this._authManager) {
            this._authManager = new AuthManager();
        }
        return this._authManager;
    }

    get profiles() {
        if (!this._profileManager) {
            this._profileManager = new ProfileManager();
        }
        return this._profileManager;
    }

    get sessions() {
        if (!this._sessionManager) {
            this._sessionManager = new SessionManager();
        }
        return this._sessionManager;
    }

    get reports() {
        if (!this._reportManager) {
            this._reportManager = new ReportManager();
        }
        return this._reportManager;
    }

    get scenarios() {
        if (!this._scenarioManager) {
            this._scenarioManager = new ScenarioManager();
        }
        return this._scenarioManager;
    }

    /**
     * Initialize physics engine with user profile
     * @param {Object} profileData - User profile data
     * @returns {PhysicsEngine}
     */
    initPhysicsEngine(profileData) {
        this._physicsEngine = new PhysicsEngine(profileData);
        this._currentProfile = profileData;
        return this._physicsEngine;
    }

    /**
     * Get current physics engine instance
     * @returns {PhysicsEngine|null}
     */
    get physics() {
        return this._physicsEngine;
    }

    /**
     * Run a complete simulation flow
     * @param {string} userId - User ID
     * @param {string} scenarioName - Scenario to simulate
     * @param {Object} customAngles - Optional custom angles override
     * @param {number} loadWeight - External load weight
     * @returns {Promise<Object>} Complete simulation results
     */
    async runSimulation(userId, scenarioName, customAngles = null, loadWeight = 0) {
        // Get user profile if physics engine not initialized
        if (!this._physicsEngine) {
            const { profile } = await this.profiles.getProfile(userId);
            if (!profile) {
                throw new Error('User profile not found');
            }
            this.initPhysicsEngine(profile);
        }

        // Load scenario
        const { scenario, error } = this.scenarios.loadScenario(scenarioName);
        if (error) throw new Error(error);

        // Use custom angles or scenario defaults
        const postureAngles = customAngles || scenario.postureAngles;

        // Run physics calculations
        const analysis = this._physicsEngine.getFullAnalysis(postureAngles, loadWeight);

        return {
            scenario: scenario.name,
            scenarioId: scenarioName,
            postureAngles,
            loadWeight,
            ...analysis
        };
    }

    /**
     * Save simulation and generate report
     * @param {string} userId - User ID
     * @param {Object} simulationResults - Results from runSimulation
     * @param {number} duration - Activity duration in minutes
     * @returns {Promise<Object>} Saved session and report
     */
    async saveSimulationWithReport(userId, simulationResults, duration = 30) {
        // Save session
        const sessionData = {
            scenario: simulationResults.scenario,
            posture_angles: simulationResults.postureAngles,
            joint_forces: simulationResults.jointForces,
            risk_scores: simulationResults.riskScores,
            load_weight: simulationResults.loadWeight,
            activity_duration: duration
        };

        const { session, error: sessionError } = await this.sessions.saveSession(userId, sessionData);
        if (sessionError) throw sessionError;

        // Generate report
        const reportData = {
            recommendations: simulationResults.recommendations,
            long_term_projection: simulationResults.longTermProjection
        };

        const { report, error: reportError } = await this.reports.generateReport(
            userId, 
            session.id, 
            reportData
        );
        if (reportError) throw reportError;

        return { session, report };
    }
}

// Export singleton instance
export const bioguard = new BioGuard();
export default BioGuard;
