/* =========================
   BARE VISION — main3d.js
   Engine: Lenis Scroll + Pearls
   ========================= */

// 1. Initialize Lenis (The Smooth Scroll)
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential easing
  direction: 'vertical', 
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
});

const sky = document.getElementById("sky");
const orbLayer = document.getElementById("orb-layer");
const loader = document.getElementById("page-loader");

// --- PEARL ENGINE ---
const PEARL_COUNT = 8; // Fewer, more impactful pearls
const pearls = [];

function spawnPearls(){
  const w = window.innerWidth;
  const h = window.innerHeight;

  for(let i=0; i<PEARL_COUNT; i++){
    const el = document.createElement("div");
    el.className = "pearl";
    const size = 18 + Math.random() * 24; // Larger, statement jewelry size
    el.style.setProperty("--s", size + "px");

    const startX = Math.random() * w;
    const startY = h * (0.1 + Math.random() * 0.9);

    el.style.transform = `translate3d(${startX}px, ${startY}px, 0)`;

    pearls.push({
      el,
      baseX: startX,
      baseY: startY,
      speed: 0.0001 + Math.random() * 0.0003, // Slower, heavier movement
      driftRange: 30 + Math.random() * 40,
      phase: Math.random() * Math.PI * 2
    });

    orbLayer.appendChild(el);
  }
}
spawnPearls();

function spawnSun(){
  const img = document.createElement("img");
  img.src = "assets/sun-soft.svg"; 
  img.className = "sun-orb";
  Object.assign(img.style, {
    position:"fixed", width:"300px", height:"300px",
    left:"50%", top:"40%", transform:"translate(-50%, -50%)",
    opacity:"0.4", pointerEvents:"none", filter:"blur(50px)", zIndex: "-9"
  });
  if(orbLayer) orbLayer.appendChild(img);
}
spawnSun();


// --- UNIFIED ANIMATION LOOP ---
function animate(time) {
  // A. Update Lenis Scroll
  lenis.raf(time);

  // B. Update Pearls
  for(let i=0; i < pearls.length; i++){
    const p = pearls[i];
    const offsetX = Math.sin(time * p.speed + p.phase) * p.driftRange;
    const offsetY = Math.cos(time * p.speed * 0.7 + p.phase) * (p.driftRange * 0.6);
    p.el.style.transform = `translate3d(${p.baseX + offsetX}px, ${p.baseY + offsetY}px, 0)`;
  }
  
  requestAnimationFrame(animate);
}

// Start the engine
requestAnimationFrame(animate);


// --- OBSERVERS ---
const observerOptions = { threshold: 0.1, rootMargin: "0px" };
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('[data-animate]').forEach(el => io.observe(el));

// --- LOADER EXIT ---
window.addEventListener('load', () => {
    setTimeout(() => {
        loader.classList.add('hidden');
    }, 600);
});
