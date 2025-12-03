/* main3d.js - Fixed Logic & Loop */

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const rand = (a,b) => a + Math.random()*(b-a);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else init();

function init(){
  const sky = document.getElementById('sky');
  const svgNS = "http://www.w3.org/2000/svg";

  // --- SVG SETUP ---
  let svgWrap = document.getElementById('orb-svg');
  if (!svgWrap){
    svgWrap = document.createElementNS(svgNS,'svg');
    svgWrap.setAttribute('id','orb-svg');
    svgWrap.setAttribute('width','100%');
    svgWrap.setAttribute('height','100%');
    svgWrap.style.position = 'fixed';
    svgWrap.style.left = '0';
    svgWrap.style.top = '0';
    svgWrap.style.zIndex = '-3';
    svgWrap.style.pointerEvents = 'none';
    document.body.appendChild(svgWrap);
  }

  const defs = document.createElementNS(svgNS,'defs');

  // Cloud Symbol
  const cloudSym = document.createElementNS(svgNS,'symbol');
  cloudSym.setAttribute('id','sym-cloud');
  cloudSym.setAttribute('viewBox','0 0 200 120');
  const cloudPath = document.createElementNS(svgNS,'path');
  cloudPath.setAttribute('d','M30 70 C10 70 8 45 40 40 C45 15 85 8 110 30 C145 18 175 36 170 64 C195 66 198 90 160 90 L45 90 C35 90 30 80 30 70 Z');
  cloudPath.setAttribute('fill','white');
  cloudSym.appendChild(cloudPath);
  defs.appendChild(cloudSym);

  // Satellite Symbol
  const satSym = document.createElementNS(svgNS,'symbol');
  satSym.setAttribute('id','sym-sat');
  satSym.setAttribute('viewBox','-60 -60 120 120');
  const satCircle = document.createElementNS(svgNS,'circle');
  satCircle.setAttribute('cx','0'); satCircle.setAttribute('cy','0'); satCircle.setAttribute('r','26'); satCircle.setAttribute('fill','white');
  satSym.appendChild(satCircle);
  defs.appendChild(satSym);

  svgWrap.appendChild(defs);

  const cloudGroup = document.createElementNS(svgNS,'g');
  const satGroup = document.createElementNS(svgNS,'g');
  svgWrap.appendChild(cloudGroup);
  svgWrap.appendChild(satGroup);

  // --- SPAWN CLOUDS ---
  const clouds = [];
  for (let i=0;i<5;i++){
    const use = document.createElementNS(svgNS,'use');
    use.setAttributeNS('http://www.w3.org/1999/xlink','href','#sym-cloud');
    const w = rand(240,420);
    const h = w * 0.56;
    const x = rand(0.05,0.92) * window.innerWidth;
    const y = rand(0.04,0.22) * window.innerHeight;
    const sx = w/200; const sy = h/120;
    use.setAttribute('transform', `translate(${x},${y}) scale(${sx},${sy})`);
    
    const gid = `gcloud${i}`;
    const grad = document.createElementNS(svgNS,'linearGradient');
    grad.setAttribute('id', gid); grad.setAttribute('x1','0'); grad.setAttribute('x2','1');
    const stop1 = document.createElementNS(svgNS,'stop'); stop1.setAttribute('offset','0%'); stop1.setAttribute('stop-color','#ffffff'); stop1.setAttribute('stop-opacity','0.98');
    const stop2 = document.createElementNS(svgNS,'stop'); stop2.setAttribute('offset','55%'); stop2.setAttribute('stop-color','#eaf4f0'); stop2.setAttribute('stop-opacity','0.88');
    const stop3 = document.createElementNS(svgNS,'stop'); stop3.setAttribute('offset','100%'); stop3.setAttribute('stop-color','#d7e8e3'); stop3.setAttribute('stop-opacity','0.7');
    grad.appendChild(stop1); grad.appendChild(stop2); grad.appendChild(stop3);
    defs.appendChild(grad);
    
    use.setAttribute('fill', `url(#${gid})`);
    const fId = `blurC${i}`;
    const f = document.createElementNS(svgNS,'filter'); f.setAttribute('id', fId);
    const fe = document.createElementNS(svgNS,'feGaussianBlur'); fe.setAttribute('stdDeviation','4'); f.appendChild(fe); defs.appendChild(f);
    use.setAttribute('filter', `url(#${fId})`);
    
    cloudGroup.appendChild(use);
    clouds.push({use, x, y, sx, sy, speed: rand(0.01, 0.03), depth: rand(0.15,0.75)});
  }

  // --- CHROME PARTICLES (DOM) ---
  const starContainer = document.getElementById("orb-layer");
  if(starContainer) {
    starContainer.innerHTML = "";
    for (let i = 0; i < 80; i++) {
      const star = document.createElement("div");
      star.classList.add("chrome-star");
      const size = Math.random() * 2 + 1; 
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${Math.random() * 100}vw`;
      star.style.top = `${Math.random() * 100}vh`;
      star.style.animationDelay = `${Math.random() * 4}s`;
      starContainer.appendChild(star);
    }
  }

  // --- SATELLITE ---
  const sat = document.createElementNS(svgNS,'use');
  sat.setAttributeNS('http://www.w3.org/1999/xlink','href','#sym-sat');
  let satx = window.innerWidth*0.74;
  let saty = window.innerHeight*0.12;
  sat.setAttribute('transform', `translate(${satx},${saty}) scale(1)`);
  
  const sG = document.createElementNS(svgNS,'linearGradient');
  sG.setAttribute('id','gsat'); sG.setAttribute('x1','0'); sG.setAttribute('x2','1');
  const sg1 = document.createElementNS(svgNS,'stop'); sg1.setAttribute('offset','0%'); sg1.setAttribute('stop-color','#ffffff'); sg1.setAttribute('stop-opacity','0.98');
  const sg2 = document.createElementNS(svgNS,'stop'); sg2.setAttribute('offset','60%'); sg2.setAttribute('stop-color','#d9ece6'); sg2.setAttribute('stop-opacity','0.85');
  sG.appendChild(sg1); sG.appendChild(sg2); defs.appendChild(sG);
  sat.setAttribute('fill','url(#gsat)');
  satGroup.appendChild(sat);

  // --- ANIMATION LOOP ---
  function getScrollT(){
    const dh = document.documentElement.scrollHeight - window.innerHeight;
    return dh > 0 ? clamp(window.scrollY / dh, 0, 1) : 0;
  }

  function skyFor(t){
    const u = Math.pow(t, 0.95);
    const top = blend([247,239,230],[250,247,242], u*0.8);
    const mid = blend([250,247,242],[245,250,242], u*0.9);
    const bot = blend([245,250,242],[234,245,233], u*1.0);
    return `linear-gradient(180deg, rgb(${top.join(',')}), rgb(${mid.join(',')}) 54%, rgb(${bot.join(',')}))`;
  }
  function blend(a,b,t){ return [Math.round(a[0]+(b[0]-a[0])*t), Math.round(a[1]+(b[1]-a[1])*t), Math.round(a[2]+(b[2]-a[2])*t)]; }

  let last = performance.now();
  
  // THE FIXED FRAME LOOP
  function frame(now){
    const dt = (now - last) * 0.001;
    last = now;
    const t = getScrollT();

    if(sky) sky.style.background = skyFor(t);

    clouds.forEach((c, i) => {
      const wob = Math.sin(now*0.0004*(1+i*0.12) + i) * (6*(1-c.depth));
      const sink = t * (60 * c.depth);
      let nx = c.x + wob - (window.innerWidth*0.06)*(t*(1-c.depth));
      let ny = c.y + (dt * 8 * c.speed * 60) - sink;
      if (ny > window.innerHeight + 160) ny = -160 - Math.random()*120;
      c.x = nx; c.y = ny;
      c.use.setAttribute('transform', `translate(${nx},${ny}) scale(${c.sx},${c.sy})`);
    });

    satx = window.innerWidth * (0.82 - t*0.18);
    saty = window.innerHeight * (0.08 + Math.sin(now*0.0004)*0.02 + t*0.06);
    sat.setAttribute('transform', `translate(${satx},${saty}) scale(1)`);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  // --- UI INTERACTION ---
  setTimeout(()=>{
    const sheen = document.querySelector('.title-sheen');
    sheen && sheen.classList.add('play');
  }, 420);

  $$('.btn.orb').forEach(btn=>{
    if (window.matchMedia && window.matchMedia('(pointer:fine)').matches){
      btn.addEventListener('mousemove', e=>{
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--mx', `${e.clientX - r.left}px`);
        btn.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    }
  });

  const obs = new IntersectionObserver(entries=>{
    entries.forEach(en=>{ if (en.isIntersecting) en.target.classList.add('visible'); });
  }, { threshold: 0.12 });
  document.querySelectorAll('[data-animate]').forEach(n=>obs.observe(n));

  const loader = document.getElementById('page-loader');
  setTimeout(()=> loader && loader.classList.add('hidden'), 700);
}
