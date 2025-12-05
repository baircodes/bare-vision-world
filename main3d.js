/* =========================
   BARE VISION — main3d.js
   Ethereal Pearl Galaxy A
   ========================= */

const sky = document.getElementById("sky");
const orbLayer = document.getElementById("orb-layer");

/* ============================================
   1) TIME-OF-DAY SKY GRADIENT
   ============================================ */

function getSkyGradient() {
  const now = new Date();
  const h = now.getHours() + now.getMinutes()/60;

  // 4:59am → 4:59pm (Golden)
  if (h >= 4.98 && h < 16.99) {
    return {
      top:   "rgba(255,238,218,1)",
      mid:   "rgba(253,246,236,1)",
      bot:   "rgba(237,245,230,1)"
    };
  }

  // 5pm → 8pm (Sunset)
  if (h >= 17 && h < 20) {
    return {
      top:   "rgba(255,210,180,1)",
      mid:   "rgba(255,170,140,0.9)",
      bot:   "rgba(210,150,120,0.7)"
    };
  }

  // 8pm → 5am (Night Cool)
  if (h >= 20 || h < 5) {
    return {
      top:   "rgba(30,34,40,1)",
      mid:   "rgba(38,44,50,1)",
      bot:   "rgba(52,60,66,1)"
    };
  }

  return {
    top:   "rgba(255,230,205,1)",
    mid:   "rgba(245,225,210,1)",
    bot:   "rgba(225,240,225,1)"
  };
}

function updateSky() {
  const g = getSkyGradient();
  sky.style.background = `
    linear-gradient(to bottom,
      ${g.top},
      ${g.mid},
      ${g.bot}
    )`;
}

updateSky();
setInterval(updateSky, 60000);

/* ============================================
   2) SOFT SUN ORB
   ============================================ */

function spawnSun() {
  const img = document.createElement("img");
  img.src = "assets/sun-soft.svg";
  img.className = "sun-orb";

  Object.assign(img.style, {
    position:"fixed",
    width:"420px",
    height:"420px",
    left:"50%", top:"46%",
    transform:"translate(-50%,-50%)",
    opacity:"0.72",
    pointerEvents:"none",
    filter:"blur(2px)"
  });

  orbLayer.appendChild(img);
}
spawnSun();

/* ============================================
   3) ETHEREAL PEARLS (NO CLOUDS, NO STARS)
   ============================================ */

const PEARL_COUNT = 48;  // balanced, spaced, elegant
const pearls = [];

function spawnPearls() {
  for (let i=0; i<PEARL_COUNT; i++){
    const p = document.createElement("div");
    p.className = "pearl";

    const angle = Math.random() * Math.PI * 2;
    const radius = 80 + Math.random() * 180;

    const size = 10 + Math.random()*6;
    p.style.setProperty("--s", size + "px");

    pearls.push({
      el: p,
      angle,
      speed: 0.0007 + Math.random()*0.0014,
      radius: radius,
    });

    orbLayer.appendChild(p);
  }
}
spawnPearls();

/* ============================================
   4) MOTION LOOP
   ============================================ */

function animate(){
  const cx = window.innerWidth * 0.5;
  const cy = window.innerHeight * 0.48;

  pearls.forEach(p=>{
    p.angle += p.speed;
    const x = cx + Math.cos(p.angle) * p.radius;
    const y = cy + Math.sin(p.angle) * (p.radius * 0.52);

    p.el.style.left = x + "px";
    p.el.style.top = y + "px";
  });

  requestAnimationFrame(animate);
}
animate();

/* ============================================
   5) SCROLL REVEAL
   ============================================ */

const observer = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting) e.target.classList.add("visible");
  });
},{ threshold:0.12 });

document.querySelectorAll("[data-animate]").forEach(el=>observer.observe(el));

/* ============================================
   6) LOADER
   ============================================ */
window.addEventListener("load", ()=>{
  setTimeout(()=>{
    document.getElementById("page-loader").classList.add("hidden");
  },600);
});
