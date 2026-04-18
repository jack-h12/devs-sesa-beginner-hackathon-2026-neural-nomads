import { motion } from 'framer-motion';
import CitySearch from './CitySearch';

interface HeaderProps {
  view: 'planner' | 'tonight' | 'skymap';
  onViewChange: (view: 'planner' | 'tonight' | 'skymap') => void;
  city: string;
  country: string;
  onCitySelect: (lat: number, lon: number, city: string, country: string) => void;
}

export default function Header({ view, onViewChange, city, country: _country, onCitySelect }: HeaderProps) {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 px-3 py-3"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-[288px_1fr_288px] items-center glass rounded-2xl px-4 py-2.5 gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg shadow-lg">
              🔭
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-secondary border border-dark-bg animate-pulse" />
          </div>
          <div className="hidden sm:block">
            <div className="text-base font-black text-gradient leading-tight">StarGaze</div>
            <div className="text-[10px] text-muted-text leading-none">Your Personal Sky Guide</div>
          </div>
        </div>

        {/* View Toggle — centre */}
        <div className="flex justify-center">
        <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/8">
          <button
            onClick={() => onViewChange('planner')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              view === 'planner'
                ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md'
                : 'text-muted-text hover:text-light-text'
            }`}
          >
            <span className="hidden sm:inline">📅 </span>Best Night
          </button>
          <button
            onClick={() => onViewChange('tonight')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              view === 'tonight'
                ? 'bg-gradient-to-r from-secondary-dark to-secondary text-dark-bg shadow-md'
                : 'text-muted-text hover:text-light-text'
            }`}
          >
            <span className="hidden sm:inline">🌙 </span>Tonight's Sky
          </button>
          <button
            onClick={() => onViewChange('skymap')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              view === 'skymap'
                ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md'
                : 'text-muted-text hover:text-light-text'
            }`}
          >
            <span className="hidden sm:inline">🚀 </span>Sky Map
          </button>
        </div>
        </div>

        {/* City search — right */}
        <div className="flex justify-end w-72">
          <CitySearch onSelectCity={onCitySelect} currentCity={city} />
        </div>
      </div>
    </motion.header>
  );
}
