/* script.js
   Lightweight scroll-driven sky + floating chrome "cloud" & "star" orbs.
   - Pure DOM + canvas textures (no Three.js).
   - Safe for GitHub Pages.
*/

/* helpers */
const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, v));

/* -------------------------
   SKY: scroll-driven color mix
   ------------------------- */
const sky = document.getElementById('sky');
const hero = document.getElementById('hero');
const pageLoader = document.getElementById('page-loader');

function updateSkyByScroll(){
  const docH = document.documentElement.scrollHeight - window.innerHeight;
  const scroll = docH > 0 ? window.scrollY / docH : 0;
  // map scroll 0..1 to day 0..1, with a slight easing
  const t = Math.pow(clamp(scroll), 0.95);
  // colors (we pick three stops and blend)
  const dawnTop = [255, 220, 192];   // #ffdcc0
  const noonMid = [255, 247, 233];   // #fff7e9
  const duskBot = [255, 183, 138];   // #ffb78a

  // mix top, mid, bottom based on t
  // top -> mid between 0..0.5 ; mid->bottom between 0.5..1.0
  let top, mid, bottom;
  if (t < 0.5) {
    const u = t / 0.5;
    top = lerpColor(dawnTop, noonMid, u);
    mid = lerpColor(noonMid, noonMid, 0);
    bottom = lerpColor(noonMid, noonMid, 0);
  } else {
    const u = (t - 0.5) / 0.5;
    top = lerpColor(noonMid, duskBot, u * 0.35);
    mid = lerpColor(noonMid, duskBot, u * 0.6);
    bottom = lerpColor(noonMid, duskBot, u);
  }

  // set CSS gradient
  sky.style.background = `linear-gradient(180deg, rgb(${top.join(',')}), rgb(${mid.join(',')}) 52%, rgb(${bottom.join(',')}))`;
}

/* linear color interp */
function lerpColor(a, b, t){
  return [
    Math.round(a[0] + (b[0]-a[0])*t),
    Math.round(a[1] + (b[1]-a[1])*t),
    Math.round(a[2] + (b[2]-a[2])*t)
  ];
}

/* run on scroll & on load */
window.addEventListener('scroll', throttle(updateSkyByScroll, 40), { passive:true });
window.addEventListener('resize', throttle(updateSkyByScroll, 120));
updateSkyByScroll();

/* -------------------------
   ORBS: create canvas-backed liquid chrome shapes
   ------------------------- */
const orbLayer = document.getElementById('orb-layer');

function makeCloudCanvas(size=512){
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d');
  // clear
  ctx.clearRect(0,0,size,size);
  // base soft cloud (3 circles)
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(size*0.33, size*0.46, size*0.26, 0, Math.PI*2);
  ctx.arc(size*0.54, size*0.38, size*0.30, 0, Math.PI*2);
  ctx.arc(size*0.72, size*0.5, size*0.22, 0, Math.PI*2);
  ctx.closePath();
  ctx.fill();

  // chrome glaze: radial highlight
  const g = ctx.createRadialGradient(size*0.46, size*0.32, 10, size*0.62, size*0.5, size*0.5);
  g.addColorStop(0, 'rgba(255,255,255,0.96)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.35)');
  g.addColorStop(0.9, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fill();

  // subtle inner shadow
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(size*0.5, size*0.58, size*0.33, size*0.12, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  return c;
}

function makeStarCanvas(size=512){
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.clearRect(0,0,size,size);
  ctx.fillStyle = 'white';
  ctx.translate(size/2, size/2);
  const r = size*0.32;
  // draw 5-point star
  ctx.beginPath();
  for(let i=0;i<5;i++){
    const a = (i*2)*Math.PI/5 - Math.PI/2;
    const x = Math.cos(a)*r;
    const y = Math.sin(a)*r;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.closePath();
  ctx.fill();
  // highlight
  const grad = ctx.createRadialGradient(0, -r*0.2, 0, r*0.1, -r*0.05, r*0.9);
  grad.addColorStop(0, 'rgba(255,255,255,0.96)');
  grad.addColorStop(0.6, 'rgba(255,255,255,0.28)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fill();
  return c;
}

/* create an orb DOM node */
function createOrb({type='cloud', x=0, y=0, z=0, w=200, speed=0.2, id='orb'}){
  const el = document.createElement('div');
  el.className = 'orb-item';
  el.style.position = 'absolute';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.width = `${w}px`;
  el.style.height = `${Math.round(w*0.6)}px`;
  el.style.pointerEvents = 'none';
  el.dataset.speed = speed;
  el.dataset.z = z;
  el.dataset.baseX = x;
  el.dataset.baseY = y;

  // use canvas as background (data url)
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');

  let c;
  if(type === 'star') c = makeStarCanvas(512);
  else c = makeCloudCanvas(512);

  el.style.backgroundImage = `url(${c.toDataURL()})`;
  el.style.backgroundSize = 'cover';
  el.style.backgroundRepeat = 'no-repeat';
  el.style.transform = `translate3d(0,0,0)`;
  el.style.opacity = (type==='star'? 0.96 : 0.92);
  el.style.filter = 'drop-shadow(0 20px 40px rgba(2,6,8,0.22))';
  orbLayer.appendChild(el);
  return el;
}

/* spawn several orbs (clouds and stars) */
const orbs = [];
const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

const spawnSpec = [
  {type:'cloud', x:vw*0.12, y:vh*0.08, z:-120, w:360, speed:0.06},
  {type:'cloud', x:vw*0.72, y:vh*0.06, z:-200, w:280, speed:0.04},
  {type:'cloud', x:vw*0.45, y:vh*0.12, z:-150, w:320, speed:0.05},
  {type:'cloud', x:vw*0.19, y:vh*0.20, z:-240, w:260, speed:0.03},
  {type:'star',  x:vw*0.85, y:vh*0.10, z:-180, w:160, speed:0.035},
  {type:'star',  x:vw*0.55, y:vh*0.28, z:-220, w:140, speed:0.03}
];

spawnSpec.forEach(s => {
  const o = createOrb(s);
  orbs.push(o);
});

/* orb animation tick */
let last = performance.now();
function tick(now){
  const dt = (now - last) * 0.001;
  last = now;
  // drift orbs slowly downward + noise-based horizontal drift
  orbs.forEach((el, idx) => {
    const baseX = parseFloat(el.dataset.baseX);
    const baseY = parseFloat(el.dataset.baseY);
    const speed = parseFloat(el.dataset.speed);
    // vertical slow drift influenced by scroll
    const sc = (document.documentElement.scrollTop || document.body.scrollTop) / (document.documentElement.scrollHeight - window.innerHeight || 1);
    const dy = dt * 6 * speed + sc * 12 * (0.5 + idx*0.03);
    let curTop = parseFloat(el.style.top);
    if (isNaN(curTop)) curTop = baseY;
    curTop += dy;
    if (curTop > vh + 120) curTop = -120 - Math.random()*160; // reset above
    // horizontal noise
    const nx = baseX + Math.sin((now*0.0004) * (idx+1) + idx) * (12 + idx*8);
    el.style.top = `${curTop}px`;
    el.style.left = `${nx}px`;
    // parallax scaling by z
    const z = parseFloat(el.dataset.z);
    const scale = 1 + (z / -600); // deeper z -> slightly bigger/closer effect
    el.style.transform = `scale(${scale}) translateZ(0)`;
  });

  // page loader hide when warmed
  if (!pageLoader.classList.contains('hidden') && performance.now() > 600) {
    pageLoader.classList.add('hidden');
  }

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/* -------------------------
   Button hover: track cursor to position reflection highlight
   ------------------------- */
document.querySelectorAll('.btn.orb').forEach(btn => {
  if (window.matchMedia && window.matchMedia('(pointer:fine)').matches) {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      btn.style.setProperty('--mx', `${x}px`);
      btn.style.setProperty('--my', `${y}px`);
    });
  }
});

/* -------------------------
   intersection observer reveal for panels
   ------------------------- */
const obs = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) en.target.classList.add('visible');
  });
}, { threshold: 0.12 });

document.querySelectorAll('[data-animate]').forEach(n => obs.observe(n));

/* small throttle */
function throttle(fn, wait){
  let t = 0;
  return (...args) => {
    const now = Date.now();
    if (now - t > wait){ t = now; fn(...args); }
  };
}
