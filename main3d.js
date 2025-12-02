/* main3d.js — Bare Vision Cinematic Engine v2.5 */

(function() {
  // --- 1. UTILITY: Lightweight Noise (Self-Contained) ---
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

  // --- 2. SETUP & MOBILE CHECK ---
  const loaderEl = document.getElementById('page-loader');
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent) || (window.matchMedia && window.matchMedia('(pointer:coarse)').matches);

  if (isMobile) {
    if(loaderEl) loaderEl.classList.add('hidden');
    console.log('Mobile detected — 3D scene optimized/disabled.');
    return;
  }

  const container = document.getElementById('three-container');
  if (!container) return;

  const scene = new THREE.Scene();
  // Warm ivory fog for depth
  scene.fog = new THREE.FogExp2(0xFFFBF3, 0.0008); 

  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 3000);
  camera.position.set(0, 18, 55);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1; // Slightly overexposed for high-key look
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  // --- 3. LIGHTING (High Key) ---
  const hemi = new THREE.HemisphereLight(0xfff4ea, 0x555566, 0.7);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffe7c6, 0.9);
  sun.position.set(50, 80, -30);
  scene.add(sun);

  // --- 4. THE DUNES ---
  const planeSize = 800;
  const segX = 200, segY = 120;
  const geom = new THREE.PlaneGeometry(planeSize, planeSize, segX, segY);
  geom.rotateX(-Math.PI / 2);
  
  const posAttr = geom.attributes.position;
  const vCount = posAttr.count;
  const baseY = new Float32Array(vCount);
  for (let i = 0; i < vCount; i++) baseY[i] = posAttr.getY(i);

  const duneMat = new THREE.MeshPhysicalMaterial({
    color: 0xE8DFD5, // Very pale sand
    roughness: 0.9,
    metalness: 0.0,
    clearcoat: 0.05,
    flatShading: false
  });

  const dunes = new THREE.Mesh(geom, duneMat);
  dunes.position.y = -8;
  scene.add(dunes);

  // --- 5. THE ORBS (Jewelry) ---
  const orbGroup = new THREE.Group();
  scene.add(orbGroup);

  // Material: Chrome
  const chromeMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 1.0, roughness: 0.05, clearcoat: 1.0
  });
  // Material: Orchid Glass
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xC8B7D2, metalness: 0.1, roughness: 0.15, transmission: 0.6, transparent: true, opacity: 0.9
  });

  const sphereGeo = new THREE.SphereGeometry(1, 48, 48);

    // ORBS: Suspended Anti-Gravity Motion
    // Instead of falling, they hover and breathe
    orbGroup.children.forEach((o, idx) => {
        const u = o.userData;
        const time = t * u.speed; // Individual speed per orb

     // Vertical Float (Breathing)
     // Moves up and down smoothly based on time + random offset
        o.position.y = u.baseY + Math.sin(time + u.offset) * 2.5;

     // Horizontal Drift (Wandering)
     // Moves slightly left/right so they don't look static
        o.position.x = u.baseX + Math.cos(time * 0.5 + idx) * 4.0;

     // Slow, heavy rotation (Cinematic)
        o.rotation.x += 0.001;
        o.rotation.y += 0.002;
    });

  // Curated positions for balance (no random chaos)
  spawnOrb(-20, 15, -60, 2.5, false); // Left Chrome
  spawnOrb(25, 12, -80, 3.0, true);   // Right Glass
  spawnOrb(0, 22, -120, 5.0, false);  // Distant Giant
  spawnOrb(-40, 8, -40, 1.2, true);   // Small Glass
  spawnOrb(35, 18, -50, 1.8, false);  // Mid Chrome

  // --- 6. PARTICLES (Dust Motes) ---
  const dustCount = 400;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for(let i=0; i<dustCount*3; i+=3) {
      dustPos[i] = (Math.random()-0.5) * 500;
      dustPos[i+1] = Math.random() * 80;
      dustPos[i+2] = -Math.random() * 400;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({ color: 0xA5B4B9, size: 0.6, transparent: true, opacity: 0.4 });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  // --- 7. ANIMATION ---
  let t = 0;
  const clock = new THREE.Clock();
  
  // Mouse
  let mx = 0, my = 0;
  window.addEventListener('mousemove', e => {
      mx = (e.clientX - innerWidth/2) * 0.0005;
      my = (e.clientY - innerHeight/2) * 0.0005;
  });

  // Reveal Sections on scroll
  const sections = document.querySelectorAll('.section, .footer');
  const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
          if(entry.isIntersecting) entry.target.classList.add('visible');
      });
  }, { threshold: 0.1 });
  sections.forEach(s => observer.observe(s));

  function animate() {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      t += delta;

      // Breathe Dunes
      for (let i = 0; i < vCount; i++) {
          const x = posAttr.getX(i);
          const z = posAttr.getZ(i);
          // Slow, sweeping movement
          const n = noise3D(x*0.004, z*0.004, t*0.08); 
          posAttr.setY(i, baseY[i] + n * 4);
      }
      posAttr.needsUpdate = true;
      geom.computeVertexNormals();

      // Float Orbs
      orbGroup.children.forEach(orb => {
          const u = orb.userData;
          orb.position.y = u.baseY + Math.sin(t * u.speed + u.offset) * 2.0;
          orb.rotation.y += 0.002;
      });

      // Dust Rise
      const dp = dust.geometry.attributes.position.array;
      for(let i=0; i<dustCount; i++) {
          const idx = i*3;
          dp[idx+1] += 0.05;
          if(dp[idx+1] > 80) dp[idx+1] = 0;
      }
      dust.geometry.attributes.position.needsUpdate = true;

      // Camera Parallax
      camera.position.x += (mx * 30 - camera.position.x) * 0.05;
      camera.position.y += ((18 + my * 20) - camera.position.y) * 0.05;
      camera.lookAt(0, 5, -100);

      renderer.render(scene, camera);
  }

  animate();

  // Remove Loader
  setTimeout(() => {
      if(loaderEl) loaderEl.classList.add('hidden');
  }, 800);

})();
