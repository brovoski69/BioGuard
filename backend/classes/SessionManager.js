/**
 * SessionManager - Handles simulation session CRUD operations
 * Manages saving, retrieving, and deleting simulation sessions
 * Includes rate limiting to prevent abuse (max 1 save per minute)
 */

import { supabase } from './SupabaseClient.js';

class SessionManager {
    constructor() {
        // Rate limiting: Track last save time per user
        this.lastSaveTime = new Map();
        this.RATE_LIMIT_MS = 60000; // 1 minute in milliseconds
    }

    /**
     * Check if user is rate limited
     * @param {string} userId - User UUID
     * @returns {{limited: boolean, remainingSeconds: number}}
     */
    checkRateLimit(userId) {
        const lastTime = this.lastSaveTime.get(userId);
        if (!lastTime) {
            return { limited: false, remainingSeconds: 0 };
        }

        const elapsed = Date.now() - lastTime;
        if (elapsed < this.RATE_LIMIT_MS) {
            const remainingSeconds = Math.ceil((this.RATE_LIMIT_MS - elapsed) / 1000);
            return { limited: true, remainingSeconds };
        }

        return { limited: false, remainingSeconds: 0 };
    }

    /**
     * Validate session data
     * @param {Object} sessionData - Session data to validate
     * @returns {{valid: boolean, error: string|null}}
     */
    validateSessionData(sessionData) {
        const { scenario, posture_angles, joint_forces, risk_scores, load_weight, activity_duration } = sessionData;

        if (!scenario || typeof scenario !== 'string') {
            return { valid: false, error: 'Scenario is required' };
        }

        if (!posture_angles || typeof posture_angles !== 'object') {
            return { valid: false, error: 'Posture angles must be an object' };
        }

        if (!joint_forces || typeof joint_forces !== 'object') {
            return { valid: false, error: 'Joint forces must be an object' };
        }

        if (!risk_scores || typeof risk_scores !== 'object') {
            return { valid: false, error: 'Risk scores must be an object' };
        }

        if (load_weight !== undefined && (typeof load_weight !== 'number' || load_weight < 0)) {
            return { valid: false, error: 'Load weight must be a non-negative number' };
        }

        if (activity_duration !== undefined && (typeof activity_duration !== 'number' || activity_duration < 0)) {
            return { valid: false, error: 'Activity duration must be a non-negative number' };
        }

        return { valid: true, error: null };
    }

    /**
     * Save a new simulation session
     * @param {string} userId - User UUID
     * @param {Object} sessionData - Session data including scenario, posture_angles, joint_forces, risk_scores, load_weight, activity_duration
     * @returns {Promise<{session: Object|null, error: Error|null}>}
     */
    async saveSession(userId, sessionData) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }

            // Check rate limit
            const rateCheck = this.checkRateLimit(userId);
            if (rateCheck.limited) {
                throw new Error(`Rate limited. Please wait ${rateCheck.remainingSeconds} seconds before saving another session.`);
            }

            // Validate session data
            const validation = this.validateSessionData(sessionData);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            const { 
                scenario, 
                posture_angles, 
                joint_forces, 
                risk_scores, 
                load_weight = 0, 
                activity_duration = 0 
            } = sessionData;

            const { data, error } = await supabase
                .from('simulation_sessions')
                .insert({
                    user_id: userId,
                    scenario,
                    posture_angles,
                    joint_forces,
                    risk_scores,
                    load_weight,
                    activity_duration
                })
                .select()
                .single();

            if (error) throw error;

            // Update rate limit tracker
            this.lastSaveTime.set(userId, Date.now());

            return { session: data, error: null };
        } catch (error) {
            console.error('SaveSession error:', error.message);
            return { session: null, error };
        }
    }

    /**
     * Get all sessions for a user
     * @param {string} userId - User UUID
     * @param {Object} options - Query options (limit, offset, orderBy)
     * @returns {Promise<{sessions: Array|null, error: Error|null}>}
     */
    async getSessions(userId, options = {}) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }

            const { limit = 50, offset = 0, orderBy = 'created_at', ascending = false } = options;

            let query = supabase
                .from('simulation_sessions')
                .select('*')
                .eq('user_id', userId)
                .order(orderBy, { ascending })
                .range(offset, offset + limit - 1);

            const { data, error } = await query;

            if (error) throw error;

            return { sessions: data, error: null };
        } catch (error) {
            console.error('GetSessions error:', error.message);
            return { sessions: null, error };
        }
    }

    /**
     * Get a single session by ID
     * @param {string} sessionId - Session UUID
     * @returns {Promise<{session: Object|null, error: Error|null}>}
     */
    async getSession(sessionId) {
        try {
            if (!sessionId) {
                throw new Error('Session ID is required');
            }

            const { data, error } = await supabase
                .from('simulation_sessions')
                .select('*')
                .eq('id', sessionId)
                .single();

            if (error) throw error;

            return { session: data, error: null };
        } catch (error) {
            console.error('GetSession error:', error.message);
            return { session: null, error };
        }
    }

    /**
     * Delete a session by ID
     * @param {string} sessionId - Session UUID
     * @returns {Promise<{success: boolean, error: Error|null}>}
     */
    async deleteSession(sessionId) {
        try {
            if (!sessionId) {
                throw new Error('Session ID is required');
            }

            const { error } = await supabase
                .from('simulation_sessions')
                .delete()
                .eq('id', sessionId);

            if (error) throw error;

            return { success: true, error: null };
        } catch (error) {
            console.error('DeleteSession error:', error.message);
            return { success: false, error };
        }
    }

    /**
     * Get sessions count for a user
     * @param {string} userId - User UUID
     * @returns {Promise<{count: number, error: Error|null}>}
     */
    async getSessionsCount(userId) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }

            const { count, error } = await supabase
                .from('simulation_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (error) throw error;

            return { count: count || 0, error: null };
        } catch (error) {
            console.error('GetSessionsCount error:', error.message);
            return { count: 0, error };
        }
    }

    /**
     * Get sessions by scenario type
     * @param {string} userId - User UUID
     * @param {string} scenario - Scenario name
     * @returns {Promise<{sessions: Array|null, error: Error|null}>}
     */
    async getSessionsByScenario(userId, scenario) {
        try {
            if (!userId || !scenario) {
                throw new Error('User ID and scenario are required');
            }

            const { data, error } = await supabase
                .from('simulation_sessions')
                .select('*')
                .eq('user_id', userId)
                .eq('scenario', scenario)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return { sessions: data, error: null };
        } catch (error) {
            console.error('GetSessionsByScenario error:', error.message);
            return { sessions: null, error };
        }
    }
}

export default SessionManager;
