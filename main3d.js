/**
 * main3d.js — final Solarpunk engine
 * - tiny micro chrome stars (density A)
 * - swirling motion (user chose Swirling)
 * - alternating swirl directions (C)
 * - asymmetric sun position (option C)
 * - automatic day/night gradient switch (4:59am-4:59pm day; 5pm-4:59am night)
 * - safe, dependency-free
 */

/* helpers */
const $ = s => document.querySelector(s);
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const rand = (a,b) => a + Math.random()*(b-a);

/* config (tweakable) */
const CONFIG = {
  starCount: 18,                // ultra-sparse / luxury
  starSizeMin: 1.5,
  starSizeMax: 4.0,
  swirlRadius: 220,             // base radius of swirl
  swirlSpeed: 0.0009 * 1.6,     // base speed, multiplied for "Swirling"
  sunPos: { xPct: 0.62, yPct: 0.28 }, // asymmetric (C)
  dayRange: { startH: 4, startM:59, endH:16, endM:59 }, // 4:59 -> 16:59 day
  fadeInMs: 900
};

/* DOM refs */
const orbLayer = $('#orb-layer');
const sky = $('#sky');
const loader = $('#page-loader');

/* bail gracefully on mobile (keep performance) */
const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent) || (window.matchMedia && window.matchMedia('(pointer:coarse)').matches);
if (isMobile) {
  // hide visual layer and remove loader quickly
  orbLayer.style.display = 'none';
  loader && loader.classList.add('hidden');
} else {
  initScene();
}

/* helpers for time */
function timeIsDay(date = new Date()){
  // returns true if local time between 4:59 and 16:59 inclusive
  const h = date.getHours();
  const m = date.getMinutes();
  const start = CONFIG.dayRange.startH * 60 + CONFIG.dayRange.startM;
  const end = CONFIG.dayRange.endH * 60 + CONFIG.dayRange.endM;
  const now = h*60 + m;
  return now >= start && now <= end;
}

/* Gradients */
function applySkyGradient(isDay){
  if (isDay){
    // minimal real desert haze
    sky.style.background = `
      radial-gradient(circle at ${CONFIG.sunPos.xPct*100}% ${CONFIG.sunPos.yPct*100}%, 
        rgba(255,244,224,0.45) 0%,
        rgba(245,230,205,0.24) 18%,
        rgba(235,215,185,0.12) 42%,
        rgba(220,200,170,0.06) 70%,
        rgba(200,180,152,0.04) 100%)
    `;
  } else {
    // dark romance dusk / night
    sky.style.background = `
      radial-gradient(circle at ${CONFIG.sunPos.xPct*100}% ${CONFIG.sunPos.yPct*100}%, 
        rgba(220,145,115,0.18) 0%,
        rgba(140,80,105,0.12) 20%,
        rgba(60,40,80,0.10) 48%,
        rgba(20,18,34,0.06) 80%,
        rgba(7,6,18,0.02) 100%)
    `;
  }
}

/* create stars */
function createStars(){
  const w = window.innerWidth, h = window.innerHeight;
  const cx = CONFIG.sunPos.xPct * w;
  const cy = CONFIG.sunPos.yPct * h;

  const stars = [];
  for (let i=0;i<CONFIG.starCount;i++){
    const el = document.createElement('div');
    el.className = 'chrome-star';
    const size = rand(CONFIG.starSizeMin, CONFIG.starSizeMax);
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    // initial polar angle and radius (set around sun center)
    const angle = rand(0, Math.PI*2);
    const radius = rand(CONFIG.swirlRadius*0.35, CONFIG.swirlRadius*1.1);
    // choose alternating swirl direction: some clockwise, some ccw
    const dir = (i % 3 === 0) ? -1 : 1; // alternating-ish pattern (gives variety)
    // position
    const x = cx + Math.cos(angle) * radius + rand(-14,14);
    const y = cy + Math.sin(angle) * radius + rand(-10,10);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.opacity = '0';
    orbLayer.appendChild(el);
    stars.push({ el, angle, radius, dir, baseX:cx, baseY:cy, size });
  }

  // fade-in
  setTimeout(()=> stars.forEach(s=> s.el.style.opacity = (0.7).toString()), 90);

  return stars;
}

/* animate stars swirl */
function animateStars(stars){
  let last = performance.now();
  function frame(now){
    const dt = (now - last);
    last = now;
    const t = now * CONFIG.swirlSpeed;

    // optional: slow radius wobble for organic feeling
    for (let i=0;i<stars.length;i++){
      const s = stars[i];
      const wobble = Math.sin(t * (0.8 + i*0.03) + i) * (6 + i*0.2);
      // alternating direction changes slowly to create hypnotic motion
      const dir = s.dir * (1 + 0.06 * Math.sin(now*0.0005 + i));
      const ang = s.angle + dir * (t * (0.8 + (i%4)*0.06));
      const r = s.radius + Math.sin((now*0.0008) + i) * (4 + i*0.5);
      const x = s.baseX + Math.cos(ang) * r + wobble;
      const y = s.baseY + Math.sin(ang) * r + Math.cos(t*0.12 + i)*2;
      s.el.style.transform = `translate3d(${x - (s.size/2)}px, ${y - (s.size/2)}px, 0)`;
      // small glint pulse
      const pulse = 0.55 + 0.37 * Math.abs(Math.sin(now*0.002 + i*0.6));
      s.el.style.opacity = pulse.toFixed(2);
      // tiny scale breathing
      const sc = 0.92 + Math.abs(Math.sin(now*0.0012 + i))*0.14;
      s.el.style.width = `${s.size * sc}px`;
      s.el.style.height = `${s.size * sc}px`;
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* single chrome satellite (subtle) */
function createSatellite(){
  const sat = document.createElement('div');
  sat.className = 'chrome-star';
  sat.style.width = '18px';
  sat.style.height = '18px';
  sat.style.opacity = '0';
  orbLayer.appendChild(sat);

  let start = performance.now();
  function frame(now){
    const w = window.innerWidth, h = window.innerHeight;
    const cx = CONFIG.sunPos.xPct * w;
    const cy = CONFIG.sunPos.yPct * h;
    const elapsed = (now - start) * 0.00012;
    const angle = elapsed * 0.9;
    const orbitR = CONFIG.swirlRadius * 0.6;
    const x = cx + Math.cos(angle) * orbitR * 1.6;
    const y = cy + Math.sin(angle*0.96) * (orbitR * 0.32) + Math.cos(elapsed*0.9)*8;
    sat.style.transform = `translate3d(${x - 9}px, ${y - 9}px, 0)`;
    sat.style.opacity = (0.85 + 0.15*Math.sin(now*0.001)).toFixed(2);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // return element in case needed
  return sat;
}

/* init scene */
function initScene(){
  applySkyGradient(timeIsDay());
  // create stars & animate
  const stars = createStars();
  animateStars(stars);
  // sat
  createSatellite();

  // respond to resize: reposition base center
  window.addEventListener('resize', ()=> {
    // update base positions for stars
    const w = window.innerWidth, h = window.innerHeight;
    const cx = CONFIG.sunPos.xPct * w;
    const cy = CONFIG.sunPos.yPct * h;
    stars.forEach(s => {
      s.baseX = cx;
      s.baseY = cy;
    });
  }, { passive:true });

  // optionally auto-switch day/night if user's local time crosses threshold while browsing
  setInterval(()=> {
    applySkyGradient(timeIsDay());
  }, 30_000);

  // small reveal: hide loader
  setTimeout(()=> loader && loader.classList.add('hidden'), CONFIG.fadeInMs);
}

/* optional: expose for debugging - remove later if you like */
window._BV_config = CONFIG;
