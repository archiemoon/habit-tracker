// background.js
import { Renderer, Program, Mesh, Triangle } from 'https://cdn.skypack.dev/ogl';

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
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;
uniform float uBlur; // new blur uniform

varying vec2 vUv;

// Function to get base color with waves
vec3 getColor(vec2 uv) {
    float mr = min(uResolution.x, uResolution.y);
    uv = (uv * 2.0 - 1.0) * uResolution.xy / mr;

    // Wave distortions
    float waveX = sin(uv.y * 6.0 + uTime * uSpeed) * 0.03;
    float waveY = cos(uv.x * 6.0 + uTime * uSpeed * 0.9) * 0.03;
    uv.x += waveX;
    uv.y += waveY;

    // Light blue → dark blue → purple
    float red = 0.3 + 0.3 * cos(uTime * 0.8 + uv.x);
    float green = 0.4 + 0.4 * cos(uTime * 0.6 + uv.y);
    float blue = 0.6 + 0.4 * cos(uTime * 0.7 + uv.x + uv.y);
    return vec3(red, green, blue);
}

void main() {
    vec2 uv = vUv;

    // Apply blur by averaging neighboring pixels
    vec3 color = vec3(0.0);
    float count = 0.0;
    for(float x = -2.0; x <= 2.0; x += 1.0) {
        for(float y = -2.0; y <= 2.0; y += 1.0) {
            vec2 offset = vec2(x, y) * uBlur / uResolution.xy;
            color += getColor(uv + offset);
            count += 1.0;
        }
    }
    color /= count;

    gl_FragColor = vec4(color, 1.0);
}
`;

const container = document.getElementById("bg");
const renderer = new Renderer({ dpr: window.devicePixelRatio });
container.appendChild(renderer.gl.canvas);
const gl = renderer.gl;

const geometry = new Triangle(gl);

const program = new Program(gl, {
  vertex: vertexShader,
  fragment: fragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uResolution: { value: new Float32Array([gl.canvas.width, gl.canvas.height]) },
    uMouse: { value: new Float32Array([0.5, 0.5]) },
    uAmplitude: { value: 0.05 },
    uSpeed: { value: 0.1 }, // slower movement
    uBlur: { value: 0 } // adjust for blur strength
  }
});

const mesh = new Mesh(gl, { geometry, program });

function resize() {
  renderer.setSize(container.offsetWidth, container.offsetHeight);
  program.uniforms.uResolution.value = new Float32Array([gl.canvas.width, gl.canvas.height]);
}

window.addEventListener("resize", resize);
resize();

function animate(t) {
  program.uniforms.uTime.value = t * 0.001;
  renderer.render({ scene: mesh });
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// Optional: mouse interaction
container.addEventListener("mousemove", (e) => {
  const rect = container.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = 1 - (e.clientY - rect.top) / rect.height;
  program.uniforms.uMouse.value[0] = x;
  program.uniforms.uMouse.value[1] = y;
});
