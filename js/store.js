// ============================================================
// VERİ KATMANI
// Şimdilik tüm veriler tarayıcıda (localStorage) tutulur.
// Sunucuya bağlarken SADECE bu dosyadaki fonksiyonları
// fetch() ile API çağrılarına çevirmeniz yeterlidir.
// ============================================================

const Store = (() => {
  const read = (key, fallback) => {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v === null || v === undefined ? fallback : v;
    } catch (_) {
      return fallback;
    }
  };
  const write = (key, val) => localStorage.setItem(key, JSON.stringify(val));

  // ---------- ÜRÜNLER ----------
  const DEFAULT_PRODUCTS = [
    {
      id: "pnl-460", hit: true, cat: "panel", img: "panel",
      name: "460W Half-Cut Monokristal Güneş Paneli",
      specs: ["120 hücre · %21,3 verim", "Çerçeve: eloksallı alüminyum, IP68 bağlantı kutusu", "25 yıl performans garantisi"],
      price: 4850, stock: 25
    },
    {
      id: "pnl-550", hit: true, cat: "panel", img: "panel",
      name: "550W Monokristal Güneş Paneli",
      specs: ["144 hücre · %21,7 verim", "Çift cam (bifacial) teknoloji", "30 yıl performans garantisi"],
      price: 5950, stock: 18
    },
    {
      id: "pnl-flx", cat: "panel", img: "flex",
      name: "285W Esnek Güneş Paneli",
      specs: ["Karavan, tekne ve tiny house için", "Yarı esnek ETFE yüzey", "Sadece 4,8 kg"],
      price: 6750, stock: 4
    },
    {
      id: "inv-5g", cat: "inverter", img: "inverter",
      name: "5 kW On-Grid İnvertör (Monofaze)",
      specs: ["2 MPPT girişi", "Wi-Fi izleme modülü dahil", "5 yıl garanti"],
      price: 38500, stock: 9
    },
    {
      id: "inv-6h", hit: true, cat: "inverter", img: "inverter",
      name: "6 kW Hibrit İnvertör 48V",
      specs: ["120A MPPT şarj kontrollü", "Şebeke + akü + jeneratör girişi", "Paralellenebilir (9 adede kadar)"],
      price: 52900, stock: 7
    },
    {
      id: "inv-3s", cat: "inverter", img: "inverter",
      name: "3 kW Tam Sinüs İnvertör 24V",
      specs: ["Off-grid kullanım için", "LCD ekran, USB çıkış", "Düşük bekleme tüketimi"],
      price: 14750, stock: 14
    },
    {
      id: "aku-lfp", hit: true, cat: "aku", img: "battery",
      name: "48V 100Ah LiFePO4 Lityum Akü",
      specs: ["5,12 kWh kapasite", "6.000+ çevrim ömrü", "Dahili BMS, Bluetooth takip"],
      price: 58900, stock: 6
    },
    {
      id: "aku-jel", cat: "aku", img: "battery",
      name: "12V 150Ah Derin Döngü Jel Akü",
      specs: ["Bakım gerektirmez", "Solar sistemler için optimize", "2 yıl garanti"],
      price: 9850, stock: 22
    },
    {
      id: "kit-krv", hit: true, cat: "paket", img: "kit",
      name: "Karavan Solar Paketi 410W",
      specs: ["410W panel + 30A MPPT regülatör", "Kablolama ve montaj aparatları dahil", "Kurulum şeması ile birlikte"],
      price: 32500, stock: 3
    },
    {
      id: "kit-bag", cat: "paket", img: "kit",
      name: "Bağ Evi Off-Grid Paketi 3 kW",
      specs: ["4 × 460W panel + 3 kW invertör", "12V 150Ah × 2 jel akü", "Telefonla kurulum desteği"],
      price: 94500, stock: 5
    },
    {
      id: "aks-mppt", cat: "aksesuar", img: "controller",
      name: "30A MPPT Şarj Kontrol Cihazı 12/24V",
      specs: ["LCD ekran, otomatik voltaj seçimi", "Aşırı şarj ve kısa devre koruması", "2 yıl garanti"],
      price: 4250, stock: 16
    },
    {
      id: "aks-lamba", hit: true, cat: "aksesuar", img: "streetlight",
      name: "Solar Sokak / Bahçe Lambası 100W",
      specs: ["Dahili panel ve lityum batarya", "Alacakaranlık sensörü, kumandalı", "IP65 dış mekan koruması"],
      price: 3980, stock: 12
    },
    {
      id: "aks-montaj", cat: "aksesuar", img: "mount",
      name: "Çatı Montaj Konstrüksiyon Seti (10 Panel)",
      specs: ["Eloksallı alüminyum ray ve kelepçeler", "Kiremit ve sac çatıya uygun", "Paslanmaz bağlantı elemanları"],
      price: 7500, stock: 9
    },
    {
      id: "aks-kablo", cat: "aksesuar", img: "cable",
      name: "6mm² Solar Kablo 50m + MC4 Konnektör Seti",
      specs: ["UV dayanımlı çift izolasyon", "2 çift MC4 konnektör dahil", "TSE belgeli"],
      price: 2450, stock: 30
    }
  ];

  // ---------- KATEGORİLER ----------
  const DEFAULT_CATEGORIES = [
    { id: "panel", name: "Güneş Panelleri" },
    { id: "inverter", name: "İnvertörler" },
    { id: "aku", name: "Aküler" },
    { id: "paket", name: "Hazır Paketler" },
    { id: "aksesuar", name: "Aksesuarlar" }
  ];

  function getCategories() {
    let cats = read("gp-cats", null);
    if (!cats) {
      cats = DEFAULT_CATEGORIES;
      write("gp-cats", cats);
    }
    return cats;
  }

  function saveCategory(cat) {
    const cats = getCategories();
    if (cat.id) {
      const existing = cats.find((c) => c.id === cat.id);
      if (existing) existing.name = cat.name.trim();
    } else {
      cats.push({ id: "c-" + Date.now(), name: cat.name.trim() });
    }
    write("gp-cats", cats);
  }

  function deleteCategory(id) {
    write("gp-cats", getCategories().filter((c) => c.id !== id));
  }

  // ---------- VİTRİN / SLİDER ----------
  // Ana sayfadaki kayan showroom görselleri. Admin panelinden yönetilir.
  const DEFAULT_SLIDES = [
    {
      id: "sl1", image: "", art: "roof",
      title: "Güneş Enerjisinde Türkiye'nin Her Yerine Gönderim",
      subtitle: "Panel, invertör, akü ve hazır paketler stoktan — siparişiniz aynı gün kargoda.",
      btnText: "Ürünleri İncele", btnLink: "urunler.html"
    },
    {
      id: "sl2", image: "", art: "field",
      title: "Yüksek Verimli Monokristal Paneller",
      subtitle: "%21+ verim, 25 yıla varan garanti. Ev, işyeri ve tarım için uygun çözümler.",
      btnText: "Panelleri Gör", btnLink: "urunler.html"
    },
    {
      id: "sl3", image: "", art: "carport",
      title: "Karavan ve Bağ Evi Solar Paketleri",
      subtitle: "Şebekeden bağımsız, kur-kullan hazır sistemler. Montaj kılavuzu ve destek dahil.",
      btnText: "Paketleri Gör", btnLink: "urunler.html"
    }
  ];

  function getSlides() {
    let slides = read("gp-slides", null);
    if (!slides) {
      slides = DEFAULT_SLIDES;
      write("gp-slides", slides);
    }
    return slides;
  }

  function saveSlide(slide) {
    const slides = getSlides();
    if (slide.id) {
      const i = slides.findIndex((s) => s.id === slide.id);
      if (i >= 0) { slides[i] = slide; write("gp-slides", slides); return; }
    }
    slide.id = "sl-" + Date.now();
    slides.push(slide);
    write("gp-slides", slides);
  }

  function deleteSlide(id) {
    write("gp-slides", getSlides().filter((s) => s.id !== id));
  }

  function moveSlide(id, dir) {
    const slides = getSlides();
    const i = slides.findIndex((s) => s.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= slides.length) return;
    [slides[i], slides[j]] = [slides[j], slides[i]];
    write("gp-slides", slides);
  }

  // Varsayılan ürün listesine yeni ürünler eklendiğinde bu sürümü artırın;
  // mevcut tarayıcılardaki listelere yalnızca eksik olanlar eklenir.
  const SEED_VERSION = 3;

  function getProducts() {
    let list = read("gp-products", null);
    if (!list) {
      list = DEFAULT_PRODUCTS;
      write("gp-products", list);
      write("gp-seed", SEED_VERSION);
      return list;
    }
    if (read("gp-seed", 1) < SEED_VERSION) {
      const ids = new Set(list.map((p) => p.id));
      DEFAULT_PRODUCTS.forEach((p) => {
        if (!ids.has(p.id)) list.push(p);
      });
      // Eski depolardan gelen ürünlere varsayılan "çok satan" işaretlerini uygula
      list.forEach((p) => {
        const d = DEFAULT_PRODUCTS.find((x) => x.id === p.id);
        if (d && d.hit && p.hit === undefined) p.hit = true;
      });
      write("gp-products", list);
      write("gp-seed", SEED_VERSION);
    }
    return list;
  }

  function saveProduct(product) {
    const list = getProducts();
    const i = list.findIndex((p) => p.id === product.id);
    if (i >= 0) list[i] = product;
    else list.unshift(product);
    write("gp-products", list);
  }

  function deleteProduct(id) {
    write("gp-products", getProducts().filter((p) => p.id !== id));
  }

  // ---------- KULLANICILAR & OTURUM ----------
  // NOT: Şifreler demo amaçlı basitçe kodlanır. Gerçek sistemde şifre
  // doğrulama sunucuda (bcrypt vb. ile) yapılmalıdır.
  const hash = (s) => btoa(unescape(encodeURIComponent("gp$" + s)));

  function getUsers() {
    let users = read("gp-users", null);
    if (!users) {
      users = [{
        name: "Site Yöneticisi",
        email: "admin@quantorasolar.com.tr",
        phone: "",
        pass: hash("admin123"),
        role: "admin",
        created: Date.now()
      }];
      write("gp-users", users);
    }
    return users;
  }

  function register({ name, email, phone, pass }) {
    const users = getUsers();
    email = email.trim().toLowerCase();
    if (users.some((u) => u.email === email)) {
      return { ok: false, error: "Bu e-posta ile kayıtlı bir hesap zaten var." };
    }
    users.push({ name: name.trim(), email, phone: phone.trim(), pass: hash(pass), role: "user", created: Date.now() });
    write("gp-users", users);
    return { ok: true };
  }

  function login(email, pass) {
    email = email.trim().toLowerCase();
    const user = getUsers().find((u) => u.email === email && u.pass === hash(pass));
    if (!user) return { ok: false, error: "E-posta veya şifre hatalı." };
    const session = { name: user.name, email: user.email, role: user.role };
    write("gp-session", session);
    return { ok: true, session };
  }

  function logout() {
    localStorage.removeItem("gp-session");
  }

  function session() {
    return read("gp-session", null);
  }

  function getUser(email) {
    const u = getUsers().find((x) => x.email === email);
    return u ? { name: u.name, email: u.email, phone: u.phone || "" } : null;
  }

  function updateProfile(email, data) {
    const users = getUsers();
    const u = users.find((x) => x.email === email);
    if (!u) return { ok: false, error: "Kullanıcı bulunamadı." };
    if (data.name && data.name.trim()) u.name = data.name.trim();
    u.phone = (data.phone || "").trim();
    write("gp-users", users);
    const s = session();
    if (s && s.email === email) {
      s.name = u.name;
      write("gp-session", s);
    }
    return { ok: true };
  }

  function changePassword(email, oldPass, newPass) {
    const users = getUsers();
    const u = users.find((x) => x.email === email && x.pass === hash(oldPass));
    if (!u) return { ok: false, error: "Mevcut şifreniz hatalı." };
    u.pass = hash(newPass);
    write("gp-users", users);
    return { ok: true };
  }

  // ---------- KEŞİF TALEPLERİ (İLETİŞİM FORMU) ----------
  function addLead(lead) {
    const leads = read("gp-leads", []);
    leads.unshift({ ...lead, date: Date.now() });
    write("gp-leads", leads);
  }

  function getLeads() {
    return read("gp-leads", []);
  }

  function deleteLead(index) {
    const leads = getLeads();
    leads.splice(index, 1);
    write("gp-leads", leads);
  }

  // ---------- SİPARİŞLER ----------
  function addOrder(order) {
    const orders = read("gp-orders", []);
    orders.unshift({ ...order, date: Date.now() });
    write("gp-orders", orders);
  }

  function getOrders() {
    return read("gp-orders", []);
  }

  function getOrdersByEmail(email) {
    return getOrders().filter((o) => o.email === email);
  }

  // ---------- ÖDEME (PayTR) ----------
  // PayTR entegrasyonu bağlandığında bu fonksiyon sunucunuzdan iframe
  // token'ı isteyecek ve müşteriyi PayTR ödeme sayfasına yönlendirecek.
  // Şimdilik simülasyon yanıtı döner; sipariş "ödeme bekliyor" olarak
  // kaydedilir.
  function startCardPayment(order) {
    return {
      ok: true,
      message: "Kart ödeme sayfası PayTR entegrasyonu tamamlandığında burada açılacaktır."
    };
  }

  // ---------- AYARLAR ----------
  function getSettings() {
    return read("gp-settings", { whatsapp: "908500000000" });
  }

  function saveSettings(settings) {
    write("gp-settings", { ...getSettings(), ...settings });
  }

  return {
    getProducts, saveProduct, deleteProduct,
    getCategories, saveCategory, deleteCategory,
    getSlides, saveSlide, deleteSlide, moveSlide,
    register, login, logout, session,
    getUser, updateProfile, changePassword,
    addLead, getLeads, deleteLead,
    addOrder, getOrders, getOrdersByEmail,
    startCardPayment,
    getSettings, saveSettings
  };
})();

// ---- Vitrin slayt görselleri (SVG sahneler) ----
// Kullanıcı kendi fotoğrafını yükleyene kadar varsayılan olarak gösterilir.
const SLIDE_ART = {
  roof: `
    <svg viewBox="0 0 1200 460" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="skRoof" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#bfe0f2"/><stop offset="1" stop-color="#e9f4fb"/></linearGradient></defs>
      <rect width="1200" height="330" fill="url(#skRoof)"/>
      <circle cx="1000" cy="90" r="52" fill="#ffd24d"/>
      <g stroke="#ffd24d" stroke-width="7" stroke-linecap="round">
        <line x1="1000" y1="8" x2="1000" y2="26"/><line x1="1000" y1="154" x2="1000" y2="172"/>
        <line x1="918" y1="90" x2="936" y2="90"/><line x1="1064" y1="90" x2="1082" y2="90"/></g>
      <rect y="330" width="1200" height="130" fill="#9ab97e"/>
      <polygon points="250,330 560,150 870,330" fill="#7a4a2b"/>
      <rect x="330" y="330" width="460" height="110" fill="#e6d8c2"/>
      <rect x="520" y="360" width="80" height="80" fill="#6b4a2f"/>
      <rect x="380" y="356" width="60" height="46" fill="#9cc3de"/>
      <rect x="680" y="356" width="60" height="46" fill="#9cc3de"/>
      <g transform="rotate(-30.2 560 240)">
        <rect x="360" y="205" width="90" height="60" fill="#123f66" stroke="#0a2138" stroke-width="3"/>
        <rect x="456" y="205" width="90" height="60" fill="#174a75" stroke="#0a2138" stroke-width="3"/>
        <rect x="552" y="205" width="90" height="60" fill="#123f66" stroke="#0a2138" stroke-width="3"/>
        <rect x="648" y="205" width="90" height="60" fill="#174a75" stroke="#0a2138" stroke-width="3"/>
      </g>
    </svg>`,
  field: `
    <svg viewBox="0 0 1200 460" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="skField" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#cfe6f5"/><stop offset="1" stop-color="#eef7fc"/></linearGradient></defs>
      <rect width="1200" height="300" fill="url(#skField)"/>
      <circle cx="150" cy="90" r="46" fill="#ffd24d"/>
      <path d="M0 300 Q300 262 600 292 T1200 280 V460 H0 Z" fill="#9cb87e"/>
      <g>
        <rect x="70" y="300" width="150" height="52" fill="#123f66" stroke="#0a2138" stroke-width="4" transform="skewX(-15)"/>
        <rect x="270" y="300" width="150" height="52" fill="#174a75" stroke="#0a2138" stroke-width="4" transform="skewX(-15)"/>
        <rect x="470" y="300" width="150" height="52" fill="#123f66" stroke="#0a2138" stroke-width="4" transform="skewX(-15)"/>
        <rect x="670" y="300" width="150" height="52" fill="#174a75" stroke="#0a2138" stroke-width="4" transform="skewX(-15)"/>
        <rect x="180" y="372" width="150" height="52" fill="#174a75" stroke="#0a2138" stroke-width="4" transform="skewX(-15)"/>
        <rect x="380" y="372" width="150" height="52" fill="#123f66" stroke="#0a2138" stroke-width="4" transform="skewX(-15)"/>
        <rect x="580" y="372" width="150" height="52" fill="#174a75" stroke="#0a2138" stroke-width="4" transform="skewX(-15)"/>
        <rect x="780" y="372" width="150" height="52" fill="#123f66" stroke="#0a2138" stroke-width="4" transform="skewX(-15)"/>
      </g>
    </svg>`,
  carport: `
    <svg viewBox="0 0 1200 460" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="skCar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#c6def0"/><stop offset="1" stop-color="#eaf4fb"/></linearGradient></defs>
      <rect width="1200" height="330" fill="url(#skCar)"/>
      <circle cx="1010" cy="86" r="48" fill="#ffd24d"/>
      <rect y="330" width="1200" height="130" fill="#9a9a94"/>
      <g stroke="#fff" stroke-width="4" stroke-dasharray="26 22"><line x1="0" y1="404" x2="1200" y2="404"/></g>
      <rect x="250" y="230" width="16" height="120" fill="#5b6770"/>
      <rect x="900" y="230" width="16" height="120" fill="#5b6770"/>
      <g transform="rotate(-6 600 200)">
        <rect x="180" y="182" width="760" height="16" fill="#8395a5"/>
        <rect x="200" y="140" width="170" height="42" fill="#123f66" stroke="#0a2138" stroke-width="3"/>
        <rect x="380" y="140" width="170" height="42" fill="#174a75" stroke="#0a2138" stroke-width="3"/>
        <rect x="560" y="140" width="170" height="42" fill="#123f66" stroke="#0a2138" stroke-width="3"/>
        <rect x="740" y="140" width="170" height="42" fill="#174a75" stroke="#0a2138" stroke-width="3"/>
      </g>
      <g>
        <rect x="470" y="300" width="240" height="54" rx="16" fill="#b03a2e"/>
        <path d="M508 300 q30 -34 84 -34 h44 q46 0 66 34 Z" fill="#c0453a"/>
        <rect x="536" y="276" width="64" height="26" rx="5" fill="#d9e8f2"/>
        <circle cx="516" cy="354" r="22" fill="#2c3640"/><circle cx="664" cy="354" r="22" fill="#2c3640"/>
      </g>
    </svg>`
};

// ---- Ürün görselleri (SVG) ----
// Mağaza, sepet ve admin önizlemesi ortak kullanır.
const PRODUCT_ART = {
  panel: `
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="10" width="124" height="86" rx="5" fill="#123f66" stroke="#0c2d4a" stroke-width="3"/>
      <g stroke="#3d719c" stroke-width="2">
        <line x1="18" y1="39" x2="142" y2="39"/><line x1="18" y1="68" x2="142" y2="68"/>
        <line x1="49" y1="10" x2="49" y2="96"/><line x1="80" y1="10" x2="80" y2="96"/><line x1="111" y1="10" x2="111" y2="96"/>
      </g>
      <rect x="24" y="16" width="18" height="16" rx="2" fill="#ffffff" opacity="0.18"/>
      <rect x="66" y="100" width="28" height="8" rx="2" fill="#8395a5"/>
      <rect x="52" y="108" width="56" height="5" rx="2.5" fill="#aab8c4"/>
    </svg>`,
  flex: `
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 78 Q80 48 140 78 L140 40 Q80 10 20 40 Z" fill="#1a5c8f" stroke="#0c2d4a" stroke-width="3"/>
      <g stroke="#4e85ad" stroke-width="2" fill="none">
        <path d="M50 30 L50 68"/><path d="M80 24 L80 62"/><path d="M110 30 L110 68"/>
        <path d="M20 59 Q80 29 140 59"/>
      </g>
      <path d="M28 36 Q50 25 72 22 L72 30 Q52 33 32 42 Z" fill="#fff" opacity="0.15"/>
      <ellipse cx="80" cy="98" rx="55" ry="7" fill="#0c2d4a" opacity="0.1"/>
    </svg>`,
  inverter: `
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="38" y="8" width="84" height="96" rx="9" fill="#e8edf2" stroke="#b6c2cd" stroke-width="3"/>
      <rect x="50" y="22" width="60" height="26" rx="4" fill="#12314e"/>
      <text x="80" y="40" font-size="13" font-family="monospace" fill="#4ade80" text-anchor="middle">5.0 kW</text>
      <circle cx="60" cy="64" r="6" fill="#f59e0b"/>
      <circle cx="80" cy="64" r="6" fill="#22c55e"/>
      <circle cx="100" cy="64" r="6" fill="#cbd5e1"/>
      <g stroke="#b6c2cd" stroke-width="2.5"><line x1="52" y1="82" x2="108" y2="82"/><line x1="52" y1="89" x2="108" y2="89"/><line x1="52" y1="96" x2="108" y2="96"/></g>
      <rect x="58" y="104" width="10" height="10" fill="#8395a5"/><rect x="92" y="104" width="10" height="10" fill="#8395a5"/>
    </svg>`,
  battery: `
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="52" y="12" width="14" height="10" rx="2" fill="#dc2626"/>
      <rect x="94" y="12" width="14" height="10" rx="2" fill="#12314e"/>
      <rect x="30" y="22" width="100" height="84" rx="8" fill="#1c2b3a" stroke="#0f1c28" stroke-width="3"/>
      <rect x="30" y="52" width="100" height="22" fill="#f59e0b"/>
      <text x="80" y="68" font-size="12" font-weight="bold" font-family="sans-serif" fill="#1c2b3a" text-anchor="middle">100Ah</text>
      <path d="M84 80 L72 96 L79 96 L76 106 L88 90 L81 90 Z" fill="#fbbf24"/>
    </svg>`,
  kit: `
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="14" width="86" height="60" rx="4" fill="#123f66" stroke="#0c2d4a" stroke-width="2.5"/>
      <g stroke="#3d719c" stroke-width="1.6">
        <line x1="10" y1="34" x2="96" y2="34"/><line x1="10" y1="54" x2="96" y2="54"/>
        <line x1="39" y1="14" x2="39" y2="74"/><line x1="67" y1="14" x2="67" y2="74"/>
      </g>
      <rect x="106" y="26" width="44" height="52" rx="6" fill="#e8edf2" stroke="#b6c2cd" stroke-width="2.5"/>
      <rect x="113" y="34" width="30" height="12" rx="2" fill="#12314e"/>
      <circle cx="120" cy="58" r="4" fill="#22c55e"/><circle cx="134" cy="58" r="4" fill="#f59e0b"/>
      <rect x="30" y="84" width="70" height="26" rx="5" fill="#1c2b3a"/>
      <rect x="30" y="92" width="70" height="9" fill="#f59e0b"/>
      <rect x="40" y="79" width="9" height="6" rx="1.5" fill="#dc2626"/>
      <rect x="80" y="79" width="9" height="6" rx="1.5" fill="#12314e"/>
    </svg>`,
  controller: `
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="42" y="14" width="76" height="84" rx="7" fill="#1c2b3a" stroke="#0f1c28" stroke-width="3"/>
      <rect x="52" y="24" width="56" height="24" rx="3" fill="#0a2138"/>
      <text x="80" y="41" font-size="12" font-family="monospace" fill="#4ade80" text-anchor="middle">13.8V</text>
      <circle cx="64" cy="64" r="7" fill="#f59e0b"/>
      <circle cx="96" cy="64" r="7" fill="#22c55e"/>
      <rect x="54" y="78" width="20" height="12" rx="2" fill="#33475a"/>
      <rect x="86" y="78" width="20" height="12" rx="2" fill="#33475a"/>
      <path d="M56 98 v12 M72 98 v12 M88 98 v12 M104 98 v12" stroke="#8395a5" stroke-width="4"/>
    </svg>`,
  streetlight: `
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="76" y="30" width="8" height="84" fill="#5b6770"/>
      <rect x="52" y="108" width="56" height="7" rx="3" fill="#8395a5"/>
      <g transform="rotate(-24 96 24)">
        <rect x="70" y="14" width="52" height="20" rx="2" fill="#12314e" stroke="#0a2138" stroke-width="2"/>
        <line x1="96" y1="14" x2="96" y2="34" stroke="#3d719c" stroke-width="1.5"/>
      </g>
      <rect x="46" y="40" width="42" height="12" rx="6" fill="#33475a"/>
      <ellipse cx="58" cy="52" rx="9" ry="4" fill="#ffe9a8"/>
      <path d="M50 58 L44 78 M58 58 L58 80 M66 58 L72 78" stroke="#ffe9a8" stroke-width="2" opacity="0.7"/>
    </svg>`,
  mount: `
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="88" width="128" height="8" rx="2" fill="#8395a5"/>
      <polygon points="40,88 40,46 92,88" fill="none" stroke="#5b6770" stroke-width="6"/>
      <polygon points="112,88 112,46 60,88" fill="none" stroke="#98a6b3" stroke-width="6"/>
      <rect x="24" y="30" width="112" height="10" rx="2" fill="#c2ccd6" stroke="#98a6b3" stroke-width="2" transform="rotate(-14 80 35)"/>
      <rect x="30" y="46" width="100" height="10" rx="2" fill="#c2ccd6" stroke="#98a6b3" stroke-width="2" transform="rotate(-14 80 51)"/>
      <circle cx="40" cy="46" r="4" fill="#33475a"/>
      <circle cx="112" cy="46" r="4" fill="#33475a"/>
    </svg>`,
  cable: `
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="#1c2b3a" stroke-width="9">
        <circle cx="72" cy="62" r="34"/>
        <circle cx="88" cy="62" r="34" opacity="0.75"/>
      </g>
      <path d="M104 36 q26 -14 38 -4" fill="none" stroke="#1c2b3a" stroke-width="9" stroke-linecap="round"/>
      <rect x="134" y="22" width="22" height="12" rx="6" fill="#dc2626"/>
      <path d="M52 92 q-20 12 -36 6" fill="none" stroke="#1c2b3a" stroke-width="9" stroke-linecap="round"/>
      <rect x="4" y="90" width="22" height="12" rx="6" fill="#12314e"/>
    </svg>`
};

// HTML içine yazılacak metinleri güvenli hale getirir (XSS önlemi)
function escHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
