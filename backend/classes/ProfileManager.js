/**
 * ProfileManager - Handles user profile CRUD operations
 * Manages profile creation, retrieval, and updates
 */

import { supabase } from './SupabaseClient.js';

// Valid health conditions that the system recognizes
const VALID_HEALTH_CONDITIONS = [
    'arthritis',
    'osteoporosis', 
    'herniated_disc',
    'knee_injury',
    'hip_replacement',
    'obesity',
    'scoliosis',
    'sciatica',
    'carpal_tunnel',
    'tendonitis',
    'bursitis',
    'fibromyalgia',
    'none'
];

class ProfileManager {
    /**
     * Get list of valid health conditions
     * @returns {Array<string>} Valid health conditions
     */
    static getValidHealthConditions() {
        return [...VALID_HEALTH_CONDITIONS];
    }

    /**
     * Validate profile data
     * @param {Object} profileData - Profile data to validate
     * @returns {{valid: boolean, error: string|null}}
     */
    validateProfileData(profileData) {
        const { name, age, weight, height, body_type, health_conditions } = profileData;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return { valid: false, error: 'Name is required and must be a non-empty string' };
        }

        if (!age || typeof age !== 'number' || age <= 0 || age >= 150) {
            return { valid: false, error: 'Age must be a number between 1 and 149' };
        }

        if (!weight || typeof weight !== 'number' || weight <= 0) {
            return { valid: false, error: 'Weight must be a positive number' };
        }

        if (!height || typeof height !== 'number' || height <= 0) {
            return { valid: false, error: 'Height must be a positive number' };
        }

        const validBodyTypes = ['ectomorph', 'mesomorph', 'endomorph'];
        if (!body_type || !validBodyTypes.includes(body_type)) {
            return { valid: false, error: 'Body type must be one of: ectomorph, mesomorph, endomorph' };
        }

        if (health_conditions && !Array.isArray(health_conditions)) {
            return { valid: false, error: 'Health conditions must be an array' };
        }

        // Validate health conditions against known list
        if (health_conditions && health_conditions.length > 0) {
            const invalidConditions = health_conditions.filter(
                c => !VALID_HEALTH_CONDITIONS.includes(c.toLowerCase())
            );
            if (invalidConditions.length > 0) {
                return { 
                    valid: false, 
                    error: `Invalid health conditions: ${invalidConditions.join(', ')}. Valid options: ${VALID_HEALTH_CONDITIONS.join(', ')}` 
                };
            }
        }

        return { valid: true, error: null };
    }

    /**
     * Create a new user profile
     * @param {string} userId - User UUID from auth
     * @param {Object} profileData - Profile data
     * @param {string} email - User email (optional, for search)
     * @returns {Promise<{profile: Object|null, error: Error|null}>}
     */
    async createProfile(userId, profileData, email = null) {
        try {
            // Validate profile data
            const validation = this.validateProfileData(profileData);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            const { name, age, weight, height, body_type, health_conditions = [] } = profileData;

            // Normalize health conditions to lowercase
            const normalizedConditions = health_conditions.map(c => c.toLowerCase());

            const { data, error } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    email: email,
                    name: name.trim(),
                    age,
                    weight,
                    height,
                    body_type,
                    health_conditions: normalizedConditions
                })
                .select()
                .single();

            if (error) throw error;

            return { profile: data, error: null };
        } catch (error) {
            console.error('CreateProfile error:', error.message);
            return { profile: null, error };
        }
    }

    /**
     * Get user profile by user ID
     * @param {string} userId - User UUID
     * @returns {Promise<{profile: Object|null, error: Error|null}>}
     */
    async getProfile(userId) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            return { profile: data, error: null };
        } catch (error) {
            console.error('GetProfile error:', error.message);
            return { profile: null, error };
        }
    }

    /**
     * Update user profile
     * @param {string} userId - User UUID
     * @param {Object} updates - Fields to update
     * @returns {Promise<{profile: Object|null, error: Error|null}>}
     */
    async updateProfile(userId, updates) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }

            // Validate partial updates
            if (updates.age !== undefined && (typeof updates.age !== 'number' || updates.age <= 0)) {
                throw new Error('Age must be a positive number');
            }
            if (updates.weight !== undefined && (typeof updates.weight !== 'number' || updates.weight <= 0)) {
                throw new Error('Weight must be a positive number');
            }
            if (updates.height !== undefined && (typeof updates.height !== 'number' || updates.height <= 0)) {
                throw new Error('Height must be a positive number');
            }
            if (updates.body_type !== undefined) {
                const validBodyTypes = ['ectomorph', 'mesomorph', 'endomorph'];
                if (!validBodyTypes.includes(updates.body_type)) {
                    throw new Error('Invalid body type');
                }
            }
            if (updates.health_conditions !== undefined && !Array.isArray(updates.health_conditions)) {
                throw new Error('Health conditions must be an array');
            }

            // Remove any undefined values and id field
            const cleanUpdates = Object.fromEntries(
                Object.entries(updates).filter(([key, val]) => val !== undefined && key !== 'id')
            );

            if (Object.keys(cleanUpdates).length === 0) {
                throw new Error('No valid fields to update');
            }

            const { data, error } = await supabase
                .from('profiles')
                .update(cleanUpdates)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;

            return { profile: data, error: null };
        } catch (error) {
            console.error('UpdateProfile error:', error.message);
            return { profile: null, error };
        }
    }

    /**
     * Delete user profile
     * @param {string} userId - User UUID
     * @returns {Promise<{success: boolean, error: Error|null}>}
     */
    async deleteProfile(userId) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }

            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            return { success: true, error: null };
        } catch (error) {
            console.error('DeleteProfile error:', error.message);
            return { success: false, error };
        }
    }

    /**
     * Check if profile exists for user
     * @param {string} userId - User UUID
     * @returns {Promise<boolean>}
     */
    async profileExists(userId) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', userId)
                .single();

            return !error && data !== null;
        } catch {
            return false;
        }
    }
}

export default ProfileManager;
