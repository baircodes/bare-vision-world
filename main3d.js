/* main3d.js — Bare Vision v6: The Unified Engine
   Features:
   1. Atmospheric Shader Sky (Time-based cycle)
   2. Procedural Dunes (Noise-based breathing)
   3. Liquid Chrome Orbs (Anti-gravity float)
   4. Self-Contained (No external dependencies)
*/

(function() {

  // --- 1. SAFETY VALVE: REMOVE LOADER AUTOMATICALLY ---
  function removeLoader() {
    const loader = document.getElementById('page-loader');
    if (loader && !loader.classList.contains('hidden')) {
      loader.classList.add('hidden');
      // Trigger title sheen animation
      const sheen = document.querySelector('.title-sheen');
      sheen?.classList.add('play');
    }
  }
  // Force unlock after 1.2s
  setTimeout(removeLoader, 1200);

  // --- 2. INLINED NOISE MATH (Prevents crashes) ---
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

  // --- 3. SCENE SETUP ---
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent) || (window.matchMedia && window.matchMedia('(pointer:coarse)').matches);

  if (isMobile) {
    removeLoader();
    return;
  }

  const container = document.getElementById('three-container');
  if (!container) return;

  const scene = new THREE.Scene();
  // No scene.fog - we want to see the sky gradient clearly!

  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 3000);
  camera.position.set(0, 18, 55);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  // --- 4. THE ATMOSPHERIC SKY (Gradient Sphere) ---
  const skyGeo = new THREE.SphereGeometry(1200, 32, 32); // Huge sphere
  const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, // Render on the inside
      uniforms: {
          time: { value: 0.0 },
          // COLOR PALETTE: Tailored for Bare Vision (Sage/Sand/Silver)
          color1: { value: new THREE.Color("#e8d7c9") },  // Dawn (Warm Sand)
          color2: { value: new THREE.Color("#f0f4f7") },  // Day (Bright Silver/Azure)
          color3: { value: new THREE.Color("#b8cfb0") },  // Dusk (Soft Sage)
          color4: { value: new THREE.Color("#1c1e26") }   // Night (Deep Steel)
      },
      vertexShader: `
          varying vec2 vUv;
          void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }
      `,
      fragmentShader: `
          uniform float time;
          uniform vec3 color1;
          uniform vec3 color2;
          uniform vec3 color3;
          uniform vec3 color4;
          varying vec2 vUv;

          void main() {
              float t = mod(time * 0.05, 1.0); // Cycle speed
              vec3 col;
              
              // Smooth mixing between 4 phases
              if (t < 0.25) {
                  col = mix(color1, color2, t / 0.25);
              } else if (t < 0.5) {
                  col = mix(color2, color3, (t - 0.25) / 0.25);
              } else if (t < 0.75) {
                  col = mix(color3, color4, (t - 0.5) / 0.25);
              } else {
                  col = mix(color4, color1, (t - 0.75) / 0.25);
              }
              
              // Add a subtle vertical gradient (lighter at bottom horizon)
              col = mix(col, vec3(1.0), (1.0 - vUv.y) * 0.2);

              gl_FragColor = vec4(col, 1.0);
          }
      `
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  // --- 5. LIGHTING ---
  const hemi = new THREE.HemisphereLight(0xfff4ea, 0x555566, 0.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe7c6, 0.8);
  sun.position.set(50, 80, -30);
  scene.add(sun);

  // --- 6. THE DUNES ---
  const planeSize = 800;
  const segX = 180, segY = 100;
  const geom = new THREE.PlaneGeometry(planeSize, planeSize, segX, segY);
  geom.rotateX(-Math.PI / 2);
  const posAttr = geom.attributes.position;
  const vCount = posAttr.count;
  const baseY = new Float32Array(vCount);
  for (let i = 0; i < vCount; i++) baseY[i] = posAttr.getY(i);

  const duneMat = new THREE.MeshPhysicalMaterial({
    color: 0xE8DFD5, 
    roughness: 0.85, 
    metalness: 0.1, 
    clearcoat: 0.1, 
    flatShading: false
  });
  const dunes = new THREE.Mesh(geom, duneMat);
  dunes.position.y = -10;
  scene.add(dunes);

  // --- 7. THE ORBS (Liquid Chrome) ---
  const orbGroup = new THREE.Group();
  scene.add(orbGroup);

  const chromeMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 1.0, roughness: 0.05, clearcoat: 1.0, envMapIntensity: 1.5
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xC8B7D2, metalness: 0.1, roughness: 0.1, transmission: 0.65, transparent: true, opacity: 0.95
  });

  const sphereGeo = new THREE.SphereGeometry(1, 48, 48);

  function spawnOrb(x, y, z, size, isGlass) {
      const mesh = new THREE.Mesh(sphereGeo, isGlass ? glassMat : chromeMat);
      mesh.position.set(x, y, z);
      mesh.scale.set(size, size, size);
      mesh.userData = { 
          baseY: y, baseX: x,
          offset: Math.random() * 100,
          speed: 0.3 + Math.random() * 0.4 
      };
      orbGroup.add(mesh);
  }

  // Constellation
  spawnOrb(-20, 15, -60, 2.8, false); // Chrome
  spawnOrb(25, 12, -80, 3.2, true);   // Glass
  spawnOrb(0, 22, -120, 6.0, false);  // Giant Chrome
  spawnOrb(-40, 8, -40, 1.4, true);   // Glass
  spawnOrb(35, 18, -50, 1.9, false);  // Chrome

  // --- 8. DUST PARTICLES ---
  const dustCount = 350;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for(let i=0; i<dustCount*3; i+=3) {
      dustPos[i] = (Math.random()-0.5) * 600;
      dustPos[i+1] = Math.random() * 100;
      dustPos[i+2] = -Math.random() * 400;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.7, transparent: true, opacity: 0.5 });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  // --- 9. ANIMATION LOOP ---
  let t = 0;
  const clock = new THREE.Clock();
  
  // Mouse Tracking
  let mx = 0, my = 0;
  window.addEventListener('mousemove', e => {
      mx = (e.clientX - innerWidth/2) * 0.0005;
      my = (e.clientY - innerHeight/2) * 0.0005;
  });

  // Reveal Sections
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

      // A. Animate Sky
      skyMat.uniforms.time.value += delta * 0.2; // Speed of day/night cycle

      // B. Breathe Dunes
      for (let i = 0; i < vCount; i++) {
          const x = posAttr.getX(i);
          const z = posAttr.getZ(i);
          const n = noise3D(x*0.003, z*0.003, t*0.06); 
          posAttr.setY(i, baseY[i] + n * 3.5);
      }
      posAttr.needsUpdate = true;
      geom.computeVertexNormals();

      // C. Anti-Gravity Orbs
      orbGroup.children.forEach((o, idx) => {
          const u = o.userData;
          o.position.y = u.baseY + Math.sin(t * u.speed + u.offset) * 2.0; 
          o.position.x = u.baseX + Math.cos(t * u.speed * 0.5 + idx) * 3.0;
          o.rotation.x += 0.001;
          o.rotation.y += 0.002;
      });

      // D. Dust Rise
      const dp = dust.geometry.attributes.position.array;
      for(let i=0; i<dustCount; i++) {
          const idx = i*3;
          dp[idx+1] += 0.04;
          if(dp[idx+1] > 100) dp[idx+1] = 0;
      }
      dust.geometry.attributes.position.needsUpdate = true;

      // E. Parallax
      camera.position.x += (mx * 30 - camera.position.x) * 0.05;
      camera.position.y += ((18 + my * 20) - camera.position.y) * 0.05;
      camera.lookAt(0, 5, -100);

      renderer.render(scene, camera);
  }

  animate();

})();
