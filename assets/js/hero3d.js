// Interactive 3D hero — morphing noise blob, wireframe shell and particle field.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const stage = document.querySelector(".hero-3d");
const canvas = stage?.querySelector("canvas");

if (stage && canvas) {
  try {
    init();
  } catch (err) {
    console.warn("3D hero disabled:", err);
  }
}

function init() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);

  const group = new THREE.Group();
  scene.add(group);

  /* ---------- Simplex noise (Ashima Arts, MIT) ---------- */
  const noiseGLSL = /* glsl */ `
    vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
    float snoise(vec3 v){
      const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
      vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
      vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
      vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
      i=mod289(i);
      vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
      float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
      vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
      vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
      vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
      vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
      vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
      vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
      vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
      p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
      vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
      return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
    }`;

  const uniforms = {
    uTime: { value: 0 },
    uAmp: { value: 0.24 },
    uFreq: { value: 0.85 },
    uPulse: { value: 0 },
    uMouse: { value: new THREE.Vector3() },
    uLime: { value: new THREE.Color("#ff6a3d") },
    uViolet: { value: new THREE.Color("#8aa4ff") },
    uCyan: { value: new THREE.Color("#ffd2bf") }
  };

  const displace = /* glsl */ `
    uniform float uTime; uniform float uAmp; uniform float uFreq; uniform float uPulse; uniform vec3 uMouse;
    ${noiseGLSL}
    float field(vec3 p){
      float n = snoise(p * uFreq + vec3(uTime * 0.25));
      n += 0.22 * snoise(p * uFreq * 2.0 - vec3(uTime * 0.18));
      float bump = smoothstep(1.6, 0.0, distance(p, uMouse)) * 0.35;
      return n * (uAmp + uPulse * 0.4) + bump;
    }`;

  /* ---------- Core blob ---------- */
  const blobGeo = new THREE.IcosahedronGeometry(1.25, 64);
  const blobMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      ${displace}
      varying vec3 vNormal; varying vec3 vView; varying float vNoise;
      void main(){
        float d = field(position);
        vNoise = d;
        vec3 pos = position + normal * d;
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        vView = normalize(-mv.xyz);
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uLime; uniform vec3 uViolet; uniform vec3 uCyan; uniform float uTime;
      varying vec3 vNormal; varying vec3 vView; varying float vNoise;
      void main(){
        float fres = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.4);
        vec3 base = mix(vec3(0.03, 0.035, 0.05), uViolet * 0.35, smoothstep(-0.3, 0.5, vNoise));
        vec3 rim = mix(uLime, uCyan, 0.5 + 0.5 * sin(uTime * 0.6 + vNoise * 4.0));
        vec3 col = base + rim * fres * 1.05;
        float bands = smoothstep(0.92, 1.0, abs(sin(vNoise * 18.0)));
        col += uLime * bands * 0.12;
        gl_FragColor = vec4(col, 1.0);
      }`
  });
  const blob = new THREE.Mesh(blobGeo, blobMat);
  group.add(blob);

  /* ---------- Wireframe shell ---------- */
  const shellMat = new THREE.ShaderMaterial({
    uniforms,
    wireframe: true,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      ${displace}
      varying float vFade;
      void main(){
        float d = field(position * 0.8);
        vec3 pos = position + normal * d * 0.6;
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        vFade = smoothstep(-6.5, -4.5, mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uLime; varying float vFade;
      void main(){ gl_FragColor = vec4(mix(uLime, vec3(1.0), 0.35), 0.12 * vFade); }`
  });
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.75, 6), shellMat);
  group.add(shell);

  /* ---------- Orbit ring ---------- */
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.25, 0.006, 8, 220),
    new THREE.MeshBasicMaterial({ color: 0xedeae4, transparent: true, opacity: 0.22 })
  );
  ring.rotation.set(1.15, 0.25, 0);
  group.add(ring);
  const satellite = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), new THREE.MeshBasicMaterial({ color: 0xff6a3d }));
  group.add(satellite);

  /* ---------- Particle field ---------- */
  const COUNT = window.innerWidth < 700 ? 700 : 1600;
  const positions = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const r = 2.4 + Math.random() * 2.6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    seeds[i] = Math.random();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  const pMat = new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uPixel: { value: renderer.getPixelRatio() } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uTime; uniform float uPixel; attribute float aSeed; varying float vSeed;
      void main(){
        vSeed = aSeed;
        vec3 p = position;
        float a = uTime * (0.04 + aSeed * 0.06);
        p.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz;
        p.y += sin(uTime * 0.5 + aSeed * 6.28) * 0.08;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (1.2 + aSeed * 2.4) * uPixel * (6.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uLime; uniform vec3 uViolet; uniform float uTime; varying float vSeed;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float tw = 0.55 + 0.45 * sin(uTime * 2.0 + vSeed * 40.0);
        vec3 c = mix(uLime, uViolet, step(0.7, vSeed));
        gl_FragColor = vec4(c, smoothstep(0.5, 0.0, d) * 0.75 * tw);
      }`
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  /* ---------- Sizing ---------- */
  let offsetX = 0, offsetY = 0;
  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = camera.aspect < 0.8 ? 7.4 : 6.2;
    camera.updateProjectionMatrix();
    const wide = width > 520;
    offsetX = 0;
    offsetY = wide ? 0.1 : 0;
  };
  new ResizeObserver(resize).observe(stage);
  resize();

  /* ---------- Interaction ---------- */
  const pointer = new THREE.Vector2(0, 0);
  const target = new THREE.Vector2(0, 0);
  let hovering = false;
  const raycaster = new THREE.Raycaster();
  const hitSphere = new THREE.Sphere(new THREE.Vector3(), 1.6);
  const localMouse = new THREE.Vector3(99, 99, 99);
  const hitPoint = new THREE.Vector3();

  window.addEventListener("pointermove", e => {
    const r = stage.getBoundingClientRect();
    target.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
  }, { passive: true });

  stage.addEventListener("pointerdown", () => {
    pulse = 1;
    stage.classList.add("pulsed");
    setTimeout(() => stage.classList.remove("pulsed"), 500);
  });

  let pulse = 0;
  let scrollP = 0;
  window.addEventListener("scroll", () => {
    scrollP = Math.min(window.scrollY / window.innerHeight, 1.2);
  }, { passive: true });

  /* ---------- Render loop (paused off-screen) ---------- */
  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) loop(); }).observe(stage);

  const clock = new THREE.Clock();
  let running = false;
  function frame() {
    const t = reduceMotion ? 2.0 : clock.getElapsedTime();
    uniforms.uTime.value = t;

    pointer.lerp(target, 0.06);
    raycaster.setFromCamera(pointer, camera);
    const inv = group.matrixWorld.clone().invert();
    hitSphere.center.copy(group.position);
    if (raycaster.ray.intersectSphere(hitSphere, hitPoint)) {
      hovering = true;
      localMouse.lerp(hitPoint.applyMatrix4(inv), 0.15);
    } else {
      hovering = false;
      localMouse.lerp(new THREE.Vector3(99, 99, 99), 0.05);
    }
    uniforms.uMouse.value.copy(localMouse);
    stage.classList.toggle("hovering", hovering);

    pulse *= 0.94;
    uniforms.uPulse.value = pulse;
    uniforms.uAmp.value += ((hovering ? 0.34 : 0.24) - uniforms.uAmp.value) * 0.05;

    group.rotation.y = t * 0.12 + pointer.x * 0.5 + scrollP * 1.2;
    group.rotation.x = -pointer.y * 0.35 + scrollP * 0.4;
    group.position.x = offsetX;
    group.position.y = offsetY - scrollP * 0.6;
    const s = 1 - scrollP * 0.15 + pulse * 0.08;
    group.scale.setScalar(s);
    shell.rotation.y = -t * 0.08;
    shell.rotation.z = t * 0.05;
    ring.rotation.z = t * 0.15;

    const a = t * 0.7;
    satellite.position.set(Math.cos(a) * 2.25, 0, Math.sin(a) * 2.25).applyEuler(ring.rotation);

    particles.rotation.y = pointer.x * 0.15;
    particles.rotation.x = -pointer.y * 0.1;

    renderer.render(scene, camera);
  }
  function loop() {
    if (running) return;
    running = true;
    const tick = () => {
      if (!visible || document.hidden) { running = false; return; }
      frame();
      if (reduceMotion) { running = false; return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) loop(); });

  frame();
  stage.classList.add("is-ready");
  loop();
}
