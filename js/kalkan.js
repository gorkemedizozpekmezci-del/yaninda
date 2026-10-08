'use strict';
/* =========================================================
   Dolandırıcılık Kalkanı
   Türkiye'de yaşlıları hedef alan telefon dolandırıcılığının
   tipik kalıplarını (sahte polis/savcı, MASAK, altın/döviz
   teslimi, SMS kodu, "kimseye söylemeyin"...) metin üzerinden
   tespit eder ve açıklanabilir bir risk puanı üretir.
   Kural tabanlıdır: çevrimdışı çalışır, veri dışarı çıkmaz.
   ========================================================= */
const SCAM_RULES = [
  { id: 'otorite', w: 28, title: 'Kendini resmî görevli olarak tanıtıyor',
    why: 'Gerçek polis, savcı veya jandarma telefonda sizden para, altın ya da şifre istemez.',
    words: ['savcı', 'savcılık', 'polis', 'emniyet', 'jandarma', 'asker', 'komutan', 'mit', 'istihbarat', 'hakim', 'mahkeme', 'masak', 'btk', 'cumhuriyet başsavcı', 'terörle mücadele', 'siber şube', 'banka güvenlik'] },
  { id: 'suclama', w: 24, title: 'Sizi bir suça karıştırıyor',
    why: 'Dolandırıcılar korku yaratmak için "adınız soruşturmada geçiyor" der.',
    words: ['terör', 'örgüt', 'fetö', 'kara para', 'aklama', 'soruşturma', 'ifade', 'gözaltı', 'tutuklama', 'hakkınızda', 'suç', 'operasyon', 'şüpheli', 'dosyanız'] },
  { id: 'para', w: 22, title: 'Para, altın ya da döviz istiyor',
    why: 'Hiçbir kurum "güvenlik için" parayı, altını ya da dövizi birine teslim etmenizi istemez.',
    words: ['para', 'havale', 'eft', 'iban', 'hesabınız', 'hesaptaki', 'transfer', 'kasa', 'kasaya', 'emanet', 'altın', 'döviz', 'dolar', 'euro', 'ziynet', 'bilezik', 'nakit', 'çekin', 'çekmeniz', 'teslim', 'poşet'] },
  { id: 'gizlilik', w: 32, title: 'Kimseye söylememenizi istiyor',
    why: 'Sizi ailenizden yalıtmak dolandırıcılığın en güçlü işaretidir. Hemen bir yakınınızı arayın.',
    words: ['kimseye söylemeyin', 'kimseye söyleme', 'gizli', 'çocuklarınıza söylemeyin', 'ailenize söylemeyin', 'telefonu kapatmayın', 'hattan ayrılmayın', 'hattı kapatmayın', 'bankaya söylemeyin', 'kimseyle konuşmayın'] },
  { id: 'kod', w: 32, title: 'Şifre veya doğrulama kodu istiyor',
    why: 'SMS kodu, e-Devlet şifresi, kart bilgisi asla kimseyle paylaşılmaz.',
    words: ['şifre', 'şifreniz', 'sms kod', 'doğrulama kod', 'tek kullanımlık', 'e-devlet', 'kart numara', 'cvv', 'son kullanma', 'gelen kodu', 'kodu söyle'] },
  { id: 'acele', w: 10, title: 'Acele ettiriyor',
    why: 'Düşünmenize fırsat vermemek için zaman baskısı yaparlar.',
    words: ['hemen', 'acil', 'şimdi', 'bugün içinde', 'yoksa', 'derhal', 'vakit yok', 'saat içinde'] },
  { id: 'yakin', w: 20, title: 'Bir yakınınızın başının dertte olduğunu söylüyor',
    why: 'Önce telefonu kapatın, sonra o yakınınızı kendi kayıtlı numarasından arayın. Aile parolasını sorun.',
    words: ['kaza geçirdi', 'kaza yaptı', 'oğlunuz', 'kızınız', 'torununuz', 'hastanede', 'karakolda', 'gözaltında', 'kefalet', 'ameliyat'] },
  { id: 'odul', w: 14, title: 'Ödül, kargo ya da yatırım vaat ediyor',
    why: 'Katılmadığınız çekilişten ikramiye çıkmaz; "gümrükte kargonuz var" bir tuzaktır.',
    words: ['kazandınız', 'ikramiye', 'çekiliş', 'hediye', 'kargo', 'gümrük', 'kripto', 'bitcoin', 'yatırım fırsatı', 'garantili kazanç'] }
];

/* Türkçe karakterleri koruyarak küçük harfe çevir */
const trNorm = s => String(s || '').toLocaleLowerCase('tr-TR').replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ');

function analyzeCall(text) {
  const t = ' ' + trNorm(text) + ' ';
  const hits = [];
  let score = 0;
  for (const r of SCAM_RULES) {
    const found = r.words.filter(w => t.includes(' ' + trNorm(w)) || t.includes(trNorm(w) + ' '));
    if (found.length) {
      hits.push({ ...r, found });
      score += r.w + Math.min(10, (found.length - 1) * 4);
    }
  }
  /* Tehlikeli kombinasyonlar: resmî görevli + para ya da kod = klasik senaryo */
  const has = id => hits.some(h => h.id === id);
  if (has('otorite') && (has('para') || has('kod'))) score += 20;
  if (has('yakin') && has('para')) score += 15;
  score = Math.min(100, score);
  const level = score >= 60 ? 'yüksek' : score >= 25 ? 'şüpheli' : 'düşük';
  return { score, level, hits };
}

/* Sunumda tek tıkla denenecek gerçekçi örnekler (2026 haberlerindeki senaryolar) */
const SCAM_EXAMPLES = [
  { label: 'Sahte savcı', text: 'Merhaba Ayşe Hanım, ben İstanbul Cumhuriyet Başsavcılığından savcı Ahmet Yılmaz. Adınız bir terör örgütü soruşturmasında geçiyor. Hesabınızdaki paralar risk altında, hemen bankaya gidip paranızı çekin. Bu gizli bir operasyon, çocuklarınıza söylemeyin.' },
  { label: 'Altın teslimi', text: 'Polis merkezinden arıyoruz. Evinizdeki altın ve dövizleri güvenlik için emanete almamız gerekiyor. Görevli arkadaşımız gelecek, poşete koyup teslim edin. Telefonu kapatmayın.' },
  { label: 'SMS kodu', text: 'Bankanızın güvenlik biriminden arıyoruz. Hesabınızda şüpheli işlem var. Size gelen doğrulama kodunu söyler misiniz, iptal edeceğiz.' },
  { label: 'Torun kaza yaptı', text: 'Anneanne benim, kaza yaptım, karakoldayım. Acil para lazım, kimseye söyleme, şu IBAN a gönder.' },
  { label: 'Normal arama', text: 'Merhaba teyzeciğim, eczaneden arıyorum. Reçeteniz hazır, yarın uğrayabilirsiniz. Kolay gelsin.' }
];
