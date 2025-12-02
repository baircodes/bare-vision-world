/* main3d.js — updated: canvas-shaped orbs (clouds + stars), improved motion, sunrise→sunset + parallax
   Requires:
   - three.min.js r149
   - simplex-noise 2.4.0
   - optional: assets/desert-bg.jpg, assets/env.jpg
*/
(() => {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent)
    || (window.matchMedia && window.matchMedia('(pointer:coarse)').matches);

  const loaderEl = document.getElementById('page-loader');

  if (isMobile) {
    loaderEl?.classList.add('hidden');
    console.log('Mobile device: Three.js scene disabled.');
    return;
  }

  // scene basics
  const container = document.getElementById('three-container');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 4000);
  camera.position.set(0, 18, 60);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  // pmrem for env
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const texLoader = new THREE.TextureLoader();
  let hasEnv = false;
  texLoader.load('assets/env.jpg',
    (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      const env = pmrem.fromEquirectangular(tex).texture;
      scene.environment = env;
      hasEnv = true;
      tex.dispose && tex.dispose();
      pmrem.dispose();
    },
    undefined,
    () => {}
  );

  // background plane
  texLoader.load('assets/desert-bg.jpg',
    (bg) => {
      bg.encoding = THREE.sRGBEncoding;
      const mat = new THREE.MeshBasicMaterial({ map: bg, toneMapped: false });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(1600, 700), mat);
      plane.position.set(0, -10, -800);
      scene.add(plane);
    },
    undefined,
    () => { scene.background = new THREE.Color(0xfbf6f0); }
  );

  // atmospheric lights
  scene.fog = new THREE.FogExp2(0xf7efe8, 0.00066);
  const hemi = new THREE.HemisphereLight(0xfff4ea, 0x2b2b3a, 0.56);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe7c6, 1.0);
  sun.position.set(40, 70, -40);
  scene.add(sun);
  const ambient = new THREE.AmbientLight(0xffffff, 0.12);
  scene.add(ambient);

  // dunes geometry
  const planeSize = 900;
  const segX = 280;
  const segY = 160;
  const geom = new THREE.PlaneGeometry(planeSize, planeSize, segX, segY);
  geom.rotateX(-Math.PI / 2);
  const pos = geom.attributes.position;
  const vertCount = pos.count;
  const baseY = new Float32Array(vertCount);
  for (let i = 0; i < vertCount; i++) baseY[i] = pos.getY(i);

  const duneMat = new THREE.MeshPhysicalMaterial({
    color: 0xdbcdb5,
    roughness: 0.92,
    metalness: 0.02,
    clearcoat: 0.06,
    sheen: 0.14,
    sheenColor: 0xefe2d1
  });

  const dunes = new THREE.Mesh(geom, duneMat);
  dunes.position.y = -7.0;
  scene.add(dunes);

  // subtle god-ray cone
  const cone = new THREE.Mesh(new THREE.ConeGeometry(120, 260, 32, 1, true), new THREE.MeshBasicMaterial({
    color: 0xfff0d4, transparent: true, opacity: 0.04, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  cone.position.set(0, 80, -120);
  cone.rotateX(Math.PI);
  scene.add(cone);

  // noise
  const simplex = new SimplexNoise(Math.random);

  // utility: create canvas texture for cloud shape
  function makeCloudTexture(size = 512, tint = '#ffffff') {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    ctx.clearRect(0,0,size,size);
    // draw 3 overlapped circles to make a cloud silhouette
    ctx.fillStyle = tint;
    ctx.beginPath();
    ctx.arc(size*0.35, size*0.45, size*0.26, 0, Math.PI*2);
    ctx.arc(size*0.55, size*0.38, size*0.3, 0, Math.PI*2);
    ctx.arc(size*0.7, size*0.5, size*0.22, 0, Math.PI*2);
    ctx.closePath();
    ctx.fill();

    // soft blur by drawing multiple times with globalAlpha
    ctx.globalCompositeOperation = 'source-over';
    // add soft highlight
    const grad = ctx.createRadialGradient(size*0.45, size*0.35, 10, size*0.6, size*0.5, size*0.45);
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0.28)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fill();
    return new THREE.CanvasTexture(c);
  }

  // utility: create star texture (stylized)
  function makeStarTexture(size = 512, tint = '#ffffff') {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    ctx.clearRect(0,0,size,size);
    ctx.fillStyle = tint;
    ctx.beginPath();
    // simple 5-point star
    const cx = size/2, cy = size/2, r = size*0.35;
    for (let i=0;i<5;i++){
      const a = (i*2)*Math.PI/5 - Math.PI/2;
      const x = cx + Math.cos(a)*r;
      const y = cy + Math.sin(a)*r;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.fill();
    // soft highlight center
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r*1.1);
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0.2)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fill();
    return new THREE.CanvasTexture(c);
  }

  // create materials for cloud/star orbs (simulate chrome by using environment when available)
  function makeOrbMaterial(mapTex, metal=true) {
    const mat = new THREE.MeshPhysicalMaterial({
      map: mapTex,
      transparent: true,
      alphaTest: 0.01,
      side: THREE.DoubleSide,
      metalness: metal ? 0.9 : 0.02,
      roughness: metal ? 0.08 : 0.18,
      clearcoat: metal ? 1.0 : 0.0,
      clearcoatRoughness: metal ? 0.02 : 0.5,
    });
    if (hasEnv) mat.envMap = scene.environment;
    return mat;
  }

  // groups
  const orbGroup = new THREE.Group(); scene.add(orbGroup);
  const butterflyGroup = new THREE.Group(); scene.add(butterflyGroup);

  // textures
  const cloudTex = makeCloudTexture(1024, '#ffffff');
  const cloudMat = makeOrbMaterial(cloudTex, true); // chrome cloud
  const starTex = makeStarTexture(1024, '#ffffff');
  const starMat = makeOrbMaterial(starTex, true); // chrome star (reflective)

  // spawn cloud-shaped orbs
  const orbPositions = [
    [-36,28,-140],[18,36,-200],[42,22,-120],[-72,30,-240],[10,26,-300],[86,36,-360],[-130,42,-420],[128,30,-180]
  ];
  orbPositions.forEach((p,i)=>{
    const size = 12 + Math.random()*18; // plane width
    const geo = new THREE.PlaneGeometry(size, size*0.6);
    const mat = (i%4===0) ? starMat.clone() : cloudMat.clone(); // mix clouds + stars
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(p[0], p[1], p[2]);
    mesh.userData = { baseX: p[0], baseY: p[1], drift: 0.008 + Math.random()*0.02, wobble: 0.6 + Math.random()*1.2, size };
    mesh.rotation.y = Math.PI * 0.2 * (Math.random() - 0.4);
    orbGroup.add(mesh);
  });

  // butterflies as before (flat chrome planes)
  function createButterfly({x=0,y=30,z=-120, scale=6, tint=0xCADFE3}) {
    const g = new THREE.PlaneGeometry(scale, scale*0.6);
    const m = new THREE.MeshStandardMaterial({ color: tint, metalness:0.9, roughness:0.06, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(g,m);
    mesh.position.set(x,y,z);
    mesh.userData = { baseX:x, baseY:y, wobble: 0.4 + Math.random()*0.8 };
    return mesh;
  }
  butterflyGroup.add(createButterfly({x:-20,y:36,z:-180, scale:8}));
  butterflyGroup.add(createButterfly({x:60,y:30,z:-240, scale:6}));
  butterflyGroup.add(createButterfly({x:-80,y:34,z:-310, scale:7}));

  // dust particles
  const dustCount = 420; const dustGeo = new THREE.BufferGeometry();
  const dustArr = new Float32Array(dustCount*3);
  for (let i=0;i<dustCount;i++){
    dustArr[i*3+0] = (Math.random()-0.5)*900;
    dustArr[i*3+1] = Math.random()*40 + 2;
    dustArr[i*3+2] = -Math.random()*800;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustArr,3));
  const dustMat = new THREE.PointsMaterial({ color:0xfff6ef, size:0.9, transparent:true, opacity:0.12 });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  // day param (0..1) — governed by scroll and slight auto drift
  let dayT = 0.02;
  let autoT = 0;
  const pointer = { x:0,y:0 };
  window.addEventListener('mousemove', e => { pointer.x = (e.clientX/innerWidth)*2-1; pointer.y = (e.clientY/innerHeight)*2-1 }, { passive:true });
  window.addEventListener('scroll', () => {
    const dh = document.documentElement.scrollHeight - window.innerHeight;
    const s = dh>0 ? window.scrollY/dh : 0;
    dayT = Math.min(1, Math.max(0, s));
  }, { passive:true });

  // resize
  window.addEventListener('resize', ()=>{ camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); }, { passive:true });

  // animate
  let t = 0;
  function animate(){
    requestAnimationFrame(animate);
    t += 0.006;
    autoT += 0.0002;

    // dunes displacement
    for (let i=0;i<vertCount;i++){
      const x = pos.getX(i), z = pos.getZ(i);
      const n1 = simplex.noise3D(x*0.0035 + t*0.08, z*0.0035 + t*0.06, t*0.01);
      const n2 = simplex.noise3D(x*0.018 + t*0.02, z*0.018 + t*0.018, t*0.008) * 0.72;
      const h = n1*3.4 + n2*1.6;
      pos.setY(i, baseY[i] + h);
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();

    // orb group cinematic motion (layered noise) - clouds/stars as planes
    orbGroup.children.forEach((o, idx) => {
      const ud = o.userData;
      // layered noise drift (x)
      const dx = simplex.noise3D((ud.baseX+idx)*0.007 + t*0.02, idx*0.1, t*0.004) * 8;
      const dz = simplex.noise3D((ud.baseX+idx)*0.011 + t*0.01, t*0.006, idx) * 6;
      o.position.x = ud.baseX + dx;
      // slow forward/back motion
      o.position.z += dz * 0.06;
      // slow vertical descent that is gentle and scene-anchored; reset if too low
      o.position.y -= ud.drift * 0.14;
      if (o.position.y < -9) {
        o.position.y = 20 + Math.random()*18;
        ud.baseX = (Math.random()-0.5)*320;
        o.position.x = ud.baseX;
      }
      // rotations for plane (slight yaw/pitch)
      o.rotation.z = Math.sin(t*0.12 + idx)*0.05;
      o.rotation.x = Math.sin(t*0.06 + idx*0.2)*0.03;
    });

    // butterflies gentle flight
    butterflyGroup.children.forEach((b,i)=>{
      const ud = b.userData;
      b.position.x = ud.baseX + Math.sin(t*0.28 + i)*8;
      b.position.y = ud.baseY + Math.sin(t*0.18 + i)*2.2;
      b.rotation.z = Math.sin(t*0.5 + i)*0.12;
    });

    // dust
    const dp = dust.geometry.attributes.position.array;
    for (let i=0;i<dustCount;i++){
      const idx = i*3;
      dp[idx+1] += Math.sin(t*0.2 + i)*0.001 - 0.0007;
      if (dp[idx+1] < 1) dp[idx+1] = 60 + Math.random()*10;
    }
    dust.geometry.attributes.position.needsUpdate = true;

    // camera parallax
    const tx = pointer.x * 4;
    const ty = 16 + -pointer.y * 6;
    camera.position.x += (tx - camera.position.x) * 0.03;
    camera.position.y += (ty - camera.position.y) * 0.03;
    camera.lookAt(0, -2, -120);

    // sunrise → sunset -> night blending
    // combine scroll-driven dayT with slow auto drift so scene slowly evolves
    const mixT = Math.min(1, Math.max(0, dayT*0.9 + (Math.sin(autoT)*0.05)));
    const dawn = new THREE.Color(0xffd8b8), noon = new THREE.Color(0xffffff), dusk = new THREE.Color(0xffb28c);
    let col = new THREE.Color();
    if (mixT < 0.5) col.copy(dawn).lerp(noon, mixT*2); else col.copy(noon).lerp(dusk, (mixT-0.5)*2);
    sun.color.copy(col);
    sun.intensity = 0.7 + (1 - Math.abs(0.5 - mixT)) * 1.1;
    // dune color warming
    duneMat.color.lerp(new THREE.Color(0xdbcdb5).lerp(new THREE.Color(0xefd8c1), mixT*0.6), 0.02);

    renderer.render(scene, camera);
  }

  animate();

  // hide loader
  setTimeout(()=> loaderEl?.classList.add('hidden'), 900);

  // IntersectionObserver for DOM panels
  const obsTargets = document.querySelectorAll('[data-animate]');
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting){ en.target.classList.add('visible'); obs.unobserve(en.target); }
    });
  }, { root:null, rootMargin:'0px 0px -10% 0px', threshold: 0.12 });
  obsTargets.forEach(t => obs.observe(t));

  // pointer-follow highlight for orb buttons (text-only color)
  if(window.matchMedia && window.matchMedia('(pointer:fine)').matches){
    document.querySelectorAll('.orb').forEach(btn=>{
      btn.addEventListener('mousemove', (e)=>{
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        btn.style.setProperty('--mx', `${x}px`);
        btn.style.setProperty('--my', `${y}px`);
      });
    });
  }

})();
