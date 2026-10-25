(function () {
    if (!window.THREE) return;
    const container = document.getElementById('light-pillar');
    if (!container) return;

    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        container.style.display = 'none';
        return;
      }
    } catch (e) {
      container.style.display = 'none';
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      container.style.display = 'none';
      return;
    }

    const props = {
      topColor: '#FF2D00',
      bottomColor: '#4a0d00',
      intensity: 0.4,
      rotationSpeed: 0.35,
      interactive: false,
      glowAmount: 0.004,
      pillarWidth: 2.5,
      pillarHeight: 0.35,
      noiseIntensity: 0.3,
      mixBlendMode: 'screen',
      pillarRotation: 0,
      quality: 'high'
    };

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEndDevice = isMobile || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

    let effectiveQuality = props.quality;
    if (isLowEndDevice && effectiveQuality === 'high') effectiveQuality = 'medium';
    if (isMobile && effectiveQuality !== 'low') effectiveQuality = 'low';

    const qualitySettings = {
      low: { iterations: 24, waveIterations: 1, pixelRatio: 0.5, precision: 'mediump', stepMultiplier: 1.5 },
      medium: { iterations: 40, waveIterations: 2, pixelRatio: 0.65, precision: 'mediump', stepMultiplier: 1.2 },
      high: { iterations: 80, waveIterations: 4, pixelRatio: Math.min(window.devicePixelRatio || 1, 2), precision: 'highp', stepMultiplier: 1.0 }
    };
    const settings = qualitySettings[effectiveQuality] || qualitySettings.medium;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: effectiveQuality === 'high' ? 'high-performance' : 'low-power',
        precision: settings.precision,
        stencil: false,
        depth: false
      });
    } catch (e) {
      container.style.display = 'none';
      return;
    }

    renderer.setPixelRatio(settings.pixelRatio);
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const parseColor = hex => {
      const c = new THREE.Color(hex);
      return new THREE.Vector3(c.r, c.g, c.b);
    };

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision ${settings.precision} float;

      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform vec3 uTopColor;
      uniform vec3 uBottomColor;
      uniform float uIntensity;
      uniform bool uInteractive;
      uniform float uGlowAmount;
      uniform float uPillarWidth;
      uniform float uPillarHeight;
      uniform float uNoiseIntensity;
      uniform float uRotCos;
      uniform float uRotSin;
      uniform float uPillarRotCos;
      uniform float uPillarRotSin;
      uniform float uWaveSin;
      uniform float uWaveCos;
      varying vec2 vUv;

      const float STEP_MULT = ${settings.stepMultiplier.toFixed(1)};
      const int MAX_ITER = ${settings.iterations};
      const int WAVE_ITER = ${settings.waveIterations};

      void main() {
        vec2 uv = (vUv * 2.0 - 1.0) * vec2(uResolution.x / uResolution.y, 1.0);
        uv = vec2(uPillarRotCos * uv.x - uPillarRotSin * uv.y, uPillarRotSin * uv.x + uPillarRotCos * uv.y);

        vec3 ro = vec3(0.0, 0.0, -10.0);
        vec3 rd = normalize(vec3(uv, 1.0));

        float rotC = uRotCos;
        float rotS = uRotSin;
        if(uInteractive && (uMouse.x != 0.0 || uMouse.y != 0.0)) {
          float a = uMouse.x * 6.283185;
          rotC = cos(a);
          rotS = sin(a);
        }

        vec3 col = vec3(0.0);
        float t = 0.1;

        for(int i = 0; i < MAX_ITER; i++) {
          vec3 p = ro + rd * t;
          p.xz = vec2(rotC * p.x - rotS * p.z, rotS * p.x + rotC * p.z);

          vec3 q = p;
          q.y = p.y * uPillarHeight + uTime;

          float freq = 1.0;
          float amp = 1.0;
          for(int j = 0; j < WAVE_ITER; j++) {
            q.xz = vec2(uWaveCos * q.x - uWaveSin * q.z, uWaveSin * q.x + uWaveCos * q.z);
            q += cos(q.zxy * freq - uTime * float(j) * 2.0) * amp;
            freq *= 2.0;
            amp *= 0.5;
          }

          float d = length(cos(q.xz)) - 0.2;
          float bound = length(p.xz) - uPillarWidth;
          float k = 4.0;
          float h = max(k - abs(d - bound), 0.0);
          d = max(d, bound) + h * h * 0.0625 / k;
          d = abs(d) * 0.15 + 0.01;

          float grad = clamp((15.0 - p.y) / 30.0, 0.0, 1.0);
          col += mix(uBottomColor, uTopColor, grad) / d;

          t += d * STEP_MULT;
          if(t > 50.0) break;
        }

        float widthNorm = uPillarWidth / 3.0;
        col = tanh(col * uGlowAmount / widthNorm);

        col -= fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) / 15.0 * uNoiseIntensity;

        gl_FragColor = vec4(col * uIntensity, 1.0);
      }
    `;

    const pillarRotRad = (props.pillarRotation * Math.PI) / 180;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uTopColor: { value: parseColor(props.topColor) },
        uBottomColor: { value: parseColor(props.bottomColor) },
        uIntensity: { value: props.intensity },
        uInteractive: { value: props.interactive },
        uGlowAmount: { value: props.glowAmount },
        uPillarWidth: { value: props.pillarWidth },
        uPillarHeight: { value: props.pillarHeight },
        uNoiseIntensity: { value: props.noiseIntensity },
        uRotCos: { value: 1.0 },
        uRotSin: { value: 0.0 },
        uPillarRotCos: { value: Math.cos(pillarRotRad) },
        uPillarRotSin: { value: Math.sin(pillarRotRad) },
        uWaveSin: { value: Math.sin(0.4) },
        uWaveCos: { value: Math.cos(0.4) }
      },
      transparent: true,
      depthWrite: false,
      depthTest: false
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let lastTime = performance.now();
    const targetFPS = effectiveQuality === 'low' ? 30 : 60;
    const frameTime = 1000 / targetFPS;
    const timeValue = { value: 0 };

    const animate = currentTime => {
      const deltaTime = currentTime - lastTime;
      if (deltaTime >= frameTime) {
        timeValue.value += 0.016 * props.rotationSpeed;
        const t = timeValue.value;
        material.uniforms.uTime.value = t;
        material.uniforms.uRotCos.value = Math.cos(t * 0.3);
        material.uniforms.uRotSin.value = Math.sin(t * 0.3);
        renderer.render(scene, camera);
        lastTime = currentTime - (deltaTime % frameTime);
      }
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    let resizeTimeout = null;
    window.addEventListener('resize', () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        renderer.setSize(newWidth, newHeight);
        material.uniforms.uResolution.value.set(newWidth, newHeight);
      }, 150);
    }, { passive: true });
  })();