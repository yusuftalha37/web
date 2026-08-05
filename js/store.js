// ============================================================
// VERİ KATMANI (iki modlu)
//  - config.js'te SUPABASE_URL/ANON_KEY boşsa: yerel demo (localStorage)
//  - doldurulmuşsa: Supabase (PostgREST + Auth) üzerinden gerçek backend
// Sitenin geri kalanı yalnızca Store.* fonksiyonlarını kullanır;
// backend değişse de arayüz kodu aynı kalır.
// Not: Sayfa açılışında önce Store.ready(fn) ile veriler yüklenir.
// ============================================================

const Store = (() => {
  // ---- Yapılandırma: config.js doldurulmuşsa Supabase, boşsa yerel (demo) ----
  const CFG = (typeof window !== "undefined" && window.QS_CONFIG) || {};
  const SB_URL = (CFG.SUPABASE_URL || "").replace(/\/+$/, "");
  const SB_KEY = CFG.SUPABASE_ANON_KEY || "";
  const MODE = SB_URL && SB_KEY ? "supabase" : "local";
  const persist = MODE === "supabase";

  const read = (key, fallback) => {
    try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
    catch (_) { return fallback; }
  };
  const write = (key, val) => localStorage.setItem(key, JSON.stringify(val));
  const logErr = (e) => console.error("[Store]", e && e.message ? e.message : e);

  // ===================== VARSAYILAN VERİLER =====================
  const DEFAULT_PRODUCTS = [
    { id: "pnl-460", hit: true, cat: "panel", img: "panel", name: "460W Half-Cut Monokristal Güneş Paneli", specs: ["120 hücre · %21,3 verim", "Çerçeve: eloksallı alüminyum, IP68 bağlantı kutusu", "25 yıl performans garantisi"], price: 4850, stock: 25 },
    { id: "pnl-550", hit: true, cat: "panel", img: "panel", name: "550W Monokristal Güneş Paneli", specs: ["144 hücre · %21,7 verim", "Çift cam (bifacial) teknoloji", "30 yıl performans garantisi"], price: 5950, stock: 18 },
    { id: "pnl-flx", cat: "panel", img: "flex", name: "285W Esnek Güneş Paneli", specs: ["Karavan, tekne ve tiny house için", "Yarı esnek ETFE yüzey", "Sadece 4,8 kg"], price: 6750, stock: 4 },
    { id: "inv-5g", cat: "inverter", img: "inverter", authorized: true, name: "5 kW On-Grid İnvertör (Monofaze)", specs: ["2 MPPT girişi", "Wi-Fi izleme modülü dahil", "5 yıl garanti"], price: 38500, stock: 9 },
    { id: "inv-6h", hit: true, cat: "inverter", img: "inverter", authorized: true, name: "6 kW Hibrit İnvertör 48V", specs: ["120A MPPT şarj kontrollü", "Şebeke + akü + jeneratör girişi", "Paralellenebilir (9 adede kadar)"], price: 52900, stock: 7 },
    { id: "inv-3s", cat: "inverter", img: "inverter", authorized: true, name: "3 kW Tam Sinüs İnvertör 24V", specs: ["Off-grid kullanım için", "LCD ekran, USB çıkış", "Düşük bekleme tüketimi"], price: 14750, stock: 14 },
    { id: "inv-lexron-smart5", cat: "inverter", cats: ["lexron"], img: "inverter", authorized: true, name: "Lexron 5.5 kW Akıllı Hibrit İnvertör", specs: ["Wi-Fi izleme + mobil uygulama", "Çift MPPT · %98 verim", "Şebeke + akü + jeneratör girişi"], price: 44900, stock: 6 },
    { id: "aku-lfp", hit: true, cat: "aku", img: "battery", name: "48V 100Ah LiFePO4 Lityum Akü", specs: ["5,12 kWh kapasite", "6.000+ çevrim ömrü", "Dahili BMS, Bluetooth takip"], price: 58900, stock: 6 },
    { id: "aku-jel", cat: "aku", img: "battery", name: "12V 150Ah Derin Döngü Jel Akü", specs: ["Bakım gerektirmez", "Solar sistemler için optimize", "2 yıl garanti"], price: 9850, stock: 22 },
    { id: "kit-krv", hit: true, cat: "paket", img: "kit", name: "Karavan Solar Paketi 410W", specs: ["410W panel + 30A MPPT regülatör", "Kablolama ve montaj aparatları dahil", "Kurulum şeması ile birlikte"], price: 32500, stock: 3 },
    { id: "kit-bag", cat: "paket", img: "kit", name: "Bağ Evi Off-Grid Paketi 3 kW", specs: ["4 × 460W panel + 3 kW invertör", "12V 150Ah × 2 jel akü", "Telefonla kurulum desteği"], price: 94500, stock: 5 },
    { id: "aks-mppt", cat: "aksesuar", img: "controller", name: "30A MPPT Şarj Kontrol Cihazı 12/24V", specs: ["LCD ekran, otomatik voltaj seçimi", "Aşırı şarj ve kısa devre koruması", "2 yıl garanti"], price: 4250, stock: 16 },
    { id: "aks-lamba", hit: true, cat: "aksesuar", img: "streetlight", name: "Solar Sokak / Bahçe Lambası 100W", specs: ["Dahili panel ve lityum batarya", "Alacakaranlık sensörü, kumandalı", "IP65 dış mekan koruması"], price: 3980, stock: 12 },
    { id: "aks-montaj", cat: "aksesuar", img: "mount", name: "Çatı Montaj Konstrüksiyon Seti (10 Panel)", specs: ["Eloksallı alüminyum ray ve kelepçeler", "Kiremit ve sac çatıya uygun", "Paslanmaz bağlantı elemanları"], price: 7500, stock: 9 },
    { id: "aks-kablo", cat: "aksesuar", img: "cable", name: "6mm² Solar Kablo 50m + MC4 Konnektör Seti", specs: ["UV dayanımlı çift izolasyon", "2 çift MC4 konnektör dahil", "TSE belgeli"], price: 2450, stock: 30 }
  ];
  const DEFAULT_CATEGORIES = [
    { id: "panel", name: "Güneş Panelleri" },
    { id: "inverter", name: "İnvertörler" },
    { id: "aku", name: "Aküler" },
    { id: "paket", name: "Hazır Paketler" },
    { id: "aksesuar", name: "Aksesuarlar" },
    // Marka alt kategorisi örneği: İnvertörler > Lexron
    { id: "lexron", name: "Lexron", kind: "brand", parent: "inverter", image: "" }
  ];
  const DEFAULT_SLIDES = [
    { id: "sl1", image: "", art: "roof", title: "Güneş Enerjisinde Türkiye'nin Her Yerine Gönderim", subtitle: "Panel, invertör, akü ve hazır paketler stoktan — siparişiniz aynı gün kargoda.", btnText: "Ürünleri İncele", btnLink: "urunler.html" },
    { id: "sl2", image: "", art: "field", title: "Yüksek Verimli Monokristal Paneller", subtitle: "%21+ verim, 25 yıla varan garanti. Ev, işyeri ve tarım için uygun çözümler.", btnText: "Panelleri Gör", btnLink: "urunler.html" },
    { id: "sl3", image: "", art: "carport", title: "Karavan ve Bağ Evi Solar Paketleri", subtitle: "Şebekeden bağımsız, kur-kullan hazır sistemler. Montaj kılavuzu ve destek dahil.", btnText: "Paketleri Gör", btnLink: "urunler.html" }
  ];
  const DEFAULT_SITE = {
    // ---- İletişim / genel ----
    phone: "0850 000 00 00",
    email: "info@solararena.store",
    address: "Örnek Mah. Enerji Cad. No:1, Ankara",
    hours: "Hafta içi 09:00 - 18:00, Cumartesi 10:00 - 15:00",
    topNote: "Türkiye'nin her yerine hızlı gönderim",
    brandTagline: "Enerji Sistemleri San. Tic. Ltd. Şti.",
    headerContactNote: "Sipariş ve bilgi için hemen arayın",
    authorizedLabel: "Yetkili Satıcı",
    // ---- Avantaj şeridi ----
    strip1: "25 Yıl Panel Garantisi",
    strip2: "36 Aya Varan Taksit",
    strip3: "Türkiye'nin Her Yerine Gönderim",
    strip4: "Aynı Gün Kargo (Stok Ürünlerde)",
    // ---- En çok satanlar ----
    bestTitle: "En Çok Satan Ürünler",
    bestText: "Müşterilerimizin en çok tercih ettiği ürünler. Tüm ürünlerimiz orijinal, faturalı ve garantilidir; stoktaki ürünler aynı gün kargoya verilir.",
    // ---- Tasarruf hesaplayıcı ----
    calcTitle: "Güneş Size Ne Kazandırır?",
    calcText: "Aylık elektrik faturanızı girin, size uygun sistem gücünü ve yıllık tasarrufunuzu anında görün. Hesaplama Türkiye ortalama güneşlenme verilerine göre tahminidir.",
    calcNote1: "Türkiye yıllık ortalama 2.740 saat güneşlenme süresine sahiptir",
    calcNote2: "Elektrik faturanızda %90'a varan azalma sağlanır",
    calcNote3: "Fazla üretiminizi şebekeye satabilirsiniz",
    // ---- Süreç adımları ----
    procTitle: "Siparişiniz 4 Adımda Kapınızda",
    step1Title: "Siparişinizi Verin",
    step1Text: "Ürünleri sepete ekleyin, sipariş formunu doldurup talebinizi iletin.",
    step2Title: "Onay & Ödeme",
    step2Text: "Siparişinizi onaylayıp güvenli ödeme seçeneklerini sunuyoruz.",
    step3Title: "Aynı Gün Kargo",
    step3Text: "Stok ürünler aynı gün sigortalı ve sağlam paketlenmiş şekilde yola çıkar.",
    step4Title: "Teslimat & Destek",
    step4Text: "1-3 iş gününde kapınızda. Montajda telefonla ücretsiz destek veriyoruz.",
    // ---- Proje galerisi ----
    galTitle: "Ürünlerimiz Sahada",
    galText: "Ürünlerimizle kurulan sistemlerden örnekler — müşterilerimizin gönderdiği kareler.",
    gal1: "Antalya — 8 kW konut çatı GES",
    gal2: "İzmir — 120 kW endüstriyel çatı GES",
    gal3: "Konya — şebekeden bağımsız sulama sistemi",
    gal4: "Ankara — 1,2 MW arazi tipi GES",
    gal5: "Bursa — solar otopark (carport) sistemi",
    // ---- Referanslar ----
    refTitle: "Müşterilerimiz Ne Diyor?",
    testi1Text: "\"Panelleri öğlen sipariş verdim, ertesi gün elimdeydi. Paketleme çok sağlamdı, tek çizik bile yoktu. Faturam 3.500 TL'den 250 TL'ye düştü.\"",
    testi1Name: "Mehmet K.",
    testi1Role: "— Antalya, 8 kW malzeme seti",
    testi2Text: "\"Fabrikamız için toptan panel aldık; piyasadaki en iyi fiyatı verdiler, teslimat sözünde durdular. İkinci partiyi de buradan alacağız.\"",
    testi2Name: "Ayşe T.",
    testi2Role: "— İzmir, toptan alım (120 kW)",
    testi3Text: "\"Bağ evi paketini kendim kurdum; gönderdikleri şema çok anlaşılırdı, takıldığım yerde telefonla adım adım yardımcı oldular.\"",
    testi3Name: "Hüseyin D.",
    testi3Role: "— Konya, Bağ Evi Off-Grid Paketi",
    // ---- SSS ----
    faqTitle: "Sık Sorulan Sorular",
    faqQ1: "Güneş paneli sistemi kendini ne kadar sürede amorti eder?",
    faqA1: "Tüketiminize ve bulunduğunuz bölgeye göre değişmekle birlikte, konut sistemleri ortalama 4-6 yılda, ticari sistemler 3-5 yılda kendini amorti eder. Paneller 25+ yıl üretim yaptığı için kalan yıllar net kazançtır.",
    faqQ2: "Elektrik kesildiğinde sistemim çalışır mı?",
    faqA2: "Standart on-grid sistemler güvenlik gereği kesintide durur. Batarya destekli hibrit sistem tercih ederseniz kesintilerde de elektriğiniz olur.",
    faqQ3: "Ürettiğim fazla elektriği satabilir miyim?",
    faqA3: "Evet. Aylık mahsuplaşma modeliyle tükettiğinizden fazla ürettiğiniz elektrik şebekeye verilir ve dağıtım şirketi tarafından size ödeme yapılır.",
    faqQ4: "Çatım güneş enerjisi için uygun mu?",
    faqA4: "Güney, güneydoğu veya güneybatı cepheli, gölgelenmesi az çatılar idealdir; doğu-batı yönlü çatılarda da verimli sistemler kurulabilir. Çatınızın fotoğrafını ve aylık faturanızı WhatsApp'tan gönderin, uzmanlarımız ücretsiz değerlendirsin.",
    faqQ5: "Kargo ne kadar sürer, ücreti nedir?",
    faqA5: "Stoktaki ürünler aynı gün kargoya verilir; teslimat Türkiye genelinde ortalama 1-3 iş günüdür. Tüm gönderiler sigortalıdır. Kargo ücreti sipariş onayında bildirilir; belirli tutarın üzerindeki siparişlerde gönderim ücretsizdir.",
    faqQ6: "Kurulumu kendim yapabilir miyim?",
    faqA6: "Evet. Tüm paketlerle birlikte adım adım montaj kılavuzu ve bağlantı şeması gönderiyoruz; kurulum sırasında telefonla ücretsiz teknik destek veriyoruz. Dilerseniz bulunduğunuz bölgedeki anlaşmalı ustaları da önerebiliriz.",
    faqQ7: "Bakım masrafı var mı?",
    faqA7: "Güneş panellerinin hareketli parçası olmadığı için bakım ihtiyacı minimumdur. Yılda 1-2 kez panel temizliği ve periyodik kontrol yeterlidir.",
    // ---- CTA ----
    ctaTitle: "Güneşten Kazanmaya Bugün Başlayın",
    ctaText: "Siparişiniz aynı gün kargoda. Aradığınız ürünü bulamadıysanız veya toplu alım için bize yazın.",
    // ---- İletişim bölümü ----
    contactTitle: "Bize Ulaşın",
    contactText: "Sorularınız, ücretsiz sistem planlama ve toptan alım için formu doldurun; 24 saat içinde dönüş yapalım.",
    // ---- Neden biz ----
    whyTitle: "Neden Solar Arena?",
    whyText: "Güneş paneli ve solar ürün alışverişinizi güvenle, kapınıza kadar getiriyoruz.",
    why1Title: "Türkiye'nin Her Yerine Gönderim",
    why1Text: "81 ilin tamamına sigortalı ve sağlam paketlenmiş kargo. Stoktaki ürünler aynı gün yola çıkar, 1-3 iş gününde teslim edilir.",
    why2Title: "Orijinal & Garantili Ürünler",
    why2Text: "Tüm ürünler faturalı ve distribütör garantilidir. Panellerde 25 yıla varan performans garantisi sunuyoruz.",
    why3Title: "Ücretsiz Sistem Planlama",
    why3Text: "Fatura ve ihtiyaç bilginizi iletin; size uygun panel + invertör + akü kombinasyonunu uzmanlarımız ücretsiz planlasın.",
    why4Title: "Montaj Kılavuzu & Teknik Destek",
    why4Text: "Her paketle birlikte adım adım montaj şeması gönderiyoruz. Kurulum sırasında telefonla ücretsiz teknik destek alırsınız.",
    why5Title: "Toptan Satış & Bayilik",
    why5Text: "Elektrikçiler, müteahhitler ve işletmeler için özel toptan fiyat listesi ve bayilik imkânı sunuyoruz.",
    why6Title: "Kolay İade & Değişim",
    why6Text: "Ürünler kapınıza sorunsuz ulaşmazsa veya vazgeçerseniz 14 gün içinde koşulsuz iade ve değişim hakkınız var.",
    // ---- Footer ----
    footerAbout: "Temiz enerjiyle daha aydınlık bir gelecek için 12 yıldır çalışıyoruz.",
    footerCopyright: "© 2026 Solar Arena Enerji — Bu site örnek/demo amaçlıdır."
  };
  const DEFAULT_SETTINGS = { whatsapp: "908500000000", bankName: "", bankHolder: "", iban: "", bankNote: "" };
  const SEED_VERSION = 3;

  // ===================== BELLEK ÖNBELLEĞİ =====================
  const cache = {
    products: [], categories: [], slides: [], orders: [], leads: [],
    site: { ...DEFAULT_SITE }, settings: { ...DEFAULT_SETTINGS }
  };

  // ===================== SUPABASE REST YARDIMCILARI =====================
  const token = () => (read("gp-session", {}) || {}).token || SB_KEY;
  async function sbSelect(table, query) {
    const r = await fetch(SB_URL + "/rest/v1/" + table + "?" + (query || "select=*"), {
      headers: { apikey: SB_KEY, Authorization: "Bearer " + token() }
    });
    if (!r.ok) throw new Error(table + " okunamadı (" + r.status + ")");
    return r.json();
  }
  function sbWrite(method, table, query, body) {
    return fetch(SB_URL + "/rest/v1/" + table + (query ? "?" + query : ""), {
      method,
      headers: {
        apikey: SB_KEY, Authorization: "Bearer " + token(),
        "Content-Type": "application/json",
        Prefer: "return=minimal,resolution=merge-duplicates"
      },
      body: body ? JSON.stringify(body) : undefined
    }).then((r) => { if (!r.ok) return r.text().then((t) => { throw new Error(t); }); });
  }
  function sbKv(k, v) { return sbWrite("POST", "kv", "", { k, v }); }
  async function gotrue(path, body) {
    const r = await fetch(SB_URL + "/auth/v1/" + path, {
      method: "POST",
      headers: { apikey: SB_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data };
  }

  // ===================== YÜKLEME (bootstrap) =====================
  let loadPromise = null;
  function load() { return loadPromise || (loadPromise = doLoad().catch((e) => { logErr(e); fallbackLocal(); })); }
  function ready(fn) { return load().then(fn); }

  async function doLoad() {
    if (MODE === "supabase") {
      const [products, categories, slides, kv] = await Promise.all([
        sbSelect("products", "select=*&order=sort"),
        sbSelect("categories", "select=*&order=sort"),
        sbSelect("slides", "select=*&order=sort"),
        sbSelect("kv", "select=*")
      ]);
      cache.products = products.map(fromDbProduct);
      cache.categories = categories.map((c) => ({ id: c.id, name: c.name, image: c.image || "", kind: c.kind || "", parent: c.parent || "" }));
      cache.slides = slides.map(fromDbSlide);
      const kvMap = {};
      kv.forEach((row) => (kvMap[row.k] = row.v));
      cache.site = { ...DEFAULT_SITE, ...(kvMap.site || {}) };
      cache.settings = { ...DEFAULT_SETTINGS, ...(kvMap.settings || {}) };

      // Yönetici tüm siparişleri/talepleri, kullanıcı kendi siparişlerini görür
      const s = session();
      if (s && s.role === "admin") {
        const [orders, leads] = await Promise.all([
          sbSelect("orders", "select=*&order=created.desc"),
          sbSelect("leads", "select=*&order=created.desc")
        ]);
        cache.orders = orders.map(fromDbOrder);
        cache.leads = leads.map(fromDbLead);
      } else if (s && s.email) {
        const orders = await sbSelect("orders", "select=*&email=eq." + encodeURIComponent(s.email) + "&order=created.desc");
        cache.orders = orders.map(fromDbOrder);
      }
    } else {
      fallbackLocal();
    }
  }

  function fallbackLocal() {
    cache.categories = read("gp-cats", null) || seedLocal("gp-cats", DEFAULT_CATEGORIES);
    cache.products = loadLocalProducts();
    cache.slides = read("gp-slides", null) || seedLocal("gp-slides", DEFAULT_SLIDES);
    cache.orders = read("gp-orders", []);
    cache.leads = read("gp-leads", []);
    cache.site = { ...DEFAULT_SITE, ...read("gp-site", {}) };
    cache.settings = { ...DEFAULT_SETTINGS, ...read("gp-settings", {}) };
  }
  function seedLocal(key, val) { write(key, val); return val.map((x) => ({ ...x })); }
  function loadLocalProducts() {
    let list = read("gp-products", null);
    if (!list) { write("gp-products", DEFAULT_PRODUCTS); write("gp-seed", SEED_VERSION); return DEFAULT_PRODUCTS.map((x) => ({ ...x })); }
    if (read("gp-seed", 1) < SEED_VERSION) {
      const ids = new Set(list.map((p) => p.id));
      DEFAULT_PRODUCTS.forEach((p) => { if (!ids.has(p.id)) list.push(p); });
      list.forEach((p) => { const d = DEFAULT_PRODUCTS.find((x) => x.id === p.id); if (d && d.hit && p.hit === undefined) p.hit = true; });
      write("gp-products", list); write("gp-seed", SEED_VERSION);
    }
    return list;
  }

  // ---- DB satırı <-> uygulama nesnesi ----
  function fromDbProduct(r) { return { id: r.id, cat: r.cat, cats: Array.isArray(r.cats) ? r.cats : [], img: r.img, photo: r.photo || "", name: r.name, specs: r.specs || [], price: r.price, stock: r.stock, hit: !!r.hit, authorized: !!r.authorized }; }
  function toDbProduct(p, sort) { return { id: p.id, cat: p.cat, cats: Array.isArray(p.cats) ? p.cats : [], img: p.img, photo: p.photo || "", name: p.name, specs: p.specs || [], price: p.price, stock: p.stock, hit: !!p.hit, authorized: !!p.authorized, sort: sort == null ? 0 : sort }; }
  function fromDbSlide(r) { return { id: r.id, image: r.image || "", art: r.art, title: r.title, subtitle: r.subtitle || "", btnText: r.btnText || "", btnLink: r.btnLink || "urunler.html" }; }
  function toDbSlide(s, sort) { return { id: s.id, image: s.image || "", art: s.art, title: s.title, subtitle: s.subtitle || "", btnText: s.btnText || "", btnLink: s.btnLink || "urunler.html", sort: sort == null ? 0 : sort }; }
  function fromDbOrder(r) { return { id: r.id, customer: r.customer, phone: r.phone, email: r.email, city: r.city, address: r.address, payment: r.payment, status: r.status, items: r.items || [], total: r.total, date: r.created }; }
  function fromDbLead(r) { return { id: r.id, name: r.name, phone: r.phone, city: r.city, type: r.type, message: r.message, date: r.created }; }

  // ===================== ÜRÜNLER =====================
  function getProducts() { return cache.products; }
  // Bir ürünün ait olduğu tüm kategori kimlikleri (birincil + ek/marka), tekilleştirilmiş
  function productCatIds(p) {
    const ids = [];
    if (p && p.cat) ids.push(p.cat);
    if (p && Array.isArray(p.cats)) p.cats.forEach((c) => { if (c && ids.indexOf(c) === -1) ids.push(c); });
    return ids;
  }
  function saveProduct(product) {
    const i = cache.products.findIndex((p) => p.id === product.id);
    if (i >= 0) cache.products[i] = product; else cache.products.unshift(product);
    if (persist) return sbWrite("POST", "products", "", toDbProduct(product));
    write("gp-products", cache.products);
    return Promise.resolve();
  }
  function deleteProduct(id) {
    cache.products = cache.products.filter((p) => p.id !== id);
    if (persist) return sbWrite("DELETE", "products", "id=eq." + encodeURIComponent(id)).catch(logErr);
    write("gp-products", cache.products);
  }

  // ===================== KATEGORİLER =====================
  function getCategories() { return cache.categories; }
  function saveCategory(cat) {
    const name = (cat.name || "").trim();
    if (cat.id) {
      const ex = cache.categories.find((c) => c.id === cat.id);
      if (ex) {
        if (name) ex.name = name;
        if (cat.image !== undefined) ex.image = cat.image;
        if (cat.kind !== undefined) ex.kind = cat.kind;
        if (cat.parent !== undefined) ex.parent = cat.parent;
      }
      const row = { id: cat.id, name: ex ? ex.name : name };
      if (cat.image !== undefined) row.image = cat.image;
      if (cat.kind !== undefined) row.kind = cat.kind;
      if (cat.parent !== undefined) row.parent = cat.parent;
      if (persist) return sbWrite("POST", "categories", "", row).catch(logErr);
    } else {
      const nc = { id: "c-" + Date.now(), name, image: cat.image || "", kind: cat.kind || "", parent: cat.parent || "" };
      cache.categories.push(nc);
      if (persist) return sbWrite("POST", "categories", "", { id: nc.id, name: nc.name, image: nc.image, kind: nc.kind, parent: nc.parent, sort: cache.categories.length }).catch(logErr);
    }
    write("gp-cats", cache.categories);
  }
  function deleteCategory(id) {
    cache.categories = cache.categories.filter((c) => c.id !== id);
    if (persist) return sbWrite("DELETE", "categories", "id=eq." + encodeURIComponent(id)).catch(logErr);
    write("gp-cats", cache.categories);
  }

  // ===================== SLAYTLAR =====================
  function getSlides() { return cache.slides; }
  function saveSlide(slide) {
    if (slide.id) {
      const i = cache.slides.findIndex((s) => s.id === slide.id);
      if (i >= 0) cache.slides[i] = slide;
    } else { slide.id = "sl-" + Date.now(); cache.slides.push(slide); }
    if (persist) return sbWrite("POST", "slides", "", toDbSlide(slide, cache.slides.findIndex((s) => s.id === slide.id))).catch(logErr);
    write("gp-slides", cache.slides);
  }
  function deleteSlide(id) {
    cache.slides = cache.slides.filter((s) => s.id !== id);
    if (persist) return sbWrite("DELETE", "slides", "id=eq." + encodeURIComponent(id)).catch(logErr);
    write("gp-slides", cache.slides);
  }
  function moveSlide(id, dir) {
    const i = cache.slides.findIndex((s) => s.id === id), j = i + dir;
    if (i < 0 || j < 0 || j >= cache.slides.length) return;
    const t = cache.slides[i]; cache.slides[i] = cache.slides[j]; cache.slides[j] = t;
    if (persist) { cache.slides.forEach((s, k) => sbWrite("POST", "slides", "", toDbSlide(s, k)).catch(logErr)); return; }
    write("gp-slides", cache.slides);
  }

  // ===================== OTURUM & KULLANICILAR =====================
  const hash = (s) => btoa(unescape(encodeURIComponent("gp$" + s)));
  function session() { return read("gp-session", null); }
  function logout() { localStorage.removeItem("gp-session"); }

  function getUsersLocal() {
    let users = read("gp-users", null);
    if (!users) {
      users = [{ name: "Site Yöneticisi", email: "admin@solararena.store", phone: "", pass: hash("admin123"), role: "admin", created: Date.now() }];
      write("gp-users", users);
    }
    return users;
  }

  async function register({ name, email, phone, pass, website }) {
    email = (email || "").trim().toLowerCase();
    if (persist) {
      const r = await gotrue("signup", { email, password: pass, website: website || "", data: { name: (name || "").trim(), phone: (phone || "").trim() } });
      if (!r.ok) return { ok: false, error: (r.data && (r.data.msg || r.data.error_description)) || "Kayıt yapılamadı." };
      return { ok: true };
    }
    const users = getUsersLocal();
    if (users.some((u) => u.email === email)) return { ok: false, error: "Bu e-posta ile kayıtlı bir hesap zaten var." };
    users.push({ name: (name || "").trim(), email, phone: (phone || "").trim(), pass: hash(pass), role: "user", created: Date.now() });
    write("gp-users", users);
    return { ok: true };
  }

  async function login(email, pass) {
    email = (email || "").trim().toLowerCase();
    if (persist) {
      const r = await gotrue("token?grant_type=password", { email, password: pass });
      if (!r.ok) return { ok: false, error: "E-posta veya şifre hatalı." };
      const tk = r.data.access_token;
      const user = r.data.user || {};
      const meta = user.user_metadata || {};
      let role = "user", phone = meta.phone || "", name = meta.name || email;
      try {
        const prof = await fetch(SB_URL + "/rest/v1/profiles?id=eq." + user.id + "&select=role,phone,name", {
          headers: { apikey: SB_KEY, Authorization: "Bearer " + tk }
        }).then((x) => x.json());
        if (prof && prof[0]) { role = prof[0].role || role; phone = prof[0].phone || phone; name = prof[0].name || name; }
      } catch (_) {}
      const s = { name, email, role, phone, token: tk, uid: user.id };
      write("gp-session", s);
      return { ok: true, session: s };
    }
    const user = getUsersLocal().find((u) => u.email === email && u.pass === hash(pass));
    if (!user) return { ok: false, error: "E-posta veya şifre hatalı." };
    if (user.blocked) return { ok: false, error: "Bu hesap engellenmiş. Lütfen yöneticiyle iletişime geçin." };
    const s = { name: user.name, email: user.email, role: user.role };
    write("gp-session", s);
    return { ok: true, session: s };
  }

  // ===================== KULLANICI YÖNETİMİ (yalnızca admin) =====================
  // Not: id = Supabase modunda kullanıcı uid'i, yerel modda e-posta adresidir.
  async function listUsers() {
    if (persist) {
      const rows = await sbSelect("profiles", "select=*&order=created.desc").catch(() => []);
      return rows.map((r) => ({ id: r.id, name: r.name || "", email: r.email || "", phone: r.phone || "", role: r.role || "user", blocked: !!r.blocked, created: r.created || 0 }));
    }
    return getUsersLocal()
      .map((u) => ({ id: u.email, name: u.name || "", email: u.email, phone: u.phone || "", role: u.role || "user", blocked: !!u.blocked, created: u.created || 0 }))
      .sort((a, b) => (b.created || 0) - (a.created || 0));
  }
  async function setUserRole(id, role) {
    if (persist) { await sbWrite("PATCH", "profiles", "id=eq." + encodeURIComponent(id), { role }).catch(logErr); return { ok: true }; }
    const users = getUsersLocal();
    const u = users.find((x) => x.email === id);
    if (u) { u.role = role; write("gp-users", users); }
    return { ok: true };
  }
  async function setUserBlocked(id, blocked) {
    if (persist) { await sbWrite("PATCH", "profiles", "id=eq." + encodeURIComponent(id), { blocked: !!blocked }).catch(logErr); return { ok: true }; }
    const users = getUsersLocal();
    const u = users.find((x) => x.email === id);
    if (u) { u.blocked = !!blocked; write("gp-users", users); }
    return { ok: true };
  }
  async function deleteUser(id) {
    if (persist) { await sbWrite("DELETE", "profiles", "id=eq." + encodeURIComponent(id)).catch(logErr); return { ok: true }; }
    write("gp-users", getUsersLocal().filter((x) => x.email !== id));
    return { ok: true };
  }
  // Yönetici panelinden yeni kullanıcı/yönetici oluşturur.
  async function adminCreateUser({ name, email, phone, pass, role }) {
    email = (email || "").trim().toLowerCase();
    if (!email || !pass || pass.length < 6) return { ok: false, error: "Geçerli e-posta ve en az 6 karakter şifre girin." };
    if (persist) {
      const r = await gotrue("signup", { email, password: pass, data: { name: (name || "").trim(), phone: (phone || "").trim() } });
      if (!r.ok) return { ok: false, error: (r.data && (r.data.msg || r.data.error_description)) || "Kullanıcı oluşturulamadı." };
      const uid = r.data && r.data.user && r.data.user.id;
      if (role === "admin" && uid) await sbWrite("PATCH", "profiles", "id=eq." + uid, { role: "admin" }).catch(logErr);
      return { ok: true };
    }
    const users = getUsersLocal();
    if (users.some((u) => u.email === email)) return { ok: false, error: "Bu e-posta ile kayıtlı bir hesap zaten var." };
    users.push({ name: (name || "").trim(), email, phone: (phone || "").trim(), pass: hash(pass), role: role === "admin" ? "admin" : "user", created: Date.now(), blocked: false });
    write("gp-users", users);
    return { ok: true };
  }

  function getUser(email) {
    if (persist) { const s = session(); return s ? { name: s.name, email: s.email, phone: s.phone || "" } : null; }
    const u = getUsersLocal().find((x) => x.email === email);
    return u ? { name: u.name, email: u.email, phone: u.phone || "" } : null;
  }

  async function updateProfile(email, data) {
    if (persist) {
      const s = session();
      if (!s) return { ok: false, error: "Oturum bulunamadı." };
      const patch = { name: (data.name || "").trim(), phone: (data.phone || "").trim() };
      await sbWrite("PATCH", "profiles", "id=eq." + s.uid, patch).catch(logErr);
      s.name = patch.name || s.name; s.phone = patch.phone; write("gp-session", s);
      return { ok: true };
    }
    const users = getUsersLocal();
    const u = users.find((x) => x.email === email);
    if (!u) return { ok: false, error: "Kullanıcı bulunamadı." };
    if (data.name && data.name.trim()) u.name = data.name.trim();
    u.phone = (data.phone || "").trim();
    write("gp-users", users);
    const s = session();
    if (s && s.email === email) { s.name = u.name; write("gp-session", s); }
    return { ok: true };
  }

  async function changePassword(email, oldPass, newPass) {
    if (persist) {
      const r = await fetch(SB_URL + "/auth/v1/user", {
        method: "PUT",
        headers: { apikey: SB_KEY, Authorization: "Bearer " + token(), "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPass })
      });
      if (!r.ok) return { ok: false, error: "Şifre değiştirilemedi." };
      return { ok: true };
    }
    const users = getUsersLocal();
    const u = users.find((x) => x.email === email && x.pass === hash(oldPass));
    if (!u) return { ok: false, error: "Mevcut şifreniz hatalı." };
    u.pass = hash(newPass);
    write("gp-users", users);
    return { ok: true };
  }

  // ===================== İLETİŞİM TALEPLERİ =====================
  function addLead(lead) {
    const row = { ...lead, date: Date.now() };
    delete row.website;                       // bot tuzağı alanı yerelde saklanmaz
    cache.leads.unshift(row);
    if (persist) return sbWrite("POST", "leads", "", {
      name: lead.name, phone: lead.phone, city: lead.city || "",
      type: lead.type || "", message: lead.message || "",
      website: lead.website || ""             // sunucu bot tuzağını kontrol eder
    }).catch(logErr);
    write("gp-leads", cache.leads);
  }
  function getLeads() { return cache.leads; }
  function deleteLead(index) {
    const lead = cache.leads[index];
    cache.leads.splice(index, 1);
    if (persist) { if (lead && lead.id) sbWrite("DELETE", "leads", "id=eq." + encodeURIComponent(lead.id)).catch(logErr); return; }
    write("gp-leads", cache.leads);
  }

  // ===================== SİPARİŞLER =====================
  // Sipariş oluşturur. Sunucu modunda tutar ve sipariş numarası SUNUCUDA
  // hesaplanır/üretilir (istemciden gelen fiyata güvenilmez); sunucunun
  // döndürdüğü gerçek numara ve toplam geri verilir.
  async function addOrder(order) {
    const row = { ...order, id: order.id || ("o" + Date.now()), date: Date.now() };
    if (persist) {
      try {
        const r = await fetch(SB_URL + "/rest/v1/orders", {
          method: "POST",
          headers: { apikey: SB_KEY, Authorization: "Bearer " + token(), "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify({
            customer: order.customer, phone: order.phone || "", email: order.email || "",
            city: order.city || "", address: order.address || "",
            items: (order.items || []).map((i) => ({ id: i.id, name: i.name, qty: i.qty }))
          })
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) return { ok: false, error: (data && data.error_description) || "Sipariş oluşturulamadı." };
        if (data && data.id) { row.id = data.id; if (data.total != null) row.total = data.total; }
        cache.orders.unshift(row);
        return { ok: true, id: row.id, total: row.total };
      } catch (e) { logErr(e); return { ok: false, error: "Sunucuya ulaşılamadı." }; }
    }
    cache.orders.unshift(row);
    write("gp-orders", cache.orders);
    return { ok: true, id: row.id, total: row.total };
  }
  function getOrders() { return cache.orders; }
  function getOrdersByEmail(email) { return cache.orders.filter((o) => o.email === email); }

  // Sipariş/talep listelerini sunucudan tazeler (admin Siparişler ekranı ve
  // Hesabım açıldığında çağrılır; sayfa yenilemeye gerek kalmaz).
  async function refreshOrders() {
    if (!persist) return cache.orders;
    const s = session();
    try {
      if (s && s.role === "admin") {
        const [orders, leads] = await Promise.all([
          sbSelect("orders", "select=*&order=created.desc"),
          sbSelect("leads", "select=*&order=created.desc")
        ]);
        cache.orders = orders.map(fromDbOrder);
        cache.leads = leads.map(fromDbLead);
      } else if (s && s.email) {
        const orders = await sbSelect("orders", "select=*&email=eq." + encodeURIComponent(s.email) + "&order=created.desc");
        cache.orders = orders.map(fromDbOrder);
      }
    } catch (e) { logErr(e); }
    return cache.orders;
  }

  // ===================== ÖDEME (PayTR) =====================
  function startCardPayment(order) {
    return { ok: true, message: "Kart ödeme sayfası PayTR entegrasyonu tamamlandığında burada açılacaktır." };
  }

  // ===================== AYARLAR & SİTE İÇERİĞİ =====================
  function getSettings() { return cache.settings; }
  function saveSettings(settings) {
    cache.settings = { ...cache.settings, ...settings };
    if (persist) return sbKv("settings", cache.settings).catch(logErr);
    write("gp-settings", cache.settings);
  }
  function getSiteContent() { return { ...DEFAULT_SITE, ...cache.site }; }
  function saveSiteContent(data) {
    cache.site = { ...cache.site, ...data };
    if (persist) return sbKv("site", cache.site).catch(logErr);
    write("gp-site", cache.site);
  }

  return {
    mode: MODE, load, ready,
    getProducts, saveProduct, deleteProduct, productCatIds,
    getCategories, saveCategory, deleteCategory,
    getSlides, saveSlide, deleteSlide, moveSlide,
    register, login, logout, session,
    getUser, updateProfile, changePassword,
    listUsers, setUserRole, setUserBlocked, deleteUser, adminCreateUser,
    addLead, getLeads, deleteLead,
    addOrder, getOrders, getOrdersByEmail, refreshOrders,
    startCardPayment,
    getSettings, saveSettings,
    getSiteContent, saveSiteContent
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

// Admin panelinden düzenlenen site içeriğini (telefon, e-posta, adres,
// footer metinleri) [data-site] işaretli öğelere yerleştirir.
function applySiteContent(root) {
  root = root || document;
  if (typeof Store === "undefined") return;
  const site = Store.getSiteContent();
  root.querySelectorAll("[data-site]").forEach((el) => {
    const key = el.getAttribute("data-site");
    if (site[key] != null) el.textContent = site[key];
  });
  root.querySelectorAll('a[data-site="phone"]').forEach((a) => {
    a.href = "tel:" + String(site.phone).replace(/[^\d+]/g, "");
  });
  root.querySelectorAll('a[data-site="email"]').forEach((a) => {
    a.href = "mailto:" + site.email;
  });
}
