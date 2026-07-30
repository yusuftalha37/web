# Solar Arena — Supabase + Vercel Kurulum Kılavuzu

Bu site iki modda çalışır:

- **Demo modu (varsayılan):** `js/config.js` boşken tüm veriler yalnızca
  tarayıcıda tutulur. Kurulum gerektirmez, denemek için idealdir.
- **Canlı mod:** `js/config.js`'e Supabase anahtarlarını girince site
  gerçek bir veritabanına bağlanır; admin panelinden eklediğiniz ürünleri
  tüm ziyaretçiler görür.

Aşağıdaki adımlar canlı moda geçişi ve Vercel'de yayınlamayı anlatır.
Her ikisi de **ücretsiz** başlanabilir.

---

## 1) Supabase projesi oluşturun

1. https://supabase.com → **Start your project** → giriş yapın.
2. **New project** → bir isim ve güçlü bir veritabanı şifresi verin,
   bölge olarak **Frankfurt (eu-central)** seçin (Türkiye'ye en yakını).
3. Proje hazırlanınca **Project Settings → API** bölümüne girin ve
   şu iki değeri kopyalayın:
   - **Project URL** (örn. `https://abcxyz.supabase.co`)
   - **anon public** anahtarı (`eyJ...` ile başlar)

## 2) Veritabanını kurun

1. Sol menüden **SQL Editor → New query**.
2. Bu depodaki **`supabase/schema.sql`** dosyasının tamamını yapıştırın.
3. **Run** deyin. Tablolar, güvenlik kuralları ve varsayılan ürünler oluşur.

## 3) Anahtarları siteye girin

`js/config.js` dosyasını açıp 1. adımda kopyaladığınız değerleri yazın:

```js
window.QS_CONFIG = {
  SUPABASE_URL: "https://abcxyz.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOi..."
};
```

> Not: `anon` anahtarı herkese açıktır, sorun değil. Verilerinizi asıl
> koruyan şey `schema.sql` ile kurulan **RLS güvenlik kuralları**dır:
> ürünleri herkes okur ama yalnızca **admin** ekler/siler.

## 4) Yönetici hesabınızı oluşturun

1. Siteyi açıp **/giris.html** üzerinden kendinize bir hesap açın
   (veya Supabase → **Authentication → Add user**).
2. Supabase → **SQL Editor**'de şunu KENDİ e-postanızla çalıştırın:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'sizin@epostaniz.com');
```

Artık bu hesapla giriş yapınca **Yönetim Paneli** açılır.

## 5) Vercel'de yayınlayın

**Kolay yol (GitHub ile):**

1. Bu projeyi kendi GitHub deponuza yükleyin.
2. https://vercel.com → **Add New → Project** → GitHub deponuzu seçin.
3. Framework olarak **Other** görünür; ayar değiştirmeden **Deploy** deyin.
   (Site tamamen statik olduğu için derleme adımı gerekmez.)
4. Birkaç saniyede `https://projeniz.vercel.app` adresinde yayında olur.

**Alternatif (Vercel CLI):**

```bash
npm i -g vercel
cd proje-klasoru
vercel        # ilk deploy
vercel --prod # canlıya al
```

## 6) Kendi alan adınız (opsiyonel)

- Vercel → proje → **Settings → Domains** → alan adınızı ekleyin ve
  gösterilen DNS kayıtlarını alan adı sağlayıcınıza girin.
- Ardından `index.html` ve `urunler.html` içindeki `canonical`,
  `og:url` ile `robots.txt` / `sitemap.xml` dosyalarındaki
  `solararena.store` adreslerini kendi alan adınızla değiştirin.

---

## Kredi kartı ile ödeme (PayTR)

Kart ödemesi güvenlik gereği bir **sunucu** ister (anahtarlar tarayıcıya
konulamaz). Supabase kullanıyorsanız bunun için bir **Edge Function**
idealdir:

1. PayTR mağaza bilgilerinizi (merchant_id, key, salt) Supabase
   **Edge Function** ortam değişkenlerine ekleyin.
2. Fonksiyon, sepet tutarıyla PayTR'den bir `iframe token` alıp geri döner.
3. `js/store.js` içindeki **`startCardPayment`** fonksiyonunu bu
   fonksiyonu çağırıp dönen ödeme sayfasını açacak şekilde güncelleyin.

İsterseniz bu Edge Function'ı da hazırlayabilirim.

---

## Sık sorulanlar

**Demo moda geri dönmek istersem?** `js/config.js`'teki iki değeri
boş bırakmanız yeterli.

**Verilerim nerede?** Canlı modda Supabase'de (Postgres). Supabase
panelinden **Table Editor** ile de görebilir/düzenleyebilirsiniz.

**Fotoğraflar?** Ürün/slayt fotoğrafları küçültülüp veritabanında
saklanır. Çok sayıda büyük görsel kullanacaksanız ileride Supabase
**Storage**'a taşımak daha verimli olur (istenirse eklenir).
