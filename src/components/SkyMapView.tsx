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
const BG_STARS = Array.from({ length: 550 }, (_, i) => ({
  ra: (i * 137.508) % 360,
  dec: -90 + ((i * 73.891) % 180),
  mag: sr(),
  twink: sr() * Math.PI * 2,
}));

// Milky Way band — approximate galactic equator in equatorial coords
const MW = [
  { ra: 266, dec: -29, w: 1.0 }, { ra: 270, dec: -20, w: 0.85 },
  { ra: 282, dec: -5,  w: 0.7  }, { ra: 298, dec: 15,  w: 0.55 },
  { ra: 316, dec: 35,  w: 0.42 }, { ra: 0,   dec: 60,  w: 0.32 },
  { ra: 44,  dec: 56,  w: 0.35 }, { ra: 80,  dec: 32,  w: 0.45 },
  { ra: 86,  dec: 28,  w: 0.6  }, { ra: 104, dec: 13,  w: 0.58 },
  { ra: 128, dec: -3,  w: 0.55 }, { ra: 150, dec: -20, w: 0.65 },
  { ra: 175, dec: -33, w: 0.72 }, { ra: 200, dec: -44, w: 0.82 },
  { ra: 228, dec: -45, w: 0.88 }, { ra: 250, dec: -37, w: 0.92 },
];

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
  const rotRef = useRef(0);
  const dragRef = useRef<{ x: number; y: number; startRot: number } | null>(null);
  const animRef = useRef(0);
  const planetsRef = useRef<ReturnType<typeof getVisiblePlanets>>([]);

  useEffect(() => { selectedRef.current = selected; }, [selected]);

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
    dragRef.current = { x: cx, y: cy, startRot: rotRef.current };
  }, []);

  const moveDrag = useCallback((clientX: number) => {
    if (!dragRef.current) return;
    rotRef.current = dragRef.current.startRot + (clientX - dragRef.current.x) * 0.35;
  }, []);

  const endDrag = useCallback((clientX: number, clientY: number) => {
    if (!dragRef.current) return;
    const moved = Math.abs(clientX - dragRef.current.x) > 8 || Math.abs(clientY - dragRef.current.y) > 8;
    dragRef.current = null;
    if (moved) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (clientX - rect.left) * (canvas.width / rect.width);
    const my = (clientY - rect.top) * (canvas.height / rect.height);
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const R = Math.min(canvas.width, canvas.height) * 0.44;
    const lst = getLST(userLon, new Date());

    let hit: { name: string; dist: number } | null = null;
    for (const c of CONSTELLATIONS) {
      const { alt, az } = raDecToAltAz(c.ra, c.dec, lst, userLat);
      const pt = toScreen(alt, az, cx, cy, R, rotRef.current);
      if (!pt) continue;
      const d = Math.hypot(mx - pt.x, my - pt.y);
      if (d < 70 && (!hit || d < hit.dist)) hit = { name: c.name, dist: d };
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
    const onTouchStart = (e: TouchEvent) => { e.preventDefault(); const t = e.touches[0]; startDrag(t.clientX, t.clientY); };
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); moveDrag(e.touches[0].clientX); };
    const onTouchEnd = (e: TouchEvent) => { e.preventDefault(); const t = e.changedTouches[0]; endDrag(t.clientX, t.clientY); };
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      if (W === 0 || H === 0) { animRef.current = requestAnimationFrame(draw); return; }

      const cx = W / 2, cy = H / 2;
      const R = Math.min(W, H) * 0.44;
      const rot = rotRef.current;
      const sel = selectedRef.current;
      const now = new Date();
      const t = now.getTime() / 1000;
      const lst = getLST(userLon, now);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#080c18';
      ctx.fillRect(0, 0, W, H);

      // ── Dome clip ─────────────────────────────────────────────────────────────
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      // Sky gradient
      const sg = ctx.createRadialGradient(cx, cy * 0.85, 0, cx, cy, R);
      sg.addColorStop(0, '#0e1b44');
      sg.addColorStop(0.55, '#07102c');
      sg.addColorStop(1, '#020810');
      ctx.fillStyle = sg;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

      // Milky Way glow
      for (const mw of MW) {
        const { alt, az } = raDecToAltAz(mw.ra, mw.dec, lst, userLat);
        const pt = toScreen(alt, az, cx, cy, R, rot);
        if (!pt) continue;
        const br = R * 0.24 * mw.w;
        const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, br);
        g.addColorStop(0, `rgba(155, 135, 240, ${0.06 * mw.w})`);
        g.addColorStop(0.45, `rgba(110, 90, 200, ${0.03 * mw.w})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, br, 0, Math.PI * 2);
        ctx.fill();
      }

      // Background stars with twinkling
      for (let i = 0; i < BG_STARS.length; i++) {
        const s = BG_STARS[i];
        const { alt, az } = raDecToAltAz(s.ra, s.dec, lst, userLat);
        const pt = toScreen(alt, az, cx, cy, R, rot);
        if (!pt) continue;
        const tw = 0.65 + 0.35 * Math.sin(t * (1.2 + s.mag) + s.twink);
        const size = 0.45 + s.mag * 1.5;
        ctx.fillStyle = `rgba(210, 220, 255, ${(0.22 + s.mag * 0.58) * tw})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Altitude rings (30° and 60°)
      ctx.setLineDash([4, 9]);
      ctx.lineWidth = 0.7;
      for (const deg of [30, 60]) {
        const rr = (90 - deg) / 90 * R;
        ctx.strokeStyle = 'rgba(70, 100, 180, 0.16)';
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(80, 115, 190, 0.38)';
        ctx.font = '9px Outfit';
        ctx.textAlign = 'left';
        ctx.fillText(`${deg}°`, cx + 4, cy - rr + 10);
      }
      ctx.setLineDash([]);

      // ── Constellations ────────────────────────────────────────────────────────
      const sf = R / 300;
      for (const c of CONSTELLATIONS) {
        const { alt, az } = raDecToAltAz(c.ra, c.dec, lst, userLat);
        const center = toScreen(alt, az, cx, cy, R, rot);
        if (!center) continue;

        const isSel = sel === c.name;
        const sps = c.stars.map(s => ({ x: center.x + s.x * sf, y: center.y + s.y * sf }));

        // Lines
        ctx.strokeStyle = isSel ? 'rgba(167, 139, 250, 0.8)' : 'rgba(100, 82, 185, 0.2)';
        ctx.lineWidth = isSel ? 1.6 : 0.9;
        for (const [i, j] of c.lines) {
          ctx.beginPath();
          ctx.moveTo(sps[i].x, sps[i].y);
          ctx.lineTo(sps[j].x, sps[j].y);
          ctx.stroke();
        }

        // Stars
        for (const sp of sps) {
          if (isSel) {
            const g = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, 12);
            g.addColorStop(0, 'rgba(253, 224, 71, 0.5)');
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, 12, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = isSel ? '#fef08a' : '#c7d2fe';
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, isSel ? 3.8 : 2.3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Label
        ctx.font = isSel ? 'bold 12px Outfit' : '10px Outfit';
        ctx.fillStyle = isSel ? '#fef08a' : 'rgba(148, 163, 184, 0.62)';
        ctx.textAlign = 'center';
        ctx.fillText(`${c.emoji} ${c.name}`, center.x, center.y - R * 0.13);

        // Selection ring
        if (isSel) {
          ctx.strokeStyle = 'rgba(253, 224, 71, 0.28)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 6]);
          ctx.beginPath();
          ctx.arc(center.x, center.y, R * 0.16, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // ── Visible planets ───────────────────────────────────────────────────────
      for (const p of planetsRef.current) {
        if (!p.visible) continue;
        const pt = toScreen(p.altitude, p.azimuth, cx, cy, R, rot);
        if (!pt) continue;
        const color = PLANET_COLORS[p.name] ?? '#ffffff';
        const pr = p.magnitude < -1 ? 6 : p.magnitude < 1 ? 4.5 : 3.5;

        ctx.shadowColor = color;
        ctx.shadowBlur = 14;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pr, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        ctx.font = 'bold 9px Outfit';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.textAlign = 'center';
        ctx.fillText(`${p.emoji} ${p.name}`, pt.x, pt.y - pr - 5);
      }

      // Zenith crosshair
      ctx.strokeStyle = 'rgba(100, 180, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy); ctx.lineTo(cx + 7, cy);
      ctx.moveTo(cx, cy - 7); ctx.lineTo(cx, cy + 7);
      ctx.stroke();

      ctx.restore(); // end dome clip

      // Dome border (gradient ring)
      const bg = ctx.createLinearGradient(cx - R, cy, cx + R, cy);
      bg.addColorStop(0, 'rgba(139, 92, 246, 0.35)');
      bg.addColorStop(0.5, 'rgba(34, 211, 238, 0.35)');
      bg.addColorStop(1, 'rgba(139, 92, 246, 0.35)');
      ctx.strokeStyle = bg;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      // Horizon label
      ctx.fillStyle = 'rgba(80, 100, 160, 0.35)';
      ctx.font = '9px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText('HORIZON', cx, cy + R - 6);

      // Cardinal directions
      const cards = [
        { l: 'N', az: 0 }, { l: 'NE', az: 45 }, { l: 'E', az: 90 }, { l: 'SE', az: 135 },
        { l: 'S', az: 180 }, { l: 'SW', az: 225 }, { l: 'W', az: 270 }, { l: 'NW', az: 315 },
      ];
      for (const card of cards) {
        const a = ((card.az + rot) % 360) * (Math.PI / 180);
        const offset = card.l.length === 1 ? 22 : 20;
        const x = cx + (R + offset) * Math.sin(a);
        const y = cy - (R + offset) * Math.cos(a);
        const isMain = card.l.length === 1;
        ctx.font = `${isMain ? 'bold' : ''} ${isMain ? 13 : 10}px Outfit`;
        ctx.fillStyle = card.l === 'S'
          ? 'rgba(167, 139, 250, 0.9)'
          : isMain ? 'rgba(148, 163, 184, 0.85)' : 'rgba(100, 116, 139, 0.5)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.l, x, y);
      }
      ctx.textBaseline = 'alphabetic';

      // HUD text
      ctx.fillStyle = 'rgba(90, 110, 150, 0.55)';
      ctx.font = '11px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText('Drag to rotate · Tap a constellation to explore', cx, cy + R + 24);

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
    };
  }, [userLat, userLon, startDrag, moveDrag, endDrag]);

  const info = selected ? CONSTELLATION_INFO[selected] : null;

  return (
    <div className="w-full relative flex flex-col" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="pt-5 pb-2 text-center flex-none z-10">
        <p className="text-slate-500 text-[11px] uppercase tracking-widest mb-1">Southern Hemisphere</p>
        <h2 className="text-white font-bold text-2xl">
          <span className="text-gradient">Interactive Sky Map</span>
        </h2>
        <p className="text-slate-500 text-xs mt-1">Real-time positions for your location</p>
      </div>

      {/* Canvas */}
      <div className="flex-1 w-full" style={{ minHeight: '72vh' }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing select-none"
          onMouseDown={e => startDrag(e.clientX, e.clientY)}
          onMouseMove={e => moveDrag(e.clientX)}
          onMouseUp={e => endDrag(e.clientX, e.clientY)}
          onMouseLeave={() => { dragRef.current = null; }}
        />
      </div>

      {/* Legend strip */}
      <div className="flex-none px-6 pb-4 flex flex-wrap justify-center gap-4 text-xs text-slate-500 z-10">
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
    </div>
  );
}
