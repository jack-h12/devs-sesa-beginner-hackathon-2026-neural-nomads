import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import StarField from './components/StarField';
import Header from './components/Header';
import WeekPlanner from './components/WeekPlanner';
import TonightView from './components/TonightView';
import SkyMapView from './components/SkyMapView';
import SpaceExplorerView from './components/SpaceExplorerView';
import LoadingScreen from './components/LoadingScreen';
import { useLocation } from './hooks/useLocation';
import { useWeather } from './hooks/useWeather';
import { useISS } from './hooks/useISS';

type View = 'planner' | 'tonight' | 'skymap' | 'explorer';

interface OverrideLocation {
  lat: number;
  lon: number;
  city: string;
  country: string;
}

export default function App() {
  const [view, setView] = useState<View>('planner');
  const [appReady, setAppReady] = useState(false);
  const [override, setOverride] = useState<OverrideLocation | null>(null);

  const deviceLocation = useLocation();

  // Merge device location with any manual override
  const activeLocation = override ?? {
    lat: deviceLocation.lat,
    lon: deviceLocation.lon,
    city: deviceLocation.city,
    country: deviceLocation.country,
  };

  const weather = useWeather(activeLocation.lat, activeLocation.lon);
  const iss = useISS(activeLocation.lat, activeLocation.lon);

  useEffect(() => {
    const timer = setTimeout(() => setAppReady(true), 1600);
    return () => clearTimeout(timer);
  }, []);

  const handleCitySelect = (lat: number, lon: number, city: string, country: string) => {
    setOverride({ lat, lon, city, country });
  };

  return (
    <div className="relative min-h-screen font-outfit">
      <StarField />

      <AnimatePresence>
        {!appReady && <LoadingScreen />}
      </AnimatePresence>

      {appReady && (
        <div className="relative z-10">
          <Header
            view={view}
            onViewChange={setView}
            city={activeLocation.city}
            country={activeLocation.country}
            onCitySelect={handleCitySelect}
          />

          <AnimatePresence mode="wait">
            {view === 'planner' ? (
              <motion.div
                key="planner"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.35 }}
              >
                <WeekPlanner
                  weatherDays={weather.days}
                  userLat={activeLocation.lat}
                  city={activeLocation.city}
                  onSelectTonight={() => setView('tonight')}
                  weatherLoading={weather.loading}
                />
              </motion.div>
            ) : view === 'tonight' ? (
              <motion.div
                key="tonight"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
              >
                <TonightView
                  userLat={activeLocation.lat}
                  userLon={activeLocation.lon}
                  city={activeLocation.city}
                  iss={iss}
                />
              </motion.div>
            ) : view === 'skymap' ? (
              <motion.div
                key="skymap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <SkyMapView userLat={activeLocation.lat} userLon={activeLocation.lon} />
              </motion.div>
            ) : (
              <motion.div
                key="explorer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <SpaceExplorerView />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
