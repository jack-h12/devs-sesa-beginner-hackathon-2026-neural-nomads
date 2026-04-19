import { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Html } from '@react-three/drei';
import * as THREE from 'three';

const PLANETS = [
  { name: 'Mercury', radius: 0.28, distance: 5,   speed: 0.8,  emissive: '#222',
    image: '/mercury.webp',
    wiki: 'https://en.wikipedia.org/wiki/Mercury_(planet)',
    info: 'The smallest planet and closest to the Sun — a barren, crater-covered world with virtually no atmosphere. Surface temperatures swing from 430°C by day to −180°C at night, the most extreme range in the solar system. Its surface resembles our Moon, pockmarked by ancient impact craters, and it completes a tight 88-day orbit while a single day lasts nearly two Mercury years due to its slow rotation.',
    facts: ['Diameter: 4,879 km', 'Day: 59 Earth days', 'Year: 88 Earth days', 'Temp: −180°C to 430°C', 'Moons: 0', 'Gravity: 3.7 m/s²', 'Distance from Sun: 57.9M km', 'Orbital speed: 47.4 km/s'] },
  { name: 'Venus',   radius: 0.45, distance: 8,   speed: 0.6,  emissive: '#3a2a10',
    image: '/venus.jpg',
    wiki: 'https://en.wikipedia.org/wiki/Venus',
    info: 'The hottest planet despite not being closest to the Sun. A suffocating CO₂ atmosphere traps heat in a runaway greenhouse effect, with crushing surface pressure 90× that of Earth and clouds of sulfuric acid. Venus rotates backwards and so slowly that a single day is longer than its year. Often called Earth\'s "evil twin" due to its similar size and mass, it is the brightest planet in our night sky.',
    facts: ['Diameter: 12,104 km', 'Day: 243 Earth days', 'Year: 225 Earth days', 'Temp: 465°C (avg)', 'Moons: 0', 'Gravity: 8.87 m/s²', 'Distance from Sun: 108.2M km', 'Atmosphere: 96% CO₂'] },
  { name: 'Earth',   radius: 0.48, distance: 11,  speed: 0.5,  emissive: '#0a1a30',
    image: '/earth.jpg',
    wiki: 'https://en.wikipedia.org/wiki/Earth',
    info: 'Our home — the only known world harbouring life. Liquid-water oceans cover 71% of the surface, and a protective magnetic field shields us from solar radiation. A nitrogen-oxygen atmosphere, plate tectonics, and a large stabilising Moon combine to create uniquely habitable conditions. Earth formed 4.54 billion years ago and supports an estimated 8.7 million species across every imaginable environment.',
    facts: ['Diameter: 12,742 km', 'Day: 24 hours', 'Year: 365.25 days', 'Temp: −89°C to 56°C', 'Moons: 1', 'Gravity: 9.81 m/s²', 'Distance from Sun: 149.6M km', 'Atmosphere: 78% N₂, 21% O₂'] },
  { name: 'Mars',    radius: 0.35, distance: 15,  speed: 0.4,  emissive: '#2a0a00',
    image: '/mars-new.jpg',
    wiki: 'https://en.wikipedia.org/wiki/Mars',
    info: 'The Red Planet hosts Olympus Mons — the tallest volcano in the solar system at 22 km — and Valles Marineris, a canyon system stretching 4,000 km across. Its rust-red colour comes from iron oxide on the surface. Evidence of ancient riverbeds and polar ice caps suggests Mars was once warmer and wetter; it is now the prime target in the search for past microbial life and for future human settlement.',
    facts: ['Diameter: 6,779 km', 'Day: 24.6 hours', 'Year: 687 Earth days', 'Temp: −87°C to −5°C', 'Moons: 2 (Phobos, Deimos)', 'Gravity: 3.72 m/s²', 'Distance from Sun: 227.9M km', 'Atmosphere: 95% CO₂ (thin)'] },
  { name: 'Jupiter', radius: 1.3,  distance: 22,  speed: 0.22, emissive: '#2a1a00',
    image: '/jupiter.jpg',
    wiki: 'https://en.wikipedia.org/wiki/Jupiter',
    info: 'The largest planet — a gas giant so massive it contains more than twice the mass of all other planets combined. Its Great Red Spot is a storm that has raged for over 350 years and is wider than Earth itself. Jupiter\'s strong magnetic field and 95 known moons (including volcanic Io and icy Europa, which may harbour a subsurface ocean) make it a miniature solar system in its own right.',
    facts: ['Diameter: 139,820 km', 'Day: 9.9 hours', 'Year: 11.9 Earth years', 'Temp: −110°C (clouds)', 'Moons: 95', 'Gravity: 24.79 m/s²', 'Distance from Sun: 778.5M km', 'Composition: H₂ + He'] },
  { name: 'Saturn',  radius: 1.1,  distance: 30,  speed: 0.18, emissive: '#2a2000',
    image: '/saturn.jpg',
    wiki: 'https://en.wikipedia.org/wiki/Saturn',
    info: 'The ringed jewel of the solar system. Saturn\'s rings are made of billions of ice and rock particles and span up to 282,000 km across, yet are only about 10 metres thick. Less dense than water, Saturn would float if you could find a big enough bath. Its moon Titan is the only moon with a substantial atmosphere and hosts lakes of liquid methane; Enceladus shoots geysers of water into space.',
    facts: ['Diameter: 116,460 km', 'Day: 10.7 hours', 'Year: 29.5 Earth years', 'Temp: −140°C (avg)', 'Moons: 146', 'Gravity: 10.44 m/s²', 'Distance from Sun: 1.43B km', 'Ring span: 282,000 km'] },
  { name: 'Uranus',  radius: 0.75, distance: 38,  speed: 0.12, emissive: '#0a2a2a',
    image: '/uranus.jpg',
    wiki: 'https://en.wikipedia.org/wiki/Uranus',
    info: 'An ice giant tilted 98° on its axis — it literally rolls around the Sun on its side, possibly due to an ancient collision with an Earth-sized object. Its pale blue-green colour comes from methane gas absorbing red light in the upper atmosphere. Each pole experiences 42 years of continuous sunlight followed by 42 years of darkness. Uranus has a faint set of rings and 27 moons named after Shakespeare and Pope characters.',
    facts: ['Diameter: 50,724 km', 'Day: 17.2 hours', 'Year: 84 Earth years', 'Temp: −195°C (avg)', 'Moons: 27', 'Gravity: 8.69 m/s²', 'Distance from Sun: 2.87B km', 'Axial tilt: 98°'] },
  { name: 'Neptune', radius: 0.72, distance: 46,  speed: 0.09, emissive: '#0a0a2a',
    image: '/neptune.jpg',
    wiki: 'https://en.wikipedia.org/wiki/Neptune',
    info: 'The windiest planet in the solar system, with supersonic storms exceeding 2,100 km/h. Despite being the farthest planet from the Sun, it radiates more heat than it receives, driving violent weather. Its deep blue colour comes from atmospheric methane. Neptune was the first planet discovered through mathematical prediction rather than observation, in 1846. Its largest moon, Triton, orbits backwards and is likely a captured dwarf planet.',
    facts: ['Diameter: 49,244 km', 'Day: 16.1 hours', 'Year: 165 Earth years', 'Temp: −200°C (avg)', 'Moons: 16', 'Gravity: 11.15 m/s²', 'Distance from Sun: 4.5B km', 'Wind speed: up to 2,100 km/h'] },
];

const SUN_BODY = {
  name: 'Sun', radius: 2.5,
  image: '/sun.webp',
  wiki: 'https://en.wikipedia.org/wiki/Sun',
  info: 'Our home star — a G-type main-sequence star 4.6 billion years old. It contains 99.86% of all mass in the solar system and will continue to burn hydrogen into helium for another 5 billion years before swelling into a red giant and engulfing the inner planets. Each second, the Sun converts 600 million tons of hydrogen into helium, releasing enough energy to power civilisation for millions of years. Its 11-year magnetic cycle drives sunspots, flares, and coronal mass ejections that shape space weather across the solar system.',
  facts: ['Age: 4.6 billion years', 'Diameter: 1,392,700 km', 'Surface temp: 5,500°C', 'Core temp: 15,000,000°C', 'Distance to Earth: 150M km', 'Light travel time: 8 min 20 s', 'Mass: 1.989 × 10³⁰ kg', 'Composition: 73% H, 25% He'],
};

const ALL_BODIES = [SUN_BODY, ...PLANETS];

// ── Procedural texture helpers ───────────────────────────────────────────────
const TEX_W = 512, TEX_H = 256;

function makeNoise(seed: number) {
  const hash = (a: number, b: number) => {
    const s = Math.sin(a * 127.1 + b * 311.7 + seed * 43.23) * 43758.5453;
    return s - Math.floor(s);
  };
  return (x: number, y: number) => {
    const i = Math.floor(x), j = Math.floor(y);
    const fx = x - i, fy = y - j;
    const u = fx*fx*(3-2*fx), v = fy*fy*(3-2*fy);
    const a = hash(i, j), b = hash(i+1, j), c = hash(i, j+1), d = hash(i+1, j+1);
    return a*(1-u)*(1-v) + b*u*(1-v) + c*(1-u)*v + d*u*v;
  };
}

function fbm(n: (x: number, y: number) => number, x: number, y: number, oct = 4) {
  let v = 0, a = 0.5, f = 1, norm = 0;
  for (let i = 0; i < oct; i++) { v += a * n(x * f, y * f); norm += a; f *= 2; a *= 0.5; }
  return v / norm;
}

function pixelTexture(fn: (x: number, y: number, u: number, v: number) => [number, number, number]) {
  const c = document.createElement('canvas');
  c.width = TEX_W; c.height = TEX_H;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(TEX_W, TEX_H);
  const data = img.data;
  for (let y = 0; y < TEX_H; y++) {
    const v = y / TEX_H;
    for (let x = 0; x < TEX_W; x++) {
      const u = x / TEX_W;
      const i = (y * TEX_W + x) * 4;
      const [r, g, b] = fn(x, y, u, v);
      data[i] = r; data[i+1] = g; data[i+2] = b; data[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

const clamp = (v: number, lo = 0, hi = 255) => v < lo ? lo : v > hi ? hi : v;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpColor = (a: [number,number,number], b: [number,number,number], t: number): [number,number,number] =>
  [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const poleFade = (v: number) => 1 - Math.pow(Math.abs(v - 0.5) * 2, 4); // 1 at equator → 0 at poles

function makeMercuryTexture(): THREE.Texture {
  const n1 = makeNoise(11), n2 = makeNoise(12), nc = makeNoise(13);
  return pixelTexture((_x, _y, u, v) => {
    const detail = fbm(n1, u * 16, v * 8, 6);
    const ridges = Math.abs(fbm(n2, u * 24, v * 12, 5) - 0.5) * 2;
    const craterField = Math.pow(1 - fbm(nc, u * 30, v * 15, 4), 4);
    const base = 95 + detail * 110 - ridges * 20 - craterField * 60;
    return [clamp(base * 1.06), clamp(base * 0.98), clamp(base * 0.9)];
  });
}

function makeVenusTexture(): THREE.Texture {
  const n1 = makeNoise(21), n2 = makeNoise(22);
  return pixelTexture((_x, _y, u, v) => {
    const swirl = fbm(n1, u * 6 + Math.sin(v * Math.PI * 3) * 0.4, v * 10, 6);
    const fine = fbm(n2, u * 30, v * 20, 4);
    const t = swirl * 0.7 + fine * 0.3;
    const c = lerpColor([180, 120, 50], [240, 210, 140], t);
    return [c[0], c[1], c[2]];
  });
}

function makeEarthTexture(): THREE.Texture {
  const continents = makeNoise(31), terrain = makeNoise(32), clouds = makeNoise(33);
  return pixelTexture((_x, _y, u, v) => {
    const land = fbm(continents, u * 4, v * 3, 6);
    const tex = fbm(terrain, u * 24, v * 18, 5);
    const cl = fbm(clouds, u * 6 + 0.3, v * 4, 5);
    const polar = Math.pow(Math.abs(v - 0.5) * 2, 6);
    let r: number, g: number, b: number;
    if (land < 0.48) {
      // ocean — depth-shaded blue
      const depth = (0.48 - land) / 0.48;
      r = 12 + tex * 18; g = 50 + tex * 30 - depth * 20; b = 110 + tex * 40 - depth * 30;
    } else {
      // land — biome by latitude + noise
      const arid = Math.pow(1 - Math.abs(v - 0.5) * 2, 0.7);
      const fertile = lerpColor([60, 110, 35], [120, 150, 70], tex);
      const desert = lerpColor([180, 150, 90], [210, 180, 120], tex);
      const c = lerpColor(desert, fertile, arid);
      r = c[0]; g = c[1]; b = c[2];
    }
    // ice caps
    const ice = Math.max(0, polar - 0.4) * 1.6;
    r = lerp(r, 245, Math.min(ice, 1));
    g = lerp(g, 250, Math.min(ice, 1));
    b = lerp(b, 255, Math.min(ice, 1));
    // clouds
    const cloudMask = Math.max(0, cl - 0.55) * 2.2;
    r = lerp(r, 245, Math.min(cloudMask, 0.85));
    g = lerp(g, 248, Math.min(cloudMask, 0.85));
    b = lerp(b, 250, Math.min(cloudMask, 0.85));
    return [clamp(r), clamp(g), clamp(b)];
  });
}

function makeMarsTexture(): THREE.Texture {
  const n1 = makeNoise(41), n2 = makeNoise(42), nc = makeNoise(43);
  return pixelTexture((_x, _y, u, v) => {
    const base = fbm(n1, u * 8, v * 5, 6);
    const detail = fbm(n2, u * 28, v * 18, 5);
    const craters = Math.pow(1 - fbm(nc, u * 35, v * 20, 4), 5);
    const polar = Math.max(0, Math.pow(Math.abs(v - 0.5) * 2, 8) - 0.3) * 1.5;
    let r = 150 + base * 80 + detail * 30 - craters * 40;
    let g = 60 + base * 45 + detail * 18 - craters * 25;
    let b = 30 + base * 25 + detail * 10 - craters * 18;
    r = lerp(r, 230, Math.min(polar, 0.9));
    g = lerp(g, 230, Math.min(polar, 0.9));
    b = lerp(b, 240, Math.min(polar, 0.9));
    return [clamp(r), clamp(g), clamp(b)];
  });
}

function makeJupiterTexture(): THREE.Texture {
  const turbulence = makeNoise(51), bands = makeNoise(52);
  return pixelTexture((_x, _y, u, v) => {
    // distort latitude with turbulence so bands have flow
    const distort = (fbm(turbulence, u * 6, v * 12, 5) - 0.5) * 0.06;
    const lat = v + distort;
    const bandWave = Math.sin(lat * Math.PI * 14) * 0.5 + 0.5;
    const bandNoise = fbm(bands, u * 20, lat * 30, 5);
    const t = bandWave * 0.7 + bandNoise * 0.3;
    const dark: [number,number,number] = [125, 80, 45];
    const light: [number,number,number] = [225, 195, 150];
    let c = lerpColor(dark, light, t);
    // Great Red Spot
    const dx = (u - 0.62) * 1.8, dy = (v - 0.6) * 4;
    const spot = Math.exp(-(dx*dx + dy*dy) * 6);
    c = lerpColor(c, [180, 70, 45], Math.min(spot * 1.2, 0.9));
    return [c[0], c[1], c[2]];
  });
}

function makeSaturnTexture(): THREE.Texture {
  const turbulence = makeNoise(61), bands = makeNoise(62);
  return pixelTexture((_x, _y, u, v) => {
    const distort = (fbm(turbulence, u * 5, v * 10, 4) - 0.5) * 0.04;
    const lat = v + distort;
    const bandWave = Math.sin(lat * Math.PI * 10) * 0.5 + 0.5;
    const bandNoise = fbm(bands, u * 16, lat * 24, 4);
    const t = bandWave * 0.6 + bandNoise * 0.4;
    const c = lerpColor([175, 145, 90], [240, 220, 175], t);
    return [c[0], c[1], c[2]];
  });
}

function makeUranusTexture(): THREE.Texture {
  const n1 = makeNoise(71);
  return pixelTexture((_x, _y, u, v) => {
    const cloud = fbm(n1, u * 5, v * 8, 5);
    const band = Math.sin(v * Math.PI * 6) * 0.04;
    const t = cloud * 0.4 + band + 0.4;
    const c = lerpColor([130, 200, 215], [200, 240, 245], t);
    return [c[0], c[1], c[2]];
  });
}

function makeNeptuneTexture(): THREE.Texture {
  const n1 = makeNoise(81), n2 = makeNoise(82);
  return pixelTexture((_x, _y, u, v) => {
    const distort = (fbm(n1, u * 4, v * 6, 5) - 0.5) * 0.08;
    const lat = v + distort;
    const bandWave = Math.sin(lat * Math.PI * 6) * 0.5 + 0.5;
    const noise = fbm(n2, u * 14, lat * 20, 5);
    const t = bandWave * 0.5 + noise * 0.5;
    let c = lerpColor([28, 55, 140], [90, 140, 220], t);
    // dark spot
    const dx = (u - 0.4) * 2, dy = (v - 0.4) * 4;
    const spot = Math.exp(-(dx*dx + dy*dy) * 8);
    c = lerpColor(c, [20, 30, 80], Math.min(spot, 0.7));
    return [c[0], c[1], c[2]];
  });
}

function makeSunTexture(): THREE.Texture {
  const granule = makeNoise(91), filaments = makeNoise(92), spots = makeNoise(93);
  return pixelTexture((_x, _y, u, v) => {
    // fine granulation cells
    const cells = fbm(granule, u * 80, v * 60, 5);
    // larger swirling magnetic filaments
    const swirl = fbm(filaments, u * 12 + Math.sin(v * Math.PI * 4) * 0.3, v * 18, 6);
    // sunspot mask — sparse dark patches
    const spotField = Math.pow(Math.max(0, fbm(spots, u * 10, v * 6, 4) - 0.62), 1.8) * 5;
    const t = cells * 0.4 + swirl * 0.6;
    // hot core → cooler edges within texture
    const core: [number,number,number] = [255, 248, 200];
    const mid:  [number,number,number] = [255, 180, 60];
    const cool: [number,number,number] = [220, 95, 25];
    let c = t > 0.5 ? lerpColor(mid, core, (t - 0.5) * 2) : lerpColor(cool, mid, t * 2);
    // sunspots — darken
    c = lerpColor(c, [55, 25, 10], Math.min(spotField, 0.9));
    // gentle pole fade for limb darkening hint
    const fade = 0.55 + 0.45 * poleFade(v);
    return [clamp(c[0] * fade), clamp(c[1] * fade), clamp(c[2] * fade)];
  });
}

type TextureMap = Record<string, THREE.Texture>;
const TEXTURE_STEPS: [string, () => THREE.Texture][] = [
  ['Sun',     makeSunTexture],
  ['Mercury', makeMercuryTexture],
  ['Venus',   makeVenusTexture],
  ['Earth',   makeEarthTexture],
  ['Mars',    makeMarsTexture],
  ['Jupiter', makeJupiterTexture],
  ['Saturn',  makeSaturnTexture],
  ['Uranus',  makeUranusTexture],
  ['Neptune', makeNeptuneTexture],
];

function useTextures(): { textures: TextureMap | null; progress: number; current: string } {
  const [state, setState] = useState<{ textures: TextureMap | null; progress: number; current: string }>(
    { textures: null, progress: 0, current: 'Initialising' }
  );
  useEffect(() => {
    let cancelled = false;
    const result: TextureMap = {};
    let i = 0;
    const step = () => {
      if (cancelled) return;
      if (i >= TEXTURE_STEPS.length) {
        setState({ textures: result, progress: 1, current: 'Ready' });
        return;
      }
      const [name, fn] = TEXTURE_STEPS[i];
      setState({ textures: null, progress: i / TEXTURE_STEPS.length, current: name });
      // Yield so the loading screen can paint before the heavy synchronous work
      setTimeout(() => {
        if (cancelled) return;
        result[name] = fn();
        i++;
        setTimeout(step, 0);
      }, 16);
    };
    step();
    return () => { cancelled = true; };
  }, []);
  return state;
}

function ExplorerLoadingScreen({ progress, current }: { progress: number; current: string }) {
  const pct = Math.round(progress * 100);
  return (
    <div style={{
      position:'absolute', inset:0, zIndex:100, display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', background:'radial-gradient(ellipse at 50% 40%, #0a1530 0%, #020810 70%)',
      color:'rgba(200,220,255,0.9)', fontFamily:'monospace',
    }}>
      {/* Spinning orbital rings */}
      <div style={{ position:'relative', width:120, height:120, marginBottom:32 }}>
        <div style={{
          position:'absolute', inset:0, border:'2px solid rgba(100,180,255,0.15)',
          borderTopColor:'rgba(120,200,255,0.9)', borderRadius:'50%',
          animation:'explorer-spin 1.2s linear infinite',
        }}/>
        <div style={{
          position:'absolute', inset:14, border:'2px solid rgba(255,180,100,0.12)',
          borderRightColor:'rgba(255,200,120,0.8)', borderRadius:'50%',
          animation:'explorer-spin 1.8s linear infinite reverse',
        }}/>
        <div style={{
          position:'absolute', inset:30, border:'1px solid rgba(180,140,255,0.12)',
          borderBottomColor:'rgba(200,160,255,0.7)', borderRadius:'50%',
          animation:'explorer-spin 2.6s linear infinite',
        }}/>
        {/* Sun core */}
        <div style={{
          position:'absolute', inset:'50%', width:14, height:14, margin:'-7px 0 0 -7px',
          borderRadius:'50%', background:'radial-gradient(#fff8a0, #FDB813 60%, #cc4400)',
          boxShadow:'0 0 24px rgba(255,180,60,0.8)',
        }}/>
      </div>

      <div style={{ fontSize:11, letterSpacing:'0.3em', color:'rgba(100,180,255,0.6)', marginBottom:10 }}>
        INITIALISING STELLAR NAVIGATOR
      </div>
      <div style={{ fontSize:14, color:'rgba(220,235,255,0.95)', marginBottom:16 }}>
        Generating {current}…
      </div>

      <div style={{ width:280, height:4, background:'rgba(100,180,255,0.1)', borderRadius:2, overflow:'hidden', border:'1px solid rgba(100,180,255,0.15)' }}>
        <div style={{
          width:`${pct}%`, height:'100%',
          background:'linear-gradient(to right, #3af, #6ff)',
          transition:'width 0.3s', boxShadow:'0 0 8px rgba(100,200,255,0.6)',
        }}/>
      </div>
      <div style={{ fontSize:10, color:'rgba(100,180,255,0.5)', marginTop:8, letterSpacing:'0.1em' }}>
        {pct}%
      </div>

      <style>{`@keyframes explorer-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function SaturnRings({ radius }: { radius: number }) {
  return (
    <group rotation={[Math.PI/2.8,0,0.3]}>
      <mesh><ringGeometry args={[radius*1.5,radius*2,80]}/><meshBasicMaterial color="#d4c080" transparent opacity={0.55} side={THREE.DoubleSide}/></mesh>
      <mesh><ringGeometry args={[radius*2.1,radius*2.5,80]}/><meshBasicMaterial color="#c8b070" transparent opacity={0.3} side={THREE.DoubleSide}/></mesh>
    </group>
  );
}

function Sun({ tex }: { tex: THREE.Texture }) {
  const ref = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const flareRef = useRef<THREE.Mesh>(null);
  useFrame((state, d) => {
    if (ref.current) ref.current.rotation.y += d * 0.03;
    // Gentle corona pulse
    const t = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 0.8) * 0.015;
    if (coronaRef.current) coronaRef.current.scale.setScalar(pulse);
    if (flareRef.current) flareRef.current.scale.setScalar(1 + Math.sin(t * 0.5) * 0.03);
    sharedPositions['Sun'] = new THREE.Vector3(0, 0, 0);
  });
  return (
    <group>
      {/* Photosphere */}
      <mesh ref={ref}>
        <sphereGeometry args={[2.5, 128, 128]}/>
        <meshBasicMaterial map={tex} toneMapped={false}/>
      </mesh>
      {/* Chromosphere glow */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[2.62, 48, 48]}/>
        <meshBasicMaterial color="#ffb060" transparent opacity={0.28} side={THREE.BackSide} depthWrite={false}/>
      </mesh>
      {/* Inner corona */}
      <mesh>
        <sphereGeometry args={[2.85, 48, 48]}/>
        <meshBasicMaterial color="#ff8830" transparent opacity={0.18} side={THREE.BackSide} depthWrite={false}/>
      </mesh>
      {/* Outer corona */}
      <mesh ref={flareRef}>
        <sphereGeometry args={[3.4, 48, 48]}/>
        <meshBasicMaterial color="#ff5a10" transparent opacity={0.08} side={THREE.BackSide} depthWrite={false}/>
      </mesh>
      {/* Far halo */}
      <mesh>
        <sphereGeometry args={[4.3, 32, 32]}/>
        <meshBasicMaterial color="#ff4010" transparent opacity={0.035} side={THREE.BackSide} depthWrite={false}/>
      </mesh>
    </group>
  );
}

// Shared planet positions for fly-to feature
const sharedPositions: Record<string, THREE.Vector3> = {};

function Planet({ name, radius, distance, speed, emissive, texture, selected, onSelect }: {
  name: string; radius: number; distance: number; speed: number; emissive: string;
  texture: THREE.Texture; selected: boolean; onSelect: (n: string|null) => void;
}) {
  const { camera } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const angleRef = useRef(Math.random() * Math.PI * 2);
  const [labelVisible, setLabelVisible] = useState(true);
  const labelVisibleRef = useRef(true);
  const frustum = useMemo(() => new THREE.Frustum(), []);
  const projMatrix = useMemo(() => new THREE.Matrix4(), []);

  // Orbit ring
  const orbitPoints = useMemo(() => {
    const pts = [];
    for(let i=0;i<=128;i++){const a=(i/128)*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a)*distance,0,Math.sin(a)*distance));}
    return pts;
  }, [distance]);
  const orbitGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(orbitPoints), [orbitPoints]);
  const orbitLine = useMemo(() => new THREE.Line(orbitGeo, new THREE.LineBasicMaterial({ color:'#2a3a6a', transparent:true, opacity:0.4 })), [orbitGeo]);

  useFrame((_,d) => {
    angleRef.current += d * speed * 0.06;
    const x = Math.cos(angleRef.current) * distance;
    const z = Math.sin(angleRef.current) * distance;
    if (groupRef.current) groupRef.current.position.set(x, 0, z);
    if (meshRef.current) meshRef.current.rotation.y += d * 0.3;
    sharedPositions[name] = new THREE.Vector3(x, 0, z);

    // Only show label when planet is inside the camera frustum
    projMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projMatrix);
    const inView = frustum.containsPoint(new THREE.Vector3(x, 0, z));
    if (inView !== labelVisibleRef.current) {
      labelVisibleRef.current = inView;
      setLabelVisible(inView);
    }
  });

  return (
    <>
      <primitive object={orbitLine} />
      <group ref={groupRef}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[radius, 96, 96]}/>
          <meshStandardMaterial
            map={texture}
            bumpMap={texture}
            bumpScale={0.05}
            emissive={emissive}
            emissiveIntensity={0.2}
            roughness={name==='Earth'?0.55:0.9}
            metalness={0.05}
          />
        </mesh>
        <mesh onClick={e=>{e.stopPropagation();onSelect(selected?null:name);}}>
          <sphereGeometry args={[Math.max(radius*2.5,1.8),16,16]}/>
          <meshBasicMaterial transparent opacity={0} depthWrite={false}/>
        </mesh>
        {name==='Saturn' && <SaturnRings radius={radius}/>}
        {labelVisible && (
          <Html center position={[0,radius+1,0]} distanceFactor={25} occlude={false} zIndexRange={[15, 0]}>
            <div onClick={()=>onSelect(selected?null:name)} style={{color:selected?'#fde68a':'rgba(200,210,255,0.9)',fontSize:'12px',fontWeight:selected?'bold':'normal',whiteSpace:'nowrap',cursor:'pointer',textShadow:'0 0 8px rgba(0,0,0,1)',userSelect:'none'}}>
              {name}
            </div>
          </Html>
        )}
      </group>
    </>
  );
}

function FirstPersonController({
  keysRef,
  flyTarget,
  flyPlanetRef,
  onArrived,
  onSpeedChange,
  onLookAt,
  mouseInsideRef,
}: {
  keysRef: React.RefObject<{ w:boolean;a:boolean;s:boolean;d:boolean;space:boolean;shift:boolean;c:boolean }>;
  flyTarget: React.RefObject<THREE.Vector3|null>;
  flyPlanetRef: React.RefObject<string|null>;
  onArrived: () => void;
  onSpeedChange: (s: number) => void;
  onLookAt: (planet: string | null) => void;
  mouseInsideRef: React.RefObject<boolean>;
}) {
  const { camera } = useThree();
  const euler = useRef(new THREE.Euler(0,0,0,'YXZ'));
  const lastMouse = useRef({ x: 0, y: 0 });
  const vel = useRef(new THREE.Vector3());
  const arrivedRef = useRef(onArrived);
  const speedRef = useRef(onSpeedChange);
  const lookAtRef = useRef(onLookAt);
  const lastLookedAt = useRef<string|null>(null);
  arrivedRef.current = onArrived;
  speedRef.current = onSpeedChange;
  lookAtRef.current = onLookAt;

  useEffect(() => {
    camera.position.set(13, 2, 4);
    camera.lookAt(0, 0, 0);
    euler.current.setFromQuaternion(camera.quaternion, 'YXZ');
  }, [camera]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      let dx: number, dy: number;
      if (document.pointerLockElement) {
        // Pointer lock: movementX/Y is reliable and unbounded
        dx = e.movementX;
        dy = e.movementY;
      } else if (mouseInsideRef.current) {
        // Free-look: use clientX/Y delta — reliable without pointer lock
        dx = e.clientX - lastMouse.current.x;
        dy = e.clientY - lastMouse.current.y;
      } else {
        lastMouse.current = { x: e.clientX, y: e.clientY };
        return;
      }
      lastMouse.current = { x: e.clientX, y: e.clientY };
      euler.current.y -= dx * 0.003;
      euler.current.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, euler.current.x - dy * 0.003));
      camera.quaternion.setFromEuler(euler.current);
    };
    window.addEventListener('mousemove', onMove);
    return () => { window.removeEventListener('mousemove', onMove); };
  }, [camera, mouseInsideRef]);

  const fwd = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3(0,1,0));

  useFrame((_,delta) => {
    // Auto-fly — dynamically track planet's current position each frame
    if (flyPlanetRef.current) {
      const planetPos = sharedPositions[flyPlanetRef.current];
      const planet = ALL_BODIES.find(p => p.name === flyPlanetRef.current);
      if (planetPos && planet) {
        const offset = new THREE.Vector3(0, 1.5, planet.radius + 4);
        const camTarget = planetPos.clone().add(offset);
        flyTarget.current = camTarget;
        camera.position.lerp(camTarget, delta * 2.5);

        // Smoothly rotate camera to face the planet
        const lookTarget = new THREE.Matrix4();
        lookTarget.lookAt(camera.position, planetPos, up.current);
        const targetQuat = new THREE.Quaternion().setFromRotationMatrix(lookTarget);
        camera.quaternion.slerp(targetQuat, delta * 4);
        euler.current.setFromQuaternion(camera.quaternion, 'YXZ');

        if (camera.position.distanceTo(camTarget) < 1.2) {
          flyPlanetRef.current = null;
          flyTarget.current = null;
          arrivedRef.current();
        }
        speedRef.current(Math.round(camera.position.distanceTo(camTarget) * 2.5 * 2778 / 10) * 10);
      } else {
        // Destination unknown or not yet positioned — abort rather than wedge the UI
        flyPlanetRef.current = null;
        flyTarget.current = null;
        arrivedRef.current();
      }
      return;
    }

    const keys = keysRef.current!;
    const boost = keys.shift ? 2 : 1;
    const speed = 4 * boost;

    camera.getWorldDirection(fwd.current);
    right.current.crossVectors(fwd.current, up.current).normalize();

    const move = new THREE.Vector3();
    if (keys.w) move.addScaledVector(fwd.current, speed * delta);
    if (keys.s) move.addScaledVector(fwd.current, -speed * delta);
    if (keys.a) move.addScaledVector(right.current, -speed * delta);
    if (keys.d) move.addScaledVector(right.current, speed * delta);
    if (keys.space) move.y += speed * delta;
    if (keys.c) move.y -= speed * delta;

    vel.current.lerp(move, 8 * delta);
    camera.position.add(vel.current);

    // vel is per-frame displacement; divide by delta → units/s, ×2778 → m/s (normal ≈ 11,000 m/s)
    const spd = (vel.current.length() / delta) * 2778;
    speedRef.current(Math.round(spd / 10) * 10);

    // Crosshair detection — includes Sun + all planets
    camera.getWorldDirection(fwd.current);
    let lookedAt: string | null = null;
    let minAngle = Infinity;
    for (const planet of ALL_BODIES) {
      const pos = sharedPositions[planet.name];
      if (!pos) continue;
      const toPlanet = pos.clone().sub(camera.position);
      const dist = toPlanet.length();
      const angle = fwd.current.angleTo(toPlanet.normalize());
      const threshold = Math.atan2(planet.radius * 3, dist) + 0.04;
      if (angle < threshold && angle < minAngle) { minAngle = angle; lookedAt = planet.name; }
    }
    if (lookedAt !== lastLookedAt.current) {
      lastLookedAt.current = lookedAt;
      lookAtRef.current(lookedAt);
    }
  });

  return null;
}

// ── Cockpit overlay ───────────────────────────────────────────────────────────

function CockpitHUD({ speed, lockedPlanet, flying }: { speed: number; lockedPlanet: string | null; flying: boolean }) {
  const body = ALL_BODIES.find(b => b.name === lockedPlanet) ?? null;
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 100);
    return () => clearInterval(id);
  }, []);

  const heading = (tick * 0.4) % 360;

  // Rivet row helper
  const rivets = (count: number) => Array.from({ length: count }, (_, i) => i);

  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:20, overflow:'hidden' }}>

      {/* ── Cockpit window frame (curved, beveled) ── */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <mask id="cockpit-mask">
            <rect width="100" height="100" fill="white"/>
            {/* Curved cockpit canopy cutout */}
            <path d="M 4 3 Q 50 0 96 3 L 98 72 Q 50 80 2 72 Z" fill="black"/>
          </mask>
          <linearGradient id="frame-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a2340"/>
            <stop offset="50%" stopColor="#0c1228"/>
            <stop offset="100%" stopColor="#050812"/>
          </linearGradient>
          <linearGradient id="strut-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(80,120,200,0.3)"/>
            <stop offset="50%" stopColor="rgba(120,180,255,0.6)"/>
            <stop offset="100%" stopColor="rgba(80,120,200,0.3)"/>
          </linearGradient>
        </defs>
        {/* Opaque frame surrounding viewport */}
        <rect width="100" height="100" fill="url(#frame-grad)" mask="url(#cockpit-mask)"/>
        {/* Glowing viewport edge */}
        <path d="M 4 3 Q 50 0 96 3 L 98 72 Q 50 80 2 72 Z" fill="none" stroke="rgba(100,180,255,0.35)" strokeWidth="0.25"/>
        <path d="M 5 4 Q 50 1 95 4 L 97 71 Q 50 79 3 71 Z" fill="none" stroke="rgba(140,210,255,0.15)" strokeWidth="0.15"/>
      </svg>

      {/* ── CRT scanlines ── */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        background:'repeating-linear-gradient(to bottom, transparent 0, transparent 2px, rgba(100,180,255,0.025) 2px, rgba(100,180,255,0.025) 3px)',
        mixBlendMode:'screen',
      }}/>

      {/* ── Vignette ── */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 75% 60% at 50% 36%, transparent 50%, rgba(0,5,20,0.7) 100%)' }}/>

      {/* ── Left wall strut with rivets ── */}
      <div style={{ position:'absolute', left:0, top:0, bottom:'26%', width:'4.5%', background:'linear-gradient(to right, rgba(8,12,30,0.95), rgba(15,22,50,0.92) 50%, rgba(10,15,35,0.9))', borderRight:'1px solid rgba(80,130,220,0.3)' }}>
        {/* vertical LED strip */}
        <div style={{ position:'absolute', right:4, top:'8%', bottom:'8%', width:2, background:'linear-gradient(to bottom, rgba(100,200,255,0.6), rgba(100,200,255,0.2), rgba(100,200,255,0.6))', boxShadow:'0 0 6px rgba(100,200,255,0.4)' }}/>
        {/* rivets */}
        {rivets(10).map(i => (
          <div key={i} style={{ position:'absolute', left:'50%', top:`${5 + i*9.5}%`, transform:'translateX(-50%)', width:6, height:6, borderRadius:'50%', background:'radial-gradient(circle at 30% 30%, #3a4a70, #0a1020)', boxShadow:'inset 0 0 2px rgba(0,0,0,0.8), 0 0 1px rgba(100,160,255,0.3)' }}/>
        ))}
      </div>

      {/* ── Right wall strut with rivets ── */}
      <div style={{ position:'absolute', right:0, top:0, bottom:'26%', width:'4.5%', background:'linear-gradient(to left, rgba(8,12,30,0.95), rgba(15,22,50,0.92) 50%, rgba(10,15,35,0.9))', borderLeft:'1px solid rgba(80,130,220,0.3)' }}>
        <div style={{ position:'absolute', left:4, top:'8%', bottom:'8%', width:2, background:'linear-gradient(to bottom, rgba(255,180,100,0.5), rgba(255,180,100,0.15), rgba(255,180,100,0.5))', boxShadow:'0 0 6px rgba(255,180,100,0.3)' }}/>
        {rivets(10).map(i => (
          <div key={i} style={{ position:'absolute', right:'50%', top:`${5 + i*9.5}%`, transform:'translateX(50%)', width:6, height:6, borderRadius:'50%', background:'radial-gradient(circle at 30% 30%, #3a4a70, #0a1020)', boxShadow:'inset 0 0 2px rgba(0,0,0,0.8), 0 0 1px rgba(100,160,255,0.3)' }}/>
        ))}
      </div>

      {/* ── Top bar with heading tape ── */}
      <div style={{ position:'absolute', top:'3%', left:'10%', right:'10%', display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:'monospace' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'rgba(100,255,150,0.9)', boxShadow:'0 0 6px rgba(100,255,150,0.8)', animation:'hud-blink 1.8s infinite' }}/>
          <div style={{ color:'rgba(100,200,255,0.75)', fontSize:'10px', letterSpacing:'0.15em' }}>SYS ONLINE</div>
        </div>
        <div style={{ color:'rgba(100,200,255,0.5)', fontSize:'9px', letterSpacing:'0.2em' }}>◈ STELLAR NAVIGATOR · MODEL SN-2.4 · CLASS-VII</div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ color: flying ? 'rgba(255,200,50,0.95)' : 'rgba(100,255,150,0.75)', fontSize:'10px', letterSpacing:'0.15em' }}>
            {flying ? 'AUTOPILOT' : 'MANUAL'}
          </div>
          <div style={{ width:6, height:6, borderRadius:'50%', background: flying ? 'rgba(255,200,50,0.95)' : 'rgba(100,255,150,0.8)', boxShadow: flying ? '0 0 6px rgba(255,200,50,0.7)' : '0 0 6px rgba(100,255,150,0.7)', animation: flying ? 'hud-blink 0.5s infinite' : undefined }}/>
        </div>
      </div>

      {/* ── Heading tape ── */}
      <div style={{ position:'absolute', top:'7%', left:'30%', right:'30%', height:18, display:'flex', justifyContent:'center', alignItems:'center', fontFamily:'monospace', pointerEvents:'none' }}>
        <div style={{ width:'100%', height:14, border:'1px solid rgba(100,180,255,0.25)', background:'rgba(5,10,25,0.4)', position:'relative', overflow:'hidden', borderRadius:2 }}>
          {/* tick marks */}
          {Array.from({ length: 36 }, (_, i) => {
            const deg = (i * 10);
            const offset = ((deg - heading + 540) % 360 - 180); // -180..180
            const x = 50 + offset * 0.6;
            if (x < 0 || x > 100) return null;
            const major = deg % 30 === 0;
            return (
              <div key={i} style={{ position:'absolute', left:`${x}%`, top: major?2:6, bottom:major?2:6, width:1, background:'rgba(150,210,255,0.6)' }}>
                {major && <div style={{ position:'absolute', top:-1, left:-6, fontSize:7, color:'rgba(160,220,255,0.75)', width:12, textAlign:'center' }}>{deg.toString().padStart(3,'0')}</div>}
              </div>
            );
          })}
          {/* centre indicator */}
          <div style={{ position:'absolute', left:'50%', top:0, bottom:0, width:1, background:'rgba(255,220,100,0.9)', transform:'translateX(-0.5px)' }}/>
          <div style={{ position:'absolute', left:'50%', top:-3, transform:'translateX(-50%)', width:0, height:0, borderLeft:'3px solid transparent', borderRight:'3px solid transparent', borderTop:'4px solid rgba(255,220,100,0.9)' }}/>
        </div>
      </div>

      {/* ── Radar scope — mid-right above dashboard ── */}
      <div style={{ position:'absolute', bottom:'31%', right:'9%', width:90, height:90, pointerEvents:'none' }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid rgba(100,255,150,0.35)', background:'radial-gradient(circle, rgba(10,30,20,0.8), rgba(5,15,10,0.95))', overflow:'hidden', boxShadow:'inset 0 0 15px rgba(0,40,20,0.6), 0 0 8px rgba(60,200,100,0.15)' }}>
          {/* range rings */}
          {[0.3, 0.6, 0.9].map((r, i) => (
            <div key={i} style={{ position:'absolute', left:'50%', top:'50%', width:`${r*100}%`, height:`${r*100}%`, transform:'translate(-50%,-50%)', borderRadius:'50%', border:'1px solid rgba(100,255,150,0.2)' }}/>
          ))}
          {/* crosshair */}
          <div style={{ position:'absolute', left:'50%', top:0, bottom:0, width:1, background:'rgba(100,255,150,0.18)' }}/>
          <div style={{ position:'absolute', top:'50%', left:0, right:0, height:1, background:'rgba(100,255,150,0.18)' }}/>
          {/* sweep */}
          <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'conic-gradient(from 0deg, rgba(100,255,150,0.45), rgba(100,255,150,0) 30%)', animation:'hud-sweep 3s linear infinite' }}/>
          {/* Blips — fake positions of nearby bodies */}
          {[[0.25,0.35],[0.65,0.7],[0.45,0.55],[0.7,0.4]].map(([x,y],i) => (
            <div key={i} style={{ position:'absolute', left:`${x*100}%`, top:`${y*100}%`, width:4, height:4, borderRadius:'50%', background:'rgba(150,255,180,0.9)', boxShadow:'0 0 4px rgba(100,255,150,0.8)', animation:`hud-blink ${1.2+i*0.3}s infinite` }}/>
          ))}
          {/* centre dot — your ship */}
          <div style={{ position:'absolute', left:'50%', top:'50%', width:5, height:5, borderRadius:'50%', background:'rgba(255,220,100,0.95)', boxShadow:'0 0 6px rgba(255,220,100,0.7)', transform:'translate(-50%,-50%)' }}/>
        </div>
        <div style={{ position:'absolute', top:-14, left:0, right:0, textAlign:'center', fontSize:8, color:'rgba(100,255,150,0.55)', fontFamily:'monospace', letterSpacing:'0.1em' }}>PROXIMITY</div>
      </div>

      {/* Left HUD — velocity with tick marks */}
      <div style={{ position:'absolute', top:'24%', left:'9%', color:'rgba(100,220,255,0.8)', fontFamily:'monospace', fontSize:'11px' }}>
        <div style={{ color:'rgba(100,180,255,0.5)', fontSize:'9px', letterSpacing:'0.15em', marginBottom:4 }}>▸ VELOCITY</div>
        <div style={{ fontSize:'24px', fontWeight:'bold', color:'rgba(120,230,255,0.95)', letterSpacing:'0.05em', textShadow:'0 0 6px rgba(100,200,255,0.3)' }}>{speed.toLocaleString()}</div>
        <div style={{ color:'rgba(100,180,255,0.4)', fontSize:'8px', marginBottom:6 }}>m/s</div>
        {/* Vertical thrust gauge */}
        <div style={{ position:'relative', width:10, height:80, border:'1px solid rgba(100,180,255,0.3)', background:'rgba(10,20,40,0.6)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:`${Math.min(speed/22000*100,100)}%`, background:'linear-gradient(to top, #3af, #6ff)', transition:'height 0.2s', boxShadow:'0 0 4px rgba(100,200,255,0.5)' }}/>
          {/* tick marks */}
          {[25,50,75].map(p => (
            <div key={p} style={{ position:'absolute', left:-3, right:-3, bottom:`${p}%`, height:1, background:'rgba(100,180,255,0.4)' }}/>
          ))}
        </div>
        <div style={{ color:'rgba(100,180,255,0.35)', fontSize:'7px', marginTop:4, letterSpacing:'0.1em' }}>THROTTLE</div>
      </div>

      {/* Target lock — relocated to top-left, above velocity, clear of radar and right-side HUD */}
      <div style={{ position:'absolute', top:'13%', left:'9%', color:'rgba(100,220,255,0.8)', fontFamily:'monospace', fontSize:'11px', textAlign:'left' }}>
        {lockedPlanet ? (
          <>
            <div style={{ color:'rgba(100,255,150,0.7)', fontSize:'9px', letterSpacing:'0.15em', marginBottom:4, display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'rgba(100,255,150,0.95)', boxShadow:'0 0 6px rgba(100,255,150,0.8)', animation:'hud-blink 0.8s infinite' }}/>
              TARGET LOCKED
            </div>
            <div style={{ fontSize:'17px', fontWeight:'bold', color:'rgba(180,255,200,0.98)', textShadow:'0 0 6px rgba(100,255,150,0.4)' }}>{lockedPlanet.toUpperCase()}</div>
            <div style={{ color:'rgba(100,255,150,0.5)', fontSize:'8px', marginTop:4 }}>SIGNAL // STABLE</div>
            <div style={{ marginTop:6, display:'flex', flexDirection:'column', alignItems:'flex-start', gap:3 }}>
              <div style={{ width:80, height:3, background:'rgba(100,255,150,0.15)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ width:'75%', height:'100%', background:'linear-gradient(to right, rgba(100,255,150,0.4), rgba(100,255,150,0.9))' }}/>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ color:'rgba(100,180,255,0.4)', fontSize:'9px', letterSpacing:'0.15em', marginBottom:4 }}>▸ NO TARGET</div>
            <div style={{ fontSize:'17px', fontWeight:'bold', color:'rgba(100,150,200,0.5)' }}>—</div>
            <div style={{ color:'rgba(100,180,255,0.25)', fontSize:'8px', marginTop:4 }}>SCAN // IDLE</div>
          </>
        )}
      </div>

      {/* Left HUD — speed */}
      <div style={{ position:'absolute', top:'30%', left:'9%', color:'rgba(100,220,255,0.8)', fontFamily:'monospace', fontSize:'11px' }}>
        <div style={{ color:'rgba(100,180,255,0.5)', fontSize:'9px', marginBottom:4 }}>VELOCITY</div>
        <div style={{ fontSize:'20px', fontWeight:'bold', color:'rgba(120,230,255,0.9)', letterSpacing:'0.05em' }}>{speed.toLocaleString()}</div>
        <div style={{ color:'rgba(100,180,255,0.4)', fontSize:'8px' }}>m/s</div>
        <div style={{ marginTop:6, width:60, height:3, background:'rgba(100,180,255,0.1)', borderRadius:2 }}>
          <div style={{ width:`${Math.min(speed/22000*100,100)}%`, height:'100%', background:'linear-gradient(to right,#3af,#6ff)', borderRadius:2, transition:'width 0.2s' }}/>
        </div>
      </div>


      {/* ── Dashboard bottom ── */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'30%', background:'linear-gradient(to top, rgba(3,7,20,1) 55%, rgba(8,14,30,0.95) 85%, transparent)', borderTop:'2px solid rgba(60,100,200,0.35)', boxShadow:'inset 0 2px 0 rgba(120,180,255,0.15), inset 0 -1px 30px rgba(0,0,0,0.6)' }}>
        {/* Glowing top edge */}
        <div style={{ position:'absolute', top:-1, left:'5%', right:'5%', height:1, background:'linear-gradient(to right, transparent, rgba(100,200,255,0.8), transparent)', boxShadow:'0 0 4px rgba(100,200,255,0.5)' }}/>
        {/* Panel seams */}
        <div style={{ position:'absolute', top:'30%', left:'18%', width:1, bottom:'15%', background:'rgba(80,130,220,0.25)' }}/>
        <div style={{ position:'absolute', top:'30%', right:'18%', width:1, bottom:'15%', background:'rgba(80,130,220,0.25)' }}/>

        {/* System status LED strip — along the top edge */}
        <div style={{ position:'absolute', top:6, left:'22%', right:'22%', display:'flex', justifyContent:'space-around', alignItems:'center', fontFamily:'monospace' }}>
          {[
            { label:'HULL', color:'100,255,150', value:'98%' },
            { label:'PWR',  color:'100,255,150', value:'NOM' },
            { label:'O₂',   color:'100,255,150', value:'OK' },
            { label:'SHD',  color:'100,200,255', value:'72%' },
            { label:'NAV',  color:'100,200,255', value:'LINK' },
            { label:'COMM', color:'255,200,50',  value:'SYNC' },
            { label:'THR',  color:'255,180,100', value:flying?'AUTO':'MAN' },
          ].map((s, i) => (
            <div key={s.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:`rgba(${s.color},0.9)`, boxShadow:`0 0 4px rgba(${s.color},0.7)`, animation:`hud-blink ${1.4 + i*0.2}s infinite` }}/>
              <div style={{ fontSize:8, color:`rgba(${s.color},0.65)`, letterSpacing:'0.1em' }}>{s.label}</div>
              <div style={{ fontSize:8, color:`rgba(${s.color},0.9)`, fontWeight:'bold' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Left — flight controls, centred vertically */}
        <div style={{ position:'absolute', left:'3%', top:'55%', transform:'translateY(-50%)', textAlign:'center' }}>
          <div style={{ color:'rgba(80,140,255,0.45)', fontSize:'9px', fontFamily:'monospace', letterSpacing:'0.08em', marginBottom:6 }}>▸ FLIGHT CONTROLS</div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {[
              { key:'W / S', label:'Forward / Back' },
              { key:'A / D', label:'Strafe' },
              { key:'SPACE / C', label:'Up / Down' },
              { key:'SHIFT', label:'Boost' },
              { key:'DRAG', label:'Look Around' },
            ].map(({ key, label }) => (
              <div key={key} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ background:'rgba(40,70,180,0.25)', border:'1px solid rgba(80,130,255,0.35)', borderRadius:4, padding:'2px 7px', color:'rgba(180,210,255,0.95)', fontSize:'10px', fontFamily:'monospace', fontWeight:'bold', minWidth:70, textAlign:'center' }}>{key}</div>
                <div style={{ color:'rgba(100,150,255,0.5)', fontSize:'9px', fontFamily:'monospace', whiteSpace:'nowrap' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Centre — body info panel */}
        {body ? (
          <div style={{ position:'absolute', left:'22%', right:'22%', top:'18%', bottom:'8%', display:'flex', gap:18, alignItems:'center', border:'1px solid rgba(100,160,255,0.15)', borderRadius:6, padding:'0 14px', background:'rgba(5,12,28,0.35)' }}>
            <img
              src={`${import.meta.env.BASE_URL}${body.image.replace(/^\//, '')}`}
              alt={body.name}
              style={{ width:130, height:130, objectFit:'cover', borderRadius:10, border:'1px solid rgba(100,160,255,0.3)', flexShrink:0 }}
            />
            <div style={{ flex:1, overflow:'auto', maxHeight:'100%' }}>
              <div style={{ color:'rgba(100,160,255,0.5)', fontSize:'10px', fontFamily:'monospace', letterSpacing:'0.1em', marginBottom:4 }}>BODY LOG</div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                <div style={{ fontWeight:'bold', fontSize:17, color:'white' }}>{body.name}</div>
                {body.wiki && (
                  <a
                    href={body.wiki}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ pointerEvents:'auto', color:'rgba(120,200,255,0.9)', fontSize:'11px', fontFamily:'monospace', textDecoration:'none', border:'1px solid rgba(100,160,255,0.4)', borderRadius:4, padding:'2px 8px', background:'rgba(40,80,180,0.25)', letterSpacing:'0.05em' }}
                  >
                    WIKIPEDIA ↗
                  </a>
                )}
              </div>
              <div style={{ color:'rgba(180,200,240,0.8)', fontSize:'11px', lineHeight:1.5, marginBottom:10 }}>{body.info}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px 9px' }}>
                {body.facts.map(f => (
                  <span key={f} style={{ color:'rgba(120,200,255,0.8)', fontSize:'10px', fontFamily:'monospace', background:'rgba(40,80,180,0.2)', borderRadius:3, padding:'2px 6px' }}>{f}</span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ position:'absolute', left:'22%', right:'22%', top:'18%', bottom:'8%', display:'flex', alignItems:'center', justifyContent:'center', border:'1px dashed rgba(60,90,180,0.25)', borderRadius:6, background:'rgba(5,12,28,0.2)' }}>
            <div style={{ color:'rgba(80,120,200,0.5)', fontSize:'11px', fontFamily:'monospace', letterSpacing:'0.2em', textAlign:'center' }}>
              ⊡ SENSOR ARRAY STANDBY ⊡<br/>
              <span style={{ fontSize:9, color:'rgba(60,90,180,0.35)', letterSpacing:'0.15em' }}>AIM AT A CELESTIAL BODY TO INITIATE SCAN</span>
            </div>
          </div>
        )}

        {/* Right panel — ship stats / "bulkhead" */}
        <div style={{ position:'absolute', right:'3%', top:'55%', transform:'translateY(-50%)', fontFamily:'monospace', textAlign:'right' }}>
          <div style={{ color:'rgba(80,140,255,0.45)', fontSize:'9px', letterSpacing:'0.08em', marginBottom:6 }}>SHIP READOUT ◂</div>
          {[
            { label:'REACTOR',  value:'STABLE',  color:'100,255,150' },
            { label:'ENGINE',   value:'IDLE',    color:'100,200,255' },
            { label:'LIFE SUP', value:'NOMINAL', color:'100,255,150' },
            { label:'DRIVE',    value:'ONLINE',  color:'100,200,255' },
            { label:'HEADING',  value:heading.toFixed(0).padStart(3,'0') + '°', color:'255,200,100' },
          ].map(r => (
            <div key={r.label} style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end', marginBottom:3 }}>
              <div style={{ fontSize:8, color:'rgba(100,150,255,0.5)', letterSpacing:'0.08em' }}>{r.label}</div>
              <div style={{ fontSize:9, color:`rgba(${r.color},0.95)`, fontWeight:'bold', minWidth:56, textAlign:'right' }}>{r.value}</div>
              <div style={{ width:4, height:4, borderRadius:'50%', background:`rgba(${r.color},0.9)`, boxShadow:`0 0 3px rgba(${r.color},0.7)` }}/>
            </div>
          ))}
        </div>

        {/* Row of rivets along the top of the dashboard */}
        <div style={{ position:'absolute', top:-10, left:'8%', right:'8%', display:'flex', justifyContent:'space-between', pointerEvents:'none' }}>
          {rivets(28).map(i => (
            <div key={i} style={{ width:5, height:5, borderRadius:'50%', background:'radial-gradient(circle at 30% 30%, #4a5a80, #0a1020)', boxShadow:'inset 0 0 2px rgba(0,0,0,0.8), 0 0 1px rgba(100,160,255,0.35)' }}/>
          ))}
        </div>

        {/* Bottom-corner screws */}
        {[['2%','85%'],['97%','85%']].map(([l,t],i) => (
          <div key={i} style={{ position:'absolute', left:l, top:t, width:10, height:10, borderRadius:'50%', border:'1px solid rgba(80,130,220,0.4)', background:'radial-gradient(circle at 30% 30%, #2a3860, #060a18)', boxShadow:'inset 0 0 3px rgba(0,0,0,0.8)' }}>
            <div style={{ position:'absolute', inset:3, borderRadius:'50%', border:'0.5px solid rgba(100,160,255,0.3)' }}/>
          </div>
        ))}
      </div>

      {/* ── Global keyframes ── */}
      <style>{`
        @keyframes hud-blink { 0%, 80%, 100% { opacity: 1; } 85% { opacity: 0.25; } }
        @keyframes hud-sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

    </div>
  );
}

export default function SpaceExplorerView() {
  const [selected, setSelected] = useState<string|null>(null);
  const [flying, setFlying] = useState(false);
  const [speed, setSpeed] = useState(0);
  const { textures, progress, current } = useTextures();
  const keysRef = useRef({ w:false, a:false, s:false, d:false, space:false, shift:false, c:false });
  const flyTargetRef = useRef<THREE.Vector3|null>(null);
  const flyPlanetRef = useRef<string|null>(null);

  // Custom cursor + pointer lock
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [cursorInside, setCursorInside] = useState(false);
  const [pointerLocked, setPointerLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const mouseInsideRef = useRef(false);


  useEffect(() => {
    const onChange = () => {
      const locked = !!document.pointerLockElement;
      setPointerLocked(locked);
      if (locked) mouseInsideRef.current = true;
    };
    document.addEventListener('pointerlockchange', onChange);
    return () => document.removeEventListener('pointerlockchange', onChange);
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleMouseDown = () => {
    if (!pointerLocked) wrapperRef.current?.requestPointerLock();
  };

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if(e.key==='w'||e.key==='W') { e.preventDefault(); keysRef.current.w=true; }
      if(e.key==='a'||e.key==='A') { e.preventDefault(); keysRef.current.a=true; }
      if(e.key==='s'||e.key==='S') { e.preventDefault(); keysRef.current.s=true; }
      if(e.key==='d'||e.key==='D') { e.preventDefault(); keysRef.current.d=true; }
      if(e.key===' ') { e.preventDefault(); keysRef.current.space=true; }
      if(e.key==='Shift') keysRef.current.shift=true;
      if(e.key==='c'||e.key==='C') keysRef.current.c=true;
    };
    const onUp = (e: KeyboardEvent) => {
      if(e.key==='w'||e.key==='W') keysRef.current.w=false;
      if(e.key==='a'||e.key==='A') keysRef.current.a=false;
      if(e.key==='s'||e.key==='S') keysRef.current.s=false;
      if(e.key==='d'||e.key==='D') keysRef.current.d=false;
      if(e.key===' ') keysRef.current.space=false;
      if(e.key==='Shift') keysRef.current.shift=false;
      if(e.key==='c'||e.key==='C') keysRef.current.c=false;
    };
    window.addEventListener('keydown',onDown);
    window.addEventListener('keyup',onUp);
    return ()=>{ window.removeEventListener('keydown',onDown); window.removeEventListener('keyup',onUp); };
  }, []);


  const visitBody = (name: string) => {
    flyPlanetRef.current = name;
    setFlying(true);
    setSelected(name);
  };

  if (!textures) {
    return (
      <div style={{ width:'100%', height:'100vh', position:'relative', background:'#020810' }}>
        <ExplorerLoadingScreen progress={progress} current={current}/>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      style={{ width:'100%', height:'100vh', position:'relative', background:'#020810', overflow:'hidden', cursor: (cursorInside || isFullscreen) ? 'none' : 'default' }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => { setCursorInside(true); mouseInsideRef.current = true; }}
      onMouseLeave={() => { if (!pointerLocked) { setCursorInside(false); mouseInsideRef.current = false; } }}
    >
      {/* Hitmarker — fixed centre of space viewport */}
      <div style={{ position:'absolute', left:'50%', top:'38%', transform:'translate(-50%,-50%)', pointerEvents:'none', zIndex:30, filter: selected ? 'drop-shadow(0 0 6px rgba(255,160,0,0.8))' : 'none' }}>
        <svg width="72" height="72" viewBox="0 0 72 72">
          {selected && (
            <circle cx="36" cy="36" r="26" fill="none" stroke="rgba(255,180,0,0.55)" strokeWidth="1" strokeDasharray="3 2">
              <animateTransform attributeName="transform" type="rotate" from="0 36 36" to="360 36 36" dur="4s" repeatCount="indefinite"/>
            </circle>
          )}
          <circle cx="36" cy="36" r="14" fill="none" stroke={selected ? 'rgba(255,160,0,0.9)' : 'rgba(100,200,255,0.4)'} strokeWidth={selected ? 1.2 : 0.8}/>
          <circle cx="36" cy="36" r="2.5" fill={selected ? 'rgba(255,200,50,1)' : 'rgba(100,200,255,0.7)'}/>
          {([[36,8,36,16],[36,56,36,64],[8,36,16,36],[56,36,64,36]] as number[][]).map(([x1,y1,x2,y2],i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={selected ? 'rgba(255,160,0,0.95)' : 'rgba(100,200,255,0.55)'} strokeWidth={selected ? 1.5 : 1}/>
          ))}
          {selected && ([[16,16],[56,16],[16,56],[56,56]] as number[][]).map(([cx,cy],i) => {
            const dx = cx < 36 ? 1 : -1, dy = cy < 36 ? 1 : -1;
            return (
              <path key={i} d={`M ${cx} ${cy+6*dy} L ${cx} ${cy} L ${cx+6*dx} ${cy}`} fill="none" stroke="rgba(255,180,0,0.95)" strokeWidth="1.5"/>
            );
          })}
        </svg>
      </div>

      {/* Controls hint popup — centre of screen */}
      <div style={{
        position:'absolute', top:'50%', left:'50%', transform:`translate(-50%, calc(-50% + ${showHint ? 0 : 30}px))`,
        opacity: showHint ? 1 : 0, transition:'opacity 0.6s ease, transform 0.6s ease',
        pointerEvents: showHint ? 'auto' : 'none', zIndex:9999,
        background:'rgba(6,12,28,0.88)', border:'1px solid rgba(100,160,255,0.3)',
        borderRadius:16, padding:'28px 36px 24px', backdropFilter:'blur(16px)',
        boxShadow:'0 8px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(100,160,255,0.1)',
        display:'flex', flexDirection:'column', alignItems:'center', gap:18, minWidth:320,
      }}>
        {/* Header + X */}
        <div style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ color:'rgba(180,210,255,0.55)', fontSize:10, fontFamily:'monospace', letterSpacing:'0.22em', textTransform:'uppercase' }}>Controls</div>
          <button onClick={() => setShowHint(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(140,170,220,0.6)', fontSize:16, lineHeight:1, padding:'0 2px' }}>✕</button>
        </div>
        {/* Keys */}
        <div style={{ display:'flex', gap:20, alignItems:'center' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <div style={{ background:'rgba(100,160,255,0.15)', border:'1px solid rgba(100,160,255,0.35)', borderRadius:8, padding:'6px 18px', color:'rgba(200,220,255,0.95)', fontSize:13, fontFamily:'monospace', fontWeight:'bold' }}>Click</div>
            <div style={{ color:'rgba(140,170,220,0.65)', fontSize:10, fontFamily:'monospace', letterSpacing:'0.1em' }}>Enter free-look</div>
          </div>
          <div style={{ width:1, height:40, background:'rgba(100,160,255,0.15)' }}/>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <div style={{ background:'rgba(100,160,255,0.15)', border:'1px solid rgba(100,160,255,0.35)', borderRadius:8, padding:'6px 18px', color:'rgba(200,220,255,0.95)', fontSize:13, fontFamily:'monospace', fontWeight:'bold' }}>Esc</div>
            <div style={{ color:'rgba(140,170,220,0.65)', fontSize:10, fontFamily:'monospace', letterSpacing:'0.1em' }}>Release</div>
          </div>
          <div style={{ width:1, height:40, background:'rgba(100,160,255,0.15)' }}/>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <div style={{ display:'flex', gap:5 }}>
              {['W','A','S','D'].map(k => (
                <div key={k} style={{ background:'rgba(100,160,255,0.15)', border:'1px solid rgba(100,160,255,0.35)', borderRadius:6, padding:'5px 9px', color:'rgba(200,220,255,0.95)', fontSize:12, fontFamily:'monospace', fontWeight:'bold' }}>{k}</div>
              ))}
            </div>
            <div style={{ color:'rgba(140,170,220,0.65)', fontSize:10, fontFamily:'monospace', letterSpacing:'0.1em' }}>Move</div>
          </div>
        </div>
      </div>

      {/* Persistent small hint at bottom */}
      <div style={{ position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)', pointerEvents:'none', zIndex:30, color:'rgba(140,180,255,0.4)', fontSize:10, fontFamily:'monospace', letterSpacing:'0.15em', whiteSpace:'nowrap' }}>
        CLICK TO ENTER FREE-LOOK · ESC TO RELEASE
      </div>

      <Canvas style={{ position:'absolute', inset:0 }}>
        <ambientLight intensity={0.2}/>
        <pointLight position={[0,0,0]} intensity={6} color="#ffe8a0" decay={0.4}/>
        <hemisphereLight args={['#101840','#000000',0.25]}/>
        <Stars radius={400} depth={100} count={8000} factor={6} saturation={0.5}/>
        <Stars radius={150} depth={50} count={2000} factor={3} saturation={0}/>
        <Sun tex={textures.Sun}/>
        {PLANETS.map(p=>(
          <Planet key={p.name} {...p}
            texture={textures[p.name]}
            selected={selected===p.name}
            onSelect={setSelected}
          />
        ))}
        <FirstPersonController
          keysRef={keysRef}
          flyTarget={flyTargetRef}
          flyPlanetRef={flyPlanetRef}
          onArrived={()=>setFlying(false)}
          onSpeedChange={setSpeed}
          onLookAt={setSelected}
          mouseInsideRef={mouseInsideRef}
        />
      </Canvas>

      <CockpitHUD speed={speed} lockedPlanet={selected} flying={flying}/>

      {/* Destinations nav — "JUMP CONSOLE" horizontal row at top of canvas, clear of the right-side radar/HUD */}
      <div style={{ position:'absolute', top:88, right:12, zIndex:60, display:'flex', flexDirection:'column', gap:2, pointerEvents:'auto', padding:'6px 8px 8px', background:'linear-gradient(to bottom, rgba(12,20,42,0.85), rgba(8,14,32,0.9))', border:'1px solid rgba(80,130,220,0.35)', borderRadius:8, boxShadow:'inset 0 1px 0 rgba(120,180,255,0.15), 0 0 10px rgba(0,0,0,0.5)' }}>
        <div style={{ color:'rgba(100,180,255,0.75)', fontSize:9, fontFamily:'monospace', letterSpacing:'0.2em', marginBottom:4, textAlign:'left', display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:5, height:5, borderRadius:'50%', background:'rgba(100,255,150,0.9)', boxShadow:'0 0 4px rgba(100,255,150,0.7)', animation:'hud-blink 1.6s infinite' }}/>
          JUMP CONSOLE
        </div>
        {ALL_BODIES.map(b=>(
          <button key={b.name} onClick={()=>visitBody(b.name)} disabled={flying}
            style={{
              background: selected===b.name?'linear-gradient(to right, rgba(60,120,255,0.3), rgba(80,140,255,0.15))':'rgba(5,10,30,0.7)',
              border:`1px solid ${selected===b.name?'rgba(120,180,255,0.7)':'rgba(60,80,180,0.35)'}`,
              borderRadius:4, color:selected===b.name?'white':'rgba(160,190,255,0.8)',
              fontSize:9, fontFamily:'monospace', fontWeight:'bold', letterSpacing:'0.05em',
              padding:'2px 8px', cursor:flying?'default':'pointer', textAlign:'left',
              backdropFilter:'blur(8px)', transition:'all 0.2s',
              display:'flex', alignItems:'center', justifyContent:'flex-start', gap:8,
              boxShadow: selected===b.name?'0 0 6px rgba(100,160,255,0.35)':'none',
            }}
          >
            <div style={{ width:4, height:4, borderRadius:'50%', background: selected===b.name?'rgba(120,220,255,0.95)':'rgba(80,120,200,0.5)', boxShadow:selected===b.name?'0 0 4px rgba(120,220,255,0.7)':'none' }}/>
            <span>{b.name.toUpperCase()}</span>
            <span style={{ color: selected===b.name?'rgba(255,220,100,0.9)':'rgba(100,140,200,0.45)' }}>▸</span>
          </button>
        ))}
      </div>
    </div>
  );
}
