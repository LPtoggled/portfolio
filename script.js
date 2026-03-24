document.addEventListener("DOMContentLoaded", function() {

    // 1. SCROLL ANIMATIONS — with direction-aware enter animation
    // REPLACE from "let lastScrollY..." down to the lastScrollY scroll listener

    let scrollDirection = 'down';
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        scrollDirection = window.scrollY > lastScrollY ? 'down' : 'up';
        lastScrollY = window.scrollY;
    }, { passive: true });

    // REPLACE from "let scrollDirection..." down to the forEach observe line

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.remove('from-above');
                entry.target.classList.add('visible');
            } else {
                entry.target.classList.remove('visible');
                // Use the element's position relative to viewport to determine direction
                // If element is ABOVE the viewport center, it exited upward → next enter is from above
                const rect = entry.boundingClientRect;
                if (rect.top < 0) {
                    // Element is above viewport — scrolling back down will bring it in from above
                    entry.target.classList.add('from-above');
                } else {
                    // Element is below viewport — normal scroll down entrance
                    entry.target.classList.remove('from-above');
                }
            }
        });
    }, { threshold: 0 });

    document.querySelectorAll('.fade-in, .slide-in-left').forEach(el => observer.observe(el));
    window.addEventListener('scroll', () => { lastScrollY = window.scrollY; }, { passive: true });

    // 2. NAVBAR + PARALLAX
    const nav = document.querySelector('nav');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        // Dot parallax
        document.documentElement.style.backgroundPositionY = `${scrollY * 0.3}px`;

        // Progressive navbar darkening
        const progress = Math.min(scrollY / 300, 1);
        const bgOpacity = (0.4 + progress * 0.5).toFixed(3);
        const padV = (1.2 - progress * 0.4).toFixed(3);

        nav.style.background = `rgba(10, 10, 10, ${bgOpacity})`;
        nav.style.padding = `${padV}rem 5%`;

        // Border fades in after 30% scroll — always rgba so no white flash
        if (progress > 0.3) {
            const borderOpacity = ((progress - 0.3) * 0.5).toFixed(3);
            nav.style.borderBottom = `1px solid rgba(174, 150, 212, ${borderOpacity})`;
        } else {
            nav.style.borderBottom = `1px solid rgba(174, 150, 212, 0)`;
        }

        // Hero content fade on scroll
        const heroHeight = document.querySelector('.hero').offsetHeight;
        const heroProgress = Math.min(scrollY / (heroHeight * 0.5), 1);
        const heroContent = document.querySelector('.hero-content');
        heroContent.style.opacity = 1 - heroProgress;
        heroContent.style.transform = `translateY(${heroProgress * -40}px)`;
    }, { passive: true });

    // 3. PARTICLES
    const canvas = document.getElementById('hero-canvas');
    const ctx = canvas.getContext('2d');
    const heroSection = document.querySelector('.hero');
    let particlesArray;
    let mouse = { x: undefined, y: undefined, radius: 180 };

    heroSection.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
        mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
    });
    heroSection.addEventListener('mouseleave', () => {
        mouse.x = undefined;
        mouse.y = undefined;
    });

    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        if (particlesArray) initParticles();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
        constructor(x, y, dx, dy, size, color) {
            this.x = x; this.y = y;
            this.directionX = dx; this.directionY = dy;
            this.size = size; this.color = color;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        update() {
            if (this.x > canvas.width || this.x < 0) this.directionX *= -1;
            if (this.y > canvas.height || this.y < 0) this.directionY *= -1;
            this.x += this.directionX;
            this.y += this.directionY;
            this.draw();
        }
    }

    function initParticles() {
        particlesArray = [];
        const count = (canvas.width * canvas.height) / 9000;
        for (let i = 0; i < count; i++) {
            const size = Math.random() * 2 + 1;
            particlesArray.push(new Particle(
                Math.random() * (canvas.width - size * 4) + size * 2,
                Math.random() * (canvas.height - size * 4) + size * 2,
                Math.random() * 0.5 - 0.25,
                Math.random() * 0.5 - 0.25,
                size,
                `rgba(174, 150, 212, ${Math.random() * 0.65 + 0.15})`
            ));
        }
    }

    function connectParticles() {
        const threshold = (canvas.width / 7) * (canvas.height / 7);
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a + 1; b < particlesArray.length; b++) {
                const dx = particlesArray[a].x - particlesArray[b].x;
                const dy = particlesArray[a].y - particlesArray[b].y;
                const dist = dx * dx + dy * dy;
                if (dist < threshold) {
                    ctx.strokeStyle = `rgba(174, 150, 212, ${0.6 - dist / 40000})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
            if (mouse.x !== undefined) {
                const dx = mouse.x - particlesArray[a].x;
                const dy = mouse.y - particlesArray[a].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouse.radius) {
                    ctx.strokeStyle = `rgba(174, 150, 212, ${0.8 - dist / mouse.radius})`;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particlesArray.forEach(p => p.update());
        connectParticles();
    }

    initParticles();
    animate();
});

// 4. MODALS
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "block";
        setTimeout(() => modal.classList.add('show'), 10);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = "none", 300);
    }
}

window.onclick = (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
        setTimeout(() => e.target.style.display = "none", 300);
    }
};