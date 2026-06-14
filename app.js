import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.querySelector("#scene");
const metrics = document.querySelector("#metrics");
const qualityLabel = document.querySelector("#quality-label");
const coolingBar = document.querySelector("#cooling-bar");
const coolingPercent = document.querySelector("#cooling-percent");
const coolingTitle = document.querySelector("#cooling-title");
const coolingMessage = document.querySelector("#cooling-message");
const lessonCopy = document.querySelector("#lesson-copy");
const lessonTitle = document.querySelector("#lesson-title");
const eruptButton = document.querySelector("#erupt");
const isMobile = matchMedia("(max-width: 900px), (pointer: coarse)").matches;
const maxPixelRatio = 1.25;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !isMobile,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(devicePixelRatio, maxPixelRatio));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.28;
qualityLabel.textContent = "태블릿 공통";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x090b0c);
scene.fog = new THREE.FogExp2(0x111313, 0.012);

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 250);
camera.position.set(36, 27, 39);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.045;
controls.target.set(0, 4, 0);
controls.minDistance = 24;
controls.maxDistance = 78;
controls.maxPolarAngle = Math.PI * 0.49;

scene.add(new THREE.HemisphereLight(0xb8cbd4, 0x3b2118, 2.1));
const key = new THREE.DirectionalLight(0xffdfc4, 3.2);
key.position.set(-18, 30, 15);
scene.add(key);
const fill = new THREE.DirectionalLight(0x7892a8, 1.2);
fill.position.set(25, 14, -20);
scene.add(fill);

const magmaLight = new THREE.PointLight(0xff4a12, 16, 34, 1.8);
magmaLight.position.set(0, 11, 0);
scene.add(magmaLight);

const loader = new THREE.TextureLoader();
const [rockColor, rockNormal, rockRough] = await Promise.all([
  loader.loadAsync("./assets/gray_rocks_diff_1k.jpg"),
  loader.loadAsync("./assets/gray_rocks_nor_gl_1k.jpg"),
  loader.loadAsync("./assets/gray_rocks_rough_1k.jpg"),
]);
rockColor.colorSpace = THREE.SRGBColorSpace;
for (const texture of [rockColor, rockNormal, rockRough]) {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3.2, 3.2);
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
}

const [lavaColor, lavaEmission, lavaNormal, lavaRoughness] = await Promise.all([
  loader.loadAsync("./assets/lava002/Lava002_1K-JPG_Color.jpg"),
  loader.loadAsync("./assets/lava002/Lava002_1K-JPG_Emission.jpg"),
  loader.loadAsync("./assets/lava002/Lava002_1K-JPG_NormalGL.jpg"),
  loader.loadAsync("./assets/lava002/Lava002_1K-JPG_Roughness.jpg"),
]);
lavaColor.colorSpace = THREE.SRGBColorSpace;
lavaEmission.colorSpace = THREE.SRGBColorSpace;
for (const texture of [lavaColor, lavaEmission, lavaNormal, lavaRoughness]) {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.4, 3.8);
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
}

function hashNoise(x, z) {
  const value = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function smoothNoise(x, z) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = zf * zf * (3 - 2 * zf);
  const a = THREE.MathUtils.lerp(hashNoise(xi, zi), hashNoise(xi + 1, zi), u);
  const b = THREE.MathUtils.lerp(hashNoise(xi, zi + 1), hashNoise(xi + 1, zi + 1), u);
  return THREE.MathUtils.lerp(a, b, v) * 2 - 1;
}

function fbm(x, z) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 0.11;
  for (let octave = 0; octave < 4; octave++) {
    value += smoothNoise(x * frequency, z * frequency) * amplitude;
    frequency *= 2.05;
    amplitude *= 0.5;
  }
  return value;
}

function terrainHeight(x, z) {
  const radius = Math.hypot(x, z);
  const angle = Math.atan2(z, x);
  const cone = Math.max(0, 14.8 - radius * 0.44);
  const crater = Math.exp(-Math.pow(radius - 6.4, 2) * 0.25) * 2.6
    - Math.exp(-radius * radius * 0.105) * 7.4;
  const ridges = Math.sin(angle * 10 + radius * 0.29) * Math.max(0, 1 - radius / 35) * 0.62;
  const erosion = fbm(x, z) * (0.78 + Math.max(0, 1 - radius / 38) * 0.55);
  return Math.max(-1.2, cone + crater + ridges + erosion);
}

const segments = 112;
const terrainGeo = new THREE.PlaneGeometry(78, 78, segments, segments);
terrainGeo.rotateX(-Math.PI / 2);
const positions = terrainGeo.attributes.position;
for (let i = 0; i < positions.count; i++) {
  positions.setY(i, terrainHeight(positions.getX(i), positions.getZ(i)));
}
terrainGeo.computeVertexNormals();

const terrain = new THREE.Mesh(
  terrainGeo,
  new THREE.MeshStandardMaterial({
    map: rockColor,
    normalMap: rockNormal,
    normalScale: new THREE.Vector2(1.2, 1.2),
    roughnessMap: rockRough,
    roughness: 0.92,
    color: 0x4c4541,
  }),
);
scene.add(terrain);

const lavaUniforms = {
  uTime: { value: 0 },
  uFlowSpeed: { value: 1 },
  uCooling: { value: 0.68 },
  uLavaColor: { value: lavaColor },
  uLavaEmission: { value: lavaEmission },
  uLavaNormal: { value: lavaNormal },
  uLavaRoughness: { value: lavaRoughness },
  uUsePbr: { value: 1 },
  uCoolingOffset: { value: 0 },
  uSolidification: { value: 0 },
};

const lavaVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const lavaFragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uFlowSpeed;
  uniform float uCooling;
  uniform sampler2D uLavaColor;
  uniform sampler2D uLavaEmission;
  uniform sampler2D uLavaNormal;
  uniform sampler2D uLavaRoughness;
  uniform float uUsePbr;
  uniform float uCoolingOffset;
  uniform float uSolidification;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p = p * 2.03 + 17.1;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    float time = uTime * uFlowSpeed;
    vec2 flowUv = vec2(vUv.x * 4.0, vUv.y * 12.0 - time * 0.42);
    float broad = fbm(flowUv * 0.72);
    float detail = fbm(flowUv * 2.4 + vec2(time * 0.08, 0.0));
    float crustPattern = broad * 0.72 + detail * 0.28;
    float cracks = smoothstep(0.48, 0.56, abs(crustPattern - 0.52));
    float edgeCrust = smoothstep(0.26, 0.48, abs(vUv.x - 0.5));
    float crust = clamp(cracks * uCooling + edgeCrust * 0.5, 0.0, 1.0);

    vec3 hotCore = vec3(1.0, 0.19, 0.015);
    vec3 hotGlow = vec3(1.0, 0.72, 0.08);
    vec3 darkCrust = vec3(0.045, 0.025, 0.02);
    vec3 warmCrust = vec3(0.22, 0.055, 0.018);
    vec3 molten = mix(hotCore, hotGlow, smoothstep(0.38, 0.8, detail));
    vec3 cooled = mix(warmCrust, darkCrust, smoothstep(0.35, 0.82, broad));
    vec3 procedural = mix(molten, cooled, crust);

    vec2 textureUv = vec2(vUv.x * 1.4, vUv.y * 3.8 - time * 0.025);
    vec3 pbrColor = texture2D(uLavaColor, textureUv).rgb;
    vec3 emissionMap = texture2D(uLavaEmission, textureUv).rgb;
    vec3 normalDetail = texture2D(uLavaNormal, textureUv).rgb;
    float roughnessMap = texture2D(uLavaRoughness, textureUv).r;

    // Lava leaves the crater hot. The photographed cooled crust becomes
    // increasingly visible farther down the slope and when cooling is active.
    float downstreamPosition = clamp(vUv.y + uCoolingOffset, 0.0, 1.0);
    float distanceCooling = smoothstep(0.12, 0.88, downstreamPosition);
    float coolingStrength = clamp((uCooling - 0.45) * 0.92, 0.0, 1.0);
    float forcedCooling = smoothstep(0.82, 1.2, uCooling);
    float coolingCoverage = mix(distanceCooling, 1.0, forcedCooling);
    float pbrBlend = coolingCoverage * coolingStrength * uUsePbr;
    float textureRelief = dot(normalDetail, vec3(0.22, 0.65, 0.13));
    vec3 cooledTexture = pbrColor * mix(0.66, 1.08, textureRelief);
    cooledTexture *= mix(0.82, 1.05, 1.0 - roughnessMap);
    vec3 textureGlow = emissionMap * vec3(1.45, 0.38, 0.035) * (1.0 - uSolidification);
    vec3 color = mix(procedural, cooledTexture + textureGlow, pbrBlend);
    vec3 basalt = pbrColor * vec3(0.31, 0.32, 0.34);
    color = mix(color, basalt, smoothstep(0.58, 1.0, uSolidification));

    float flickerAmount = 0.07 * (1.0 - uSolidification);
    float flicker = 0.93 + sin(time * 5.0 + broad * 11.0) * flickerAmount;
    gl_FragColor = vec4(color * flicker, 1.0);
  }
`;

function makeLavaMaterial(usePbr = true, coolingOffset = 0) {
  const uniforms = THREE.UniformsUtils.clone(lavaUniforms);
  uniforms.uLavaColor.value = lavaColor;
  uniforms.uLavaEmission.value = lavaEmission;
  uniforms.uLavaNormal.value = lavaNormal;
  uniforms.uLavaRoughness.value = lavaRoughness;
  uniforms.uUsePbr.value = usePbr ? 1 : 0;
  uniforms.uCoolingOffset.value = coolingOffset;
  uniforms.uSolidification.value = 0;
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: lavaVertexShader,
    fragmentShader: lavaFragmentShader,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
}

const craterLava = new THREE.Mesh(
  new THREE.CircleGeometry(5, isMobile ? 40 : 64),
  makeLavaMaterial(false),
);
craterLava.rotation.x = -Math.PI / 2;
craterLava.position.y = 8.3;
scene.add(craterLava);

function traceDownhillFlow(x, z, direction, seed, maxSteps = 48, widthScale = 1) {
  const points = [];

  for (let step = 0; step < maxSteps; step++) {
    const currentHeight = terrainHeight(x, z);
    let best = null;
    const stepLength = 0.7;

    for (let sample = -4; sample <= 4; sample++) {
      const offsetAngle = sample * 0.17;
      const candidateDirection = direction.clone().rotateAround(
        new THREE.Vector2(0, 0),
        offsetAngle,
      );
      const nx = x + candidateDirection.x * stepLength;
      const nz = z + candidateDirection.y * stepLength;
      const nextHeight = terrainHeight(nx, nz);
      const downhill = currentHeight - nextHeight;
      const outward = new THREE.Vector2(nx, nz).normalize().dot(candidateDirection);
      const variation = smoothNoise(nx * 0.9 + seed * 13, nz * 0.9 - seed * 7) * 0.08;
      const score = downhill * 2.5 + direction.dot(candidateDirection) * 0.38 + outward * 0.2 + variation;

      if (!best || score > best.score) {
        best = { x: nx, z: nz, height: nextHeight, direction: candidateDirection, score };
      }
    }

    const slope = Math.max(0, currentHeight - best.height) / stepLength;
    const flatSpread = THREE.MathUtils.clamp(1.35 - slope * 0.9, 0.55, 1.35);
    const widthNoise = 0.82 + smoothNoise(x * 0.62 + seed * 5, z * 0.62) * 0.3;
    points.push({
      x,
      z,
      y: currentHeight,
      width: flatSpread * widthNoise * widthScale,
    });

    x = best.x;
    z = best.z;
    direction.lerp(best.direction, 0.68).normalize();
    if (Math.hypot(x, z) > 34 || best.height < -0.6) break;
  }

  return points;
}

function generateFlowPath(startAngle, seed, maxSteps = 48, widthScale = 1) {
  const startRadius = 6.8;
  return traceDownhillFlow(
    Math.cos(startAngle) * startRadius,
    Math.sin(startAngle) * startRadius,
    new THREE.Vector2(Math.cos(startAngle), Math.sin(startAngle)),
    seed,
    maxSteps,
    widthScale,
  );
}

const frontFlow = generateFlowPath(-1.62, 8.3, 52, 1.1);
const branchIndex = Math.min(22, frontFlow.length - 3);
const branchOrigin = frontFlow[branchIndex];
const branchPrevious = frontFlow[Math.max(0, branchIndex - 2)];
const branchDirection = new THREE.Vector2(
  branchOrigin.x - branchPrevious.x,
  branchOrigin.z - branchPrevious.z,
).normalize().rotateAround(new THREE.Vector2(0, 0), -0.72);

const lavaFlows = [
  generateFlowPath(0.72, 1.7, 50, 0.82),
  generateFlowPath(2.52, 4.1, 46, 0.78),
  frontFlow,
  traceDownhillFlow(
    branchOrigin.x,
    branchOrigin.z,
    branchDirection,
    12.7,
    24,
    0.52,
  ),
];

function makeLavaRibbon(samples, baseWidth, coolingOffset = 0) {
  const vertices = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i < samples.length; i++) {
    const current = samples[i];
    const previous = samples[Math.max(0, i - 1)];
    const next = samples[Math.min(samples.length - 1, i + 1)];
    const tangent = new THREE.Vector2(next.x - previous.x, next.z - previous.z).normalize();
    const side = new THREE.Vector2(-tangent.y, tangent.x);
    const progress = i / Math.max(1, samples.length - 1);
    const endTaper = Math.min(
      THREE.MathUtils.smoothstep(progress, 0, 0.08),
      1 - THREE.MathUtils.smoothstep(progress, 0.92, 1),
    );
    const leftNoise = 0.78 + smoothNoise(current.x * 1.4 + 12, current.z * 1.4) * 0.34;
    const rightNoise = 0.78 + smoothNoise(current.x * 1.4 - 15, current.z * 1.4) * 0.34;
    const leftWidth = baseWidth * current.width * leftNoise * endTaper;
    const rightWidth = baseWidth * current.width * rightNoise * endTaper;
    const leftX = current.x + side.x * leftWidth;
    const leftZ = current.z + side.y * leftWidth;
    const rightX = current.x - side.x * rightWidth;
    const rightZ = current.z - side.y * rightWidth;
    vertices.push(
      leftX, terrainHeight(leftX, leftZ) + 0.16, leftZ,
      rightX, terrainHeight(rightX, rightZ) + 0.16, rightZ,
    );
    uvs.push(0, progress, 1, progress);
    if (i < samples.length - 1) {
      const base = i * 2;
      indices.push(base, base + 2, base + 1, base + 2, base + 3, base + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, makeLavaMaterial(true, coolingOffset));
}

const lavaMeshes = lavaFlows.map((points, index) => {
  const widthMultiplier = 2.5;
  const baseWidth = index === 2 ? 0.82 : index === 3 ? 0.5 : 0.58;
  const coolingOffset = index === 3 ? branchIndex / frontFlow.length : 0;
  const mesh = makeLavaRibbon(points, baseWidth * widthMultiplier, coolingOffset);
  scene.add(mesh);
  return mesh;
});

const particleCount = 90;
const particleGeo = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
const particleSeeds = [];
for (let i = 0; i < particleCount; i++) {
  particleSeeds.push({
    radius: Math.random() * 2.8,
    angle: Math.random() * Math.PI * 2,
    speed: 0.55 + Math.random() * 0.65,
    offset: Math.random() * 18,
  });
}
particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
const smokeCanvas = document.createElement("canvas");
smokeCanvas.width = smokeCanvas.height = 64;
const smokeContext = smokeCanvas.getContext("2d");
const smokeGradient = smokeContext.createRadialGradient(32, 32, 2, 32, 32, 30);
smokeGradient.addColorStop(0, "#b8aca0cc");
smokeGradient.addColorStop(0.45, "#847a72aa");
smokeGradient.addColorStop(1, "#625b5500");
smokeContext.fillStyle = smokeGradient;
smokeContext.fillRect(0, 0, 64, 64);
const smokeTexture = new THREE.CanvasTexture(smokeCanvas);
const smoke = new THREE.Points(
  particleGeo,
  new THREE.PointsMaterial({
    color: 0x827973,
    map: smokeTexture,
    alphaMap: smokeTexture,
    size: 1.8,
    transparent: true,
    opacity: 0.26,
    depthWrite: false,
    sizeAttenuation: true,
  }),
);
scene.add(smoke);

let eruptionBoost = 1;
let coolingTarget = new URLSearchParams(location.search).has("cooled") ? 1.35 : 0.68;
let coolingProgress = new URLSearchParams(location.search).has("cooled") ? 1 : 0;
let coolingActive = false;
let coolingStartedAt = 0;
const coolingDuration = 8;
if (coolingTarget > 1) {
  [craterLava, ...lavaMeshes].forEach((surface) => {
    surface.material.uniforms.uCooling.value = coolingTarget;
  });
  document.querySelector("#cool").textContent = "다시 뜨겁게 보기";
}
let frameCount = 0;
let lastMetricTime = performance.now();
let fps = 0;
const clock = new THREE.Clock();
let previousElapsed = 0;
let visualFlowTime = 0;

function updateSmoke(time) {
  const arr = particleGeo.attributes.position.array;
  particleSeeds.forEach((seed, i) => {
    const life = (time * seed.speed * eruptionBoost + seed.offset) % 18;
    const spread = seed.radius + life * 0.12;
    arr[i * 3] = Math.cos(seed.angle + life * 0.08) * spread;
    arr[i * 3 + 1] = 10 + life * 1.15;
    arr[i * 3 + 2] = Math.sin(seed.angle + life * 0.08) * spread;
  });
  particleGeo.attributes.position.needsUpdate = true;
}

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  const delta = Math.min(0.05, Math.max(0, elapsed - previousElapsed));
  previousElapsed = elapsed;
  controls.update();
  updateSmoke(elapsed);

  const lavaSurfaces = [craterLava, ...lavaMeshes];
  if (coolingActive) {
    coolingProgress = Math.min(1, (elapsed - coolingStartedAt) / coolingDuration);
    if (coolingProgress >= 1) coolingActive = false;
  }
  const easedCooling = THREE.MathUtils.smoothstep(coolingProgress, 0, 1);
  const animatedFlowSpeed = eruptionBoost * (1 - easedCooling * 0.98);
  visualFlowTime += delta * animatedFlowSpeed;
  coolingTarget = THREE.MathUtils.lerp(0.68, 1.55, easedCooling);
  lavaSurfaces.forEach((surface) => {
    surface.material.uniforms.uTime.value = visualFlowTime;
    surface.material.uniforms.uFlowSpeed.value = 1;
    surface.material.uniforms.uCooling.value = THREE.MathUtils.lerp(
      surface.material.uniforms.uCooling.value,
      coolingTarget,
      0.035,
    );
    surface.material.uniforms.uSolidification.value = easedCooling;
  });
  craterLava.scale.setScalar(1 + Math.sin(elapsed * 2.6) * 0.025 * eruptionBoost);
  magmaLight.intensity = (15 + Math.sin(elapsed * 3) * 2.5 * eruptionBoost) * (1 - easedCooling * 0.94);
  smoke.material.opacity = 0.26 * (1 - easedCooling * 0.82);

  const percent = Math.round(coolingProgress * 100);
  coolingBar.style.width = `${percent}%`;
  coolingPercent.textContent = `${percent}%`;
  if (coolingProgress >= 1) {
    coolingTitle.textContent = "현무암 생성 완료";
    coolingMessage.textContent = "용암이 지표 가까이에서 빠르게 식어 어두운 현무암이 되었습니다.";
    lessonCopy.textContent = "현무암은 마그마가 지표 가까이에서 빠르게 식어서 만들어집니다.";
    lessonTitle.innerHTML = "용암이<br>현무암이 되었어요";
    eruptButton.disabled = true;
  } else if (coolingProgress > 0) {
    coolingTitle.textContent = "빠르게 식는 중";
    coolingMessage.textContent = "빛과 움직임이 줄고, 검은 암석 표면이 나타나고 있어요.";
    lessonTitle.innerHTML = "용암이<br>빠르게 식고 있어요";
    eruptButton.disabled = true;
  } else {
    coolingTitle.textContent = "뜨거운 용암";
    coolingMessage.textContent = "지표 가까이의 용암을 빠르게 식혀 보세요.";
    lessonTitle.innerHTML = "마그마가<br>지표로 나오고 있어요";
    eruptButton.disabled = false;
  }

  renderer.render(scene, camera);
  frameCount++;
  const now = performance.now();
  if (now - lastMetricTime > 1000) {
    fps = Math.round(frameCount * 1000 / (now - lastMetricTime));
    metrics.textContent = `${fps} FPS · ${renderer.info.render.triangles.toLocaleString()} triangles · ${renderer.info.render.calls} calls`;
    frameCount = 0;
    lastMetricTime = now;
  }
}
animate();

document.querySelector("#erupt").addEventListener("click", (event) => {
  eruptionBoost = eruptionBoost === 1 ? 2.4 : 1;
  event.currentTarget.textContent = eruptionBoost > 1 ? "분출 평소대로 보기" : "분출 강하게 보기";
});

document.querySelector("#cool").addEventListener("click", (event) => {
  if (coolingProgress >= 1) {
    coolingProgress = 0;
    coolingActive = false;
    coolingTarget = 0.68;
    lessonCopy.textContent = "화산을 돌려 보거나 확대해서 분화구와 용암의 흐름을 관찰해 보세요.";
    lessonTitle.innerHTML = "마그마가<br>지표로 나오고 있어요";
    event.currentTarget.textContent = "빠르게 식히기";
    return;
  }
  coolingActive = true;
  coolingStartedAt = clock.getElapsedTime() - coolingProgress * coolingDuration;
  event.currentTarget.textContent = "냉각 다시 시작";
});

document.querySelector("#reset").addEventListener("click", () => {
  camera.position.set(36, 27, 39);
  controls.target.set(0, 4, 0);
  controls.update();
});

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, maxPixelRatio));
  renderer.setSize(innerWidth, innerHeight);
});
