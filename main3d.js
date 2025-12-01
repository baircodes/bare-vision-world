/* main3d.js — Bare Vision v2.1: Self-contained, robust, enhanced motion */

(function() {
  // --- 1. UTILITY: Lightweight Noise Function (Inlined to prevent dependency errors) ---
  // This replaces the need for the external SimplexNoise library
  const Perm = new Uint8Array(512);
  const Grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
  for(let i=0; i<512; i++) Perm[i] = Math.floor(Math.random()*255);
  function noise3D(xin, yin, zin) {
      let n0, n1, n2, n3; 
      const F3 = 1.0/3.0, G3 = 1.0/6.0;
      const s = (xin+yin+zin)*F3;
      const i = Math.floor(xin+s), j = Math.floor(yin+s), k = Math.floor(zin+s);
      const t = (i+j+k)*G3;
      const X0 = i-t, Y0 = j-t, Z0 = k-t;
      const x0 = xin-X0, y0 = yin-Y0, z0 = zin-Z0;
      let i1, j1, k1, i2, j2, k2;
      if(x0>=y0) { if(y0>=z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; } else if(x0>=z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; } else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; } }
      else { if(y0<z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; } else if(x0<z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; } else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; } }
      const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
      const x2 = x0 - i2 + 2.0*G3, y2 = y0 - j2 + 2.0*G3, z2 = z0 - k2 + 2.0*G3;
      const x3 = x0 - 1.0 + 3.0*G3, y3 = y0 - 1.0 + 3.0*G3, z3 = z0 - 1.0 + 3.0*G3;
      const ii = i & 255, jj = j & 255, kk = k & 255;
      const gi0 = Perm[ii+Perm[jj+Perm[kk]]] % 12, gi1 = Perm[ii+i1+Perm[jj+j1+Perm[kk+k1]]] % 12;
      const gi2 = Perm[ii+i2+Perm[jj+j2+Perm[kk+k2]]] % 12, gi3 = Perm[ii+1+Perm[jj+1+Perm[kk+1]]] % 12;
      let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
      if(t0<0) n0 = 0.0; else { t0 *= t0; n0 = t0 * t0 * (Grad3[gi0][0]*x0 + Grad3[gi0][1]*y0 + Grad3[gi0][2]*z0); }
      let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
      if(t1<0) n1 = 0.0; else { t1 *= t1; n1 = t1 * t1 * (Grad3[gi1][0]*x1 + Grad3[gi1][1]*y1 + Grad3[gi1][2]*z1); }
      let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
      if(t2<0) n2 = 0.0; else { t2 *= t2; n2 = t2 * t2 * (Grad3[gi2][0]*x2 + Grad3[gi2][1]*y2 + Grad3[gi2][2]*z2); }
      let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
      if(t3<0) n3 = 0.0; else { t3 *= t3; n3 = t3 * t3 * (Grad3[gi3][0]*x3 + Grad3[gi3][1]*y3 + Grad3[gi3][2]*z3); }
      return 32.0*(n0 + n1 + n2 + n3);
  }

  // --- 2. FAIL-SAFE LOADER REMOVAL ---
  // If 3D crashes, we still want the site to open.
  function removeLoader() {
    const loader = document.getElementById('page-loader');
    if(loader && !loader.classList.contains('hidden')) {
        loader.classList.add('hidden');
    }
  }
  // Force removal after 1.5s regardless of 3D status
  setTimeout(removeLoader, 1500);

  // --- 3. SCENE SETUP ---
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent) || (window.matchMedia && window.matchMedia('(pointer:coarse)').matches);
  
  if (isMobile) {
    console.log('Mobile: skipping heavy 3D.');
    removeLoader();
    return;
  }

  const container = document.getElementById('three-container');
  if (!container) return;

  const scene = new THREE.Scene();
  // Cinematic fog
  scene.fog = new THREE.FogExp2(0xf7efe8, 0.00065);

  const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 2000);
  camera.position.set(0, 16, 55); // Slightly further back

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  // Using standard encoding for r128 compatibility to avoid errors
  renderer.outputEncoding = THREE.sRGBEncoding; 
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.appendChild(renderer.domElement);

  // --- 4. LIGHTING ---
  const hemi = new THREE.HemisphereLight(0xfff4ea, 0x303040, 0.6);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffe7c6, 1.1);
  sun.position.set(40, 80, -40);
  sun.castShadow = false; // Disable shadows for performance/clean look
  scene.add(sun);

  // --- 5. OBJECTS ---
  
  // A. The Dunes (Procedural Landscape)
  const planeSize = 900;
  const segX = 180, segY = 90; // Optimized segments
  const geom = new THREE.PlaneGeometry(planeSize, planeSize, segX, segY);
  geom.rotateX(-Math.PI / 2);
  
  const posAttr = geom.attributes.position;
  const vCount = posAttr.count;
  const baseY = new Float32Array(vCount);
  for (let i = 0; i < vCount; i++) baseY[i] = posAttr.getY(i);

  const duneMat = new THREE.MeshPhysicalMaterial({
    color: 0xdbcdbf, // Sand
    roughness: 0.85,
    metalness: 0.05,
    clearcoat: 0.1,
    flatShading: false,
  });

  const dunes = new THREE.Mesh(geom, duneMat);
  dunes.position.y = -8;
  scene.add(dunes);

  // B. The Chrome & Gem Orbs
  const orbGroup = new THREE.Group();
  scene.add(orbGroup);

  const chromeMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 1.0,
    roughness: 0.05,
    clearcoat: 1.0
  });

  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0xC8B7D2, // Orchid
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.6, // Glass-like
    opacity: 0.9,
    transparent: true
  });

  const orbs = [];
  const orbCount = 14;
  const sphereGeo = new THREE.SphereGeometry(1, 32, 32);

  for(let i=0; i<orbCount; i++) {
    const isChrome = Math.random() > 0.4;
    const mesh = new THREE.Mesh(sphereGeo, isChrome ? chromeMat : gemMat);
    
    // Random placement
    const x = (Math.random() - 0.5) * 350;
    const z = -20 - Math.random() * 400;
    const y = 5 + Math.random() * 30;
    const scale = 2.0 + Math.random() * 3.5;
    
    mesh.position.set(x, y, z);
    mesh.scale.set(scale, scale, scale);
    
    // Store animation data
    mesh.userData = {
      baseY: y,
      baseX: x,
      speed: 0.2 + Math.random() * 0.4,
      offset: Math.random() * 10,
      floatAmp: 2 + Math.random() * 4
    };
    
    orbGroup.add(mesh);
    orbs.push(mesh);
  }

  // C. Atmosphere Particles (Dust)
  const dustCount = 600;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for(let i=0; i<dustCount*3; i+=3) {
    dustPos[i] = (Math.random()-0.5) * 800;
    dustPos[i+1] = Math.random() * 100;
    dustPos[i+2] = -Math.random() * 600;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.8,
    transparent: true,
    opacity: 0.3
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);


  // --- 6. ANIMATION LOOP ---
  const clock = new THREE.Clock();
  let t = 0;
  
  // Mouse interaction
  let mouseX = 0;
  let mouseY = 0;
  window.addEventListener('mousemove', e => {
    mouseX = (e.clientX - innerWidth/2) * 0.001;
    mouseY = (e.clientY - innerHeight/2) * 0.001;
  });

  // Scroll day/night cycle
  let dayRatio = 0;
  window.addEventListener('scroll', () => {
    const limit = document.documentElement.scrollHeight - window.innerHeight;
    dayRatio = Math.min(1, window.scrollY / limit);
  });

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    t += delta;

    // 1. Animate Dunes (Simulate Wind/Breathing)
    // We update vertices using the noise function
    const positions = dunes.geometry.attributes.position;
    for (let i = 0; i < vCount; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        // Combine low freq (hills) and high freq (ripples)
        // Note: noise3D returns -1 to 1 roughly.
        const n1 = noise3D(x*0.005, z*0.005, t*0.05); 
        const n2 = noise3D(x*0.02, z*0.02, t*0.1); 
        
        const h = (n1 * 6) + (n2 * 1.5);
        positions.setY(i, baseY[i] + h);
    }
    positions.needsUpdate = true;
    dunes.geometry.computeVertexNormals(); // Essential for lighting updates

    // 2. Animate Orbs (Complex float + Rotate)
    orbs.forEach(orb => {
        const u = orb.userData;
        // Vertical float
        orb.position.y = u.baseY + Math.sin(t * u.speed + u.offset) * u.floatAmp;
        // Slow horizontal drift
        orb.position.x = u.baseX + Math.sin(t * 0.1 + u.offset) * 5;
        // Rotation
        orb.rotation.x += delta * 0.1;
        orb.rotation.y += delta * 0.05;
    });

    // 3. Animate Dust (Vortex effect)
    const dPos = dust.geometry.attributes.position.array;
    for(let i=0; i<dustCount; i++) {
        const idx = i*3;
        // Rise up
        dPos[idx+1] += 0.1; 
        if(dPos[idx+1] > 100) dPos[idx+1] = 0;
        // Spiral
        dPos[idx] += Math.sin(t * 0.2 + i) * 0.1;
    }
    dust.geometry.attributes.position.needsUpdate = true;

    // 4. Camera Parallax (Cinematic feel)
    camera.position.x += (mouseX * 50 - camera.position.x) * 0.05;
    camera.position.y += ((16 + mouseY * 20) - camera.position.y) * 0.05;
    camera.lookAt(0, 5, -100);

    // 5. Day/Night Shift (Color Grading)
    // Interpolate fog and background based on scroll
    const lightC = new THREE.Color(0xf7efe8).lerp(new THREE.Color(0x0a0a10), dayRatio);
    scene.fog.color.copy(lightC);
    scene.background = lightC;
    // Dim sun at bottom of page
    sun.intensity = 1.1 - dayRatio * 0.8;

    renderer.render(scene, camera);
  }

  // Start
  animate();
  
  // Ensure loader is gone
  setTimeout(removeLoader, 500);

})();
