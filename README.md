# Solar Arena Enerji — Örnek Solar Enerji Satış Sitesi

Güneş enerjisi sistemleri satışı için hazırlanmış örnek/demo web sitesi.
Tamamen statik olduğu için herhangi bir sunucu kurulumu gerektirmez.

## Özellikler

- Mobil uyumlu (responsive) tek sayfa tasarım
- **Ana sayfa vitrin slider'ı**: otomatik kayan, dokunmatik destekli showroom; slaytların görselleri/metinleri/butonları admin panelinden yönetilir
- **Ürünler sayfası** (`urunler.html`): filtreli tam mağaza; ana sayfada yalnızca 'çok satan' işaretli ürünler vitrini gösterilir (işaret admin panelindeki ürün formlarından yönetilir)
- **Ürün fotoğrafları**: admin panelinden bilgisayardan yükleme (otomatik küçültülür) veya görsel bağlantısı; fotoğrafı olmayan ürünlerde kategoriye uygun çizim gösterilir
- **Sepet**: localStorage ile kalıcı sepet, adet artır/azalt, WhatsApp üzerinden sipariş gönderme
- Hizmetler: çatı GES, endüstriyel GES, tarımsal sulama, depolamalı sistemler
- Etkileşimli tasarruf hesaplayıcı (fatura tutarına göre sistem gücü, yıllık tasarruf, geri ödeme süresi)
- Müşteri referansları ve S.S.S. bölümü
- Doğrulamalı iletişim/keşif talep formu — talepler admin paneline düşer
- **Kullanıcı girişi & kayıt** (`giris.html`) — demo yönetici: `admin@solararena.store` / `admin123`
- **Hesabım sayfası** (`hesap.html`) — profil güncelleme, şifre değiştirme, sipariş geçmişi
- **Admin paneli** (`admin.html`) — ürün yükleme/düzenleme/silme, kategori yönetimi, sipariş talepleri, keşif talepleri, WhatsApp numarası ayarı
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
├── index.html      # Ana sayfa (çok satanlar vitrini, hesaplayıcı, iletişim)
├── urunler.html    # Tüm ürünler sayfası (filtreli mağaza)
├── giris.html      # Kullanıcı girişi / kayıt
├── hesap.html      # Müşteri hesap sayfası (Hesabım)
├── admin.html      # Yönetim paneli
├── css/
│   ├── style.css   # Site tasarımı
│   └── admin.css   # Admin paneli tasarımı
└── js/
    ├── store.js    # VERİ KATMANI (localStorage; sunucuya bağlarken burayı değiştirin)
    ├── main.js     # Mağaza, sepet, hesaplayıcı, form
    ├── auth.js     # Giriş/kayıt mantığı
    ├── hesap.js    # Hesabım sayfası mantığı
    └── admin.js    # Admin paneli mantığı
```

## Canlıya Alma (Supabase + Vercel)

Site iki modda çalışır:

- **Demo modu (varsayılan):** `js/config.js` boşken veriler yalnızca
  tarayıcıda tutulur. Kurulum gerektirmez.
- **Canlı mod:** `js/config.js`'e Supabase anahtarları girilince site
  gerçek veritabanına (Supabase/Postgres) bağlanır; admin panelinden
  eklenen ürünleri tüm ziyaretçiler görür.

Adım adım kurulum: **`KURULUM.md`** dosyasına bakın. Özetle:

1. Supabase'de ücretsiz proje aç, `supabase/schema.sql`'i SQL Editor'de çalıştır.
2. `js/config.js`'e Project URL + anon anahtarını yaz.
3. Projeyi Vercel'e bağla (statik, derleme gerektirmez) ve deploy et.
4. Kendine hesap açıp `profiles.role`'ü `admin` yaparak yönetici ol.

Kod tarafında tüm veri işlemleri `js/store.js` üzerinden gider; backend
değişse de arayüz kodu aynı kalır. Kart ödemesi (PayTR) için bir Supabase
Edge Function gerekir — `KURULUM.md` içinde anlatılmıştır.

## Dosya Notları

- `js/config.js` — Supabase bağlantı ayarları (boşsa demo modu).
- `supabase/schema.sql` — Supabase veritabanı kurulum betiği.
- `vercel.json` — Vercel dağıtım ayarları.
- `solar-arena.html` — tek dosyalık demo (çift tıkla çalışır).
- `build_tek_dosya.py` — tek dosyayı kaynaklardan yeniden üretir.
