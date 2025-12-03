import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";

/* =========================================
   1. THREE.JS SETUP (Background Layer)
   ========================================= */
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  300
);
camera.position.set(0, 0, 6);

// Renderer - IMPORTANT: alpha: true makes the canvas transparent
// so your CSS "Futuristic Dunes" background shows through.
const renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Sharpness for high-res screens
document.getElementById("three-container").appendChild(renderer.domElement);

// Window Resize Handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  // (Add rotating 3D objects here later)
  renderer.render(scene, camera);
}
animate();

/* =========================================
   2. DOM LOGIC (Loader & Scroll Reveal)
   ========================================= */

// Wait for the window to fully load
window.addEventListener('load', () => {
    
    // A. Dismiss the Loader
    const loader = document.getElementById('page-loader');
    if (loader) {
        loader.classList.add('hidden');
        
        // Remove it from DOM entirely after transition to free up memory
        setTimeout(() => {
            loader.style.display = 'none';
        }, 800); // Matches CSS transition time
    }

    // B. Trigger the Title Sheen Animation
    const sheen = document.querySelector('.title-sheen');
    if (sheen) {
        setTimeout(() => {
            sheen.classList.add('play');
        }, 1000); // Wait 1s after load
    }
});

// C. Scroll Observer (Reveals sections as you scroll)
const observerOptions = {
    threshold: 0.15 // Trigger when 15% of the element is visible
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Optional: Stop observing once visible to save performance
            observer.unobserve(entry.target); 
        }
    });
}, observerOptions);

// Target all elements with data-animate attribute
document.querySelectorAll('[data-animate]').forEach(el => {
    observer.observe(el);
});
