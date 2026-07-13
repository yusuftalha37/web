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

// ============ HESAP / OTURUM ============
const navAccount = document.getElementById("navAccount");
const currentUser = Store.session();

if (currentUser) {
  // Menü kalabalıklaşmasın diye admin için isim yerine panel linki gösterilir
  navAccount.innerHTML =
    (currentUser.role === "admin"
      ? '<a href="admin.html" class="admin-link">Yönetim Paneli</a>'
      : '<span class="account-name">' + escHtml(currentUser.name.split(" ")[0]) + "</span>") +
    '<a href="#" id="logoutLink">Çıkış</a>';
  document.getElementById("logoutLink").addEventListener("click", (e) => {
    e.preventDefault();
    Store.logout();
    location.reload();
  });
} else {
  navAccount.innerHTML = '<a href="giris.html">Giriş Yap</a>';
}

// ============ ÜRÜNLER ============
// Ürün listesi veri katmanından gelir; admin panelinden yönetilir.
const PRODUCTS = Store.getProducts();

const CAT_NAMES = {
  panel: "Güneş Paneli",
  inverter: "İnvertör",
  aku: "Akü",
  paket: "Hazır Paket",
  aksesuar: "Aksesuar"
};

// Sipariş mesajlarının gideceği WhatsApp numarası (admin panelindeki
// Ayarlar bölümünden değiştirilebilir)
const WHATSAPP_NUMBER = Store.getSettings().whatsapp;

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

// ---- Mağaza render ----
const shopGrid = document.getElementById("shopGrid");
const shopFilters = document.getElementById("shopFilters");

function productMedia(p) {
  return p.photo
    ? `<img src="${escHtml(p.photo)}" alt="${escHtml(p.name)}" loading="lazy">`
    : (PRODUCT_ART[p.img] || PRODUCT_ART.panel);
}

function renderShop(cat) {
  const list = cat === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.cat === cat);
  shopGrid.innerHTML = list
    .map((p) => {
      const low = p.stock <= 5;
      return `
      <article class="product">
        <div class="product-img${p.photo ? " has-photo" : ""}">
          <span class="stock-badge${low ? " low" : ""}">${low ? "Son " + p.stock + " adet" : "Stokta"}</span>
          ${productMedia(p)}
        </div>
        <div class="product-body">
          <span class="product-cat">${CAT_NAMES[p.cat] || ""}</span>
          <h3>${escHtml(p.name)}</h3>
          <ul class="product-specs">${p.specs.map((s) => `<li>${escHtml(s)}</li>`).join("")}</ul>
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
        <div class="cart-thumb">${productMedia(e.product)}</div>
        <div class="cart-item-info">
          <strong>${escHtml(e.product.name)}</strong>
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

// WhatsApp'a yönlendirilen siparişi admin panelinde görünmesi için kaydet
waOrder.addEventListener("click", () => {
  const entries = cartEntries();
  if (entries.length === 0) return;
  Store.addOrder({
    customer: currentUser ? currentUser.name : "Ziyaretçi",
    email: currentUser ? currentUser.email : "",
    items: entries.map((e) => ({ name: e.product.name, qty: e.qty, price: e.product.price })),
    total: entries.reduce((s, e) => s + e.product.price * e.qty, 0)
  });
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

  // Talep, admin panelinin "Talepler" bölümünde listelenmek üzere kaydedilir.
  Store.addLead({
    name: name.value.trim(),
    phone: phone.value.trim(),
    city: form.city.value.trim(),
    type: form.type.value,
    message: form.message.value.trim()
  });

  formStatus.textContent =
    "Teşekkürler " + name.value.trim() + "! Talebiniz alındı, 24 saat içinde sizi arayacağız.";
  formStatus.className = "form-status ok";
  form.reset();
});
