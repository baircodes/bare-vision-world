/* main3d.js
   SVG + JS hybrid "Solarpunk Oasis" visual engine
   - scroll-driven sorbet sky gradient
   - SVG soft chrome clouds (blobby, Y2K)
   - geometric chrome stars
   - mirage heat svg filter
   - hero sheen one-shot
   - parallax + subtle honeytrap gaze
   - safe: no Three.js, no modules
*/

/* ---------- helpers ---------- */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const clamp = (v,a,b)=> Math.max(a,Math.min(b,v));
const rand = (min,max)=> min + Math.random()*(max-min);

/* ---------- ensure DOM ready ---------- */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else init();

function init(){
  // elements
  const sky = document.getElementById('sky');
  const orbLayer = document.getElementById('orb-layer');
  const mirageLayer = document.createElement('div');
  mirageLayer.id = 'mirage-layer';
  document.body.appendChild(mirageLayer);

  // inject an svg defs element for mirage filter and star/cloud symbols
  const svgNS = "http://www.w3.org/2000/svg";
  const defsSvg = document.createElementNS(svgNS, 'svg');
  defsSvg.setAttribute('width','0'); defsSvg.setAttribute('height','0'); defsSvg.style.position='absolute';
  const defs = document.createElementNS(svgNS, 'defs');

  // mirage turbulence filter
  const filter = document.createElementNS(svgNS,'filter');
  filter.setAttribute('id','mirage');
  filter.setAttribute('x','-25%'); filter.setAttribute('y','-25%'); filter.setAttribute('width','150%'); filter.setAttribute('height','150%');
  const feTurb = document.createElementNS(svgNS,'feTurbulence');
  feTurb.setAttribute('type','fractalNoise'); feTurb.setAttribute('baseFrequency','0.0028'); feTurb.setAttribute('numOctaves','2'); feTurb.setAttribute('seed', Math.floor(Math.random()*999));
  filter.appendChild(feTurb);
  const feDisp = document.createElementNS(svgNS,'feDisplacementMap');
  feDisp.setAttribute('in','SourceGraphic'); feDisp.setAttribute('in2','noise'); feDisp.setAttribute('scale','6'); feDisp.setAttribute('xChannelSelector','R'); feDisp.setAttribute('yChannelSelector','G');
  // note: add feBlend to soften
  filter.appendChild(feDisp);
  defs.appendChild(filter);

  // cloud symbol (soft blobby path constructed)
  const cloudSym = document.createElementNS(svgNS,'symbol');
  cloudSym.setAttribute('id','sym-cloud');
  cloudSym.setAttribute('viewBox','0 0 200 120');
  const cloudPath = document.createElementNS(svgNS,'path');
  cloudPath.setAttribute('d','M30 70 C10 70 8 45 40 40 C45 15 85 8 110 30 C145 18 175 36 170 64 C195 66 198 90 160 90 L45 90 C35 90 30 80 30 70 Z');
  cloudPath.setAttribute('fill','white');
  cloudSym.appendChild(cloudPath);
  defs.appendChild(cloudSym);

  // geometric star symbol
  const starSym = document.createElementNS(svgNS,'symbol');
  starSym.setAttribute('id','sym-star');
  starSym.setAttribute('viewBox','-50 -50 100 100');
  const starPath = document.createElementNS(svgNS,'path');
  // 5-point geometric star
  starPath.setAttribute('d','M0,-42 L12,-6 48,-6 18,12 30,48 0,24 -30,48 -18,12 -48,-6 -12,-6 Z');
  starPath.setAttribute('fill','white');
  starSym.appendChild(starPath);
  defs.appendChild(starSym);

  defsSvg.appendChild(defs);
  document.body.appendChild(defsSvg);

  // create an SVG container for orbs
  const svgWrap = document.createElementNS(svgNS,'svg');
  svgWrap.setAttribute('id','orb-svg');
  svgWrap.setAttribute('width','100%');
  svgWrap.setAttribute('height','100%');
  svgWrap.setAttribute('preserveAspectRatio','xMidYMid slice');
  svgWrap.style.position = 'fixed';
  svgWrap.style.left = '0';
  svgWrap.style.top = '0';
  svgWrap.style.zIndex = '-3';
  svgWrap.style.pointerEvents = 'none';
  document.body.appendChild(svgWrap);

  /* ---------- create clouds + stars ---------- */
  const orbs = [];

  // spawn soft chrome clouds (method: use <use xlink:href="#sym-cloud"> but style with gradients)
  const cloudCount = 6;
  for (let i=0;i<cloudCount;i++){
    const use = document.createElementNS(svgNS,'use');
    use.setAttributeNS('http://www.w3.org/1999/xlink','href','#sym-cloud');
    const w = rand(220,480);
    const h = w * 0.56;
    const x = rand(-0.15,1.15); // viewport fraction (use px after)
    const y = rand(0.03,0.28);
    use.setAttribute('transform',`translate(${x*window.innerWidth}, ${y*window.innerHeight}) scale(${w/200},${h/120})`);
    use.setAttribute('opacity', 0.96);
    // style: soft chrome gradient via fill url
    const gid = `g-cloud-${i}`;
    const grad = document.createElementNS(svgNS,'linearGradient');
    grad.setAttribute('id',gid); grad.setAttribute('x1','0'); grad.setAttribute('x2','1'); grad.setAttribute('y1','0'); grad.setAttribute('y2','1');
    const stopA = document.createElementNS(svgNS,'stop'); stopA.setAttribute('offset','0%'); stopA.setAttribute('stop-color','#ffffff'); stopA.setAttribute('stop-opacity','0.98');
    const stopB = document.createElementNS(svgNS,'stop'); stopB.setAttribute('offset','55%'); stopB.setAttribute('stop-color','#e7f3ef'); stopB.setAttribute('stop-opacity','0.82');
    const stopC = document.createElementNS(svgNS,'stop'); stopC.setAttribute('offset','100%'); stopC.setAttribute('stop-color','#dfe9e5'); stopC.setAttribute('stop-opacity','0.66');
    grad.appendChild(stopA); grad.appendChild(stopB); grad.appendChild(stopC);
    defs.appendChild(grad);
    use.setAttribute('fill',`url(#${gid})`);
    // add subtle blur via filter (SVG blur)
    const blurId = `b-${i}`;
    const f = document.createElementNS(svgNS,'filter'); f.setAttribute('id',blurId);
    const fe = document.createElementNS(svgNS,'feGaussianBlur'); fe.setAttribute('stdDeviation','6'); f.appendChild(fe); defs.appendChild(f);
    use.setAttribute('filter',`url(#${blurId})`);
    // store metadata
    const meta = {el:use, vx:x, vy:y, w, h, speed: rand(0.01,0.045), depth: rand(0.15,0.85)};
    orbs.push(meta);
    svgWrap.appendChild(use);
  }

  // spawn geometric stars (smaller)
  const starCount = 10;
  for (let i=0;i<starCount;i++){
    const use = document.createElementNS(svgNS,'use');
    use.setAttributeNS('http://www.w3.org/1999/xlink','href','#sym-star');
    const s = rand(28,86);
    const x = rand(0.02,0.98);
    const y = rand(0.04,0.48);
    use.setAttribute('transform',`translate(${x*window.innerWidth}, ${y*window.innerHeight}) scale(${s/100})`);
    use.setAttribute('opacity', 0.96);
    // metallic gradient: small radial illusion via fill + stroke
    const sid = `s-star-${i}`;
    const sgrad = document.createElementNS(svgNS,'radialGradient'); sgrad.setAttribute('id',sid);
    sgrad.setAttribute('cx','30%'); sgrad.setAttribute('cy','25%'); sgrad.setAttribute('r','80%');
    const st0 = document.createElementNS(svgNS,'stop'); st0.setAttribute('offset','0%'); st0.setAttribute('stop-color','#ffffff'); st0.setAttribute('stop-opacity','1');
    const st1 = document.createElementNS(svgNS,'stop'); st1.setAttribute('offset','55%'); st1.setAttribute('stop-color','#d4e6e2'); st1.setAttribute('stop-opacity','0.85');
    const st2 = document.createElementNS(svgNS,'stop'); st2.setAttribute('offset','100%'); st2.setAttribute('stop-color','#a9c4bb'); st2.setAttribute('stop-opacity','0.6');
    sgrad.appendChild(st0); sgrad.appendChild(st1); sgrad.appendChild(st2);
    defs.appendChild(sgrad);
    use.setAttribute('fill',`url(#${sid})`);
    use.setAttribute('stroke','rgba(255,255,255,0.35)');
    use.setAttribute('stroke-width','0.6');
    const meta = {el:use, vx:x, vy:y, s, speed: rand(0.015,0.05), depth: rand(0.05,0.6)};
    orbs.push(meta);
    svgWrap.appendChild(use);
  }

  // append updated defs to body (so that gradients/filters exist)
  defsSvg.appendChild(defs);

  /* ---------- mirage overlay as SVG filter layer ---------- */
  // create an absolutely positioned SVG element that uses the filter to render a subtle displacement
  const mirSvg = document.createElementNS(svgNS,'svg');
  mirSvg.setAttribute('id','mirage-svg');
  mirSvg.setAttribute('width','100%'); mirSvg.setAttribute('height','100%');
  mirSvg.style.position='fixed'; mirSvg.style.left='0'; mirSvg.style.top='0'; mirSvg.style.zIndex='-2'; mirSvg.style.pointerEvents='none';
  const rect = document.createElementNS(svgNS,'rect');
  rect.setAttribute('width','100%'); rect.setAttribute('height','100%'); rect.setAttribute('fill','transparent');
  rect.setAttribute('filter','url(#mirage)');
  mirSvg.appendChild(rect);
  document.body.appendChild(mirSvg);

  /* ---------- animation loop ---------- */
  let last = performance.now();

  // the sorbet palette stops (in RGB arrays)
  const palette = {
    peach:[255,215,192],
    rose:[251,221,230],
    sand:[244,231,217],
    sage:[232,245,233]
  };

  // map t in [0,1] to gradient CSS string
  function skyGradientFor(t){
    // split into four-stage mapping (0..1)
    // 0..0.34 : peach -> rose
    // 0.34..0.68 : rose -> sand
    // 0.68..1 : sand -> sage
    let top, mid, bottom;
    if (t < 0.34){
      const u = t/0.34;
      top = lerpColor(palette.peach, palette.rose, u);
      mid = lerpColor(palette.rose, palette.rose, 0);
      bottom = lerpColor(palette.rose, palette.sand, u*0.6);
    } else if (t < 0.68){
      const u = (t-0.34)/0.34;
      top = lerpColor(palette.rose, palette.sand, u*0.5);
      mid = lerpColor(palette.rose, palette.sand, u);
      bottom = lerpColor(palette.sand, palette.sand, 0);
    } else {
      const u = (t-0.68)/0.32;
      top = lerpColor(palette.sand, palette.sage, u*0.4);
      mid = lerpColor(palette.sand, palette.sage, u*0.6);
      bottom = lerpColor(palette.sand, palette.sage, u);
    }
    return `linear-gradient(180deg, rgb(${top.join(',')}), rgb(${mid.join(',')}) 52%, rgb(${bottom.join(',')}))`;
  }

  function lerpColor(a,b,t){
    return [
      Math.round(a[0] + (b[0]-a[0])*t),
      Math.round(a[1] + (b[1]-a[1])*t),
      Math.round(a[2] + (b[2]-a[2])*t)
    ];
  }

  // last scroll / doc height tracker
  function scrollT(){
    const dh = document.documentElement.scrollHeight - window.innerHeight;
    return dh>0 ? clamp(window.scrollY / dh, 0, 1) : 0;
  }

  // animate frame
  function frame(now){
    const dt = (now - last) * 0.001;
    last = now;

    const s = scrollT();
    // small auto drift + scroll
    const auto = (Math.sin(now * 0.0002) + 1) * 0.5 * 0.02;
    const t = clamp(s * 0.98 + auto, 0, 1);
    // update sky
    sky.style.background = skyGradientFor(t);

    // animate orbs
    orbs.forEach((meta, idx) => {
      const el = meta.el;
      // compute base positions with noise
      const baseX = meta.vx * window.innerWidth;
      const baseY = meta.vy * window.innerHeight;
      const depth = meta.depth;
      const speed = meta.speed;
      // vertical drift interacts with scroll: as user scrolls down, orbs slowly sink
      const sink = t * 80 * depth;
      const wobble = Math.sin(now*0.0006*(1+idx*0.2) + idx) * (6 + idx*2) * (1-depth);
      // radial parallax: deeper items move less horizontally
      const px = baseX + wobble * (1 - depth) - (window.innerWidth*0.12)*(s*(1-depth));
      let py = baseY + (now*0.00005* (speed*200)) - sink;
      // reset logic to wrap around top/bottom smoothly
      if (py > window.innerHeight + 180) py = -180 - Math.random()*200;
      // apply transform (we use setAttribute on transform)
      const scaleX = (meta.w || meta.s || 100) / 200;
      const scaleY = (meta.h || (meta.s*0.6) || 60) / 120;
      el.setAttribute('transform', `translate(${px}, ${py}) scale(${scaleX}, ${scaleY})`);
      // small opacity pulse for stars
      if (meta.s){
        const pulse = 0.85 + Math.sin(now*0.002 + idx)*0.12;
        el.setAttribute('opacity', pulse.toFixed(2));
      }
    });

    // subtle mirage intensity tied to scroll + time
    const mir = 0.06 + (0.12 * Math.abs(Math.sin(now*0.00015))) + (s*0.06);
    mirageLayer.style.opacity = Math.min(0.16, mir);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  /* ---------- button hover reflection tracking (CSS vars) ---------- */
  function setupButtonTracking(){
    $$('.btn.orb').forEach(btn=>{
      if (window.matchMedia && window.matchMedia('(pointer:fine)').matches){
        btn.addEventListener('mousemove', e=>{
          const r = btn.getBoundingClientRect();
          const x = e.clientX - r.left;
          const y = e.clientY - r.top;
          btn.style.setProperty('--mx', `${x}px`);
          btn.style.setProperty('--my', `${y}px`);
        });
      }
    });
  }
  setupButtonTracking();

  /* ---------- one-shot title sheen ---------- */
  setTimeout(()=>{
    const sheen = document.querySelector('.title-sheen');
    sheen && sheen.classList.add('play');
  }, 420);

  /* ---------- intersection observer for panels ---------- */
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if (en.isIntersecting) en.target.classList.add('visible');
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('[data-animate]').forEach(n=>obs.observe(n));

  /* ---------- responsive: handle resize to reposition orbs ---------- */
  window.addEventListener('resize', ()=> {
    // reposition existing orbs to new viewport coordinates (simple re-seed)
    orbs.forEach(meta => {
      // adjust meta.vx / vy to be within new normalized viewport
      meta.vx = clamp(meta.vx, 0.03, 0.97);
      meta.vy = clamp(meta.vy, 0.03, 0.55);
    });
  });

  /* ---------- small perf tweak: hide on mobile ---------- */
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent) || (window.matchMedia && window.matchMedia('(pointer:coarse)').matches);
  if (isMobile){
    // remove heavy svg visuals on small devices
    svgWrap.style.display = 'none';
    mirSvg.style.display = 'none';
    mirageLayer.style.display = 'none';
  }

  /* ---------- done init ---------- */
  // hide loader after warm-up
  const loader = document.getElementById('page-loader');
  setTimeout(()=> loader && loader.classList.add('hidden'), 800);
}
