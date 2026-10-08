'use strict';
/* =========================================================
   Yanında — ortak veri katmanı
   Veriler tarayıcıda (localStorage) tutulur. Ebeveyn ekranı ile
   aile paneli aynı cihazda iki ayrı pencerede açıldığında
   BroadcastChannel ile anında eşitlenir (sunum/demo için).
   Gerçek ürün yol haritası: uçtan uca şifreli bulut eşitleme.
   ========================================================= */
const YKEY = 'yaninda_v1';

/* Türkiye'nin büyük şehirleri (deprem mesafesi hesabı için koordinatlar) */
const CITIES = {
  'Adana': [37.00, 35.32], 'Ankara': [39.93, 32.86], 'Antalya': [36.90, 30.70], 'Balıkesir': [39.65, 27.88],
  'Bursa': [40.19, 29.06], 'Denizli': [37.78, 29.09], 'Diyarbakır': [37.91, 40.24], 'Düzce': [40.84, 31.16],
  'Elazığ': [38.67, 39.22], 'Erzurum': [39.90, 41.27], 'Eskişehir': [39.78, 30.52], 'Gaziantep': [37.07, 37.38],
  'Hatay': [36.20, 36.16], 'İstanbul': [41.01, 28.98], 'İzmir': [38.42, 27.14], 'Kahramanmaraş': [37.58, 36.94],
  'Kayseri': [38.72, 35.49], 'Kocaeli': [40.77, 29.92], 'Konya': [37.87, 32.48], 'Malatya': [38.35, 38.31],
  'Manisa': [38.61, 27.43], 'Muğla': [37.22, 28.36], 'Sakarya': [40.78, 30.40], 'Samsun': [41.29, 36.33],
  'Trabzon': [41.00, 39.72], 'Van': [38.50, 43.38]
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad2 = n => String(n).padStart(2, '0');
/* Yerel tarih anahtarı (UTC değil: Türkiye'de gece 00-03 arası gün kaymasın) */
const todayKey = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const hm = t => new Date(t).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
const dayName = d => d.toLocaleDateString('tr-TR', { weekday: 'long' });

function defaultState() {
  return {
    parent: { name: 'Ayşe', title: 'Hanım', city: 'İstanbul' },
    family: [
      { id: 'f1', name: 'Elif', relation: 'Kızı' },
      { id: 'f2', name: 'Mert', relation: 'Oğlu' },
      { id: 'f3', name: 'Zeynep', relation: 'Torunu' }
    ],
    safeWord: 'çınar',
    checkinDeadline: '11:00',
    meds: [
      { id: 'm1', name: 'Tansiyon ilacı', time: '09:00' },
      { id: 'm2', name: 'D vitamini', time: '13:00' },
      { id: 'm3', name: 'Şeker ilacı', time: '21:00' }
    ],
    medLog: {},        // { '2026-10-06': { m1: zaman } }
    checkins: {},      // { '2026-10-06': zaman }
    calls: {},         // { '2026-10-06': { by: 'f1', at: zaman } }
    events: [],        // olay akışı
    quakeAsk: null,    // aileden gelen "iyi misin?" isteği
    seenQuakes: [],
    moods: {},         // { '2026-10-06': 'iyi' | 'idare' | 'kotu' }
    messages: [],      // aileden ebeveyne mesajlar
    prefs: { scale: 1, contrast: false }
  };
}

const Store = {
  state: null,
  channel: ('BroadcastChannel' in window) ? new BroadcastChannel('yaninda') : null,
  listeners: [],
  load() {
    try { this.state = JSON.parse(localStorage.getItem(YKEY)) || defaultState(); }
    catch (e) { this.state = defaultState(); }
    const d = defaultState();
    for (const k of Object.keys(d)) if (this.state[k] === undefined) this.state[k] = d[k];
    return this.state;
  },
  save(silent) {
    try { localStorage.setItem(YKEY, JSON.stringify(this.state)); } catch (e) { /* depolama kapalı */ }
    if (!silent && this.channel) this.channel.postMessage('update');
    this.emit();
  },
  update(fn) { fn(this.state); this.save(); },
  onChange(fn) { this.listeners.push(fn); },
  emit() { this.listeners.forEach(fn => { try { fn(this.state); } catch (e) { console.error(e); } }); },
  /* Olay kaydı: aile panelinin akışında görünür */
  log(type, text, level = 'info', extra = {}) {
    const ev = { id: uid(), t: Date.now(), type, text, level, ...extra };
    this.update(s => { s.events.unshift(ev); s.events = s.events.slice(0, 150); });
    return ev;
  },
  reset() { this.state = defaultState(); this.save(); },
  /* Sunum için gerçekçi örnek veriler */
  demo() {
    const s = defaultState();
    const now = Date.now(), H = 3600e3, D = 864e5;
    const at = (daysAgo, h, m = 0) => { const d = new Date(now - daysAgo * D); d.setHours(h, m, 0, 0); return d.getTime(); };
    const ev = (t, type, text, level) => ({ id: uid(), t, type, text, level });
    const moods = ['iyi', 'iyi', 'idare', 'iyi', 'iyi', 'kotu', 'iyi'];
    const events = [];
    /* Geçmiş 6 gün: gerçekçi bir hafta (bir gün "iyiyim" unutulmuş, bir ilaç atlanmış) */
    for (let i = 6; i >= 1; i--) {
      const k = todayKey(new Date(now - i * D));
      if (i !== 4) { s.checkins[k] = at(i, 8 + (i % 2), 10 + i * 7); s.moods[k] = moods[i]; }
      s.medLog[k] = {};
      s.meds.forEach((m, j) => { if (!(i === 2 && j === 2) && !(i === 4 && j === 0)) { const [h, mi] = m.time.split(':').map(Number); s.medLog[k][m.id] = at(i, h, mi + 5 + j * 3); } });
      if (i !== 3) { const who = s.family[Math.floor((now - i * D) / D) % s.family.length]; s.calls[k] = { by: who.id, at: at(i, 19, 20 + i) }; }
    }
    events.push(
      ev(at(5, 21, 40), 'mood', 'Ayşe Hanım bugün kendini "kötü" hissettiğini söyledi.', 'warn'),
      ev(at(4, 11, 0), 'checkin', "Ayşe Hanım 11:00'e kadar 'İyiyim' demedi. Mert aradı, her şey yolunda.", 'warn'),
      ev(at(3, 14, 12), 'scam', 'Şüpheli arama: "Kargonuz gümrükte, SMS ile gelen kodu söyleyin" (risk %78). Ayşe Hanım uyarıldı.', 'danger'),
      ev(at(1, 15, 30), 'quake', 'Deprem kontrolü: Ayşe Hanım "Güvendeyim" dedi (M4.3, 96 km).', 'ok'),
      ev(at(1, 20, 5), 'callreq', 'Ayşe Hanım "Beni arasınlar" dedi. Zeynep 6 dk içinde aradı.', 'warn')
    );
    /* Bugün */
    const t = todayKey();
    s.checkins[t] = now - 2.2 * H; s.moods[t] = 'iyi';
    s.medLog[t] = { m1: now - 2 * H };
    s.calls[t] = { by: 'f1', at: now - 1.1 * H };
    events.push(
      ev(now - 2.2 * H, 'checkin', 'Ayşe Hanım "İyiyim" dedi. Ruh hali: 😊 iyi.', 'ok'),
      ev(now - 2 * H, 'med', 'Tansiyon ilacı alındı (09:00 dozu).', 'ok'),
      ev(now - 1.1 * H, 'call', 'Elif annesini aradı (bugünün sırası).', 'ok'),
      ev(now - 0.4 * H, 'scam', 'Şüpheli arama engellendi: "Savcıyım, hesabınız terör soruşturmasında" (risk %100). Annen telefonu kapattı.', 'danger')
    );
    s.events = events.sort((x, y) => y.t - x.t);
    s.messages = [
      { id: uid(), t: now - 0.6 * H, from: 'f1', text: 'Anneciğim akşam 7 gibi uğrarım, bir şey lazım mı?', read: false, reply: null },
      { id: uid(), t: now - 26 * H, from: 'f3', text: 'Babaanneciğim hafta sonu geliyoruz 💛', read: true, reply: '❤️ Teşekkürler' }
    ];
    this.state = s;
    this.save();
  }
};

/* Başka pencereden (ebeveyn ↔ aile) gelen değişiklikleri al */
if (Store.channel) Store.channel.onmessage = () => { Store.load(); Store.emit(); };
window.addEventListener('storage', e => { if (e.key === YKEY) { Store.load(); Store.emit(); } });
Store.load();

/* ---------- Ortak hesaplar (ebeveyn + aile) ---------- */
const MOODS = { iyi: { em: '😊', tx: 'iyi' }, idare: { em: '😐', tx: 'idare eder' }, kotu: { em: '😔', tx: 'kötü' } };
const toMin = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
/* O güne kadar saati gelmiş ilaçlar (bugün için henüz saati gelmeyenler sayılmaz) */
function dueMeds(s, key) {
  if (key !== todayKey()) return s.meds;
  const n = new Date(), nm = n.getHours() * 60 + n.getMinutes();
  return s.meds.filter(m => toMin(m.time) <= nm);
}
/* Günlük iyi oluş puanı (0-100): açıklanabilir, 4 parçalı */
function wellbeing(s, key = todayKey()) {
  const due = dueMeds(s, key);
  const log = s.medLog[key] || {};
  const adh = due.length ? due.filter(m => log[m.id]).length / due.length : 1;
  const mood = s.moods[key];
  const danger = s.events.some(e => e.level === 'danger' && todayKey(new Date(e.t)) === key);
  return Math.round((s.checkins[key] ? 30 : 0) + adh * 30 + (mood === 'iyi' ? 25 : mood === 'idare' ? 15 : mood === 'kotu' ? 0 : 10) + (danger ? 0 : 15));
}
const ago = t => { const m = Math.round((Date.now() - t) / 60e3); return m < 1 ? 'az önce' : m < 60 ? `${m} dk önce` : m < 1440 ? `${Math.floor(m / 60)} sa önce` : `${Math.floor(m / 1440)} gün önce`; };
/* Demo sayfasında iframe içindeysek üst çubuğu gizle */
if (window.self !== window.top) document.documentElement.classList.add('embed');

/* ---------- Ortak arayüz yardımcıları ---------- */
function toast(text, kind = '') {
  let box = document.getElementById('toast');
  if (!box) { box = document.createElement('div'); box.id = 'toast'; document.body.appendChild(box); }
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.textContent = text;
  box.appendChild(t);
  setTimeout(() => t.remove(), 3600);
}
function modal(html) {
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(bg);
  bg.addEventListener('click', e => { if (e.target === bg || e.target.closest('[data-close]')) bg.remove(); });
  return bg;
}
/* Basit ses efekti (uyarılar için) */
function beep(kind = 'ok') {
  try {
    const ac = beep.ac || (beep.ac = new (window.AudioContext || window.webkitAudioContext)());
    const notes = kind === 'danger' ? [880, 660, 880, 660] : [660, 880];
    notes.forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * 0.16;
      o.frequency.value = f; g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.001, t + .15);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + .16);
    });
  } catch (e) { /* ses yok */ }
}
const LOGO = `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="#0f5257"/><path d="M12 22c0-4.5 3.6-8 8-8s8 3.5 8 8" fill="none" stroke="#f6c177" stroke-width="3" stroke-linecap="round"/><circle cx="15" cy="25" r="3.2" fill="#fff"/><circle cx="25" cy="25" r="3.2" fill="#fff"/><path d="M15 28.5c1.6 2.4 8.4 2.4 10 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`;
function topbar(active) {
  const links = [['index.html', 'Ürün'], ['demo.html', '▶ Canlı demo'], ['ebeveyn.html', 'Ebeveyn ekranı'], ['aile.html', 'Aile paneli'], ['klon.html', 'Klon (Rhem)']];
  return `<header class="topbar"><div class="topbar-in">
    <a class="logo" href="index.html">${LOGO}<span>Yanında</span></a>
    <nav class="nav" aria-label="Sayfalar">${links.map(([h, t]) => `<a href="${h}" class="${active === h ? 'active' : ''}">${t}</a>`).join('')}</nav>
  </div></header>`;
}
