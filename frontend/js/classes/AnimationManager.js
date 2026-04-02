// ═══════════════════════════════════════════════════════════════
// BioGuard — Animation Manager
// Coordinates all UI animations at 60fps
// ═══════════════════════════════════════════════════════════════

export default class AnimationManager {
    constructor() {
        this.runningAnimations = new Map();
    }

    // ── Count Up Animation ───────────────────────────────────
    countUp(element, target, duration = 1000, suffix = '') {
        const startVal = parseFloat(element.textContent) || 0;
        const diff = target - startVal;
        const startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = Math.round(startVal + diff * eased) + suffix;
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    // ── Slide In ─────────────────────────────────────────────
    slideIn(element, direction = 'right', duration = 400) {
        const translations = {
            right: ['40px, 0', '0, 0'],
            left: ['-40px, 0', '0, 0'],
            up: ['0, -30px', '0, 0'],
            down: ['0, 30px', '0, 0']
        };
        const [from, to] = translations[direction] || translations.right;

        element.style.opacity = '0';
        element.style.transform = `translate(${from})`;
        element.style.transition = `opacity ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1), transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;

        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = `translate(${to})`;
        });
    }

    // ── Pulse Effect ─────────────────────────────────────────
    pulse(element, scale = 1.05, duration = 300) {
        element.style.transition = `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
        element.style.transform = `scale(${scale})`;
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, duration);
    }

    // ── Page Transition ──────────────────────────────────────
    pageTransition(fromEl, toEl, duration = 300) {
        return new Promise(resolve => {
            // Fade out current
            fromEl.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;
            fromEl.style.opacity = '0';
            fromEl.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                fromEl.style.display = 'none';
                toEl.style.display = '';
                toEl.style.opacity = '0';
                toEl.style.transform = 'translateY(10px)';
                toEl.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;

                requestAnimationFrame(() => {
                    toEl.style.opacity = '1';
                    toEl.style.transform = 'translateY(0)';
                    setTimeout(resolve, duration);
                });
            }, duration);
        });
    }

    // ── Radial Gauge Animate ─────────────────────────────────
    gaugeAnimate(svgCircle, value, maxValue = 100) {
        const radius = parseFloat(svgCircle.getAttribute('r'));
        const circumference = 2 * Math.PI * radius;
        const progress = value / maxValue;
        const offset = circumference * (1 - progress);

        svgCircle.style.strokeDasharray = `${circumference}`;
        svgCircle.style.strokeDashoffset = `${offset}`;
    }

    // ── Staggered Children Animation ─────────────────────────
    staggerIn(parent, childSelector = ':scope > *', delay = 80, direction = 'up') {
        const children = parent.querySelectorAll(childSelector);
        children.forEach((child, i) => {
            child.style.opacity = '0';
            const ty = direction === 'up' ? '20px' : direction === 'down' ? '-20px' : '0';
            const tx = direction === 'left' ? '20px' : direction === 'right' ? '-20px' : '0';
            child.style.transform = `translate(${tx}, ${ty})`;

            setTimeout(() => {
                child.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                child.style.opacity = '1';
                child.style.transform = 'translate(0, 0)';
            }, i * delay);
        });
    }

    // ── Glow Burst ───────────────────────────────────────────
    glowBurst(element, color = 'rgba(0,245,255,0.6)', duration = 500) {
        const original = element.style.boxShadow;
        element.style.transition = `box-shadow ${duration}ms ease-out`;
        element.style.boxShadow = `0 0 40px ${color}, 0 0 80px ${color}`;
        setTimeout(() => {
            element.style.boxShadow = original;
        }, duration);
    }

    // ── Shake Animation ──────────────────────────────────────
    shake(element, intensity = 4, duration = 400) {
        const startTime = performance.now();
        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = elapsed / duration;
            if (progress >= 1) {
                element.style.transform = '';
                return;
            }
            const decay = 1 - progress;
            const x = (Math.random() - 0.5) * intensity * 2 * decay;
            const y = (Math.random() - 0.5) * intensity * decay;
            element.style.transform = `translate(${x}px, ${y}px)`;
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    // ── Typewriter Effect ────────────────────────────────────
    typewriter(element, text, speed = 50) {
        return new Promise(resolve => {
            element.textContent = '';
            let i = 0;
            const type = () => {
                if (i < text.length) {
                    element.textContent += text[i];
                    i++;
                    setTimeout(type, speed);
                } else {
                    resolve();
                }
            };
            type();
        });
    }

    // ── Number Flip ──────────────────────────────────────────
    numberFlip(element, newValue, duration = 600) {
        element.style.transition = `transform ${duration / 2}ms ease-in, opacity ${duration / 2}ms ease-in`;
        element.style.transform = 'scaleY(0)';
        element.style.opacity = '0';

        setTimeout(() => {
            element.textContent = newValue;
            element.style.transition = `transform ${duration / 2}ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity ${duration / 2}ms ease-out`;
            element.style.transform = 'scaleY(1)';
            element.style.opacity = '1';
        }, duration / 2);
    }
}
