/* main3d.js — Bare Vision Hybrid: desert backdrop + procedural dunes + refined orbs + dune-script
   Requirements: three.min.js and SimplexNoise loaded from CDN in index.html
*/
(() => {
  // mobile detect (skip heavy scene)
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent)
    || (window.matchMedia && window.matchMedia('(pointer:coarse)').matches);

  const loaderEl = document.getElementById('page-loader');

  if (isMobile) {
    loaderEl?.classList.add('hidden');
    console.log('Mobile detected — skipping Three.js heavy scene.');
    return;
  }

  // Basic scene
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

  // PMREM generator for env map (if env image provided)
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  // load environment / background
  const texLoader = new THREE.TextureLoader();
  let hasEnv = false;
  texLoader.load('assets/env.jpg',
    (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      const env = pmrem.fromEquirectangular(tex).texture;
      scene.environment = env;
      // do not set scene.background to env; we use a background image plane (see below)
      hasEnv = true;
      tex.dispose && tex.dispose();
      pmrem.dispose();
    },
    undefined,
    () => { /* fail quietly */ }
  );

  // BACKDROP: large distant plane with desert image
  texLoader.load('assets/desert-bg.jpg',
    (bgTex) => {
      bgTex.encoding = THREE.sRGBEncoding;
      const bgMat = new THREE.MeshBasicMaterial({ map: bgTex, toneMapped: false });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(1600, 700), bgMat);
      plane.position.set(0, -10, -800);
      plane.rotation.x = 0;
      scene.add(plane);
    },
    undefined,
    () => {
      // fallback: soft color background if image missing
      scene.background = new THREE.Color(0xf9f4ee);
    }
  );

  // Fog for deep atmosphere
  scene.fog = new THREE.FogExp2(0xf8f5f1, 0.00065);

  // Lights
  const hemi = new THREE.HemisphereLight(0xfff4ea, 0x2b2b3a, 0.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe7c6, 1.0);
  sun.position.set(40, 70, -40);
  scene.add(sun);

  // ground / dunes (larger plane)
  const planeSize = 900;
  const segX = 300;
  const segY = 160;
  const geom = new THREE.PlaneGeometry(planeSize, planeSize, segX, segY);
  geom.rotateX(-Math.PI / 2);

  // store base Y
  const pos = geom.attributes.position;
  const vertCount = pos.count;
  const baseY = new Float32Array(vertCount);
  for (let i = 0; i < vertCount; i++) baseY[i] = pos.getY(i);

  // dune material: physical with sheen and subtle clearcoat
  const duneMat = new THREE.MeshPhysicalMaterial({
    color: 0xdbcdb5,
    roughness: 0.92,
    metalness: 0.02,
    clearcoat: 0.06,
    sheen: 0.14,
    sheenColor: 0xefe2d1,
  });

  const dunes = new THREE.Mesh(geom, duneMat);
  dunes.position.y = -7.0;
  scene.add(dunes);

  // cheap volumetric glow: a soft cone (god-ray) aligned with sun
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(120, 240, 32, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff0d4, transparent: true, opacity: 0.04, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  cone.position.set(0, 70, -120);
  cone.rotateX(Math.PI);
  scene.add(cone);

  // Simplex for dunes
  const simplex = new SimplexNoise(Math.random);

  // Orbs: chrome and gemstone
  const orbs = new THREE.Group();
  scene.add(orbs);

  function createOrb({ x = 0, y = 20, z = -40, r = 2.2, metal = true, tint = 0xffffff }) {
    const g = new THREE.IcosahedronGeometry(r, 3);
    const matParams = metal ? {
      color: tint,
      metalness: 1.0,
      roughness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02
    } : {
      color: tint,
      metalness: 0.0,
      roughness: 0.12,
      transmission: 0.85,
      thickness: 1.6,
      ior: 1.42
    };
    const mat = new THREE.MeshPhysicalMaterial(matParams);
    const m = new THREE.Mesh(g, mat);
    m.position.set(x, y, z);
    m.userData = { drift: 0.008 + Math.random() * 0.03, baseX: x, wobble: 0.6 + Math.random() * 1.2 };
    return m;
  }

  // spawn curated orbs: fewer gem orbs, more chrome, placed tastefully
  const initialPositions = [
    [-28, 28, -90],
    [18, 36, -180],
    [38, 22, -120],
    [-60, 30, -240],
    [6, 26, -300],
    [74, 34, -360],
    [-120, 40, -420],
    [110, 28, -200]
  ];

  initialPositions.forEach((p, idx) => {
    const isMetal = idx % 3 !== 0;
    const tint = isMetal ? 0xffffff : 0xD5A9E3; // orchid-like gem tint
    const orb = createOrb({ x: p[0], y: p[1], z: p[2], r: 2 + Math.random() * 3.2, metal: isMetal, tint });
    orbs.add(orb);
  });

  // dust particles
  const dustCount = 380;
  const dustGeo = new THREE.BufferGeometry();
  const dustArr = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustArr[i * 3 + 0] = (Math.random() - 0.5) * 900;
    dustArr[i * 3 + 1] = Math.random() * 40 + 2;
    dustArr[i * 3 + 2] = -Math.random() * 800;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustArr, 3));
  const dustMat = new THREE.PointsMaterial({ color: 0xfff6ef, size: 0.9, transparent: true, opacity: 0.12 });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  // dune-script: render typed fluid text to canvas and map on a slightly curved plane that sits on sand
  const scriptCanvas = document.createElement('canvas');
  scriptCanvas.width = 2048; scriptCanvas.height = 512;
  const sc = scriptCanvas.getContext('2d');
  sc.fillStyle = 'rgba(255,255,245,0)';
  sc.fillRect(0, 0, scriptCanvas.width, scriptCanvas.height);
  sc.font = '140px "Cormorant Garamond", serif';
  sc.textAlign = 'center';
  sc.fillStyle = '#e9d8c7'; // sand-stroked color
  sc.shadowColor = 'rgba(0,0,0,0.25)';
  sc.shadowBlur = 30;
  sc.fillText('bare vision', scriptCanvas.width / 2, scriptCanvas.height / 2 + 20);

  const scriptTex = new THREE.CanvasTexture(scriptCanvas);
  scriptTex.encoding = THREE.sRGBEncoding;
  scriptTex.needsUpdate = true;
  const scriptMat = new THREE.MeshBasicMaterial({ map: scriptTex, transparent: true, opacity: 0.95 });
  const scriptPlane = new THREE.Mesh(new THREE.PlaneGeometry(120, 30), scriptMat);
  scriptPlane.rotation.x = -Math.PI / 2;
  scriptPlane.position.set(0, -5.5, -38);
  scriptPlane.renderOrder = 10;
  scene.add(scriptPlane);

  // day-time parameter controlled by scroll (and time)
  let dayT = 0.04; // 0..1

  // pointer parallax
  const pointer = { x: 0, y: 0 };
  window.addEventListener('mousemove', (e) => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = (e.clientY / innerHeight) * 2 - 1;
  });

  // update on resize
  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }, { passive: true });

  // map scroll to dayT
  window.addEventListener('scroll', () => {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const s = docH > 0 ? window.scrollY / docH : 0;
    dayT = Math.min(1, Math.max(0, s));
  }, { passive: true });

  // animation
  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    const dt = 0.016; time += dt * 0.6;

    // dunes displacement (layered noise)
    for (let i = 0; i < vertCount; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const a = simplex.noise3D(x * 0.0035 + time * 0.08, z * 0.0035 + time * 0.06, time * 0.01);
      const b = simplex.noise3D(x * 0.018 + time * 0.02, z * 0.018 + time * 0.018, time * 0.008) * 0.7;
      const height = a * 3.4 + b * 1.6;
      pos.setY(i, baseY[i] + height);
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();

    // orbs: float, drift down slowly
    orbs.children.forEach((o, i) => {
      const ud = o.userData;
      o.position.x = ud.baseX + Math.sin(time * ud.wobble + i) * (0.5 + (i % 3) * 0.4);
      o.position.y -= ud.drift * 0.38;
      if (o.position.y < -9) {
        o.position.y = 24 + Math.random() * 40;
        ud.baseX = (Math.random() - 0.5) * 320;
      }
      o.rotation.y += 0.002 + (i % 4) * 0.0015;
    });

    // dust flow
    const dp = dust.geometry.attributes.position.array;
    for (let i = 0; i < dustCount; i++) {
      const idx = i * 3;
      dp[idx + 1] += Math.sin(time * 0.2 + i) * 0.001 - 0.0008;
      if (dp[idx + 1] < 1) dp[idx + 1] = 60 + Math.random() * 10;
    }
    dust.geometry.attributes.position.needsUpdate = true;

    // camera parallax
    const tx = pointer.x * 4;
    const ty = 16 + -pointer.y * 5;
    camera.position.x += (tx - camera.position.x) * 0.03;
    camera.position.y += (ty - camera.position.y) * 0.03;
    camera.lookAt(0, -2, -120);

    // day-night color lerp
    const dawn = new THREE.Color(0xffd9b6), noon = new THREE.Color(0xffffff), dusk = new THREE.Color(0xffb28c);
    const t = dayT;
    let col = new THREE.Color();
    if (t < 0.5) col.copy(dawn).lerp(noon, t * 2);
    else col.copy(noon).lerp(dusk, (t - 0.5) * 2);
    sun.color.copy(col);
    sun.intensity = 0.7 + (1 - Math.abs(0.5 - t)) * 1.1;

    // dune warm tint adjustment
    duneMat.color.lerp(new THREE.Color(0xdbcdb5).lerp(new THREE.Color(0xefd8c1), t * 0.7), 0.02);

    // subtle scene background shift if no background plane present
    if (!scene.background) {
      const start = new THREE.Color(0xfbf6f0);
      const mid = new THREE.Color(0xeef7ff);
      const end = new THREE.Color(0x071022);
      scene.background = start.clone().lerp(mid, Math.min(1, t * 1.2)).lerp(end, Math.max(0, (t - 0.65)));
    }

    renderer.render(scene, camera);
  }

  animate();

  // remove loader after scene boot
  setTimeout(() => loaderEl?.classList.add('hidden'), 900);

})();
