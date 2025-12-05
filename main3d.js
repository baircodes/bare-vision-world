/* =========================
   BARE VISION — main3d.js
   Ethereal Pearls (final)
   ========================= */

const sky = document.getElementById("sky");
const orbLayer = document.getElementById("orb-layer");
const loader = document.getElementById("page-loader");

/* TIME-OF-DAY SKY (keeps simple elegant gradient) */
function getSkyGradient() {
  const now = new Date();
  const h = now.getHours() + now.getMinutes()/60;
  if (h >= 4.98 && h < 16.99) {
    return ["#fff0db","#fbf7f0","#eef4ea"];
  }
  if (h >= 17 && h < 20) {
    return ["#ffd2b4","#ffc49a","#d29a78"];
  }
  return ["#1e2228","#2b3240","#384250"];
}
function updateSky(){ const g=getSkyGradient(); sky.style.background = `linear-gradient(to bottom, ${g[0]}, ${g[1]}, ${g[2]})`; }
updateSky(); setInterval(updateSky,60000);

/* sun soft */
function spawnSun(){
  const img = document.createElement("img");
  img.src = "assets/sun-soft.svg";
  img.className = "sun-orb";
  Object.assign(img.style,{position:"fixed",width:"420px",height:"420px",left:"52%",top:"46%",transform:"translate(-50%,-50%)",opacity:"0.72",pointerEvents:"none",filter:"blur(2px)"});
  orbLayer.appendChild(img);
}
spawnSun();

/* PEARLS: very sparse, vertical drift */
const PEARL_COUNT = 12; // very sparse runway
const pearls = [];
function spawnPearls(){
  const w = window.innerWidth, h = window.innerHeight;
  for(let i=0;i<PEARL_COUNT;i++){
    const el = document.createElement("div");
    el.className = "pearl";
    const size = 9 + Math.random()*8;
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
