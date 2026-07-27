# Cloudflare Tunnel ile Yayına Alma (solar-arena)

Bu yöntemle siteyi **kendi sunucunuzda** çalıştırıp, **kendi alan
adınızdan** internete açarsınız. Avantajı:

- Modem/router'da **port açmaya gerek yok**.
- Sabit/statik genel IP **gerekmez**.
- **HTTPS otomatik** gelir (SSL sertifikası uğraşı yok).
- Tünel adı: **solar-arena**

Kabaca yapı:
```
Ziyaretçi → alanadiniz.com → Cloudflare → (güvenli tünel) → sunucunuzdaki server.js (localhost:3000)
```

---

## Ön koşullar

1. **Site sunucuda çalışıyor olmalı.** Yani `node server.js` ile site
   `http://localhost:3000` adresinde açılıyor olsun (bkz. KURULUM-WINDOWS.md).
2. **Alan adınız Cloudflare'e ekli olmalı.**
   - https://dash.cloudflare.com → **Add a site** → alan adınızı girin.
   - Cloudflare size 2 adet **nameserver** verir. Alan adını aldığınız
     firmanın panelinden alanın nameserver'larını bunlarla değiştirin.
   - Cloudflare "Active" olana kadar bekleyin (birkaç dk – birkaç saat).

---

## Adım adım (Windows Server)

### 1) cloudflared'i kurun
- https://github.com/cloudflare/cloudflared/releases → `cloudflared-windows-amd64.msi` indirip kurun
  (veya `cloudflared-windows-amd64.exe`'yi indirip `C:\cloudflared\` içine koyun).
- Kontrol: Komut İstemi'nde
  ```
  cloudflared --version
  ```

### 2) Cloudflare hesabınıza bağlanın
```
cloudflared tunnel login
```
Tarayıcı açılır → alan adınızı seçip **Authorize** deyin. Bu, sunucuya
bir yetki dosyası indirir.

### 3) Tüneli oluşturun
```
cloudflared tunnel create solar-arena
```
Çıktıda bir **UUID** (kimlik) ve bir **.json** dosya yolu görürsünüz.
Bu UUID'yi not alın.

### 4) Alan adını tünele bağlayın (DNS)
```
cloudflared tunnel route dns solar-arena alanadiniz.com
cloudflared tunnel route dns solar-arena www.alanadiniz.com
```
(alanadiniz.com yerine kendi alan adınızı yazın.)

### 5) Yapılandırma dosyasını hazırlayın
Bu depodaki **`cloudflared/config.yml`** dosyasını
`C:\Users\KULLANICI\.cloudflared\config.yml` konumuna kopyalayın ve
içindeki iki yeri doldurun:
- `<TUNNEL_UUID>` → 3. adımdaki UUID
- `alanadiniz.com` → kendi alan adınız

### 6) Test edin
```
cloudflared tunnel run solar-arena
```
Şimdi tarayıcıdan **https://alanadiniz.com** açın — siteniz gelmeli. 🎉
(Node sunucusunun da ayrı bir pencerede çalıştığından emin olun.)

### 7) Sürekli çalışsın (Windows servisi)
Test tamamsa, pencere kapansa da açık kalması için servis kurun:
```
cloudflared service install
```
Bu, `config.yml`'i kullanarak tüneli Windows servisi olarak kurar ve
sunucu her açıldığında otomatik başlatır.

> Not: `server.js`'i de NSSM ile servis yaptıysanız (KURULUM-WINDOWS.md),
> artık hem site hem tünel sunucu açılışında kendiliğinden çalışır.

### 8) Siteyi kendi alan adınıza ayarlayın
`js\config.js` dosyasını açıp adresi alan adınız yapın:
```js
window.QS_CONFIG = {
  SUPABASE_URL: "https://alanadiniz.com",
  SUPABASE_ANON_KEY: "local"
};
```
Kaydedin. (Site ile veri API'si aynı adreste olduğu için bu yeterli.)

---

## Sık sorulanlar

**Port 3000'i değiştirdim.** `config.yml` içindeki `http://localhost:3000`
satırlarını yeni portla güncelleyin.

**"solar arena" boşluklu olmuyor.** Tünel adları boşluk almaz; bu yüzden
`solar-arena` kullandık. İç adı bu; ziyaretçi yalnızca alan adınızı görür.

**Node sunucusu çalışmıyorsa?** Tünel açıksa ama `server.js` kapalıysa
site "502/yükleniyor" verir. Önce `node server.js`'in çalıştığından
emin olun.

**Güvenlik.** Tünel yalnızca `config.yml`'de yazdığınız yerel servise
(localhost:3000) erişim verir; sunucunuzun başka portları internete
açılmaz. Trafik Cloudflare üzerinden şifreli (HTTPS) akar.
