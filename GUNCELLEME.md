# Güncelleme ve Veri Koruma

## Verileriniz nerede tutuluyor?

Admin panelinden yaptığınız **her şey** (eklediğiniz ürünler, kategoriler,
marka alt kategorileri, kategori görselleri, IBAN/banka bilgileri, kullanıcılar,
siparişler) sunucudaki tek bir dosyada saklanır:

```
data.json
```

Kod dosyaları (`server.js`, `js/`, `css/`, `*.html` …) ile **veri dosyası
ayrıdır**. Kodları güncellerken `data.json`'a dokunmadığınız sürece
verileriniz kaybolmaz.

> `data.json` bilerek zip'e **konmaz** — böylece gönderdiğim yeni sürüm
> sizin verilerinizi taşımaz/eziyat etmez.

## Neden değişikliklerim kayboluyordu?

Yeni zip'i indirip **klasörün tamamını silip** yeniden çıkarınca ya da
`data.json`'ın üzerine yazınca, verilerin durduğu dosya da gittiği için
sunucu ilk kurulum verisiyle (varsayılan ürünler) yeniden başlıyordu.

## Doğru güncelleme yöntemi (önerilen)

1. Yeni `solar-arena.zip`'i indirin ve **boş bir klasöre** çıkarın.
2. Sunucudaki (çalışan) klasörde bulunan **`guncelle.bat`** dosyasını
   çift tıklayın.
3. Sizden "yeni dosyaların çıkarıldığı klasör" istenecek — 1. adımdaki
   klasörün yolunu yapıştırın, Enter'a basın.
4. Script kod dosyalarını günceller, **`data.json`'ı korur** ve
   güncelleme öncesi verinizin bir yedeğini (`data.guncelleme-oncesi.json`)
   alır.
5. Sunucuyu yeniden başlatın (`baslat.bat`).

## Elle güncelliyorsanız

Dosyaları elle kopyalıyorsanız, **şu dosyaları ASLA silmeyin / üzerine
yazmayın:**

- `data.json` — tüm verileriniz
- `data.yedek.json` — otomatik güvenlik yedeği
- `mail-ayarlari.json` — (varsa) e-posta ayarları

Diğer tüm dosyaları (`.html`, `.js`, `.css`, `server.js`) gönül rahatlığıyla
üzerine yazabilirsiniz.

## Otomatik güvenlik yedeği

Sunucu, her kayıtta `data.json`'ın bir kopyasını **`data.yedek.json`**
olarak da yazar. `data.json` bir şekilde silinir/bozulursa, sunucu bir
sonraki açılışta **otomatik olarak yedekten geri yükler** (varsayılan
verilere dönmez). Yani klasör dururken verinizi kaybetmezsiniz.

Elle geri almak isterseniz: `data.yedek.json` dosyasının adını
`data.json` yapıp sunucuyu yeniden başlatmanız yeterli.
