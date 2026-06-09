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
        if (document.getElementById('nothing-cinematic-zoom-style')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'nothing-cinematic-zoom-style';
        style.textContent = `
            .pu-video-inline-frame.has-nothing-cinematic-zoom.is-started .pu-video-banner-visual {
                animation: none !important;
                opacity: var(--nothing-image-opacity, 1);
                transform-origin: 48% 74%;
                transform: translate3d(var(--nothing-image-pan-x, 0%), var(--nothing-image-pan-y, 0%), 0) scale(var(--nothing-image-zoom, 1));
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
        frame.classList.add('has-nothing-cinematic-zoom');

        const canvas = document.createElement('canvas');
        canvas.className = 'pu-video-cosmic-canvas';
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
            uniform vec2  u_res;
            uniform float u_time;
            uniform vec2  u_mouse;
            uniform float u_mouseDown;
            uniform vec2  u_clickPos;
            uniform float u_clickTime;

            float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
            float noise(vec2 p){
              vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.0-2.0*f);
              return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),
                         mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
            }
            float fbm(vec2 p){
              float v=0.0,a=0.5; mat2 R=mat2(0.8,-0.6,0.6,0.8);
              for(int i=0;i<6;i++){ v+=a*noise(p); p=R*p*2.02; a*=0.5; }
              return v;
            }

            // layered stars at resolution scale
            float stars(vec2 uv, float scale, float threshold){
              vec2 g = floor(uv*scale);
              vec2 f = fract(uv*scale);
              float h = hash(g);
              if(h < threshold) return 0.0;
              float s = hash(g+1.7);
              vec2 c = vec2(hash(g+3.3), hash(g+7.1));
              float d = length(f - c);
              float tw = 0.5+0.5*sin(u_time*(1.0+s*3.0) + s*20.0);
              float flash = pow(tw, 5.0);
              return smoothstep(0.055, 0.0, d) * (0.55 + 0.95*tw + 0.75*flash) * (0.45 + s*0.9);
            }

            void main(){
              vec2 uv = gl_FragCoord.xy/u_res.xy;
              float aspect = u_res.x/u_res.y;
              vec2 p = (uv-0.5)*vec2(aspect,1.0);
              vec2 m = (u_mouse-0.5);

              // parallax offset per layer
              vec2 par = m * 0.08;

              // swirl toward mouse: rotate field around cursor with distance falloff
              vec2 mv = (u_mouse-0.5)*vec2(aspect,1.0);
              vec2 d = p - mv;
              float r = length(d);
              float swirlAmt = exp(-r*1.8)*(0.4 + 0.8*u_mouseDown);
              float ang = swirlAmt * 1.6;
              float cs = cos(ang), sn = sin(ang);
              mat2 R = mat2(cs,-sn,sn,cs);
              vec2 ps = mv + R*d;

              float t = u_time*0.05;

              // nebula — two colored clouds
              float n1 = fbm(ps*1.6 + vec2(t, 0.0));
              float n2 = fbm(ps*1.3 + vec2(-t*0.7, t*0.5) + 3.1);
              vec3 neb = vec3(0.0);
              neb += vec3(0.45, 0.15, 0.65) * pow(n1, 2.2)*1.4;
              neb += vec3(0.1, 0.35, 0.75) * pow(n2, 2.4)*1.2;
              // hot core near cursor
              neb += vec3(1.0, 0.55, 0.25) * exp(-r*3.5) * (0.3+0.7*u_mouseDown);

              // stars — dense sparkling parallax layers
              float st = 0.0;
              st += stars(uv*vec2(aspect,1.0) - par*0.8, 70.0, 0.982);
              st += stars(uv*vec2(aspect,1.0) - par*1.5, 140.0, 0.987)*0.9;
              st += stars(uv*vec2(aspect,1.0) - par*2.4, 260.0, 0.990)*0.75;
              st += stars(uv*vec2(aspect,1.0) - par*3.5, 430.0, 0.992)*0.55;
              st += stars(uv*vec2(aspect,1.0) - par*4.8, 620.0, 0.995)*0.35;
              st *= smoothstep(0.48, 0.66, uv.y);

              // click supernova: expanding shockwave + core
              vec2 cp = (u_clickPos-0.5)*vec2(aspect,1.0);
              float cd = length(p - cp);
              float core = exp(-cd*cd*60.0) * exp(-u_clickTime*2.2);
              float wave = exp(-pow((cd - u_clickTime*1.5)*7.0, 2.0)) * exp(-u_clickTime*1.1);
              vec3 sup = vec3(1.0, 0.85, 0.5)*core*3.0 + vec3(0.9,0.6,1.0)*wave*1.6;

              // background deep space
              vec3 bg = mix(vec3(0.01,0.01,0.04), vec3(0.04,0.02,0.08), uv.y);

              vec3 col = bg + neb + vec3(1.0,0.95,0.9)*st + sup;

              col *= 1.0 - 0.35*length(uv-0.5);
              gl_FragColor = vec4(col, 1.0);
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
            mouse: gl.getUniformLocation(program, 'u_mouse'),
            mouseDown: gl.getUniformLocation(program, 'u_mouseDown'),
            clickPos: gl.getUniformLocation(program, 'u_clickPos'),
            clickTime: gl.getUniformLocation(program, 'u_clickTime')
        };

        let rafId = 0;
        let running = false;
        let visibleOnce = false;
        let lastDrawTime = 0;
        const startTime = performance.now();
        const visualDuration = readOptionalSeconds(lightbox ? lightbox.dataset.visualDuration : undefined, 130);

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
                smoothVisualTime += drift * Math.min(0.045, delta * 0.22);
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
            const reveal = smoothStep(0.8, 11.5, audioTime);

            return {
                opacity: Math.min(0.68, reveal * 0.68),
                brightness: 1,
                saturation: 1.08
            };
        };

        const getImageOpacity = (audioTime) => {
            const fade = smoothStep(40, 60, audioTime);

            return 1 - (fade * 0.87);
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
            const driftX = 1.35 * zoomProgress + Math.sin(audioTime * 0.038) * 0.22;
            const driftY = -6.25 * zoomProgress + Math.cos(audioTime * 0.031) * 0.16;
            frame.style.setProperty('--nothing-image-zoom', String(1 + (zoomProgress * 1.08)));
            frame.style.setProperty('--nothing-image-pan-x', driftX.toFixed(3) + '%');
            frame.style.setProperty('--nothing-image-pan-y', driftY.toFixed(3) + '%');
            frame.style.setProperty('--nothing-image-opacity', imageOpacity.toFixed(3));
            canvas.style.opacity = reveal.opacity.toFixed(3);
            canvas.style.filter = `brightness(${reveal.brightness.toFixed(3)}) saturate(${reveal.saturation.toFixed(3)})`;

            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(program);
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
            gl.uniform1f(uniforms.time, elapsedTime);
            gl.uniform2f(uniforms.mouse, 0.5, 0.5);
            gl.uniform1f(uniforms.mouseDown, 0);
            gl.uniform2f(uniforms.clickPos, 0.5, 0.5);
            gl.uniform1f(uniforms.clickTime, 1000);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            if (!visibleOnce) {
                visibleOnce = true;
                frame.classList.add('has-cosmic-webgl', 'has-cosmic-visible');
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

    if (document.readyState === 'loading') {
        window.addEventListener('load', () => scheduleCinematicInit(1000), { once: true });
    } else if (!audio.paused && !audio.ended) {
        scheduleCinematicInit(0, false);
    }

    audio.addEventListener('play', () => scheduleCinematicInit(0, false), { once: true });
})();
