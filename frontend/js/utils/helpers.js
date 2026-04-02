// ═══════════════════════════════════════════════════════════════
// BioGuard — Helper Utilities
// ═══════════════════════════════════════════════════════════════

import { RISK_LEVELS } from './constants.js';

// ── Math Helpers ─────────────────────────────────────────────
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function mapRange(value, inMin, inMax, outMin, outMax) {
    return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

export function degToRad(deg) {
    return deg * (Math.PI / 180);
}

export function radToDeg(rad) {
    return rad * (180 / Math.PI);
}

// ── Timing Helpers ───────────────────────────────────────────
export function debounce(fn, delay = 16) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

export function throttle(fn, limit = 16) {
    let lastCall = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastCall >= limit) {
            lastCall = now;
            fn(...args);
        }
    };
}

// ── Risk Level Helpers ───────────────────────────────────────
export function getRiskLevel(score) {
    score = clamp(score, 0, 100);
    if (score >= 80) return RISK_LEVELS.CRITICAL;
    if (score >= 60) return RISK_LEVELS.HIGH;
    if (score >= 40) return RISK_LEVELS.MODERATE;
    if (score >= 20) return RISK_LEVELS.LOW;
    return RISK_LEVELS.MINIMAL;
}

export function getRiskColor(score) {
    return getRiskLevel(score).color;
}

// ── Formatting Helpers ───────────────────────────────────────
export function formatForce(newtons) {
    if (newtons >= 1000) {
        return (newtons / 1000).toFixed(1) + ' kN';
    }
    return Math.round(newtons) + ' N';
}

export function formatRisk(score) {
    return Math.round(clamp(score, 0, 100));
}

export function formatDuration(minutes) {
    if (minutes < 60) return `${minutes}min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export function calculateBMI(weightKg, heightCm) {
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
}

export function getBMICategory(bmi) {
    if (bmi < 18.5) return { label: 'Underweight', color: '#ffd700' };
    if (bmi < 25) return { label: 'Normal', color: '#00ff88' };
    if (bmi < 30) return { label: 'Overweight', color: '#ffd700' };
    return { label: 'Obese', color: '#ff3b3b' };
}

// ── LocalStorage Helpers ─────────────────────────────────────
const STORAGE_PREFIX = 'bioguard_';

export function saveToStorage(key, data) {
    try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.warn('Storage save failed:', e);
        return false;
    }
}

export function loadFromStorage(key) {
    try {
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.warn('Storage load failed:', e);
        return null;
    }
}

export function clearStorage(key) {
    localStorage.removeItem(STORAGE_PREFIX + key);
}

// ── DOM Helpers ──────────────────────────────────────────────
export function $(selector, parent = document) {
    return parent.querySelector(selector);
}

export function $$(selector, parent = document) {
    return [...parent.querySelectorAll(selector)];
}

export function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, val]) => {
        if (key === 'className') el.className = val;
        else if (key === 'innerHTML') el.innerHTML = val;
        else if (key === 'textContent') el.textContent = val;
        else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), val);
        else el.setAttribute(key, val);
    });
    children.forEach(child => {
        if (typeof child === 'string') el.appendChild(document.createTextNode(child));
        else if (child) el.appendChild(child);
    });
    return el;
}

// ── Animation Helpers ────────────────────────────────────────
export function animateValue(element, start, end, duration = 1000, suffix = '') {
    const startTime = performance.now();
    const diff = end - start;

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + diff * eased;
        element.textContent = Math.round(current) + suffix;
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// ── Generates a unique ID ────────────────────────────────────
export function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
