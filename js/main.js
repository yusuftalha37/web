// ============ MOBİL MENÜ ============
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("open");
  navLinks.classList.toggle("open");
});

// Menüde bir linke tıklanınca mobil menüyü kapat
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    hamburger.classList.remove("open");
    navLinks.classList.remove("open");
  });
});

// ============ İSTATİSTİK SAYAÇLARI ============
const counters = document.querySelectorAll("[data-count]");

function animateCounter(el) {
  const target = parseInt(el.dataset.count, 10);
  const duration = 1600;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    // easeOutCubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased).toLocaleString("tr-TR");
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.6 }
);

counters.forEach((c) => counterObserver.observe(c));

// ============ ÜRÜNLER ============
// Fiyatlar TL, KDV dahil örnek fiyatlardır.
const PRODUCTS = [
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
  }
];

const CAT_NAMES = {
  panel: "Güneş Paneli",
  inverter: "İnvertör",
  aku: "Akü",
  paket: "Hazır Paket"
};

// Sipariş mesajlarının gideceği WhatsApp numarası (uluslararası formatta)
const WHATSAPP_NUMBER = "908500000000";

const tlFmt = (n) => "₺" + Math.round(n).toLocaleString("tr-TR");

// ---- Ürün görselleri (SVG) ----
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
    </svg>`
};

// ---- Mağaza render ----
const shopGrid = document.getElementById("shopGrid");
const shopFilters = document.getElementById("shopFilters");

function renderShop(cat) {
  const list = cat === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.cat === cat);
  shopGrid.innerHTML = list
    .map((p) => {
      const low = p.stock <= 5;
      return `
      <article class="product">
        <div class="product-img">
          <span class="stock-badge${low ? " low" : ""}">${low ? "Son " + p.stock + " adet" : "Stokta"}</span>
          ${PRODUCT_ART[p.img]}
        </div>
        <div class="product-body">
          <span class="product-cat">${CAT_NAMES[p.cat]}</span>
          <h3>${p.name}</h3>
          <ul class="product-specs">${p.specs.map((s) => `<li>${s}</li>`).join("")}</ul>
          <div class="product-foot">
            <div class="product-price">${tlFmt(p.price)}<span>KDV dahil</span></div>
            <button class="add-btn" data-id="${p.id}">Sepete Ekle</button>
          </div>
        </div>
      </article>`;
    })
    .join("");
}

shopFilters.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  shopFilters.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  renderShop(btn.dataset.cat);
});

renderShop("all");

// ---- Sepet ----
const cartBtn = document.getElementById("cartBtn");
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const cartClose = document.getElementById("cartClose");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");
const waOrder = document.getElementById("waOrder");
const clearCartBtn = document.getElementById("clearCart");

let cart = {};
try {
  cart = JSON.parse(localStorage.getItem("gp-cart")) || {};
} catch (_) {
  cart = {};
}

function saveCart() {
  localStorage.setItem("gp-cart", JSON.stringify(cart));
}

function cartEntries() {
  return Object.entries(cart)
    .map(([id, qty]) => ({ product: PRODUCTS.find((p) => p.id === id), qty }))
    .filter((e) => e.product && e.qty > 0);
}

function renderCart() {
  const entries = cartEntries();
  const count = entries.reduce((s, e) => s + e.qty, 0);
  const total = entries.reduce((s, e) => s + e.product.price * e.qty, 0);

  cartCountEl.hidden = count === 0;
  cartCountEl.textContent = count;
  cartTotalEl.textContent = tlFmt(total);

  if (entries.length === 0) {
    cartItemsEl.innerHTML = '<p class="cart-empty">Sepetiniz boş.<br>Mağazadan ürün ekleyebilirsiniz.</p>';
    waOrder.classList.add("disabled");
    waOrder.removeAttribute("href");
  } else {
    cartItemsEl.innerHTML = entries
      .map(
        (e) => `
      <div class="cart-item">
        <div class="cart-item-info">
          <strong>${e.product.name}</strong>
          <span>${tlFmt(e.product.price)} × ${e.qty} = ${tlFmt(e.product.price * e.qty)}</span>
        </div>
        <div class="cart-qty">
          <button data-id="${e.product.id}" data-act="dec" aria-label="Azalt">−</button>
          <span class="qty-val">${e.qty}</span>
          <button data-id="${e.product.id}" data-act="inc" aria-label="Artır">+</button>
          <button class="del-btn" data-id="${e.product.id}" data-act="del" aria-label="Kaldır">×</button>
        </div>
      </div>`
      )
      .join("");

    const lines = entries.map((e) => `• ${e.qty} × ${e.product.name} — ${tlFmt(e.product.price * e.qty)}`);
    const msg =
      "Merhaba, web sitenizden sipariş vermek istiyorum:\n\n" +
      lines.join("\n") +
      "\n\nToplam: " + tlFmt(total);
    waOrder.href = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg);
    waOrder.classList.remove("disabled");
  }
}

function openCart() {
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("open");
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("open");
}

cartBtn.addEventListener("click", openCart);
cartClose.addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

shopGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-btn");
  if (!btn) return;
  const id = btn.dataset.id;
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  renderCart();
  btn.textContent = "Eklendi ✓";
  btn.classList.add("added");
  setTimeout(() => {
    btn.textContent = "Sepete Ekle";
    btn.classList.remove("added");
  }, 1200);
});

cartItemsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const { id, act } = btn.dataset;
  if (act === "inc") cart[id] = (cart[id] || 0) + 1;
  if (act === "dec") cart[id] = Math.max(0, (cart[id] || 0) - 1);
  if (act === "del" || cart[id] === 0) delete cart[id];
  saveCart();
  renderCart();
});

clearCartBtn.addEventListener("click", () => {
  cart = {};
  saveCart();
  renderCart();
});

renderCart();

// ============ TASARRUF HESAPLAYICI ============
// Varsayımlar (tahmini, Türkiye ortalamaları):
const TL_PER_KWH = 3.2;          // ortalama birim elektrik fiyatı (TL/kWh)
const KWH_PER_KW_MONTH = 130;    // 1 kW kurulu gücün aylık üretimi (kWh)
const COST_PER_KW = 36000;       // 1 kW kurulu güç yatırım maliyeti (TL)
const COVERAGE = 0.9;            // faturanın karşılanma oranı

const billInput = document.getElementById("billInput");
const billValue = document.getElementById("billValue");
const resPower = document.getElementById("resPower");
const resSaving = document.getElementById("resSaving");
const resPayback = document.getElementById("resPayback");
const resTotal = document.getElementById("resTotal");

const tl = (n) =>
  "₺" + Math.round(n).toLocaleString("tr-TR");

function calculate() {
  const bill = parseInt(billInput.value, 10);
  billValue.textContent = tl(bill);

  const monthlyKwh = bill / TL_PER_KWH;
  const requiredKw = (monthlyKwh * COVERAGE) / KWH_PER_KW_MONTH;
  const systemCost = requiredKw * COST_PER_KW;
  const yearlySaving = bill * 12 * COVERAGE;
  const paybackYears = systemCost / yearlySaving;
  const totalGain = yearlySaving * 25 - systemCost;

  resPower.textContent = requiredKw.toFixed(1).replace(".", ",") + " kW";
  resSaving.textContent = tl(yearlySaving);
  resPayback.textContent = paybackYears.toFixed(1).replace(".", ",") + " yıl";
  resTotal.textContent = tl(totalGain);
}

billInput.addEventListener("input", calculate);
calculate();

// ============ İLETİŞİM FORMU ============
const form = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = form.name;
  const phone = form.phone;
  let valid = true;

  [name, phone].forEach((field) => {
    if (!field.value.trim()) {
      field.classList.add("error");
      valid = false;
    } else {
      field.classList.remove("error");
    }
  });

  if (!valid) {
    formStatus.textContent = "Lütfen zorunlu (*) alanları doldurun.";
    formStatus.className = "form-status err";
    return;
  }

  // Demo site: gerçek bir backend olmadığı için gönderim simüle edilir.
  formStatus.textContent =
    "Teşekkürler " + name.value.trim() + "! Talebiniz alındı, 24 saat içinde sizi arayacağız. (Demo)";
  formStatus.className = "form-status ok";
  form.reset();
});
