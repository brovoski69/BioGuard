// Handles user login, signup, logout and session management
import { supabase } from './SupabaseClient.js';
import ProfileManager from './ProfileManager.js';

class AuthManager {
    constructor() {
        this.profileManager = new ProfileManager();
    }

    // Register a new user - also creates their profile in the database
    async signUp(email, password, profileData) {
        try {
            if (!email || !password) {
                throw new Error('Email and password are required');
            }
            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { name: profileData.name }
                }
            });

            if (error) throw error;

            // Once auth succeeds, set up their profile with all their details
            if (data.user) {
                const profileResult = await this.profileManager.createProfile(
                    data.user.id, 
                    profileData,
                    email
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

    // Regular email/password login
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

    // Google OAuth login - redirects to Google then back to our app
    async signInWithGoogle(redirectUrl = null) {
        try {
            const callbackUrl = redirectUrl || 
                (typeof process !== 'undefined' && process.env?.AUTH_REDIRECT_URL) ||
                (typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : null);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: callbackUrl }
            });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Google SignIn error:', error.message);
            return { error };
        }
    }

    // Clear the session and log user out
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

    // Check who's currently logged in
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

    // Get current login session (includes tokens, expiry, etc)
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

    // Listen for login/logout events - useful for updating UI
    onAuthStateChange(callback) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
        return subscription;
    }

    // Send "forgot password" email with reset link
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

    // Change password for logged-in user
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
