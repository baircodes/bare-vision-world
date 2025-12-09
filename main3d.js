// Lenis smooth scroll
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
});

// RAF loop
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

// Pearls
const orbLayer = document.getElementById('orb-layer');
const PEARL_COUNT = 8;
const pearls = [];

function spawnPearls(){
  if(!orbLayer) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  for(let i=0;i<PEARL_COUNT;i++){
    const el = document.createElement('div');
    el.className = 'pearl';
    const size = 18 + Math.random() * 24;
    el.style.setProperty('--s', size + 'px');
    const startX = Math.random() * w;
    const startY = h * (0.1 + Math.random() * 0.9);
    el.style.transform = `translate3d(${startX}px, ${startY}px, 0)`;
    pearls.push({ el, baseX:startX, baseY:startY, speed: 0.00008 + Math.random() * 0.00016, driftRange: 18 + Math.random() * 28, phase: Math.random()*Math.PI*2 });
    orbLayer.appendChild(el);
  }
}
spawnPearls();

function animatePearls(time){
  for(let i=0;i<pearls.length;i++){
    const p = pearls[i];
    const offsetX = Math.sin(time * p.speed + p.phase) * p.driftRange;
    const offsetY = Math.cos(time * p.speed * 0.7 + p.phase) * (p.driftRange * 0.6);
    p.el.style.transform = `translate3d(${p.baseX + offsetX}px, ${p.baseY + offsetY}px, 0)`;
  }
  requestAnimationFrame(animatePearls);
}
requestAnimationFrame(animatePearls);

// Intersection observer for reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if(e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
  });
}, { threshold: 0.08 });
document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));

// Loader hide
window.addEventListener('load', () => {
  const loader = document.getElementById('page-loader');
  if(loader) setTimeout(()=> loader.classList.add('hidden'), 550);
});
