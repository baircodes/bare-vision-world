import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  300
);
camera.position.set(0, 0, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById("three-container").appendChild(renderer.domElement);

const geo = new THREE.SphereGeometry(120, 64, 64);
const mat = new THREE.MeshBasicMaterial({ color: "#0a0a0f", side: THREE.BackSide });
const sky = new THREE.Mesh(geo, mat);
scene.add(sky);

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
