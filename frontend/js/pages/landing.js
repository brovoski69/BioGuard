// ═══════════════════════════════════════════════════════════════
// BioGuard — Landing Page Controller
// ═══════════════════════════════════════════════════════════════

import ParticleSystem from '../classes/ParticleSystem.js';
import AnimationManager from '../classes/AnimationManager.js';
import { initNavbarAuth, isAuthenticated, hasProfile } from '../utils/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // ── Initialize navbar auth ───────────────────────────────
    initNavbarAuth();
    
    const anim = new AnimationManager();
    
    // ── Update CTA buttons based on auth state ───────────────
    const startBtn = document.getElementById('btnStartSim');
    const navGetStarted = document.querySelector('.nav-links .btn-primary');
    
    if (isAuthenticated()) {
        // If logged in, go directly to profile or simulation
        const targetPage = hasProfile() ? 'simulation.html' : 'profile.html';
        if (startBtn) startBtn.href = targetPage;
        if (navGetStarted && !navGetStarted.closest('.nav-auth')) {
            navGetStarted.href = targetPage;
            navGetStarted.textContent = hasProfile() ? 'Open Simulation' : 'Complete Profile';
        }
    } else {
        // If not logged in, go to auth page
        if (startBtn) startBtn.href = 'auth.html';
        if (navGetStarted && !navGetStarted.closest('.nav-auth')) {
            navGetStarted.href = 'auth.html';
        }
    }

    // ── Particle System ──────────────────────────────────────
    const canvas = document.getElementById('particleCanvas');
    if (canvas) {
        const particles = new ParticleSystem(canvas);
        const isMobile = window.innerWidth < 768;
        particles.addParticles(isMobile ? 30 : 70);
        particles.start();

        // Mouse parallax
        document.addEventListener('mousemove', (e) => {
            particles.respondToMouse(e.clientX, e.clientY);
        });
    }

    // ── Sticky Navbar ────────────────────────────────────────
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    // ── Mobile Nav Toggle ────────────────────────────────────
    const hamburger = document.getElementById('navHamburger');
    const navLinks = document.getElementById('navLinks');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }

    // ── Scroll-triggered Feature Cards Animation ─────────────
    const featuresGrid = document.getElementById('featuresGrid');
    if (featuresGrid) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    anim.staggerIn(featuresGrid, '.feature-card', 100, 'up');
                    observer.disconnect();
                }
            });
        }, { threshold: 0.2 });
        observer.observe(featuresGrid);
    }

    // ── Smooth Scroll for Anchor Links ───────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Close mobile nav if open
                navLinks?.classList.remove('open');
            }
        });
    });

    // ── Animate How-It-Works Steps ───────────────────────────
    const howSection = document.querySelector('.how-steps');
    if (howSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    anim.staggerIn(howSection, '.how-step', 150, 'up');
                    observer.disconnect();
                }
            });
        }, { threshold: 0.2 });
        observer.observe(howSection);
    }
});
