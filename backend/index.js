// BioGuard Backend - ties everything together into one easy-to-use interface

// Export individual classes for direct use
export { default as SupabaseClient, supabase } from './classes/SupabaseClient.js';
export { default as AuthManager } from './classes/AuthManager.js';
export { default as ProfileManager } from './classes/ProfileManager.js';
export { default as SessionManager } from './classes/SessionManager.js';
export { default as ReportManager } from './classes/ReportManager.js';
export { default as PhysicsEngine } from './classes/PhysicsEngine.js';
export { default as ScenarioManager } from './classes/ScenarioManager.js';

// Need these for the BioGuard class below
import AuthManager from './classes/AuthManager.js';
import ProfileManager from './classes/ProfileManager.js';
import SessionManager from './classes/SessionManager.js';
import ReportManager from './classes/ReportManager.js';
import PhysicsEngine from './classes/PhysicsEngine.js';
import ScenarioManager from './classes/ScenarioManager.js';

// Main class that wraps all the managers - use this for convenience
class BioGuard {
    constructor() {
        // Don't create managers until they're actually needed
        this._authManager = null;
        this._profileManager = null;
        this._sessionManager = null;
        this._reportManager = null;
        this._scenarioManager = null;
        this._physicsEngine = null;
        this._currentProfile = null;
    }

    // Lazy getters - manager instances created on first access
    get auth() {
        if (!this._authManager) this._authManager = new AuthManager();
        return this._authManager;
    }

    get profiles() {
        if (!this._profileManager) this._profileManager = new ProfileManager();
        return this._profileManager;
    }

    get sessions() {
        if (!this._sessionManager) this._sessionManager = new SessionManager();
        return this._sessionManager;
    }

    get reports() {
        if (!this._reportManager) this._reportManager = new ReportManager();
        return this._reportManager;
    }

    get scenarios() {
        if (!this._scenarioManager) this._scenarioManager = new ScenarioManager();
        return this._scenarioManager;
    }

    // Physics engine needs profile data, so it can't be lazy-loaded without context
    initPhysicsEngine(profileData) {
        this._physicsEngine = new PhysicsEngine(profileData);
        this._currentProfile = profileData;
        return this._physicsEngine;
    }

    get physics() {
        return this._physicsEngine;
    }

    // One-shot simulation: load scenario, run calculations, return everything
    async runSimulation(userId, scenarioName, customAngles = null, loadWeight = 0) {
        // Initialize physics if not done yet
        if (!this._physicsEngine) {
            const { profile } = await this.profiles.getProfile(userId);
            if (!profile) throw new Error('User profile not found');
            this.initPhysicsEngine(profile);
        }

        const { scenario, error } = this.scenarios.loadScenario(scenarioName);
        if (error) throw new Error(error);

        const postureAngles = customAngles || scenario.postureAngles;
        const analysis = this._physicsEngine.getFullAnalysis(postureAngles, loadWeight);

        return {
            scenario: scenario.name,
            scenarioId: scenarioName,
            postureAngles,
            loadWeight,
            ...analysis
        };
    }

    // Save simulation results to DB and create a report in one go
    async saveSimulationWithReport(userId, simulationResults, duration = 30) {
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

        const reportData = {
            recommendations: simulationResults.recommendations,
            long_term_projection: simulationResults.longTermProjection
        };

        const { report, error: reportError } = await this.reports.generateReport(
            userId, session.id, reportData
        );
        if (reportError) throw reportError;

        return { session, report };
    }
}

export const bioguard = new BioGuard();
export default BioGuard;
