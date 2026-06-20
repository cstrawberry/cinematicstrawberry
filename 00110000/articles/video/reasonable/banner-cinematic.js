(() => {
    const banner = document.querySelector('.pu-video-banner');
    const frame = banner ? banner.querySelector('.pu-video-frame') : null;
    const screen = banner ? banner.querySelector('.pu-video-screen') : null;
    const audio = banner ? banner.querySelector('.pu-video-audio') : null;
    const lightbox = document.getElementById('puVideoLightbox');
    const image = screen ? screen.querySelector('.pu-video-banner-visual') : null;

    if (!banner || !frame || !screen || !audio) {
        return;
    }

    let initialized = false;
    let initTimer = 0;

    const readOptionalSeconds = (value, fallback) => {
        const parsed = Number(value);

        return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
    };
    const smoothStep = (start, end, value) => {
        const progress = Math.max(0, Math.min(1, (value - start) / Math.max(0.001, end - start)));

        return progress * progress * (3 - (2 * progress));
    };
    const installIntroZoomStyle = () => {
        if (document.getElementById('reasonable-cinematic-zoom-style')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'reasonable-cinematic-zoom-style';
        style.textContent = `
            .pu-video-inline-frame.has-reasonable-cinematic-zoom.is-started .pu-video-banner-visual {
                animation: none !important;
                opacity: var(--reasonable-image-opacity, 1);
                transform-origin: 52% 47%;
                transform: translate3d(var(--reasonable-image-pan-x, 0%), var(--reasonable-image-pan-y, 0%), 0) scale(var(--reasonable-image-zoom, 1));
            }
        `;
        document.head.appendChild(style);
    };

    const initCinematicLayer = () => {
        if (initialized) {
            return;
        }

        initialized = true;
        installIntroZoomStyle();
        frame.classList.add('has-reasonable-cinematic-zoom');

        const canvas = document.createElement('canvas');
        canvas.className = 'pu-video-cosmic-canvas reasonable-cinematic-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.opacity = '0';
        canvas.style.filter = 'brightness(1) saturate(1)';
        canvas.style.transition = 'opacity 180ms linear, filter 180ms linear';

        if (image) {
            image.insertAdjacentElement('afterend', canvas);
        } else {
            screen.appendChild(canvas);
        }

        const contextOptions = {
            antialias: false,
            alpha: true,
            depth: false,
            stencil: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance'
        };
        const gl = canvas.getContext('webgl', contextOptions) || canvas.getContext('experimental-webgl', contextOptions);

        if (!gl) {
            frame.classList.add('is-cosmic-fallback');
            return;
        }

        gl.clearColor(0, 0, 0, 0);

        const vertexSource = `
            attribute vec2 aPosition;

            void main() {
                gl_Position = vec4(aPosition, 0.0, 1.0);
            }
        `;

        const fragmentSource = `
            precision highp float;

            uniform vec2 u_res;
            uniform float u_time;
            uniform float u_audio;
            uniform float u_duration;

            const float PI = 3.14159265359;

            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
            }

            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                vec2 u = f * f * (3.0 - (2.0 * f));

                return mix(
                    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
                    u.y
                );
            }

            float fbm(vec2 p) {
                float value = 0.0;
                float amplitude = 0.5;
                mat2 rotate = mat2(0.82, -0.57, 0.57, 0.82);

                for (int i = 0; i < 5; i++) {
                    value += amplitude * noise(p);
                    p = rotate * p * 2.02;
                    amplitude *= 0.5;
                }

                return value;
            }

            mat2 rot(float angle) {
                float c = cos(angle);
                float s = sin(angle);

                return mat2(c, -s, s, c);
            }

            float sdSegment(vec2 p, vec2 a, vec2 b) {
                vec2 pa = p - a;
                vec2 ba = b - a;
                float h = clamp(dot(pa, ba) / max(0.0001, dot(ba, ba)), 0.0, 1.0);

                return length(pa - (ba * h));
            }

            float lineSegment(vec2 p, vec2 a, vec2 b, float width) {
                return 1.0 - smoothstep(width, width * 2.4, sdSegment(p, a, b));
            }

            float ring(vec2 p, float radius, float width) {
                return 1.0 - smoothstep(width, width * 2.7, abs(length(p) - radius));
            }

            float gridField(vec2 p, float scale, float width) {
                vec2 g = abs(fract(p * scale) - 0.5);
                float dist = min(g.x, g.y) / scale;

                return 1.0 - smoothstep(width, width * 2.0, dist);
            }

            vec2 graphNode(float index, float radius, float spin) {
                float angle = (index * 2.3999632) + spin;

                return vec2(cos(angle), sin(angle)) * radius;
            }

            float proofGraph(vec2 p, float audioTime) {
                float spin = audioTime * 0.012;
                float graph = 0.0;

                for (int i = 0; i < 10; i++) {
                    float fi = float(i);
                    vec2 a = graphNode(fi, 0.18 + (0.045 * sin(audioTime * 0.033 + fi)), spin);
                    vec2 b = graphNode(fi + 3.0, 0.34 + (0.035 * cos(audioTime * 0.027 + fi)), -spin * 0.8);
                    graph += lineSegment(p, a, b, 0.0038);
                    graph += 1.0 - smoothstep(0.012, 0.04, length(p - a));
                    graph += 0.65 * (1.0 - smoothstep(0.01, 0.032, length(p - b)));
                }

                return graph;
            }

            float theoremRings(vec2 p, float audioTime) {
                vec2 q = rot(audioTime * 0.009) * (p - vec2(0.03, -0.015));
                float rings = 0.0;

                for (int i = 0; i < 5; i++) {
                    float fi = float(i);
                    float radius = 0.115 + (fi * 0.075) + (sin(audioTime * 0.04 + fi) * 0.006);
                    rings += ring(q, radius, 0.0045 + (fi * 0.00045));
                }

                vec2 lensA = q - vec2(-0.19, 0.03);
                vec2 lensB = q - vec2(0.22, -0.02);
                rings += 0.7 * ring(lensA, 0.14, 0.004);
                rings += 0.7 * ring(lensB, 0.18, 0.004);
                rings += 0.45 * lineSegment(q, vec2(-0.33, -0.19), vec2(0.38, 0.22), 0.003);
                rings += 0.45 * lineSegment(q, vec2(-0.29, 0.26), vec2(0.34, -0.25), 0.003);

                return rings;
            }

            float spiralField(vec2 p, float audioTime) {
                float radius = length(p);
                float angle = atan(p.y, p.x);
                float phase = (log(radius + 0.035) * 1.28) + (angle / PI) - (audioTime * 0.026);
                float band = abs(fract(phase * 2.0) - 0.5);
                float spiral = 1.0 - smoothstep(0.014, 0.06, band);

                return spiral * smoothstep(0.03, 0.18, radius) * (1.0 - smoothstep(0.58, 0.82, radius));
            }

            float dashField(vec2 p, float audioTime) {
                vec2 q = rot(-0.08) * p;
                vec2 cell = q * vec2(9.0, 15.0) + vec2(-audioTime * 0.018, audioTime * 0.01);
                float row = 1.0 - smoothstep(0.018, 0.045, abs(fract(cell.y) - 0.5));
                float dash = smoothstep(0.46, 0.5, fract(cell.x + floor(cell.y) * 0.37));
                float mask = smoothstep(0.62, 0.16, length(q - vec2(-0.37, 0.08)));

                return row * dash * mask;
            }

            float silkCurveSet(vec2 p, float time) {
                vec2 q = rot(0.045 * sin(time * 0.07)) * p;
                float field = 0.0;

                for (int i = 0; i < 6; i++) {
                    float fi = float(i);
                    float offset = (fi - 2.5) * 0.082;
                    float wave = sin((q.x * (3.2 + fi * 0.28)) + (time * (0.18 + fi * 0.018)) + (fi * 1.17));
                    float y = offset + (0.055 * wave) + (0.018 * sin((q.x * 8.0) - (time * 0.09)));
                    float width = 0.0038 + (fi * 0.0002);
                    field += (1.0 - smoothstep(width, width * 3.0, abs(q.y - y))) * smoothstep(0.72, 0.18, abs(q.x));
                }

                return field;
            }

            float harmonicRose(vec2 p, float time) {
                vec2 q = rot(-time * 0.012) * (p - vec2(0.02, -0.015));
                float radius = length(q);
                float angle = atan(q.y, q.x);
                float rose = 0.205 + (0.055 * cos((angle * 6.0) + (time * 0.22))) + (0.024 * sin((angle * 3.0) - (time * 0.14)));
                float halo = 0.35 + (0.025 * sin(time * 0.16));

                return (1.0 - smoothstep(0.004, 0.017, abs(radius - rose))) + (0.38 * (1.0 - smoothstep(0.006, 0.026, abs(radius - halo))));
            }

            float elegantChords(vec2 p, float time) {
                vec2 q = rot(0.58 + (0.018 * sin(time * 0.11))) * p;
                float field = 0.0;

                for (int i = 0; i < 5; i++) {
                    float fi = float(i);
                    float y = (fi - 2.0) * 0.105 + (0.018 * sin(time * 0.12 + fi));
                    float segmentMask = smoothstep(-0.66, -0.32, q.x) * (1.0 - smoothstep(0.32, 0.68, q.x));
                    field += (1.0 - smoothstep(0.0028, 0.011, abs(q.y - y))) * segmentMask;
                }

                return field;
            }

            float pearlField(vec2 p, float time) {
                float field = 0.0;

                for (int i = 0; i < 9; i++) {
                    float fi = float(i);
                    float angle = (fi / 9.0) * PI * 2.0 + (time * 0.045);
                    float radius = 0.31 + (0.025 * sin(time * 0.13 + fi * 1.9));
                    vec2 center = vec2(cos(angle), sin(angle)) * radius;
                    float d = length(p - center);
                    field += 1.0 - smoothstep(0.008, 0.028, d);
                }

                return field;
            }

            void main() {
                vec2 uv = gl_FragCoord.xy / u_res.xy;
                float aspect = u_res.x / u_res.y;
                vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
                float audioTime = max(0.0, u_audio);
                float duration = max(1.0, u_duration);
                float secondPhase = smoothstep(60.0, 76.0, audioTime);
                float secondClock = max(0.0, audioTime - 60.0);
                float atmosphereZoom = 1.0 + (secondPhase * min(0.42, secondClock * 0.0065));
                vec2 immersiveP = p / atmosphereZoom;
                float reveal = 0.96 + (0.04 * smoothstep(0.25, 10.5, audioTime));
                float endMask = 1.0 - smoothstep(max(1.0, duration - 7.0), duration, audioTime);
                float pulse = 0.5 + (0.5 * sin((audioTime * 1.75) + (u_time * 0.45)));

                vec2 drift = vec2(sin(audioTime * 0.021), cos(audioTime * 0.017)) * 0.025;
                vec2 fieldP = p + drift;
                float cloud = fbm((fieldP * 2.1) + vec2(u_time * 0.025, -u_time * 0.018));
                float fine = fbm((fieldP * 8.0) + vec2(-u_time * 0.06, u_time * 0.04));
                float grid = gridField(fieldP + vec2(audioTime * 0.003, 0.0), 9.0, 0.0026);
                grid += 0.55 * gridField(rot(0.785398) * fieldP, 6.0, 0.0022);
                grid *= 1.0 - smoothstep(0.42, 0.84, length(p));

                float graph = proofGraph(p, audioTime);
                float rings = theoremRings(p, audioTime);
                float spiral = spiralField(p - vec2(0.05, -0.02), audioTime);
                float dashes = dashField(p, audioTime);

                float starSeed = hash(floor((uv * vec2(aspect, 1.0)) * 210.0));
                float stars = smoothstep(0.992, 1.0, starSeed) * (0.45 + (0.55 * pulse));
                stars *= smoothstep(0.16, 0.75, uv.y);

                vec3 ember = vec3(1.0, 0.63, 0.25);
                vec3 ivory = vec3(0.87, 0.96, 0.88);
                vec3 teal = vec3(0.10, 0.86, 0.76);
                vec3 red = vec3(0.90, 0.13, 0.08);
                vec3 violet = vec3(0.28, 0.13, 0.36);
                vec3 ink = vec3(0.015, 0.012, 0.010);

                vec3 color = ink * (0.4 + (cloud * 0.7));
                color += violet * pow(cloud, 2.1) * 0.7;
                color += teal * grid * 0.38;
                color += ember * rings * (0.42 + (0.26 * pulse));
                color += ivory * graph * 0.34;
                color += red * spiral * 0.26;
                color += ivory * dashes * 0.24;
                color += vec3(1.0, 0.88, 0.62) * stars * 0.65;
                color += teal * fine * 0.05;

                float centerGlow = exp(-dot(p, p) * 6.0);
                color += mix(red, ember, 0.58) * centerGlow * (0.08 + (0.10 * pulse));
                color += vec3(0.01, 0.008, 0.006) * (0.62 + (cloud * 0.38));

                vec2 quietP = immersiveP + (vec2(sin(secondClock * 0.048), cos(secondClock * 0.037)) * 0.014);
                float quietCloud = fbm((quietP * 1.45) + vec2(secondClock * 0.018, -secondClock * 0.012));
                float silk = silkCurveSet(quietP, secondClock);
                float rose = harmonicRose(quietP, secondClock);
                float chords = elegantChords(quietP, secondClock);
                float pearls = pearlField(quietP, secondClock);
                float outerHalo = 1.0 - smoothstep(0.24, 0.72, length(quietP));
                float elegantSignal = clamp((silk * 0.34) + (rose * 0.42) + (chords * 0.22) + (pearls * 0.24) + (quietCloud * 0.16), 0.0, 1.0);
                vec3 midnight = vec3(0.006, 0.013, 0.017);
                vec3 silver = vec3(0.70, 0.91, 0.96);
                vec3 champagne = vec3(1.0, 0.79, 0.42);
                vec3 jade = vec3(0.18, 0.76, 0.62);
                vec3 indigo = vec3(0.08, 0.10, 0.22);
                vec3 elegantColor = mix(midnight, indigo, quietCloud * 0.42);
                elegantColor += silver * silk * 0.34;
                elegantColor += champagne * rose * (0.42 + (0.12 * sin(secondClock * 0.24)));
                elegantColor += jade * chords * 0.28;
                elegantColor += vec3(0.92, 0.95, 0.84) * pearls * 0.34;
                elegantColor += mix(jade, champagne, 0.46) * outerHalo * 0.09;
                elegantColor += vec3(0.02, 0.035, 0.038) * (0.45 + quietCloud * 0.55);
                elegantColor *= 1.0 - (0.28 * smoothstep(0.55, 0.9, length(p)));
                color = mix(color, elegantColor, secondPhase);

                float signal = clamp(
                    (grid * 0.28) + (rings * 0.48) + (graph * 0.36) + (spiral * 0.28) + (dashes * 0.2) + (stars * 0.4) + (cloud * 0.2),
                    0.0,
                    1.0
                );
                signal = mix(signal, elegantSignal, secondPhase);
                float vignette = 1.0 - smoothstep(0.58, 0.86, length(p));
                float alpha = reveal * endMask * clamp(0.72 + (signal * 0.34), 0.0, 1.0) * (0.84 + (0.16 * vignette));

                gl_FragColor = vec4(color, alpha);
            }
        `;

        const compileShader = (type, source) => {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                throw new Error(gl.getShaderInfoLog(shader) || 'Shader compile failed.');
            }

            return shader;
        };

        let program;

        try {
            const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
            const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
            program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                throw new Error(gl.getProgramInfoLog(program) || 'Shader link failed.');
            }
        } catch (error) {
            frame.classList.add('is-cosmic-fallback');
            return;
        }

        const positions = new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1
        ]);
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, 'aPosition');
        const uniforms = {
            resolution: gl.getUniformLocation(program, 'u_res'),
            time: gl.getUniformLocation(program, 'u_time'),
            audio: gl.getUniformLocation(program, 'u_audio'),
            duration: gl.getUniformLocation(program, 'u_duration')
        };

        let rafId = 0;
        let running = false;
        let visibleOnce = false;
        let lastDrawTime = 0;
        const startTime = performance.now();
        const visualDuration = readOptionalSeconds(lightbox ? lightbox.dataset.visualDuration : undefined, 129);

        const getClockSourceTime = () => {
            const visualTime = Number(audio.dataset.puVisualTime);

            if ((audio.dataset.puSeeking === 'true' || audio.dataset.puVisualActive === 'true') && Number.isFinite(visualTime)) {
                return visualTime;
            }

            return audio.currentTime || 0;
        };

        let smoothVisualTime = getClockSourceTime();
        let smoothVisualRealTime = performance.now();
        let smoothVisualRunning = false;

        const resetSmoothVisualClock = (time = getClockSourceTime(), now = performance.now()) => {
            smoothVisualTime = Math.max(0, time);
            smoothVisualRealTime = now;
            smoothVisualRunning = !audio.paused && !audio.ended;
        };

        const getSmoothVisualTime = (now = performance.now()) => {
            const sourceTime = Math.max(0, getClockSourceTime());
            const playbackRate = Number.isFinite(audio.playbackRate) && audio.playbackRate > 0 ? audio.playbackRate : 1;

            if (audio.dataset.puSeeking === 'true' || audio.paused || audio.ended) {
                resetSmoothVisualClock(sourceTime, now);
                return sourceTime;
            }

            if (!smoothVisualRunning) {
                resetSmoothVisualClock(sourceTime, now);
                return smoothVisualTime;
            }

            const delta = Math.max(0, Math.min((now - smoothVisualRealTime) / 1000, 0.25));
            smoothVisualRealTime = now;
            smoothVisualTime += delta * playbackRate;

            const drift = sourceTime - smoothVisualTime;

            if (Math.abs(drift) > 1.25) {
                smoothVisualTime = sourceTime;
            } else if (Math.abs(drift) > 0.08) {
                smoothVisualTime += drift * Math.min(0.05, delta * 0.24);
            }

            return Math.max(0, smoothVisualTime);
        };

        const getDuration = () => {
            if (Number.isFinite(audio.duration) && audio.duration > 0) {
                return Math.max(audio.duration, visualDuration);
            }

            return visualDuration;
        };

        const getRevealState = (audioTime) => {
            const theoremLift = smoothStep(17, 48, audioTime);
            const secondPhase = smoothStep(60, 76, audioTime);
            const secondClock = Math.max(0, audioTime - 60);
            const atmosphereZoom = 1 + (secondPhase * Math.min(0.12, secondClock * 0.0018));

            return {
                opacity: 1,
                brightness: 1 + (theoremLift * 0.08),
                saturation: 1.04 + (theoremLift * 0.18),
                scale: atmosphereZoom
            };
        };

        const getImageOpacity = (audioTime) => {
            const dim = smoothStep(18, 58, audioTime);
            const recover = smoothStep(94, 120, audioTime);

            return Math.max(0.32, 1 - (dim * 0.54) + (recover * 0.16));
        };

        const getRenderScale = (rect) => {
            const cssPixels = Math.max(1, rect.width * rect.height);
            const maxPixels = 760000;
            let dpr = Math.min(window.devicePixelRatio || 1, 1.25);

            if (cssPixels * dpr * dpr > maxPixels) {
                dpr = Math.sqrt(maxPixels / cssPixels);
            }

            return Math.max(0.65, dpr);
        };

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = getRenderScale(rect);
            const width = Math.max(2, Math.round(rect.width * dpr));
            const height = Math.max(2, Math.round(rect.height * dpr));

            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
                gl.viewport(0, 0, width, height);
            }

            gl.useProgram(program);
            gl.uniform2f(uniforms.resolution, width, height);
        };

        const render = (now) => {
            if (running && lastDrawTime && now - lastDrawTime < 16) {
                rafId = requestAnimationFrame(render);
                return;
            }

            lastDrawTime = now;
            resize();

            const elapsedTime = (now - startTime) / 1000;
            const audioTime = getSmoothVisualTime(now);
            const duration = getDuration();
            const reveal = getRevealState(audioTime);
            const imageOpacity = getImageOpacity(audioTime);
            const zoomProgress = smoothStep(0, Math.max(1, duration - 8), audioTime);
            const proofShift = smoothStep(24, 78, audioTime);
            const driftX = (-0.62 * zoomProgress) + (Math.sin(audioTime * 0.031) * 0.18);
            const driftY = (-2.15 * zoomProgress) + (Math.cos(audioTime * 0.025) * 0.14) + (proofShift * 0.32);

            frame.style.setProperty('--reasonable-image-zoom', String(1 + (zoomProgress * 0.44)));
            frame.style.setProperty('--reasonable-image-pan-x', driftX.toFixed(3) + '%');
            frame.style.setProperty('--reasonable-image-pan-y', driftY.toFixed(3) + '%');
            frame.style.setProperty('--reasonable-image-opacity', imageOpacity.toFixed(3));
            canvas.style.opacity = reveal.opacity.toFixed(3);
            canvas.style.filter = `brightness(${reveal.brightness.toFixed(3)}) saturate(${reveal.saturation.toFixed(3)})`;
            canvas.style.transform = `scale(${reveal.scale.toFixed(4)})`;

            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(program);
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
            gl.uniform1f(uniforms.time, elapsedTime);
            gl.uniform1f(uniforms.audio, audioTime);
            gl.uniform1f(uniforms.duration, duration);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            if (!visibleOnce) {
                visibleOnce = true;
                frame.classList.add('has-cosmic-webgl', 'has-cosmic-visible');
                const previewCanvas = screen.querySelector('.pu-video-inline-preview-canvas');

                if (previewCanvas) {
                    previewCanvas.style.opacity = '0';
                    window.setTimeout(() => {
                        previewCanvas.remove();
                        screen.classList.remove('has-reasonable-preview');
                    }, 260);
                }
            }

            running = !audio.paused && !audio.ended;

            if (running) {
                rafId = requestAnimationFrame(render);
            } else {
                rafId = 0;
            }
        };

        const requestRender = () => {
            if (!rafId) {
                rafId = requestAnimationFrame(render);
            }
        };

        const syncPlayback = () => {
            running = !audio.paused && !audio.ended;
            requestRender();
        };

        audio.addEventListener('play', () => {
            resetSmoothVisualClock();
            syncPlayback();
        });
        audio.addEventListener('pause', syncPlayback);
        audio.addEventListener('ended', syncPlayback);
        audio.addEventListener('timeupdate', () => {
            if (audio.paused) {
                requestRender();
            }
        });
        audio.addEventListener('seeking', () => {
            resetSmoothVisualClock();
            requestRender();
        });
        audio.addEventListener('seeked', () => {
            resetSmoothVisualClock();
            requestRender();
        });
        audio.addEventListener('loadedmetadata', requestRender);
        audio.addEventListener('ratechange', resetSmoothVisualClock);
        window.addEventListener('resize', requestRender, { passive: true });
        document.addEventListener('pu:visual-resolution-change', requestRender);

        requestRender();
    };

    const runWhenIdle = () => {
        if (window.requestIdleCallback) {
            window.requestIdleCallback(initCinematicLayer);
        } else {
            window.setTimeout(initCinematicLayer, 0);
        }
    };

    const scheduleCinematicInit = (delay, preferIdle = true) => {
        if (initialized || initTimer) {
            return;
        }

        initTimer = window.setTimeout(() => {
            initTimer = 0;

            if (preferIdle) {
                runWhenIdle();
            } else {
                initCinematicLayer();
            }
        }, delay);
    };

    if (frame.classList.contains('is-started')) {
        scheduleCinematicInit(0, false);
    } else if (document.readyState === 'loading') {
        window.addEventListener('load', () => scheduleCinematicInit(1000), { once: true });
    } else if (!audio.paused && !audio.ended) {
        scheduleCinematicInit(0, false);
    }

    audio.addEventListener('play', () => scheduleCinematicInit(0, false), { once: true });
})();
