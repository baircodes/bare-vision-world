/* =========================
   BARE VISION — main3d.js
   Ethereal Pearls (final)
   ========================= */

const sky = document.getElementById("sky");
const orbLayer = document.getElementById("orb-layer");
const loader = document.getElementById("page-loader");

function getSkyGradient() {
  const now = new Date();
  const time = now.getHours() + now.getMinutes() / 60;

  // ----- 5am → 5pm (Editorial Desert Day) -----
  if (time >= 5 && time < 17) {
    return {
      top:   "rgba(242,240,234,1)",   // ivory mist
      mid:   "rgba(235,230,222,1)",   // dune sand
      bottom:"rgba(223,218,210,1)"    // warm neutral base
    };
  }

  // ----- 5pm → 8pm (Editorial Sunset) -----
  if (time >= 17 && time < 20) {
    return {
      top:   "rgba(245,220,210,1)",   // soft clay-peach
      mid:   "rgba(230,190,175,0.9)", // terracotta haze
      bottom:"rgba(210,175,150,0.7)"  // muted amber
    };
  }

  // ----- 8pm → 5am (Desert Night) -----
  return {
    top:   "rgba(30,36,42,1)",        // deep blue
    mid:   "rgba(40,46,52,1)",        // slate
    bottom:"rgba(50,58,64,1)"         // muted obsidian
  };
}

/* sun soft */
function spawnSun(){
  const img = document.createElement("img");
  img.src = "assets/sun-soft.svg";
  img.className = "sun-orb";
  Object.assign(img.style,{position:"fixed",width:"260px",height:"260px",left:"52%",top:"46%",transform:"translate(-50%,-50%)",opacity:"0.48",pointerEvents:"none",filter:"blur(3px)"});
  orbLayer.appendChild(img);
}
spawnSun();

/* PEARLS: very sparse, vertical drift */
const PEARL_COUNT = 8; // very sparse runway
const pearls = [];
function spawnPearls(){
  const w = window.innerWidth, h = window.innerHeight;
  for(let i=0;i<PEARL_COUNT;i++){
    const el = document.createElement("div");
    el.className = "pearl";
    const size = 12 + Math.random()*10;
    el.style.setProperty("--s", size + "px");
    const x = Math.random()*w;
    const y = h*(0.25 + Math.random()*0.6);
    el.style.left = x + "px";
    el.style.top = y + "px";
    pearls.push({el, baseX:x, baseY:y, drift: 30 + Math.random()*80, speed: 0.0003 + Math.random()*0.0009});
    orbLayer.appendChild(el);
  }
}
spawnPearls();

/* animate: slow vertical incense drift */
function animate(){
  const now = performance.now();
  const cx = window.innerWidth * 0.5;
  const cy = window.innerHeight * 0.48;
  for(let i=0;i<pearls.length;i++){
    const p = pearls[i];
    // vertical sinusoidal drift + slow upward movement modulated by speed
    const t = now * p.speed;
    const dx = Math.sin(t*0.8 + i) * 6;
    const dy = -Math.abs(Math.cos(t*0.6 + i)) * (p.drift*0.6) ; // gentle upward bias
    const x = p.baseX + dx;
    const y = p.baseY + dy * 0.01;
    p.el.style.left = x + "px";
    p.el.style.top = y + "px";
  }
  requestAnimationFrame(animate);
}
animate();

/* Intersection reveal */
const io = new IntersectionObserver(entries=>{ entries.forEach(en=>{ if(en.isIntersecting) en.target.classList.add('visible'); }); }, {threshold:0.12});
document.querySelectorAll('[data-animate]').forEach(el=>io.observe(el));

/* loader hide */
window.addEventListener('load', ()=> setTimeout(()=> loader && loader.classList.add('hidden'), 500));
