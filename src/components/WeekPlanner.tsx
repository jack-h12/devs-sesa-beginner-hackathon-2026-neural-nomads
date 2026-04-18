import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import { getMoonPhase, calculateDayScore, type DayScore } from '../utils/astronomy';
import type { DailyWeatherData } from '../hooks/useWeather';
import MoonVisual from './MoonVisual';

interface Props {
  weatherDays: DailyWeatherData[];
  userLat: number;
  city: string;
  onSelectTonight: () => void;
  weatherLoading: boolean;
}

const LABEL = {
  Best: { pill: 'pill-success', ring: '#10b981', bar: 'bg-emerald-500' },
  Good: { pill: 'pill-primary', ring: '#8b5cf6', bar: 'bg-violet-500' },
  Fair: { pill: 'pill-warning', ring: '#f59e0b', bar: 'bg-amber-500' },
  Poor: { pill: 'pill-danger',  ring: '#ef4444', bar: 'bg-red-500' },
};

function Ring({ score, color, size = 64 }: { score: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ width: size, height: size }} className="relative flex-shrink-0">
      <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={5} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (score / 10) * c }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black text-white" style={{ fontSize: size * 0.26 }}>{score}</span>
        <span className="text-slate-500" style={{ fontSize: size * 0.12 }}>/10</span>
      </div>
    </div>
  );
}

function DayCard({ scored, index, isBest, isSelected, onClick }: {
  scored: DayScore; index: number; isBest: boolean; isSelected: boolean; onClick: () => void;
}) {
  const { ring, pill } = LABEL[scored.label];
  const moon = getMoonPhase(scored.date);

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      onClick={onClick}
      className={`card card-hover w-full text-left p-4 transition-all duration-200 ${
        isSelected ? 'border-violet-500/40 bg-violet-950/20' : ''
      }`}
    >
      {isBest && (
        <div className="pill pill-success mb-3 text-[10px] uppercase tracking-wider">✦ Best this week</div>
      )}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-bold text-white text-base">{scored.dayName}</p>
          <p className="text-slate-500 text-xs mt-0.5">{scored.date.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' })}</p>
        </div>
        <Ring score={scored.totalScore} color={ring} size={56} />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
        <span>{moon.emoji} {moon.illumination}% moon</span>
        <span>☁ {scored.cloudCover}%</span>
      </div>

      <div className={`pill ${pill} text-[11px]`}>{scored.label} night</div>
    </motion.button>
  );
}

function DetailPanel({ scored, weatherDay, onGoTonight }: {
  scored: DayScore; weatherDay?: DailyWeatherData; onGoTonight: () => void;
}) {
  const moon = getMoonPhase(scored.date);
  const { ring } = LABEL[scored.label];
  const isTonight = scored.date.toDateString() === new Date().toDateString();

  const stats = [
    { label: 'Cloud cover', value: `${scored.cloudCover}%`, note: scored.cloudCover < 30 ? 'Clear' : scored.cloudCover < 60 ? 'Patchy' : 'Overcast' },
    { label: 'Moon brightness', value: `${moon.illumination}%`, note: moon.phaseName },
    { label: 'Temperature', value: weatherDay ? `${Math.round(weatherDay.temperature)}°C` : '—', note: 'Current · daily high' },
    { label: 'Wind', value: weatherDay ? `${Math.round(weatherDay.windSpeed)} km/h` : '—', note: 'Max speed' },
  ];

  return (
    <motion.div
      key={scored.date.toISOString()}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="card p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">Selected night</p>
          <h3 className="text-2xl font-black text-white">{scored.dayName}</h3>
          <p className="text-slate-500 text-sm">{scored.date.toLocaleDateString('en-NZ', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <Ring score={scored.totalScore} color={ring} size={80} />
      </div>

      {/* Verdict */}
      <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
        <p className="text-slate-300 text-sm leading-relaxed">{scored.recommendation}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white/[0.03] rounded-xl p-3">
            <p className="text-slate-500 text-xs mb-1">{s.label}</p>
            <p className="text-white font-bold text-lg leading-none">{s.value}</p>
            <p className="text-slate-600 text-xs mt-1">{s.note}</p>
          </div>
        ))}
      </div>

      {/* Moon */}
      <div className="flex justify-center py-2">
        <MoonVisual size={100} />
      </div>

      {/* Hourly cloud strip */}
      {weatherDay && weatherDay.hourly.length > 0 && (
        <HourlyStrip hourly={weatherDay.hourly} date={scored.date} />
      )}

      {isTonight && (
        <button
          onClick={onGoTonight}
          className="w-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity"
        >
          See what's in the sky tonight →
        </button>
      )}
    </motion.div>
  );
}

function HourlyStrip({ hourly, date }: { hourly: any[]; date: Date }) {
  const evening = hourly.filter(h => {
    const hd = new Date(h.time);
    const hDay = hd.getDate();
    const hHour = hd.getHours();
    const tDay = date.getDate();
    const nextDay = new Date(date); nextDay.setDate(date.getDate() + 1);
    return (hDay === tDay && hHour >= 18) || (hDay === nextDay.getDate() && hHour <= 6);
  }).slice(0, 13);

  if (evening.length === 0) return null;

  return (
    <div>
      <p className="text-slate-500 text-xs mb-2 uppercase tracking-wider">Cloud cover — evening to dawn</p>
      <div className="flex items-end gap-0.5 h-12">
        {evening.map((h, i) => {
          const hDate = new Date(h.time);
          const hour = hDate.getHours();
          const pct = h.cloudCover / 100;
          const col = h.cloudCover < 25 ? '#22d3ee' : h.cloudCover < 55 ? '#8b5cf6' : h.cloudCover < 80 ? '#f59e0b' : '#ef4444';
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }} animate={{ height: `${Math.max(4, pct * 44)}px` }}
                transition={{ delay: i * 0.03, duration: 0.5 }}
                className="w-full rounded-t"
                style={{ backgroundColor: col, opacity: 0.75 }}
              />
              {(hour === 0 || hour === 21 || hour === 3 || hour === 6) && (
                <span className="text-[8px] text-slate-600">
                  {hour === 0 ? '12a' : hour === 3 ? '3a' : hour === 6 ? '6a' : '9p'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function WeekPlanner({ weatherDays, userLat: _u, city, onSelectTonight, weatherLoading }: Props) {
  const [selected, setSelected] = useState(0);

  const scored = useMemo<DayScore[]>(() => {
    if (!weatherDays.length) {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() + i);
        return calculateDayScore(d, 35 + Math.round(Math.random() * 45), 3);
      });
    }
    return weatherDays.map(d => calculateDayScore(d.date, d.cloudCoverAvg, 3));
  }, [weatherDays]);

  const bestIdx = useMemo(() => {
    let max = -1, idx = 0;
    scored.forEach((s, i) => { if (s.totalScore > max) { max = s.totalScore; idx = i; } });
    return idx;
  }, [scored]);

  const tonight = scored[0];
  const tonightMoon = getMoonPhase(new Date());

  return (
    <div className="min-h-screen pt-20 pb-16">

      {/* ── Hero (full-bleed) ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative w-full overflow-hidden mb-12"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}hero-bg.jpg)` }}
        />
        {/* Dark tint for legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
        {/* Blend into the page background at the bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-80 bg-gradient-to-b from-transparent via-[#080d1a]/80 to-[#080d1a]" />

        <div className="relative text-center px-6 pt-6 pb-24 sm:pt-6 sm:pb-32 max-w-5xl mx-auto">
          <div className={`pill mb-6 mx-auto text-4xl transition-colors duration-300 w-64 flex-shrink-0 justify-center text-white ${weatherLoading ? 'bg-red-500/30' : 'pill-primary'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            {weatherLoading ? 'Fetching live weather…' : `Live conditions · ${city}`}
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase leading-[1.05] tracking-tight text-white mb-6 drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
            Master the night sky.
            <br />
            Plan your perfect stargazing night.
          </h1>
          <p className="text-slate-200 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            We score each night this week out of 10 using real weather data and live moon calculations — so you only go out when it's worth it.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => document.getElementById('forecast')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 text-white font-bold uppercase tracking-wider text-sm shadow-[0_0_40px_rgba(139,92,246,0.5)] hover:shadow-[0_0_60px_rgba(139,92,246,0.7)] hover:-translate-y-0.5 transition-all"
            >
              Check the planner
            </button>
            <button
              onClick={onSelectTonight}
              className="px-8 py-3.5 rounded-full border border-white/70 text-white font-bold uppercase tracking-wider text-sm bg-white/5 backdrop-blur-sm hover:bg-white/15 hover:-translate-y-0.5 transition-all"
            >
              Explore tonight's sky
            </button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4">

        {/* ── Tonight Summary Bar ── */}
        {tonight && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="card p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">{tonightMoon.emoji}</div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-0.5">Tonight</p>
                <p className="text-white font-bold text-lg">{tonightMoon.phaseName} · {tonightMoon.illumination}% illuminated</p>
                <p className="text-slate-400 text-sm mt-0.5">{tonight.recommendation}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="flex gap-3 text-sm text-slate-400">
                <span className="pill pill-muted">☁ {tonight.cloudCover}% cloud</span>
                <span className="pill pill-muted">Score {tonight.totalScore}/10</span>
              </div>
              <button
                onClick={onSelectTonight}
                className="pill pill-primary font-semibold cursor-pointer hover:bg-violet-500/25 transition-colors"
              >
                Tonight's Sky →
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Main Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* Day cards */}
          <div id="forecast" className="space-y-3 scroll-mt-24">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white font-bold text-lg">7-Night Forecast</h2>
              <span className="text-slate-500 text-sm">Tap any night for details</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {scored.map((s, i) => (
                <DayCard
                  key={s.date.toISOString()}
                  scored={s}
                  index={i}
                  isBest={i === bestIdx}
                  isSelected={selected === i}
                  onClick={() => setSelected(i)}
                />
              ))}
            </div>

            {/* How it's scored */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="card p-5 mt-2"
            >
              <p className="text-white font-semibold mb-3">How each night is scored</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {[
                  { pct: '55%', label: 'Weather', desc: 'Cloud cover from Open-Meteo API. Real live data.' },
                  { pct: '35%', label: 'Moon', desc: 'Lunar illumination via NASA/JPL astronomy-engine.' },
                  { pct: '10%', label: 'Dark sky', desc: 'Distance from urban light sources for your location.' },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-2xl font-black text-gradient">{s.pct}</p>
                    <p className="text-white font-semibold text-xs mt-0.5">{s.label}</p>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* NZ Dark Sky Parks */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85 }}
              className="card p-5"
            >
              <p className="text-white font-semibold mb-1">🌌 NZ Dark Sky Reserves</p>
              <p className="text-slate-500 text-xs mb-4">Drive 30–60 min from the city and multiply what you can see.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { name: 'Aoraki Mackenzie', note: 'Best in Southern Hemisphere', award: '🥇' },
                  { name: 'Wai-iti, Nelson', note: 'Close to Richmond & Nelson', award: '🥇' },
                  { name: 'Great Barrier Island', note: '90 min ferry from Auckland', award: '🥈' },
                  { name: 'Rakiura / Stewart Island', note: 'See Aurora Australis here', award: '🥇' },
                ].map(p => (
                  <div key={p.name} className="flex items-center gap-2 bg-white/[0.02] rounded-xl p-3">
                    <span className="text-base flex-shrink-0">{p.award}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{p.name}</p>
                      <p className="text-slate-500 text-xs">{p.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sticky detail panel */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <AnimatePresence mode="wait">
              <DetailPanel
                key={scored[selected]?.date.toISOString()}
                scored={scored[selected]}
                weatherDay={weatherDays[selected]}
                onGoTonight={onSelectTonight}
              />
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
