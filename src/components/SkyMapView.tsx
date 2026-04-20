import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getVisiblePlanets } from '../utils/astronomy';

interface Props {
  userLat?: number;
  userLon?: number;
}

interface ConstellationDef {
  name: string;
  emoji: string;
  ra: number;
  dec: number;
  stars: Array<{ x: number; y: number }>;
  lines: [number, number][];
}

// Constellation centres (RA/Dec degrees) + star offsets (pixels at R=300 dome)
const CONSTELLATIONS: ConstellationDef[] = [
  {
    name: 'Southern Cross', emoji: '✚', ra: 187.5, dec: -60,
    stars: [{ x: -22, y: -30 }, { x: 10, y: -10 }, { x: 22, y: 20 }, { x: -10, y: 30 }],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0]],
  },
  {
    name: 'Centaurus', emoji: '🐎', ra: 205, dec: -47,
    stars: [{ x: 0, y: 0 }, { x: 55, y: -20 }, { x: -45, y: 30 }, { x: 30, y: 42 }, { x: -22, y: -42 }],
    lines: [[0, 1], [0, 2], [0, 3], [1, 4]],
  },
  {
    name: 'Scorpius', emoji: '🦂', ra: 253, dec: -27,
    stars: [{ x: 0, y: 0 }, { x: -30, y: 10 }, { x: -52, y: 0 }, { x: -64, y: -20 }, { x: -44, y: -42 }, { x: -12, y: -52 }],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
  },
  {
    name: 'Sagittarius', emoji: '🏹', ra: 287, dec: -29,
    stars: [{ x: 0, y: 0 }, { x: 44, y: -20 }, { x: 55, y: 10 }, { x: 22, y: 42 }, { x: -32, y: 20 }, { x: -44, y: -10 }],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]],
  },
  {
    name: 'Orion', emoji: '⚔️', ra: 84, dec: 3,
    stars: [{ x: 0, y: 0 }, { x: 32, y: -42 }, { x: -32, y: -42 }, { x: 20, y: 42 }, { x: -20, y: 42 }, { x: 0, y: -18 }],
    lines: [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [2, 5]],
  },
  {
    name: 'Canis Major', emoji: '🐕', ra: 102, dec: -22,
    stars: [{ x: 0, y: 0 }, { x: 32, y: -20 }, { x: 44, y: 20 }, { x: 10, y: 30 }],
    lines: [[0, 1], [0, 2], [0, 3]],
  },
  {
    name: 'Taurus', emoji: '🐂', ra: 70, dec: 15,
    stars: [{ x: 0, y: 0 }, { x: 32, y: -30 }, { x: -22, y: -20 }, { x: 20, y: 30 }, { x: -30, y: 20 }],
    lines: [[0, 1], [0, 2], [0, 3], [0, 4]],
  },
  {
    name: 'Gemini', emoji: '👯', ra: 107, dec: 23,
    stars: [{ x: 0, y: 0 }, { x: 44, y: 0 }, { x: -20, y: -30 }, { x: 55, y: -20 }, { x: 20, y: 42 }],
    lines: [[0, 1], [0, 2], [1, 3], [1, 4]],
  },
  {
    name: 'Leo', emoji: '🦁', ra: 160, dec: 15,
    stars: [{ x: 0, y: 0 }, { x: 32, y: -20 }, { x: 55, y: 0 }, { x: 44, y: 20 }, { x: 20, y: 42 }],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  {
    name: 'Virgo', emoji: '👧', ra: 201, dec: -1,
    stars: [{ x: 0, y: 0 }, { x: 44, y: -30 }, { x: 55, y: 10 }, { x: 22, y: 42 }, { x: -22, y: 30 }],
    lines: [[0, 1], [0, 2], [1, 3], [2, 4]],
  },
  {
    name: 'Aquarius', emoji: '⚱️', ra: 334, dec: -12,
    stars: [{ x: 0, y: 0 }, { x: 32, y: -20 }, { x: 44, y: 0 }, { x: 20, y: 30 }, { x: -22, y: 20 }],
    lines: [[0, 1], [0, 2], [0, 3], [3, 4]],
  },
  {
    name: 'Canopus', emoji: '⭐', ra: 96, dec: -53,
    stars: [{ x: 0, y: 0 }],
    lines: [],
  },
];

const CONSTELLATION_INFO: Record<string, { description: string; season: string }> = {
  'Southern Cross': {
    description: "The most iconic Southern Hemisphere constellation — it's on our flag. The long axis points toward the South Celestial Pole, giving you south without a compass.",
    season: 'Autumn/Winter',
  },
  Centaurus: {
    description: 'Home to Alpha Centauri, the closest star system to Earth at 4.37 light-years. Also contains Omega Centauri — the largest globular cluster visible to the naked eye.',
    season: 'Autumn/Winter',
  },
  Scorpius: {
    description: "A glorious S-shaped arc in the winter sky. The red-orange heart is Antares — a supergiant so vast it would swallow Earth's entire orbit if placed where our Sun is.",
    season: 'Winter',
  },
  Sagittarius: {
    description: "Shaped like a teapot. Stare at it and you're looking toward the galactic centre — 26,000 light-years away. The 'steam' from the spout is the densest section of the Milky Way.",
    season: 'Winter',
  },
  Orion: {
    description: "Appears upside-down from New Zealand. The three-star belt is unmistakable. Just below it: the Orion Nebula, a stellar nursery 1,344 light-years away visible as a fuzzy patch to the naked eye.",
    season: 'Summer',
  },
  'Canis Major': {
    description: "Contains Sirius, the brightest star in the entire night sky. So brilliant it can cast faint shadows on a truly dark night. Look for it trailing behind Orion.",
    season: 'Summer',
  },
  Taurus: {
    description: "Home to the Pleiades (Seven Sisters) — a tiny star cluster that has guided sailors for millennia. Māori call them Matariki; their rising marks the new year.",
    season: 'Summer',
  },
  Gemini: {
    description: "The Twins, marked by bright stars Castor and Pollux. Castor is actually a sextuple star system — six stars all orbiting each other in a cosmic dance.",
    season: 'Summer',
  },
  Leo: {
    description: "A crouching lion with a distinctive sickle-shaped head. Regulus at the base spins so fast it's flattened at the poles — 16% faster and it would tear itself apart.",
    season: 'Spring',
  },
  Virgo: {
    description: "Contains Spica, a brilliant blue double star. Virgo hosts the Virgo Cluster — over 1,300 galaxies forming the heart of our local supercluster of galaxies.",
    season: 'Spring',
  },
  Aquarius: {
    description: "Radiant of the Eta Aquariid meteor shower in May — Halley's Comet debris that gives better rates from the Southern Hemisphere than anywhere north.",
    season: 'Autumn',
  },
  Canopus: {
    description: "Second-brightest star in the sky, circumpolar from NZ (never sets). Ancient Polynesian navigators used it for oceanic crossings. 13,600 times more luminous than our Sun.",
    season: 'All year',
  },
};

// Background star field — pre-seeded for consistent layout
let _seed = 42317;
function sr() { _seed = (_seed * 1664525 + 1013904223) >>> 0; return _seed / 0xffffffff; }

// Stellar colour palette roughly corresponds to Harvard classifications.
// Most stars are ~solar-white; rarer hotter (blue) and cooler (orange/red) tints add realism.
const STAR_PALETTE: [number, number, number][] = [
  [255, 255, 255], // A/F — white
  [240, 245, 255], // A — white-blue
  [210, 225, 255], // B — blue
  [180, 200, 255], // O — deep blue (rare)
  [255, 244, 220], // G — solar cream
  [255, 224, 180], // K — pale orange
  [255, 195, 150], // M — orange/red (rare)
];

interface BgStar {
  ra: number; dec: number;
  mag: number;        // 0..1 → final brightness
  size: number;       // ~0.5..2.5 px core radius
  colorIdx: number;   // into STAR_PALETTE
  twink: number;      // phase
  twinkSpeed: number; // rad/s
}

function pickColor(): number {
  // Weighted towards white; rare towards ends.
  const r = sr();
  if (r < 0.55) return 0;
  if (r < 0.72) return 1;
  if (r < 0.80) return 2;
  if (r < 0.82) return 3;
  if (r < 0.92) return 4;
  if (r < 0.98) return 5;
  return 6;
}

// Uniform sphere distribution so stars don't cluster at poles
function sampleSky(): { ra: number; dec: number } {
  const u = sr(), v = sr();
  const ra = u * 360;
  const dec = Math.asin(2 * v - 1) * (180 / Math.PI);
  return { ra, dec };
}

// Background stars (mostly uniform across sky)
const BG_STARS: BgStar[] = Array.from({ length: 2200 }, () => {
  const { ra, dec } = sampleSky();
  const mag = Math.pow(sr(), 1.8);     // bias towards dim
  const size = 0.5 + mag * 2.0 + (sr() < 0.04 ? 1.2 : 0); // small chance of "bright" star
  return {
    ra, dec, mag, size,
    colorIdx: pickColor(),
    twink: sr() * Math.PI * 2,
    twinkSpeed: 0.4 + sr() * 1.8,
  };
});

// Milky Way band — more points gives smoother illumination.
// Each waypoint is (RA, Dec); width & hue vary along the band.
const MW_BAND: Array<{ ra: number; dec: number; w: number; hue: number }> = [
  // Galactic centre — brightest, warmer tint
  { ra: 266, dec: -29, w: 1.0,  hue: 0 },
  { ra: 268, dec: -25, w: 0.96, hue: 0.05 },
  { ra: 272, dec: -20, w: 0.90, hue: 0.08 },
  { ra: 278, dec: -12, w: 0.80, hue: 0.12 },
  { ra: 286, dec: -4,  w: 0.72, hue: 0.18 },
  { ra: 296, dec: 6,   w: 0.62, hue: 0.24 },
  { ra: 306, dec: 18,  w: 0.52, hue: 0.32 },
  { ra: 320, dec: 32,  w: 0.44, hue: 0.42 },
  { ra: 338, dec: 48,  w: 0.36, hue: 0.55 },
  { ra: 0,   dec: 60,  w: 0.32, hue: 0.65 },
  { ra: 28,  dec: 60,  w: 0.32, hue: 0.75 },
  { ra: 54,  dec: 50,  w: 0.35, hue: 0.82 },
  { ra: 74,  dec: 38,  w: 0.42, hue: 0.88 },
  { ra: 86,  dec: 28,  w: 0.52, hue: 0.92 },
  { ra: 96,  dec: 20,  w: 0.58, hue: 0.95 },
  { ra: 108, dec: 10,  w: 0.58, hue: 0.95 },
  { ra: 120, dec: 0,   w: 0.55, hue: 0.9 },
  { ra: 134, dec: -10, w: 0.58, hue: 0.82 },
  { ra: 150, dec: -22, w: 0.66, hue: 0.72 },
  { ra: 168, dec: -32, w: 0.72, hue: 0.6 },
  { ra: 188, dec: -40, w: 0.80, hue: 0.48 },
  { ra: 210, dec: -46, w: 0.86, hue: 0.35 },
  { ra: 232, dec: -44, w: 0.90, hue: 0.22 },
  { ra: 250, dec: -36, w: 0.95, hue: 0.1 },
  { ra: 262, dec: -32, w: 0.98, hue: 0.04 },
];

// Extra "dust" stars concentrated along the Milky Way for texture
const MW_DUST: BgStar[] = Array.from({ length: 900 }, () => {
  // Pick a random waypoint and jitter around it
  const w = MW_BAND[Math.floor(sr() * MW_BAND.length)];
  const spread = 10 + sr() * 12; // degrees scatter perpendicular
  const ra = (w.ra + (sr() - 0.5) * 14 + 360) % 360;
  const dec = Math.max(-89, Math.min(89, w.dec + (sr() - 0.5) * spread));
  const mag = Math.pow(sr(), 2.5);
  return {
    ra, dec, mag,
    size: 0.35 + mag * 1.4,
    colorIdx: pickColor(),
    twink: sr() * Math.PI * 2,
    twinkSpeed: 0.4 + sr() * 1.6,
  };
});

// ── Pre-rendered star sprite cache (avoids per-frame radial gradient construction) ──
const SPRITE_SIZE = 32;
const _spriteCache = new Map<number, HTMLCanvasElement>();
function starSprite(colorIdx: number): HTMLCanvasElement {
  const cached = _spriteCache.get(colorIdx);
  if (cached) return cached;
  const c = document.createElement('canvas');
  c.width = c.height = SPRITE_SIZE;
  const ctx = c.getContext('2d')!;
  const half = SPRITE_SIZE / 2;
  const [r, g, b] = STAR_PALETTE[colorIdx] ?? [255, 255, 255];
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0.0,  `rgba(${r},${g},${b},1)`);
  grad.addColorStop(0.08, `rgba(${r},${g},${b},0.9)`);
  grad.addColorStop(0.22, `rgba(${r},${g},${b},0.35)`);
  grad.addColorStop(0.45, `rgba(${r},${g},${b},0.09)`);
  grad.addColorStop(1.0,  `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  _spriteCache.set(colorIdx, c);
  return c;
}

const PLANET_COLORS: Record<string, string> = {
  Venus: '#fffde7', Jupiter: '#ffe0b2', Saturn: '#fff8e1',
  Mars: '#ff8a65', Mercury: '#b0bec5',
};

function getLST(lon: number, date: Date): number {
  const JD = date.getTime() / 86400000 + 2440587.5;
  const GST = ((280.46061837 + 360.98564736629 * (JD - 2451545.0)) % 360 + 360) % 360;
  return ((GST + lon) % 360 + 360) % 360;
}

function raDecToAltAz(ra: number, dec: number, lst: number, lat: number) {
  const HA = ((lst - ra + 360) % 360) * (Math.PI / 180);
  const dR = dec * (Math.PI / 180);
  const lR = lat * (Math.PI / 180);
  const sinAlt = Math.sin(lR) * Math.sin(dR) + Math.cos(lR) * Math.cos(dR) * Math.cos(HA);
  const alt = Math.asin(Math.min(1, Math.max(-1, sinAlt))) * (180 / Math.PI);
  const den = Math.cos(lR) * Math.cos((alt * Math.PI) / 180);
  let az = 0;
  if (Math.abs(den) > 1e-4) {
    az = Math.acos(Math.min(1, Math.max(-1, (Math.sin(dR) - Math.sin(lR) * sinAlt) / den))) * (180 / Math.PI);
    if (Math.sin(HA) > 0) az = 360 - az;
  }
  return { alt, az };
}

function toScreen(alt: number, az: number, cx: number, cy: number, R: number, rot: number) {
  if (alt < -3) return null;
  const r = Math.max(0, 90 - alt) / 90 * R;
  const a = ((az + rot) % 360) * (Math.PI / 180);
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
}

export default function SkyMapView({ userLat = -36.86, userLon = 174.76 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  const panRef = useRef({ x: 0, y: 0 });          // viewport pan in pixels
  const velRef = useRef({ x: 0, y: 0 });           // px/frame inertia on both axes
  const lastMoveRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const dragRef = useRef<{ x: number; y: number; startPanX: number; startPanY: number } | null>(null);
  const zoomRef = useRef(1);         // current zoom (1 = default)
  const targetZoomRef = useRef(1);   // target for smooth easing
  const pinchRef = useRef<{ dist: number; startZoom: number } | null>(null);
  const animRef = useRef(0);
  const planetsRef = useRef<ReturnType<typeof getVisiblePlanets>>([]);
  const hoveredRef = useRef<string | null>(null);
  const [hover, setHover] = useState<{ name: string; x: number; y: number } | null>(null);
  const [visibleNames, setVisibleNames] = useState<Set<string>>(new Set());
  const [listOpen, setListOpen] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth >= 640 : true);

  // Rocket cursor
  const containerRef = useRef<HTMLDivElement>(null);
  const rocketRef = useRef<HTMLDivElement>(null);
  const rocketTrailRef = useRef<HTMLDivElement>(null);
  const rocketPosRef = useRef({ x: -200, y: -200 });
  const rocketTargetRef = useRef({ x: -200, y: -200 });
  const rocketAngleRef = useRef(0);
  const rocketSpeedRef = useRef(0);
  const [rocketVisible, setRocketVisible] = useState(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
      if (inside) {
        rocketTargetRef.current = { x, y };
        setRocketVisible(true);
      } else {
        setRocketVisible(false);
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    let id = 0;
    let last = performance.now();
    const trailPoints: Array<{ x: number; y: number; t: number }> = [];
    const tick = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      const el = rocketRef.current;
      if (el) {
        const cur = rocketPosRef.current;
        const tgt = rocketTargetRef.current;
        const dx = tgt.x - cur.x;
        const dy = tgt.y - cur.y;
        const ease = 1 - Math.exp(-dt / 70);
        cur.x += dx * ease;
        cur.y += dy * ease;
        const moveLen = Math.hypot(dx, dy);
        rocketSpeedRef.current = rocketSpeedRef.current * 0.85 + Math.min(1, moveLen / 60) * 0.15;
        if (moveLen > 1.2) {
          const targetAngle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
          let da = targetAngle - rocketAngleRef.current;
          while (da > 180) da -= 360;
          while (da < -180) da += 360;
          rocketAngleRef.current += da * 0.22;
        }
        el.style.transform = `translate(${cur.x}px, ${cur.y}px) translate(-50%, -50%) rotate(${rocketAngleRef.current}deg)`;
        const thrust = 0.6 + rocketSpeedRef.current * 1.6;
        el.style.setProperty('--thrust', String(thrust));

        // Trail
        trailPoints.push({ x: cur.x, y: cur.y, t: now });
        while (trailPoints.length > 18) trailPoints.shift();
        const trail = rocketTrailRef.current;
        if (trail) {
          const dots = trail.children;
          for (let i = 0; i < dots.length; i++) {
            const p = trailPoints[trailPoints.length - 1 - i];
            const d = dots[i] as HTMLElement;
            if (p) {
              const age = (now - p.t) / 900;
              const alpha = Math.max(0, 1 - age) * (0.5 + rocketSpeedRef.current * 0.5);
              const size = Math.max(1, 10 * (1 - age));
              d.style.opacity = String(alpha);
              d.style.width = `${size}px`;
              d.style.height = `${size}px`;
              d.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
              d.style.display = '';
            } else {
              d.style.display = 'none';
            }
          }
        }
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  // Track which constellations are currently above the horizon
  useEffect(() => {
    const update = () => {
      const lst = getLST(userLon, new Date());
      const next = new Set<string>();
      for (const c of CONSTELLATIONS) {
        const { alt } = raDecToAltAz(c.ra, c.dec, lst, userLat);
        if (alt > 0) next.add(c.name);
      }
      setVisibleNames(next);
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [userLat, userLon]);

  // Update planet positions every 30 s (expensive astronomy calc)
  useEffect(() => {
    const update = () => {
      try { planetsRef.current = getVisiblePlanets(new Date(), userLat, userLon); } catch { /* ignore */ }
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [userLat, userLon]);

  const startDrag = useCallback((cx: number, cy: number) => {
    dragRef.current = { x: cx, y: cy, startPanX: panRef.current.x, startPanY: panRef.current.y };
    velRef.current = { x: 0, y: 0 };
    lastMoveRef.current = { x: cx, y: cy, t: performance.now() };
  }, []);

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    if (!dragRef.current) return;
    const prev = lastMoveRef.current;
    const now = performance.now();
    const prevPanX = panRef.current.x;
    const prevPanY = panRef.current.y;
    panRef.current = {
      x: dragRef.current.startPanX + (clientX - dragRef.current.x),
      y: dragRef.current.startPanY + (clientY - dragRef.current.y),
    };
    if (prev) {
      const dt = Math.max(1, now - prev.t);
      const scale = 16 / dt; // → px per ~frame
      velRef.current = {
        x: Math.max(-40, Math.min(40, (panRef.current.x - prevPanX) * scale)),
        y: Math.max(-40, Math.min(40, (panRef.current.y - prevPanY) * scale)),
      };
    }
    lastMoveRef.current = { x: clientX, y: clientY, t: now };
  }, []);

  // Hit-test: find the closest constellation within threshold to a screen point
  const hitTest = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mx = (clientX - rect.left) * (canvas.width / rect.width);
    const my = (clientY - rect.top) * (canvas.height / rect.height);
    const cx = canvas.width / 2 + panRef.current.x;
    const cy = canvas.height / 2 + panRef.current.y;
    const R = Math.hypot(canvas.width, canvas.height) / 2 * zoomRef.current;
    const lst = getLST(userLon, new Date());
    let hit: { name: string; dist: number } | null = null;
    const ctx = canvas.getContext('2d');
    for (const c of CONSTELLATIONS) {
      const { alt, az } = raDecToAltAz(c.ra, c.dec, lst, userLat);
      const pt = toScreen(alt, az, cx, cy, R, 0);
      if (!pt) continue;
      // Label is drawn at (pt.x, pt.y - R*0.13) with font ~10-12px, centered
      const lx = pt.x;
      const ly = pt.y - R * 0.13;
      let textW = (c.name.length + 2) * 7; // rough fallback
      if (ctx) {
        ctx.font = 'bold 12px Outfit';
        textW = ctx.measureText(`${c.emoji} ${c.name}`).width;
      }
      const halfW = textW / 2 + 4;
      const halfH = 10; // ~ line height / 2 + padding
      if (mx >= lx - halfW && mx <= lx + halfW && my >= ly - halfH && my <= ly + halfH) {
        const d = Math.hypot(mx - lx, my - ly);
        if (!hit || d < hit.dist) hit = { name: c.name, dist: d };
      }
    }
    return hit ? hit.name : null;
  }, [userLat, userLon]);

  const onHoverMove = useCallback((clientX: number, clientY: number) => {
    if (dragRef.current) { // while dragging, clear hover
      if (hoveredRef.current !== null) { hoveredRef.current = null; setHover(null); }
      return;
    }
    const name = hitTest(clientX, clientY);
    if (name !== hoveredRef.current) {
      hoveredRef.current = name;
      if (!name) setHover(null);
    }
    if (name) {
      // Update cursor position even when name didn't change (tooltip follows cursor)
      const canvas = canvasRef.current;
      if (canvas) {
        const r = canvas.getBoundingClientRect();
        setHover({ name, x: clientX - r.left, y: clientY - r.top });
      }
    }
  }, [hitTest]);

  const endDrag = useCallback((clientX: number, clientY: number) => {
    if (!dragRef.current) return;
    const moved = Math.abs(clientX - dragRef.current.x) > 8 || Math.abs(clientY - dragRef.current.y) > 8;
    dragRef.current = null;
    lastMoveRef.current = null;
    if (!moved) velRef.current = { x: 0, y: 0 };
    if (moved) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (clientX - rect.left) * (canvas.width / rect.width);
    const my = (clientY - rect.top) * (canvas.height / rect.height);
    const cx = canvas.width / 2 + panRef.current.x;
    const cy = canvas.height / 2 + panRef.current.y;
    const R = Math.hypot(canvas.width, canvas.height) / 2 * zoomRef.current;
    const lst = getLST(userLon, new Date());

    let hit: { name: string; dist: number } | null = null;
    const threshold = 70 * Math.max(0.5, zoomRef.current * 0.8);
    for (const c of CONSTELLATIONS) {
      const { alt, az } = raDecToAltAz(c.ra, c.dec, lst, userLat);
      const pt = toScreen(alt, az, cx, cy, R, 0);
      if (!pt) continue;
      const d = Math.hypot(mx - pt.x, my - pt.y);
      if (d < threshold && (!hit || d < hit.dist)) hit = { name: c.name, dist: d };
    }
    setSelected(prev => (hit ? (hit.name === prev ? null : hit.name) : null));
  }, [userLat, userLon]);

  // Main canvas draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const w = canvas.offsetWidth || window.innerWidth;
      const h = canvas.offsetHeight || window.innerHeight;
      if (w > 0 && h > 0) { canvas.width = w; canvas.height = h; }
    };
    // Defer first resize so layout has settled
    setTimeout(resize, 0);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener('resize', resize);

    // Touch listeners need passive:false to allow preventDefault
    const touchDist = (e: TouchEvent) => {
      const a = e.touches[0], b = e.touches[1];
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    };
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length >= 2) {
        pinchRef.current = { dist: touchDist(e), startZoom: targetZoomRef.current };
        dragRef.current = null;
      } else {
        const t = e.touches[0];
        startDrag(t.clientX, t.clientY);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (pinchRef.current && e.touches.length >= 2) {
        const ratio = touchDist(e) / pinchRef.current.dist;
        targetZoomRef.current = Math.max(0.35, Math.min(3.5, pinchRef.current.startZoom * ratio));
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        moveDrag(t.clientX, t.clientY);
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length < 2) pinchRef.current = null;
      const t = e.changedTouches[0];
      endDrag(t.clientX, t.clientY);
    };
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });

    // Mouse wheel zoom (anchored on cursor position)
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Support both pixel + line deltaModes; scale to a sensible rate
      const factor = Math.exp(-e.deltaY * 0.0015);
      const oldZoom = targetZoomRef.current;
      const newZoom = Math.max(0.35, Math.min(3.5, oldZoom * factor));
      if (newZoom === oldZoom) return;
      // Zoom around the cursor: adjust pan so the point under the cursor stays put
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width) - canvas.width / 2;
      const my = (e.clientY - rect.top) * (canvas.height / rect.height) - canvas.height / 2;
      const ratio = newZoom / oldZoom;
      panRef.current = {
        x: (panRef.current.x - mx) * ratio + mx,
        y: (panRef.current.y - my) * ratio + my,
      };
      targetZoomRef.current = newZoom;
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      if (W === 0 || H === 0) { animRef.current = requestAnimationFrame(draw); return; }

      // ── Pan inertia (both axes) ─────────────────────────────────────────────
      if (!dragRef.current) {
        const v = velRef.current;
        if (Math.abs(v.x) > 0.05 || Math.abs(v.y) > 0.05) {
          panRef.current = { x: panRef.current.x + v.x, y: panRef.current.y + v.y };
          velRef.current = { x: v.x * 0.92, y: v.y * 0.92 };
        } else if (v.x !== 0 || v.y !== 0) {
          velRef.current = { x: 0, y: 0 };
        }
      }

      // ── Smooth zoom easing ──────────────────────────────────────────────────
      const dz = targetZoomRef.current - zoomRef.current;
      if (Math.abs(dz) > 0.001) zoomRef.current += dz * 0.18;
      else zoomRef.current = targetZoomRef.current;

      // Clamp pan relative to current zoom (larger zoom → larger allowed pan)
      const maxPan = Math.hypot(W, H) * 0.45 * Math.max(1, zoomRef.current);
      const pd = Math.hypot(panRef.current.x, panRef.current.y);
      if (pd > maxPan) {
        panRef.current = {
          x: panRef.current.x * (maxPan / pd),
          y: panRef.current.y * (maxPan / pd),
        };
        velRef.current = { x: 0, y: 0 };
      }

      // Projection centre = viewport centre + user's pan
      const cx = W / 2 + panRef.current.x;
      const cy = H / 2 + panRef.current.y;
      // R scales with zoom — zoom < 1 compresses the sky (see more), zoom > 1 expands (close-up)
      const R = Math.hypot(W, H) / 2 * zoomRef.current;
      const rot = 0; // pan replaces rotation for navigation
      const sel = selectedRef.current;
      const now = new Date();
      const t = now.getTime() / 1000;
      const lst = getLST(userLon, now);

      // ── Flat backdrop — no circular vignette ──
      ctx.fillStyle = '#060d26';
      ctx.fillRect(0, 0, W, H);

      ctx.save();

      // ── Milky Way glow (additive blending for that luminous feel) ───────────
      ctx.globalCompositeOperation = 'lighter';
      for (const mw of MW_BAND) {
        const { alt, az } = raDecToAltAz(mw.ra, mw.dec, lst, userLat);
        const pt = toScreen(alt, az, cx, cy, R, rot);
        if (!pt) continue;
        const br = R * 0.32 * mw.w;
        // Hue shift along the band: warm near galactic centre → cool in the anti-centre
        const warm = 1 - mw.hue;
        const rr = Math.round(140 + warm * 80);
        const gg = Math.round(120 + warm * 40);
        const bb = Math.round(200 + mw.hue * 30);
        const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, br);
        g.addColorStop(0.0, `rgba(${rr},${gg},${bb},${0.09 * mw.w})`);
        g.addColorStop(0.35, `rgba(${rr - 20},${gg - 20},${bb - 10},${0.045 * mw.w})`);
        g.addColorStop(1.0, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, br, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Milky-Way dust stars (drawn additively) ─────────────────────────────
      for (let i = 0; i < MW_DUST.length; i++) {
        const s = MW_DUST[i];
        const { alt, az } = raDecToAltAz(s.ra, s.dec, lst, userLat);
        const pt = toScreen(alt, az, cx, cy, R, rot);
        if (!pt) continue;
        // Fade very low stars into the haze for atmospheric extinction
        const extinct = alt < 10 ? Math.max(0, alt / 10) : 1;
        const tw = 0.75 + 0.25 * Math.sin(t * s.twinkSpeed + s.twink);
        const alpha = (0.28 + s.mag * 0.55) * tw * extinct;
        if (alpha < 0.02) continue;
        const size = s.size * 2.6;
        const sprite = starSprite(s.colorIdx);
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, pt.x - size, pt.y - size, size * 2, size * 2);
      }

      // ── Background stars (sprite-based for soft glow + speed) ───────────────
      for (let i = 0; i < BG_STARS.length; i++) {
        const s = BG_STARS[i];
        const { alt, az } = raDecToAltAz(s.ra, s.dec, lst, userLat);
        const pt = toScreen(alt, az, cx, cy, R, rot);
        if (!pt) continue;
        // Twinkle: two summed sines → aperiodic feel
        const tw = 0.72 + 0.18 * Math.sin(t * s.twinkSpeed + s.twink)
                       + 0.10 * Math.sin(t * s.twinkSpeed * 2.7 + s.twink * 1.3);
        const extinct = alt < 10 ? Math.max(0.15, alt / 10) : 1;
        const alpha = (0.30 + s.mag * 0.70) * tw * extinct;
        if (alpha < 0.03) continue;
        const size = s.size * 2.4;
        const sprite = starSprite(s.colorIdx);
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, pt.x - size, pt.y - size, size * 2, size * 2);
        // Diffraction-cross highlight on the brightest few stars
        if (s.size > 2 && s.mag > 0.78) {
          const spk = size * 2.2 * tw;
          ctx.globalAlpha = alpha * 0.55;
          const [rr, gg, bb] = STAR_PALETTE[s.colorIdx] ?? [255, 255, 255];
          ctx.strokeStyle = `rgba(${rr},${gg},${bb},1)`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(pt.x - spk, pt.y); ctx.lineTo(pt.x + spk, pt.y);
          ctx.moveTo(pt.x, pt.y - spk); ctx.lineTo(pt.x, pt.y + spk);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // ── Constellations ────────────────────────────────────────────────────────
      const sf = R / 300;
      for (const c of CONSTELLATIONS) {
        const { alt, az } = raDecToAltAz(c.ra, c.dec, lst, userLat);
        const center = toScreen(alt, az, cx, cy, R, rot);
        if (!center) continue;

        const isSel = sel === c.name;
        const isHover = !isSel && hoveredRef.current === c.name;
        const sps = c.stars.map(s => ({ x: center.x + s.x * sf, y: center.y + s.y * sf }));

        // Lines
        ctx.strokeStyle = isSel
          ? 'rgba(167, 139, 250, 0.85)'
          : isHover
            ? 'rgba(180, 160, 255, 0.55)'
            : 'rgba(100, 82, 185, 0.2)';
        ctx.lineWidth = isSel ? 1.6 : isHover ? 1.3 : 0.9;
        for (const [i, j] of c.lines) {
          ctx.beginPath();
          ctx.moveTo(sps[i].x, sps[i].y);
          ctx.lineTo(sps[j].x, sps[j].y);
          ctx.stroke();
        }

        // Stars — soft glow via cached sprites, additive for the aura
        for (const sp of sps) {
          ctx.globalCompositeOperation = 'lighter';
          const sprite = starSprite(isSel ? 4 : isHover ? 1 : 1);
          const sz = isSel ? 14 : isHover ? 12 : 9;
          ctx.globalAlpha = isSel ? 0.95 : isHover ? 0.9 : 0.75;
          ctx.drawImage(sprite, sp.x - sz, sp.y - sz, sz * 2, sz * 2);
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
          // Solid core
          ctx.fillStyle = isSel ? '#fff6c0' : isHover ? '#f3f5ff' : '#e9eeff';
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, isSel ? 2.4 : isHover ? 2.1 : 1.6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Label
        ctx.font = isSel || isHover ? 'bold 12px Outfit' : '10px Outfit';
        ctx.fillStyle = isSel
          ? '#fef08a'
          : isHover
            ? 'rgba(220, 220, 255, 0.95)'
            : 'rgba(148, 163, 184, 0.62)';
        ctx.textAlign = 'center';
        ctx.fillText(`${c.emoji} ${c.name}`, center.x, center.y - R * 0.13);

      }

      // ── Visible planets ───────────────────────────────────────────────────────
      for (const p of planetsRef.current) {
        if (!p.visible) continue;
        const pt = toScreen(p.altitude, p.azimuth, cx, cy, R, rot);
        if (!pt) continue;
        const color = PLANET_COLORS[p.name] ?? '#ffffff';
        const pr = p.magnitude < -1 ? 6 : p.magnitude < 1 ? 4.5 : 3.5;

        // Soft halo (additive)
        ctx.globalCompositeOperation = 'lighter';
        const halo = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pr * 4);
        halo.addColorStop(0, color);
        halo.addColorStop(0.25, color.replace(/^#/, 'rgba(') ? color : color);
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = halo;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pr * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';

        // Solid core
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pr, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        ctx.font = 'bold 9px Outfit';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.textAlign = 'center';
        ctx.fillText(`${p.emoji} ${p.name}`, pt.x, pt.y - pr - 5);
      }

      ctx.restore();

      // ── Cardinal directions along the viewport edges ────────────────────────
      const cards = [
        { l: 'N', az: 0 }, { l: 'NE', az: 45 }, { l: 'E', az: 90 }, { l: 'SE', az: 135 },
        { l: 'S', az: 180 }, { l: 'SW', az: 225 }, { l: 'W', az: 270 }, { l: 'NW', az: 315 },
      ];
      const edgePad = 22;
      for (const card of cards) {
        const a = ((card.az + rot) % 360) * (Math.PI / 180);
        const dx = Math.sin(a), dy = -Math.cos(a);
        // Parametric distance to viewport bounds along (dx, dy), leaving a small pad
        let tx = Infinity, ty = Infinity;
        if (dx > 1e-6)      tx = (W - edgePad - cx) / dx;
        else if (dx < -1e-6) tx = (edgePad - cx) / dx;
        if (dy > 1e-6)      ty = (H - edgePad - cy) / dy;
        else if (dy < -1e-6) ty = (edgePad - cy) / dy;
        const tt = Math.max(0, Math.min(tx, ty)); // defensive: zenith may be outside viewport
        const x = cx + dx * tt;
        const y = cy + dy * tt;
        const isMain = card.l.length === 1;
        ctx.font = `${isMain ? 'bold' : ''} ${isMain ? 14 : 11}px Outfit`;
        ctx.fillStyle = card.l === 'S'
          ? 'rgba(167, 139, 250, 0.95)'
          : isMain ? 'rgba(180, 200, 230, 0.9)' : 'rgba(120, 140, 180, 0.55)';
        // Subtle tick line pointing inward
        if (isMain) {
          ctx.strokeStyle = 'rgba(120, 160, 230, 0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x - dx * 12, y - dy * 12);
          ctx.lineTo(x - dx * 22, y - dy * 22);
          ctx.stroke();
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.l, x, y);
      }
      ctx.textBaseline = 'alphabetic';

      // HUD text — bottom-centre
      ctx.fillStyle = 'rgba(120, 140, 180, 0.5)';
      ctx.font = '11px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText('Drag to pan · Scroll / pinch to zoom · Hover to preview', W / 2, H - 12);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [userLat, userLon, startDrag, moveDrag, endDrag]);

  const info = selected ? CONSTELLATION_INFO[selected] : null;

  return (
    <div ref={containerRef} className="w-full relative" style={{ height: '100vh', overflow: 'hidden', cursor: 'none' }}>
      {/* Canvas — fills entire viewport */}
      <canvas
        ref={canvasRef}
        style={{ cursor: 'none' }}
        className={`absolute inset-0 w-full h-full select-none`}
        onMouseDown={e => startDrag(e.clientX, e.clientY)}
        onMouseMove={e => { moveDrag(e.clientX, e.clientY); onHoverMove(e.clientX, e.clientY); }}
        onMouseUp={e => endDrag(e.clientX, e.clientY)}
        onMouseLeave={() => { dragRef.current = null; hoveredRef.current = null; setHover(null); }}
      />

      {/* Header — overlaid, non-blocking */}
      <div className="absolute top-0 left-0 right-0 pt-16 sm:pt-20 pb-2 px-4 text-center z-10 pointer-events-none">
        <p className="text-slate-400 text-[10px] sm:text-[11px] uppercase tracking-widest mb-1" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>{userLat < 0 ? 'Southern' : 'Northern'} Hemisphere</p>
        <h2 className="text-white font-bold text-lg sm:text-2xl" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
          <span className="text-gradient">Interactive Sky Map</span>
        </h2>
        <p className="text-slate-400 text-[10px] sm:text-xs mt-1" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>Real-time positions for your location</p>
      </div>

      {/* Zoom controls */}
      <div
        className="absolute z-20 flex flex-col gap-1"
        style={{ right: 16, top: '50%', transform: 'translateY(-50%)' }}
      >
        {[
          { label: '+', action: () => { targetZoomRef.current = Math.min(3.5, targetZoomRef.current * 1.25); } },
          { label: '−', action: () => { targetZoomRef.current = Math.max(0.35, targetZoomRef.current / 1.25); } },
          { label: '⟳', action: () => { targetZoomRef.current = 1; panRef.current = { x: 0, y: 0 }; velRef.current = { x: 0, y: 0 }; } },
        ].map((b) => (
          <button
            key={b.label}
            onClick={b.action}
            style={{
              width: 34, height: 34,
              background: 'rgba(10,16,36,0.75)',
              border: '1px solid rgba(120,160,255,0.3)',
              borderRadius: 8,
              color: 'rgba(220,230,255,0.9)',
              fontSize: b.label === '⟳' ? 14 : 18,
              fontFamily: 'monospace',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              lineHeight: 1,
            }}
            title={b.label === '+' ? 'Zoom in' : b.label === '−' ? 'Zoom out' : 'Reset view'}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Mobile toggle for constellation list */}
      <button
        onClick={() => setListOpen(o => !o)}
        className="absolute z-30 sm:hidden"
        style={{
          left: 12, top: 'calc(50% - 18px)',
          width: 36, height: 36,
          background: 'rgba(10,16,36,0.85)',
          border: '1px solid rgba(120,160,255,0.35)',
          borderRadius: 8,
          color: 'rgba(220,230,255,0.9)',
          fontSize: 16,
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}
        aria-label="Toggle constellation list"
      >
        {listOpen ? '✕' : '☰'}
      </button>

      {/* Constellation list — left side */}
      <div
        className="absolute z-20"
        style={{
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 'min(180px, 60vw)',
          maxHeight: '60vh',
          background: 'rgba(10,16,36,0.75)',
          border: '1px solid rgba(120,160,255,0.25)',
          borderRadius: 10,
          backdropFilter: 'blur(6px)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.45)',
          overflow: 'hidden',
          display: listOpen ? 'flex' : 'none',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '8px 12px',
            fontSize: 10,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'rgba(180,200,230,0.65)',
            borderBottom: '1px solid rgba(120,160,255,0.15)',
          }}
        >
          Constellations
        </div>
        <div style={{ overflowY: 'auto', padding: '4px 0' }}>
          {CONSTELLATIONS.filter(c => visibleNames.has(c.name)).map(c => {
            const isSel = selected === c.name;
            return (
              <button
                key={c.name}
                onClick={() => setSelected(prev => (prev === c.name ? null : c.name))}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 12px',
                  background: isSel ? 'rgba(167,139,250,0.18)' : 'transparent',
                  border: 'none',
                  color: isSel ? '#fef08a' : 'rgba(220,230,255,0.82)',
                  fontSize: 12,
                  fontWeight: isSel ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  borderLeft: isSel ? '2px solid #fef08a' : '2px solid transparent',
                }}
                onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(120,160,255,0.08)'; }}
                onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <span>{c.emoji}</span>
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hover tooltip */}
      {hover && (() => {
          const info = CONSTELLATION_INFO[hover.name];
          return (
            <div
              style={{
                position: 'absolute',
                left: hover.x + 18,
                top: hover.y + 18,
                maxWidth: 260,
                pointerEvents: 'none',
                zIndex: 20,
                background: 'rgba(10, 16, 36, 0.92)',
                border: '1px solid rgba(120, 160, 255, 0.35)',
                borderRadius: 8,
                padding: '8px 11px',
                boxShadow: '0 4px 18px rgba(0,0,0,0.5), 0 0 12px rgba(100,160,255,0.15)',
                backdropFilter: 'blur(6px)',
                color: 'rgba(220,230,255,0.95)',
                fontSize: 12,
                lineHeight: 1.4,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: '#fef08a', marginBottom: 3 }}>{hover.name}</div>
              {info && (
                <>
                  <div style={{ color: 'rgba(200,210,255,0.75)', marginBottom: 4 }}>{info.description}</div>
                  <div style={{ color: 'rgba(140,170,220,0.7)', fontSize: 10, letterSpacing: '0.05em' }}>
                    Best: {info.season}
                  </div>
                </>
              )}
            </div>
          );
        })()}

      {/* Legend strip — overlaid at the bottom */}
      <div
        className="absolute left-0 right-0 px-6 flex flex-wrap justify-center gap-4 text-xs z-10 pointer-events-none"
        style={{ bottom: 34, color: 'rgba(180,200,230,0.75)', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
      >
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-300 inline-block" /> Constellation star
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-300 inline-block" /> Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: '#ff8a65' }} /> Planet
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-purple-400">·+·</span> Zenith
        </span>
      </div>

      {/* Constellation info panel */}
      <AnimatePresence>
        {info && selected && (
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 card p-5"
            style={{ maxWidth: '420px', margin: '0 auto' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">Constellation</p>
                <h3 className="text-white font-bold text-xl">{selected}</h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-500 hover:text-white text-lg leading-none ml-4 mt-0.5"
              >
                ✕
              </button>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-3">{info.description}</p>
            <span className="pill pill-primary text-[10px]">Best viewed: {info.season}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rocket trail — stays behind the rocket */}
      <div
        ref={rocketTrailRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 49,
          opacity: rocketVisible ? 1 : 0,
          transition: 'opacity 0.2s',
        }}
      >
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,230,160,0.95), rgba(255,120,40,0.6) 55%, rgba(200,40,10,0) 80%)',
              mixBlendMode: 'screen',
              willChange: 'transform, opacity',
            }}
          />
        ))}
      </div>

      {/* Rocket cursor */}
      <div
        ref={rocketRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 28,
          height: 56,
          pointerEvents: 'none',
          zIndex: 50,
          willChange: 'transform',
          opacity: rocketVisible ? 1 : 0,
          transition: 'opacity 0.2s',
          filter: 'drop-shadow(0 0 6px rgba(120,180,255,0.55))',
          ['--thrust' as any]: '1',
        } as any}
      >
        <svg width="28" height="56" viewBox="-24 -52 48 96" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="rocketHull" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2a3050" />
              <stop offset="45%" stopColor="#6f7fb0" />
              <stop offset="65%" stopColor="#eaf0ff" />
              <stop offset="100%" stopColor="#3a4570" />
            </linearGradient>
            <linearGradient id="rocketStripe" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#b2202e" />
              <stop offset="50%" stopColor="#ff5a5a" />
              <stop offset="100%" stopColor="#7a1520" />
            </linearGradient>
            <linearGradient id="rocketTip" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffe88a" />
              <stop offset="100%" stopColor="#d97a1a" />
            </linearGradient>
            <linearGradient id="rocketBooster" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1a2040" />
              <stop offset="50%" stopColor="#5a6a9a" />
              <stop offset="100%" stopColor="#0e1428" />
            </linearGradient>
            <radialGradient id="rocketPort" cx="0.3" cy="0.3" r="0.85">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#7fe5ff" />
              <stop offset="100%" stopColor="#0a2a5a" />
            </radialGradient>
            <radialGradient id="flameOuter" cx="0.5" cy="0.05" r="0.95">
              <stop offset="0%" stopColor="#fff7c2" stopOpacity="1" />
              <stop offset="35%" stopColor="#ffb347" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#ff4a1a" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ff1a00" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="flameInner" cx="0.5" cy="0.05" r="0.95">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="45%" stopColor="#ffe58a" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ff9e3a" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="flameCore" cx="0.5" cy="0.1" r="0.9">
              <stop offset="0%" stopColor="#c8e9ff" stopOpacity="1" />
              <stop offset="60%" stopColor="#9ec9ff" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#5a8fff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Flame — drawn first so rocket sits above it */}
          <g style={{ transform: 'scaleY(var(--thrust))', transformOrigin: '0 0', transformBox: 'fill-box' as any }}>
            <ellipse cx="0" cy="22" rx="9" ry="28" fill="url(#flameOuter)" className="rocket-flame-outer" />
            <ellipse cx="0" cy="15" rx="5.5" ry="18" fill="url(#flameInner)" className="rocket-flame-inner" />
            <ellipse cx="0" cy="10" rx="2.3" ry="10" fill="url(#flameCore)" className="rocket-flame-core" />
            {/* Side booster flames */}
            <ellipse cx="-12" cy="14" rx="3.5" ry="12" fill="url(#flameOuter)" className="rocket-flame-outer" opacity="0.85" />
            <ellipse cx="12" cy="14" rx="3.5" ry="12" fill="url(#flameOuter)" className="rocket-flame-outer" opacity="0.85" />
          </g>

          {/* Side boosters */}
          <path d="M-13 -18 Q-15 -22 -13 -26 L-10 -26 L-10 0 L-15 2 L-15 -4 Q-16 -10 -13 -18 Z" fill="url(#rocketBooster)" stroke="rgba(10,15,35,0.8)" strokeWidth="0.5" />
          <path d="M13 -18 Q15 -22 13 -26 L10 -26 L10 0 L15 2 L15 -4 Q16 -10 13 -18 Z" fill="url(#rocketBooster)" stroke="rgba(10,15,35,0.8)" strokeWidth="0.5" />
          {/* Booster nozzle caps */}
          <ellipse cx="-12.5" cy="0.5" rx="3" ry="1.4" fill="#0a0f1e" />
          <ellipse cx="12.5" cy="0.5" rx="3" ry="1.4" fill="#0a0f1e" />

          {/* Main booster nozzle */}
          <path d="M-6 0 L-9 5 L9 5 L6 0 Z" fill="#0e1428" stroke="rgba(0,0,0,0.7)" strokeWidth="0.4" />

          {/* Main body — tall capsule */}
          <path
            d="M-7 -28 Q-7 -42 0 -48 Q7 -42 7 -28 L7 0 L-7 0 Z"
            fill="url(#rocketHull)"
            stroke="rgba(30,40,70,0.9)"
            strokeWidth="0.8"
          />

          {/* Red racing stripe mid-body */}
          <rect x="-7" y="-16" width="14" height="5" fill="url(#rocketStripe)" />
          <rect x="-7" y="-9" width="14" height="1.5" fill="url(#rocketStripe)" opacity="0.6" />

          {/* Nose tip glow */}
          <path d="M-3 -44 Q-3 -48 0 -48 Q3 -48 3 -44 L3 -40 L-3 -40 Z" fill="url(#rocketTip)" />
          <circle cx="0" cy="-49" r="1.2" fill="#fff" opacity="0.9" />

          {/* Body highlight */}
          <path d="M-4.5 -40 Q-5 -22 -4.5 -2" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" fill="none" strokeLinecap="round" />

          {/* Cockpit porthole */}
          <circle cx="0" cy="-30" r="3.2" fill="url(#rocketPort)" stroke="rgba(220,230,255,0.85)" strokeWidth="0.9" />
          <circle cx="-1.1" cy="-31" r="0.9" fill="rgba(255,255,255,0.85)" />

          {/* Panel seams */}
          <line x1="-7" y1="-20" x2="7" y2="-20" stroke="rgba(20,30,60,0.6)" strokeWidth="0.35" />
          <line x1="-7" y1="-6" x2="7" y2="-6" stroke="rgba(20,30,60,0.6)" strokeWidth="0.35" />
        </svg>
      </div>

      <style>{`
        @keyframes rocket-flicker-outer { 0%,100% { transform: scale(1, 1); } 50% { transform: scale(0.85, 1.12); } }
        @keyframes rocket-flicker-inner { 0%,100% { transform: scale(1, 1); } 50% { transform: scale(1.1, 0.9); } }
        @keyframes rocket-flicker-core  { 0%,100% { transform: scale(1, 1); } 50% { transform: scale(0.9, 1.2); } }
        .rocket-flame-outer { transform-origin: 0 0; transform-box: fill-box; animation: rocket-flicker-outer 120ms infinite; }
        .rocket-flame-inner { transform-origin: 0 0; transform-box: fill-box; animation: rocket-flicker-inner 90ms infinite; }
        .rocket-flame-core  { transform-origin: 0 0; transform-box: fill-box; animation: rocket-flicker-core 70ms infinite; }
      `}</style>
    </div>
  );
}
