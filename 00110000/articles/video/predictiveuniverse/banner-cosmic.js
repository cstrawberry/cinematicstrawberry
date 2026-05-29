(() => {
    const banner = document.querySelector('.pu-video-banner');
    const frame = banner ? banner.querySelector('.pu-video-frame') : null;
    const screen = banner ? banner.querySelector('.pu-video-screen') : null;
    const audio = banner ? banner.querySelector('.pu-video-audio') : null;
    const image = screen ? screen.querySelector('.pu-video-banner-visual') : null;
    const fullscreenImage = screen ? screen.querySelector('.pu-video-banner-visual-fullscreen') : null;

    if (!banner || !frame || !screen || !audio || !image) {
        return;
    }

    let initialized = false;
    let initTimer = 0;

    const initCosmicLayer = () => {
        if (initialized) {
            return;
        }

        initialized = true;
    const canvas = document.createElement('canvas');
    canvas.className = 'pu-video-cosmic-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    image.insertAdjacentElement('afterend', canvas);

    const gl = canvas.getContext('webgl', {
        antialias: false,
        alpha: true,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        desynchronized: false,
        powerPreference: 'high-performance'
    });

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

        uniform sampler2D uImage;
        uniform vec2 uResolution;
        uniform vec2 uImageResolution;
        uniform float uTime;
        uniform float uAudioTime;
        uniform float uProgress;

        const float PI = 3.141592653589793;
        const float TAU = 6.283185307179586;

        float hash(vec2 p) {
            p = fract(p * vec2(123.34, 345.45));
            p += dot(p, p + 34.345);
            return fract(p.x * p.y);
        }

        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(
                mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
                u.y
            );
        }

        float fbm(vec2 p) {
            float value = 0.0;
            float amp = 0.5;
            for (int i = 0; i < 2; i++) {
                value += noise(p) * amp;
                p *= 2.02;
                amp *= 0.5;
            }
            return value;
        }

        float smoother(float edge0, float edge1, float x) {
            x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
            return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
        }

        vec2 rotate2(vec2 p, float a) {
            float s = sin(a);
            float c = cos(a);
            return mat2(c, -s, s, c) * p;
        }

        vec2 coverScale(vec2 res, vec2 img) {
            float screenAspect = res.x / res.y;
            float imageAspect = img.x / img.y;
            if (screenAspect > imageAspect) {
                return vec2(1.0, imageAspect / screenAspect);
            }
            return vec2(screenAspect / imageAspect, 1.0);
        }

        vec3 sampleImage(vec2 uv) {
            float inside = step(0.0, uv.x) * step(0.0, uv.y) * step(uv.x, 1.0) * step(uv.y, 1.0);
            return texture2D(uImage, clamp(uv, 0.0, 1.0)).rgb * inside;
        }

        float starLayer(vec2 p, float scale, float threshold, float t) {
            vec2 grid = p * scale;
            vec2 id = floor(grid);
            vec2 cell = fract(grid) - 0.5;
            float rnd = hash(id);
            float size = mix(0.006, 0.026, hash(id + vec2(5.2, 8.7)));
            float star = smoothstep(size, 0.0, length(cell)) * step(threshold, rnd);
            float twinkle = 0.68 + 0.32 * sin(t * (0.28 + rnd * 0.5) + rnd * TAU);
            return star * twinkle;
        }

        vec3 cosmos(vec2 p, float t, float progress) {
            float deep = smoother(0.03, 0.88, progress);
            float travel = progress * progress * 9.0;
            p += vec2(0.030 * sin(t * 0.045), 0.022 * cos(t * 0.038));
            vec2 q = p * mix(7.2, 1.25, deep);
            q = rotate2(q, 0.16 * sin(t * 0.050) + t * 0.018 + travel * 0.12);

            float r = length(q);
            float a = atan(q.y, q.x);
            float swirl = a + 2.25 * log(r + 0.12) - travel * 0.44 + t * 0.060;
            float arms = pow(0.5 + 0.5 * sin(swirl * 3.0), 3.0);
            float cloud = fbm(q * 1.25 + vec2(t * 0.030, -t * 0.022));
            float cloud2 = fbm(rotate2(q * 2.0, 0.7 + t * 0.018) + vec2(-t * 0.022, t * 0.026));
            float nebula = (0.30 + 0.70 * cloud) * smoothstep(3.3, 0.12, r);
            float armGlow = arms * smoothstep(3.2, 0.05, r) * (0.38 + 0.62 * cloud2);

            vec3 col = vec3(0.002, 0.005, 0.018);
            col += vec3(0.04, 0.18, 0.56) * nebula * 0.78;
            col += vec3(0.40, 0.14, 0.72) * pow(max(cloud * armGlow, 0.0), 1.22) * 0.74;
            col += vec3(1.00, 0.56, 0.20) * pow(max(arms * cloud2, 0.0), 2.0) * smoothstep(2.5, 0.05, r) * 0.46;
            col += vec3(0.52, 0.82, 1.00) * pow(max(1.0 - r, 0.0), 3.0) * 0.24;

            vec2 g1 = rotate2((p - vec2(-0.34 + 0.020 * sin(t * 0.030), 0.18 + 0.014 * cos(t * 0.034))) * 2.65, -0.36 + t * 0.024 + 0.055 * sin(t * 0.052));
            g1.x *= 1.26;
            float g1r = length(g1);
            float g1a = atan(g1.y, g1.x);
            float g1arms = pow(0.5 + 0.5 * cos(g1a * 2.0 + log(g1r + 0.055) * 4.8 - t * 0.135), 7.5);
            float g1disk = exp(-g1r * g1r * 1.15);
            float g1core = exp(-g1r * g1r * 17.0);
            float g1dust = smoothstep(0.32, 0.92, fbm(g1 * 8.0 + vec2(t * 0.026, -t * 0.020)));
            col += (vec3(1.0, 0.92, 0.74) * g1core * 1.25 + vec3(0.32, 0.52, 1.0) * g1arms * g1disk * (0.55 + 0.45 * fbm(g1 * 18.0 + vec2(t * 0.030, -t * 0.018))) - vec3(0.020, 0.034, 0.052) * g1dust * g1disk * 0.38) * mix(0.42, 1.05, deep);

            vec2 g2 = rotate2((p - vec2(0.47 + 0.014 * cos(t * 0.029), -0.22 + 0.018 * sin(t * 0.033))) * 3.65, 0.72 - t * 0.019 + 0.050 * sin(t * 0.048));
            g2.x *= 1.34;
            float g2r = length(g2);
            float g2a = atan(g2.y, g2.x);
            float g2arms = pow(0.5 + 0.5 * cos(g2a * 2.0 + log(g2r + 0.060) * 4.4 + t * 0.115), 8.0);
            float g2disk = exp(-g2r * g2r * 1.20);
            float g2core = exp(-g2r * g2r * 19.0);
            col += (vec3(0.86, 0.94, 1.0) * g2core + vec3(0.72, 0.34, 1.0) * g2arms * g2disk * (0.50 + 0.50 * fbm(g2 * 16.0 + vec2(-t * 0.024, t * 0.020)))) * mix(0.24, 0.72, deep);

            vec2 g3 = rotate2((p - vec2(0.08 + 0.016 * sin(t * 0.025), 0.02 + 0.012 * cos(t * 0.031))) * 1.42, 0.10 + t * 0.014 + 0.042 * sin(t * 0.040));
            g3.x *= 1.18;
            float g3r = length(g3);
            float g3a = atan(g3.y, g3.x);
            float g3arms = pow(0.5 + 0.5 * cos(g3a * 2.0 + log(g3r + 0.050) * 5.2 - t * 0.095), 7.0);
            float g3disk = exp(-g3r * g3r * 1.08);
            float g3core = exp(-g3r * g3r * 15.5);
            col += (vec3(1.0, 0.86, 0.58) * g3core * 0.92 + vec3(0.20, 0.46, 0.95) * g3arms * g3disk * (0.55 + 0.45 * fbm(g3 * 15.0 + vec2(t * 0.022, t * 0.018)))) * mix(0.16, 0.86, deep);

            vec2 drift = rotate2(p * mix(1.2, 2.15, deep), t * 0.020) + normalize(p + vec2(0.001)) * (travel * 0.055);
            float stars = 0.0;

            float ring = 1.0 - smoothstep(0.010, 0.040, abs(sin((r * 4.2 - travel * 0.55 + t * 0.035) * PI)));
            ring *= smoothstep(0.0, 0.55, r) * smoothstep(2.8, 0.85, r);
            col += ring * vec3(0.22, 0.50, 1.0) * 0.08;
            col += exp(-r * r * 1.85) * vec3(0.10, 0.24, 0.54) * (0.24 + 0.09 * sin(t * 0.05));
            return col;
        }

        vec3 supernovaBloom(vec2 p, float t, float postTime) {
            vec3 col = vec3(0.0);
            for (int i = 0; i < 2; i++) {
                float fi = float(i);
                vec2 center = vec2(-0.48 + fi * 0.46, 0.18 * sin(fi * 2.1 + 0.6));
                center += vec2(0.045 * sin(t * (0.014 + fi * 0.004)), 0.034 * cos(t * (0.017 + fi * 0.004)));
                float phase = fract(postTime * (0.0042 + fi * 0.0012) + fi * 0.31);
                float active = smoothstep(0.04, 0.18, phase) * (1.0 - smoothstep(0.52, 0.92, phase));
                float radius = mix(0.030, 0.26, phase);
                vec2 q = p - center;
                float d = length(q);
                float core = exp(-d * d * 110.0) * (1.0 - smoothstep(0.14, 0.42, phase));
                float shell = exp(-abs(d - radius) * 34.0) * active;
                float gas = fbm(q * 8.5 + vec2(t * 0.014, -t * 0.010));
                col += vec3(0.95, 0.58, 0.24) * core * active * 0.34;
                col += mix(vec3(0.10, 0.30, 0.86), vec3(0.38, 0.12, 0.64), gas) * shell * (0.12 + 0.34 * gas);
                col += vec3(0.34, 0.56, 0.92) * exp(-d * d * 8.5) * active * 0.035;
            }
            return col;
        }

        float movingParticleLayer(vec2 p, float t, float journey, float scale, float speed, float threshold) {
            vec2 dir = normalize(p + vec2(0.001, -0.002));
            vec2 q = rotate2(p, t * 0.018 + journey * 0.006);
            q += dir * (journey * speed);
            q *= scale;
            vec2 id = floor(q);
            vec2 cell = fract(q) - 0.5;
            float rnd = hash(id);
            vec2 seed = vec2(hash(id + vec2(4.7, 1.3)), hash(id + vec2(8.1, 5.9))) - 0.5;
            seed += 0.18 * vec2(sin(t * (0.24 + rnd * 0.34) + rnd * TAU), cos(t * (0.19 + rnd * 0.28) + rnd * 5.4));
            float d = length(cell - seed * 0.52);
            float size = mix(0.030, 0.090, hash(id + vec2(2.6, 7.4)));
            float star = smoothstep(size, 0.0, d) * step(threshold, rnd);
            float twinkle = 0.58 + 0.42 * sin(t * (0.38 + rnd * 0.7) + rnd * TAU + journey * 0.028);
            return star * twinkle;
        }

        float cosmicWebLayer(vec2 p, float t, float journey) {
            vec2 q = rotate2(p * 3.2, -0.24 + t * 0.010 + journey * 0.004);
            float n1 = fbm(q * 1.7 + vec2(t * 0.018, -journey * 0.010));
            float n2 = fbm(rotate2(q * 2.4, 0.72) + vec2(-t * 0.014, journey * 0.008));
            float web = 1.0 - smoothstep(0.018, 0.120, abs(n1 - n2));
            web *= smoothstep(0.18, 0.86, n1) * smoothstep(0.22, 0.90, n2);
            web *= 1.0 - smoothstep(1.42, 2.28, length(p));
            return web;
        }

        vec3 particleCosmos(vec2 p, float t, float journey) {
            float reveal = smoother(0.0, 30.0, journey);
            float r = length(p);
            float wide = 1.0 - smoothstep(1.46, 2.42, r);
            float near = movingParticleLayer(p, t, journey, 34.0, 0.060, 0.912);
            float mid = movingParticleLayer(rotate2(p * 0.72, 0.45), t * 0.82, journey, 58.0, -0.035, 0.946);
            float fine = movingParticleLayer(p + vec2(0.12 * sin(t * 0.018), 0.08 * cos(t * 0.016)), t, journey, 92.0, 0.022, 0.974);
            float web = cosmicWebLayer(p, t, journey);
            float shell = exp(-abs(r - mix(0.74, 1.24, reveal)) * mix(7.0, 3.2, reveal));
            float centerBloom = exp(-r * r * 3.6) * (0.15 + 0.85 * reveal);
            vec3 col = vec3(0.0);
            col += vec3(0.64, 0.82, 1.00) * near * (0.32 + 0.50 * reveal) * wide;
            col += vec3(0.72, 0.36, 1.00) * mid * (0.18 + 0.42 * reveal) * wide;
            col += vec3(1.00, 0.76, 0.36) * fine * (0.10 + 0.26 * reveal) * wide;
            col += vec3(0.16, 0.42, 1.00) * web * (0.10 + 0.34 * reveal);
            col += vec3(0.74, 0.88, 1.00) * shell * (0.035 + 0.11 * reveal);
            col += vec3(0.20, 0.42, 0.95) * centerBloom * 0.10;
            return col * reveal;
        }

        vec3 deepCosmosJourney(vec2 p, float t, float postTime) {
            float journey = max(postTime, 0.0);
            float zoom = min(1.0 + journey * 0.010, 4.8);
            vec2 drift = vec2(0.038 * sin(t * 0.022), 0.030 * cos(t * 0.019));
            vec2 journeyP = (p + drift) / zoom;
            float r = length(p);
            float angle = atan(p.y, p.x);
            float radialDepth = 0.78 / (r + 0.14) + journey * 0.070;
            float flow = fbm(vec2(cos(angle), sin(angle)) * 2.7 + vec2(radialDepth * 0.18, t * 0.014));
            float veil = smoothstep(0.22, 0.86, flow) * (1.0 - smoothstep(0.10, 1.34, r));
            vec2 layer1 = rotate2(journeyP * 1.46, t * 0.020 + journey * 0.010);
            vec2 layer2 = rotate2((journeyP + vec2(0.24, -0.12)) * 2.22, -t * 0.016 - journey * 0.008);
            vec2 layer3 = rotate2((journeyP - vec2(0.30, 0.16)) * 3.65, t * 0.014 + journey * 0.006);
            float dust = fbm(layer1 * 4.2 + vec2(t * 0.020, -t * 0.012));
            float dustFine = fbm(layer2 * 9.0 + vec2(-t * 0.018, t * 0.016));
            float darkLane = smoothstep(0.48, 0.82, dustFine) * (1.0 - smoothstep(0.08, 1.22, r));
            vec3 col = vec3(0.003, 0.007, 0.024);
            col += cosmos(layer1, t + journey * 0.24, 1.0) * 0.55;
            float farArms = pow(0.5 + 0.5 * cos(atan(layer2.y, layer2.x) * 2.0 + log(length(layer2) + 0.08) * 4.1 - t * 0.08), 5.0);
            col += vec3(0.10, 0.28, 0.78) * farArms * exp(-dot(layer2, layer2) * 0.68) * 0.22;
            float starCloud = smoothstep(0.50, 0.88, fbm(layer3 * 5.2 + vec2(t * 0.012, -t * 0.010)));
            col += vec3(0.34, 0.16, 0.60) * starCloud * (1.0 - smoothstep(0.1, 1.4, r)) * 0.12;
            col += mix(vec3(0.035, 0.13, 0.42), vec3(0.30, 0.12, 0.58), flow) * veil * 0.34;
            col += mix(vec3(0.03, 0.18, 0.52), vec3(0.70, 0.36, 0.16), dust) * smoothstep(0.38, 0.90, dust) * 0.12;
            col -= vec3(0.035, 0.045, 0.070) * darkLane * 0.72;
            col += supernovaBloom(journeyP * 1.65, t, journey) * smoothstep(12.0, 58.0, journey);
            float nearStars = starLayer(layer3, 42.0, 0.93, t) * 0.42
                            + starLayer(layer3, 76.0, 0.96, t * 1.3) * 0.28;
            col += vec3(0.92, 0.96, 1.0) * nearStars;
            col = max(col, 0.0);
            col = col / (1.0 + col * 0.82);
            col *= mix(0.92, 1.08, 1.0 - smoothstep(0.15, 1.25, r));
            return col;
        }

        void main() {
            vec2 frag = gl_FragCoord.xy / uResolution.xy;
            vec2 uvTop = vec2(frag.x, 1.0 - frag.y);
            vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
            vec2 p = (frag - 0.5) * aspect;

            float progress = clamp(uProgress, 0.0, 1.0);
            float audioTime = max(uAudioTime, 0.0);
            float motionProgress = clamp(audioTime / 420.0, 0.0, 1.0);
            float zoom = 1.0 + audioTime * (4.40 / 360.0);
            vec2 center = mix(vec2(0.5, 0.5), vec2(0.504, 0.495), smoother(0.0, 26.0, audioTime));
            vec2 imgUV = center + (uvTop - 0.5) * coverScale(uResolution, uImageResolution) / zoom;

            vec3 baseImage = sampleImage(imgUV);
            vec2 eyeLocal = vec2((imgUV.x - 0.504) / 0.310, (imgUV.y - 0.495) / 0.360);
            float eyeDist = length(eyeLocal);
            float eyeMask = 1.0 - smoothstep(0.88, 1.06, eyeDist);
            float pupil = 1.0 - smoothstep(0.24, 1.10, length(vec2(eyeLocal.x * 4.42, eyeLocal.y * 3.60)));
            float reveal = smoother(6.0, 46.0, audioTime);
            float spaceProgress = clamp(audioTime / 240.0, 0.0, 1.0);
            float cosmosFadeStart = 236.0;
            float cosmosFadeEnd = 258.0;
            float cosmosOnly = smoother(cosmosFadeStart, cosmosFadeEnd, audioTime);
            vec3 space = cosmos(rotate2(eyeLocal * 0.90, uTime * 0.018), uTime, spaceProgress);
            float postCosmosTime = max(audioTime - cosmosFadeStart, 0.0);
            float largeScaleFade = smoother(380.0, 408.0, audioTime);
            vec3 fullSpace = vec3(0.0);
            if (cosmosOnly > 0.001) {
                fullSpace = deepCosmosJourney(p, uTime, postCosmosTime);
            }
            float largeScaleTime = max(audioTime - 380.0, 0.0);
            vec3 largeScaleSpace = vec3(0.001, 0.004, 0.018);
            largeScaleSpace += vec3(0.010, 0.035, 0.105) * exp(-dot(p, p) * 1.2);
            largeScaleSpace += vec3(0.006, 0.015, 0.040) * (0.5 + 0.5 * sin(uTime * 0.018 + largeScaleTime * 0.010));

            float shimmer = 0.08 + 0.05 * sin(uTime * 0.055 + fbm(imgUV * 30.0) * TAU);
            float overlay = eyeMask * (0.14 + shimmer + reveal * 0.52);
            vec3 col = baseImage;
            
            // Add delicate, twinkling stars that sparkle on the eye image as it zooms
            float imageStars = starLayer(imgUV, 28.0, 0.94, uTime) * 0.6
                             + starLayer(imgUV, 54.0, 0.96, uTime * 1.3) * 0.4;
            col += vec3(0.95, 0.98, 1.0) * imageStars * (1.0 - smoother(6.0, 20.0, audioTime));

            col += space * overlay;
            col += vec3(0.15, 0.38, 0.95) * pupil * eyeMask * (0.07 + 0.05 * sin(uTime * 0.07));
            col = mix(col, space, reveal * eyeMask * 0.30);
            
            // Fade out the eye image starting at 02:20 (140.0s) over 20 seconds, leaving only the space animation
            float eyeFade = smoother(140.0, 160.0, audioTime);
            col = mix(col, space, eyeFade);
            
            col = mix(col, fullSpace, cosmosOnly);
            col = mix(col, largeScaleSpace, largeScaleFade);

            float vignette = smoothstep(1.22, 0.22, length(p));
            col *= mix(0.78, 1.05, vignette);
            col = pow(max(col, 0.0), vec3(0.92));
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

    gl.useProgram(program);

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
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    const uniforms = {
        image: gl.getUniformLocation(program, 'uImage'),
        resolution: gl.getUniformLocation(program, 'uResolution'),
        imageResolution: gl.getUniformLocation(program, 'uImageResolution'),
        time: gl.getUniformLocation(program, 'uTime'),
        audioTime: gl.getUniformLocation(program, 'uAudioTime'),
        progress: gl.getUniformLocation(program, 'uProgress')
    };

    const pointVertexSource = "attribute vec3 aPointPosition;attribute float aPointSize;attribute float aPointSeed;uniform vec2 uPointResolution;uniform float uPointTime;uniform float uPointReveal;uniform float uPointPixelRatio;varying float vPointAlpha;varying float vPointSeed;void main(){vec3 pos=aPointPosition;float t=uPointTime;float travel=t*2.8;pos.z=mod(pos.z+travel+280.0,560.0)-280.0;float scale=1.0+min(t*0.0024,0.34);pos.xy*=scale;pos*=1.0+0.04*sin(t*0.4+aPointSeed*6.2831853);float ay=t*0.02;float cy=cos(ay);float sy=sin(ay);pos=vec3(pos.x*cy-pos.z*sy,pos.y,pos.x*sy+pos.z*cy);float ax=sin(t*0.05)*0.05;float cx=cos(ax);float sx=sin(ax);pos=vec3(pos.x,pos.y*cx-pos.z*sx,pos.y*sx+pos.z*cx);pos.z-=220.0;float z=-pos.z;if(z<10.0){vPointAlpha=0.0;gl_Position=vec4(2.0,2.0,0.0,1.0);gl_PointSize=0.0;vPointSeed=aPointSeed;return;}float aspect=uPointResolution.x/uPointResolution.y;float projection=1.7320508;vec2 clip=vec2((pos.x/z)*projection/aspect,(pos.y/z)*projection);gl_Position=vec4(clip,0.0,1.0);gl_PointSize=aPointSize*(300.0/z)*uPointPixelRatio*(1.0+min(t*0.0018,0.22));float dist=length(pos);float depthAlpha=clamp(1.0-(dist-50.0)/350.0,0.05,1.0);float edge=1.0-smoothstep(1.15,1.72,length(clip));vPointAlpha=uPointReveal*depthAlpha*edge;vPointSeed=aPointSeed;}";
    const pointFragmentSource = "precision highp float;varying float vPointAlpha;varying float vPointSeed;uniform float uPointTime;void main(){vec2 c=gl_PointCoord-vec2(0.5);float d=length(c);if(d>0.5){discard;}float core=smoothstep(0.5,0.0,d);vec3 cool=vec3(0.42,0.64,0.96);vec3 violet=vec3(0.55,0.38,0.92);vec3 col=mix(cool,violet,fract(vPointSeed*7.13));col*=0.85+vPointSeed*0.3;float flick=1.0+0.28*sin(uPointTime*3.0+vPointSeed*30.0);gl_FragColor=vec4(col*core*flick,vPointAlpha*core);}";

    const linkProgram = (vertexText, fragmentText) => {
        const vertexShader = compileShader(gl.VERTEX_SHADER, vertexText);
        const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentText);
        const linkedProgram = gl.createProgram();
        gl.attachShader(linkedProgram, vertexShader);
        gl.attachShader(linkedProgram, fragmentShader);
        gl.linkProgram(linkedProgram);

        if (!gl.getProgramParameter(linkedProgram, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(linkedProgram) || "Shader link failed.");
        }

        return linkedProgram;
    };

    let pointProgram;

    try {
        pointProgram = linkProgram(pointVertexSource, pointFragmentSource);
    } catch (error) {
        frame.classList.add("is-cosmic-fallback");
        return;
    }

    const pointAttribs = {
        position: gl.getAttribLocation(pointProgram, "aPointPosition"),
        size: gl.getAttribLocation(pointProgram, "aPointSize"),
        seed: gl.getAttribLocation(pointProgram, "aPointSeed")
    };
    const pointUniforms = {
        resolution: gl.getUniformLocation(pointProgram, "uPointResolution"),
        time: gl.getUniformLocation(pointProgram, "uPointTime"),
        reveal: gl.getUniformLocation(pointProgram, "uPointReveal"),
        pixelRatio: gl.getUniformLocation(pointProgram, "uPointPixelRatio")
    };
    const pointCount = 12000;
    const pointPositions = new Float32Array(pointCount * 3);
    const pointSizes = new Float32Array(pointCount);
    const pointSeeds = new Float32Array(pointCount);
    let pointSeedState = 246813579;
    const pointRandom = () => {
        pointSeedState = ((pointSeedState * 1664525) + 1013904223) >>> 0;
        return pointSeedState / 4294967296;
    };

    for (let i = 0; i < pointCount; i += 1) {
        const radius = 5 + pointRandom() * 280;
        const theta = pointRandom() * Math.PI * 2;
        const phi = Math.acos((2 * pointRandom()) - 1);
        const sinPhi = Math.sin(phi);
        pointPositions[i * 3] = radius * sinPhi * Math.cos(theta);
        pointPositions[(i * 3) + 1] = radius * sinPhi * Math.sin(theta);
        pointPositions[(i * 3) + 2] = radius * Math.cos(phi);
        pointSizes[i] = 0.5 + pointRandom() * 2.0;
        pointSeeds[i] = pointRandom();
    }

    const pointPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pointPositions, gl.STATIC_DRAW);
    const pointSizeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointSizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pointSizes, gl.STATIC_DRAW);
    const pointSeedBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointSeedBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pointSeeds, gl.STATIC_DRAW);
    const smoothStepValue = (edge0, edge1, value) => {
        const x = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
        return x * x * (3 - (2 * x));
    };

    let uploaded = false;
    let uploadedImage = null;
    let rafId = 0;
    let running = false;
    let renderedOnce = false;
    let visibleOnce = false;
    let revealTimer = 0;
    let lastDrawTime = 0;
    const revealCanvasAt = 0;
    const frameInterval = 0;
    const startTime = performance.now();

    const getClockSourceTime = () => {
        const visualTime = Number(audio.dataset.puVisualTime);

        if ((audio.dataset.puSeeking === 'true' || audio.dataset.puVisualActive === 'true') && Number.isFinite(visualTime)) {
            return visualTime;
        }

        return audio.currentTime || 0;
    };

    const isVisualExtensionActive = () => audio.dataset.puVisualActive === 'true';

    // Browser media currentTime can be delivered in coarse chunks. Keep a
    // rAF-driven visual clock for playback, then only snap it on seeks or large
    // drift so the eye zoom never pauses between media timeupdate events.
    let smoothVisualTime = getClockSourceTime();
    let smoothVisualRealTime = performance.now();
    let smoothVisualRunning = false;

    const resetSmoothVisualClock = (time = getClockSourceTime(), now = performance.now()) => {
        smoothVisualTime = Math.max(0, time);
        smoothVisualRealTime = now;
        smoothVisualRunning = !audio.paused && !audio.ended && !isVisualExtensionActive();
    };

    const getSmoothVisualTime = (now = performance.now()) => {
        const sourceTime = Math.max(0, getClockSourceTime());
        const playbackRate = Number.isFinite(audio.playbackRate) && audio.playbackRate > 0 ? audio.playbackRate : 1;

        if (audio.dataset.puSeeking === 'true' || isVisualExtensionActive() || audio.paused || audio.ended) {
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

        if (Math.abs(drift) > 1.5) {
            smoothVisualTime = sourceTime;
        } else if (Math.abs(drift) > 0.08) {
            smoothVisualTime += drift * Math.min(0.035, delta * 0.18);
        }

        return Math.max(0, smoothVisualTime);
    };

    const maybeResetSmoothVisualClock = () => {
        if (audio.paused || audio.ended || audio.dataset.puSeeking === 'true' || isVisualExtensionActive()) {
            resetSmoothVisualClock();
        }
    };

    const resetSmoothVisualClockNow = () => resetSmoothVisualClock();

    audio.addEventListener('timeupdate', maybeResetSmoothVisualClock);
    audio.addEventListener('seeking', resetSmoothVisualClockNow);
    audio.addEventListener('seeked', resetSmoothVisualClockNow);
    audio.addEventListener('play', resetSmoothVisualClockNow);
    audio.addEventListener('pause', resetSmoothVisualClockNow);
    audio.addEventListener('ended', resetSmoothVisualClockNow);
    audio.addEventListener('ratechange', resetSmoothVisualClockNow);

    const fallbackDuration = 520;
    const visualDuration = 525;

    const getTextureImage = () => {
        if (fullscreenImage && !fullscreenImage.hidden && fullscreenImage.naturalWidth && fullscreenImage.naturalHeight) {
            return fullscreenImage;
        }

        return image;
    };

    const uploadImage = () => {
        const textureImage = getTextureImage();

        if (!textureImage.naturalWidth || !textureImage.naturalHeight) {
            return false;
        }

        if (uploaded && uploadedImage === textureImage) {
            return true;
        }

        try {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage);
            gl.useProgram(program);
            gl.uniform1i(uniforms.image, 0);
            gl.uniform2f(uniforms.imageResolution, textureImage.naturalWidth, textureImage.naturalHeight);
            uploadedImage = textureImage;
            return true;
        } catch (e) {
            console.warn("WebGL texture upload failed (possibly due to local file protocol CORS restrictions). Falling back to static high-resolution image.", e);
            frame.classList.add('is-cosmic-fallback');
            // Remove cosmic visible classes to show the fallback static image
            frame.classList.remove('has-cosmic-visible');
            frame.classList.remove('has-cosmic-webgl');
            return false;
        }
    };

    const getDuration = () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
            return audio.duration;
        }

        return fallbackDuration;
    };

    const getVisualTime = () => {
        const audioTime = audio.currentTime || 0;
        const visualTime = Number(audio.dataset.puVisualTime);
        const isSeeking = audio.dataset.puSeeking === 'true';

        if (isSeeking && Number.isFinite(visualTime)) {
            return visualTime;
        }

        return Number.isFinite(visualTime) && visualTime > audioTime ? visualTime : audioTime;
    };

    const getProgress = (time = getVisualTime()) => Math.max(0, Math.min(time / Math.max(getDuration(), visualDuration), 1));

    const getRenderScale = (rect) => {
        const cssPixels = Math.max(1, rect.width * rect.height);
        const maxPixels = 620000;
        let dpr = Math.min(window.devicePixelRatio || 1, 1);

        if (cssPixels * dpr * dpr > maxPixels) {
            dpr = Math.sqrt(maxPixels / cssPixels);
        }

        return Math.max(0.55, dpr);
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

    const drawDescentPoints = (time, audioTime) => {
        const reveal = smoothStepValue(380, 408, audioTime);

        if (reveal <= 0.001) {
            return;
        }

        const pointTime = Math.max(0, audioTime - 380);
        const rect = canvas.getBoundingClientRect();
        const pixelRatio = rect.width ? Math.max(0.55, canvas.width / rect.width) : 1;
        gl.useProgram(pointProgram);
        gl.uniform2f(pointUniforms.resolution, canvas.width, canvas.height);
        gl.uniform1f(pointUniforms.time, pointTime + (time * 0.08));
        gl.uniform1f(pointUniforms.reveal, reveal);
        gl.uniform1f(pointUniforms.pixelRatio, pixelRatio);
        gl.bindBuffer(gl.ARRAY_BUFFER, pointPositionBuffer);
        gl.enableVertexAttribArray(pointAttribs.position);
        gl.vertexAttribPointer(pointAttribs.position, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, pointSizeBuffer);
        gl.enableVertexAttribArray(pointAttribs.size);
        gl.vertexAttribPointer(pointAttribs.size, 1, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, pointSeedBuffer);
        gl.enableVertexAttribArray(pointAttribs.seed);
        gl.vertexAttribPointer(pointAttribs.seed, 1, gl.FLOAT, false, 0, 0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.drawArrays(gl.POINTS, 0, pointCount);
        gl.disable(gl.BLEND);
    };

    const render = (now) => {
        if (frameInterval > 0 && running && lastDrawTime && now - lastDrawTime < frameInterval) {
            rafId = requestAnimationFrame(render);
            return;
        }

        lastDrawTime = now;

        if (!uploaded) {
            uploaded = uploadImage();
        }

        if (!uploaded) {
            rafId = 0;
            return;
        }

        resize();
        gl.clear(gl.COLOR_BUFFER_BIT);
        const elapsedTime = (now - startTime) / 1000;
        
        const audioTime = getSmoothVisualTime(now);

        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.disable(gl.BLEND);
        gl.uniform1f(uniforms.time, elapsedTime);
        gl.uniform1f(uniforms.audioTime, audioTime);
        gl.uniform1f(uniforms.progress, getProgress(audioTime));
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        drawDescentPoints(elapsedTime, audioTime);

        if (!renderedOnce) {
            renderedOnce = true;
            frame.classList.add('has-cosmic-webgl');
        }

        if (!visibleOnce && audioTime >= revealCanvasAt) {
            visibleOnce = true;
            frame.classList.add('has-cosmic-visible');
        }

        running = shouldAnimateCanvas();

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

    const clearRevealTimer = () => {
        if (revealTimer) {
            window.clearTimeout(revealTimer);
            revealTimer = 0;
        }
    };

    const shouldAnimateCanvas = () => (isVisualExtensionActive() || (!audio.paused && !audio.ended)) && (getVisualTime() >= revealCanvasAt - 0.25 || visibleOnce);

    const scheduleRevealRender = () => {
        clearRevealTimer();

        if ((audio.paused && !isVisualExtensionActive()) || (audio.ended && !isVisualExtensionActive()) || visibleOnce) {
            return;
        }

        const delay = Math.max(250, ((revealCanvasAt - 0.25) - getVisualTime()) * 1000);
        revealTimer = window.setTimeout(() => {
            revealTimer = 0;
            syncPlayback();
        }, delay);
    };

    const syncPlayback = () => {
        running = shouldAnimateCanvas();

        if (running) {
            requestRender();
        } else if (!audio.paused && !audio.ended) {
            scheduleRevealRender();
        } else {
            clearRevealTimer();
            requestRender();
        }
    };

    audio.addEventListener('play', syncPlayback);
    audio.addEventListener('pause', syncPlayback);
    audio.addEventListener('ended', syncPlayback);
    audio.addEventListener('loadedmetadata', requestRender);
    audio.addEventListener('seeked', requestRender);
    audio.addEventListener('timeupdate', () => {
        if (audio.paused) {
            requestRender();
        }
    });
    window.addEventListener('resize', requestRender, { passive: true });
    document.addEventListener('pu:visual-resolution-change', () => {
        uploaded = false;
        requestRender();
    });

    if (image.complete) {
        syncPlayback();
    } else {
        image.addEventListener('load', syncPlayback, { once: true });
    }
    };

    const runWhenIdle = () => {
        if (window.requestIdleCallback) {
            window.requestIdleCallback(initCosmicLayer);
        } else {
            window.setTimeout(initCosmicLayer, 0);
        }
    };

    const scheduleCosmicInit = (delay, preferIdle = true) => {
        if (initialized || initTimer) {
            return;
        }

        initTimer = window.setTimeout(() => {
            initTimer = 0;
            if (preferIdle) {
                runWhenIdle();
            } else {
                initCosmicLayer();
            }
        }, delay);
    };

    if (document.readyState === 'loading') {
        window.addEventListener('load', () => scheduleCosmicInit(2200), { once: true });
    } else if (!audio.paused && !audio.ended) {
        scheduleCosmicInit(0, false);
    }

    audio.addEventListener('play', () => scheduleCosmicInit(0, false), { once: true });
})();
