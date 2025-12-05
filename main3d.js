/* =========================
   BARE VISION — main3d.js
   Engine: GPU Accelerated v2
   ========================= */

const sky = document.getElementById("sky");
const orbLayer = document.getElementById("orb-layer");
const loader = document.getElementById("page-loader");

// --- SKY GRADIENT LOGIC ---
function getSkyGradient() {
  const now = new Date();
  const time = now.getHours() + now.getMinutes() / 60;

  // Day (5am - 5pm): Clean Editorial Light
  if (time >= 5 && time < 17) {
    return { top: "#f5f7fa", mid: "#fdfbf7", bottom: "#eef2f3" };
  }
  // Sunset (5pm - 8pm): Soft Metallic Peach
  if (time >= 17 && time < 20) {
    return { top: "#fdfbf7", mid: "#eceae5", bottom: "#d8dcd6" };
  }
  // Night (8pm - 5am): Deep Deep Navy/Slate (Quiet Luxury Dark Mode)
  return { top: "#1a1c20", mid: "#2b2e33", bottom: "#363a40" };
}

// Apply gradient once on load (could add interval to update if user stays long)
const colors = getSkyGradient();
sky.style.background = `linear-gradient(to bottom, ${colors.top}, ${colors.mid}, ${colors.bottom})`;


// --- ASSETS ---
function spawnSun(){
  const img = document.createElement("img");
  img.src = "assets/sun-soft.svg"; // Ensure this asset exists, or use a CSS fallback div
  img.className = "sun-orb";
  // Static styling in JS for the sun
  Object.assign(img.style, {
    position:"fixed", width:"300px", height:"300px",
    left:"50%", top:"40%", transform:"translate(-50%, -50%)",
    opacity:"0.4", pointerEvents:"none", filter:"blur(40px)", zIndex: "-9"
  });
  orbLayer.appendChild(img);
}
spawnSun();


// --- OPTIMIZED PEARL ENGINE ---
const PEARL_COUNT = 10;
const pearls = [];

function spawnPearls(){
  const w = window.innerWidth;
  const h = window.innerHeight;

  for(let i=0; i<PEARL_COUNT; i++){
    const el = document.createElement("div");
    el.className = "pearl";
    const size = 12 + Math.random() * 16; // Slight variation
    el.style.setProperty("--s", size + "px");

    // Initialize positions
    const startX = Math.random() * w;
    const startY = h * (0.2 + Math.random() * 0.8);

    // Initial placement (off-screen or minimal to avoid FOUC)
    el.style.transform = `translate3d(${startX}px, ${startY}px, 0)`;

    // Push to array with physics properties
    pearls.push({
      el,
      x: startX,
      y: startY,
      baseX: startX,
      baseY: startY,
      speed: 0.0002 + Math.random() * 0.0005,
      driftRange: 20 + Math.random() * 30,
      phase: Math.random() * Math.PI * 2
    });

    orbLayer.appendChild(el);
  }
}
spawnPearls();

function animate(time) {
  // Use 'time' passed by requestAnimationFrame for consistency
  for(let i=0; i < pearls.length; i++){
    const p = pearls[i];

    // Physics: Gentle floating sine wave
    // Horizontal drift
    const offsetX = Math.sin(time * p.speed + p.phase) * p.driftRange;
    // Vertical drift (slow rise)
    const offsetY = Math.cos(time * p.speed * 0.5 + p.phase) * (p.driftRange * 0.5);

    // Apply via Transform (GPU efficient)
    p.el.style.transform = `translate3d(${p.baseX + offsetX}px, ${p.baseY + offsetY}px, 0)`;
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);


// --- OBSERVERS ---
const observerOptions = { threshold: 0.15, rootMargin: "0px 0px -50px 0px" };
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target); // Only animate once
    }
  });
}, observerOptions);

document.querySelectorAll('[data-animate]').forEach(el => io.observe(el));


// --- LOADER EXIT ---
window.addEventListener('load', () => {
    setTimeout(() => {
        loader.classList.add('hidden');
    }, 800);
});
