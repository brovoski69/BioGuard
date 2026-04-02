/**
 * AuthManager - Handles all authentication operations
 * Manages user sign up, sign in, sign out, and auth state
 */

import { supabase } from './SupabaseClient.js';
import ProfileManager from './ProfileManager.js';

class AuthManager {
    constructor() {
        this.profileManager = new ProfileManager();
    }

    /**
     * Sign up a new user with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {Object} profileData - User profile data (name, age, weight, height, body_type, health_conditions)
     * @returns {Promise<{user: Object|null, error: Error|null}>}
     */
    async signUp(email, password, profileData) {
        try {
            // Validate inputs
            if (!email || !password) {
                throw new Error('Email and password are required');
            }
            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }

            // Sign up with Supabase Auth
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: profileData.name
                    }
                }
            });

            if (error) throw error;

            // Create user profile after successful signup
            if (data.user) {
                const profileResult = await this.profileManager.createProfile(
                    data.user.id, 
                    profileData,
                    email  // Pass email for profile storage
                );
                if (profileResult.error) {
                    console.error('Profile creation error:', profileResult.error);
                }
            }

            return { user: data.user, error: null };
        } catch (error) {
            console.error('SignUp error:', error.message);
            return { user: null, error };
        }
    }

    /**
     * Sign in with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<{user: Object|null, session: Object|null, error: Error|null}>}
     */
    async signIn(email, password) {
        try {
            if (!email || !password) {
                throw new Error('Email and password are required');
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            return { user: data.user, session: data.session, error: null };
        } catch (error) {
            console.error('SignIn error:', error.message);
            return { user: null, session: null, error };
        }
    }

    /**
     * Sign in with Google OAuth
     * @param {string} redirectUrl - Optional custom redirect URL
     * @returns {Promise<{error: Error|null}>}
     */
    async signInWithGoogle(redirectUrl = null) {
        try {
            // Use provided URL, or try to get from environment, or fallback to window.location
            const callbackUrl = redirectUrl || 
                (typeof process !== 'undefined' && process.env?.AUTH_REDIRECT_URL) ||
                (typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : null);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: callbackUrl
                }
            });

            if (error) throw error;

            return { data, error: null };
        } catch (error) {
            console.error('Google SignIn error:', error.message);
            return { error };
        }
    }

    /**
     * Sign out the current user
     * @returns {Promise<{error: Error|null}>}
     */
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('SignOut error:', error.message);
            return { error };
        }
    }

    /**
     * Get the currently authenticated user
     * @returns {Promise<{user: Object|null, error: Error|null}>}
     */
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            return { user, error: null };
        } catch (error) {
            console.error('GetCurrentUser error:', error.message);
            return { user: null, error };
        }
    }

    /**
     * Get the current session
     * @returns {Promise<{session: Object|null, error: Error|null}>}
     */
    async getSession() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            return { session, error: null };
        } catch (error) {
            console.error('GetSession error:', error.message);
            return { session: null, error };
        }
    }

    /**
     * Subscribe to auth state changes
     * @param {Function} callback - Callback function (event, session) => void
     * @returns {Object} Subscription object with unsubscribe method
     */
    onAuthStateChange(callback) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
        return subscription;
    }

    /**
     * Send password reset email
     * @param {string} email - User email
     * @param {string} redirectUrl - Optional custom redirect URL
     * @returns {Promise<{error: Error|null}>}
     */
    async resetPassword(email, redirectUrl = null) {
        try {
            if (!email) {
                throw new Error('Email is required');
            }

            const callbackUrl = redirectUrl ||
                (typeof process !== 'undefined' && process.env?.AUTH_REDIRECT_URL) ||
                (typeof window !== 'undefined' ? window.location.origin + '/reset-password' : null);

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: callbackUrl
            });

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('ResetPassword error:', error.message);
            return { error };
        }
    }

    /**
     * Update user password
     * @param {string} newPassword - New password
     * @returns {Promise<{error: Error|null}>}
     */
    async updatePassword(newPassword) {
        try {
            if (!newPassword || newPassword.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }

            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('UpdatePassword error:', error.message);
            return { error };
        }
    }
}

export default AuthManager;
