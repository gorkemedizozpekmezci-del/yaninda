'use strict';
/* =========================================================
   Aile paneli
   ========================================================= */
document.getElementById('top').innerHTML = topbar('aile.html');
const S = () => Store.state;
const P = () => `${S().parent.name} ${S().parent.title}`;
const $ = id => document.getElementById(id);
const ICONS = { checkin: '✅', med: '💊', callreq: '📞', call: '☎️', scam: '🛡️', quake: '🌍', help: '🆘', note: '📝', msg: '💌', mood: '😔' };
const isDad = () => S().parent.title === 'Bey' || S().parent.title === 'Amca';
const famName = id => S().family.find(f => f.id === id)?.name || 'Aile';
const scoreColor = n => n >= 70 ? 'var(--ok)' : n >= 45 ? 'var(--warn)' : 'var(--danger)';
const lastDays = n => Array.from({ length: n }, (_, i) => new Date(Date.now() - (n - 1 - i) * 864e5));

/* ---------- Başlık: ebeveyn, şehir, hava ---------- */
let weatherLine = '';
function header() {
  $('title').textContent = `${isDad() ? 'Babam' : 'Annem'} bugün nasıl?`;
  $('p-avatar').textContent = S().parent.name[0] || '?';
  $('p-meta').textContent = `${P()} · ${S().parent.city}${weatherLine ? ' · ' + weatherLine : ''}`;
}
async function loadWeather() {
  try { const w = await fetchWeather(S().parent.city); weatherLine = `${w.em} ${w.temp}° ${w.tx}`; }
  catch (e) { weatherLine = ''; }
  header();
}

/* ---------- Bugünkü durum özeti + iyi oluş halkası ---------- */
function statusCard() {
  const t = todayKey();
  const c = S().checkins[t];
  const deadline = new Date(); deadline.setHours(...S().checkinDeadline.split(':').map(Number), 0, 0);
  const late = !c && Date.now() > deadline.getTime();
  const danger = S().events.find(e => e.level === 'danger' && Date.now() - e.t < 6 * 3600e3);
  const taken = Object.keys(S().medLog[t] || {}).length;
  const mood = S().moods[t];
  let kind = 'ok', head = `${P()} bugün iyi`, sub = c ? `${hm(c)}'de "İyiyim" dedi${mood ? ` · ruh hali ${MOODS[mood].em} ${MOODS[mood].tx}` : ''}.` : '';
  if (!c) { kind = late ? 'warn' : 'ok'; head = late ? `${P()} henüz "iyiyim" demedi` : `${P()} henüz güne başlamadı`; sub = late ? `Son saat ${S().checkinDeadline} geçti. Bir arayın.` : `"İyiyim" için son saat: ${S().checkinDeadline}`; }
  if (mood === 'kotu') { kind = 'warn'; head = `${P()} bugün kendini iyi hissetmiyor`; sub = 'Bir telefon iyi gelebilir.'; }
  if (danger) { kind = 'danger'; head = 'Dikkat gerektiren bir durum var'; sub = danger.text; }
  const score = wellbeing(S(), t);
  const call = S().calls[t];
  $('status').className = `card status-card ${kind}`;
  $('status').innerHTML = `
    <div class="status-hero">
      <div class="ring lg" style="--p:${score};--c:${scoreColor(score)}"><b>${score}</b><small>iyi oluş</small></div>
      <div style="flex:1;min-width:220px">
        <span class="pill ${kind}">${kind === 'ok' ? '● Her şey yolunda' : kind === 'warn' ? '● Takip edin' : '● Acil'}</span>
        <h2 style="margin:8px 0 4px">${esc(head)}</h2><p class="muted" style="margin:0">${esc(sub)}</p>
        ${kind !== 'ok' ? `<p style="margin:12px 0 0"><a class="btn sm ${kind === 'danger' ? 'danger' : ''}" href="tel:">📞 Hemen ara</a></p>` : ''}
      </div>
      <dl class="kv">
        <dt>İlaçlar</dt><dd>${taken}/${S().meds.length} alındı</dd>
        <dt>Bugün arama</dt><dd>${call ? `✓ ${esc(famName(call.by))} ${hm(call.at)}` : 'Henüz yok'}</dd>
        <dt>Son hareket</dt><dd>${S().events[0] ? ago(S().events[0].t) : '—'}</dd>
      </dl>
    </div>`;
}

/* ---------- Haftalık özet kartları ---------- */
function kpis() {
  const days = lastDays(7).map(d => todayKey(d));
  const checkins = days.filter(k => S().checkins[k]).length;
  let due = 0, took = 0;
  days.forEach(k => { const log = S().medLog[k] || {}; dueMeds(S(), k).forEach(m => { due++; if (log[m.id]) took++; }); });
  const adh = due ? Math.round(took / due * 100) : 100;
  const scams = S().events.filter(e => e.type === 'scam' && Date.now() - e.t < 7 * 864e5).length;
  const calls = days.filter(k => S().calls[k]).length;
  const avg = Math.round(days.reduce((a, k) => a + wellbeing(S(), k), 0) / 7);
  const card = (ic, val, label, note, col) => `<div class="kpi"><span class="kpi-ic">${ic}</span><b style="color:${col || 'var(--ink)'}">${val}</b><span>${label}</span><small>${note}</small></div>`;
  $('kpis').innerHTML =
    card('💚', avg, 'Ortalama iyi oluş', 'son 7 gün, 100 üzerinden', scoreColor(avg)) +
    card('✅', `${checkins}/7`, '"İyiyim" günü', checkins === 7 ? 'her gün haber verdi' : `${7 - checkins} gün haber yok`, checkins >= 6 ? 'var(--ok)' : 'var(--warn)') +
    card('💊', `%${adh}`, 'İlaç uyumu', `${took}/${due} doz alındı`, adh >= 85 ? 'var(--ok)' : 'var(--warn)') +
    card('🛡️', scams, 'Durdurulan dolandırıcılık', 'son 7 gün', scams ? 'var(--danger)' : 'var(--ok)') +
    card('☎️', `${calls}/7`, 'Aile araması', 'kardeş sırasıyla', calls >= 6 ? 'var(--ok)' : 'var(--warn)');
}

/* ---------- Son 7 gün ---------- */
function week() {
  $('week').innerHTML = lastDays(7).map(d => {
    const k = todayKey(d), isToday = k === todayKey();
    const c = S().checkins[k], mood = S().moods[k], log = S().medLog[k] || {}, call = S().calls[k];
    const score = wellbeing(S(), k);
    const due = dueMeds(S(), k);
    const pips = S().meds.map(m => `<i class="${log[m.id] ? 'on' : due.includes(m) ? 'miss' : ''}" title="${esc(m.time)} ${esc(m.name)}"></i>`).join('');
    return `<div class="day ${isToday ? 'today' : ''}">
      <span class="d-name">${isToday ? 'Bugün' : d.toLocaleDateString('tr-TR', { weekday: 'short' })}</span>
      <span class="d-mood" title="${mood ? MOODS[mood].tx : 'bilinmiyor'}">${mood ? MOODS[mood].em : '·'}</span>
      <span class="d-time ${c ? '' : 'miss'}">${c ? hm(c) : 'yok'}</span>
      <span class="pips" title="İlaçlar">${pips}</span>
      <span class="d-call">${call ? '☎️ ' + esc(famName(call.by)) : '—'}</span>
      <span class="bar"><i style="height:${score}%;background:${scoreColor(score)}"></i></span>
      <b class="d-score">${score}</b>
    </div>`;
  }).join('');
}

/* ---------- Olay akışı (filtreli) ---------- */
const FILTERS = {
  all: () => true,
  danger: e => e.level === 'danger',
  safety: e => ['scam', 'quake', 'help'].includes(e.type),
  health: e => ['checkin', 'med', 'mood'].includes(e.type),
  family: e => ['call', 'callreq', 'msg'].includes(e.type)
};
let filter = 'all';
$('feed-filter').addEventListener('click', e => {
  const b = e.target.closest('[data-f]');
  if (!b) return;
  filter = b.dataset.f;
  $('feed-filter').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
  feed();
});
function feed() {
  const ev = S().events.filter(FILTERS[filter]);
  $('feed').innerHTML = ev.length ? ev.slice(0, 40).map(e => `
    <li class="${e.level === 'danger' ? 'danger' : e.level === 'warn' ? 'warn' : e.level === 'ok' ? 'ok' : ''}">
      <span class="ic">${ICONS[e.type] || '•'}</span>
      <div><b>${esc(e.text)}</b></div>
      <time>${todayKey(new Date(e.t)) === todayKey() ? hm(e.t) : new Date(e.t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' ' + hm(e.t)}</time>
    </li>`).join('') : `<li class="empty">${filter === 'all' ? 'Henüz bir olay yok. Ebeveyn ekranından "İyiyim" deyin ya da örnek veri yükleyin.' : 'Bu filtrede olay yok.'}</li>`;
}

/* ---------- Mesajlar ---------- */
function messages() {
  const sel = $('msg-from'), cur = sel.value;
  sel.innerHTML = S().family.map(f => `<option value="${f.id}">${esc(f.name)}</option>`).join('');
  if (cur && S().family.some(f => f.id === cur)) sel.value = cur;
  $('msg-list').innerHTML = S().messages.slice(0, 4).map(m => `<li>
    <span class="avatar sm">${esc(famName(m.from)[0])}</span>
    <div><b>${esc(famName(m.from))}</b> <span class="muted small">${ago(m.t)}</span><p>${esc(m.text)}</p>
    ${m.reply ? `<span class="pill ok">${esc(S().parent.name)}: ${esc(m.reply)}</span>` : `<span class="pill">${m.read ? '✓✓ Okundu' : '✓ İletildi, okunmadı'}</span>`}</div>
  </li>`).join('');
}
$('msg-quick').addEventListener('click', e => { if (e.target.matches('button')) { $('msg-text').value = e.target.textContent; $('msg-text').focus(); } });
$('msg-form').onsubmit = e => {
  e.preventDefault();
  const text = $('msg-text').value.trim();
  if (!text) return;
  const from = $('msg-from').value;
  Store.update(s => { s.messages.unshift({ id: uid(), t: Date.now(), from, text, read: false, reply: null }); s.messages = s.messages.slice(0, 30); });
  Store.log('msg', `${famName(from)} mesaj gönderdi: "${text}"`, 'info');
  $('msg-text').value = '';
  toast('Mesaj ebeveyn ekranına gönderildi 💌', 'ok');
};

/* ---------- Arama sırası ---------- */
function rota() {
  const fam = S().family;
  if (!fam.length) { $('rota').innerHTML = '<tr><td class="muted">Ayarlardan aile üyesi ekleyin.</td></tr>'; return; }
  let rows = '<tr><th>Gün</th><th>Arayacak</th><th></th></tr>';
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.now() + i * 864e5);
    const who = fam[Math.floor(d.getTime() / 864e5) % fam.length];
    const done = S().calls[todayKey(d)];
    rows += `<tr><td>${i === 0 ? '<b>Bugün</b>' : dayName(d)}</td><td><span class="avatar sm">${esc(who.name[0])}</span> ${esc(who.name)} <span class="muted small">${esc(who.relation || '')}</span></td>
      <td style="text-align:right">${i === 0 ? (done ? `<span class="pill ok">✓ ${esc(famName(done.by))} ${hm(done.at)}</span>` : `<button class="btn sm" data-called="${who.id}">Aradım</button>`) : ''}</td></tr>`;
  }
  $('rota').innerHTML = rows;
  const b = $('rota').querySelector('[data-called]');
  if (b) b.onclick = () => {
    const who = fam.find(f => f.id === b.dataset.called);
    Store.update(s => { s.calls[todayKey()] = { by: who.id, at: Date.now() }; });
    Store.log('call', `${who.name}, ${P()} ile konuştu (bugünün sırası).`, 'ok');
  };
}

/* ---------- İlaçlar ---------- */
function meds() {
  const log = S().medLog[todayKey()] || {};
  const now = new Date(); const nowMin = now.getHours() * 60 + now.getMinutes();
  $('meds').innerHTML = S().meds.map(m => {
    const late = !log[m.id] && nowMin > toMin(m.time) + 60;
    return `<div class="med-row">
      <span class="med-time">${esc(m.time)}</span><span style="flex:1">${esc(m.name)}</span>
      ${log[m.id] ? `<span class="pill ok">✓ ${hm(log[m.id])}</span>` : late ? '<span class="pill warn">Gecikti</span>' : '<span class="pill">Bekliyor</span>'}
    </div>`;
  }).join('') || '<p class="muted">İlaç eklenmedi.</p>';
}

/* ---------- Deprem: harita + tablo ---------- */
let quakes = [], map = null, mapLayer = null;
async function loadQuakes() {
  $('quake-note').textContent = `Canlı veri: USGS · Türkiye ve çevresi · son 7 gün · ${S().parent.city} merkezli mesafe`;
  try {
    const sims = quakes.filter(q => String(q.id).startsWith('sim-'));
    quakes = [...sims, ...await fetchQuakes(7, 2.5)];
    renderQuakes();
  } catch (e) { $('quakes').innerHTML = '<tr><td class="muted">Deprem verisi alınamadı (internet bağlantısını kontrol edin). Simülasyonu kullanabilirsiniz.</td></tr>'; renderMap(); }
}
function renderMap() {
  if (!window.L) { $('map').hidden = true; document.querySelector('.map-legend').hidden = true; return; }
  const home = CITIES[S().parent.city];
  if (!map) {
    map = L.map('map', { scrollWheelZoom: false });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap katkıcıları', maxZoom: 12 }).addTo(map);
    mapLayer = L.layerGroup().addTo(map);
    map.fitBounds([[35.8, 25.8], [42.2, 44.8]]);
  }
  mapLayer.clearLayers();
  L.circle(home, { radius: QUAKE_RULE.radiusKm * 1000, color: '#0f5257', weight: 1.5, dashArray: '6 6', fillColor: '#0f5257', fillOpacity: .06 }).addTo(mapLayer);
  quakes.forEach(q => {
    const big = q.mag >= QUAKE_RULE.minMag;
    L.circleMarker([q.lat, q.lon], { radius: Math.max(4, (q.mag - 1.5) * 3.2), color: big ? '#b42318' : '#b45309', weight: 1.5, fillColor: big ? '#b42318' : '#f59e0b', fillOpacity: .45 })
      .bindPopup(`<b>M${q.mag.toFixed(1)}</b> · ${esc(q.place)}<br>${esc(S().parent.city)}'a ${q.dist} km · ${q.depth} km derinlik<br>${new Date(q.time).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`)
      .addTo(mapLayer);
  });
  L.circleMarker(home, { radius: 9, color: '#fff', weight: 3, fillColor: '#0f5257', fillOpacity: 1 }).bindTooltip(`${P()} · ${S().parent.city}`, { direction: 'top' }).addTo(mapLayer);
}
function renderQuakes() {
  const rows = quakes.slice(0, 12).map((q, i) => `
    <tr class="quake-row ${q.dist <= QUAKE_RULE.radiusKm && q.mag >= QUAKE_RULE.minMag ? 'near' : ''}">
      <td><span class="mag ${q.mag >= 4 ? 'big' : ''}">${q.mag.toFixed(1)}</span></td><td>${esc(q.place)}</td><td>${q.dist} km</td><td>${q.depth} km</td>
      <td>${new Date(q.time).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
      <td style="text-align:right"><button class="btn ghost sm" data-ask="${i}">"İyi misin?" sor</button></td>
    </tr>`).join('');
  $('quakes').innerHTML = `<tr><th>Büyüklük</th><th>Yer</th><th>${esc(S().parent.city)}'a</th><th>Derinlik</th><th>Zaman</th><th></th></tr>` + (rows || '<tr><td colspan="6" class="muted">Son 7 günde kayıt yok.</td></tr>');
  $('quakes').querySelectorAll('[data-ask]').forEach(b => b.onclick = () => {
    startQuakeCheck(quakes[+b.dataset.ask], 'aile');
    toast(`${P()}'a "İyi misiniz?" soruldu`, 'ok');
  });
  renderMap();
}
$('quake-refresh').onclick = loadQuakes;
$('quake-sim').onclick = () => {
  const home = CITIES[S().parent.city];
  const q = { id: 'sim-' + Date.now(), mag: 5.4, place: `${S().parent.city} yakını (simülasyon)`, dist: 18, depth: 9, time: Date.now(), lat: home[0] + 0.12, lon: home[1] + 0.1 };
  quakes.unshift(q);
  renderQuakes();
  startQuakeCheck(q, 'simülasyon');
  toast('Simüle deprem: ebeveyn ekranında "İyi misiniz?" açıldı', 'ok');
};

/* ---------- Bildirimler: yeni ve önemli olaylar ---------- */
let lastSeen = S().events[0]?.id;
function notifyNew() {
  const ev = S().events;
  const idx = ev.findIndex(e => e.id === lastSeen);
  const fresh = idx === -1 ? ev.slice(0, 1) : ev.slice(0, idx);
  lastSeen = ev[0]?.id;
  fresh.forEach(e => {
    if (e.level === 'danger' || e.type === 'callreq' || (e.type === 'msg' && e.level !== 'info')) {
      beep(e.level === 'danger' ? 'danger' : 'ok');
      toast(e.text, e.level === 'danger' ? 'danger' : '');
      if ('Notification' in window && Notification.permission === 'granted') {
        try { new Notification('Yanında', { body: e.text }); } catch (err) { /* yok say */ }
      }
    }
  });
}
$('notify-btn').onclick = async () => {
  if (!('Notification' in window)) return toast('Bu tarayıcı bildirimleri desteklemiyor.');
  const p = await Notification.requestPermission();
  toast(p === 'granted' ? 'Bildirimler açık 🔔' : 'Bildirim izni verilmedi.');
};

/* ---------- Ayarlar ---------- */
function fillSettings() {
  $('s-city').innerHTML = Object.keys(CITIES).map(c => `<option ${c === S().parent.city ? 'selected' : ''}>${c}</option>`).join('');
  $('s-name').value = S().parent.name;
  $('s-title').value = S().parent.title;
  $('s-deadline').value = S().checkinDeadline;
  $('s-safe').value = S().safeWord;
  $('s-family').value = S().family.map(f => f.name).join(', ');
  $('s-meds').value = S().meds.map(m => `${m.time} ${m.name}`).join('\n');
}
$('settings').onsubmit = e => {
  e.preventDefault();
  const fam = $('s-family').value.split(',').map(x => x.trim()).filter(Boolean)
    .map((n, i) => ({ id: S().family[i]?.id || 'f' + Date.now() + i, name: n, relation: S().family[i]?.relation || '' }));
  const ms = $('s-meds').value.split('\n').map(l => l.trim()).filter(Boolean).map((l, i) => {
    const m = l.match(/^(\d{1,2}[:.]\d{2})\s+(.+)$/);
    return m ? { id: S().meds[i]?.id || 'm' + Date.now() + i, time: m[1].replace('.', ':').padStart(5, '0'), name: m[2] } : null;
  }).filter(Boolean);
  Store.update(s => {
    s.parent.name = $('s-name').value.trim() || s.parent.name;
    s.parent.title = $('s-title').value;
    s.parent.city = $('s-city').value;
    s.checkinDeadline = $('s-deadline').value || s.checkinDeadline;
    s.safeWord = $('s-safe').value.trim() || s.safeWord;
    if (fam.length) s.family = fam;
    if (ms.length) s.meds = ms;
  });
  toast('Ayarlar kaydedildi', 'ok');
};
$('reset-btn').onclick = () => { Store.reset(); fillSettings(); toast('Sıfırlandı'); };
$('demo-btn').onclick = () => { Store.demo(); fillSettings(); lastSeen = S().events[0]?.id; toast('Örnek veri yüklendi', 'ok'); };

/* Şehir değişince (bu pencereden ya da başka pencereden) deprem ve hava yeniden yüklenir */
let lastCity = S().parent.city;
function renderAll() {
  header(); statusCard(); kpis(); week(); feed(); messages(); rota(); meds(); notifyNew();
  if (S().parent.city !== lastCity) { lastCity = S().parent.city; fillSettings(); loadQuakes(); loadWeather(); }
  else if (quakes.length) renderQuakes();
}
Store.onChange(renderAll);
fillSettings();
renderAll();
loadQuakes();
loadWeather();
setInterval(() => { statusCard(); messages(); }, 60e3);
