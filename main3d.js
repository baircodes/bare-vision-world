/* ===============================
   BARE VISION — main3d.js (vC)
   chrome clouds + micro stars + time-of-day sky
   =============================== */

const sky = document.getElementById("sky");
const orbLayer = document.getElementById("orb-layer");

/* ============================================
   1) CLOCK ENGINE — true time-of-day lighting
   ============================================ */

function getSkyGradient() {
  const now = new Date();
  let h = now.getHours();
  let m = now.getMinutes();

  // convert to decimal hour
  const time = h + m / 60;

  // ----- 4:59 → 4:59 pm (Golden) -----
  if (time >= 4.98 && time < 16.99) {
    return {
      top:   "rgba(255,239,218,1)",
      mid:   "rgba(253,246,236,1)",
      bottom:"rgba(237,245,230,1)"
    };
  }

  // ----- 5pm → 8pm (Sunset melt) -----
  if (time >= 17 && time < 20) {
    return {
      top:   "rgba(255,210,180,1)",
      mid:   "rgba(255,170,140,0.9)",
      bottom:"rgba(210,150,120,0.7)"
    };
  }

  // ----- 8pm → 5am (Desert Night) -----
  if (time >= 20 || time < 5) {
    return {
      top:   "rgba(28,32,38,1)",
      mid:   "rgba(40,45,52,1)",
      bottom:"rgba(52,60,66,1)"
    };
  }

  // fallback dawn
  return {
    top:   "rgba(255,228,200,1)",
    mid:   "rgba(245,225,210,1)",
    bottom:"rgba(225,240,225,1)"
  };
}

function updateSky() {
  const g = getSkyGradient();
  sky.style.background = `
      linear-gradient(
        to bottom,
        ${g.top},
        ${g.mid},
        ${g.bottom}
      )`;
}

setInterval(updateSky, 60000);
updateSky();

/* ============================================
   2) SOFT SUN BEACON
   ============================================ */

function spawnSun() {
  const img = document.createElement("img");
  img.src = "assets/sun-soft.svg";
  img.className = "sun-orb";

  Object.assign(img.style, {
    position: "fixed",
    width: "420px",
    height: "420px",
    left: "50%",
    top: "46%",
    transform: "translate(-50%, -50%)",
    opacity: "0.72",
    pointerEvents: "none",
    filter: "blur(2px)"
  });

  orbLayer.appendChild(img);
}
spawnSun();

/* ============================================
   3) CHROME CLOUDS — floating minimal shapes
   ============================================ */

const CLOUD_COUNT = 4;
const clouds = [];

function spawnChromeClouds() {
  for (let i = 0; i < CLOUD_COUNT; i++) {
    const img = document.createElement("img");
    img.src = "assets/chrome-cloud.svg";
    img.className = "chrome-cloud";

    const x = Math.random() * 100;
    const y = Math.random() * 40 + 5;

    Object.assign(img.style, {
      position: "fixed",
      width: `${200 + Math.random()*90}px`,
      left: x + "vw",
      top: y + "vh",
      opacity: 0.42 + Math.random() * 0.15,
      transform: "translateZ(0)",
      pointerEvents: "none",
      filter: "blur(1px)"
    });

    clouds.push({
      el: img,
      baseX: x,
      baseY: y,
      drift: Math.random() * 0.6 + 0.2,
      offset: Math.random() * 360
    });

    orbLayer.appendChild(img);
  }
}
spawnChromeClouds();

/* ============================================
   4) MICRO CHROME STARS — swirling galaxy
   ============================================ */

const STAR_COUNT = 90; // High density (A)
const stars = [];

function spawnStars() {
  for (let i = 0; i < STAR_COUNT; i++) {
    const img = document.createElement("img");
    img.src = "assets/chrome-star.svg";
    img.className = "chrome-star";

    const angle = Math.random() * Math.PI * 2;
    const radius = 28 + Math.random() * 55;

    stars.push({
      el: img,
      angle,
      speed: 0.001 + Math.random() * 0.002,
      radius,
      size: 8 + Math.random()*6
    });

    Object.assign(img.style, {
      position: "fixed",
      width: stars[stars.length-1].size + "px",
      height: stars[stars.length-1].size + "px",
      pointerEvents: "none",
      opacity: 0.75
    });

    orbLayer.appendChild(img);
  }
}
spawnStars();

/* ============================================
   5) Frame loop (motion)
   ============================================ */

function animate() {
  const t = performance.now() * 0.001;

  // clouds float (slow, elegant)
  clouds.forEach((c, i) => {
    const x = c.baseX + Math.sin(t * c.drift + c.offset) * 2.5;
    const y = c.baseY + Math.cos(t * c.drift + c.offset) * 1.2;

    c.el.style.left = x + "vw";
    c.el.style.top = y + "vh";
  });

  // stars swirl (galaxy-like)
  stars.forEach((s) => {
    s.angle += s.speed;

    const cx = window.innerWidth * 0.5;
    const cy = window.innerHeight * 0.48;

    const x = cx + Math.cos(s.angle) * s.radius;
    const y = cy + Math.sin(s.angle) * (s.radius * 0.55);

    s.el.style.left = x + "px";
    s.el.style.top = y + "px";
  });

  requestAnimationFrame(animate);
}
animate();

/* ============================================
   6) SCROLL REVEAL
   ============================================ */
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll("[data-animate]").forEach(el => observer.observe(el));

/* ============================================
   7) LOADER FADE
   ============================================ */
window.addEventListener("load", () => {
  const loader = document.getElementById("page-loader");
  setTimeout(() => loader.classList.add("hidden"), 600);
});
