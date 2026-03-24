const OPEN_WEATHER_BASE = 'https://api.openweathermap.org/data/2.5/weather';

export async function analyzeFlyBoxImage(imageUri) {
  await new Promise((resolve) => setTimeout(resolve, 700));
  return {
    imageUri,
    detectedFlies: ['Caddis', 'Nymph'],
    confidence: 0.78,
  };
}

export async function fetchOpenWeatherSummary(lat, lon) {
  const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
  if (!apiKey) return 'Ingen API-nyckel (EXPO_PUBLIC_OPENWEATHER_API_KEY).';

  const url = `${OPEN_WEATHER_BASE}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) return `Väderfel: ${res.status}`;
  const data = await res.json();
  const temp = Math.round(data.main?.temp ?? 0);
  const main = data.weather?.[0]?.main ?? 'Unknown';
  return `${main}, ${temp}C`;
}
