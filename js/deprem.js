'use strict';
/* =========================================================
   Deprem modülü
   Canlı veri: USGS deprem servisi (Türkiye ve çevresi kutusu).
   Ebeveynin şehrine belirli bir mesafede, belirli büyüklüğün
   üzerinde deprem olursa "İyi misiniz?" kontrolü başlatılır.
   Not: AFAD / Kandilli servisleri tarayıcıdan doğrudan erişime
   (CORS) izin vermediği için yol haritasında sunucu üzerinden
   bağlanacaktır.
   ========================================================= */
const QUAKE_RULE = { minMag: 4.0, radiusKm: 200 };

function distanceKm([lat1, lon1], [lat2, lon2]) {
  const R = 6371, rad = x => x * Math.PI / 180;
  const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

/* Son N gündeki depremler (Türkiye kutusu), ebeveynin şehrine uzaklıkla birlikte */
async function fetchQuakes(days = 7, minMag = 2.5) {
  const start = new Date(Date.now() - days * 864e5).toISOString().slice(0, 19);
  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&orderby=time&limit=60&minmagnitude=${minMag}` +
    `&minlatitude=35.5&maxlatitude=42.5&minlongitude=25.5&maxlongitude=45&starttime=${start}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Deprem servisine ulaşılamadı');
  const data = await res.json();
  const home = CITIES[Store.state.parent.city] || CITIES['İstanbul'];
  return data.features.map(f => {
    const [lon, lat, depth] = f.geometry.coordinates;
    return {
      id: f.id, mag: f.properties.mag, place: trPlace(f.properties.place), time: f.properties.time,
      depth: Math.round(depth), lat, lon, dist: distanceKm(home, [lat, lon]), url: f.properties.url
    };
  });
}
/* "14 km ESE of Feke, Turkey" → "Feke yakını (14 km DGD)" */
function trPlace(p) {
  if (!p) return '—';
  const dirs = { N: 'K', S: 'G', E: 'D', W: 'B' };
  const m = p.match(/^(\d+)\s*km\s+([NSEW]+)\s+of\s+(.+)$/);
  if (!m) return p.replace(', Turkey', '').replace('Turkey', 'Türkiye');
  const yon = m[2].split('').map(c => dirs[c] || c).join('');
  return `${m[3].replace(', Turkey', '').replace(', Türkiye', '')} yakını (${m[1]} km ${yon})`;
}
/* Ebeveyni etkileyebilecek yeni bir deprem var mı? */
function relevantQuake(list) {
  return list.find(q => q.mag >= QUAKE_RULE.minMag && q.dist <= QUAKE_RULE.radiusKm &&
    Date.now() - q.time < 6 * 3600e3 && !Store.state.seenQuakes.includes(q.id));
}
/* Aile ya da sistem "iyi misin?" kontrolü başlatır */
function startQuakeCheck(q, by = 'sistem') {
  Store.update(s => {
    s.quakeAsk = { id: q.id, mag: q.mag, place: q.place, dist: q.dist, at: Date.now(), by };
    if (!s.seenQuakes.includes(q.id)) s.seenQuakes.push(q.id);
  });
  Store.log('quake', `M${q.mag.toFixed(1)} deprem: ${q.place} (${q.dist} km). ${Store.state.parent.name} ${Store.state.parent.title}'a "İyi misiniz?" soruldu.`, 'warn');
}
