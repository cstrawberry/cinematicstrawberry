(() => {
    'use strict';

    const canvas = document.getElementById('homeParticles');

    if (!canvas) {
        return;
    }

    const context = canvas.getContext('2d');
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const frameInterval = 1000 / 48;
    let reducedMotion = mediaQuery.matches;
    let stars = [];
    let width = 0;
    let height = 0;
    let time = 0;
    let visible = true;
    let started = false;
    let rafId = null;
    let lastFrame = 0;
    let readyDispatched = false;

    const notifyReady = () => {
        if (readyDispatched) {
            return;
        }

        readyDispatched = true;
        document.dispatchEvent(new CustomEvent("home-particles-ready"));
    };

    const randomStar = () => ({
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z: Math.random() * 3 + 0.55,
        speed: Math.random() * 0.009 + 0.004,
        size: Math.random() * 1.15 + 0.35,
        twinkle: Math.random() * Math.PI * 2,
        red: Math.random() < 0.35,
    });

    const resetStar = (star) => {
        Object.assign(star, randomStar(), { z: 3 + Math.random() });
    };

    const resize = () => {
        const parent = canvas.parentElement;
        const rect = parent.getBoundingClientRect();
        const nextWidth = Math.max(1, Math.round(rect.width));
        const nextHeight = Math.max(1, Math.round(rect.height));

        if (nextWidth === width && nextHeight === height && stars.length) {
            return;
        }

        width = nextWidth;
        height = nextHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        const starCount = Math.min(320, Math.max(180, Math.round((width * height) / 5200)));
        stars = Array.from({ length: starCount }, randomStar);
    };

    const renderFrame = () => {
        context.clearRect(0, 0, width, height);
        time += reducedMotion ? 0 : 0.016;

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.max(width, height) * 0.56;

        for (const star of stars) {
            if (!reducedMotion) {
                star.z -= star.speed;
            }

            if (star.z <= 0.12) {
                resetStar(star);
            }

            const x = (star.x / star.z) * radius * 0.8 + centerX;
            const y = (star.y / star.z) * radius * 0.8 + centerY;

            if (x < -24 || x > width + 24 || y < -24 || y > height + 24) {
                if (!reducedMotion) {
                    resetStar(star);
                }
                continue;
            }

            const depth = Math.max(0, Math.min(1, 1 - star.z / 3.5));
            const size = star.size * (0.34 + depth * 1.45);
            const twinkle = 0.5 + 0.5 * Math.sin(time * 2 + star.twinkle);
            const alpha = Math.min(0.98, (0.32 + depth * 0.72) * (0.76 + twinkle * 0.24));
            const color = star.red ? '214,24,24' : '18,18,18';

            if (depth > 0.52) {
                context.beginPath();
                context.arc(x, y, size * 2.3, 0, Math.PI * 2);
                context.fillStyle = `rgba(${color},${alpha * 0.14})`;
                context.fill();
            }

            context.beginPath();
            context.arc(x, y, size, 0, Math.PI * 2);
            context.fillStyle = `rgba(${color},${alpha})`;
            context.fill();
        }
    };

    const draw = (timestamp) => {
        if (!reducedMotion && lastFrame && timestamp - lastFrame < frameInterval) {
            rafId = window.requestAnimationFrame(draw);
            return;
        }

        lastFrame = timestamp || performance.now();
        renderFrame();

        if (!reducedMotion && visible && started) {
            rafId = window.requestAnimationFrame(draw);
        } else {
            rafId = null;
        }
    };

    const start = () => {
        started = true;
        if (!rafId && visible && !document.hidden) {
            rafId = window.requestAnimationFrame(draw);
        }
    };

    const stop = () => {
        if (rafId) {
            window.cancelAnimationFrame(rafId);
            rafId = null;
        }
        lastFrame = 0;
    };

    const handleResize = () => {
        resize();
        if (reducedMotion) {
            renderFrame();
        } else if (started) {
            start();
        }
    };

    const boot = () => {
        resize();

        if (reducedMotion) {
            renderFrame();
            notifyReady();
            return;
        }

        renderFrame();
        notifyReady();

        if (!document.hidden) {
            start();
        }
    };

    if ('ResizeObserver' in window) {
        new ResizeObserver(handleResize).observe(canvas.parentElement);
    }

    window.addEventListener('resize', handleResize);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stop();
        } else if (visible && started) {
            start();
        }
    });

    const handleMotionChange = (event) => {
        reducedMotion = event.matches;
        if (reducedMotion) {
            stop();
            renderFrame();
        } else if (started) {
            start();
        }
    };

    try {
        mediaQuery.addEventListener('change', handleMotionChange);
    } catch (error) {
        mediaQuery.addListener(handleMotionChange);
    }

    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            visible = entries[0].isIntersecting;
            if (visible && !document.hidden && started) {
                start();
            } else {
                stop();
            }
        }, { threshold: 0.02 }).observe(canvas);
    }

    if (document.readyState === 'complete') {
        boot();
    } else {
        boot();
    }
})();
