# Güvenlik Rehberi — Solar Arena

Bu belge, sitede **kod tarafında hazır gelen** korumaları ve **sizin
yapmanız gereken** ayarları anlatır.

---

## 1. Kodda hazır gelen korumalar

### Saldırı / bot koruması
| Koruma | Ne yapar |
|---|---|
| Saldırı aracı filtresi | sqlmap, nikto, nmap, wpscan gibi araçlar anında engellenir (1 saat) |
| Zafiyet taraması tespiti | `/wp-login.php`, `/.env`, `/phpmyadmin` gibi 5 deneme sonrası IP engellenir |
| Hız sınırı | IP başına dakikada 300 sayfa / 120 API isteği |
| Bal küpü (honeypot) | Formlardaki gizli alanı dolduran botlar sessizce düşürülür |
| Giriş koruması | 8 hatalı şifrede IP 15 dakika kilitlenir |
| Kayıt sınırı | Aynı IP saatte en fazla 5 hesap açabilir |
| Sipariş/talep sınırı | 10 dakikada 10 sipariş / 5 talep |

> **Arama motorları muaftır.** Googlebot, Bingbot, Yandex vb. hız sınırına
> takılmaz — SEO'nuz etkilenmez.

### Tünel / sunucu saldırıları
| Koruma | Ne yapar |
|---|---|
| Yalnızca yerel dinleme | Sunucu `127.0.0.1`'i dinler; saldırgan Cloudflare'i atlayıp doğrudan sunucu IP'sine bağlanamaz |
| Host başlığı doğrulaması | Yalnızca `solararena.store` ve `localhost` kabul edilir; başka alan adıyla erişim `421` ile reddedilir (DNS rebinding koruması) |
| IP sahteciliği koruması | `X-Forwarded-For` başlığına yalnızca tünelden (yerel) gelirse güvenilir; sahte IP ile hız sınırı atlatılamaz |
| Slowloris koruması | Yarım bırakılan bağlantı 10 saniyede kapatılır |
| Bağlantı tavanı | Aynı anda en fazla 512 bağlantı |
| Çökme koruması | Beklenmedik hata sunucuyu durdurmaz |

### Veri güvenliği
- Şifreler **scrypt + salt** ile saklanır (geri döndürülemez).
- Oturum jetonları **7 gün** sonra geçersiz olur.
- Şifre değişimi, hesap engelleme veya silme işlemlerinde ilgili **tüm oturumlar
  anında düşer**.
- Sipariş tutarı **sunucuda** hesaplanır — tarayıcıdan gelen fiyata güvenilmez.
- `data.json`, `server.js`, `mail-ayarlari.json`, `config.yml`, `.tmp/.bak`
  uzantılı dosyalar internetten **indirilemez**.
- Güvenlik başlıkları: CSP, X-Frame-Options, nosniff, Referrer-Policy.

---

## 2. Sizin yapmanız gerekenler

### a) Yönetici şifresini değiştirin (ŞART)
İlk kurulumda sunucu penceresinde size özel rastgele bir şifre gösterilir.
Giriş yapın → **Hesabım > Şifre Değiştir** → kendi güçlü şifrenizi belirleyin.

> Eskiden `admin123` kullandıysanız **mutlaka değiştirin**.

### b) Cloudflare korumalarını açın (5 dakika, ücretsiz)
dash.cloudflare.com → `solararena.store`:

1. **Security → Bots → Bot Fight Mode: ON**
   Bilinen kötü botları Cloudflare kendi tarafında eler, sunucunuza hiç ulaşmaz.

2. **Security → WAF → Managed rules: ON**
   SQL enjeksiyonu, XSS gibi bilinen saldırı kalıplarını engeller.

3. **Security → Settings → Security Level: Medium**
   Şüpheli ziyaretçilere doğrulama ekranı gösterir.

4. **SSL/TLS → Overview → Full (strict)** ve
   **Edge Certificates → Always Use HTTPS: ON**

5. **Security → WAF → Rate limiting rules** (isteğe bağlı):
   `/auth/v1/*` yoluna dakikada 20 istek sınırı ekleyin.

6. **Yönetim panelini kendinize kilitleyin (çok etkili):**
   WAF → Custom rules → yeni kural:
   - Alan: `URI Path` **contains** `/admin.html`
   - Ve: `IP Source Address` **is not in** `(kendi IP'niz)`
   - Eylem: **Block**

   Böylece admin paneli yalnızca sizin bağlantınızdan açılır.

### c) Sunucu (Windows) tarafı
- Windows Güncelleştirmelerini açık tutun.
- Windows Defender Firewall'da **3000 portunu dışarıya kapatın** — siteye
  erişim yalnızca Cloudflare Tunnel üzerinden olmalı. (Kod zaten yalnızca
  yerel arayüzü dinliyor; bu ikinci güvenlik katmanıdır.)
- Sunucuya uzak masaüstü (RDP) açıksa güçlü şifre + mümkünse VPN kullanın.

### d) Yedekleme
Tüm verileriniz **`data.json`** dosyasındadır. Düzenli olarak kopyalayın
(örn. haftada bir harici diske). Fidye yazılımı veya donanım arızasında tek
kurtarma yolunuz budur.

---

## 3. Şüpheli durumda ne yapmalı?

Sunucu penceresinde şu satırları görürseniz koruma çalışıyor demektir:
```
[GÜVENLİK] IP geçici engellendi: 1.2.3.4 — zafiyet taraması
[BOT] honeypot doldurulmuş istek düşürüldü
```

- **Çok fazla engelleme görüyorsanız** ve site yavaşladıysa: Cloudflare →
  Security → Events ekranından saldırıyı inceleyin, gerekirse
  **Security Level: I'm Under Attack** moduna alın.
- **Şüpheli bir yönetici girişi** fark ederseniz: şifrenizi değiştirin
  (bu, tüm oturumları otomatik düşürür) ve Kullanıcılar ekranından
  tanımadığınız hesapları silin.
