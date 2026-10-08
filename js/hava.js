'use strict';
/* =========================================================
   Hava durumu + yaşlıya özel öneri
   Canlı veri: Open-Meteo (anahtarsız, tarayıcıdan erişilebilir)
   ========================================================= */
const WMO = [
  [[0], '☀️', 'Açık'], [[1, 2], '🌤️', 'Az bulutlu'], [[3], '☁️', 'Bulutlu'], [[45, 48], '🌫️', 'Sisli'],
  [[51, 53, 55, 56, 57], '🌦️', 'Çiseliyor'], [[61, 63, 65, 66, 67], '🌧️', 'Yağmurlu'], [[71, 73, 75, 77], '🌨️', 'Karlı'],
  [[80, 81, 82], '🌧️', 'Sağanak'], [[85, 86], '🌨️', 'Kar sağanağı'], [[95, 96, 99], '⛈️', 'Fırtınalı']
];
const wmo = code => { const f = WMO.find(([c]) => c.includes(code)); return f ? { em: f[1], tx: f[2] } : { em: '🌡️', tx: '' }; };
const weatherCache = {};
async function fetchWeather(city) {
  if (weatherCache[city]) return weatherCache[city];
  const [lat, lon] = CITIES[city];
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    '&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=auto&forecast_days=1';
  const r = await fetch(url);
  if (!r.ok) throw new Error('hava');
  const j = await r.json();
  const w = {
    temp: Math.round(j.current.temperature_2m), ...wmo(j.current.weather_code),
    max: Math.round(j.daily.temperature_2m_max[0]), min: Math.round(j.daily.temperature_2m_min[0]),
    rain: j.daily.precipitation_probability_max[0] ?? 0, uv: j.daily.uv_index_max[0] ?? 0
  };
  return (weatherCache[city] = w);
}
/* Yaşlılar için hava kaynaklı riskler: sıcak çarpması, buzlanma/düşme, kaygan zemin */
function weatherAdvice(w) {
  if (w.max >= 32) return 'Hava çok sıcak. Öğle saatlerinde dışarı çıkmayın, susamasanız da su için.';
  if (w.min <= 2) return 'Buzlanma olabilir. Kalın giyinin, kaygan zeminde dikkatli yürüyün.';
  if (w.rain >= 60) return 'Yağmur bekleniyor. Şemsiye alın, ıslak merdivenlerde dikkatli olun.';
  if (w.uv >= 7) return 'Güneş güçlü. Dışarı çıkarsanız şapka takın.';
  if (w.max <= 10) return 'Serin bir gün. Üşütmemek için bir hırka alın.';
  return 'Hava güzel. Kısa bir yürüyüş iyi gelir.';
}
