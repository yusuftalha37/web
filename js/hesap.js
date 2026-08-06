// ============ HESABIM SAYFASI ============

const me = Store.session();
if (!me) location.href = "giris.html";

const tlFmt = (n) => "₺" + Math.round(n).toLocaleString("tr-TR");
const dateFmt = (ts) =>
  new Date(ts).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

function setStatus(el, msg, ok) {
  el.textContent = msg;
  el.className = "form-status " + (ok ? "ok" : "err");
}

// ============ HOŞGELDİN ============
const welcomeEl = document.getElementById("accWelcome");
if (welcomeEl && me) {
  const userInfo = Store.getUser(me.email);
  const loginDate = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  welcomeEl.innerHTML = `<strong>Hoş Geldiniz</strong><span>${escHtml(userInfo ? userInfo.name : me.name)}</span><small>Son Giriş: ${loginDate}</small>`;
}

// ============ BÖLÜM GEÇİŞLERİ ============
const sections = document.querySelectorAll(".acc-section");
const menuItems = document.querySelectorAll(".acc-menu-item[data-section]");
const cards = document.querySelectorAll(".acc-card[data-goto]");

function showSection(id) {
  sections.forEach((s) => s.style.display = s.id === "sec-" + id ? "" : "none");
  menuItems.forEach((m) => m.classList.toggle("active", m.dataset.section === id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

menuItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(item.dataset.section);
  });
});

cards.forEach((card) => {
  card.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(card.dataset.goto);
  });
});

// URL hash ile bölüm açma
if (location.hash) {
  const h = location.hash.slice(1);
  if (document.getElementById("sec-" + h)) showSection(h);
}

// ============ ÇIKIŞ ============
document.getElementById("accountLogout").addEventListener("click", (e) => {
  e.preventDefault();
  Store.logout();
  location.href = "index.html";
});

// ============ TOPBAR HESAP ============
const topbarAccount = document.getElementById("topbarAccount");
if (topbarAccount && me) {
  topbarAccount.innerHTML = me.role === "admin"
    ? '<a href="admin.html">Yönetim Paneli</a><span class="topbar-sep">|</span><a href="#" class="logout-link">Çıkış</a>'
    : '<a href="hesap.html">Hesabım</a><span class="topbar-sep">|</span><a href="#" class="logout-link">Çıkış</a>';
  const logoutLink = topbarAccount.querySelector(".logout-link");
  if (logoutLink) logoutLink.addEventListener("click", (e) => { e.preventDefault(); Store.logout(); location.reload(); });
}

// ============ SEPET ROZET ============
const cartCountEl = document.getElementById("cartCount");
function updateCartBadge() {
  if (!cartCountEl) return;
  try {
    const cart = JSON.parse(localStorage.getItem("gp-cart")) || {};
    const count = Object.values(cart).reduce((s, q) => s + q, 0);
    cartCountEl.hidden = count === 0;
    cartCountEl.textContent = count;
  } catch (_) {}
}
updateCartBadge();

// ============ PROFİL BİLGİLERİ ============
const accName = document.getElementById("accName");
const accEmail = document.getElementById("accEmail");
const accPhone = document.getElementById("accPhone");
const accCity = document.getElementById("accCity");

const userInfo = me ? Store.getUser(me.email) : null;
if (userInfo) {
  accName.value = userInfo.name;
  accEmail.value = userInfo.email;
  accPhone.value = userInfo.phone || "";
  accCity.value = userInfo.city || "";
}

document.getElementById("profileForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const status = document.getElementById("profileStatus");
  if (!accName.value.trim()) {
    setStatus(status, "Ad Soyad boş bırakılamaz.", false);
    return;
  }
  Store.updateProfile(me.email, { name: accName.value, phone: accPhone.value, city: accCity.value }).then((result) => {
    setStatus(status, result.ok ? "Bilgileriniz güncellendi." : result.error, result.ok);
  });
});

// ============ ŞİFRE DEĞİŞTİR ============
document.getElementById("passwordForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const status = document.getElementById("passwordStatus");
  const oldPass = document.getElementById("passOld").value;
  const newPass = document.getElementById("passNew").value;
  const newPass2 = document.getElementById("passNew2").value;

  if (newPass.length < 6) {
    setStatus(status, "Yeni şifre en az 6 karakter olmalıdır.", false);
    return;
  }
  if (newPass !== newPass2) {
    setStatus(status, "Yeni şifreler birbiriyle uyuşmuyor.", false);
    return;
  }
  Store.changePassword(me.email, oldPass, newPass).then((result) => {
    if (result.ok) {
      setStatus(status, "Şifreniz değiştirildi.", true);
      e.target.reset();
    } else {
      setStatus(status, result.error, false);
    }
  });
});

// ============ ADRES DEFTERİ ============
function getAddresses() {
  try { return JSON.parse(localStorage.getItem("gp-addr-" + me.email)) || []; } catch (_) { return []; }
}
function saveAddresses(list) {
  localStorage.setItem("gp-addr-" + me.email, JSON.stringify(list));
}

function renderAddresses() {
  const list = getAddresses();
  const el = document.getElementById("addressList");
  if (list.length === 0) {
    el.innerHTML = '<p class="acc-empty">Henüz kayıtlı adresiniz bulunmuyor.</p>';
    return;
  }
  el.innerHTML = list.map((a, i) => `
    <div class="acc-addr-item">
      <div class="acc-addr-head">
        <strong>${escHtml(a.title || "Adres " + (i + 1))}</strong>
        <button class="acc-addr-del" data-i="${i}" title="Sil">✕</button>
      </div>
      <p>${escHtml(a.city || "")}</p>
      <p>${escHtml(a.full || "")}</p>
    </div>`).join("");

  el.querySelectorAll(".acc-addr-del").forEach((btn) => {
    btn.addEventListener("click", () => {
      const addrs = getAddresses();
      addrs.splice(+btn.dataset.i, 1);
      saveAddresses(addrs);
      renderAddresses();
    });
  });
}

document.getElementById("addressForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const status = document.getElementById("addressStatus");
  const title = document.getElementById("addrTitle").value.trim();
  const city = document.getElementById("addrCity").value.trim();
  const full = document.getElementById("addrFull").value.trim();
  if (!full) { setStatus(status, "Açık adres boş bırakılamaz.", false); return; }
  const addrs = getAddresses();
  addrs.push({ title: title || "Adres " + (addrs.length + 1), city, full });
  saveAddresses(addrs);
  setStatus(status, "Adres kaydedildi.", true);
  e.target.reset();
  renderAddresses();
});

renderAddresses();

// ============ FAVORİ ÜRÜNLERİM ============
function getFavorites() {
  try { return JSON.parse(localStorage.getItem("gp-fav")) || []; } catch (_) { return []; }
}

function renderFavorites() {
  const favIds = getFavorites();
  const el = document.getElementById("favList");
  const products = Store.getProducts();
  const favProducts = favIds.map((id) => products.find((p) => p.id === id)).filter(Boolean);

  if (favProducts.length === 0) {
    el.innerHTML = '<p class="acc-empty">Henüz favori ürününüz bulunmuyor.<br><a href="urunler.html">Mağazamıza göz atın →</a></p>';
    return;
  }

  el.innerHTML = '<div class="acc-fav-grid">' + favProducts.map((p) => `
    <div class="acc-fav-item">
      <a href="urun.html?id=${encodeURIComponent(p.id)}" class="acc-fav-img">
        ${p.photo ? '<img src="' + escHtml(p.photo) + '" alt="' + escHtml(p.name) + '">' : '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#ccc" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'}
      </a>
      <div class="acc-fav-body">
        <a href="urun.html?id=${encodeURIComponent(p.id)}" class="acc-fav-name">${escHtml(p.name)}</a>
        <span class="acc-fav-price">${tlFmt(p.price)}</span>
      </div>
      <button class="acc-fav-remove" data-id="${p.id}" title="Favorilerden kaldır">✕</button>
    </div>`).join("") + '</div>';

  el.querySelectorAll(".acc-fav-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      const favs = getFavorites().filter((id) => id !== btn.dataset.id);
      localStorage.setItem("gp-fav", JSON.stringify(favs));
      renderFavorites();
    });
  });
}

// ============ SİPARİŞLERİM ============
function renderMyOrders() {
  const orders = me ? Store.getOrdersByEmail(me.email) : [];
  document.getElementById("myOrders").innerHTML =
    orders.map((o) => `
      <div class="acc-order-entry">
        <div class="acc-order-head">
          <span>Sipariş Talebi</span>
          <span>${dateFmt(o.date)}</span>
        </div>
        <ul class="acc-order-items">
          ${o.items.map((i) => `<li>${i.qty} × ${escHtml(i.name)} <span>${tlFmt(i.price * i.qty)}</span></li>`).join("")}
        </ul>
        <div class="acc-order-total">Toplam: <strong>${tlFmt(o.total)}</strong></div>
      </div>`).join("") ||
    '<p class="acc-empty">Henüz bir sipariş talebiniz bulunmuyor.<br><a href="urunler.html">Mağazamıza göz atın →</a></p>';
}

// ============ BAŞLAT ============
if (me) {
  Store.ready(() => {
    renderMyOrders();
    renderFavorites();
    Store.refreshOrders().then(renderMyOrders);
  });
}
