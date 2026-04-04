// ═══════════════════════════════════════════════════════════════════════
// BioGuard — Authentication Utilities
// Shared authentication helpers for all pages
// ═══════════════════════════════════════════════════════════════════════

import { loadFromStorage, saveToStorage, clearStorage } from './helpers.js';

// Check if user is logged in
export function isAuthenticated() {
    const user = loadFromStorage('user');
    return !!user;
}

// Get current user
export function getCurrentUser() {
    return loadFromStorage('user');
}

// Logout user
export function logout() {
    clearStorage('user');
    clearStorage('profile');
    clearStorage('lastSession');
    window.location.href = 'auth.html';
}

// Require authentication - redirect to auth page if not logged in
export function requireAuth() {
    if (!isAuthenticated()) {
        // Save intended destination
        saveToStorage('redirectAfterLogin', window.location.href);
        window.location.href = 'auth.html';
        return false;
    }
    return true;
}

// Check if profile is complete
export function hasProfile() {
    const profile = loadFromStorage('profile');
    return profile && profile.name && profile.body_type;
}

// Require profile - redirect to profile page if not complete
export function requireProfile() {
    if (!hasProfile()) {
        window.location.href = 'profile.html';
        return false;
    }
    return true;
}

// Add user info to navbar (if logged in)
export function initNavbarAuth() {
    const user = getCurrentUser();
    const navLinks = document.querySelector('.nav-links');
    
    if (user && navLinks) {
        // Check if auth button already exists
        if (navLinks.querySelector('.nav-auth')) return;
        
        // Create user dropdown
        const authItem = document.createElement('li');
        authItem.className = 'nav-auth';
        
        const userBtn = document.createElement('button');
        userBtn.className = 'nav-user-btn';
        userBtn.innerHTML = `
            <span class="nav-user-avatar">${user.name?.charAt(0) || user.email?.charAt(0) || 'U'}</span>
            <span class="nav-user-name">${user.name || user.email?.split('@')[0] || 'User'}</span>
        `;
        
        const dropdown = document.createElement('div');
        dropdown.className = 'nav-dropdown';
        dropdown.innerHTML = `
            <a href="profile.html" class="nav-dropdown-item">Profile</a>
            <a href="simulation.html" class="nav-dropdown-item">Simulation</a>
            <a href="report.html" class="nav-dropdown-item">Reports</a>
            <hr class="nav-dropdown-divider">
            <button class="nav-dropdown-item nav-logout">Logout</button>
        `;
        
        authItem.appendChild(userBtn);
        authItem.appendChild(dropdown);
        navLinks.appendChild(authItem);
        
        // Toggle dropdown
        userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('visible');
        });
        
        // Close dropdown on outside click
        document.addEventListener('click', () => {
            dropdown.classList.remove('visible');
        });
        
        // Logout handler
        dropdown.querySelector('.nav-logout').addEventListener('click', logout);
    } else if (!user && navLinks) {
        // Show login button if not authenticated
        const existingAuth = navLinks.querySelector('.nav-auth');
        if (!existingAuth) {
            const authItem = document.createElement('li');
            authItem.className = 'nav-auth';
            authItem.innerHTML = `<a href="auth.html" class="btn btn-sm btn-primary">Login</a>`;
            navLinks.appendChild(authItem);
        }
    }
}
