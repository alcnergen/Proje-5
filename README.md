# Kelime Bahçesi 🌳

İngilizce öğrenen Türkler için, telefonda ana ekrana eklenip uygulama gibi kullanılan (PWA) bir kelime antrenörü. Tamamen HTML/CSS/JS ile yazıldı, sunucu ya da hesap gerektirmez, ilerleme cihazda saklanır ve internet olmadan da çalışır (AI görselleri hariç).

## Özellikler

| | |
|---|---|
| **Havuz** | **11.530 öğe**: 11.228 kelime (A1 1.108 · A2 1.411 · B1 2.445 · B2 2.835 · C1 2.415 · C2 1.014) + 302 phrasal verb |
| **Seviye testi** | Uyarlamalı: B1'den 5 soruyla başlar. 5'te 4 doğru → bir üst seviyeye geçer, değilse durur. B1 geçilemezse A2 ve A1 sorulur. B1 düzeyindeki biri 10 soruda yerleşir, basit kelimelerle vakit kaybetmez. |
| **Çalışma aralığı** | Seviyen + 2 üst seviye (ör. B1 → B1, B2, C1). Ayarlardan elle de değiştirilebilir. |
| **Kelime Testi** | 50 soru, 4 şık. Üç soru tipi karışık gelir: İngilizce → Türkçe, Türkçe → İngilizce, İngilizce → İngilizce tanım. |
| **Cümle Tamamlama** | 50 soru. Boşluğa doğru kelime; çeldiriciler aynı kelime türünden ve aynı çekimde (-s, -ed, -ing, düzensiz fiiller) seçilir. |
| **Phrasal Verbs** | Ayrı test grubu (302 fiil, A2–C2). Anlam, Türkçe → phrasal, bağlamda phrasal ve **doğru edat (particle)** soruları. |
| **Her soruda** | Seviye etiketi, kelime türü, örnek cümle, İngilizce tanım, Türkçe anlam, 🔊 telaffuz, AI görsel, “yanlış arkadaş” uyarısı |
| **Ağaçlar** | Seviyenin altındaki ağaçlar seviye testiyle geçilmiş sayılır ve baştan meyve verir (ör. B1 çıkan kullanıcının A1–A2 ağaçları dolu). Çalışılan seviyelerde her mod için ağaç ayrı büyür: Tohum → Filiz → Fidan → Genç ağaç → Ulu ağaç → Meyve veren ağaç 🏆 (seviyedeki tüm öğeler öğrenildiğinde). |
| **Aralıklı tekrar** | Leitner kutuları (1-3-7-16-35 gün). Yanlışlar bir sonraki oturuma öncelikli girer; “Hatalarım” ekranında listelenir. |

Oturumlar kolaydan zora sıralanır (%45 kendi seviyen, %35 bir üstü, %20 iki üstü).

## Türkler için yöntem (uygulamada “Yöntem” ekranında da var)

1. **Aralıklı tekrar** — unutma eğrisine karşı en etkili yöntem.
2. **Çift yönlü hatırlama** — EN→TR tanıma, TR→EN üretme becerisini çalıştırır; EN→EN tanım soruları Türkçe çeviriye bağımlılığı azaltır.
3. **Bağlam içinde öğrenme** — cümle tamamlama, Türkçede olmayan yapıları (article, preposition, phrasal verb) ve collocation'ları yerleştirir.
4. **“Bilmiyorum” butonu** — şans eseri doğruların ilerlemeyi şişirmesini önler.
5. **i+1 (Krashen)** — seviyenin biraz üstü en hızlı ilerlemeyi sağlar; bu yüzden aralık seviye + 2.
6. **Türklere özgü tuzaklar** — yanlış arkadaşlar (sympathetic ≠ sempatik, actually ≠ aktüel…), phrasal verb'ler, kelime türü değişimi (decide / decision / decisive).

## Telefona kurulum (ana ekrana ekleme)

Service worker ve “ana ekrana ekle” özelliği HTTPS üzerinden yayınlanan bir sayfa ister. En kolayı GitHub Pages:

1. GitHub'da depo → **Settings → Pages** → *Source: Deploy from a branch* → bu dalı ve `/ (root)` klasörünü seç → Save.
2. Birkaç dakika sonra `https://<kullanıcı-adı>.github.io/<depo-adı>/` adresi açılır.
3. **iPhone (Safari):** Paylaş ⬆️ → **Ana Ekrana Ekle**. **Android (Chrome):** ⋮ menü → **Ana ekrana ekle / Uygulamayı yükle**.

Uygulama tam ekran açılır, ilk açılıştan sonra internet olmadan da çalışır. İleride gerçek uygulamaya çevirmek isterseniz aynı dosyalar Capacitor ile iOS/Android projesine sarılabilir.

Yerelde denemek için: `python3 -m http.server` → `http://localhost:8000`.

## Veri kaynakları ve dürüst notlar

- **Kelime listesi:** Oxford 3000/5000 ve Cambridge English Vocabulary Profile telif hakkıyla korunduğu için yeniden dağıtılamıyor. Onların yerine aynı CEFR ölçeğine göre etiketlenmiş açık listeler kullanıldı: **CEFR-J Vocabulary Profile 1.5** (A1–B2, Tokyo Yabancı Diller Üniversitesi, atıfla ticari kullanım serbest) ve **Octanove Vocabulary Profile C1/C2** (CC BY-SA 4.0). Bu iki liste 9.703 kelime veriyor. Havuzu 11.500'ün üzerine çıkarmak için İngilizce kullanım sıklığı verisinden (wordfreq) listelerde olmayan en yaygın 1.525 kelime eklendi; bunların seviyesi kullanım sıklığına göre **tahmin** edildi (çoğu C1).
- **İngilizce tanımlar:** Princeton WordNet 3.0 (kelimenin en yaygın anlamı). Bazı tanımlar kelimenin farklı bir anlamını verebilir.
- **Türkçe anlamlar, ~4.800 örnek cümle ve phrasal verb listesi** uygulama için elle hazırlandı; diğer örnek cümleler WordNet'ten geliyor. Hata görürseniz `tools/authored/*.txt` dosyasında düzeltip veriyi yeniden üretebilirsiniz.
- **AI görseller:** Her kelime için görsel, açıldığı anda ücretsiz [Pollinations.ai](https://pollinations.ai) servisinde yapay zekâyla üretilir ve cihazda önbelleğe alınır. Servis yavaşsa/limitliyse görsel yerine harf kartı görünür. Ayarlar'dan kapatılabilir veya kendi görsel servisinizin adresi (`{prompt}`, `{word}`, `{seed}` yer tutucularıyla) girilebilir. Soyut kelimelerde (ör. *nevertheless*) görseller doğal olarak daha az anlamlıdır.
- **Phrasal verb seviyeleri** English Vocabulary Profile'a göre yaklaşık olarak belirlendi.
- Cümle tamamlamada çeldiriciler aynı tür ve biçimden rastgele seçildiği için nadiren ikinci bir şık da cümleye uyabilir.
- Hakaret/argo içeren birkaç kelime ve tek başına soru olamayan dilbilgisi kelimeleri (a, the, he, is…) havuzdan çıkarıldı.

## Veriyi yeniden üretmek

```bash
pip install nltk
# WordNet: nltk_data/corpora/wordnet (https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/corpora/wordnet.zip)
NLTK_DATA=/yol/nltk_data python3 tools/base_list.py   # CEFR listeleri + WordNet → tools/base.json
NLTK_DATA=/yol/nltk_data python3 tools/extra_list.py 1625   # + sık kullanılan ek kelimeler (pip install wordfreq; names korpusu gerekir)
python3 tools/build_data.py                             # + Türkçe/örnekler → data/words.js, data/phrasal.js
python3 tools/make_icons.py                             # ikonlar
```

`tools/authored/*.txt` satır biçimi: `kelime|tür|Türkçe|örnek cümle içinde {hedef biçim}` (Türkçe alanı `-` ise kelime havuzdan çıkarılır).
`tools/phrasal.txt` satır biçimi: `phrasal verb|CEFR|Türkçe|İngilizce tanım|örnek {phrasal}`.

## Dosyalar

```
index.html, styles.css, app.js   uygulama
sw.js, manifest.webmanifest      çevrimdışı çalışma + ana ekran
data/words.js, data/phrasal.js   üretilmiş veri
icons/                           uygulama ikonları
tools/                           veri hazırlama betikleri ve kaynak listeler
```
