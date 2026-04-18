/**
 * Astronomy calculations — astronomy-engine (NASA/JPL derived) for planets & moon.
 * Meteor shower dates are real annual peak dates from the IAU.
 */
import * as Astronomy from 'astronomy-engine';

export interface MoonData {
  moonLon: number;      // 0–360° from MoonPhase()
  phaseName: string;
  illumination: number; // 0–100%, accurate from astronomy-engine
  emoji: string;
  description: string;
  ageInDays: number;
  isWaxing: boolean;
}

export interface Planet {
  name: string;
  emoji: string;
  visible: boolean;      // altitude > 10°
  altitude: number;      // degrees above horizon
  azimuth: number;       // degrees from North
  direction: string;     // cardinal
  magnitude: number;     // apparent magnitude
  description: string;
  color: string;
}

export interface MeteorShower {
  name: string;
  active: boolean;
  upcoming: boolean;
  peak: string;
  ratePerHour: number;
  description: string;
  constellation: string;
  emoji: string;
}

export interface DayScore {
  date: Date;
  dayName: string;
  moonScore: number;
  weatherScore: number;
  totalScore: number;
  cloudCover: number;
  moonIllumination: number;
  recommendation: string;
  label: 'Best' | 'Good' | 'Fair' | 'Poor';
}

// ─── Moon Phase ─────────────────────────────────────────────────────────────
// Uses astronomy-engine's MoonPhase() which returns geocentric elongation 0–360°
// 0° = new moon, 90° = first quarter, 180° = full moon, 270° = last quarter

export function getMoonPhase(date: Date): MoonData {
  const moonLon = Astronomy.MoonPhase(date); // 0–360

  // Illumination: exact formula from phase angle
  // At 0° (new) → 0%, at 180° (full) → 100%
  const illumination = Math.round((1 - Math.cos(moonLon * Math.PI / 180)) / 2 * 100);

  const isWaxing = moonLon < 180;

  // Last new moon for age calculation
  const lastNew = Astronomy.SearchMoonPhase(0, date, -35);
  const ageInDays = lastNew
    ? Math.max(0, (date.getTime() - lastNew.date.getTime()) / 86400000)
    : (moonLon / 360) * 29.53;

  let phaseName: string;
  let emoji: string;
  let description: string;

  if (moonLon < 10 || moonLon >= 350) {
    phaseName = 'New Moon';
    emoji = '🌑';
    description = "About as good as it gets. No moon at all — the whole night is dark. Perfect for chasing faint galaxies, nebulae, and the full band of the Milky Way.";
  } else if (moonLon < 80) {
    phaseName = 'Waxing Crescent';
    emoji = '🌒';
    description = "A thin crescent sets a couple of hours after sunset. Once it drops below the horizon, the rest of the night is properly dark. Go out late.";
  } else if (moonLon < 100) {
    phaseName = 'First Quarter';
    emoji = '🌓';
    description = "Half moon, sets around midnight. Good evening for bright stuff — the moon actually adds ambiance. After midnight the sky darkens up well.";
  } else if (moonLon < 170) {
    phaseName = 'Waxing Gibbous';
    emoji = '🌔';
    description = "Getting bright. Planets and the moon are excellent targets tonight, but the sky background won't be dark enough for faint deep-sky objects.";
  } else if (moonLon < 190) {
    phaseName = 'Full Moon';
    emoji = '🌕';
    description = "Full moon! Study the craters along the terminator with a telescope — stunning detail. But for star clusters and galaxies, it's like trying to see them with the lights on.";
  } else if (moonLon < 260) {
    phaseName = 'Waning Gibbous';
    emoji = '🌖';
    description = "Moon rises a few hours after sunset. Early evening offers a decent dark window before it comes up. Planets are great any time.";
  } else if (moonLon < 280) {
    phaseName = 'Last Quarter';
    emoji = '🌗';
    description = "Half moon rises around midnight — so the whole evening before that is properly dark. A good few hours of quality stargazing before moonrise.";
  } else {
    phaseName = 'Waning Crescent';
    emoji = '🌘';
    description = "Thin crescent rising only in the pre-dawn hours. Almost the entire night is dark. Near-perfect conditions — get out there.";
  }

  return { moonLon, phaseName, illumination, emoji, description, ageInDays, isWaxing };
}

export function getMoonScore(illumination: number): number {
  return Math.max(0, Math.round(10 * (1 - illumination / 100)));
}

// ─── Next Moon Events ────────────────────────────────────────────────────────

export function getNextMoonEvent(eventPhase: 0 | 90 | 180 | 270, from: Date): string {
  try {
    const result = Astronomy.SearchMoonPhase(eventPhase, from, 35);
    if (!result) return '—';
    return result.date.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

// ─── Planet Positions (real ephemeris) ──────────────────────────────────────

export function getVisiblePlanets(date: Date, lat: number, lon: number): Planet[] {
  const observer = new Astronomy.Observer(lat, lon, 0);

  const defs = [
    { body: Astronomy.Body.Venus,   name: 'Venus',   emoji: '♀️', color: 'text-yellow-200',
      description: "Unmissable — brightest thing in the sky after the Moon. Look low on the horizon near sunrise or sunset. So bright it can cast faint shadows on very dark nights." },
    { body: Astronomy.Body.Jupiter, name: 'Jupiter',  emoji: '♃', color: 'text-orange-200',
      description: "A steady cream-coloured beacon. Binoculars reveal four of its moons lined up beside it — the same ones Galileo spotted in 1610 with a telescope worse than most toys." },
    { body: Astronomy.Body.Saturn,  name: 'Saturn',   emoji: '♄', color: 'text-yellow-400',
      description: "That pale golden 'star' that never twinkles. Even a cheap telescope shows the rings — it's the sight that turns people into astronomers." },
    { body: Astronomy.Body.Mars,    name: 'Mars',     emoji: '♂️', color: 'text-red-400',
      description: "Distinctly reddish-orange — once you know it, you'll always recognise it. Doesn't twinkle like stars do. Closest approach every 26 months makes it extra bright." },
    { body: Astronomy.Body.Mercury, name: 'Mercury',  emoji: '☿', color: 'text-slate-300',
      description: "Most people have never seen Mercury despite it being visible to the naked eye. Look very low on the horizon during twilight — it never wanders far from the Sun." },
  ];

  const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  return defs.map(def => {
    try {
      const eq = Astronomy.Equator(def.body, date, observer, true, true);
      const hz = Astronomy.Horizon(date, observer, eq.ra, eq.dec, 'normal');
      const illum = Astronomy.Illumination(def.body, date);
      const dir = cardinals[Math.round(hz.azimuth / 45) % 8];

      return {
        name: def.name,
        emoji: def.emoji,
        color: def.color,
        description: def.description,
        visible: hz.altitude > 8,
        altitude: Math.round(hz.altitude),
        azimuth: Math.round(hz.azimuth),
        direction: dir,
        magnitude: Math.round(illum.mag * 10) / 10,
      };
    } catch {
      return {
        name: def.name, emoji: def.emoji, color: def.color,
        description: def.description,
        visible: false, altitude: 0, azimuth: 0,
        direction: '—', magnitude: 0,
      };
    }
  });
}

// ─── Meteor Showers (real IAU dates) ────────────────────────────────────────

export function getMeteorShowers(date: Date): MeteorShower[] {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const n = m * 100 + d;

  const showers: Array<Omit<MeteorShower, 'active' | 'upcoming'> & { activeRange: [number, number]; upcomingRange: [number, number] }> = [
    { name: 'Quadrantids',  emoji: '☄️',  peak: 'Jan 3–4',   ratePerHour: 120, constellation: 'Boötes',     activeRange: [101, 105], upcomingRange: [1226, 101],
      description: "One of the strongest showers but narrow peak — often just hours of high rate. Blue meteors from a dead comet called 2003 EH1." },
    { name: 'Lyrids',       emoji: '⭐',  peak: 'Apr 22–23', ratePerHour: 20,  constellation: 'Lyra',       activeRange: [416, 425], upcomingRange: [410, 416],
      description: "Debris from Comet Thatcher (last visited 1861). Reliable and occasional bright fireballs." },
    { name: 'Eta Aquariids', emoji: '🌠', peak: 'May 6–7',   ratePerHour: 50,  constellation: 'Aquarius',   activeRange: [501, 510], upcomingRange: [425, 501],
      description: "Halley's Comet debris. Actually better from the Southern Hemisphere — the radiant rises high for us. Lucky." },
    { name: 'Perseids',     emoji: '🌟',  peak: 'Aug 11–13', ratePerHour: 100, constellation: 'Perseus',     activeRange: [808, 815], upcomingRange: [801, 808],
      description: "World's most popular shower. Warm nights, reliable rates, and fireballs that light up the whole sky. Worth the alarm." },
    { name: 'Orionids',     emoji: '🔭',  peak: 'Oct 21–22', ratePerHour: 25,  constellation: 'Orion',       activeRange: [1018, 1024], upcomingRange: [1012, 1018],
      description: "Also Halley's Comet. Swift meteors that leave glowing trails for a second or two after they pass." },
    { name: 'Leonids',      emoji: '🦁',  peak: 'Nov 17–18', ratePerHour: 15,  constellation: 'Leo',         activeRange: [1115, 1120], upcomingRange: [1110, 1115],
      description: "Normally quiet but every 33 years it storms — the 1966 outburst hit 40 meteors per *second*. Next storm due ~2031." },
    { name: 'Geminids',     emoji: '✨',  peak: 'Dec 13–14', ratePerHour: 150, constellation: 'Gemini',      activeRange: [1210, 1216], upcomingRange: [1204, 1210],
      description: "Arguably the best shower of the year — more meteors than Perseids, slower and more colourful. From an asteroid, not a comet." },
    { name: 'Ursids',       emoji: '🐻',  peak: 'Dec 22–23', ratePerHour: 10,  constellation: 'Ursa Minor',  activeRange: [1221, 1225], upcomingRange: [1217, 1221],
      description: "Quiet shower around the solstice. Worth a look if you're already outside on a clear night." },
  ];

  return showers.map(s => {
    const [a1, a2] = s.activeRange;
    const [u1, u2] = s.upcomingRange;
    const active = a1 <= a2 ? (n >= a1 && n <= a2) : (n >= a1 || n <= a2);
    const upcoming = !active && (u1 <= u2 ? (n >= u1 && n <= u2) : (n >= u1 || n <= u2));
    return { name: s.name, emoji: s.emoji, peak: s.peak, ratePerHour: s.ratePerHour, constellation: s.constellation, description: s.description, active, upcoming };
  });
}

// ─── Day Score ───────────────────────────────────────────────────────────────

export function calculateDayScore(date: Date, cloudCover: number, lightPollutionIndex = 3): DayScore {
  const moon = getMoonPhase(date);
  const moonScore = getMoonScore(moon.illumination);
  const weatherScore = Math.max(0, Math.round(10 * (1 - cloudCover / 100)));
  const darkBonus = (10 - lightPollutionIndex) * 0.10;
  const totalScore = Math.max(0, Math.min(10, Math.round(moonScore * 0.35 + weatherScore * 0.55 + darkBonus)));

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const isToday = date.toDateString() === new Date().toDateString();

  let label: 'Best' | 'Good' | 'Fair' | 'Poor';
  let recommendation: string;

  if (totalScore >= 7) {
    label = 'Best';
    recommendation = cloudCover < 20
      ? 'Clear skies, almost no moon. Get somewhere dark — this is a rare good night.'
      : 'Moon is cooperative. Some cloud but the dark helps a lot.';
  } else if (totalScore >= 5) {
    label = 'Good';
    recommendation = cloudCover > 50
      ? 'Patchy cloud but moon is well-behaved. Worth checking again close to the time.'
      : 'Decent conditions. Not perfect, but worthwhile with binoculars.';
  } else if (totalScore >= 3) {
    label = 'Fair';
    recommendation = moon.illumination > 60
      ? 'Bright moon. Good for planetary observing and the moon itself.'
      : 'Mostly cloudy. Maybe a quick look, but don\'t drive far.';
  } else {
    label = 'Poor';
    recommendation = cloudCover > 80
      ? 'Heavy overcast. Not worth it tonight.'
      : 'Bright moon and cloud combined. Try another night.';
  }

  return {
    date,
    dayName: isToday ? 'Tonight' : days[date.getDay()],
    moonScore,
    weatherScore,
    totalScore,
    cloudCover,
    moonIllumination: moon.illumination,
    recommendation,
    label,
  };
}

// ─── Constellations ──────────────────────────────────────────────────────────

export function getSeason(date: Date, lat: number = 0): string {
  const m = date.getMonth() + 1;
  // Northern Hemisphere seasons (flip for Southern)
  const north = lat >= 0;
  if (m >= 12 || m <= 2) return north ? 'Winter' : 'Summer';
  if (m >= 3 && m <= 5)  return north ? 'Spring' : 'Autumn';
  if (m >= 6 && m <= 8)  return north ? 'Summer' : 'Winter';
  return north ? 'Autumn' : 'Spring';
}

type Hemi = 'south' | 'north' | 'both';
interface ConstellationInfo { name: string; emoji: string; season: string; hemi: Hemi; description: string; }

export function getConstellations(date: Date, lat: number = 0) {
  const season = getSeason(date, lat);
  const isNorth = lat >= 0;

  const all: ConstellationInfo[] = [
    // Southern-only
    { name: 'Southern Cross', emoji: '✚', season: 'Autumn/Winter', hemi: 'south', description: "The most recognised constellation in the Southern Hemisphere. Four bright stars form a cross; the long axis points toward the South Celestial Pole — there's no southern 'pole star', so navigators use this cross instead." },
    { name: 'Centaurus', emoji: '🐎', season: 'Autumn/Winter', hemi: 'south', description: "Contains Alpha Centauri — the closest star system to Earth at 4.37 light-years. What looks like one star is actually three. Also home to Omega Centauri, the largest globular cluster visible without a telescope." },
    { name: 'Magellanic Clouds', emoji: '☁️', season: 'All year', hemi: 'south', description: "Two fuzzy patches near the Southern Cross — entire satellite galaxies orbiting ours. The Large Magellanic Cloud is 160,000 light-years away. Completely invisible from the Northern Hemisphere." },
    { name: 'Canopus', emoji: '⭐', season: 'All year', hemi: 'south', description: "Second brightest star in the sky, circumpolar from most southern latitudes (never sets). Ancient Polynesian navigators used it for latitude. 310 light-years away and 10,000× more luminous than our Sun." },

    // Northern-only
    { name: 'Ursa Major (Big Dipper)', emoji: '🥄', season: 'Spring', hemi: 'north', description: "The Big Dipper is the most iconic asterism in the northern sky. The two stars at the end of the 'bowl' point directly to Polaris, the North Star. Circumpolar from most of the Northern Hemisphere." },
    { name: 'Cassiopeia', emoji: '👑', season: 'Autumn', hemi: 'north', description: "A distinct W-shape (or M, depending on the time of night) near the North Star. Circumpolar from mid-northern latitudes. Named for a vain queen in Greek mythology." },
    { name: 'Polaris / Ursa Minor', emoji: '⭐', season: 'All year', hemi: 'north', description: "The North Star sits almost exactly on the celestial pole. Every other star appears to rotate around it through the night. Your latitude equals Polaris's altitude — a useful trick for navigation." },
    { name: 'Andromeda Galaxy (M31)', emoji: '🌌', season: 'Autumn', hemi: 'north', description: "The farthest thing you can see with the naked eye — 2.5 million light-years away. A faint smudge near the constellation Andromeda. On a collision course with our Milky Way (in 4.5 billion years)." },
    { name: 'Cygnus (Northern Cross)', emoji: '🦢', season: 'Summer', hemi: 'north', description: "A large cross-shaped swan flying along the Milky Way. Contains Deneb, one of the three stars of the Summer Triangle. Rich in star clusters and nebulae visible with binoculars." },

    // Visible from both
    { name: 'Orion the Hunter', emoji: '⚔️', season: isNorth ? 'Winter' : 'Summer', hemi: 'both', description: isNorth ? "Winter's signature constellation — three-star belt, Betelgeuse on one shoulder, Rigel at one foot. The Orion Nebula hangs below the belt, visible as a fuzzy smudge." : "Appears upside-down from the Southern Hemisphere compared to how the north sees it. The three-star belt is the most recognisable line in the sky. The Orion Nebula sits just 'above' it from here — visible to the naked eye as a fuzzy smudge." },
    { name: 'Scorpius', emoji: '🦂', season: isNorth ? 'Summer' : 'Winter', hemi: 'both', description: "A beautiful S-shaped arc. The heart is Antares — a red supergiant large enough to swallow Earth's orbit whole. The reddish-orange tint makes it stand out immediately." },
    { name: 'Sagittarius', emoji: '🏹', season: isNorth ? 'Summer' : 'Winter', hemi: 'both', description: "Shaped like a teapot. When you look at it, you're staring toward the galactic centre — 26,000 light-years away. The 'steam' from the spout is the densest visible part of the Milky Way." },
    { name: 'Leo', emoji: '🦁', season: 'Spring', hemi: 'both', description: "A sickle-shaped head attached to a triangle of a hindquarters — one of the few constellations that actually looks like its name. Regulus, the 'heart', is a bright blue-white star about 79 light-years away." },
    { name: 'Milky Way', emoji: '🌌', season: isNorth ? 'Summer' : 'Winter', hemi: 'both', description: "From a dark site, the Milky Way is a glowing river of billions of stars arching overhead. Peak visibility in the Southern Hemisphere's winter / Northern Hemisphere's summer. Allow 20 min for dark adaptation and it becomes spectacular." },
  ];

  // Filter by hemisphere visibility
  const visible = all.filter(c => c.hemi === 'both' || (isNorth ? c.hemi === 'north' : c.hemi === 'south'));

  // Sort: season match first, then alphabetical stability
  return visible.sort((a, b) => {
    const aP = a.season.includes(season) || a.season === 'All year' ? 0 : 1;
    const bP = b.season.includes(season) || b.season === 'All year' ? 0 : 1;
    return aP - bP;
  });
}
