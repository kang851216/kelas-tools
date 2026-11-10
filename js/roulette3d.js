/* roulette3d.js — roda putar nama, versi three.js
   Optional progressive layer: if this module (or WebGL) fails, the 2D canvas version stays. */
import * as THREE from '../vendor/three.module.min.js';

const TAU = Math.PI * 2;
const SIGN = 1;             // canvas screen angle maps 1:1 onto the group's Z rotation
const R = 100;              // wheel radius
const DEPTH = 14;           // disc thickness
const RIM = 2.6;            // polished rim thickness
const CAM_DIST = 390;
const ELEV = new THREE.Vector3(0, 0.927, -0.375).normalize(); // ~68deg above the disc

export function createWheel3D({ container, palette }) {
  const probe = document.createElement('canvas');
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return null;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    if (!renderer.getContext()) return null;
  } catch (e) {
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.id = 'gl';
  container.appendChild(renderer.domElement);

  /* ---------- scene ---------- */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 1, 4000);
  camera.position.copy(ELEV).multiplyScalar(CAM_DIST);
  camera.lookAt(0, 8, 0);

  scene.environment = studioEnv();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x0d1726, 0.55));

  const key = new THREE.DirectionalLight(0xffffff, 2.5);
  key.position.set(150, 330, -230);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 3;
  key.shadow.bias = -0.0012;
  const sc = key.shadow.camera;
  sc.left = -170; sc.right = 170; sc.top = 170; sc.bottom = -170; sc.near = 60; sc.far = 900;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xa8c4ff, 0.55);
  fill.position.set(-210, 130, 170);
  scene.add(fill);

  /* ---------- ground shadow ---------- */


  /* ---------- wheel ---------- */
  const tilt = new THREE.Group();
  tilt.rotation.x = -Math.PI / 2;          // lay the disc flat
  scene.add(tilt);

  const spin = new THREE.Group();          // spins about its own axis (local Z)
  tilt.add(spin);

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x0f1828, metalness: 0.92, roughness: 0.28, envMapIntensity: 0.95, side: THREE.DoubleSide
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x9fadc2, metalness: 1, roughness: 0.19, envMapIntensity: 1.15
  });
  const hubMat = new THREE.MeshStandardMaterial({
    color: 0xeef2f8, metalness: 0.82, roughness: 0.16, envMapIntensity: 1.2
  });
  const domeMat = new THREE.MeshStandardMaterial({
    color: 0xf7faff, metalness: 0.98, roughness: 0.08, envMapIntensity: 1.45
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb, metalness: 0.6, roughness: 0.25, emissive: 0x1e40af, emissiveIntensity: 0.4
  });

  const staticParts = new THREE.Group();   // rim + rings + hub: do not spin
  tilt.add(staticParts);

  (function buildStatic() {
    const rimGeo = new THREE.CylinderGeometry(R + RIM, R + RIM, DEPTH, 180, 1, true);
    rimGeo.rotateX(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.receiveShadow = true;
    staticParts.add(rim);

    const ringGeo = new THREE.TorusGeometry(R + RIM, 2.5, 20, 180);
    [DEPTH / 2, -DEPTH / 2].forEach((z) => {
      const ring = new THREE.Mesh(ringGeo, steelMat);
      ring.position.z = z;
      ring.castShadow = true;
      staticParts.add(ring);
    });

    const hubGeo = new THREE.CylinderGeometry(13.5, 15.5, DEPTH + 10, 64);
    hubGeo.rotateX(Math.PI / 2);
    const hubBody = new THREE.Mesh(hubGeo, hubMat);
    hubBody.position.z = 1.5;
    hubBody.castShadow = true;
    staticParts.add(hubBody);

    const hubRing = new THREE.Mesh(new THREE.TorusGeometry(15, 2.1, 20, 72), steelMat);
    hubRing.position.z = DEPTH / 2 + 1.2;
    hubRing.castShadow = true;
    staticParts.add(hubRing);

    const domeGeo = new THREE.SphereGeometry(11.5, 40, 20, 0, TAU, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.rotation.x = Math.PI / 2;
    dome.position.z = DEPTH / 2 + 4;
    staticParts.add(dome);

    const dot = new THREE.Mesh(new THREE.CircleGeometry(3.4, 32), accentMat);
    dot.position.z = DEPTH / 2 + 15.4;
    staticParts.add(dot);
  })();

  /* ---------- lacquer overlay ---------- */
  (function buildGloss() {
    const g = new THREE.Mesh(
      new THREE.CircleGeometry(R - 0.5, 96),
      new THREE.MeshBasicMaterial({
        map: glossTexture(), transparent: true, depthWrite: false,
        opacity: 0.62, side: THREE.FrontSide
      })
    );
    g.position.z = DEPTH / 2 + 1.45;   // above the bevel (DEPTH/2 + 1.3), below the labels
    staticParts.add(g);   // must live in the disc plane, not in world Z
  })();

  /* ---------- pointer (world space: stands above the far rim) ---------- */
  const pointerMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb, metalness: 0.55, roughness: 0.22, emissive: 0x0b2f8f, emissiveIntensity: 0.35
  });
  const pointer = new THREE.Mesh(new THREE.ConeGeometry(7.5, 19, 36), pointerMat);
  pointer.geometry.rotateX(Math.PI);       // tip points down onto the rim
  pointer.position.set(0, 26, R + 5);
  pointer.castShadow = true;
  scene.add(pointer);

  const pinHead = new THREE.Mesh(new THREE.SphereGeometry(6.2, 28, 18), pointerMat);
  pinHead.position.set(0, 26 + 9.5, R + 5);
  scene.add(pinHead);

  /* ---------- wedge + label build ---------- */
  let wedges = [];
  let labels = [];
  let currentNames = [];

  function clearSpinGroup() {
    spin.children.slice().forEach((o) => {
      spin.remove(o);
      o.geometry?.dispose();
      if (o.material) {
        if (o.userData && o.userData.outTex) o.userData.outTex.dispose();
        if (o.userData && o.userData.inTex) o.userData.inTex.dispose();
        if (o.material.map) o.material.map.dispose();
        o.material.dispose();
      }
    });
    wedges = [];
    labels = [];
  }

  function setNames(list) {
    const same = list.length === currentNames.length
      && list.every((v, i) => v === currentNames[i]);
    if (same) return;
    const countChanged = list.length !== currentNames.length;
    currentNames = list.slice();

    if (countChanged || !wedges.length) {
      clearSpinGroup();
      buildWedges(list);
    } else {
      // same segment count: only refresh the text textures
      labels.forEach((lm, i) => {
        const u = lm.userData;
        if (u.outTex) u.outTex.dispose();
        if (u.inTex) u.inTex.dispose();
        u.outTex = labelTexture(list[i], 'out');
        u.inTex = labelTexture(list[i], 'in');
        lm.material.map = u.flipped ? u.inTex : u.outTex;
        lm.material.needsUpdate = true;
      });
    }
    dirty = true;
  }

  function buildWedges(list) {
    const n = Math.max(list.length, 1);
    const seg = TAU / n;
    const empty = list.length === 0;

    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 + i * seg;
      const a1 = a0 + seg;
      const gap = n > 1 ? 0.006 : 0;

      const geo = wedgeGeometry(a0 + gap, a1 - gap);
      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(empty ? '#e2e6ec' : palette[i % palette.length]),
        roughness: 0.40, metalness: 0.10, envMapIntensity: 1.0,
        clearcoat: 0.95, clearcoatRoughness: 0.13
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      spin.add(mesh);
      wedges.push(mesh);

      if (!empty) {
        const mid = a0 + seg / 2;
        const outTex = labelTexture(list[i], 'out');
        const lm = new THREE.Mesh(
          new THREE.PlaneGeometry(R * 0.64, R * 0.20),
          new THREE.MeshBasicMaterial({ map: outTex, transparent: true, depthWrite: false, opacity: 0.99 })
        );
        lm.position.set(Math.cos(mid) * R * 0.61, Math.sin(mid) * R * 0.61, DEPTH / 2 + 1.7);
        lm.rotation.z = mid;
        lm.userData = { mid, outTex, inTex: labelTexture(list[i], 'in'), flipped: false };
        spin.add(lm);
        labels.push(lm);
      }
    }
  }

  function wedgeGeometry(a0, a1) {
    const rIn = 15;
    const shape = new THREE.Shape();
    shape.moveTo(Math.cos(a0) * rIn, Math.sin(a0) * rIn);
    shape.absarc(0, 0, R, a0, a1, false);
    shape.lineTo(Math.cos(a1) * rIn, Math.sin(a1) * rIn);
    shape.absarc(0, 0, rIn, a1, a0, true);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: DEPTH, bevelEnabled: true, bevelThickness: 1.3, bevelSize: 1.0,
      bevelSegments: 2, curveSegments: 18
    });
    geo.translate(0, 0, -DEPTH / 2);
    return geo;
  }

  /* ---------- textures ---------- */
  function labelTexture(text, align) {
    const W = 640, H = 160;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    let fs = 86;
    const fam = '700 %Fpx system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    g.font = fam.replace('%F', fs);
    while (g.measureText(String(text)).width > W - 30 && fs > 22) {
      fs -= 3;
      g.font = fam.replace('%F', fs);
    }
    const inward = align === 'in';
    const x = inward ? 16 : W - 16;
    g.textAlign = inward ? 'left' : 'right';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    g.lineWidth = 7;
    g.strokeStyle = 'rgba(8,12,22,.42)';
    g.strokeText(String(text), x, H / 2);
    g.fillStyle = 'rgba(0,0,0,.40)';
    g.fillText(String(text), x + (inward ? -2 : 2), H / 2 + 4);
    g.fillStyle = '#ffffff';
    g.fillText(String(text), x, H / 2);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    t.needsUpdate = true;
    return t;
  }

  function glossTexture() {
    const S = 512;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    // the disc is viewed through the tilt, which mirrors the UVs 180 degrees
    g.translate(S, S);
    g.rotate(Math.PI);

    // broad soft sheen, upper-left
    let rg = g.createRadialGradient(S * 0.28, S * 0.20, S * 0.02, S * 0.28, S * 0.20, S * 0.60);
    rg.addColorStop(0, 'rgba(255,255,255,.58)');
    rg.addColorStop(0.35, 'rgba(255,255,255,.26)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, S, S);

    // crisp reflection streak across the upper-left quadrant
    g.save();
    g.translate(S * 0.30, S * 0.26);
    g.rotate(-0.42);
    g.scale(1, 0.30);
    rg = g.createRadialGradient(0, 0, S * 0.02, 0, 0, S * 0.30);
    rg.addColorStop(0, 'rgba(255,255,255,.72)');
    rg.addColorStop(0.55, 'rgba(255,255,255,.18)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg;
    g.beginPath(); g.arc(0, 0, S * 0.30, 0, TAU); g.fill();
    g.restore();

    // cool bounce in the lower-right + rim vignette
    rg = g.createRadialGradient(S * 0.78, S * 0.86, S * 0.02, S * 0.78, S * 0.86, S * 0.42);
    rg.addColorStop(0, 'rgba(150,190,255,.20)');
    rg.addColorStop(1, 'rgba(150,190,255,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, S, S);

    const vin = g.createRadialGradient(S / 2, S / 2, S * 0.33, S / 2, S / 2, S * 0.52);
    vin.addColorStop(0, 'rgba(6,10,20,0)');
    vin.addColorStop(1, 'rgba(6,10,20,.34)');
    g.fillStyle = vin;
    g.fillRect(0, 0, S, S);

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function blobTexture() {
    const S = 256;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    const rg = g.createRadialGradient(S / 2, S / 2, S * 0.12, S / 2, S / 2, S * 0.5);
    rg.addColorStop(0, 'rgba(9,14,26,.75)');
    rg.addColorStop(0.62, 'rgba(9,14,26,.30)');
    rg.addColorStop(1, 'rgba(9,14,26,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, S, S);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function studioEnv() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const g = c.getContext('2d');
    const lin = g.createLinearGradient(0, 0, 0, 256);
    lin.addColorStop(0, '#ffffff');
    lin.addColorStop(0.42, '#dfe7f3');
    lin.addColorStop(0.58, '#8ea2bd');
    lin.addColorStop(1, '#0a1120');
    g.fillStyle = lin;
    g.fillRect(0, 0, 512, 256);
    [[132, 54, 96], [372, 40, 74]].forEach(([x, y, r]) => {
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, 'rgba(255,255,255,.98)');
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = rg;
      g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    });
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const rt = pmrem.fromEquirectangular(tex);
    tex.dispose();
    pmrem.dispose();
    return rt.texture;
  }

  /* ---------- state ---------- */
  let dirty = true;
  const labelOffset = Math.PI;
  let spinning = false;
  let t0 = performance.now();
  let pulse = 0;
  let pulseIdx = -1;

  function setRotation(rad, isSpinning) {
    spinning = !!isSpinning;
    const wob = spinning ? Math.sin((performance.now() - t0) / 150) * 0.011 : 0;
    spin.rotation.z = SIGN * rad;
    tilt.rotation.x = -Math.PI / 2 + wob;
    for (let i = 0; i < labels.length; i++) {
      const lm = labels[i];
      const u = lm.userData;
      const screen = (((u.mid + rad) % TAU) + TAU) % TAU;
      const want = screen > Math.PI / 2 && screen < (3 * Math.PI) / 2;
      if (want !== u.flipped) {
        u.flipped = want;
        lm.rotation.z = u.mid + labelOffset + (want ? Math.PI : 0);
        lm.material.map = want ? u.inTex : u.outTex;
        lm.material.needsUpdate = true;
      }
    }
    dirty = true;
  }

  function highlight(idx) {
    pulseIdx = idx;
    pulse = performance.now();
    wedges.forEach((m, i) => {
      m.material.emissive = new THREE.Color(i === idx ? '#ffd479' : '#000000');
      m.material.emissiveIntensity = i === idx ? 0.55 : 0;
    });
    dirty = true;
  }

  /* ---------- resize ---------- */
  function resize() {
    const w = Math.max(container.clientWidth || 320, 200);
    const h = Math.round(w * 0.93);
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = 'auto';
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    dirty = true;
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(container);
  window.addEventListener('resize', resize);
  resize();

  /* ---------- render loop (idle = no GPU work) ---------- */
  (function loop() {
    requestAnimationFrame(loop);
    if (pulseIdx >= 0) {
      const p = (performance.now() - pulse) / 900;
      if (p >= 1) {
        pulseIdx = -1;
        wedges.forEach((m) => { m.material.emissiveIntensity = 0; });
      } else {
        const k = 0.35 + 0.45 * Math.cos(p * Math.PI * 2.2) * (1 - p);
        if (wedges[pulseIdx]) wedges[pulseIdx].material.emissiveIntensity = k;
        dirty = true;
      }
    }
    if (dirty) {
      renderer.render(scene, camera);
      dirty = false;
    }
  })();

  return {
    setNames,
    setRotation,
    highlight,
    resize,
    dispose() {
      renderer.dispose();
      renderer.domElement.remove();
    }
  };
}
