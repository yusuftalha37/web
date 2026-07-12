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
- Doğrulamalı iletişim/keşif talep formu — talepler admin paneline düşer
- **Kullanıcı girişi & kayıt** (`giris.html`) — demo yönetici: `admin@gunespark.com.tr` / `admin123`
- **Admin paneli** (`admin.html`) — ürün ekleme/düzenleme/silme, sipariş talepleri, keşif talepleri, WhatsApp numarası ayarı
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
├── index.html      # Ana sayfa (mağaza, hesaplayıcı, iletişim)
├── giris.html      # Kullanıcı girişi / kayıt
├── admin.html      # Yönetim paneli
├── css/
│   ├── style.css   # Site tasarımı
│   └── admin.css   # Admin paneli tasarımı
└── js/
    ├── store.js    # VERİ KATMANI (localStorage; sunucuya bağlarken burayı değiştirin)
    ├── main.js     # Mağaza, sepet, hesaplayıcı, form
    ├── auth.js     # Giriş/kayıt mantığı
    └── admin.js    # Admin paneli mantığı
```

## Sunucuya Bağlama

Tüm veriler şimdilik tarayıcıda (localStorage) tutulur. Sunucunuz hazır olduğunda
**yalnızca `js/store.js`** içindeki fonksiyonları (`getProducts`, `login`,
`addLead` vb.) kendi API'nize `fetch()` çağrıları yapacak şekilde değiştirmeniz
yeterlidir; sitenin geri kalanı bu fonksiyonları kullandığı için başka değişiklik
gerekmez. Şifre doğrulama ve yetki kontrolü sunucu tarafında yapılmalıdır —
istemcideki kontroller yalnızca arayüz içindir.

## Özelleştirme

- Firma adı/iletişim bilgileri: `index.html` içinde arayıp değiştirin.
- Renkler: `css/style.css` başındaki `:root` değişkenleri.
- **Ürünler**: `js/main.js` içindeki `PRODUCTS` dizisine ürün ekleyin/çıkarın (ad, özellikler, fiyat, stok).
- **WhatsApp sipariş numarası**: `js/main.js` içindeki `WHATSAPP_NUMBER` sabitini kendi numaranızla değiştirin (örn. `905xxxxxxxxx`).
- Hesaplayıcı varsayımları (birim fiyat, maliyet vb.): `js/main.js` başındaki sabitler.

> Not: Fiyatlar ve hesaplama değerleri örnektir; gerçek satış için güncelleyin.
