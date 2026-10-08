<div align="center">

# 🫶 Yanında

**Annen babanın yanında olamadığın anlarda, Yanında var.**

Türkiye'deki yaşlı ebeveynler ve aileleri için yapay zekâ destekli bakım ve güvenlik uygulaması

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Web Speech](https://img.shields.io/badge/Web%20Speech-tr--TR-0f5257)
![Canlı deprem verisi](https://img.shields.io/badge/deprem-USGS%20canl%C4%B1-b45309)

</div>

> **YZM301 · Ödev 3: "Yeni Deprem Üretmek".** Hacker News, Y Combinator ve RFS incelenerek 2026'nın "teknolojik deprem" ürünlerinden biri belirlendi. Ürünün **klonu** (85p) ve Türkiye'ye **yerelleştirilmiş, yenilikçi sürümü** (100p+) üretildi.

## 1. Araştırma: neden bu ürün?

| Kaynak | Bulgu |
|---|---|
| **YC RFS, Fall 2026** | **"AI for the Aging Population"** (Max Kolysh): sesli arayüzler, güvenlik takibi ve aile bakıcılarını koordine eden yazılımlar isteniyor. **"Proving You're Human"**: deepfake ve ses klonlamaya karşı doğrulama isteniyor. |
| **YC Fall 2026 dönemi** | **Rhem Labs**: "Yaşlı ebeveynler ve aileleri için evde bakım teknolojisi" (bağlantılı donanım + veri platformu). Aynı dönemde Ascenix (bakım evleri) ve DeepMark (yapay zekâ sesine filigran) da var: alan yatırım çekiyor. |
| **Hacker News, 2026** | Gündemde "her zaman açık" yapay zekâ ajanları ve ses arayüzleri var. Bu da yaşlıların kullanabileceği dokun-konuş arayüzlerini ilk kez gerçekçi kılıyor. |
| **Türkiye** | 65 yaş üstü nüfus **9,58 milyon** (%11,1; 5 yılda +%20,5, TÜİK 2025). Son 5 yılda **76 binden fazla** telefon dolandırıcılığı mağduru var; 2026'da sahte polis ve savcıların yaşlılardan 15,5, 19 ve 72 milyon ₺ aldığı vakalar yaşandı. Üstüne deprem gerçeği. |

## 2. Klon (85p): Rhem Labs

`klon.html`: Rhem'in "ev sensörleri + veri platformu" fikrinin işlevsel yeniden üretimi.

- 5 oda sensörü: yatak odası, banyo, mutfak, salon, ön kapı.
- Bir gün 60 saniyede simüle edilir; saatlik aktivite grafiği gösterilir.
- **Anormallik kuralları:** banyoda 45 dakika hareketsizlik (düşme şüphesi), 10:00'a kadar mutfak hareketi yoksa (kahvaltı atlandı), gece kapı açılması (gece gezinme).
- 4 senaryo: normal gün, kahvaltı yok, düşme, gece gezinme.

## 3. Yerli ve yenilikçi sürüm (100p+): Yanında

| Özellik | Ne yapıyor | Neden yerli / yenilikçi |
|---|---|---|
| 🛡️ **Dolandırıcılık Kalkanı** | Arayanın söylediklerini (yazı ya da ses) anında analiz eder, açıklanabilir bir risk puanı verir ve %60'ın üzerinde ekranı kırmızıya çevirip sesli uyarır. | Türkiye'ye özgü kalıplar: sahte savcı ve polis, MASAK, "terör soruşturması", altın ve döviz teslimi, SMS kodu, "kimseye söylemeyin". |
| 👪 **Aile parolası** | "Anne benim, kaza yaptım" diyen arayana parola sorulur; yanlışsa uyarı verir. | YC RFS **"Proving You're Human"**: ses klonlamaya karşı düşük teknolojili ama etkili bir çözüm. |
| 🌍 **Deprem Modu** | Canlı deprem verisi (USGS); ebeveynin şehrine 200 km içinde M4+ deprem olursa "İyi misiniz?" diye sorar. "Güvendeyim" ya da "Yardım lazım" cevabı aileye anında gider. | Türkiye'nin deprem gerçeği. Ödevin adındaki "deprem" de gerçek anlamıyla burada. |
| 🎙️ **Türkçe sesli asistan** | "İyiyim", "İlacımı aldım", "Beni arasınlar", "Yardım" komutlarını anlar ve sesle cevap verir. | Türkçe ses uyumuna (ilaç → ilacımı) duyarlı niyet tanıma. |
| 🤸 **Telefonla düşme algılama** | Telefonun ivmeölçeri darbe ve ardından hareketsizlik görürse 30 saniye geri sayar, cevap yoksa aileye haber verir. | Rhem'deki ev donanımı gerekmez; herkesin cebindeki telefon yeterli. |
| 📞 **Kardeşler arası arama sırası** | "Bu hafta annemi kim arıyor?" sorusunun cevabı: adil sıra, "Aradım" işareti. | Türk aile yapısına uygun, kardeşleri bir araya getiren koordinasyon. |
| 💊 **İlaç takibi** | Ebeveyn "Aldım" der, aile görür; geciken ilaç işaretlenir. | |
| 💚 **İyi oluş puanı** | "İyiyim", ruh hali (😊 😐 😔), ilaç uyumu ve olaylardan günlük 0-100 puan; aile panelinde 7 günlük görünüm ve haftalık özet. | Açıklanabilir: puanın 4 parçası da görünür. |
| 💌 **Aile mesajları** | Aile mesaj yazar; ebeveyn ekranında büyük yazıyla çıkar, sesli okunur, tek dokunuşla cevaplanır. | Yaşlının mesajlaşma uygulaması kullanması gerekmez. |
| ⛅ **Hava + günün ipucu** | Canlı hava durumu (Open-Meteo) ve yaşlıya özel öneri (sıcak çarpması, buzlanma, kaygan zemin); her gün bir güvenlik ipucu. | |
| 🗺️ **Deprem haritası** | Son depremler ve ebeveynin şehrinin 200 km uyarı alanı haritada. | |
| 🔠 **Erişilebilirlik** | 4 kademe yazı boyutu ve yüksek kontrast modu. | |
| 👵 **Yaşlıya uygun arayüz** | Kocaman düğmeler, az görenler için tasarlanmış Atkinson Hyperlegible yazı tipi, yüksek kontrast. | |

## 4. Canlı demo (2 dakika)

1. `demo.html` sayfasını aç: annenin telefonu ve aile paneli yan yana gelir, senaryolar tek tıkla çalışır. (Ya da `ebeveyn.html` ve `aile.html` sayfalarını iki pencerede yan yana aç.)
2. **Ebeveyn ekranı → Şüpheli arama → "Sahte savcı":** risk %100 görünür, ekran kırmızıya döner. Aile panelinde olay anında belirir.
3. **Aile paneli → "Deprem simüle et":** annenin ekranında "İyi misiniz?" açılır. "Güvendeyim" deyince aile paneline düşer.
4. **Ebeveyn ekranı → "ilacımı aldım" yaz ya da söyle:** aile panelindeki ilaç listesi güncellenir.
5. **Klon → "Possible fall" senaryosu:** 15:45'te düşme uyarısı çıkar.

## 5. Çalıştırma

Kurulum gerekmez. Dosyaları bir web sunucusundan aç:

```bash
python -m http.server 8000
```

Sonra tarayıcıda `http://localhost:8000` adresine git. Sesli dinleme ve bildirimler en iyi Chrome'da çalışır.

## 6. Hibrit yaklaşım, etik ve sınırlar

- **Hibrit karar:** Kalkan riski açıklayarak gösterir; son sözü yaşlı kişi ve ailesi söyler. Kurallar çevrimdışı çalışır.
- **KVKK:** Prototipte tüm veriler cihazda (localStorage) kalır, hiçbir sunucuya gitmez. Ebeveyn ve aile ekranları aynı cihazda BroadcastChannel ile canlı eşitlenir.
- **Yol haritası:** uçtan uca şifreli aile eşitlemesi; AFAD ve Kandilli entegrasyonu (tarayıcıdan doğrudan erişime kapalı oldukları için sunucu üzerinden); bankalarla "dolandırıcılık anında işlem durdurma" iş birliği; e-Nabız ilaç listesi.
- Bu bir öğrenci prototipidir; acil durumlarda **112** ve **155** aranmalıdır. Rhem Labs ile bağlantılı değildir.

## 7. Dosya yapısı

```
index.html      Ürün sayfası (araştırma, karşılaştırma, demo, kaynaklar)
demo.html       Canlı demo: iki ekran yan yana + tek tıkla senaryolar
ebeveyn.html    Yaşlı kullanıcı ekranı
aile.html       Aile paneli
klon.html       Rhem Labs klonu (85p)
css/style.css   Tasarım sistemi
js/store.js     Ortak veri + canlı eşitleme
js/kalkan.js    Dolandırıcılık tespiti (kural tabanlı, açıklanabilir)
js/deprem.js    Canlı deprem verisi + mesafe hesabı
js/ses.js       Türkçe konuşma ve dinleme + niyet tanıma
js/hava.js      Canlı hava durumu + yaşlıya özel öneri
js/ebeveyn.js · js/aile.js · js/klon.js   Sayfa mantığı
```

## Kaynaklar

- [Y Combinator: Requests for Startups (Fall 2026)](https://www.ycombinator.com/rfs)
- [Rhem Labs (YC F26)](https://www.ycombinator.com/companies/rhem-labs) · [YC Fall 2026 şirketleri](https://www.ycombinator.com/companies?batch=Fall%202026)
- [Hacker News](https://news.ycombinator.com/)
- [TÜİK: İstatistiklerle Yaşlılar 2025](https://yaslihaklaridernegi.org/tr/kirkambar/arastirma-rapor-ve-makaleler/tuik-istatistiklerle-yaslilar-2025/)
- [Telefon dolandırıcılığı: 76 bin mağdur](https://www.son.tv/telefon-dolandiriciliginda-tehlikeli-tablo-76-bin-kisi-magdur-19-bini-kadin/) · [15,5 milyon ₺ vakası](https://turkiyegazetesi.com.tr/gundem/79-yasindaki-emekliyi-polisiz-diyerek-155-milyon-tl-dolandirdilar-4-kisi-tutuklandi-1820312)
- [USGS deprem servisi](https://earthquake.usgs.gov/fdsnws/event/1/)
