// ═══════════════════════════════════════════════════════════════════════
// BioGuard — Auth Page Controller
// Handles login, signup, and OAuth with Supabase
// ═══════════════════════════════════════════════════════════════════════

import { saveToStorage, loadFromStorage } from '../utils/helpers.js';

// Supabase configuration - will be loaded from environment or config
const SUPABASE_URL = window.BIOGUARD_CONFIG?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.BIOGUARD_CONFIG?.SUPABASE_ANON_KEY || '';

// Initialize Supabase client if credentials exist
let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

document.addEventListener('DOMContentLoaded', () => {
    // ── Element References ───────────────────────────────────
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const tabs = document.querySelectorAll('.auth-tab');
    
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    
    const signupName = document.getElementById('signupName');
    const signupEmail = document.getElementById('signupEmail');
    const signupPassword = document.getElementById('signupPassword');
    const signupConfirm = document.getElementById('signupConfirm');
    const signupBtn = document.getElementById('signupBtn');
    const signupError = document.getElementById('signupError');
    
    const googleBtn = document.getElementById('googleBtn');
    const githubBtn = document.getElementById('githubBtn');
    
    // ── Tab Switching ────────────────────────────────────────
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            if (targetTab === 'login') {
                loginForm.classList.remove('hidden');
                signupForm.classList.add('hidden');
            } else {
                loginForm.classList.add('hidden');
                signupForm.classList.remove('hidden');
            }
            
            // Clear errors
            hideError(loginError);
            hideError(signupError);
        });
    });
    
    // ── Password Strength Indicator ──────────────────────────
    signupPassword?.addEventListener('input', () => {
        const password = signupPassword.value;
        const strengthBar = document.querySelector('.strength-bar');
        const strengthText = document.querySelector('.strength-text');
        
        if (!strengthBar || !strengthText) return;
        
        strengthBar.classList.remove('weak', 'medium', 'strong');
        
        if (password.length === 0) {
            strengthText.textContent = 'Password strength';
            return;
        }
        
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        if (strength <= 1) {
            strengthBar.classList.add('weak');
            strengthText.textContent = 'Weak';
        } else if (strength <= 2) {
            strengthBar.classList.add('medium');
            strengthText.textContent = 'Medium';
        } else {
            strengthBar.classList.add('strong');
            strengthText.textContent = 'Strong';
        }
    });
    
    // ── Login Handler ────────────────────────────────────────
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = loginEmail.value.trim();
        const password = loginPassword.value;
        
        if (!email || !password) {
            showError(loginError, 'Please fill in all fields');
            return;
        }
        
        setLoading(loginBtn, true);
        hideError(loginError);
        
        try {
            if (supabase) {
                // Real Supabase authentication
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                
                if (error) throw error;
                
                // Save user session
                saveToStorage('user', {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.user_metadata?.name || email.split('@')[0]
                });
                
                // Redirect to profile or simulation
                const hasProfile = loadFromStorage('profile');
                window.location.href = hasProfile ? 'simulation.html' : 'profile.html';
            } else {
                // Demo mode - no Supabase
                await simulateDelay(800);
                
                saveToStorage('user', {
                    id: 'demo-user-' + Date.now(),
                    email: email,
                    name: email.split('@')[0]
                });
                
                const hasProfile = loadFromStorage('profile');
                window.location.href = hasProfile ? 'simulation.html' : 'profile.html';
            }
        } catch (error) {
            console.error('Login error:', error);
            showError(loginError, error.message || 'Invalid email or password');
        } finally {
            setLoading(loginBtn, false);
        }
    });
    
    // ── Signup Handler ───────────────────────────────────────
    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = signupName.value.trim();
        const email = signupEmail.value.trim();
        const password = signupPassword.value;
        const confirm = signupConfirm.value;
        const agreeTerms = document.getElementById('agreeTerms')?.checked;
        
        // Validation
        if (!name || !email || !password || !confirm) {
            showError(signupError, 'Please fill in all fields');
            return;
        }
        
        if (password !== confirm) {
            showError(signupError, 'Passwords do not match');
            return;
        }
        
        if (password.length < 8) {
            showError(signupError, 'Password must be at least 8 characters');
            return;
        }
        
        if (!agreeTerms) {
            showError(signupError, 'Please agree to the Terms of Service');
            return;
        }
        
        setLoading(signupBtn, true);
        hideError(signupError);
        
        try {
            if (supabase) {
                // Real Supabase signup
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { name }
                    }
                });
                
                if (error) throw error;
                
                // Save user
                saveToStorage('user', {
                    id: data.user.id,
                    email: data.user.email,
                    name: name
                });
                
                // Redirect to profile setup
                window.location.href = 'profile.html';
            } else {
                // Demo mode
                await simulateDelay(800);
                
                saveToStorage('user', {
                    id: 'demo-user-' + Date.now(),
                    email: email,
                    name: name
                });
                
                window.location.href = 'profile.html';
            }
        } catch (error) {
            console.error('Signup error:', error);
            showError(signupError, error.message || 'Failed to create account');
        } finally {
            setLoading(signupBtn, false);
        }
    });
    
    // ── OAuth Handlers ───────────────────────────────────────
    googleBtn?.addEventListener('click', async () => {
        if (supabase) {
            try {
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin + '/frontend/profile.html'
                    }
                });
                if (error) throw error;
            } catch (error) {
                showError(loginError, 'Google sign-in failed');
            }
        } else {
            showError(loginError, 'OAuth not available in demo mode. Use email/password.');
        }
    });
    
    githubBtn?.addEventListener('click', async () => {
        if (supabase) {
            try {
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'github',
                    options: {
                        redirectTo: window.location.origin + '/frontend/profile.html'
                    }
                });
                if (error) throw error;
            } catch (error) {
                showError(loginError, 'GitHub sign-in failed');
            }
        } else {
            showError(loginError, 'OAuth not available in demo mode. Use email/password.');
        }
    });
    
    // ── Helper Functions ─────────────────────────────────────
    function showError(element, message) {
        if (element) {
            element.textContent = message;
            element.classList.add('visible');
        }
    }
    
    function hideError(element) {
        if (element) {
            element.classList.remove('visible');
        }
    }
    
    function setLoading(button, loading) {
        if (button) {
            button.classList.toggle('loading', loading);
            button.disabled = loading;
        }
    }
    
    function simulateDelay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // ── Check Existing Session ───────────────────────────────
    async function checkSession() {
        const user = loadFromStorage('user');
        if (user) {
            // Already logged in, redirect
            const hasProfile = loadFromStorage('profile');
            window.location.href = hasProfile ? 'simulation.html' : 'profile.html';
        }
        
        if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                saveToStorage('user', {
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.name || session.user.email.split('@')[0]
                });
                const hasProfile = loadFromStorage('profile');
                window.location.href = hasProfile ? 'simulation.html' : 'profile.html';
            }
        }
    }
    
    // Check session on load
    checkSession();
});
