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
