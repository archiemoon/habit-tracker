(function() {
    const { Renderer, Program, Mesh, Color, Triangle } = window.ogl;

    const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}`;

    const fragmentShader = `
precision highp float;
uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;
varying vec2 vUv;
void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;
  uv += (uMouse - vec2(0.5)) * uAmplitude;
  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5, sin(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  gl_FragColor = vec4(col, 1.0);
}`;

    const container = document.getElementById("bg");

    const renderer = new Renderer({ dpr: window.devicePixelRatio });
    container.appendChild(renderer.gl.canvas);

    const gl = renderer.gl;
    gl.clearColor(0,0,0,1); // black background

    const geometry = new Triangle(gl);

    const program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new Color(0.8,0.5,1.0) }, // bright iridescent base
            uResolution: { value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height) },
            uMouse: { value: new Float32Array([0.5,0.5]) },
            uAmplitude: { value: 0.05 },
            uSpeed: { value: 1.0 }
        }
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        program.uniforms.uResolution.value = new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height);
    }
    window.addEventListener("resize", resize);
    resize();

    function animate(t) {
        program.uniforms.uTime.value = t * 0.001;
        renderer.render({ scene: mesh });
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    // mouse interaction
    container.addEventListener("mousemove", (e) => {
        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = 1 - (e.clientY - rect.top) / rect.height;
        program.uniforms.uMouse.value[0] = x;
        program.uniforms.uMouse.value[1] = y;
    });
})();
