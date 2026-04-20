import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import CitySearch from './CitySearch';

type View = 'planner' | 'tonight' | 'skymap' | 'explorer';

interface HeaderProps {
  view: View;
  onViewChange: (view: View) => void;
  city: string;
  country: string;
  onCitySelect: (lat: number, lon: number, city: string, country: string) => void;
}

const VIEWS: { id: View; label: string; short: string; emoji: string; accent: 'primary' | 'secondary' }[] = [
  { id: 'planner',  label: 'Best Night',    short: 'Best',     emoji: '✦', accent: 'primary' },
  { id: 'tonight',  label: "Tonight's Sky", short: 'Tonight',  emoji: '🌙', accent: 'secondary' },
  { id: 'skymap',   label: 'Sky Map',       short: 'Sky Map',  emoji: '🗺', accent: 'primary' },
  { id: 'explorer', label: 'Explorer',      short: 'Explorer', emoji: '🚀', accent: 'primary' },
];

function viewClasses(active: boolean, accent: 'primary' | 'secondary') {
  if (!active) return 'text-muted-text hover:text-light-text';
  return accent === 'secondary'
    ? 'bg-gradient-to-r from-secondary-dark to-secondary text-dark-bg shadow-md'
    : 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md';
}

export default function Header({ view, onViewChange, city, country: _country, onCitySelect }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu whenever the viewport widens past `sm`
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 640) setMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleSelect = (id: View) => { onViewChange(id); setMenuOpen(false); };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 px-2 sm:px-3 py-2 sm:py-3"
    >
      <div className="max-w-7xl mx-auto flex lg:grid lg:grid-cols-[288px_1fr_288px] items-center glass rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 gap-2 sm:gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          <div className="relative">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-base sm:text-lg shadow-lg">
              🔭
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-secondary border border-dark-bg animate-pulse" />
          </div>
          <div className="hidden md:block">
            <div className="text-base font-black text-gradient leading-tight">StarGaze</div>
            <div className="text-[10px] text-muted-text leading-none">Your Personal Sky Guide</div>
          </div>
        </div>

        {/* Mobile: city in the middle. Desktop: tab strip in the middle. */}
        <div className="flex justify-center flex-1 min-w-0 lg:flex-initial">
          {/* Mobile city */}
          <div className="sm:hidden w-full flex justify-center">
            <CitySearch onSelectCity={onCitySelect} currentCity={city} />
          </div>
          {/* Desktop tabs */}
          <div className="hidden sm:flex items-center bg-white/5 rounded-xl p-1 border border-white/8 overflow-x-auto max-w-full no-scrollbar">
            {VIEWS.map(v => (
              <button
                key={v.id}
                onClick={() => onViewChange(v.id)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 whitespace-nowrap flex-shrink-0 ${viewClasses(view === v.id, v.accent)}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: hamburger on mobile, city search on desktop */}
        <div className="flex justify-end lg:w-72 flex-shrink-0">
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl glass border border-white/10 hover:border-primary/40 transition-colors"
          >
            <span className="relative w-4 h-3 flex flex-col justify-between">
              <span className={`block h-0.5 w-full bg-light-text rounded-full transition-transform origin-center ${menuOpen ? 'translate-y-[5px] rotate-45' : ''}`} />
              <span className={`block h-0.5 w-full bg-light-text rounded-full transition-opacity ${menuOpen ? 'opacity-0' : 'opacity-100'}`} />
              <span className={`block h-0.5 w-full bg-light-text rounded-full transition-transform origin-center ${menuOpen ? '-translate-y-[5px] -rotate-45' : ''}`} />
            </span>
          </button>
          <div className="hidden sm:flex">
            <CitySearch onSelectCity={onCitySelect} currentCity={city} />
          </div>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="sm:hidden fixed inset-0 z-40 bg-black/40"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="sm:hidden absolute left-2 right-2 mt-2 z-50 glass rounded-2xl border border-white/10 shadow-2xl p-2"
            >
              <p className="px-3 pt-1 pb-2 text-[10px] uppercase tracking-widest text-muted-text">Views</p>
              <div className="flex flex-col gap-1">
                {VIEWS.map(v => {
                  const active = view === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleSelect(v.id)}
                      className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        active
                          ? v.accent === 'secondary'
                            ? 'bg-gradient-to-r from-secondary-dark/80 to-secondary/80 text-dark-bg'
                            : 'bg-gradient-to-r from-primary to-primary-dark text-white'
                          : 'text-light-text hover:bg-white/5'
                      }`}
                    >
                      <span className="text-base w-5 text-center">{v.emoji}</span>
                      <span className="flex-1">{v.label}</span>
                      {active && <span className="text-xs">●</span>}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
