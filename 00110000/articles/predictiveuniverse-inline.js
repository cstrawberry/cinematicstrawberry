(() => {
    const runWhenNear = (selector, callback) => {
        const targets = Array.from(document.querySelectorAll(selector));
        if (!targets.length) {
            return;
        }

        let didRun = false;
        const run = () => {
            if (didRun) {
                return;
            }
            didRun = true;
            callback();
        };

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                if (entries.some((entry) => entry.isIntersecting || entry.intersectionRatio > 0)) {
                    observer.disconnect();
                    run();
                }
            }, { rootMargin: '900px 0px' });

            targets.forEach((target) => observer.observe(target));
            window.setTimeout(run, 12000);
            return;
        }

        window.addEventListener('load', () => window.setTimeout(run, 5000), { once: true });
    };

    const initPredictiveUniverseInline = () => {
    runWhenNear('.pu-cycle:not([data-pu])', () => {
        (function () {
                            document.querySelectorAll('.pu-cycle:not([data-pu])').forEach(host => {
                                host.setAttribute('data-pu', '1');
                                const svg = host.querySelector('svg');
                                const phasesG = svg.querySelector('.phases');
                                const traveler = svg.querySelector('.traveler');
                                const phases = ['Distinguish', 'Anticipate', 'Verify', 'Update', 'Continue'];
                                const cx = 180, cy = 180, r = 120;
                                phases.forEach((label, i) => {
                                    const ang = (i / phases.length) * Math.PI * 2 - Math.PI / 2;
                                    const x = cx + Math.cos(ang) * r;
                                    const y = cy + Math.sin(ang) * r;
                                    const lx = cx + Math.cos(ang) * (r + 28);
                                    const ly = cy + Math.sin(ang) * (r + 28) + 4;
                                    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                                    dot.setAttribute('class', 'phase-dot');
                                    dot.setAttribute('cx', x); dot.setAttribute('cy', y); dot.setAttribute('r', 4);
                                    dot.dataset.idx = i;
                                    phasesG.appendChild(dot);
                                    const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                                    txt.setAttribute('class', 'phase-label');
                                    txt.setAttribute('x', lx); txt.setAttribute('y', ly);
                                    txt.setAttribute('text-anchor', 'middle');
                                    txt.textContent = label;
                                    txt.dataset.idx = i;
                                    phasesG.appendChild(txt);
                                });
                                const t0 = performance.now();
                                const PERIOD = 8000;
                                function frame() {
                                    const elapsed = (performance.now() - t0) % PERIOD;
                                    const f = elapsed / PERIOD;
                                    const ang = f * Math.PI * 2 - Math.PI / 2;
                                    traveler.setAttribute('cx', cx + Math.cos(ang) * r);
                                    traveler.setAttribute('cy', cy + Math.sin(ang) * r);
                                    const activeIdx = Math.floor(f * phases.length) % phases.length;
                                    phasesG.querySelectorAll('.phase-dot').forEach(d => {
                                        const isActive = +d.dataset.idx === activeIdx;
                                        d.setAttribute('fill', isActive ? '#1a1a1a' : '#c8c2b3');
                                        d.setAttribute('r', isActive ? 6 : 4);
                                    });
                                    phasesG.querySelectorAll('.phase-label').forEach(t => {
                                        const isActive = +t.dataset.idx === activeIdx;
                                        t.setAttribute('fill', isActive ? '#1a1a1a' : '#888');
                                        t.setAttribute('font-weight', isActive ? '600' : '400');
                                    });
                                    requestAnimationFrame(frame);
                                }
                                requestAnimationFrame(frame);
                            });
                        })();
    });

    runWhenNear('.pu-backbone:not([data-pu])', () => {
        (function () {
                            document.querySelectorAll('.pu-backbone:not([data-pu])').forEach(host => {
                                host.setAttribute('data-pu', '1');
                                const cv = host.querySelector('canvas'), ctx = cv.getContext('2d');
                                const labelEl = host.querySelector('.pu-bb-label');
                                const DPR = Math.min(window.devicePixelRatio || 1, 2);
                                let W = 0, H = 0;
                                const resize = () => { const r = host.getBoundingClientRect(); cv.width = r.width * DPR; cv.height = r.height * DPR; W = cv.width; H = cv.height; };
                                resize(); new ResizeObserver(resize).observe(host);
                                // Each stage has explicit fade-in and fade-out so older shapes don't accumulate.
                                //   in     : t at which the stage starts fading in (1.0s fade)
                                //   out    : t at which the stage starts fading out (Infinity = stays until loop wrap)
                                //   outDur : seconds to fade out
                                const stages = [
                                    { in: 0.6, out: 4.6, outDur: 1.0, label: 'SPAP boundary  →  K₀ = 3 bits' },
                                    { in: 3.2, out: 9.4, outDur: 1.0, label: 'd₀ = 8  minimal carrier' },
                                    { in: 5.4, out: 14.6, outDur: 1.0, label: 'ε₀ = ln 2  irreducible update floor' },
                                    { in: 7.0, out: 9.4, outDur: 1.0, label: 'a = 2,  b = 6  active / inactive split' },
                                    { in: 9.8, out: Infinity, outDur: 1.0, label: 'M = 24  interface modes' },
                                    { in: 12.2, out: Infinity, outDur: 1.0, label: 'k = 12  prediction modes  ·  Golay split' },
                                    { in: 14.9, out: Infinity, outDur: 1.0, label: 'D = 4  spacetime' }
                                ];
                                const PERIOD = 18.5;
                                const FADE_IN = 1.0;
                                const T0 = performance.now();
                                const easeOut = t => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
                                function alphaOf(s, t) {
                                    if (t < s.in) return 0;
                                    const fIn = easeOut(Math.min(1, (t - s.in) / FADE_IN));
                                    const fOut = t >= s.out ? Math.max(0, 1 - (t - s.out) / s.outDur) : 1;
                                    return fIn * fOut;
                                }
                                function frame() {
                                    const tRaw = (performance.now() - T0) / 1000;
                                    const t = tRaw % PERIOD;
                                    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H);
                                    const cx = W / 2, cy = H * 0.50;
                                    const R = Math.min(W, H) * 0.34;
                                    // global wrap-fade in the last 1.2s of the loop so the restart is clean
                                    const wrapFade = t > PERIOD - 1.2 ? Math.max(0, 1 - (t - (PERIOD - 1.2)) / 1.2) : 1;
                                    // compute per-stage alpha
                                    const A = stages.map(s => alphaOf(s, t) * wrapFade);
                                    // active stage for label = latest with appreciable alpha
                                    let activeIdx = -1;
                                    for (let i = 0; i < stages.length; i++) { if (A[i] > 0.25) activeIdx = i; }
                                    // baseline ring (always faint)
                                    ctx.strokeStyle = 'rgba(160,160,160,' + (0.18 * wrapFade) + ')';
                                    ctx.lineWidth = DPR;
                                    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
                                    // ── Stage 0: K₀ = 3 bits (triangle) ──
                                    if (A[0] > 0) {
                                        const a = A[0];
                                        ctx.strokeStyle = 'rgba(255,255,255,' + (0.50 * a) + ')';
                                        ctx.lineWidth = DPR * 1.2;
                                        ctx.beginPath();
                                        for (let i = 0; i < 3; i++) {
                                            const ang = -Math.PI / 2 + i * Math.PI * 2 / 3;
                                            const x = cx + Math.cos(ang) * R * 0.48, y = cy + Math.sin(ang) * R * 0.48;
                                            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                                        }
                                        ctx.closePath(); ctx.stroke();
                                        ctx.fillStyle = 'rgba(255,255,255,' + (0.90 * a) + ')';
                                        for (let i = 0; i < 3; i++) {
                                            const ang = -Math.PI / 2 + i * Math.PI * 2 / 3;
                                            const x = cx + Math.cos(ang) * R * 0.48, y = cy + Math.sin(ang) * R * 0.48;
                                            ctx.beginPath(); ctx.arc(x, y, 4 * DPR, 0, Math.PI * 2); ctx.fill();
                                        }
                                    }
                                    // ── Stage 1: d₀ = 8 (octagon), with stage-3 active/inactive accents ──
                                    const octPts = [];
                                    for (let i = 0; i < 8; i++) {
                                        const ang = -Math.PI / 2 + i * Math.PI * 2 / 8;
                                        octPts.push({ x: cx + Math.cos(ang) * R * 0.72, y: cy + Math.sin(ang) * R * 0.72, ang });
                                    }
                                    if (A[1] > 0) {
                                        const a = A[1];
                                        ctx.strokeStyle = 'rgba(255,255,255,' + (0.25 * a) + ')';
                                        ctx.lineWidth = DPR;
                                        ctx.beginPath();
                                        octPts.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
                                        ctx.closePath(); ctx.stroke();
                                        const splitA = A[3];
                                        for (let i = 0; i < 8; i++) {
                                            const active = i < 2;
                                            let nodeA = 0.80 * a;
                                            let nodeR = 3 * DPR;
                                            if (splitA > 0) {
                                                if (active) {
                                                    nodeA = (0.80 + 0.20 * splitA) * a;
                                                    nodeR = (3 + 2.2 * splitA) * DPR;
                                                    ctx.shadowColor = '#fff'; ctx.shadowBlur = 8 * DPR * splitA;
                                                } else {
                                                    nodeA = (0.80 - 0.50 * splitA) * a;
                                                }
                                            }
                                            ctx.fillStyle = 'rgba(255,255,255,' + nodeA + ')';
                                            ctx.beginPath(); ctx.arc(octPts[i].x, octPts[i].y, nodeR, 0, Math.PI * 2); ctx.fill();
                                            ctx.shadowBlur = 0;
                                        }
                                        // a/b split caption (transient  -  fades with stage 3)
                                        if (splitA > 0.05) {
                                            ctx.fillStyle = 'rgba(255,255,255,' + (0.75 * splitA) + ')';
                                            ctx.font = 'italic ' + (12 * DPR) + 'px Georgia, serif';
                                            ctx.textAlign = 'center';
                                            ctx.textBaseline = 'top';
                                            ctx.fillText('a = 2  ·  b = 6', cx, cy + R * 0.78);
                                        }
                                    }
                                    // ── Stage 2: ε₀ = ln 2 (center marker) ──
                                    if (A[2] > 0) {
                                        const a = A[2];
                                        ctx.strokeStyle = 'rgba(255,255,255,' + (0.32 * a) + ')';
                                        ctx.lineWidth = DPR;
                                        ctx.beginPath(); ctx.arc(cx, cy, R * 0.19, 0, Math.PI * 2); ctx.stroke();
                                        ctx.fillStyle = 'rgba(255,255,255,' + (0.85 * a) + ')';
                                        ctx.font = 'italic ' + (12 * DPR) + 'px Georgia, serif';
                                        ctx.textAlign = 'center';
                                        ctx.textBaseline = 'middle';
                                        ctx.fillText('ln 2', cx, cy);
                                    }
                                    // ── Stage 4: M = 24 nodes ──
                                    const pts24 = [];
                                    for (let i = 0; i < 24; i++) {
                                        const ang = -Math.PI / 2 + i * Math.PI * 2 / 24;
                                        pts24.push({ x: cx + Math.cos(ang) * R, y: cy + Math.sin(ang) * R });
                                    }
                                    if (A[4] > 0) {
                                        const a = A[4];
                                        for (let i = 0; i < 24; i++) {
                                            // staggered reveal within stage
                                            const localT = Math.min(1, (t - stages[4].in) / 1.4);
                                            const reveal = Math.min(1, easeOut(localT) * 1.5 - (i / 24) * 0.5);
                                            if (reveal <= 0) continue;
                                            const e = reveal * a;
                                            let nodeA = 0.88 * e;
                                            let nodeR = 3.2 * DPR;
                                            // stage 5 emphasises the 12 prediction modes
                                            if (A[5] > 0.05) {
                                                const isPred = (i % 2 === 0);
                                                if (isPred) {
                                                    nodeA = e;
                                                    nodeR = (3.2 + 1.3 * A[5]) * DPR;
                                                    ctx.shadowColor = '#fff'; ctx.shadowBlur = 7 * DPR * A[5];
                                                } else {
                                                    nodeA = e * (1 - 0.55 * A[5]);
                                                }
                                            }
                                            ctx.fillStyle = 'rgba(255,255,255,' + nodeA + ')';
                                            ctx.beginPath(); ctx.arc(pts24[i].x, pts24[i].y, nodeR, 0, Math.PI * 2); ctx.fill();
                                            ctx.shadowBlur = 0;
                                        }
                                    }
                                    // ── Stage 5: Golay distance-8 chords ──
                                    if (A[5] > 0) {
                                        ctx.strokeStyle = 'rgba(255,255,255,' + (0.22 * A[5]) + ')';
                                        ctx.lineWidth = DPR * 0.7;
                                        for (let i = 0; i < 24; i += 2) {
                                            const j = (i + 8) % 24;
                                            ctx.beginPath();
                                            ctx.moveTo(pts24[i].x, pts24[i].y);
                                            ctx.lineTo(pts24[j].x, pts24[j].y);
                                            ctx.stroke();
                                        }
                                    }
                                    // ── Stage 6: D = 4 cross ──
                                    if (A[6] > 0) {
                                        const a = A[6];
                                        ctx.strokeStyle = 'rgba(255,255,255,' + (0.60 * a) + ')';
                                        ctx.lineWidth = DPR * 1.5;
                                        const r4 = R * 0.30;
                                        for (let i = 0; i < 4; i++) {
                                            const ang = i * Math.PI / 2;
                                            ctx.beginPath();
                                            ctx.moveTo(cx, cy);
                                            ctx.lineTo(cx + Math.cos(ang) * r4, cy + Math.sin(ang) * r4);
                                            ctx.stroke();
                                        }
                                        ctx.shadowColor = '#fff'; ctx.shadowBlur = 10 * DPR * a;
                                        ctx.fillStyle = 'rgba(255,255,255,' + a + ')';
                                        ctx.beginPath(); ctx.arc(cx, cy, 4 * DPR, 0, Math.PI * 2); ctx.fill();
                                        ctx.shadowBlur = 0;
                                    }
                                    labelEl.textContent = activeIdx >= 0 ? stages[activeIdx].label : '';
                                    labelEl.style.opacity = wrapFade;
                                    requestAnimationFrame(frame);
                                }
                                requestAnimationFrame(frame);
                            });
                        })();
    });

    runWhenNear('.pu-sm:not([data-pu])', () => {
        (function () {
                            document.querySelectorAll('.pu-sm:not([data-pu])').forEach(host => {
                                host.setAttribute('data-pu', '1');
                                const cv = host.querySelector('canvas'), ctx = cv.getContext('2d');
                                const DPR = Math.min(window.devicePixelRatio || 1, 2);
                                let W = 0, H = 0;
                                const resize = () => { const r = host.getBoundingClientRect(); cv.width = r.width * DPR; cv.height = r.height * DPR; W = cv.width; H = cv.height; };
                                resize(); new ResizeObserver(resize).observe(host);
                                const T0 = performance.now();
                                const LOOP = 22.0;
                                const ease = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
                                const lerp = (a, b, t) => a + (b - a) * t;
                                const fadeIn = (t, s, d) => ease(Math.min(1, Math.max(0, (t - s) / d)));
                                function frame() {
                                    const T = ((performance.now() - T0) / 1000) % LOOP;
                                    // global fade out near loop end
                                    const G = T > 19.5 ? 1 - ease(Math.min(1, (T - 19.5) / 2)) : 1;
                                    ctx.fillStyle = '#fafaf7'; ctx.fillRect(0, 0, W, H);
                                    const cx = W / 2;
                                    const topY = H * 0.20;
                                    const splitY = H * 0.46;
                                    const ink = '26,26,26', mut = '107,99,87';
                                    ctx.textAlign = 'center';
                                    // === d0=8 label ===
                                    const lblA = fadeIn(T, 0, 0.6) * G;
                                    ctx.fillStyle = `rgba(${mut},${lblA * 0.95})`;
                                    ctx.font = `italic ${13 * DPR}px Georgia, serif`;
                                    ctx.fillText('d₀ = 8 · minimal carrier', cx, topY - 26 * DPR);
                                    // === 8 dots ===
                                    const dotR = 5 * DPR;
                                    const space = Math.min(W * 0.058, 48 * DPR);
                                    const baseX = cx - space * 3.5;
                                    for (let i = 0; i < 8; i++) {
                                        const a = fadeIn(T, i * 0.10, 0.35) * G;
                                        let px = baseX + i * space, py = topY;
                                        // active rank: indices 0,1 peel up & left at T>2.5
                                        if (i < 2 && T > 2.5) {
                                            const p = ease(Math.min(1, (T - 2.5) / 1.2));
                                            py = lerp(topY, topY - 32 * DPR, p);
                                            px = lerp(baseX + i * space, cx - W * 0.34 + i * 22 * DPR, p);
                                        }
                                        // inactive sector: split into 3+2+1 at T>4.5
                                        if (i >= 2 && T > 4.5) {
                                            const p = ease(Math.min(1, (T - 4.5) / 1.6));
                                            let groupCx, idx, total;
                                            if (i <= 4) { groupCx = cx - W * 0.22; idx = i - 2; total = 3; }
                                            else if (i <= 6) { groupCx = cx; idx = i - 5; total = 2; }
                                            else { groupCx = cx + W * 0.22; idx = 0; total = 1; }
                                            const tx = groupCx + (idx - (total - 1) / 2) * 22 * DPR;
                                            px = lerp(baseX + i * space, tx, p);
                                            py = lerp(topY, splitY, p);
                                        }
                                        ctx.fillStyle = `rgba(${ink},${a})`;
                                        ctx.beginPath(); ctx.arc(px, py, dotR, 0, Math.PI * 2); ctx.fill();
                                    }
                                    // === active label (a = 2) ===
                                    if (T > 3.2) {
                                        const a = fadeIn(T, 3.2, 0.7) * G;
                                        ctx.fillStyle = `rgba(${mut},${a * 0.85})`;
                                        ctx.font = `italic ${11 * DPR}px Georgia, serif`;
                                        ctx.textAlign = 'left';
                                        ctx.fillText('active a = 2', cx - W * 0.34 - 6 * DPR, topY - 50 * DPR);
                                    }
                                    // === 6 = 3 + 2 + 1 equation ===
                                    if (T > 5.0) {
                                        const a = fadeIn(T, 5.0, 0.6) * G;
                                        ctx.textAlign = 'center';
                                        ctx.fillStyle = `rgba(${mut},${a * 0.85})`;
                                        ctx.font = `italic ${12 * DPR}px Georgia, serif`;
                                        ctx.fillText('inactive sector b = 6 = 3 + 2 + 1', cx, splitY - 30 * DPR);
                                    }
                                    // === group labels: su(3), su(2), u(1) ===
                                    if (T > 6.0) {
                                        const a = fadeIn(T, 6.0, 0.8) * G;
                                        const labelY = splitY + 30 * DPR;
                                        ctx.fillStyle = `rgba(${ink},${a})`;
                                        ctx.font = `italic ${15 * DPR}px Georgia, serif`;
                                        ctx.textAlign = 'center';
                                        ctx.fillText('su(3)', cx - W * 0.22, labelY);
                                        ctx.fillText('⊕', cx - W * 0.11, labelY);
                                        ctx.fillText('su(2)', cx, labelY);
                                        ctx.fillText('⊕', cx + W * 0.11, labelY);
                                        ctx.fillText('u(1)', cx + W * 0.22, labelY);
                                        // branch labels
                                        ctx.fillStyle = `rgba(${mut},${a * 0.85})`;
                                        ctx.font = `italic ${10.5 * DPR}px Georgia, serif`;
                                        ctx.fillText('gluon sector', cx - W * 0.22, labelY + 18 * DPR);
                                        ctx.fillText('weak isospin connection', cx, labelY + 18 * DPR);
                                        ctx.fillText('hypercharge connection', cx + W * 0.22, labelY + 18 * DPR);
                                    }
                                    // === electroweak mixing readout ===
                                    if (T > 8.0) {
                                        const a = fadeIn(T, 8.0, 0.8) * G;
                                        const bY = splitY + 72 * DPR;
                                        ctx.fillStyle = `rgba(${ink},${a * 0.85})`;
                                        ctx.font = `${12.5 * DPR}px Georgia, serif`;
                                        ctx.textAlign = 'center';
                                        ctx.fillText('after electroweak mixing: γ, Z⁰, W±', cx, bY);
                                    }
                                    // === three generations panel ===
                                    if (T > 11.0) {
                                        const a = fadeIn(T, 11.0, 0.8) * G;
                                        const gY = H * 0.85;
                                        // separator hairline
                                        ctx.strokeStyle = `rgba(${mut},${a * 0.30})`;
                                        ctx.lineWidth = DPR;
                                        ctx.beginPath();
                                        ctx.moveTo(W * 0.10, gY - 26 * DPR);
                                        ctx.lineTo(W * 0.90, gY - 26 * DPR);
                                        ctx.stroke();
                                        ctx.fillStyle = `rgba(${mut},${a * 0.85})`;
                                        ctx.font = `italic ${11 * DPR}px Georgia, serif`;
                                        ctx.textAlign = 'center';
                                        ctx.fillText('three generations · N_g = 3 branch', cx, gY - 12 * DPR);
                                        const gens = [
                                            { label: 'I', q: 'u d', l: 'νₑ e⁻' },
                                            { label: 'II', q: 'c s', l: 'νμ μ⁻' },
                                            { label: 'III', q: 't b', l: 'ντ τ⁻' }
                                        ];
                                        gens.forEach((g, i) => {
                                            const x = cx + (i - 1) * W * 0.20;
                                            const colA = fadeIn(T, 11.4 + i * 0.35, 0.55) * G;
                                            ctx.fillStyle = `rgba(${mut},${colA * 0.7})`;
                                            ctx.font = `italic ${10 * DPR}px Georgia, serif`;
                                            ctx.fillText(g.label, x, gY + 12 * DPR);
                                            ctx.fillStyle = `rgba(${ink},${colA * 0.95})`;
                                            ctx.font = `${15 * DPR}px Georgia, serif`;
                                            ctx.fillText(g.q, x, gY + 32 * DPR);
                                            ctx.fillText(g.l, x, gY + 52 * DPR);
                                        });
                                    }
                                    requestAnimationFrame(frame);
                                }
                                requestAnimationFrame(frame);
                            });
                        })();
    });

    (() => {
                const trigger = document.querySelector('.slide-deck-trigger');
                const lightbox = document.getElementById('slideDeckLightbox');
    
                if (!trigger || !lightbox) {
                    return;
                }
    
                const slideCount = 30;
                const slides = Array.from({ length: slideCount }, (_, index) => {
                    return `images/slideshow/pu/PU_slide_${String(index + 1).padStart(2, '0')}-desktop.jpg`;
                });
                const image = lightbox.querySelector('.slide-deck-image');
                const closeButton = lightbox.querySelector('.slide-deck-close');
                const previousButton = lightbox.querySelector('.slide-deck-prev');
                const nextButton = lightbox.querySelector('.slide-deck-next');
                const counter = lightbox.querySelector('.slide-deck-counter');
                const preloadedSlides = new Set();
                const preloadImages = [];
                let currentSlide = 0;
                let backgroundPreloadStarted = false;
                let backgroundPreloadIndex = 0;
                let touchStartX = 0;
                let touchStartY = 0;
                let touchActive = false;
                const swipeThreshold = 44;
                const swipeRatio = 1.35;
    
                const preloadSlide = (index) => {
                    const normalizedIndex = (index + slideCount) % slideCount;
    
                    if (preloadedSlides.has(normalizedIndex)) {
                        return;
                    }
    
                    preloadedSlides.add(normalizedIndex);
                    const nextImage = new Image();
                    nextImage.decoding = 'async';
                    if ('fetchPriority' in nextImage) {
                        nextImage.fetchPriority = 'low';
                    }
                    nextImage.src = slides[normalizedIndex];
                    preloadImages.push(nextImage);
                };
    
                const queueBackgroundPreload = () => {
                    if (backgroundPreloadIndex >= slideCount) {
                        return;
                    }
    
                    const run = () => {
                        preloadSlide(backgroundPreloadIndex);
                        backgroundPreloadIndex += 1;
                        window.setTimeout(queueBackgroundPreload, 700);
                    };
    
                    if ('requestIdleCallback' in window) {
                        window.requestIdleCallback(run, { timeout: 1500 });
                    } else {
                        window.setTimeout(run, 400);
                    }
                };
    
                const startBackgroundPreload = () => {
                    if (backgroundPreloadStarted) {
                        return;
                    }
    
                    backgroundPreloadStarted = true;
                    queueBackgroundPreload();
                };
    
                const showSlide = (index) => {
                    currentSlide = (index + slideCount) % slideCount;
                    preloadedSlides.add(currentSlide);
                    image.src = slides[currentSlide];
                    image.alt = `Predictive Universe slide ${currentSlide + 1} of ${slideCount}`;
                    counter.textContent = `${currentSlide + 1} / ${slideCount}`;
                    preloadSlide((currentSlide + 1) % slideCount);
                };
    
                const closeLightbox = () => {
                    lightbox.hidden = true;
                    document.body.classList.remove('image-lightbox-open');
                    image.removeAttribute('src');
                    trigger.focus();
                };
    
                trigger.addEventListener('click', () => {
                    showSlide(0);
                    startBackgroundPreload();
                    lightbox.hidden = false;
                    document.body.classList.add('image-lightbox-open');
                    nextButton.focus();
                });
    
                closeButton.addEventListener('click', closeLightbox);
                previousButton.addEventListener('click', () => showSlide(currentSlide - 1));
                nextButton.addEventListener('click', () => showSlide(currentSlide + 1));

                lightbox.addEventListener('touchstart', (event) => {
                    if (lightbox.hidden || event.touches.length !== 1) {
                        touchActive = false;
                        return;
                    }

                    touchStartX = event.touches[0].clientX;
                    touchStartY = event.touches[0].clientY;
                    touchActive = true;
                }, { passive: true });

                lightbox.addEventListener('touchend', (event) => {
                    if (!touchActive || lightbox.hidden || event.changedTouches.length !== 1) {
                        touchActive = false;
                        return;
                    }

                    const deltaX = event.changedTouches[0].clientX - touchStartX;
                    const deltaY = event.changedTouches[0].clientY - touchStartY;
                    touchActive = false;

                    if (Math.abs(deltaX) < swipeThreshold || Math.abs(deltaX) < Math.abs(deltaY) * swipeRatio) {
                        return;
                    }

                    showSlide(deltaX > 0 ? currentSlide - 1 : currentSlide + 1);
                }, { passive: true });

                lightbox.addEventListener('touchcancel', () => {
                    touchActive = false;
                }, { passive: true });
    
                lightbox.addEventListener('click', (event) => {
                    if (event.target === lightbox) {
                        closeLightbox();
                    }
                });
    
                document.addEventListener('keydown', (event) => {
                    if (lightbox.hidden) {
                        return;
                    }
    
                    if (event.key === 'Escape') {
                        closeLightbox();
                    } else if (event.key === 'ArrowLeft') {
                        showSlide(currentSlide - 1);
                    } else if (event.key === 'ArrowRight') {
                        showSlide(currentSlide + 1);
                    }
                });
    
                if ('IntersectionObserver' in window) {
                    const observer = new IntersectionObserver((entries) => {
                        if (entries.some((entry) => entry.isIntersecting)) {
                            startBackgroundPreload();
                            observer.disconnect();
                        }
                    }, { rootMargin: '900px 0px', threshold: 0.01 });
    
                    observer.observe(trigger);
                } else {
                    const checkDeckPosition = () => {
                        const rect = trigger.getBoundingClientRect();
    
                        if (rect.top < window.innerHeight + 900 && rect.bottom > -900) {
                            startBackgroundPreload();
                            window.removeEventListener('scroll', checkDeckPosition);
                            window.removeEventListener('resize', checkDeckPosition);
                        }
                    };
    
                    window.addEventListener('scroll', checkDeckPosition, { passive: true });
                    window.addEventListener('resize', checkDeckPosition);
                    checkDeckPosition();
                }
            })();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPredictiveUniverseInline, { once: true });
    } else {
        initPredictiveUniverseInline();
    }
})();
