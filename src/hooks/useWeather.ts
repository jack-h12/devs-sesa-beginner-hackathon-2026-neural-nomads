import { useState, useEffect } from 'react';

export interface HourlyWeather {
  time: string;
  cloudCover: number;
  temperature: number;
  windSpeed: number;
  precipitation: number;
  visibility: number;
}

export interface DailyWeatherData {
  date: Date;
  cloudCoverAvg: number; // evening average (7pm-midnight)
  cloudCoverMin: number;
  temperature: number;
  precipitation: number;
  windSpeed: number;
  visibility: number;
  hourly: HourlyWeather[];
}

export interface WeatherState {
  days: DailyWeatherData[];
  loading: boolean;
  error: string | null;
}

export function useWeather(lat: number, lon: number) {
  const [state, setState] = useState<WeatherState>({
    days: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!lat || !lon) return;

    const fetchWeather = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      try {
        console.log('[useWeather] Fetching for coords:', lat, lon);
        const url = new URL('https://api.open-meteo.com/v1/forecast');
        url.searchParams.set('latitude', lat.toFixed(4));
        url.searchParams.set('longitude', lon.toFixed(4));
        url.searchParams.set('current', 'temperature_2m');
        url.searchParams.set('hourly', 'cloud_cover,temperature_2m,wind_speed_10m,precipitation,visibility');
        url.searchParams.set('daily', 'cloud_cover_mean,temperature_2m_max,precipitation_sum,wind_speed_10m_max');
        url.searchParams.set('forecast_days', '7');
        url.searchParams.set('timezone', 'auto');
        url.searchParams.set('wind_speed_unit', 'kmh');

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
        const data = await res.json();
        const currentTemp = Math.round(data.current?.temperature_2m ?? data.daily?.temperature_2m_max?.[0] ?? 15);
        console.log('[useWeather] API success, current temp:', currentTemp);

        const days: DailyWeatherData[] = [];
        const totalDays = data.daily.time.length;

        for (let i = 0; i < totalDays; i++) {
          const date = new Date(data.daily.time[i] + 'T00:00:00');

          // Get hourly data for this day (indexes i*24 to i*24+24)
          const startIdx = i * 24;
          const endIdx = startIdx + 24;

          const hourly: HourlyWeather[] = [];
          let eveningCloudSum = 0;
          let eveningTempSum = 0;
          let eveningCount = 0;
          let minCloud = 100;

          for (let h = startIdx; h < endIdx && h < data.hourly.time.length; h++) {
            const hour = new Date(data.hourly.time[h]).getHours();
            const cc = data.hourly.cloud_cover[h] ?? 50;
            const temp = data.hourly.temperature_2m[h] ?? 15;
            const wind = data.hourly.wind_speed_10m[h] ?? 10;
            const precip = data.hourly.precipitation[h] ?? 0;
            const vis = (data.hourly.visibility[h] ?? 20000) / 1000;

            hourly.push({
              time: data.hourly.time[h],
              cloudCover: cc,
              temperature: temp,
              windSpeed: wind,
              precipitation: precip,
              visibility: vis,
            });

            // Evening hours 18-22 for stargazing conditions
            if (hour >= 18 && hour <= 22) {
              eveningCloudSum += cc;
              eveningTempSum += temp;
              eveningCount++;
            }
            if (cc < minCloud) minCloud = cc;
          }

          const cloudCoverAvg = eveningCount > 0 ? Math.round(eveningCloudSum / eveningCount) : (data.daily.cloud_cover_mean[i] ?? 50);
          const temperature = i === 0 ? currentTemp : Math.round(data.daily.temperature_2m_max[i] ?? 15);

          days.push({
            date,
            cloudCoverAvg,
            cloudCoverMin: minCloud,
            temperature,
            precipitation: data.daily.precipitation_sum[i] ?? 0,
            windSpeed: data.daily.wind_speed_10m_max[i] ?? 10,
            visibility: 20,
            hourly,
          });
        }

        setState({ days, loading: false, error: null });
      } catch (err) {
        console.error('Weather fetch error:', err);
        setState({ days: [], loading: false, error: String(err) });
      }
    };

    fetchWeather();
  }, [lat, lon]);

  return state;
}

