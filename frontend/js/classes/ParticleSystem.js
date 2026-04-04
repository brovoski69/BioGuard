// ═══════════════════════════════════════════════════════════════
// BioGuard — Particle System
// Canvas-based floating particles for atmosphere
// ═══════════════════════════════════════════════════════════════

export default class ParticleSystem {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.particles = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.animId = null;
        this.running = false;

        this._resizeHandler = () => this._resize();
        window.addEventListener('resize', this._resizeHandler);
        this._resize();
    }

    _resize() {
        this.width = this.canvas.width = this.canvas.offsetWidth || window.innerWidth;
        this.height = this.canvas.height = this.canvas.offsetHeight || window.innerHeight;
    }

    addParticles(count = 60) {
        for (let i = 0; i < count; i++) {
            this.particles.push(this._createParticle());
        }
    }

    _createParticle() {
        const types = ['dot', 'ring', 'cross', 'hex'];
        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -Math.random() * 0.4 - 0.1,  // Drift upward
            size: Math.random() * 3 + 1,
            opacity: Math.random() * 0.4 + 0.1,
            type: types[Math.floor(Math.random() * types.length)],
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.01,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: Math.random() * 0.02 + 0.005
        };
    }

    respondToMouse(x, y) {
        this.mouseX = x;
        this.mouseY = y;
    }

    start() {
        if (this.running) return;
        this.running = true;
        this._animate();
    }

    stop() {
        this.running = false;
        if (this.animId) {
            cancelAnimationFrame(this.animId);
            this.animId = null;
        }
    }

    _animate() {
        if (!this.running) return;
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.particles.forEach(p => {
            // Mouse parallax
            const dx = (this.mouseX - this.width / 2) * 0.00005 * p.size;
            const dy = (this.mouseY - this.height / 2) * 0.00005 * p.size;

            p.x += p.vx + dx;
            p.y += p.vy + dy;
            p.rotation += p.rotationSpeed;
            p.pulse += p.pulseSpeed;

            // Wrap around
            if (p.y < -10) { p.y = this.height + 10; p.x = Math.random() * this.width; }
            if (p.x < -10) p.x = this.width + 10;
            if (p.x > this.width + 10) p.x = -10;

            const opacity = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse));
            this._drawParticle(p, opacity);
        });

        // Draw connection lines between nearby particles
        this._drawConnections();

        this.animId = requestAnimationFrame(() => this._animate());
    }

    _drawParticle(p, opacity) {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation);
        this.ctx.globalAlpha = opacity;

        switch (p.type) {
            case 'dot':
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                this.ctx.fillStyle = '#00f5ff';
                this.ctx.fill();
                // Glow
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#00f5ff';
                this.ctx.fill();
                break;

            case 'ring':
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.size * 1.5, 0, Math.PI * 2);
                this.ctx.strokeStyle = '#00f5ff';
                this.ctx.lineWidth = 0.5;
                this.ctx.stroke();
                break;

            case 'cross':
                this.ctx.strokeStyle = '#e8e0d0';
                this.ctx.lineWidth = 0.6;
                const s = p.size;
                this.ctx.beginPath();
                this.ctx.moveTo(-s, 0); this.ctx.lineTo(s, 0);
                this.ctx.moveTo(0, -s); this.ctx.lineTo(0, s);
                this.ctx.stroke();
                break;

            case 'hex':
                this.ctx.strokeStyle = '#0066ff';
                this.ctx.lineWidth = 0.5;
                this.ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    const hx = Math.cos(angle) * p.size * 1.5;
                    const hy = Math.sin(angle) * p.size * 1.5;
                    if (i === 0) this.ctx.moveTo(hx, hy);
                    else this.ctx.lineTo(hx, hy);
                }
                this.ctx.closePath();
                this.ctx.stroke();
                break;
        }
        this.ctx.restore();
    }

    _drawConnections() {
        const maxDist = 100;
        this.ctx.strokeStyle = 'rgba(0, 245, 255, 0.04)';
        this.ctx.lineWidth = 0.5;

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < maxDist) {
                    this.ctx.globalAlpha = (1 - dist / maxDist) * 0.15;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
        this.ctx.globalAlpha = 1;
    }

    destroy() {
        this.stop();
        window.removeEventListener('resize', this._resizeHandler);
        this.particles = [];
        this.ctx = null;
    }
}
