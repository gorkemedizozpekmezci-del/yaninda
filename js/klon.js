'use strict';
/* =========================================================
   Rhem Labs klonu: ev sensörü verisi + anormallik kuralları
   Bir gün (24 saat) 60 saniyede simüle edilir. Her "dakika"
   bir sensör okuması üretir; kurallar akıştan uyarı çıkarır.
   ========================================================= */
document.getElementById('top').innerHTML = topbar('klon.html');
const $ = id => document.getElementById(id);
const ROOMS = [
  { id: 'bedroom', name: 'Bedroom', icon: '🛏️' },
  { id: 'bathroom', name: 'Bathroom', icon: '🚿' },
  { id: 'kitchen', name: 'Kitchen', icon: '🍳' },
  { id: 'living', name: 'Living room', icon: '🛋️' },
  { id: 'door', name: 'Front door', icon: '🚪' }
];
$('hours').innerHTML = Array.from({ length: 24 }, (_, h) => `<span>${h % 3 === 0 ? h : ''}</span>`).join('');

/* Senaryoya göre bir günlük "nerede?" planı (dakika → oda) */
function dayPlan(scenario) {
  const plan = [];
  const at = (h, m = 0) => h * 60 + m;
  const set = (from, to, room) => { for (let i = from; i < to; i++) plan[i] = room; };
  set(0, at(7), 'bedroom');
  set(at(7), at(7, 20), 'bathroom');
  set(at(7, 20), at(8, 10), scenario === 'nobreakfast' ? 'bedroom' : 'kitchen');
  set(at(8, 10), at(11, 30), 'living');
  set(at(11, 30), at(12), 'door');                      // markete çıkış
  set(at(12), at(12, 30), 'kitchen');
  set(at(12, 30), at(15), 'living');
  set(at(15), at(15, 15), 'bathroom');
  set(at(15, 15), at(18, 30), 'living');
  set(at(18, 30), at(19, 15), 'kitchen');
  set(at(19, 15), at(22), 'living');
  set(at(22), at(22, 15), 'bathroom');
  set(at(22, 15), at(24), 'bedroom');
  if (scenario === 'nobreakfast') set(at(8, 10), at(11, 30), 'bedroom');
  if (scenario === 'fall') set(at(15), at(16, 10), 'bathroom');      // 70 dk banyoda hareketsiz
  if (scenario === 'wander') { set(at(2, 40), at(3, 5), 'door'); }
  return plan;
}

let timer = null;
function simulate() {
  if (timer) { clearInterval(timer); timer = null; $('play').textContent = '▶ Simulate a day (60 s)'; return; }
  const scenario = $('scenario').value;
  const plan = dayPlan(scenario);
  const hourly = Array(24).fill(0);
  const alerts = [];
  const seen = new Set();
  let minute = 0, bathStart = null, kitchenBeforeNoon = false, doorOpens = 0, lastRoom = null;
  $('alerts').innerHTML = '';
  $('play').textContent = '■ Stop';
  const add = (lvl, icon, text, m) => {
    alerts.unshift({ lvl, icon, text, m });
    $('alerts').innerHTML = alerts.map(a => `<li class="${a.lvl}"><span class="ic">${a.icon}</span><div><b>${a.text}</b></div><time>${fmt(a.m)}</time></li>`).join('');
    if (lvl !== 'ok') beep(lvl === 'danger' ? 'danger' : 'ok');
  };
  const fmt = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  timer = setInterval(() => {
    for (let step = 0; step < 24 && minute < 1440; step++, minute++) {   // 24 dk / 1 sn ≈ 60 sn'de 1 gün
      const room = plan[minute];
      /* Odaya göre hareket yoğunluğu: mutfakta iş yapmak, salonda oturmaktan daha hareketlidir */
      const INTENSITY = { kitchen: 1, door: 1, bathroom: 0.7, living: 0.35, bedroom: minute > 420 && minute < 1335 ? 0.15 : 0 };
      if (!(scenario === 'fall' && room === 'bathroom' && bathStart !== null && minute - bathStart > 10))
        hourly[Math.floor(minute / 60)] += INTENSITY[room] * (0.7 + Math.random() * 0.6);
      if (room === 'door' && lastRoom !== 'door') doorOpens++;
      if (room === 'kitchen' && minute < 660) kitchenBeforeNoon = true;
      if (room === 'bathroom') { if (bathStart === null) bathStart = minute; } else bathStart = null;
      /* --- Anormallik kuralları --- */
      if (room === 'bathroom' && bathStart !== null && minute - bathStart === 45 && !seen.has('fall')) {
        seen.add('fall'); add('danger', '🚿', 'No movement after 45 min in the bathroom. Possible fall. Family notified.', minute);
      }
      if (minute === 600 && !kitchenBeforeNoon && !seen.has('bf')) {
        seen.add('bf'); add('warn', '🍳', 'No kitchen activity by 10:00. Breakfast may have been skipped.', minute);
      }
      if (room === 'door' && (minute < 300 || minute > 1380) && !seen.has('night')) {
        seen.add('night'); add('danger', '🚪', 'Front door opened at night. Possible wandering. Family notified.', minute);
      }
      if (minute === 420 && !seen.has('wake')) { seen.add('wake'); add('ok', '🛏️', 'Woke up at a normal time (07:00).', minute); }
      if (minute === 1439) add('ok', '📊', `Day complete. ${doorOpens} door openings, ${Math.round(hourly.reduce((a, b) => a + b, 0))} active minutes.`, minute);
      lastRoom = room;
    }
    const cur = plan[Math.min(minute, 1439)];
    $('clock').textContent = fmt(Math.min(minute, 1439));
    $('rooms').innerHTML = ROOMS.map(r => `<div class="room ${r.id === cur ? 'active' : ''}"><b>${r.icon} ${r.name}</b><small>${r.id === cur ? 'motion detected' : 'idle'}</small></div>`).join('');
    const max = Math.max(...hourly, 1);
    $('timeline').innerHTML = hourly.map((v, h) => `<i style="height:${Math.max(2, v / max * 100)}%" class="${h === Math.floor(minute / 60) ? 'now' : ''}" title="${h}:00 · ${Math.round(v)} active min"></i>`).join('');
    $('summary').innerHTML = `<dt>Active minutes</dt><dd>${Math.round(hourly.reduce((a, b) => a + b, 0))}</dd><dt>Door openings</dt><dd>${doorOpens}</dd><dt>Breakfast</dt><dd>${kitchenBeforeNoon ? '✓ detected' : minute < 600 ? 'pending' : '✗ not detected'}</dd><dt>Alerts</dt><dd>${alerts.filter(a => a.lvl !== 'ok').length}</dd>`;
    if (minute >= 1440) { clearInterval(timer); timer = null; $('play').textContent = '▶ Simulate again'; }
  }, 1000);
}
$('play').addEventListener('click', simulate);
$('rooms').innerHTML = ROOMS.map(r => `<div class="room"><b>${r.icon} ${r.name}</b><small>idle</small></div>`).join('');
$('timeline').innerHTML = Array(24).fill('<i></i>').join('');
