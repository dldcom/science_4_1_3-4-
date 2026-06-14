import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

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
const timeButton = document.querySelector("#cool");
const isMobile = matchMedia("(max-width: 900px), (pointer: coarse)").matches;
const maxPixelRatio = 1.25;

eruptButton.textContent = "분출 시작하기";
timeButton.textContent = "시간 빠르게 보기";
coolingTitle.textContent = "분출 전";
coolingMessage.textContent = "분출 시작하기를 누르면 화산이 폭발하고 용암이 흘러나옵니다.";
lessonTitle.innerHTML = "화산 분출을<br>시작해 보세요";
lessonCopy.textContent = "분출할 때마다 새로운 경로로 용암이 흐르고, 이전에 만들어진 현무암은 그대로 남습니다.";

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

const [hotLavaColor, hotLavaEmission, hotLavaNormal, hotLavaRoughness] = await Promise.all([
  loader.loadAsync("./assets/lava004/Lava004_1K-JPG_Color.jpg"),
  loader.loadAsync("./assets/lava004/Lava004_1K-JPG_Emission.jpg"),
  loader.loadAsync("./assets/lava004/Lava004_1K-JPG_NormalGL.jpg"),
  loader.loadAsync("./assets/lava004/Lava004_1K-JPG_Roughness.jpg"),
]);
hotLavaColor.colorSpace = THREE.SRGBColorSpace;
hotLavaEmission.colorSpace = THREE.SRGBColorSpace;
for (const texture of [hotLavaColor, hotLavaEmission, hotLavaNormal, hotLavaRoughness]) {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.5, 4.2);
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
}

const [basaltColor, basaltNormal, basaltRoughness] = await Promise.all([
  loader.loadAsync("./assets/basalt/Rock041_1K-JPG_Color.jpg"),
  loader.loadAsync("./assets/basalt/Rock041_1K-JPG_NormalGL.jpg"),
  loader.loadAsync("./assets/basalt/Rock041_1K-JPG_Roughness.jpg"),
]);
basaltColor.colorSpace = THREE.SRGBColorSpace;
for (const texture of [basaltColor, basaltNormal, basaltRoughness]) {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.8, 4.8);
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
  uHotLavaColor: { value: hotLavaColor },
  uHotLavaEmission: { value: hotLavaEmission },
  uHotLavaNormal: { value: hotLavaNormal },
  uHotLavaRoughness: { value: hotLavaRoughness },
  uBasaltColor: { value: basaltColor },
  uBasaltNormal: { value: basaltNormal },
  uBasaltRoughness: { value: basaltRoughness },
  uUsePbr: { value: 1 },
  uCoolingOffset: { value: 0 },
  uSolidification: { value: 0 },
  uAge: { value: 30 },
  uReveal: { value: 1 },
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
  uniform sampler2D uHotLavaColor;
  uniform sampler2D uHotLavaEmission;
  uniform sampler2D uHotLavaNormal;
  uniform sampler2D uHotLavaRoughness;
  uniform sampler2D uBasaltColor;
  uniform sampler2D uBasaltNormal;
  uniform sampler2D uBasaltRoughness;
  uniform float uUsePbr;
  uniform float uCoolingOffset;
  uniform float uSolidification;
  uniform float uAge;
  uniform float uReveal;

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
    float frontVariation = (fbm(vec2(vUv.x * 5.0, uReveal * 7.0)) - 0.5) * 0.035;
    if (vUv.y > uReveal + frontVariation) discard;
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
    vec2 hotUv = vec2(vUv.x * 1.5, vUv.y * 4.2 - time * 0.07);
    vec3 hotMap = texture2D(uHotLavaColor, hotUv).rgb;
    vec3 hotEmission = texture2D(uHotLavaEmission, hotUv).rgb;
    vec3 hotNormal = texture2D(uHotLavaNormal, hotUv).rgb;
    float hotRoughness = texture2D(uHotLavaRoughness, hotUv).r;
    float hotRelief = dot(hotNormal, vec3(0.2, 0.68, 0.12));
    vec3 hotTexture = hotMap * mix(0.72, 1.08, hotRelief);
    hotTexture = mix(hotTexture, vec3(1.0, 0.24, 0.015), 0.42);
    hotTexture += hotEmission.r * vec3(1.0, 0.48, 0.045) * mix(0.72, 1.0, 1.0 - hotRoughness);

    // The downhill end is farther from the crater, so it cools first.
    float localAge = max(0.0, uAge + vUv.y * 6.0);
    float lava002Blend = smoothstep(3.0, 8.0, localAge);
    float basaltBlend = smoothstep(11.0, 17.0, localAge);
    vec3 color = mix(hotTexture, cooledTexture + textureGlow, lava002Blend);
    vec2 basaltUv = vec2(vUv.x * 1.8, vUv.y * 4.8);
    vec3 basaltMap = texture2D(uBasaltColor, basaltUv).rgb;
    vec3 basaltNormalDetail = texture2D(uBasaltNormal, basaltUv).rgb;
    float basaltRoughnessMap = texture2D(uBasaltRoughness, basaltUv).r;
    float basaltRelief = dot(basaltNormalDetail, vec3(0.2, 0.68, 0.12));
    vec3 basalt = mix(vec3(0.055), basaltMap, 0.9) * mix(0.82, 1.24, basaltRelief);
    basalt *= mix(0.94, 1.12, 1.0 - basaltRoughnessMap);

    // A few gas bubbles leave dark pores after solidification.
    vec2 poreGrid = floor(basaltUv * vec2(4.0, 2.4));
    vec2 poreCell = fract(basaltUv * vec2(4.0, 2.4)) - 0.5;
    float poreSeed = hash(poreGrid + vec2(71.2, 19.8));
    float poreRadius = mix(0.08, 0.2, hash(poreGrid + 4.7));
    float pore = (1.0 - smoothstep(poreRadius * 0.62, poreRadius, length(poreCell)))
      * step(0.83, poreSeed) * smoothstep(0.72, 1.0, uSolidification);
    basalt *= mix(1.0, 0.13, pore);
    color = mix(color, basalt, basaltBlend);

    float flickerAmount = 0.07 * (1.0 - basaltBlend);
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
  uniforms.uHotLavaColor.value = hotLavaColor;
  uniforms.uHotLavaEmission.value = hotLavaEmission;
  uniforms.uHotLavaNormal.value = hotLavaNormal;
  uniforms.uHotLavaRoughness.value = hotLavaRoughness;
  uniforms.uBasaltColor.value = basaltColor;
  uniforms.uBasaltNormal.value = basaltNormal;
  uniforms.uBasaltRoughness.value = basaltRoughness;
  uniforms.uUsePbr.value = usePbr ? 1 : 0;
  uniforms.uCoolingOffset.value = coolingOffset;
  uniforms.uSolidification.value = 0;
  uniforms.uAge.value = 30;
  uniforms.uReveal.value = 1;
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
  geometry.userData.fullIndexCount = indices.length;
  geometry.setDrawRange(0, indices.length);
  return new THREE.Mesh(geometry, makeLavaMaterial(true, coolingOffset));
}

const activeEruptions = [];
let basaltArchive = null;
let eruptionSerial = 0;
const flowDuration = 7;
const solidifyDuration = 18;
const maxArchivedTriangles = 9000;

function generateEruptionPaths() {
  const count = 3 + Math.floor(Math.random() * 3);
  const start = Math.random() * Math.PI * 2;
  return Array.from({ length: count }, (_, index) => {
    const angle = start + index * (Math.PI * 2 / count) + (Math.random() - 0.5) * 0.72;
    const isMain = index === 0;
    return {
      points: generateFlowPath(
        angle,
        eruptionSerial * 17.3 + index * 4.9 + Math.random() * 10,
        isMain ? 52 : 38 + Math.floor(Math.random() * 10),
        isMain ? 1.08 : 0.68 + Math.random() * 0.25,
      ),
      width: isMain ? 2.25 + Math.random() * 0.55 : 0.82 + Math.random() * 0.58,
    };
  });
}

function beginEruption(time) {
  eruptionSerial++;
  const paths = generateEruptionPaths();
  const meshes = paths.map(({ points, width }) => {
    const mesh = makeLavaRibbon(points, width);
    scene.add(mesh);
    return mesh;
  });
  activeEruptions.push({ meshes, paths, startedAt: time, complete: false });
  eruptButton.disabled = true;
  eruptButton.textContent = "용암이 흐르는 중";
  startExplosion(time);
}

function archiveEruption(eruption) {
  const geometries = eruption.meshes.map((mesh) => mesh.geometry.clone());
  if (basaltArchive) geometries.unshift(basaltArchive.geometry.clone());
  const merged = mergeGeometries(geometries, false);
  geometries.forEach((geometry) => geometry.dispose());
  eruption.meshes.forEach((mesh) => {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  });
  if (basaltArchive) {
    scene.remove(basaltArchive);
    basaltArchive.geometry.dispose();
    basaltArchive.material.dispose();
  }
  merged.setDrawRange(0, merged.index ? merged.index.count : Infinity);
  basaltArchive = new THREE.Mesh(merged, makeLavaMaterial(true));
  basaltArchive.material.uniforms.uAge.value = 99;
  basaltArchive.material.uniforms.uSolidification.value = 1;
  basaltArchive.material.uniforms.uReveal.value = 1;
  scene.add(basaltArchive);
}

const particleCount = 64;
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

const gasParticleCount = 36;
const gasGeometry = new THREE.BufferGeometry();
const gasPositions = new Float32Array(gasParticleCount * 3);
const gasSeeds = Array.from({ length: gasParticleCount }, (_, index) => ({
  vent: new THREE.Vector3(0, 8.4, 0),
  phase: Math.random(),
  speed: 0.55 + Math.random() * 0.6,
  drift: Math.random() * Math.PI * 2,
}));
gasGeometry.setAttribute("position", new THREE.BufferAttribute(gasPositions, 3));
const gasParticles = new THREE.Points(
  gasGeometry,
  new THREE.PointsMaterial({
    color: 0xd7c3aa,
    map: smokeTexture,
    alphaMap: smokeTexture,
    size: 0.95,
    transparent: true,
    opacity: 0.66,
    depthWrite: false,
    sizeAttenuation: true,
  }),
);
scene.add(gasParticles);

const bubbleGeometry = new THREE.BufferGeometry();
bubbleGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(gasParticleCount * 3), 3));
const surfaceBubbles = new THREE.Points(
  bubbleGeometry,
  new THREE.PointsMaterial({
    color: 0xffb24d,
    map: smokeTexture,
    alphaMap: smokeTexture,
    size: 0.58,
    transparent: true,
    opacity: 0.86,
    depthWrite: false,
    sizeAttenuation: true,
  }),
);
scene.add(surfaceBubbles);

const explosionCount = 48;
const explosionGeometry = new THREE.BufferGeometry();
const explosionPositions = new Float32Array(explosionCount * 3);
const explosionSeeds = Array.from({ length: explosionCount }, () => ({
  angle: Math.random() * Math.PI * 2,
  outward: 1.4 + Math.random() * 4.2,
  upward: 4 + Math.random() * 7,
  delay: Math.random() * 0.45,
}));
explosionGeometry.setAttribute("position", new THREE.BufferAttribute(explosionPositions, 3));
const explosion = new THREE.Points(
  explosionGeometry,
  new THREE.PointsMaterial({
    color: 0xff5a1f,
    map: smokeTexture,
    alphaMap: smokeTexture,
    size: 2.15,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    sizeAttenuation: true,
  }),
);
scene.add(explosion);
const explosionFlash = new THREE.Mesh(
  new THREE.SphereGeometry(0.8, 16, 10),
  new THREE.MeshBasicMaterial({
    color: 0xff7a24,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
  }),
);
explosionFlash.position.set(0, 12.8, 0);
explosionFlash.visible = false;
scene.add(explosionFlash);

let eruptionBoost = 0.35;
let timeScale = 1;
let simulationTime = 0;
let explosionStartedAt = -100;
let coolingTarget = 0;
const lavaMeshes = [];
let coolingProgress = 0;
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
craterLava.visible = false;

function startExplosion(time) {
  explosionStartedAt = time;
  eruptionBoost = 2.2;
  craterLava.visible = true;
  craterLava.material.uniforms.uAge.value = 0;
}

function updateExplosion(time) {
  const age = time - explosionStartedAt;
  const arr = explosionGeometry.attributes.position.array;
  explosionSeeds.forEach((seed, index) => {
    const life = Math.max(0, age - seed.delay);
    const radius = life * seed.outward;
    arr[index * 3] = Math.cos(seed.angle) * radius;
    arr[index * 3 + 1] = 12.6 + life * seed.upward - life * life * 4.6;
    arr[index * 3 + 2] = Math.sin(seed.angle) * radius;
  });
  explosionGeometry.attributes.position.needsUpdate = true;
  explosion.material.opacity = age >= 0 && age < 2.1 ? Math.max(0, 1 - age / 2.1) : 0;
  explosionFlash.visible = age >= 0 && age < 1.2;
  explosionFlash.scale.setScalar(1 + Math.max(0, age) * 3.8);
  explosionFlash.material.opacity = Math.max(0, 0.8 - age * 0.7);
  if (age > 2.1) eruptionBoost = activeEruptions.length ? 1 : 0.35;
}

function refreshGasVents(reveal) {
  const current = activeEruptions[0];
  if (!current) return;
  const candidates = [];
  current.paths.forEach(({ points }) => {
    [0.22, 0.42, 0.62, 0.8].forEach((fraction) => {
      if (fraction > reveal) return;
      const point = points[Math.min(points.length - 1, Math.floor(points.length * fraction))];
      candidates.push(point);
    });
  });
  if (!candidates.length) return;
  const bubbleArr = bubbleGeometry.attributes.position.array;
  gasSeeds.forEach((seed, index) => {
    const point = candidates[index % candidates.length];
    seed.vent.set(point.x, point.y + 0.32, point.z);
    bubbleArr[index * 3] = seed.vent.x;
    bubbleArr[index * 3 + 1] = seed.vent.y;
    bubbleArr[index * 3 + 2] = seed.vent.z;
  });
  bubbleGeometry.attributes.position.needsUpdate = true;
}

function updateEruptions(time) {
  const current = activeEruptions[0];
  if (!current) return;
  eruptButton.disabled = true;
  const age = time - current.startedAt;
  const reveal = THREE.MathUtils.clamp(age / flowDuration, 0, 1);
  refreshGasVents(reveal);
  current.meshes.forEach((mesh) => {
    mesh.material.uniforms.uReveal.value = reveal;
    mesh.material.uniforms.uAge.value = age;
    mesh.material.uniforms.uTime.value = visualFlowTime;
    mesh.material.uniforms.uSolidification.value = THREE.MathUtils.clamp((age - 10) / 8, 0, 1);
  });

  const progress = THREE.MathUtils.clamp(age / solidifyDuration, 0, 1);
  coolingBar.style.width = `${Math.round(progress * 100)}%`;
  coolingPercent.textContent = `${Math.round(progress * 100)}%`;
  coolingTitle.textContent = reveal < 1 ? "용암이 흘러가는 중" : "현무암으로 굳는 중";
  coolingMessage.textContent = reveal < 1
    ? "한 번 분출한 용암이 경사를 따라 아래로 흐르고 있어요."
    : "먼저 흘러나온 용암부터 서서히 어두운 현무암으로 굳고 있어요.";
  lessonTitle.innerHTML = reveal < 1 ? "용암이<br>흘러내려가고 있어요" : "용암이<br>현무암으로 굳고 있어요";

  if (age >= solidifyDuration && !current.complete) {
    current.complete = true;
    archiveEruption(current);
    activeEruptions.shift();
    craterLava.visible = false;
    eruptButton.disabled = false;
    eruptButton.textContent = "다시 분출하기";
    coolingTitle.textContent = "모든 용암이 굳었어요";
    coolingMessage.textContent = "기존 현무암은 그대로 남아 있습니다. 다시 분출할 수 있어요.";
    lessonTitle.innerHTML = "용암이<br>현무암이 되었어요";
  }
}

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

function updateLavaGas(time, cooling) {
  if (!activeEruptions.length) {
    gasParticles.material.opacity = 0;
    surfaceBubbles.material.opacity = 0;
    return;
  }
  const arr = gasGeometry.attributes.position.array;
  gasSeeds.forEach((seed, index) => {
    const life = (time * seed.speed + seed.phase * 4.5) % 4.5;
    const bubblePhase = Math.min(1, life / 0.55);
    const rise = life < 0.55
      ? Math.sin(bubblePhase * Math.PI) * 0.24
      : 0.18 + (life - 0.55) * 0.72;
    const spread = Math.max(0, life - 0.55) * 0.13;
    arr[index * 3] = seed.vent.x + Math.cos(seed.drift) * spread;
    arr[index * 3 + 1] = seed.vent.y + rise;
    arr[index * 3 + 2] = seed.vent.z + Math.sin(seed.drift) * spread;
  });
  gasGeometry.attributes.position.needsUpdate = true;
  gasParticles.material.opacity = 0.66 * (1 - cooling * 0.93);
  gasParticles.material.size = 0.95 + Math.sin(time * 4.5) * 0.1 * (1 - cooling);
  surfaceBubbles.material.opacity = 0.86 * (1 - cooling);
  surfaceBubbles.material.size = 0.58 + Math.sin(time * 5.2) * 0.16 * (1 - cooling);
}

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  const delta = Math.min(0.05, Math.max(0, elapsed - previousElapsed));
  previousElapsed = elapsed;
  simulationTime += delta * timeScale;
  controls.update();
  updateSmoke(simulationTime);
  updateExplosion(simulationTime);

  const lavaSurfaces = [craterLava, ...lavaMeshes];
  if (coolingActive) {
    coolingProgress = Math.min(1, (elapsed - coolingStartedAt) / coolingDuration);
    if (coolingProgress >= 1) coolingActive = false;
  }
  const easedCooling = THREE.MathUtils.smoothstep(coolingProgress, 0, 1);
  updateLavaGas(elapsed, easedCooling);
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

  visualFlowTime += delta * timeScale;
  updateEruptions(simulationTime);
  if (!activeEruptions.length) {
    gasParticles.material.opacity = 0;
    surfaceBubbles.material.opacity = 0;
    craterLava.visible = false;
    const archivedTriangles = basaltArchive
      ? (basaltArchive.geometry.index?.count || 0) / 3
      : 0;
    const atLimit = archivedTriangles >= maxArchivedTriangles;
    eruptButton.disabled = atLimit;
    eruptButton.textContent = atLimit
      ? "화산 표면이 충분히 덮였어요"
      : eruptionSerial > 0 ? "다시 분출하기" : "분출 시작하기";
    coolingTitle.textContent = eruptionSerial > 0 ? "모든 용암이 굳었어요" : "분출 전";
    coolingMessage.textContent = eruptionSerial > 0
      ? "기존 현무암은 그대로 남아 있습니다. 다시 분출할 수 있어요."
      : "분출 시작하기를 누르면 화산이 폭발하고 용암이 흘러나옵니다.";
    lessonTitle.innerHTML = eruptionSerial > 0
      ? "용암이<br>현무암이 되었어요"
      : "화산 분출을<br>시작해 보세요";
    coolingBar.style.width = eruptionSerial > 0 ? "100%" : "0%";
    coolingPercent.textContent = eruptionSerial > 0 ? "100%" : "0%";
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
const previewParams = new URLSearchParams(location.search);
if (previewParams.has("fast")) timeScale = 3;
if (previewParams.has("autoplay")) {
  const previewAge = Number(previewParams.get("age") || 0);
  beginEruption(-Math.max(0, previewAge));
}
animate();

document.querySelector("#erupt").addEventListener("click", (event) => {
  if (activeEruptions.length) return;
  beginEruption(simulationTime);
  coolingTitle.textContent = "분출이 시작됐어요";
  coolingMessage.textContent = "폭발 뒤 유한한 양의 용암이 무작위 경로로 흘러나옵니다.";
  lessonTitle.innerHTML = "화산이 폭발하며<br>용암이 나와요";
  return;
  eruptionBoost = eruptionBoost === 1 ? 2.4 : 1;
  event.currentTarget.textContent = eruptionBoost > 1 ? "분출 평소대로 보기" : "분출 강하게 보기";
});

document.querySelector("#cool").addEventListener("click", (event) => {
  timeScale = timeScale === 1 ? 3 : 1;
  event.currentTarget.textContent = timeScale > 1 ? "보통 속도로 보기" : "시간 빠르게 보기";
  return;
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
