// ============================================================
// Quantora Solar — Kendi sunucunuz için tek dosyalık backend
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

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "data.json");

// -------------------- Varsayılan tohum verisi --------------------
const SEED = {
  products: [
    { id: "pnl-460", cat: "panel", img: "panel", photo: "", name: "460W Half-Cut Monokristal Güneş Paneli", specs: ["120 hücre · %21,3 verim", "Çerçeve: eloksallı alüminyum, IP68 bağlantı kutusu", "25 yıl performans garantisi"], price: 4850, stock: 25, hit: true, sort: 0 },
    { id: "pnl-550", cat: "panel", img: "panel", photo: "", name: "550W Monokristal Güneş Paneli", specs: ["144 hücre · %21,7 verim", "Çift cam (bifacial) teknoloji", "30 yıl performans garantisi"], price: 5950, stock: 18, hit: true, sort: 1 },
    { id: "pnl-flx", cat: "panel", img: "flex", photo: "", name: "285W Esnek Güneş Paneli", specs: ["Karavan, tekne ve tiny house için", "Yarı esnek ETFE yüzey", "Sadece 4,8 kg"], price: 6750, stock: 4, hit: false, sort: 2 },
    { id: "inv-5g", cat: "inverter", img: "inverter", photo: "", name: "5 kW On-Grid İnvertör (Monofaze)", specs: ["2 MPPT girişi", "Wi-Fi izleme modülü dahil", "5 yıl garanti"], price: 38500, stock: 9, hit: false, sort: 3 },
    { id: "inv-6h", cat: "inverter", img: "inverter", photo: "", name: "6 kW Hibrit İnvertör 48V", specs: ["120A MPPT şarj kontrollü", "Şebeke + akü + jeneratör girişi", "Paralellenebilir (9 adede kadar)"], price: 52900, stock: 7, hit: true, sort: 4 },
    { id: "inv-3s", cat: "inverter", img: "inverter", photo: "", name: "3 kW Tam Sinüs İnvertör 24V", specs: ["Off-grid kullanım için", "LCD ekran, USB çıkış", "Düşük bekleme tüketimi"], price: 14750, stock: 14, hit: false, sort: 5 },
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
    { id: "aksesuar", name: "Aksesuarlar", sort: 4 }
  ],
  slides: [
    { id: "sl1", image: "", art: "roof", title: "Güneş Enerjisinde Türkiye'nin Her Yerine Gönderim", subtitle: "Panel, invertör, akü ve hazır paketler stoktan — siparişiniz aynı gün kargoda.", btnText: "Ürünleri İncele", btnLink: "urunler.html", sort: 0 },
    { id: "sl2", image: "", art: "field", title: "Yüksek Verimli Monokristal Paneller", subtitle: "%21+ verim, 25 yıla varan garanti. Ev, işyeri ve tarım için uygun çözümler.", btnText: "Panelleri Gör", btnLink: "urunler.html", sort: 1 },
    { id: "sl3", image: "", art: "carport", title: "Karavan ve Bağ Evi Solar Paketleri", subtitle: "Şebekeden bağımsız, kur-kullan hazır sistemler. Montaj kılavuzu ve destek dahil.", btnText: "Paketleri Gör", btnLink: "urunler.html", sort: 2 }
  ],
  kv: [
    { k: "site", v: { phone: "0850 000 00 00", email: "info@quantorasolar.com.tr", address: "Örnek Mah. Enerji Cad. No:1, Ankara", hours: "Hafta içi 09:00 - 18:00, Cumartesi 10:00 - 15:00", topNote: "Türkiye'nin her yerine hızlı gönderim", footerAbout: "Temiz enerjiyle daha aydınlık bir gelecek için 12 yıldır çalışıyoruz.", footerCopyright: "© 2026 Quantora Solar Enerji" } },
    { k: "settings", v: { whatsapp: "908500000000" } }
  ],
  orders: [],
  leads: [],
  users: []
};

// -------------------- Veri yükle / kaydet --------------------
let DB;
function loadDB() {
  try { DB = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch (_) { DB = JSON.parse(JSON.stringify(SEED)); }
  ["products", "categories", "slides", "kv", "orders", "leads", "users"].forEach((t) => { if (!DB[t]) DB[t] = []; });

  // Oturum jetonlarını yeniden başlatmada koru (yoksa admin her yeniden
  // başlatmada oturumdan düşer ve kullanıcı/sipariş listeleri boş görünür).
  if (!DB.tokens) DB.tokens = {};
  Object.entries(DB.tokens).forEach(([tk, uid]) => tokens.set(tk, uid));

  // İlk kurulumda varsayılan yönetici hesabı
  if (!DB.users.some((u) => u.role === "admin")) {
    DB.users.push(makeUser("admin@quantorasolar.com.tr", "admin123", "Site Yöneticisi", "", "admin"));
    saveDB();
    console.log("→ Varsayılan yönetici: admin@quantorasolar.com.tr / admin123 (giriş sonrası şifreyi değiştirin)");
  }
}
let saveTimer = null;
function saveDB() {
  // atomik yazma: önce geçici dosya, sonra taşı
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(DB));
  fs.renameSync(tmp, DATA_FILE);
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
const tokens = new Map(); // token -> userId
function userFromReq(req) {
  const auth = req.headers["authorization"] || "";
  const tk = auth.replace(/^Bearer\s+/i, "");
  const uid = tokens.get(tk);
  return uid ? DB.users.find((u) => u.id === uid) : null;
}

// -------------------- Yardımcılar --------------------
function send(res, code, obj, headers) {
  res.writeHead(code, Object.assign({ "Content-Type": "application/json; charset=utf-8" }, headers || {}));
  res.end(obj == null ? "" : JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((r) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => { try { r(d ? JSON.parse(d) : {}); } catch (_) { r({}); } }); });
}
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
const BLOCKED = new Set(["/data.json", "/server.js"]);
function serveStatic(req, res) {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/") p = "/index.html";
  if (BLOCKED.has(p) || p.includes("..")) { send(res, 403, { error: "forbidden" }); return; }
  const file = path.join(ROOT, p);
  fs.readFile(file, (err, data) => {
    if (err) { send(res, 404, { error: "not found" }); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
    res.end(data);
  });
}

// -------------------- API (PostgREST + GoTrue alt kümesi) --------------------
async function handleApi(req, res, u) {
  const params = u.searchParams;
  const caller = userFromReq(req);
  const isAdmin = caller && caller.role === "admin";

  // ---- Kimlik doğrulama ----
  if (u.pathname === "/auth/v1/token") {
    const b = await readBody(req);
    const usr = DB.users.find((x) => x.email === (b.email || "").toLowerCase());
    if (!usr || !checkPass(b.password || "", usr.pass)) return send(res, 400, { error: "invalid_grant", error_description: "Hatalı giriş" });
    if (usr.blocked) return send(res, 400, { error: "blocked", error_description: "Bu hesap engellenmiş." });
    const tk = crypto.randomBytes(24).toString("hex");
    tokens.set(tk, usr.id);
    if (!DB.tokens) DB.tokens = {};
    DB.tokens[tk] = usr.id; saveDB();  // yeniden başlatmada oturum korunur
    return send(res, 200, { access_token: tk, token_type: "bearer", user: { id: usr.id, email: usr.email, user_metadata: { name: usr.name, phone: usr.phone } } });
  }
  if (u.pathname === "/auth/v1/signup") {
    const b = await readBody(req);
    const email = (b.email || "").toLowerCase();
    if (DB.users.some((x) => x.email === email)) return send(res, 400, { msg: "Bu e-posta zaten kayıtlı." });
    const usr = makeUser(email, b.password || "", (b.data && b.data.name) || "", (b.data && b.data.phone) || "", "user");
    DB.users.push(usr); saveDB();
    return send(res, 200, { user: { id: usr.id } });
  }
  if (u.pathname === "/auth/v1/user" && req.method === "PUT") {
    if (!caller) return send(res, 401, { error: "unauthorized" });
    const b = await readBody(req);
    if (b.password) { const nu = makeUser(caller.email, b.password, caller.name, caller.phone, caller.role); caller.pass = nu.pass; saveDB(); }
    return send(res, 200, {});
  }

  // ---- Veri (REST) ----
  const m = u.pathname.match(/^\/rest\/v1\/(\w+)$/);
  if (!m) return send(res, 404, { error: "not found" });
  const table = m[1];
  const PUBLIC_READ = ["products", "categories", "slides", "kv"];
  const PUBLIC_INSERT = ["orders", "leads"];

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
    const b = await readBody(req);
    if (PUBLIC_READ.includes(table)) {
      if (!isAdmin) return send(res, 403, { error: "yalnızca yönetici" });
      const key = table === "kv" ? "k" : "id";
      const i = DB[table].findIndex((r) => r[key] === b[key]);
      if (i >= 0) DB[table][i] = b; else DB[table].push(b);
      saveDB(); return send(res, 201, null);
    }
    if (PUBLIC_INSERT.includes(table)) {
      DB[table].push(b); saveDB(); return send(res, 201, null);
    }
    if (table === "profiles") {
      if (!caller) return send(res, 401, {});
      Object.assign(caller, { name: b.name != null ? b.name : caller.name, phone: b.phone != null ? b.phone : caller.phone });
      saveDB(); return send(res, 201, null);
    }
    return send(res, 403, { error: "izin yok" });
  }

  if (req.method === "PATCH") {
    const b = await readBody(req);
    if (table === "profiles") {
      if (!caller) return send(res, 401, {});
      const idf = params.get("id");
      // Yönetici, id ile başka bir kullanıcının rol/engel/bilgilerini değiştirebilir
      if (idf && isAdmin) {
        const id = decodeURIComponent(idf.replace(/^eq\./, ""));
        const target = DB.users.find((x) => x.id === id);
        if (target && target.id !== caller.id) {
          if (b.role != null) target.role = b.role;
          if (b.blocked != null) target.blocked = !!b.blocked;
          if (b.name != null) target.name = b.name;
          if (b.phone != null) target.phone = b.phone;
        }
        saveDB(); return send(res, 204, null);
      }
      // Aksi halde yalnızca kendi profilini günceller
      if (b.name != null) caller.name = b.name;
      if (b.phone != null) caller.phone = b.phone;
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
      if (id && id !== caller.id) DB.users = DB.users.filter((x) => x.id !== id);
      saveDB(); return send(res, 204, null);
    }
    if (DB[table]) DB[table] = DB[table].filter((r) => String(r.id) !== id);
    saveDB(); return send(res, 204, null);
  }

  return send(res, 405, { error: "method" });
}

// -------------------- Sunucu --------------------
loadDB();
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname.startsWith("/rest/v1/") || u.pathname.startsWith("/auth/v1/")) {
    try { await handleApi(req, res, u); }
    catch (e) { console.error(e); send(res, 500, { error: "server" }); }
  } else {
    serveStatic(req, res);
  }
}).listen(PORT, () => {
  console.log("Quantora Solar sunucusu çalışıyor:  http://localhost:" + PORT);
  console.log("Veri dosyası: " + DATA_FILE);
});
