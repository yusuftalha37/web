# GüneşPark Enerji — Örnek Solar Enerji Satış Sitesi

Güneş enerjisi sistemleri satışı için hazırlanmış örnek/demo web sitesi.
Tamamen statik olduğu için herhangi bir sunucu kurulumu gerektirmez.

## Özellikler

- Mobil uyumlu (responsive) tek sayfa tasarım
- **Ürün mağazası**: panel, invertör, akü ve hazır paket kategorileriyle 10 örnek ürün, kategori filtresi, stok rozetleri
- **Sepet**: localStorage ile kalıcı sepet, adet artır/azalt, WhatsApp üzerinden sipariş gönderme
- Hizmetler: çatı GES, endüstriyel GES, tarımsal sulama, depolamalı sistemler
- Etkileşimli tasarruf hesaplayıcı (fatura tutarına göre sistem gücü, yıllık tasarruf, geri ödeme süresi)
- Müşteri referansları ve S.S.S. bölümü
- Doğrulamalı iletişim/keşif talep formu (demo — backend yok)
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
- **Ürünler**: `js/main.js` içindeki `PRODUCTS` dizisine ürün ekleyin/çıkarın (ad, özellikler, fiyat, stok).
- **WhatsApp sipariş numarası**: `js/main.js` içindeki `WHATSAPP_NUMBER` sabitini kendi numaranızla değiştirin (örn. `905xxxxxxxxx`).
- Hesaplayıcı varsayımları (birim fiyat, maliyet vb.): `js/main.js` başındaki sabitler.

> Not: Fiyatlar ve hesaplama değerleri örnektir; gerçek satış için güncelleyin.
