// ============================================================
// Solar Arena — Kendi sunucunuz için tek dosyalık backend
// ------------------------------------------------------------
//  - Hem siteyi sunar hem de veri (ürün/sipariş/kullanıcı) API'si verir.
//  - Hiçbir ek paket gerektirmez (yalnızca Node.js). Windows/Linux/Mac.
//  - Tüm veriler tek dosyada tutulur: data.json
//  - Frontend'in "Supabase modu" arayüzünü konuşur; site kodu değişmez.
//
// Çalıştırma:   node server.js
// Port:         PORT ortam değişkeni ya da 3000
// ============================================================
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const net = require("net");
const tls = require("tls");

const PORT = process.env.PORT || 3000;
// GÜVENLİK: Varsayılan olarak yalnızca yerel arayüz dinlenir (127.0.0.1).
// Cloudflare Tunnel sunucuya localhost üzerinden bağlandığı için bu yeterlidir
// ve saldırganın tüneli atlayıp doğrudan sunucu IP'sine bağlanmasını önler.
// Zorunlu hallerde: set HOST=0.0.0.0 (önerilmez, güvenlik duvarı şart).
const HOST = process.env.HOST || "127.0.0.1";
// Kabul edilen alan adları (Host başlığı doğrulaması — DNS rebinding ve
// başka alan adından servis edilmeye karşı). Virgülle çoğaltılabilir:
// set ALLOWED_HOSTS=solararena.store,www.solararena.store
const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS || "solararena.store,www.solararena.store")
  .split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "data.json");
const UPLOADS_DIR = path.join(ROOT, "uploads");
try { fs.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch (_) {}

// -------------------- Varsayılan tohum verisi --------------------
const SEED = {
  products: [
    { id: "pnl-460", cat: "panel", img: "panel", photo: "", name: "460W Half-Cut Monokristal Güneş Paneli", specs: ["120 hücre · %21,3 verim", "Çerçeve: eloksallı alüminyum, IP68 bağlantı kutusu", "25 yıl performans garantisi"], price: 4850, stock: 25, hit: true, sort: 0 },
    { id: "pnl-550", cat: "panel", img: "panel", photo: "", name: "550W Monokristal Güneş Paneli", specs: ["144 hücre · %21,7 verim", "Çift cam (bifacial) teknoloji", "30 yıl performans garantisi"], price: 5950, stock: 18, hit: true, sort: 1 },
    { id: "pnl-flx", cat: "panel", img: "flex", photo: "", name: "285W Esnek Güneş Paneli", specs: ["Karavan, tekne ve tiny house için", "Yarı esnek ETFE yüzey", "Sadece 4,8 kg"], price: 6750, stock: 4, hit: false, sort: 2 },
    { id: "inv-5g", cat: "inverter", img: "inverter", photo: "", authorized: true, name: "5 kW On-Grid İnvertör (Monofaze)", specs: ["2 MPPT girişi", "Wi-Fi izleme modülü dahil", "5 yıl garanti"], price: 38500, stock: 9, hit: false, sort: 3 },
    { id: "inv-6h", cat: "inverter", img: "inverter", photo: "", authorized: true, name: "6 kW Hibrit İnvertör 48V", specs: ["120A MPPT şarj kontrollü", "Şebeke + akü + jeneratör girişi", "Paralellenebilir (9 adede kadar)"], price: 52900, stock: 7, hit: true, sort: 4 },
    { id: "inv-3s", cat: "inverter", img: "inverter", photo: "", authorized: true, name: "3 kW Tam Sinüs İnvertör 24V", specs: ["Off-grid kullanım için", "LCD ekran, USB çıkış", "Düşük bekleme tüketimi"], price: 14750, stock: 14, hit: false, sort: 5 },
    { id: "inv-lexron-smart5", cat: "inverter", cats: ["lexron"], img: "inverter", photo: "", authorized: true, name: "Lexron 5.5 kW Akıllı Hibrit İnvertör", specs: ["Wi-Fi izleme + mobil uygulama", "Çift MPPT · %98 verim", "Şebeke + akü + jeneratör girişi"], price: 44900, stock: 6, hit: false, sort: 14 },
    { id: "aku-lfp", cat: "aku", img: "battery", photo: "", name: "48V 100Ah LiFePO4 Lityum Akü", specs: ["5,12 kWh kapasite", "6.000+ çevrim ömrü", "Dahili BMS, Bluetooth takip"], price: 58900, stock: 6, hit: true, sort: 6 },
    { id: "aku-jel", cat: "aku", img: "battery", photo: "", name: "12V 150Ah Derin Döngü Jel Akü", specs: ["Bakım gerektirmez", "Solar sistemler için optimize", "2 yıl garanti"], price: 9850, stock: 22, hit: false, sort: 7 },
    { id: "kit-krv", cat: "paket", img: "kit", photo: "", name: "Karavan Solar Paketi 410W", specs: ["410W panel + 30A MPPT regülatör", "Kablolama ve montaj aparatları dahil", "Kurulum şeması ile birlikte"], price: 32500, stock: 3, hit: true, sort: 8 },
    { id: "kit-bag", cat: "paket", img: "kit", photo: "", name: "Bağ Evi Off-Grid Paketi 3 kW", specs: ["4 × 460W panel + 3 kW invertör", "12V 150Ah × 2 jel akü", "Telefonla kurulum desteği"], price: 94500, stock: 5, hit: false, sort: 9 },
    { id: "aks-mppt", cat: "aksesuar", img: "controller", photo: "", name: "30A MPPT Şarj Kontrol Cihazı 12/24V", specs: ["LCD ekran, otomatik voltaj seçimi", "Aşırı şarj ve kısa devre koruması", "2 yıl garanti"], price: 4250, stock: 16, hit: false, sort: 10 },
    { id: "aks-lamba", cat: "aksesuar", img: "streetlight", photo: "", name: "Solar Sokak / Bahçe Lambası 100W", specs: ["Dahili panel ve lityum batarya", "Alacakaranlık sensörü, kumandalı", "IP65 dış mekan koruması"], price: 3980, stock: 12, hit: true, sort: 11 },
    { id: "aks-montaj", cat: "aksesuar", img: "mount", photo: "", name: "Çatı Montaj Konstrüksiyon Seti (10 Panel)", specs: ["Eloksallı alüminyum ray ve kelepçeler", "Kiremit ve sac çatıya uygun", "Paslanmaz bağlantı elemanları"], price: 7500, stock: 9, hit: false, sort: 12 },
    { id: "aks-kablo", cat: "aksesuar", img: "cable", photo: "", name: "6mm² Solar Kablo 50m + MC4 Konnektör Seti", specs: ["UV dayanımlı çift izolasyon", "2 çift MC4 konnektör dahil", "TSE belgeli"], price: 2450, stock: 30, hit: false, sort: 13 }
  ],
  categories: [
    { id: "panel", name: "Güneş Panelleri", sort: 0 },
    { id: "inverter", name: "İnvertörler", sort: 1 },
    { id: "aku", name: "Aküler", sort: 2 },
    { id: "paket", name: "Hazır Paketler", sort: 3 },
    { id: "aksesuar", name: "Aksesuarlar", sort: 4 },
    { id: "inverter-hibrit", name: "Hibrit İnvertörler", parent: "inverter", image: "", sort: 5 },
    { id: "lexron", name: "Lexron", kind: "brand", parent: "", image: "", sort: 6 }
  ],
  slides: [
    { id: "sl1", image: "", art: "roof", title: "Güneş Enerjisinde Türkiye'nin Her Yerine Gönderim", subtitle: "Panel, invertör, akü ve hazır paketler stoktan — siparişiniz aynı gün kargoda.", btnText: "Ürünleri İncele", btnLink: "urunler.html", sort: 0 },
    { id: "sl2", image: "", art: "field", title: "Yüksek Verimli Monokristal Paneller", subtitle: "%21+ verim, 25 yıla varan garanti. Ev, işyeri ve tarım için uygun çözümler.", btnText: "Panelleri Gör", btnLink: "urunler.html", sort: 1 },
    { id: "sl3", image: "", art: "carport", title: "Karavan ve Bağ Evi Solar Paketleri", subtitle: "Şebekeden bağımsız, kur-kullan hazır sistemler. Montaj kılavuzu ve destek dahil.", btnText: "Paketleri Gör", btnLink: "urunler.html", sort: 2 }
  ],
  kv: [
    { k: "site", v: { phone: "0850 000 00 00", email: "info@solararena.store", address: "Örnek Mah. Enerji Cad. No:1, Ankara", hours: "Hafta içi 09:00 - 18:00, Cumartesi 10:00 - 15:00", topNote: "Türkiye'nin her yerine hızlı gönderim", footerAbout: "Temiz enerjiyle daha aydınlık bir gelecek için 12 yıldır çalışıyoruz.", footerCopyright: "© 2026 Solar Arena Enerji" } },
    { k: "settings", v: { whatsapp: "908500000000" } }
  ],
  orders: [],
  leads: [],
  users: []
};

// -------------------- Veri yükle / kaydet --------------------
let DB;
function loadDB() {
  let restoredFromBackup = false;
  try {
    DB = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (_) {
    // data.json yok ya da bozuk. Bir güvenlik yedeği varsa ONDAN kurtar
    // (böylece güncelleme sırasında dosya silinse bile ürün/ayarlar geri gelir);
    // yedek de yoksa ilk kurulum tohum verisiyle başla.
    try {
      DB = JSON.parse(fs.readFileSync(path.join(ROOT, "data.yedek.json"), "utf8"));
      restoredFromBackup = true;
      console.log("Uyarı: data.json bulunamadı/bozuktu — data.yedek.json yedeğinden geri yüklendi.");
    } catch (_2) {
      DB = JSON.parse(JSON.stringify(SEED));
    }
  }
  ["products", "categories", "slides", "kv", "orders", "leads", "users"].forEach((t) => { if (!DB[t]) DB[t] = []; });

  // Yedekten kurtarıldıysa data.json'u hemen yeniden yaz (kalıcı olsun)
  if (restoredFromBackup) saveDB();

  // Oturum jetonlarını yeniden başlatmada koru (yoksa admin her yeniden
  // başlatmada oturumdan düşer ve kullanıcı/sipariş listeleri boş görünür).
  if (!DB.tokens) DB.tokens = {};
  Object.entries(DB.tokens).forEach(([tk, uid]) => tokens.set(tk, uid));

  // Süresi dolmuş oturum jetonlarını temizle
  const now = Date.now();
  let cleaned = false;
  Object.entries(DB.tokens).forEach(([tk, v]) => {
    const uid = typeof v === "string" ? v : v.uid;
    const exp = typeof v === "string" ? now + TOKEN_TTL : v.exp;
    if (exp > now) tokens.set(tk, { uid, exp });
    else { delete DB.tokens[tk]; cleaned = true; }
  });
  if (cleaned) saveDB();

  // İlk kurulumda yönetici hesabı — şifre RASTGELE üretilir ve konsola yazılır.
  // (Sabit "admin123" herkesçe bilinebileceği için kullanılmaz.)
  if (!DB.users.some((u) => u.role === "admin")) {
    const pass = crypto.randomBytes(9).toString("base64").replace(/[+/=]/g, "").slice(0, 12);
    DB.users.push(makeUser("admin@solararena.store", pass, "Site Yöneticisi", "", "admin"));
    saveDB();
    console.log("\n============================================================");
    console.log("  İLK KURULUM — YÖNETİCİ HESABI OLUŞTURULDU");
    console.log("  E-posta: admin@solararena.store");
    console.log("  Şifre  : " + pass);
    console.log("  Bu şifreyi bir yere not edin; bu ekran bir daha gösterilmez.");
    console.log("  Giriş yaptıktan sonra Hesabım > Şifre Değiştir ile değiştirin.");
    console.log("============================================================\n");
  }
}
let saveTimer = null;
const BACKUP_FILE = path.join(ROOT, "data.yedek.json");
function saveDB() {
  // atomik yazma: önce geçici dosya, sonra taşı
  const tmp = DATA_FILE + ".tmp";
  const json = JSON.stringify(DB);
  fs.writeFileSync(tmp, json);
  fs.renameSync(tmp, DATA_FILE);
  // Güvenlik yedeği: dosyalar dışarıdan (ör. güncelleme sırasında) üzerine
  // yazılsa bile veriler klasörde ikinci bir kopyada durur. Yalnızca anlamlı
  // veri varken yazılır ki boş/bozuk bir DB iyi yedeğin üstüne geçmesin.
  try {
    if ((DB.products && DB.products.length) || (DB.users && DB.users.length)) {
      fs.writeFileSync(BACKUP_FILE, json);
    }
  } catch (_) {}
}

// -------------------- Kullanıcı / şifre / token --------------------
function makeUser(email, pass, name, phone, role) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pass, salt, 64).toString("hex");
  return { id: "u" + crypto.randomBytes(8).toString("hex"), email: email.toLowerCase(), pass: salt + ":" + hash, name: name || "", phone: phone || "", role: role || "user", blocked: false, created: Date.now() };
}
function checkPass(pass, stored) {
  const [salt, hash] = stored.split(":");
  const h = crypto.scryptSync(pass, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(h));
}
const TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // oturum ömrü: 7 gün
const tokens = new Map(); // token -> { uid, exp }
function userFromReq(req) {
  const auth = req.headers["authorization"] || "";
  const tk = auth.replace(/^Bearer\s+/i, "");
  const rec = tokens.get(tk);
  if (!rec) return null;
  if (rec.exp <= Date.now()) {           // süresi dolmuş jetonu düşür
    tokens.delete(tk);
    if (DB.tokens) { delete DB.tokens[tk]; saveDB(); }
    return null;
  }
  const usr = DB.users.find((u) => u.id === rec.uid) || null;
  // Engellenen hesabın mevcut oturumu da geçersizdir
  if (usr && usr.blocked) return null;
  return usr;
}
// Bir kullanıcının tüm oturumlarını sonlandırır (engelleme/silme/şifre değişimi)
function revokeUserTokens(uid) {
  Object.entries(DB.tokens || {}).forEach(([tk, v]) => {
    const id = typeof v === "string" ? v : v.uid;
    if (id === uid) { delete DB.tokens[tk]; tokens.delete(tk); }
  });
}

// -------------------- Mail ayarları & SMTP gönderici --------------------
const MAIL_CFG_FILE = path.join(ROOT, "mail-ayarlari.json");
function loadMailCfg() {
  try { return JSON.parse(fs.readFileSync(MAIL_CFG_FILE, "utf8")); } catch (_) { return null; }
}
const MAIL_DEBUG = process.env.MAIL_DEBUG === "1";
function smtpSend(to, subject, html) {
  const cfg = loadMailCfg();
  if (!cfg || !cfg.host || !cfg.user || !cfg.pass) return Promise.reject(new Error("Mail ayarları eksik"));
  const port = cfg.port || 587;
  const from = cfg.from || cfg.user;
  const implicitTLS = port === 465;          // 465 = baştan TLS, 587/25 = STARTTLS
  const TIMEOUT = 20000;

  const message = [
    "From: Solar Arena <" + from + ">",
    "To: " + to,
    "Subject: =?UTF-8?B?" + Buffer.from(subject).toString("base64") + "?=",
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(html).toString("base64").replace(/(.{76})/g, "$1\r\n")
  ].join("\r\n");

  return new Promise((resolve, reject) => {
    let sock, buffer = "", stage = "greet", finished = false;

    function log(dir, s) { if (MAIL_DEBUG) console.log("[SMTP " + dir + "] " + s); }
    function done(err) {
      if (finished) return; finished = true;
      try { sock.write("QUIT\r\n"); } catch (_) {}
      try { sock.end(); } catch (_) {}
      if (err) reject(err); else resolve();
    }
    function send(line) { log("→", line); sock.write(line + "\r\n"); }

    // Sunucudan gelen tam bir yanıt satırı (çok satırlının SON satırı) işlenir
    function handle(code, line) {
      switch (stage) {
        case "greet":
          if (code !== 220) return done(new Error("Karşılama hatası: " + line));
          stage = "ehlo"; send("EHLO solararena.store"); break;
        case "ehlo":
          if (code !== 250) return done(new Error("EHLO reddedildi: " + line));
          if (implicitTLS) { stage = "auth"; send("AUTH LOGIN"); }
          else { stage = "starttls"; send("STARTTLS"); }
          break;
        case "starttls":
          if (code !== 220) return done(new Error("STARTTLS reddedildi: " + line));
          upgradeTLS(); break;
        case "ehlo2":
          if (code !== 250) return done(new Error("EHLO (TLS) reddedildi: " + line));
          stage = "auth"; send("AUTH LOGIN"); break;
        case "auth":
          if (code !== 334) return done(new Error("AUTH LOGIN reddedildi: " + line));
          stage = "user"; send(Buffer.from(cfg.user).toString("base64")); break;
        case "user":
          if (code !== 334) return done(new Error("Kullanıcı adı aşaması reddedildi: " + line));
          stage = "pass"; send(Buffer.from(cfg.pass).toString("base64")); break;
        case "pass":
          if (code !== 235) return done(new Error("Giriş başarısız — kullanıcı adı/şifre veya yetki reddedildi (" + line + ")"));
          stage = "from"; send("MAIL FROM:<" + from + ">"); break;
        case "from":
          if (code !== 250) return done(new Error("MAIL FROM reddedildi: " + line));
          stage = "to"; send("RCPT TO:<" + to + ">"); break;
        case "to":
          if (code !== 250 && code !== 251) return done(new Error("Alıcı reddedildi: " + line));
          stage = "data"; send("DATA"); break;
        case "data":
          if (code !== 354) return done(new Error("DATA reddedildi: " + line));
          stage = "body"; log("→", "<mesaj gövdesi>"); sock.write(message + "\r\n.\r\n"); break;
        case "body":
          if (code !== 250) return done(new Error("Mesaj kabul edilmedi: " + line));
          done(); break;   // GERÇEK başarı: sunucu mesajı kuyruğa aldı
      }
    }
    function onData(chunk) {
      buffer += chunk.toString("utf8");
      let idx;
      while ((idx = buffer.indexOf("\r\n")) !== -1) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        if (line.length < 3) continue;
        log("←", line);
        const code = parseInt(line.slice(0, 3), 10);
        if (line.charAt(3) === "-") continue;   // çok satırlı yanıt: son satırı bekle
        handle(code, line);
      }
    }
    function attach(s) {
      sock = s;
      sock.setTimeout(TIMEOUT, () => done(new Error("SMTP zaman aşımı — sunucuya/porta ulaşılamadı")));
      sock.on("data", onData);
      sock.on("error", (e) => done(new Error("Bağlantı hatası: " + e.message)));
      sock.on("close", () => { if (!finished) done(new Error("Bağlantı beklenmedik şekilde kapandı")); });
    }
    function upgradeTLS() {
      sock.removeListener("data", onData);
      sock.setTimeout(0);
      const secure = tls.connect({ socket: sock, servername: cfg.host }, () => {
        stage = "ehlo2"; buffer = "";
        attach(secure);
        send("EHLO solararena.store");
      });
      secure.on("error", (e) => done(new Error("TLS hatası: " + e.message)));
    }

    if (implicitTLS) {
      // servername yalnızca gerçek alan adı için (IP ise TLS SNI'de yok sayılır)
      const tlsOpts = /^\d+\.\d+\.\d+\.\d+$/.test(cfg.host) ? {} : { servername: cfg.host };
      const s = tls.connect(port, cfg.host, tlsOpts, () => log("←", "TLS bağlandı"));
      attach(s);
    } else {
      attach(net.createConnection(port, cfg.host));
    }
  });
}

const RESET_TTL = 30 * 60 * 1000; // 30 dakika
function cleanExpiredResets() {
  if (!DB.resets) return;
  const now = Date.now();
  DB.resets = DB.resets.filter((r) => r.exp > now);
}

// -------------------- Kaba kuvvet (brute force) koruması --------------------
const loginFails = new Map(); // ip -> { n, until }
const MAX_FAILS = 8, LOCK_MS = 15 * 60 * 1000;
// Bağlantının doğrudan geldiği adres (sahtelenemez)
function socketIp(req) { return (req.socket && req.socket.remoteAddress) || "?"; }
// Yerel/özel ağdan mı geliyor? (Cloudflare Tunnel localhost'tan bağlanır)
function isLocalPeer(ip) {
  return /^(::1|::ffff:127\.|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(String(ip));
}
// Gerçek ziyaretçi IP'si.
// GÜVENLİK: cf-connecting-ip / x-forwarded-for başlıklarına YALNIZCA bağlantı
// güvenilir bir kaynaktan (tünel = localhost) geliyorsa itibar edilir. Aksi
// halde saldırgan bu başlığı uydurarak hız sınırını ve engelleri atlatabilirdi.
function clientIp(req) {
  const peer = socketIp(req);
  if (isLocalPeer(peer)) {
    const fwd = req.headers["cf-connecting-ip"] ||
      String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    if (fwd) return fwd;
  }
  return peer;
}
function isLocked(ip) {
  const f = loginFails.get(ip);
  if (!f) return false;
  if (f.until && f.until > Date.now()) return true;
  if (f.until && f.until <= Date.now()) { loginFails.delete(ip); }
  return false;
}
function noteFail(ip) {
  const f = loginFails.get(ip) || { n: 0, until: 0 };
  f.n++;
  if (f.n >= MAX_FAILS) { f.until = Date.now() + LOCK_MS; f.n = 0; }
  loginFails.set(ip, f);
}
function clearFails(ip) { loginFails.delete(ip); }

// ============================================================
//                  BOT / SALDIRI KORUMASI
// ============================================================
// Arama motoru botları (Google, Bing, Yandex...) ASLA engellenmez;
// yalnızca saldırı araçları ve aşırı istek yapan kaynaklar sınırlanır.

// Geçici yasaklı IP'ler: ip -> bitiş zamanı
const banned = new Map();
const BAN_MS = 60 * 60 * 1000; // 1 saat
function isBanned(ip) {
  const until = banned.get(ip);
  if (!until) return false;
  if (until > Date.now()) return true;
  banned.delete(ip);
  return false;
}
function banIp(ip, reason) {
  banned.set(ip, Date.now() + BAN_MS);
  if (banned.size > 10000) banned.clear();
  console.warn("[GÜVENLİK] IP geçici engellendi: " + ip + " — " + reason);
}

// Saldırı araçları ve zararlı tarayıcılar (meşru botlar listede yok)
const BAD_AGENT_RE = /(sqlmap|nikto|nmap|masscan|nessus|acunetix|havij|zgrab|dirbuster|gobuster|wpscan|hydra|metasploit|libwww-perl|python-requests\/|curl\/7\.(?:[0-9]|[1-4][0-9])\b.*scan)/i;
// İyi niyetli arama motorları — hız sınırından muaf
const GOOD_BOT_RE = /(googlebot|bingbot|slurp|duckduckbot|yandex(bot|images)|baiduspider|applebot|facebookexternalhit|twitterbot|linkedinbot|telegrambot|whatsapp|ahrefsbot|semrushbot|petalbot|uptimerobot)/i;

// Sitede olmayan, tipik olarak zafiyet taranan yollar (WordPress, PHP, yedek, .env…)
const PROBE_RE = /(\.php\b|\/wp-(admin|login|content|includes|json)|\/xmlrpc|\/phpmyadmin|\/pma\b|\/administrator\b|\/\.env|\/\.git|\/\.aws|\/config\.(php|json|bak)|\/backup|\/dump\.sql|\/shell|\/cgi-bin|\/vendor\/|\/\.well-known\/(?!acme)|\/solr|\/jenkins|\/actuator|\/console\b|\/telescope|\/eval-stdin)/i;
const probeHits = new Map(); // ip -> tarama sayısı

// IP başına genel istek sayacı (kayan pencere)
const reqHits = new Map();
function generalRateExceeded(ip, limit, windowMs) {
  const now = Date.now();
  const arr = (reqHits.get(ip) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  reqHits.set(ip, arr);
  if (reqHits.size > 20000) reqHits.clear();
  return arr.length > limit;
}

// Her isteğin geçtiği kapı. İzin verilmiyorsa true döner (yanıt yazılmıştır).
function botGate(req, res, u) {
  const ip = clientIp(req);
  const ua = String(req.headers["user-agent"] || "");
  const p = u.pathname;

  // 0) Host başlığı doğrulaması — DNS rebinding, alan adı ele geçirme ve
  //    tüneli atlayarak IP'den doğrudan erişim denemelerine karşı.
  const host = String(req.headers.host || "").toLowerCase().split(":")[0].replace(/^\[|\]$/g, "");
  const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1"];
  const hostOk = !!host && (ALLOWED_HOSTS.includes(host) || LOCAL_HOSTS.includes(host));
  if (!hostOk) {
    send(res, 421, { error: "misdirected_request", error_description: "Bu alan adı bu sunucuda yayınlanmıyor." });
    return true;
  }

  if (isBanned(ip)) { send(res, 429, { error: "banned", error_description: "Çok fazla şüpheli istek. Bir süre sonra tekrar deneyin." }); return true; }

  // 1) Saldırı aracı imzası → anında engelle
  if (BAD_AGENT_RE.test(ua)) { banIp(ip, "saldırı aracı: " + ua.slice(0, 60)); send(res, 403, { error: "forbidden" }); return true; }

  // 2) User-Agent'sız yazma isteği (basit botlar) → reddet (okuma serbest)
  if (!ua && req.method !== "GET" && req.method !== "HEAD") { send(res, 403, { error: "forbidden" }); return true; }

  // 3) Zafiyet taraması: 5 farklı denemeden sonra engelle
  if (PROBE_RE.test(p)) {
    const n = (probeHits.get(ip) || 0) + 1;
    probeHits.set(ip, n);
    if (probeHits.size > 10000) probeHits.clear();
    if (n >= 5) banIp(ip, "zafiyet taraması (" + n + " deneme, son: " + p.slice(0, 60) + ")");
    send(res, 404, { error: "not found" });
    return true;
  }

  // 4) Genel hız sınırı — arama motoru botları muaf
  if (!GOOD_BOT_RE.test(ua)) {
    const isApi = p.startsWith("/rest/v1/") || p.startsWith("/auth/v1/") || p.startsWith("/api/");
    // Sayfa+varlık yüklemeleri doğal olarak çok olur; API daha sıkı
    const limit = isApi ? 120 : 300;
    if (generalRateExceeded(ip, limit, 60 * 1000)) {
      send(res, 429, { error: "rate_limited", error_description: "Çok fazla istek. Lütfen biraz yavaşlayın." }, { "Retry-After": "60" });
      return true;
    }
  }
  return false;
}

// -------------------- Basit istek hız sınırı (spam/DoS) --------------------
const rateHits = new Map(); // ip -> [zaman damgaları]
function tooManyRequests(ip, limit, windowMs) {
  const now = Date.now();
  const arr = (rateHits.get(ip) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  rateHits.set(ip, arr);
  if (rateHits.size > 5000) rateHits.clear(); // bellek koruması
  return arr.length > limit;
}

// -------------------- Yardımcılar --------------------
function send(res, code, obj, headers) {
  res.writeHead(code, Object.assign({ "Content-Type": "application/json; charset=utf-8" }, SECURITY_HEADERS, headers || {}));
  res.end(obj == null ? "" : JSON.stringify(obj));
}
// Gövde okuma — boyut sınırlı (aşılırsa bağlantı kapatılır: bellek tüketimi DoS'u önler)
const MAX_BODY = 8 * 1024 * 1024;   // 8 MB (ürün/slayt fotoğrafları base64 gelebilir)
const MAX_BODY_SMALL = 256 * 1024;  // 256 KB (sipariş, form, giriş)
function readBody(req, limit) {
  const max = limit || MAX_BODY;
  return new Promise((resolve) => {
    let d = "", size = 0, done = false;
    req.on("data", (c) => {
      if (done) return;
      size += c.length;
      if (size > max) { done = true; resolve({ __tooLarge: true }); try { req.destroy(); } catch (_) {} return; }
      d += c;
    });
    req.on("end", () => { if (done) return; done = true; try { resolve(d ? JSON.parse(d) : {}); } catch (_) { resolve({}); } });
    req.on("error", () => { if (!done) { done = true; resolve({}); } });
  });
}
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  // Dış kaynaklı script/çerçeve yüklenmesini engeller. Ürün görselleri
  // data: (yüklenen fotoğraf) veya https: (bağlantı) olabildiği için img gevşek.
  "Content-Security-Policy": [
    "default-src 'self'",
    "img-src 'self' data: blob: https:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'",
    "connect-src 'self'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'"
  ].join("; ")
};
function eqFilter(rows, params) {
  for (const [k, val] of params) {
    if (k === "select" || k === "order") continue;
    const m = String(val).match(/^eq\.(.*)$/);
    if (m) rows = rows.filter((r) => String(r[k]) === decodeURIComponent(m[1]));
  }
  return rows;
}

// -------------------- Statik dosya sunumu --------------------
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml" };
// Hassas dosyalar: veri tabanı, kaynak kod, ayarlar, yedekler
const BLOCKED_RE = /(^|\/)(data\.json|server\.js|mail-ayarlari\.json|config\.yml|baslat\.bat|package(-lock)?\.json)($|\.)|\.(tmp|bak|log|env|old|orig|save|swp)$|(^|\/)\.[^/]/i;
function serveStatic(req, res) {
  let p;
  try { p = decodeURIComponent(new URL(req.url, "http://x").pathname); }
  catch (_) { send(res, 400, { error: "bad request" }); return; }
  if (p === "/") p = "/index.html";
  p = p.replace(/\\/g, "/");                     // Windows ters bölü kaçışını engelle
  if (p.includes("..") || p.includes("\0") || BLOCKED_RE.test(p)) { send(res, 403, { error: "forbidden" }); return; }

  const file = path.join(ROOT, p);
  // Yol normalize edildikten sonra hâlâ site klasörünün içinde mi? (traversal son savunma)
  const rel = path.relative(ROOT, file);
  if (rel.startsWith("..") || path.isAbsolute(rel)) { send(res, 403, { error: "forbidden" }); return; }

  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { send(res, 404, { error: "not found" }); return; }
    fs.readFile(file, (err2, data) => {
      if (err2) { send(res, 404, { error: "not found" }); return; }
      const ext = path.extname(file).toLowerCase();
      // Kod/işaretleme dosyaları önbelleğe alınmasın — güncelleme sonrası tarayıcı
      // her zaman en yeni sürümü çeksin (aksi halde eski admin.js/HTML gösterilir).
      // Görseller değişmediği için makul süre önbelleklenebilir.
      const noCache = [".html", ".js", ".css", ".json", ".xml", ".txt"].includes(ext);
      res.writeHead(200, Object.assign({
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": noCache ? "no-cache, no-store, must-revalidate" : "public, max-age=86400"
      }, SECURITY_HEADERS));
      res.end(data);
    });
  });
}

// -------------------- API (PostgREST + GoTrue alt kümesi) --------------------
async function handleApi(req, res, u) {
  const params = u.searchParams;
  const caller = userFromReq(req);
  const isAdmin = caller && caller.role === "admin";

  const ip = clientIp(req);
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ---- Kimlik doğrulama ----
  if (u.pathname === "/auth/v1/token") {
    if (isLocked(ip)) return send(res, 429, { error: "too_many", error_description: "Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin." });
    const b = await readBody(req, MAX_BODY_SMALL);
    if (b.__tooLarge) return send(res, 413, { error: "too_large" });
    const usr = DB.users.find((x) => x.email === String(b.email || "").toLowerCase());
    let okPass = false;
    try { okPass = !!usr && checkPass(String(b.password || ""), usr.pass); } catch (_) { okPass = false; }
    if (!okPass) { noteFail(ip); return send(res, 400, { error: "invalid_grant", error_description: "Hatalı giriş" }); }
    if (usr.blocked) { noteFail(ip); return send(res, 400, { error: "blocked", error_description: "Bu hesap engellenmiş." }); }
    clearFails(ip);
    const tk = crypto.randomBytes(32).toString("hex");
    const exp = Date.now() + TOKEN_TTL;
    tokens.set(tk, { uid: usr.id, exp });
    if (!DB.tokens) DB.tokens = {};
    DB.tokens[tk] = { uid: usr.id, exp }; saveDB();  // yeniden başlatmada oturum korunur
    return send(res, 200, { access_token: tk, token_type: "bearer", expires_in: Math.floor(TOKEN_TTL / 1000), user: { id: usr.id, email: usr.email, user_metadata: { name: usr.name, phone: usr.phone } } });
  }
  if (u.pathname === "/auth/v1/signup") {
    // Aynı IP'den seri hesap açmayı sınırla (spam kayıt)
    if (tooManyRequests("signup:" + ip, 5, 60 * 60 * 1000)) return send(res, 429, { msg: "Çok fazla kayıt denemesi. Daha sonra tekrar deneyin." });
    const b = await readBody(req, MAX_BODY_SMALL);
    if (b.__tooLarge) return send(res, 413, { msg: "İstek çok büyük." });
    // Bal küpü: bot kaydını sessizce düşür
    if (String(b.website || b.hp_field || "").trim() !== "") {
      console.warn("[BOT] honeypot doldurulmuş kayıt düşürüldü (ip " + ip + ")");
      return send(res, 200, { user: { id: "u000000" } });
    }
    const email = String(b.email || "").toLowerCase().trim();
    const pass = String(b.password || "");
    if (!EMAIL_RE.test(email) || email.length > 190) return send(res, 400, { msg: "Geçerli bir e-posta adresi girin." });
    if (pass.length < 6 || pass.length > 200) return send(res, 400, { msg: "Şifre en az 6 karakter olmalıdır." });
    if (DB.users.some((x) => x.email === email)) return send(res, 400, { msg: "Bu e-posta zaten kayıtlı." });
    // Rol daima "user" — istemci gövdesindeki role/blocked alanları yok sayılır
    const usr = makeUser(email, pass, String((b.data && b.data.name) || "").slice(0, 120), String((b.data && b.data.phone) || "").slice(0, 40), "user");
    DB.users.push(usr); saveDB();
    return send(res, 200, { user: { id: usr.id } });
  }
  if (u.pathname === "/auth/v1/user" && req.method === "PUT") {
    if (!caller) return send(res, 401, { error: "unauthorized" });
    const b = await readBody(req, MAX_BODY_SMALL);
    if (b.__tooLarge) return send(res, 413, { error: "too_large" });
    if (b.password) {
      const np = String(b.password);
      if (np.length < 6 || np.length > 200) return send(res, 400, { error: "weak_password", error_description: "Şifre en az 6 karakter olmalıdır." });
      const nu = makeUser(caller.email, np, caller.name, caller.phone, caller.role);
      caller.pass = nu.pass;
      // Şifre değişince bu kullanıcının diğer oturumlarını düşür
      Object.entries(DB.tokens || {}).forEach(([tk, v]) => {
        const uid = typeof v === "string" ? v : v.uid;
        if (uid === caller.id) { delete DB.tokens[tk]; tokens.delete(tk); }
      });
      saveDB();
    }
    return send(res, 200, {});
  }

  // ---- Şifremi unuttum ----
  if (u.pathname === "/auth/v1/forgot-password" && req.method === "POST") {
    if (tooManyRequests("forgot:" + ip, 5, 60 * 60 * 1000)) return send(res, 429, { msg: "Çok fazla deneme. Bir saat sonra tekrar deneyin." });
    const b = await readBody(req, MAX_BODY_SMALL);
    const email = String(b.email || "").toLowerCase().trim();
    if (!EMAIL_RE.test(email)) return send(res, 200, { msg: "ok" });
    const usr = DB.users.find((x) => x.email === email);
    if (!usr) return send(res, 200, { msg: "ok" });
    cleanExpiredResets();
    if (!DB.resets) DB.resets = [];
    DB.resets = DB.resets.filter((r) => r.uid !== usr.id);
    const token = crypto.randomBytes(32).toString("hex");
    DB.resets.push({ uid: usr.id, token, exp: Date.now() + RESET_TTL });
    saveDB();
    const host = req.headers.host || "solararena.store";
    const proto = host.includes("localhost") ? "http" : "https";
    const link = proto + "://" + host + "/sifre-sifirla.html?token=" + token;
    const html = '<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">'
      + '<h2 style="color:#e67e22">Solar Arena - Şifre Sıfırlama</h2>'
      + '<p>Merhaba,</p>'
      + '<p>Hesabınız için bir şifre sıfırlama talebi aldık. Yeni şifrenizi belirlemek için aşağıdaki bağlantıya tıklayın:</p>'
      + '<p style="text-align:center;margin:24px 0"><a href="' + link + '" style="background:#e67e22;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold">Şifremi Sıfırla</a></p>'
      + '<p style="font-size:13px;color:#888">Bu bağlantı 30 dakika geçerlidir. Bu talebi siz yapmadıysanız bu maili dikkate almayın.</p>'
      + '<hr style="border:none;border-top:1px solid #eee;margin:24px 0">'
      + '<p style="font-size:12px;color:#aaa">Solar Arena Enerji &mdash; solararena.store</p></div>';
    smtpSend(email, "Şifre Sıfırlama - Solar Arena", html)
      .then(() => console.log("[MAIL] Şifre sıfırlama maili gönderildi: " + email))
      .catch((e) => console.error("[MAIL HATA]", e.message));
    return send(res, 200, { msg: "ok" });
  }
  if (u.pathname === "/auth/v1/reset-password" && req.method === "POST") {
    const b = await readBody(req, MAX_BODY_SMALL);
    const token = String(b.token || "").trim();
    const newPass = String(b.password || "");
    if (!token || newPass.length < 6 || newPass.length > 200) return send(res, 400, { msg: "Geçersiz istek. Şifre en az 6 karakter olmalıdır." });
    cleanExpiredResets();
    if (!DB.resets) DB.resets = [];
    const rec = DB.resets.find((r) => r.token === token);
    if (!rec) return send(res, 400, { msg: "Sıfırlama bağlantısı geçersiz veya süresi dolmuş. Lütfen yeni bir sıfırlama talebi gönderin." });
    const usr = DB.users.find((x) => x.id === rec.uid);
    if (!usr) return send(res, 400, { msg: "Kullanıcı bulunamadı." });
    const nu = makeUser(usr.email, newPass, usr.name, usr.phone, usr.role);
    usr.pass = nu.pass;
    DB.resets = DB.resets.filter((r) => r.uid !== usr.id);
    revokeUserTokens(usr.id);
    saveDB();
    return send(res, 200, { msg: "Şifreniz başarıyla değiştirildi. Giriş yapabilirsiniz." });
  }

  // ---- Mail ayarları (sadece admin) ----
  if (u.pathname === "/api/mail-settings" && req.method === "GET") {
    if (!isAdmin) return send(res, 401, { error: "unauthorized" });
    const cfg = loadMailCfg() || {};
    return send(res, 200, { host: cfg.host || "", port: cfg.port || 587, user: cfg.user || "", pass: cfg.pass ? "••••••••" : "", from: cfg.from || "" });
  }
  if (u.pathname === "/api/mail-settings" && req.method === "POST") {
    if (!isAdmin) return send(res, 401, { error: "unauthorized" });
    const b = await readBody(req, MAX_BODY_SMALL);
    const existing = loadMailCfg() || {};
    const cfg = {
      host: String(b.host || "").trim(),
      port: parseInt(b.port, 10) || 587,
      user: String(b.user || "").trim(),
      pass: (b.pass && b.pass !== "••••••••") ? String(b.pass) : (existing.pass || ""),
      from: String(b.from || "").trim()
    };
    try { fs.writeFileSync(MAIL_CFG_FILE, JSON.stringify(cfg, null, 2), "utf8"); } catch (e) { return send(res, 500, { msg: "Dosya yazılamadı: " + e.message }); }
    return send(res, 200, { msg: "Kaydedildi." });
  }
  if (u.pathname === "/api/mail-test" && req.method === "POST") {
    if (!isAdmin) return send(res, 401, { error: "unauthorized" });
    try {
      await smtpSend(caller.email, "Solar Arena - Test Maili", '<div style="font-family:sans-serif;padding:24px"><h2 style="color:#e67e22">Test Maili</h2><p>Bu mail, Solar Arena mail ayarlarının doğru yapılandırıldığını onaylar.</p><p style="color:#888;font-size:13px">Solar Arena Enerji</p></div>');
      return send(res, 200, { msg: "Test maili " + caller.email + " adresine gönderildi." });
    } catch (e) {
      return send(res, 500, { msg: "Mail gönderilemedi: " + e.message });
    }
  }

  // ---- Resim yükleme (dosya sunucuya kaydedilir) ----
  if (u.pathname === "/api/upload-image" && req.method === "POST") {
    if (!isAdmin) return send(res, 401, { error: "unauthorized" });
    const ct = req.headers["content-type"] || "";
    const bm = ct.match(/boundary=(?:"([^"]+)"|([^\s;]+))/i);
    if (!bm) return send(res, 400, { error: "multipart/form-data gerekli" });
    const boundary = "--" + (bm[1] || bm[2]);
    const MAX_IMG = 10 * 1024 * 1024;
    const chunks = [];
    let size = 0, aborted = false;
    await new Promise((resolve) => {
      req.on("data", (c) => {
        if (aborted) return;
        size += c.length;
        if (size > MAX_IMG) { aborted = true; resolve(); try { req.destroy(); } catch (_) {} return; }
        chunks.push(c);
      });
      req.on("end", resolve);
      req.on("error", resolve);
    });
    if (aborted) return send(res, 413, { error: "too_large", error_description: "Dosya çok büyük (maks. 10 MB)." });
    const raw = Buffer.concat(chunks);
    const bndBuf = Buffer.from(boundary);
    let start = -1, end = -1;
    for (let i = 0; i <= raw.length - bndBuf.length; i++) {
      if (raw.slice(i, i + bndBuf.length).equals(bndBuf)) {
        if (start === -1) start = i; else { end = i; break; }
      }
    }
    if (start === -1 || end === -1) return send(res, 400, { error: "Geçersiz multipart verisi" });
    const part = raw.slice(start + bndBuf.length + 2, end - 2);
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) return send(res, 400, { error: "Geçersiz multipart verisi" });
    const partHeaders = part.slice(0, headerEnd).toString("utf8").toLowerCase();
    const fileData = part.slice(headerEnd + 4);
    if (!fileData.length) return send(res, 400, { error: "Dosya boş" });
    const fnMatch = partHeaders.match(/filename="([^"]+)"/);
    const origName = fnMatch ? fnMatch[1].replace(/[^a-zA-Z0-9._-]/g, "_") : "img";
    const extMatch = origName.match(/\.(jpe?g|png|webp|gif|svg|avif)$/i);
    let ext = extMatch ? extMatch[0].toLowerCase() : ".jpg";
    if (ext === ".jpeg") ext = ".jpg";
    const uid = crypto.randomBytes(8).toString("hex");
    const fileName = uid + ext;
    const filePath = path.join(UPLOADS_DIR, fileName);
    try { fs.writeFileSync(filePath, fileData); } catch (e) { return send(res, 500, { error: "Dosya kaydedilemedi: " + e.message }); }
    return send(res, 200, { url: "/uploads/" + fileName });
  }

  // ---- Veri (REST) ----
  const m = u.pathname.match(/^\/rest\/v1\/(\w+)$/);
  if (!m) return send(res, 404, { error: "not found" });
  const table = m[1];
  const PUBLIC_READ = ["products", "categories", "slides", "kv"];
  const PUBLIC_INSERT = ["orders", "leads"];
  // API üzerinden erişilebilecek tablolar (tokens/users gibi iç veriler dışarıda)
  const ALLOWED_TABLES = ["products", "categories", "slides", "kv", "orders", "leads", "profiles"];
  if (!ALLOWED_TABLES.includes(table)) return send(res, 404, { error: "not found" });

  if (req.method === "GET") {
    if (table === "profiles") {
      // kullanıcı profili — kullanıcı tablosundan türetilir.
      // e-posta/engel/tarih yalnızca yöneticiye gösterilir.
      let rows = DB.users.map((x) => ({ id: x.id, role: x.role, name: x.name, phone: x.phone, email: x.email, blocked: !!x.blocked, created: x.created || 0 }));
      rows = eqFilter(rows, params);
      if (!caller) return send(res, 200, []);
      if (!isAdmin) rows = rows.filter((r) => r.id === caller.id);
      else rows.sort((a, b) => (b.created || 0) - (a.created || 0));
      return send(res, 200, rows);
    }
    if (!DB[table]) return send(res, 200, []);
    if (table === "orders") {
      if (!caller) return send(res, 200, []);
      let rows = DB.orders.slice();
      if (!isAdmin) rows = rows.filter((r) => r.email === caller.email);
      else rows = eqFilter(rows, params);
      rows.sort((a, b) => (b.created || 0) - (a.created || 0));
      return send(res, 200, rows);
    }
    if (table === "leads") {
      if (!isAdmin) return send(res, 200, []);
      const rows = DB.leads.slice().sort((a, b) => (b.created || 0) - (a.created || 0));
      return send(res, 200, rows);
    }
    if (PUBLIC_READ.includes(table)) {
      let rows = eqFilter(DB[table].slice(), params).sort((a, b) => (a.sort || 0) - (b.sort || 0));
      return send(res, 200, rows);
    }
    return send(res, 200, []);
  }

  if (req.method === "POST") {
    // Yalnızca yöneticinin yazdığı tablolarda büyük gövdeye (fotoğraf) izin ver
    const bodyLimit = (isAdmin && PUBLIC_READ.includes(table)) ? MAX_BODY : MAX_BODY_SMALL;
    const b = await readBody(req, bodyLimit);
    if (b.__tooLarge) return send(res, 413, { error: "too_large", error_description: "İstek çok büyük." });
    if (PUBLIC_READ.includes(table)) {
      if (!isAdmin) return send(res, 403, { error: "yalnızca yönetici" });
      const key = table === "kv" ? "k" : "id";
      const i = DB[table].findIndex((r) => r[key] === b[key]);
      // Birleştir: gövdede olmayan alanlar (örn. sort) korunur
      if (i >= 0) DB[table][i] = Object.assign({}, DB[table][i], b); else DB[table].push(b);
      saveDB(); return send(res, 201, null);
    }
    if (PUBLIC_INSERT.includes(table)) {
      // Anonim yazılabilen tablolar: hız sınırı + katı doğrulama
      if (tooManyRequests(table + ":" + ip, table === "orders" ? 10 : 5, 10 * 60 * 1000)) {
        return send(res, 429, { error: "too_many", error_description: "Çok fazla istek gönderdiniz. Lütfen biraz sonra tekrar deneyin." });
      }
      // Bal küpü (honeypot): gerçek kullanıcıya görünmeyen alan doldurulmuşsa
      // gönderen bir bottur. Anladığını belli etmemek için başarılı yanıt
      // döneriz ama kaydetmeyiz.
      if (String(b.website || b.hp_field || "").trim() !== "") {
        console.warn("[BOT] honeypot doldurulmuş istek düşürüldü (" + table + ", ip " + ip + ")");
        return send(res, 201, table === "orders" ? { id: "SA000000", total: 0 } : null);
      }
      const S = (v, n) => String(v == null ? "" : v).slice(0, n);
      if (table === "orders") {
        // FİYAT SUNUCUDA HESAPLANIR — istemciden gelen price/total'a güvenilmez
        const items = Array.isArray(b.items) ? b.items.slice(0, 50) : [];
        if (!items.length) return send(res, 400, { error: "empty_order" });
        let total = 0;
        const safeItems = [];
        for (const it of items) {
          const qty = Math.min(Math.max(parseInt(it.qty, 10) || 0, 1), 999);
          // Ürünü id ile, yoksa adıyla bul; fiyatı DAİMA kendi kataloğumuzdan al
          const prod = DB.products.find((p) => (it.id && p.id === it.id)) ||
                       DB.products.find((p) => p.name === it.name);
          if (!prod) return send(res, 400, { error: "unknown_product", error_description: "Sepette geçersiz ürün var." });
          const price = Number(prod.price) || 0;
          total += price * qty;
          safeItems.push({ id: prod.id, name: prod.name, qty, price });
        }
        const row = {
          id: "SA" + crypto.randomBytes(5).toString("hex").toUpperCase(), // sipariş no sunucuda üretilir
          customer: S(b.customer, 120), phone: S(b.phone, 40),
          email: caller ? caller.email : S(b.email, 190),   // giriş yapılmışsa oturum e-postası esas
          city: S(b.city, 80), address: S(b.address, 400),
          payment: "eft", status: "Havale/EFT bekleniyor",
          items: safeItems, total, created: Date.now()
        };
        if (!row.customer || !row.phone || !row.address) return send(res, 400, { error: "missing_fields", error_description: "Ad, telefon ve adres zorunludur." });
        DB.orders.push(row); saveDB();
        return send(res, 201, { id: row.id, total: row.total });
      }
      // leads (iletişim formu)
      const lead = {
        id: "l" + crypto.randomBytes(5).toString("hex"),
        name: S(b.name, 120), phone: S(b.phone, 40), city: S(b.city, 80),
        type: S(b.type, 80), message: S(b.message, 2000), created: Date.now()
      };
      if (!lead.name || !lead.phone) return send(res, 400, { error: "missing_fields" });
      DB.leads.push(lead); saveDB(); return send(res, 201, null);
    }
    if (table === "profiles") {
      if (!caller) return send(res, 401, {});
      Object.assign(caller, { name: b.name != null ? b.name : caller.name, phone: b.phone != null ? b.phone : caller.phone });
      saveDB(); return send(res, 201, null);
    }
    return send(res, 403, { error: "izin yok" });
  }

  if (req.method === "PATCH") {
    const b = await readBody(req, isAdmin ? MAX_BODY : MAX_BODY_SMALL);
    if (b.__tooLarge) return send(res, 413, { error: "too_large" });
    if (table === "profiles") {
      if (!caller) return send(res, 401, {});
      const idf = params.get("id");
      // Yönetici, id ile başka bir kullanıcının rol/engel/bilgilerini değiştirebilir
      if (idf && isAdmin) {
        const id = decodeURIComponent(idf.replace(/^eq\./, ""));
        const target = DB.users.find((x) => x.id === id);
        if (target && target.id !== caller.id) {
          if (b.role != null) { target.role = b.role === "admin" ? "admin" : "user"; revokeUserTokens(target.id); }
          if (b.blocked != null) { target.blocked = !!b.blocked; if (target.blocked) revokeUserTokens(target.id); }
          if (b.name != null) target.name = String(b.name).slice(0, 120);
          if (b.phone != null) target.phone = String(b.phone).slice(0, 40);
        }
        saveDB(); return send(res, 204, null);
      }
      // Aksi halde yalnızca kendi profilini günceller (rol/engel değiştirilemez)
      if (b.name != null) caller.name = String(b.name).slice(0, 120);
      if (b.phone != null) caller.phone = String(b.phone).slice(0, 40);
      saveDB(); return send(res, 204, null);
    }
    if (PUBLIC_READ.includes(table)) {
      if (!isAdmin) return send(res, 403, {});
      const idf = params.get("id"); const id = idf ? decodeURIComponent(idf.replace("eq.", "")) : null;
      const row = DB[table].find((r) => String(r.id) === id);
      if (row) Object.assign(row, b);
      saveDB(); return send(res, 204, null);
    }
    return send(res, 403, {});
  }

  if (req.method === "DELETE") {
    if (!isAdmin) return send(res, 403, {});
    const idf = params.get("id"); const id = idf ? decodeURIComponent(idf.replace("eq.", "")) : null;
    if (table === "profiles") {
      // yönetici kendi hesabını silemez
      if (id && id !== caller.id) { DB.users = DB.users.filter((x) => x.id !== id); revokeUserTokens(id); }
      saveDB(); return send(res, 204, null);
    }
    if (DB[table]) DB[table] = DB[table].filter((r) => String(r.id) !== id);
    saveDB(); return send(res, 204, null);
  }

  return send(res, 405, { error: "method" });
}

// -------------------- Sunucu --------------------
loadDB();
const server = http.createServer({
  // Zaman aşımı denetimi sık yapılsın (varsayılan 30 sn çok geç kalıyor)
  connectionsCheckingInterval: 2 * 1000,
  headersTimeout: 10 * 1000,
  requestTimeout: 60 * 1000,
  keepAliveTimeout: 15 * 1000,
  maxHeaderSize: 16 * 1024
}, async (req, res) => {
  let u;
  try { u = new URL(req.url, "http://x"); }
  catch (_) { send(res, 400, { error: "bad request" }); return; }

  // Yalnızca beklenen HTTP metotları
  if (!["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"].includes(req.method)) {
    send(res, 405, { error: "method" }); return;
  }
  // Bot / saldırı filtresi
  if (botGate(req, res, u)) return;

  if (u.pathname.startsWith("/rest/v1/") || u.pathname.startsWith("/auth/v1/") || u.pathname.startsWith("/api/")) {
    try { await handleApi(req, res, u); }
    catch (e) { console.error(e); send(res, 500, { error: "server" }); }
  } else {
    serveStatic(req, res);
  }
});

// Yavaş bağlantı (slowloris) ve takılı soket koruması
server.headersTimeout = 10 * 1000;   // başlıklar 10 sn içinde tamamlanmalı
server.requestTimeout = 60 * 1000;   // istek en fazla 60 sn sürebilir
server.keepAliveTimeout = 15 * 1000;
server.timeout = 90 * 1000;          // hareketsiz soketi kapat
server.maxHeadersCount = 100;
// Node zaman aşımlarını varsayılan 30 sn yerine 2 sn'de bir denetlesin,
// böylece yarım bırakılmış bağlantılar hızla düşer.
server.connectionsCheckingInterval = 2 * 1000;
// Eşzamanlı bağlantı tavanı (bağlantı taşırma saldırısı)
server.maxConnections = 512;
server.on("clientError", (err, socket) => {
  if (socket.writable) socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
});

// Beklenmedik hata sunucuyu düşürmesin
process.on("uncaughtException", (e) => console.error("[HATA]", e && e.message ? e.message : e));
process.on("unhandledRejection", (e) => console.error("[HATA]", e && e.message ? e.message : e));

server.listen(PORT, HOST, () => {
  console.log("Solar Arena sunucusu çalışıyor:  http://localhost:" + PORT);
  console.log("Veri dosyası: " + DATA_FILE);
  console.log("Bot koruması: AÇIK (hız sınırı, tarama tespiti, saldırı aracı filtresi, bal küpü)");
  console.log("Dinlenen adres: " + HOST + (HOST === "127.0.0.1"
    ? "  (yalnızca yerel — dışarıya Cloudflare Tunnel üzerinden açılır)"
    : "  ⚠ TÜM AĞ ARAYÜZLERİ — güvenlik duvarı kurallarınızı kontrol edin!"));
  console.log("İzin verilen alan adları: " + ALLOWED_HOSTS.join(", ") + ", localhost");
});
