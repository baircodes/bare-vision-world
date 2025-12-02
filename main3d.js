// ===== THREE.JS MODULE IMPORT ===== //
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";

// ---- SETUP ---- //
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(0, 0, 5);

const renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById("three-container").appendChild(renderer.domElement);

// ---- SKY GRADIENT (Shader) ---- //
const skyGeo = new THREE.SphereGeometry(100, 64, 64);

const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: {
    time: { value: 0.0 },
    sunrise:  { value: new THREE.Color("#ffcf9f") },
    morning:  { value: new THREE.Color("#ffe7c9") },
    sunset:   { value: new THREE.Color("#f9b36d") },
    twilight: { value: new THREE.Color("#2a2d48") }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec3 sunrise;
    uniform vec3 morning;
    uniform vec3 sunset;
    uniform vec3 twilight;
    varying vec2 vUv;

    void main() {
      float t = mod(time * 0.03, 1.0);
      vec3 col;

      if (t < 0.25) {
        col = mix(sunrise, morning, t / 0.25);
      } else if (t < 0.5) {
        col = mix(morning, sunset, (t - 0.25) / 0.25);
      } else if (t < 0.75) {
        col = mix(sunset, twilight, (t - 0.5) / 0.25);
      } else {
        col = mix(twilight, sunrise, (t - 0.75) / 0.25);
      }

      gl_FragColor = vec4(col, 1.0);
    }
  `
});

const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

// ---- ANIMATION LOOP ---- //
function animate() {
  skyMat.uniforms.time.value += 0.002;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

// ---- RESPONSIVENESS ---- //
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
