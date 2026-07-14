# Kendi Windows Server'ınızda Kurulum (bulut yok)

Bu yöntemde **site de veri de tamamen sizin sunucunuzda** durur.
Tek bir Node.js süreci hem siteyi sunar hem de veritabanı işini görür.
Veriler tek dosyada tutulur: **`data.json`**. Ek program/veritabanı kurmaya
gerek yoktur.

---

## 1) Node.js'i kurun

1. https://nodejs.org → **LTS** sürümünü indirin (Windows Installer .msi).
2. Kurulumu tamamlayın. Kontrol için **Komut İstemi**'nde:
   ```
   node --version
   ```
   Bir sürüm numarası görüyorsanız hazırsınız.

## 2) Dosyaları sunucuya kopyalayın

Tüm proje dosyalarını bir klasöre atın, örn: `C:\quantora`
(`server.js`, `index.html`, `css\`, `js\` vb. hepsi burada olsun).

## 3) Bağlantıyı ayarlayın

`js\config.js` dosyasını açıp sitenin adresini yazın. Aynı sunucu hem
siteyi hem veriyi verdiği için adres kendi adresinizdir:

```js
window.QS_CONFIG = {
  SUPABASE_URL: "http://localhost:3000",   // yayında: "https://alanadiniz.com"
  SUPABASE_ANON_KEY: "local"               // herhangi bir metin olabilir
};
```

> Not: Alan adı/HTTPS eklediğinizde bu adresi `https://alanadiniz.com`
> olarak güncelleyin (site ile API aynı adreste olduğu için).

## 4) Sunucuyu başlatın

Komut İstemi'nde klasöre gidip:
```
cd C:\quantora
node server.js
```
Şunu görürsünüz:
```
Quantora Solar sunucusu çalışıyor:  http://localhost:3000
→ Varsayılan yönetici: admin@quantorasolar.com.tr / admin123
```
Tarayıcıda `http://localhost:3000` → site açılır. 🎉

İlk açılışta `data.json` otomatik oluşur ve varsayılan ürünlerle,
bir **yönetici hesabıyla** gelir:
- E-posta: `admin@quantorasolar.com.tr`
- Şifre: `admin123`
- **Giriş yaptıktan sonra Hesabım > Şifre Değiştir ile mutlaka değiştirin.**

## 5) Sürekli çalışsın (Windows servisi)

`node server.js` penceresi kapanınca site durur. 7/24 çalışması için
sunucu bir **Windows servisi** olmalı. En kolayı **NSSM**:

1. https://nssm.cc → indirip `nssm.exe`'yi `C:\quantora`'ya koyun.
2. Yönetici Komut İstemi'nde:
   ```
   nssm install QuantoraSolar
   ```
3. Açılan pencerede:
   - **Path:** `C:\Program Files\nodejs\node.exe`
   - **Startup directory:** `C:\quantora`
   - **Arguments:** `server.js`
   - (İsteğe bağlı) **Environment** sekmesine `PORT=3000` yazın.
4. **Install service** → sonra `nssm start QuantoraSolar`.

Artık sunucu yeniden başlasa bile site otomatik ayağa kalkar.

## 6) Dışarıdan erişim, alan adı ve HTTPS

- **Güvenlik duvarı:** Windows Defender Firewall'da gelen bağlantıya
  **80** ve **443** portları için izin verin.
- **Yönlendirme:** Modem/router'da 80/443 portlarını sunucunun yerel
  IP'sine yönlendirin (port forwarding). Sabit/statik genel IP veya
  DDNS kullanın.
- **Alan adı:** DNS **A kaydını** sunucunuzun genel IP'sine yöneltin.
- **HTTPS (şart):** İki yaygın yol:
  1. **IIS'i ters vekil (reverse proxy) yapın:** IIS'e ücretsiz
     Let's Encrypt sertifikası (win-acme) alın, gelen 443 trafiğini
     `http://localhost:3000`'e yönlendirin (URL Rewrite + ARR modülleri).
  2. **Caddy** veya **nginx** gibi bir vekil kurup otomatik HTTPS alın.

## 7) Yedekleme

Tüm verileriniz **`data.json`** dosyasındadır. Düzenli olarak bu dosyanın
bir kopyasını alın; geri yüklemek için üzerine kopyalamanız yeterli.

---

## Sık sorulanlar

**Portu değiştirebilir miyim?** Evet: `set PORT=8080 && node server.js`
(servis kullanıyorsanız NSSM Environment sekmesinden). `config.js`'teki
adresi de aynı porta güncelleyin.

**Ürün fotoğrafları nerede?** `data.json` içinde saklanır. Çok sayıda
büyük görsel kullanacaksanız dosya büyür; ileride görselleri ayrı bir
klasöre/CDN'e taşımak istenirse eklenebilir.

**Kart ile ödeme (PayTR)?** `server.js` içine PayTR token uç noktası
eklenerek yapılır; `js/store.js`'teki `startCardPayment` bu uca bağlanır.
İstenirse hazırlanır.
