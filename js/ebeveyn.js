'use strict';
/* =========================================================
   Ebeveyn (yaşlı kullanıcı) ekranı
   ========================================================= */
document.getElementById('top').innerHTML = topbar('ebeveyn.html');
const S = () => Store.state;
const P = () => `${S().parent.name} ${S().parent.title}`;
const $ = id => document.getElementById(id);
let quakeModal = null;   // açık deprem sorusu (refresh ilk çağrıdan önce tanımlı olmalı)

/* ---------- Saat ve selamlama ---------- */
function tick() {
  const d = new Date(), h = d.getHours();
  $('clock').textContent = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const g = h < 6 ? 'İyi geceler' : h < 12 ? 'Günaydın' : h < 18 ? 'İyi günler' : 'İyi akşamlar';
  $('greet').textContent = `${g}, ${P()}`;
  $('date').textContent = d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
}
tick(); setInterval(tick, 15000);

/* ---------- Bugün kim arayacak? (kardeşler arasında sıra) ---------- */
function todaysCaller() {
  const fam = S().family;
  const day = Math.floor(Date.now() / 864e5);
  return fam[day % fam.length];
}
function refresh() {
  const t = todayKey();
  const c = S().checkins[t];
  $('checkin-sub').textContent = c ? `Bugün ${hm(c)}'de bildirdiniz` : 'Ailenize haber verin';
  const taken = Object.keys(S().medLog[t] || {}).length;
  $('med-sub').textContent = `${taken}/${S().meds.length} ilaç alındı`;
  const caller = todaysCaller();
  const call = S().calls[t];
  $('call-sub').textContent = call ? `${S().family.find(f => f.id === call.by)?.name || 'Aileniz'} aradı ✓` : `Bugün arayacak: ${caller ? caller.name : '—'}`;
  renderToday();
  renderMessages();
  applyPrefs();
  showQuakeAsk();
}

/* ---------- Bugün şeridi: 3 hedef + iyi oluş halkası ---------- */
function renderToday() {
  const t = todayKey();
  const c = S().checkins[t], mood = S().moods[t];
  const taken = Object.keys(S().medLog[t] || {}).length, total = S().meds.length;
  const call = S().calls[t];
  const score = wellbeing(S(), t);
  const col = score >= 70 ? 'var(--ok)' : score >= 45 ? 'var(--warn)' : 'var(--danger)';
  $('today').innerHTML = `
    <div class="ring" style="--p:${score};--c:${col}" title="Bugünkü iyi oluş puanı: ${score}"><b>${mood ? MOODS[mood].em : score}</b></div>
    <div class="chips">
      <span class="chip ${c ? 'done' : ''}">${c ? '✓' : '○'} İyiyim</span>
      <span class="chip ${taken === total && total ? 'done' : ''}">💊 ${taken}/${total} ilaç</span>
      <span class="chip ${call ? 'done' : ''}">${call ? '✓' : '○'} Aile aradı</span>
    </div>`;
}

/* ---------- Aileden mesajlar ---------- */
const spoken = new Set();
const famName = id => S().family.find(f => f.id === id)?.name || 'Aileniz';
function renderMessages() {
  const unread = S().messages.filter(m => !m.read);
  if (!unread.length) { $('msg-box').innerHTML = ''; return; }
  const m = unread[0];
  const from = famName(m.from);
  $('msg-box').innerHTML = `
    <div class="msg-card">
      <div class="msg-head"><span class="avatar">${esc(from[0])}</span><div style="flex:1;min-width:0"><b>💌 ${esc(from)} mesaj gönderdi</b><small>${ago(m.t)}${unread.length > 1 ? ` · ${unread.length - 1} mesaj daha` : ''}</small></div>
        <button class="btn ghost sm" data-msg="listen" aria-label="Mesajı sesli dinle">🔊 Dinle</button></div>
      <p class="msg-text">${esc(m.text)}</p>
      <div class="msg-actions">
        <button class="btn ok" data-msg="❤️ Teşekkürler">❤️ Teşekkürler</button>
        <button class="btn" data-msg="📞 Beni ara">📞 Beni ara</button>
        <button class="btn ghost" data-msg="👍 Tamam">👍 Tamam</button>
      </div>
    </div>`;
  if (!spoken.has(m.id)) { spoken.add(m.id); beep('ok'); }
  $('msg-box').querySelectorAll('[data-msg]').forEach(b => b.onclick = () => {
    if (b.dataset.msg === 'listen') return Voice.speak(`${from} diyor ki: ${m.text}`);
    replyMessage(m, b.dataset.msg);
  });
}
function replyMessage(m, reply) {
  const from = famName(m.from);
  const wantsCall = reply.includes('ara');
  Store.update(s => { const x = s.messages.find(y => y.id === m.id); if (x) { x.read = true; x.reply = reply; } });
  Store.log('msg', `${P()}, ${from} adlı kişinin mesajına cevap verdi: ${reply}`, wantsCall ? 'warn' : 'ok');
  Voice.speak(wantsCall ? `Tamam, ${from} sizi arayacak.` : 'Cevabınızı ilettim.');
  toast(`Cevap gönderildi: ${reply}`, 'ok');
}
function readLatestMessage() {
  const m = S().messages.find(x => !x.read) || S().messages[0];
  if (!m) return Voice.speak('Yeni mesajınız yok.');
  Voice.speak(`${famName(m.from)} diyor ki: ${m.text}`);
}

/* ---------- Yazı boyutu ve yüksek kontrast ---------- */
function applyPrefs() {
  const p = S().prefs || { scale: 1, contrast: false };
  document.documentElement.style.setProperty('--scale', p.scale);
  document.body.classList.toggle('hc', !!p.contrast);
  $('hc').setAttribute('aria-checked', String(!!p.contrast));
  document.querySelectorAll('[data-scale]').forEach(b => b.classList.toggle('on', +b.dataset.scale === +p.scale));
}
document.querySelectorAll('[data-scale]').forEach(b => b.addEventListener('click', () => Store.update(s => { s.prefs.scale = +b.dataset.scale; })));
$('hc').addEventListener('click', () => Store.update(s => { s.prefs.contrast = !s.prefs.contrast; }));

/* ---------- Hava durumu ---------- */
async function loadWeather() {
  try {
    const w = await fetchWeather(S().parent.city);
    $('weather').innerHTML = `<span class="w-em">${w.em}</span><span><b>${w.temp}°</b><small>${esc(S().parent.city)} · ${w.tx}<br>${w.min}° / ${w.max}°</small></span>`;
    $('weather-tip').textContent = '💡 ' + weatherAdvice(w);
  } catch (e) {
    $('weather').innerHTML = `<span class="w-em">🌡️</span><span><b>${esc(S().parent.city)}</b><small>Hava bilgisi alınamadı</small></span>`;
    $('weather-tip').textContent = '💡 Bugün bol su içmeyi unutmayın.';
  }
}

/* ---------- Günün güvenlik ipucu ---------- */
const TIPS = [
  ['🛡️', 'Polis, savcı ya da MASAK telefonda asla para veya altın istemez. İsteyen dolandırıcıdır.'],
  ['🔐', 'Bankanızdan gelen SMS kodunu hiç kimseyle paylaşmayın. Banka bunu sizden istemez.'],
  ['🤫', '"Kimseye söylemeyin" diyen arayan dolandırıcıdır. Hemen ailenize haber verin.'],
  ['👪', '"Anne benim" diye arayıp para isteyen olursa aile parolasını sorun.'],
  ['🎒', 'Deprem çantanızda ilaçlarınız, gözlüğünüz, düdük ve yedek şarj aleti olsun.'],
  ['🔗', 'Kargo, ödül ya da ceza mesajlarındaki bağlantılara dokunmayın.'],
  ['💧', 'Yaşlandıkça susama hissi azalır. Susamasanız da gün içinde su için.']
];
function renderTip() {
  const [ic, tx] = TIPS[Math.floor(Date.now() / 864e5) % TIPS.length];
  $('tip').innerHTML = `<span class="tip-ic">${ic}</span><div style="flex:1"><b>Günün ipucu</b><p>${tx}</p></div><button class="btn ghost sm" id="tip-say" aria-label="İpucunu sesli dinle">🔊</button>`;
  $('tip-say').onclick = () => Voice.speak(tx);
}
renderTip();
Store.onChange(refresh);
refresh();
loadWeather();

/* ---------- İşlemler ---------- */
const ACTIONS = {
  checkin(mood) {
    if (!mood) return askMood();
    const t = todayKey();
    Store.update(s => { s.checkins[t] = s.checkins[t] || Date.now(); s.moods[t] = mood; });
    Store.log(mood === 'kotu' ? 'mood' : 'checkin', `${P()} "İyiyim" dedi. Ruh hali: ${MOODS[mood].em} ${MOODS[mood].tx}.`, mood === 'kotu' ? 'warn' : 'ok');
    Voice.speak(mood === 'kotu' ? 'Geçmiş olsun. Ailenize haber verdim, sizi arayacaklar.' : 'Teşekkürler. Ailenize iyi olduğunuzu bildirdim.');
    toast('Ailenize "iyiyim" mesajı gitti ✓', 'ok');
  },
  meds() { openMeds(); },
  callreq() {
    const c = todaysCaller();
    Store.log('callreq', `${P()} "Beni arasınlar" dedi. Bugünün sırası: ${c?.name || 'aile'}.`, 'warn');
    Voice.speak(`Tamam. ${c ? c.name + ' sizi' : 'Aileniz sizi'} birazdan arayacak.`);
    toast(`${c?.name || 'Aileniz'} sizi arayacak 📞`, 'ok');
  },
  shield() { openShield(); },
  help() {
    Store.log('help', `ACİL: ${P()} yardım istedi!`, 'danger');
    beep('danger');
    Voice.speak('Ailenize acil durum mesajı gönderdim. Gerekirse yüz on ikiyi arayın.');
    modal(`<div class="big-alert"><h2>🆘 Ailenize haber verildi</h2><p>Tüm aileniz uyarıldı. Hayati bir durum varsa hemen arayın:</p>
      <a class="btn" href="tel:112" style="background:#fff;color:#b42318;border-color:#fff;font-size:1.3em">📞 112 Acil</a></div>
      <p style="margin-top:14px"><button class="btn ghost" data-close>Kapat</button></p>`);
  }
};
document.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => ACTIONS[b.dataset.act]()));

/* "İyiyim" sonrası: bugün nasıl hissediyorsunuz? */
function askMood() {
  Voice.speak('Bugün nasıl hissediyorsunuz?');
  const bg = modal(`<div style="text-align:center"><h2>Bugün nasıl hissediyorsunuz?</h2>
    <div class="moods">${Object.entries(MOODS).map(([k, v]) => `<button class="mood ${k}" data-mood="${k}"><span>${v.em}</span>${v.tx[0].toLocaleUpperCase('tr-TR') + v.tx.slice(1)}</button>`).join('')}</div>
    <p style="margin-top:14px"><button class="btn ghost" data-close>Vazgeç</button></p></div>`);
  bg.addEventListener('click', e => {
    const b = e.target.closest('[data-mood]');
    if (!b) return;
    bg.remove();
    ACTIONS.checkin(b.dataset.mood);
  });
}

/* ---------- İlaçlar ---------- */
function openMeds() {
  const t = todayKey();
  const render = () => {
    const log = S().medLog[t] || {};
    return S().meds.map(m => `<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--line)">
      <div style="flex:1"><b>${esc(m.name)}</b><div class="muted small">Saat ${esc(m.time)}</div></div>
      ${log[m.id] ? `<span class="pill ok">✓ ${hm(log[m.id])}</span>` : `<button class="btn ok" data-med="${m.id}">Aldım</button>`}
    </div>`).join('');
  };
  const bg = modal(`<h2>💊 Bugünkü ilaçlarım</h2><div id="med-list">${render()}</div><p style="margin-top:14px"><button class="btn ghost" data-close>Kapat</button></p>`);
  bg.addEventListener('click', e => {
    const b = e.target.closest('[data-med]');
    if (!b) return;
    const m = S().meds.find(x => x.id === b.dataset.med);
    Store.update(s => { (s.medLog[t] = s.medLog[t] || {})[m.id] = Date.now(); });
    Store.log('med', `${m.name} alındı (${m.time} dozu).`, 'ok');
    Voice.speak(`${m.name} kaydedildi. Geçmiş olsun.`);
    bg.querySelector('#med-list').innerHTML = render();
  });
}
/* Sesle "ilacımı aldım": sıradaki alınmamış ilacı işaretle */
function takeNextMed() {
  const t = todayKey();
  const log = S().medLog[t] || {};
  const m = S().meds.find(x => !log[x.id]);
  if (!m) { Voice.speak('Bugünkü bütün ilaçlarınızı almışsınız.'); return; }
  Store.update(s => { (s.medLog[t] = s.medLog[t] || {})[m.id] = Date.now(); });
  Store.log('med', `${m.name} alındı (sesli komut).`, 'ok');
  Voice.speak(`${m.name} kaydedildi.`);
  toast(`${m.name} ✓`, 'ok');
}

/* ---------- Dolandırıcılık kalkanı ---------- */
function openShield() {
  const bg = modal(`
    <h2>🛡️ Şüpheli arama</h2>
    <p class="muted">Arayan kişinin söylediklerini yazın ya da mikrofona dokunup tekrarlayın. Hemen kontrol ederim.</p>
    <div style="display:flex;gap:8px;align-items:flex-start">
      <textarea id="call-text" placeholder="Örnek: Savcıyım, hesabınız soruşturmada…"></textarea>
      <button class="mic" id="call-mic" aria-label="Sesle anlat" style="width:54px;height:54px">🎤</button>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0">
      ${SCAM_EXAMPLES.map((e, i) => `<button class="btn ghost sm" data-ex="${i}">${esc(e.label)}</button>`).join('')}
    </div>
    <div id="result" aria-live="polite"></div>
    <hr style="border:none;border-top:1px solid var(--line);margin:16px 0">
    <h3>👪 Arayan "aileden biriyim" mi diyor?</h3>
    <p class="muted small">Ona aile parolasını sorun ve söylediğini yazın.</p>
    <div style="display:flex;gap:8px"><input id="pw" placeholder="Arayanın söylediği parola" autocomplete="off"><button class="btn" id="pw-check">Kontrol et</button></div>
    <div id="pw-res" style="margin-top:8px" aria-live="polite"></div>
    <p style="margin-top:16px"><button class="btn ghost" data-close>Kapat</button></p>`);
  const ta = bg.querySelector('#call-text');
  const res = bg.querySelector('#result');
  let logged = false;
  const run = () => {
    const a = analyzeCall(ta.value);
    const col = a.level === 'yüksek' ? 'var(--danger)' : a.level === 'şüpheli' ? 'var(--warn)' : 'var(--ok)';
    if (!ta.value.trim()) { res.innerHTML = ''; return a; }
    res.innerHTML = `
      ${a.level === 'yüksek' ? `<div class="big-alert"><h2>⚠️ BU BİR DOLANDIRICILIK</h2><p style="font-size:1.1em"><b>Telefonu hemen kapatın.</b> Para, altın ya da şifre vermeyin.</p></div>` : ''}
      <p style="margin:12px 0 6px"><b>Risk: %${a.score}</b> (${a.level})</p>
      <div class="meter"><i style="width:${a.score}%;background:${col}"></i></div>
      <ul class="flags">${a.hits.map(h => `<li>${esc(h.title)}<span>${esc(h.why)}</span></li>`).join('')}</ul>
      ${a.level !== 'düşük' ? `<p style="margin-top:12px"><button class="btn danger" id="warn-family">Aileme haber ver</button> <a class="btn ghost" href="tel:155">155 Polis İmdat</a></p>` : '<p class="muted">Belirgin bir dolandırıcılık işareti görmedim. Yine de para ya da şifre istenirse kapatın.</p>'}`;
    if (a.level === 'yüksek' && !logged) {
      logged = true;
      beep('danger');
      Voice.speak('Dikkat. Bu bir dolandırıcılık. Telefonu hemen kapatın.');
      Store.log('scam', `Şüpheli arama: "${ta.value.trim().slice(0, 90)}…" (risk %${a.score}). ${P()} uyarıldı.`, 'danger');
    }
    const wf = res.querySelector('#warn-family');
    if (wf) wf.onclick = () => { Store.log('scam', `${P()} şüpheli bir arama için yardım istiyor (risk %${a.score}). Lütfen hemen arayın.`, 'danger'); toast('Ailenize haber verildi', 'ok'); };
    return a;
  };
  ta.addEventListener('input', run);
  bg.querySelectorAll('[data-ex]').forEach(b => b.addEventListener('click', () => { ta.value = SCAM_EXAMPLES[+b.dataset.ex].text; logged = false; run(); }));
  bg.querySelector('#call-mic').addEventListener('click', e => {
    const btn = e.currentTarget;
    if (Voice.listening) { Voice.stop(); return; }
    btn.classList.add('on');
    const ok = Voice.listen((txt) => { ta.value = txt; run(); }, () => btn.classList.remove('on'));
    if (!ok) { btn.classList.remove('on'); toast('Bu tarayıcıda sesli dinleme yok; lütfen yazın.'); }
  });
  bg.querySelector('#pw-check').addEventListener('click', () => {
    const said = trNorm(bg.querySelector('#pw').value).trim();
    const real = trNorm(S().safeWord).trim();
    const out = bg.querySelector('#pw-res');
    if (!said) return;
    if (said === real) out.innerHTML = '<span class="pill ok">✓ Parola doğru. Yine de para isteniyorsa önce aileyi kendi numarasından arayın.</span>';
    else {
      out.innerHTML = '<div class="big-alert"><b>Parola yanlış. Bu kişi aileniz değil. Telefonu kapatın.</b></div>';
      beep('danger');
      Voice.speak('Parola yanlış. Bu kişi aileniz değil. Telefonu kapatın.');
      Store.log('scam', `Kendini aileden biri olarak tanıtan arayan aile parolasını bilemedi. Muhtemel ses taklidi / dolandırıcılık.`, 'danger');
    }
  });
}

/* ---------- Deprem: "İyi misiniz?" ---------- */
function showQuakeAsk() {
  const q = S().quakeAsk;
  if (!q || quakeModal) return;
  beep('danger');
  Voice.speak(`${P()}, yakınınızda deprem oldu. İyi misiniz?`);
  quakeModal = modal(`<div style="text-align:center">
    <div style="font-size:3em">🌍</div><h2>Deprem oldu. İyi misiniz?</h2>
    <p class="muted">M${q.mag.toFixed(1)} · ${esc(q.place)} · size ${q.dist} km</p>
    <div class="tiles" style="margin-top:14px">
      <button class="tile ok" data-q="safe"><span class="em">✓</span>Güvendeyim</button>
      <button class="tile sos" data-q="help" style="grid-column:auto;flex-direction:column"><span class="em">🆘</span>Yardım lazım</button>
    </div>
    <p class="muted small" style="margin-top:12px">Sakin olun. Binadan çıkarken asansör kullanmayın. Deprem çantanızı (ilaçlar, gözlük, işitme cihazı pili, telefon şarjı) yanınıza alın.</p>
  </div>`);
  quakeModal.addEventListener('click', e => {
    const b = e.target.closest('[data-q]');
    if (!b) return;
    if (b.dataset.q === 'safe') {
      Store.log('quake', `Deprem kontrolü: ${P()} "Güvendeyim" dedi (M${q.mag.toFixed(1)}, ${q.dist} km).`, 'ok');
      Voice.speak('Çok şükür. Ailenize güvende olduğunuzu bildirdim.');
    } else {
      Store.log('help', `DEPREM SONRASI ACİL: ${P()} yardım istiyor! (M${q.mag.toFixed(1)}, ${q.dist} km)`, 'danger');
      Voice.speak('Ailenize acil durum mesajı gönderdim. Yüz on iki aranabilir.');
    }
    Store.update(s => { s.quakeAsk = null; });
    quakeModal.remove(); quakeModal = null;
  });
}
/* Ebeveyn ekranı açıkken deprem servisini 5 dakikada bir kontrol et */
async function pollQuakes() {
  try {
    const list = await fetchQuakes(1, 3.5);
    const q = relevantQuake(list);
    if (q) startQuakeCheck(q, 'sistem');
  } catch (e) { /* çevrimdışı */ }
}
pollQuakes(); setInterval(pollQuakes, 5 * 60e3);

/* ---------- Sesli komut ---------- */
function handleCommand(text) {
  const intent = voiceIntent(text);
  if (intent === 'med') return takeNextMed();
  if (intent === 'readmsg') return readLatestMessage();
  if (intent === 'checkin') return ACTIONS.checkin('iyi');
  if (intent) return ACTIONS[intent]();
  Voice.speak('Anlayamadım. İyiyim, ilacımı aldım ya da beni arasınlar diyebilirsiniz.');
  toast('Anlayamadım, tekrar deneyin.');
}
$('mic').addEventListener('click', () => {
  const btn = $('mic');
  if (Voice.listening) { Voice.stop(); return; }
  btn.classList.add('on');
  $('voice-text').textContent = 'Dinliyorum…';
  const ok = Voice.listen((txt, final) => {
    $('voice-text').textContent = `"${txt}"`;
    if (final) handleCommand(txt);
  }, () => btn.classList.remove('on'));
  if (!ok) { btn.classList.remove('on'); $('voice-text').textContent = 'Bu tarayıcı sesli dinlemeyi desteklemiyor; komutu yazabilirsiniz.'; }
});
$('type-form').addEventListener('submit', e => {
  e.preventDefault();
  const v = $('type-input').value.trim();
  if (!v) return;
  $('voice-text').textContent = `"${v}"`;
  $('type-input').value = '';
  handleCommand(v);
});

/* ---------- Düşme algılama (telefonun hareket sensörü) ---------- */
let fallOn = false, lastSpike = 0, fallTimer = null;
function fallDetected(source) {
  if (fallTimer) return;
  beep('danger');
  Voice.speak('Düştünüz mü? İyiyseniz iyiyim düğmesine basın.');
  let left = 30;
  const bg = modal(`<div style="text-align:center"><div style="font-size:3em">🤸</div><h2>Düştünüz mü?</h2>
    <p>İyiyseniz düğmeye basın. <b id="fall-left">${left}</b> saniye içinde basmazsanız ailenize haber vereceğim.</p>
    <button class="btn ok" id="fall-ok" style="font-size:1.2em">✓ İyiyim</button></div>`);
  fallTimer = setInterval(() => {
    left--;
    const el = bg.querySelector('#fall-left'); if (el) el.textContent = left;
    if (left <= 0) {
      clearInterval(fallTimer); fallTimer = null; bg.remove();
      Store.log('help', `DÜŞME ŞÜPHESİ: ${P()} 30 saniye yanıt vermedi (${source}). Lütfen hemen arayın.`, 'danger');
    }
  }, 1000);
  bg.querySelector('#fall-ok').addEventListener('click', () => {
    clearInterval(fallTimer); fallTimer = null; bg.remove();
    Store.log('checkin', `Olası düşme sonrası ${P()} "İyiyim" dedi (${source}).`, 'ok');
  });
}
function onMotion(e) {
  const a = e.accelerationIncludingGravity;
  if (!a) return;
  const g = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
  const now = Date.now();
  if (g > 28) lastSpike = now;                                  // ani darbe
  else if (lastSpike && now - lastSpike > 1500 && now - lastSpike < 4000 && Math.abs(g - 9.8) < 1.2) {
    lastSpike = 0; fallDetected('telefon sensörü');            // darbeden sonra hareketsizlik
  }
}
$('fall-btn').addEventListener('click', async () => {
  if (fallOn) return;
  try {
    if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission) {
      const p = await DeviceMotionEvent.requestPermission();
      if (p !== 'granted') throw new Error('izin yok');
    }
    window.addEventListener('devicemotion', onMotion);
    fallOn = true;
    $('fall-btn').textContent = '✓ Düşme algılama açık';
    toast('Düşme algılama açık (telefonda en iyi çalışır)', 'ok');
  } catch (e) { toast('Bu cihazda hareket sensörüne erişilemedi.'); }
});
$('fall-sim').addEventListener('click', () => fallDetected('simülasyon'));
