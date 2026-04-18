import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CityResult {
  name: string;
  country: string;
  lat: number;
  lon: number;
  displayName: string;
}

interface Props {
  onSelectCity: (lat: number, lon: number, city: string, country: string) => void;
  currentCity: string;
}

const POPULAR_CITIES: CityResult[] = [
  { name: 'Auckland', country: 'New Zealand', lat: -36.8485, lon: 174.7633, displayName: '🇳🇿 Auckland' },
  { name: 'Christchurch', country: 'New Zealand', lat: -43.5321, lon: 172.6362, displayName: '🇳🇿 Christchurch' },
  { name: 'Wellington', country: 'New Zealand', lat: -41.2865, lon: 174.7762, displayName: '🇳🇿 Wellington' },
  { name: 'Queenstown', country: 'New Zealand', lat: -45.0312, lon: 168.6626, displayName: '🇳🇿 Queenstown' },
  { name: 'Tekapo', country: 'New Zealand', lat: -44.0059, lon: 170.4771, displayName: '🇳🇿 Lake Tekapo ⭐ Dark Sky' },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093, displayName: '🇦🇺 Sydney' },
  { name: 'Melbourne', country: 'Australia', lat: -37.8136, lon: 144.9631, displayName: '🇦🇺 Melbourne' },
  { name: 'London', country: 'UK', lat: 51.5074, lon: -0.1278, displayName: '🇬🇧 London' },
  { name: 'New York', country: 'USA', lat: 40.7128, lon: -74.0060, displayName: '🇺🇸 New York' },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503, displayName: '🇯🇵 Tokyo' },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198, displayName: '🇸🇬 Singapore' },
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lon: 55.2708, displayName: '🇦🇪 Dubai' },
  { name: 'Los Angeles', country: 'USA', lat: 34.0522, lon: -118.2437, displayName: '🇺🇸 Los Angeles' },
  { name: 'Reykjavik', country: 'Iceland', lat: 64.1355, lon: -21.8954, displayName: '🇮🇸 Reykjavik 🌌' },
  { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lon: 18.4241, displayName: '🇿🇦 Cape Town' },
  { name: 'Mumbai', country: 'India', lat: 19.0760, lon: 72.8777, displayName: '🇮🇳 Mumbai' },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lon: -79.3832, displayName: '🇨🇦 Toronto' },
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522, displayName: '🇫🇷 Paris' },
];

export default function CitySearch({ onSelectCity, currentCity }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search via Nominatim when query length >= 3
  useEffect(() => {
    if (query.length < 2) {
      setResults(POPULAR_CITIES.filter(c =>
        query.length === 0 || c.name.toLowerCase().includes(query.toLowerCase())
      ));
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&featuretype=city&accept-language=en`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        const mapped: CityResult[] = data.map((d: any) => {
          const name = d.name || d.display_name.split(',')[0];
          const country = d.address?.country || d.display_name.split(',').slice(-1)[0].trim();
          return {
            name,
            country,
            lat: parseFloat(d.lat),
            lon: parseFloat(d.lon),
            displayName: country ? `${name}, ${country}` : name,
          };
        });
        setResults(mapped.length > 0 ? mapped : POPULAR_CITIES.filter(c =>
          c.name.toLowerCase().includes(query.toLowerCase())
        ));
      } catch {
        setResults(POPULAR_CITIES.filter(c => c.name.toLowerCase().includes(query.toLowerCase())));
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [query]);

  const handleSelect = (city: CityResult) => {
    onSelectCity(city.lat, city.lon, city.name, city.country);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 glass px-3 py-1.5 rounded-xl text-sm border border-white/10 hover:border-primary/40 transition-all"
      >
        <span className="text-secondary">📍</span>
        <span className="text-light-text font-medium max-w-[120px] truncate">{currentCity}</span>
        <span className="text-muted-text text-xs">▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full right-0 mt-5 w-72 bg-[#0f1628] border border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Search input */}
              <div className="p-3 border-b border-white/8">
                <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                  <span className="text-muted-text">🔍</span>
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search any city worldwide..."
                    className="bg-transparent text-sm text-light-text placeholder-muted-text outline-none flex-1"
                  />
                  {loading && <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />}
                </div>
              </div>

              {/* Results */}
              <div className="max-h-72 overflow-y-auto py-1">
                {query.length === 0 && (
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-text uppercase tracking-wider">
                    Popular Cities
                  </div>
                )}
                {results.slice(0, 8).map((city, i) => (
                  <button
                    key={`${city.lat}-${city.lon}-${i}`}
                    onClick={() => handleSelect(city)}
                    className="w-full text-left px-3 py-2.5 hover:bg-white/8 transition-colors flex items-center gap-2"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-light-text">{city.displayName || city.name}</div>
                      {city.displayName && !city.displayName.includes(',') && (
                        <div className="text-xs text-muted-text">{city.country}</div>
                      )}
                    </div>
                  </button>
                ))}
                {results.length === 0 && !loading && (
                  <div className="text-center text-muted-text text-sm py-4">No cities found</div>
                )}
              </div>

              {/* Use my location */}
              <div className="border-t border-white/8 p-2">
                <button
                  onClick={() => {
                    navigator.geolocation?.getCurrentPosition(async pos => {
                      const { latitude, longitude } = pos.coords;
                      try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                        const d = await res.json();
                        const name = d.address?.city || d.address?.town || d.address?.village || 'Your Location';
                        onSelectCity(latitude, longitude, name, d.address?.country || '');
                      } catch {
                        onSelectCity(latitude, longitude, 'Your Location', '');
                      }
                      setOpen(false);
                    });
                  }}
                  className="w-full text-center text-xs text-secondary hover:text-secondary/80 py-1.5 rounded-xl hover:bg-secondary/10 transition-all"
                >
                  📍 Use my current location
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
