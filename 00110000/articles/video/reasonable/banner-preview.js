(() => {
    const canvas = document.querySelector('.reasonable-preview-canvas');
    const trigger = canvas ? canvas.closest('.pu-video-trigger') : null;

    if (!canvas || !trigger) {
        return;
    }

    const contextOptions = {
        antialias: false,
        alpha: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance'
    };
    const gl = canvas.getContext('webgl', contextOptions) || canvas.getContext('experimental-webgl', contextOptions);

    if (!gl) {
        trigger.classList.add('is-webgl-preview-fallback');
        return;
    }

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
                p = rotate * p * 2.03;
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
            return 1.0 - smoothstep(width, width * 2.2, sdSegment(p, a, b));
        }

        float ring(vec2 p, float radius, float width) {
            return 1.0 - smoothstep(width, width * 2.4, abs(length(p) - radius));
        }

        float gridField(vec2 p, float scale, float width) {
            vec2 g = abs(fract(p * scale) - 0.5);
            float dist = min(g.x, g.y) / scale;

            return 1.0 - smoothstep(width, width * 2.0, dist);
        }

        vec2 node(float index, float radius, float spin) {
            float angle = (index * 2.3999632) + spin;

            return vec2(cos(angle), sin(angle)) * radius;
        }

        float graph(vec2 p, float time) {
            float spin = time * 0.065;
            float value = 0.0;

            for (int i = 0; i < 12; i++) {
                float fi = float(i);
                vec2 a = node(fi, 0.16 + (0.018 * sin(time * 0.6 + fi)), spin);
                vec2 b = node(fi + 4.0, 0.36 + (0.012 * cos(time * 0.5 + fi)), -spin * 0.72);
                value += lineSegment(p, a, b, 0.0036);
                value += 1.0 - smoothstep(0.01, 0.03, length(p - a));
                value += 0.66 * (1.0 - smoothstep(0.01, 0.034, length(p - b)));
            }

            return value;
        }

        float theorem(vec2 p, float time) {
            vec2 q = rot(0.07 + (time * 0.025)) * (p - vec2(0.02, -0.015));
            float value = 0.0;

            for (int i = 0; i < 6; i++) {
                float fi = float(i);
                value += ring(q, 0.11 + (fi * 0.062), 0.0045 + (fi * 0.0003));
            }

            value += 0.62 * ring(q - vec2(-0.21, 0.04), 0.14, 0.004);
            value += 0.62 * ring(q - vec2(0.24, -0.02), 0.18, 0.004);
            value += 0.42 * lineSegment(q, vec2(-0.38, -0.22), vec2(0.41, 0.22), 0.003);
            value += 0.42 * lineSegment(q, vec2(-0.31, 0.28), vec2(0.37, -0.27), 0.003);

            return value;
        }

        float spiral(vec2 p, float time) {
            float radius = length(p);
            float angle = atan(p.y, p.x);
            float phase = (log(radius + 0.035) * 1.2) + (angle / PI) - (time * 0.075);
            float band = abs(fract(phase * 2.0) - 0.5);

            return (1.0 - smoothstep(0.015, 0.055, band)) * smoothstep(0.04, 0.18, radius) * (1.0 - smoothstep(0.56, 0.82, radius));
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / u_res.xy;
            float aspect = u_res.x / u_res.y;
            vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
            float t = u_time;
            vec2 drift = vec2(sin(t * 0.22), cos(t * 0.18)) * 0.018;
            vec2 fieldP = p + drift;
            float cloud = fbm((fieldP * 2.0) + vec2(t * 0.035, -t * 0.025));
            float fine = fbm((fieldP * 8.0) + vec2(-t * 0.08, t * 0.05));
            float grid = gridField(fieldP, 8.0, 0.0028) + (0.45 * gridField(rot(0.785398) * fieldP, 5.8, 0.0022));
            grid *= 1.0 - smoothstep(0.43, 0.84, length(p));
            float rings = theorem(p, t);
            float proof = graph(p, t);
            float sweep = spiral(p - vec2(0.05, -0.01), t);
            float starSeed = hash(floor((uv * vec2(aspect, 1.0)) * 230.0));
            float stars = smoothstep(0.991, 1.0, starSeed) * (0.55 + (0.45 * sin(t * 1.7 + starSeed * 10.0)));
            stars *= smoothstep(0.12, 0.7, uv.y);

            vec3 ink = vec3(0.010, 0.008, 0.006);
            vec3 ember = vec3(1.0, 0.61, 0.22);
            vec3 ivory = vec3(0.88, 0.95, 0.84);
            vec3 teal = vec3(0.09, 0.82, 0.74);
            vec3 red = vec3(0.88, 0.12, 0.06);
            vec3 violet = vec3(0.22, 0.10, 0.31);

            vec3 color = ink;
            color += violet * pow(cloud, 2.0) * 0.68;
            color += teal * grid * 0.35;
            color += ember * rings * 0.54;
            color += ivory * proof * 0.38;
            color += red * sweep * 0.25;
            color += vec3(1.0, 0.87, 0.58) * stars * 0.72;
            color += teal * fine * 0.035;

            float glow = exp(-dot(p, p) * 5.2);
            color += mix(red, ember, 0.65) * glow * 0.18;
            color *= 1.0 - (0.45 * smoothstep(0.45, 0.9, length(p)));

            gl_FragColor = vec4(color, 1.0);
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
        trigger.classList.add('is-webgl-preview-fallback');
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
        time: gl.getUniformLocation(program, 'u_time')
    };
    const startTime = performance.now();
    let rafId = 0;
    let lastDrawTime = 0;

    const getRenderScale = (rect) => {
        const cssPixels = Math.max(1, rect.width * rect.height);
        const maxPixels = 650000;
        let dpr = Math.min(window.devicePixelRatio || 1, 1.15);

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
        if (!canvas.isConnected) {
            rafId = 0;
            return;
        }

        if (document.hidden) {
            rafId = requestAnimationFrame(render);
            return;
        }

        if (lastDrawTime && now - lastDrawTime < 16) {
            rafId = requestAnimationFrame(render);
            return;
        }

        lastDrawTime = now;
        resize();
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.uniform1f(uniforms.time, (now - startTime) / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        rafId = requestAnimationFrame(render);
    };

    const requestRender = () => {
        if (!rafId) {
            rafId = requestAnimationFrame(render);
        }
    };

    window.addEventListener('resize', requestRender, { passive: true });
    requestRender();
})();
