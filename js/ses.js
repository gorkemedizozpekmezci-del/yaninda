'use strict';
/* =========================================================
   Türkçe sesli asistan (tarayıcının Web Speech API'si)
   Konuşma: speechSynthesis (tr-TR)   Dinleme: SpeechRecognition (tr-TR)
   Dinleme yoksa kullanıcı aynı komutu yazarak verebilir.
   ========================================================= */
const Voice = {
  rec: null,
  listening: false,
  get canListen() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); },
  speak(text) {
    try {
      if (!('speechSynthesis' in window)) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'tr-TR'; u.rate = 0.92; u.pitch = 1;
      const v = speechSynthesis.getVoices().find(x => x.lang && x.lang.toLowerCase().startsWith('tr'));
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) { /* ses desteklenmiyor */ }
  },
  listen(onText, onEnd) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return false;
    this.rec = new SR();
    this.rec.lang = 'tr-TR';
    this.rec.interimResults = true;
    this.rec.continuous = false;
    this.rec.onresult = e => {
      const r = e.results[e.results.length - 1];
      onText(r[0].transcript, r.isFinal);
    };
    this.rec.onend = () => { this.listening = false; onEnd && onEnd(); };
    this.rec.onerror = () => { this.listening = false; onEnd && onEnd(); };
    this.listening = true;
    this.rec.start();
    return true;
  },
  stop() { try { this.rec && this.rec.stop(); } catch (e) { /* yok say */ } this.listening = false; }
};

/* Konuşmadan niyet çıkar: basit, açıklanabilir anahtar kelime eşleştirme */
function voiceIntent(text) {
  const t = trNorm(text);
  if (/(savcı|polis|dolandır|şüpheli|para ist|altın ist|şifre ist|kod ist)/.test(t)) return 'scam';
  if (/(yardım|imdat|düştüm|kötüyüm|iyi değil|nefes|göğsüm|ambulans)/.test(t)) return 'help';
  /* "ilaç" ek alınca "ilacı/ilacımı" olur (ç → c yumuşaması), ikisini de yakala */
  if (/(ila[çc]|hap).*(aldım|içtim)|(aldım|içtim).*(ila[çc]|hap)/.test(t)) return 'med';
  if (/(mesaj)/.test(t)) return 'readmsg';
  if (/(beni ara|arasın|aramasını|konuşmak istiyorum|özledim)/.test(t)) return 'callreq';
  if (/(iyiyim|iyi|güvendeyim|sağlam|bir şeyim yok|hamdolsun|çok şükür)/.test(t)) return 'checkin';
  return null;
}
