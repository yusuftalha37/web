// ============ YÖNETİM PANELİ ============

// Erişim koruması: yalnızca admin rolü girebilir.
// NOT: Bu istemci tarafı bir korumadır; sunucuya bağlanınca
// yetki kontrolü mutlaka sunucuda da yapılmalıdır.
const adminSession = Store.session();
if (!adminSession || adminSession.role !== "admin") {
  location.href = "giris.html";
}

const CAT_NAMES = {
  panel: "Güneş Paneli",
  inverter: "İnvertör",
  aku: "Akü",
  paket: "Hazır Paket"
};

const tlFmt = (n) => "₺" + Math.round(n).toLocaleString("tr-TR");
const dateFmt = (ts) =>
  new Date(ts).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

document.getElementById("adminUser").textContent = adminSession ? adminSession.name : "";

document.getElementById("adminLogout").addEventListener("click", (e) => {
  e.preventDefault();
  Store.logout();
  location.href = "giris.html";
});

// ---------- GÖRÜNÜM GEÇİŞLERİ ----------
const VIEW_TITLES = {
  dashboard: "Genel Bakış",
  products: "Ürünler",
  orders: "Siparişler",
  leads: "Keşif Talepleri",
  settings: "Ayarlar"
};

document.querySelectorAll(".admin-nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".admin-nav-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const view = btn.dataset.view;
    document.querySelectorAll(".admin-view").forEach((v) => (v.hidden = true));
    document.getElementById("view-" + view).hidden = false;
    document.getElementById("viewTitle").textContent = VIEW_TITLES[view];
    renderAll();
  });
});

// ---------- GENEL BAKIŞ ----------
function renderDashboard() {
  const products = Store.getProducts();
  const leads = Store.getLeads();
  const orders = Store.getOrders();
  const totalStock = products.reduce((s, p) => s + (p.stock || 0), 0);
  const orderTotal = orders.reduce((s, o) => s + (o.total || 0), 0);

  document.getElementById("statGrid").innerHTML = `
    <div class="stat-card"><span>Ürün Çeşidi</span><strong>${products.length}</strong></div>
    <div class="stat-card"><span>Toplam Stok</span><strong>${totalStock}</strong></div>
    <div class="stat-card"><span>Sipariş Talebi</span><strong>${orders.length}</strong></div>
    <div class="stat-card"><span>Sipariş Hacmi</span><strong>${tlFmt(orderTotal)}</strong></div>
    <div class="stat-card"><span>Keşif Talebi</span><strong>${leads.length}</strong></div>
  `;

  document.getElementById("recentLeads").innerHTML =
    leads.slice(0, 5).map((l) => `
      <tr>
        <td>${dateFmt(l.date)}</td>
        <td>${escHtml(l.name)}</td>
        <td>${escHtml(l.phone)}</td>
        <td>${escHtml(l.city || "—")}</td>
        <td>${escHtml(l.type || "—")}</td>
      </tr>`).join("") ||
    '<tr><td colspan="5" class="empty-row">Henüz keşif talebi yok.</td></tr>';
}

// ---------- ÜRÜNLER ----------
const productModal = document.getElementById("productModal");
const productForm = document.getElementById("productForm");

function thumbHtml(p) {
  return p.photo
    ? `<img class="table-thumb" src="${escHtml(p.photo)}" alt="">`
    : '<span class="table-thumb table-thumb-empty">—</span>';
}

function renderProducts() {
  const products = Store.getProducts();
  document.getElementById("productRows").innerHTML =
    products.map((p) => `
      <tr>
        <td>${thumbHtml(p)}</td>
        <td class="cell-strong">${escHtml(p.name)}</td>
        <td>${CAT_NAMES[p.cat] || p.cat}</td>
        <td>${tlFmt(p.price)}</td>
        <td>${p.stock <= 5 ? `<span class="pill pill-warn">${p.stock} adet</span>` : p.stock + " adet"}</td>
        <td class="cell-actions">
          <button class="row-btn" data-act="edit" data-id="${p.id}">Düzenle</button>
          <button class="row-btn row-btn-danger" data-act="del" data-id="${p.id}">Sil</button>
        </td>
      </tr>`).join("") ||
    '<tr><td colspan="6" class="empty-row">Ürün yok. "Yeni Ürün Ekle" ile başlayın.</td></tr>';
}

// --- Fotoğraf yükleme ---
const photoPreview = document.getElementById("pfPreview");
const photoFile = document.getElementById("pfPhotoFile");
const photoUrl = document.getElementById("pfPhotoUrl");
let currentPhoto = "";

function setPhoto(src) {
  currentPhoto = src || "";
  photoPreview.innerHTML = currentPhoto
    ? `<img src="${escHtml(currentPhoto)}" alt="Önizleme">`
    : "<span>Fotoğraf<br>yok</span>";
}

// Seçilen dosyayı en fazla 900px olacak şekilde küçültüp JPEG'e çevirir;
// böylece localStorage kotası dolmaz, sunucuya geçince de küçük dosya gider.
photoFile.addEventListener("change", () => {
  const file = photoFile.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    const MAX = 900;
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL("image/jpeg", 0.82));
    URL.revokeObjectURL(img.src);
    photoUrl.value = "";
  };
  img.onerror = () => alert("Bu dosya bir görsel olarak okunamadı.");
  img.src = URL.createObjectURL(file);
});

photoUrl.addEventListener("change", () => {
  const url = photoUrl.value.trim();
  if (!url) return;
  if (!/^https?:\/\//.test(url)) {
    alert("Görsel bağlantısı http:// veya https:// ile başlamalıdır.");
    return;
  }
  setPhoto(url);
  photoFile.value = "";
});

document.getElementById("pfPhotoRemove").addEventListener("click", () => {
  setPhoto("");
  photoFile.value = "";
  photoUrl.value = "";
});

function openProductModal(product) {
  document.getElementById("productModalTitle").textContent = product ? "Ürünü Düzenle" : "Yeni Ürün";
  document.getElementById("pfId").value = product ? product.id : "";
  document.getElementById("pfName").value = product ? product.name : "";
  document.getElementById("pfCat").value = product ? product.cat : "panel";
  document.getElementById("pfImg").value = product ? product.img : "panel";
  document.getElementById("pfPrice").value = product ? product.price : "";
  document.getElementById("pfStock").value = product ? product.stock : "";
  document.getElementById("pfSpecs").value = product ? product.specs.join("\n") : "";
  photoFile.value = "";
  photoUrl.value = product && product.photo && !product.photo.startsWith("data:") ? product.photo : "";
  setPhoto(product ? product.photo : "");
  productModal.hidden = false;
  document.getElementById("pfName").focus();
}

document.getElementById("newProductBtn").addEventListener("click", () => openProductModal(null));
document.getElementById("productModalClose").addEventListener("click", () => (productModal.hidden = true));
productModal.addEventListener("click", (e) => {
  if (e.target === productModal) productModal.hidden = true;
});

document.getElementById("productRows").addEventListener("click", (e) => {
  const btn = e.target.closest(".row-btn");
  if (!btn) return;
  const { id, act } = btn.dataset;
  const product = Store.getProducts().find((p) => p.id === id);
  if (act === "edit" && product) openProductModal(product);
  if (act === "del" && product && confirm(`"${product.name}" silinsin mi?`)) {
    Store.deleteProduct(id);
    renderAll();
  }
});

productForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("pfId").value || "p-" + Date.now();
  try {
    Store.saveProduct({
      id,
      name: document.getElementById("pfName").value.trim(),
      cat: document.getElementById("pfCat").value,
      img: document.getElementById("pfImg").value,
      photo: currentPhoto,
      price: parseInt(document.getElementById("pfPrice").value, 10) || 0,
      stock: parseInt(document.getElementById("pfStock").value, 10) || 0,
      specs: document.getElementById("pfSpecs").value
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    });
  } catch (err) {
    // localStorage kotası dolduysa (çok sayıda büyük fotoğraf)
    alert("Kayıt başarısız: tarayıcı depolama alanı doldu. Daha az/küçük fotoğraf kullanın veya görsel bağlantısı tercih edin.");
    return;
  }
  productModal.hidden = true;
  renderAll();
});

// ---------- SİPARİŞLER ----------
function renderOrders() {
  const orders = Store.getOrders();
  document.getElementById("orderList").innerHTML =
    orders.map((o) => `
      <div class="order-card">
        <div class="order-head">
          <strong>${escHtml(o.customer || "Ziyaretçi")}</strong>
          <span>${dateFmt(o.date)}</span>
        </div>
        <ul class="order-items">
          ${o.items.map((i) => `<li>${i.qty} × ${escHtml(i.name)} <span>${tlFmt(i.price * i.qty)}</span></li>`).join("")}
        </ul>
        <div class="order-total">Toplam: <strong>${tlFmt(o.total)}</strong></div>
      </div>`).join("") ||
    '<p class="empty-row">Henüz sipariş talebi yok.</p>';
}

// ---------- KEŞİF TALEPLERİ ----------
function renderLeads() {
  const leads = Store.getLeads();
  document.getElementById("leadRows").innerHTML =
    leads.map((l, i) => `
      <tr>
        <td>${dateFmt(l.date)}</td>
        <td class="cell-strong">${escHtml(l.name)}</td>
        <td>${escHtml(l.phone)}</td>
        <td>${escHtml(l.city || "—")}</td>
        <td>${escHtml(l.type || "—")}</td>
        <td class="cell-msg">${escHtml(l.message || "—")}</td>
        <td class="cell-actions"><button class="row-btn row-btn-danger" data-i="${i}">Sil</button></td>
      </tr>`).join("") ||
    '<tr><td colspan="7" class="empty-row">Henüz keşif talebi yok.</td></tr>';
}

document.getElementById("leadRows").addEventListener("click", (e) => {
  const btn = e.target.closest(".row-btn");
  if (!btn) return;
  if (confirm("Bu talep silinsin mi?")) {
    Store.deleteLead(parseInt(btn.dataset.i, 10));
    renderAll();
  }
});

// ---------- AYARLAR ----------
const waNumberInput = document.getElementById("waNumber");
waNumberInput.value = Store.getSettings().whatsapp;

document.getElementById("settingsForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const status = document.getElementById("settingsStatus");
  const num = waNumberInput.value.replace(/\D/g, "");
  if (num.length < 11) {
    status.textContent = "Geçerli bir numara girin (örn. 905321234567).";
    status.className = "form-status err";
    return;
  }
  Store.saveSettings({ whatsapp: num });
  waNumberInput.value = num;
  status.textContent = "Kaydedildi.";
  status.className = "form-status ok";
});

// ---------- TÜMÜNÜ ÇİZ ----------
function renderAll() {
  renderDashboard();
  renderProducts();
  renderOrders();
  renderLeads();
}

renderAll();
