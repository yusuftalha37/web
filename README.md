# GüneşPark Enerji — Örnek Solar Enerji Satış Sitesi

Güneş enerjisi sistemleri satışı için hazırlanmış örnek/demo web sitesi.
Tamamen statik olduğu için herhangi bir sunucu kurulumu gerektirmez.

## Özellikler

- 📱 Mobil uyumlu (responsive) tek sayfa tasarım
- ☀️ Hizmetler: çatı GES, endüstriyel GES, tarımsal sulama, depolamalı sistemler
- 💰 3 farklı paket/fiyat kartı
- 🧮 Etkileşimli tasarruf hesaplayıcı (fatura tutarına göre sistem gücü, yıllık tasarruf, geri ödeme süresi)
- ⭐ Müşteri referansları ve S.S.S. bölümü
- 📨 Doğrulamalı iletişim/keşif talep formu (demo — backend yok)
- Harici bağımlılık yok: saf HTML + CSS + JavaScript

## Çalıştırma

`index.html` dosyasını tarayıcıda açmanız yeterli. İsterseniz basit bir
yerel sunucuyla da çalıştırabilirsiniz:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Dosya Yapısı

```
├── index.html      # Tüm sayfa içeriği
├── css/style.css   # Tasarım
└── js/main.js      # Menü, sayaçlar, hesaplayıcı, form doğrulama
```

## Özelleştirme

- Firma adı/iletişim bilgileri: `index.html` içinde arayıp değiştirin.
- Renkler: `css/style.css` başındaki `:root` değişkenleri.
- Hesaplayıcı varsayımları (birim fiyat, maliyet vb.): `js/main.js` başındaki sabitler.

> Not: Fiyatlar ve hesaplama değerleri örnektir; gerçek satış için güncelleyin.
