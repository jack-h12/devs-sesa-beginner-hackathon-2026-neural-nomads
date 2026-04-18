import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  getMoonPhase, getVisiblePlanets, getMeteorShowers,
  getConstellations, getSeason, getNextMoonEvent,
} from '../utils/astronomy';
import type { ISSPosition } from '../hooks/useISS';
import MoonVisual from './MoonVisual';

interface Props {
  userLat: number;
  userLon: number;
  city: string;
  iss: ISSPosition;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <p className="text-slate-500 text-[11px] uppercase tracking-widest mb-4">{title}</p>
      {children}
    </div>
  );
}

function MoonCard() {
  const moon = getMoonPhase(new Date());
  const nextNew  = getNextMoonEvent(0, new Date());
  const nextFull = getNextMoonEvent(180, new Date());

  return (
    <Section title="🌙 Moon tonight">
      <div className="flex gap-5 items-start">
        <MoonVisual size={110} />
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-xl mb-1">{moon.phaseName}</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">{moon.description}</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/5">
              <p className="text-slate-500 text-[10px] uppercase tracking-wide mb-1">Next new</p>
              <p className="text-white font-bold text-sm">🌑 {nextNew}</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/5">
              <p className="text-slate-500 text-[10px] uppercase tracking-wide mb-1">Next full</p>
              <p className="text-white font-bold text-sm">🌕 {nextFull}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-white/5 text-xs text-slate-500 leading-relaxed">
        {moon.illumination < 25
          ? '✦ Near-new moon — ideal conditions for faint deep-sky objects tonight.'
          : moon.illumination < 60
          ? '✦ Moderate moon. Planets are great; avoid trying to spot faint nebulae.'
          : '✦ Bright moon. Focus on the lunar surface and planets tonight.'}
      </div>
    </Section>
  );
}

function ISSCard({ iss }: { iss: ISSPosition }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <Section title="🛸 ISS — live tracking">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">International Space Station</h3>
        <div className="flex items-center gap-1.5 pill pill-success text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LIVE
        </div>
      </div>

      {iss.loading ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm h-20">
          <div className="w-4 h-4 border border-violet-500 border-t-transparent rounded-full animate-spin" />
          Contacting satellite…
        </div>
      ) : (
        <>
          <div className={`pill mb-4 ${iss.visible ? 'pill-success' : 'pill-muted'} text-sm`}>
            {iss.visible ? '👁 Potentially visible from your location' : '🌍 Currently over the other side of Earth'}
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            {iss.visible
              ? `Only ${iss.distanceKm.toLocaleString()} km away right now. Scan the sky for a fast, steady moving dot — brighter than most stars and crossing the sky in about 6 minutes.`
              : `${iss.distanceKm.toLocaleString()} km from you at this moment. At ${iss.velocity.toLocaleString()} km/h, it completes a full orbit every 90 minutes.`}
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Altitude', value: `${iss.altitude} km` },
              { label: 'Speed', value: `${iss.velocity.toLocaleString()} km/h` },
              { label: 'Distance', value: `${iss.distanceKm.toLocaleString()} km` },
            ].map(s => (
              <div key={s.label} className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/5">
                <p className="text-white font-bold text-sm">{s.value}</p>
                <p className="text-slate-600 text-[10px]">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>📡 {iss.latitude.toFixed(2)}°, {iss.longitude.toFixed(2)}°</span>
            <span>Updated {seconds}s ago</span>
          </div>
          <a
            href="https://spotthestation.nasa.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-3 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            NASA Spot the Station — exact pass times for your city →
          </a>
        </>
      )}
    </Section>
  );
}

function PlanetsCard({ lat, lon }: { lat: number; lon: number }) {
  const planets = getVisiblePlanets(new Date(), lat, lon);
  const [sel, setSel] = useState(planets.find(p => p.visible)?.name ?? planets[0].name);
  const planet = planets.find(p => p.name === sel);
  const visible = planets.filter(p => p.visible);
  const hidden = planets.filter(p => !p.visible);

  return (
    <Section title="🪐 Planets in tonight's sky">
      <div className="flex items-baseline gap-2 mb-4">
        <h3 className="text-white font-bold text-xl">{visible.length} visible</h3>
        <span className="text-slate-500 text-sm">out of 5 naked-eye planets</span>
      </div>

      {/* Planet selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {visible.map(p => (
          <button key={p.name} onClick={() => setSel(p.name)}
            className={`pill transition-all ${sel === p.name ? 'pill-primary' : 'pill-muted'}`}>
            {p.emoji} {p.name}
            <span className="text-emerald-400">↑{p.altitude}°</span>
          </button>
        ))}
        {hidden.map(p => (
          <button key={p.name} onClick={() => setSel(p.name)}
            className={`pill transition-all opacity-40 ${sel === p.name ? 'pill-muted border-white/20' : 'pill-muted'}`}>
            {p.emoji} {p.name}
          </button>
        ))}
      </div>

      {/* Planet detail */}
      <AnimatePresence mode="wait">
        {planet && (
          <motion.div
            key={planet.name}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="bg-white/[0.03] rounded-xl p-4 border border-white/5"
          >
            <div className="flex items-start gap-3 mb-2">
              <span className="text-3xl">{planet.emoji}</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-bold text-base ${planet.color}`}>{planet.name}</span>
                  {planet.visible
                    ? <span className="pill pill-success text-[10px]">↑ {planet.altitude}° · {planet.direction}</span>
                    : <span className="pill pill-danger text-[10px]">Below horizon</span>
                  }
                  <span className="pill pill-muted text-[10px]">Mag {planet.magnitude}</span>
                </div>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">{planet.description}</p>
            {planet.visible && (
              <p className="mt-2 text-xs text-slate-600">
                Look {planet.direction} — currently {planet.altitude}° above the horizon at azimuth {planet.azimuth}°.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-3 text-xs text-slate-600">
        Planet positions calculated in real-time using NASA/JPL astronomy-engine for your exact location.
      </p>
    </Section>
  );
}

function MeteorCard() {
  const showers = getMeteorShowers(new Date());
  const active = showers.filter(s => s.active);
  const upcoming = showers.filter(s => s.upcoming && !s.active).slice(0, 3);

  return (
    <Section title="☄️ Meteor showers">
      {active.length > 0 ? (
        active.map(s => (
          <div key={s.name}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-white font-bold text-lg">{s.emoji} {s.name}</h3>
              <span className="pill pill-warning text-[10px]">Active now</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-3">{s.description}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/5">
                <p className="text-white font-bold text-lg">{s.ratePerHour}</p>
                <p className="text-slate-600 text-xs">meteors/hour at peak</p>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/5">
                <p className="text-white font-bold">{s.constellation}</p>
                <p className="text-slate-600 text-xs">radiant constellation</p>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div>
          <h3 className="text-white font-bold text-lg mb-2">No active shower tonight</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            You can still see sporadic meteors — Earth sweeps up interplanetary dust constantly. Dark site, 20 min eye adjustment, look straight up.
          </p>
          {upcoming.length > 0 && (
            <div className="space-y-2">
              <p className="text-slate-500 text-xs uppercase tracking-wider">Coming up:</p>
              {upcoming.map(s => (
                <div key={s.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <span>{s.emoji}</span>
                    <span className="text-white text-sm font-medium">{s.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs">{s.peak}</p>
                    <p className="text-slate-600 text-xs">{s.ratePerHour}/hr peak</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="mt-4 pt-4 border-t border-white/5 text-xs text-slate-500">
        ✦ Tip: No telescope needed for meteors. Lie on your back, look straight up, allow 20 minutes for dark adaptation.
      </div>
    </Section>
  );
}

function ConstellationsCard({ lat }: { lat: number }) {
  const items = getConstellations(new Date(), lat);
  const season = getSeason(new Date(), lat);
  const [idx, setIdx] = useState(0);

  return (
    <Section title={`✨ Constellations — ${lat < 0 ? 'Southern' : 'Northern'} Hemisphere · ${season}`}>
      <div className="flex flex-wrap gap-2 mb-4">
        {items.map((c, i) => (
          <button
            key={c.name}
            onClick={() => setIdx(i)}
            className={`pill transition-all ${idx === i ? 'pill-primary' : 'pill-muted'}`}
          >
            {c.emoji} {c.name.split(' ')[0]}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.2 }}
          className="bg-white/[0.03] rounded-xl p-4 border border-white/5"
        >
          <div className="flex gap-3">
            <span className="text-3xl flex-shrink-0">{items[idx]?.emoji}</span>
            <div>
              <p className="text-white font-bold mb-0.5">{items[idx]?.name}</p>
              <span className="pill pill-muted text-[10px] mb-2 inline-block">Best: {items[idx]?.season}</span>
              <p className="text-slate-400 text-sm leading-relaxed">{items[idx]?.description}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Matariki — only for Southern Hemisphere users */}
      {lat < 0 && (
        <div className="mt-4 bg-violet-950/30 border border-violet-500/20 rounded-xl p-4">
          <p className="text-white font-semibold text-sm mb-1">🌟 Matariki — NZ's Star Cluster</p>
          <p className="text-slate-400 text-xs leading-relaxed">
            The Pleiades (Matariki) rise in pre-dawn June skies, marking the Māori New Year. Seven sisters visible to the naked eye. A NZ public holiday since 2022 celebrating indigenous astronomy.
          </p>
        </div>
      )}
    </Section>
  );
}

function TipsCard() {
  return (
    <Section title="💡 Before you go out">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { t: 'Dark adaptation', d: 'Takes 20–30 min. One glance at a white screen resets the clock. Use red light only.' },
          { t: 'Phone in night mode', d: 'iOS: Settings → Accessibility → Display → Colour Filters → Red/Green Filter.' },
          { t: 'Use Stellarium', d: 'Free app. Point your phone at the sky and it labels everything in real time.' },
          { t: 'Binoculars first', d: 'Good 10×50 binoculars beat a cheap telescope. See Jupiter\'s moons, star clusters, craters.' },
          { t: 'Dress warmer', d: 'Standing still at 2 AM is much colder than you think. Bring a sleeping bag if you plan to stay.' },
          { t: 'Get dark', d: 'Driving 30 min from the CBD can change what you see from ~200 stars to 3,000+.' },
        ].map(tip => (
          <div key={tip.t} className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
            <p className="text-white text-sm font-semibold mb-1">{tip.t}</p>
            <p className="text-slate-500 text-xs leading-relaxed">{tip.d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export default function TonightView({ userLat, userLon, city, iss }: Props) {
  const moon = getMoonPhase(new Date());
  const now = new Date().toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-6 pb-10">
          <div className="pill pill-primary mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {now} · {city}
          </div>
          <h1 className="text-5xl sm:text-7xl font-black leading-none tracking-tight mb-4">
            <span className="text-white">Tonight's </span>
            <span className="text-gradient">Sky Guide.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            {moon.emoji} {moon.phaseName} · {moon.illumination}% illuminated — here's everything you can see right now, in plain English.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <MoonCard />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <ISSCard iss={iss} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:col-span-2">
            <PlanetsCard lat={userLat} lon={userLon} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <MeteorCard />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <ConstellationsCard lat={userLat} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="md:col-span-2">
            <TipsCard />
          </motion.div>
        </div>

        {/* Data sources */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="mt-8 text-center text-xs text-slate-700"
        >
          Weather: Open-Meteo API · ISS: wheretheiss.at (10s refresh) · Moon & Planets: astronomy-engine (NASA/JPL) · Location: OpenStreetMap Nominatim
        </motion.p>
      </div>
    </div>
  );
}
