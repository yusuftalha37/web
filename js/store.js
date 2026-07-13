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
      id: "pnl-460", cat: "panel", img: "panel",
      name: "460W Half-Cut Monokristal Güneş Paneli",
      specs: ["120 hücre · %21,3 verim", "Çerçeve: eloksallı alüminyum, IP68 bağlantı kutusu", "25 yıl performans garantisi"],
      price: 4850, stock: 25
    },
    {
      id: "pnl-550", cat: "panel", img: "panel",
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
      id: "inv-6h", cat: "inverter", img: "inverter",
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
      id: "aku-lfp", cat: "aku", img: "battery",
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
      id: "kit-krv", cat: "paket", img: "kit",
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
      id: "aks-lamba", cat: "aksesuar", img: "streetlight",
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

  // Varsayılan ürün listesine yeni ürünler eklendiğinde bu sürümü artırın;
  // mevcut tarayıcılardaki listelere yalnızca eksik olanlar eklenir.
  const SEED_VERSION = 2;

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

  // ---------- AYARLAR ----------
  function getSettings() {
    return read("gp-settings", { whatsapp: "908500000000" });
  }

  function saveSettings(settings) {
    write("gp-settings", { ...getSettings(), ...settings });
  }

  return {
    getProducts, saveProduct, deleteProduct,
    register, login, logout, session,
    addLead, getLeads, deleteLead,
    addOrder, getOrders,
    getSettings, saveSettings
  };
})();

// HTML içine yazılacak metinleri güvenli hale getirir (XSS önlemi)
function escHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
