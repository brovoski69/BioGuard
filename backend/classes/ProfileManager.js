// Manages user profiles - their physical stats, health conditions, etc.
import { supabase } from './SupabaseClient.js';

// These are the health conditions our physics engine knows how to account for
const VALID_HEALTH_CONDITIONS = [
    'arthritis', 'osteoporosis', 'herniated_disc', 'knee_injury',
    'hip_replacement', 'obesity', 'scoliosis', 'sciatica',
    'carpal_tunnel', 'tendonitis', 'bursitis', 'fibromyalgia', 'none'
];

class ProfileManager {
    
    // Helper to get the list of conditions we support
    static getValidHealthConditions() {
        return [...VALID_HEALTH_CONDITIONS];
    }

    // Make sure all the profile fields are sensible before saving
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

        // Check each condition is one we actually know how to handle
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

    // Create a new profile for a freshly registered user
    async createProfile(userId, profileData, email = null) {
        try {
            const validation = this.validateProfileData(profileData);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            const { name, age, weight, height, body_type, health_conditions = [] } = profileData;
            const normalizedConditions = health_conditions.map(c => c.toLowerCase());

            const { data, error } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    email: email,
                    name: name.trim(),
                    age, weight, height, body_type,
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

    // Fetch a user's profile by their ID
    async getProfile(userId) {
        try {
            if (!userId) throw new Error('User ID is required');

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

    // Update specific fields in a profile (partial update)
    async updateProfile(userId, updates) {
        try {
            if (!userId) throw new Error('User ID is required');

            // Validate each field that's being updated
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

            // Strip out undefined values and the id (shouldn't change that)
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

    // Remove a user's profile entirely
    async deleteProfile(userId) {
        try {
            if (!userId) throw new Error('User ID is required');

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

    // Quick check if a user has set up their profile yet
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
