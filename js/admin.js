// ============ YÖNETİM PANELİ ============

// Erişim koruması: yalnızca admin rolü girebilir.
// NOT: Bu istemci tarafı bir korumadır; sunucuya bağlanınca
// yetki kontrolü mutlaka sunucuda da yapılmalıdır.
const adminSession = Store.session();
if (!adminSession || adminSession.role !== "admin") {
  location.href = "giris.html";
}

function catName(id) {
  const c = Store.getCategories().find((c) => c.id === id);
  return c ? c.name : "Diğer";
}

// Ürün formlarındaki kategori listelerini doldurur (seçim korunur)
function populateCatSelects() {
  const options = Store.getCategories()
    .map((c) => `<option value="${c.id}">${escHtml(c.name)}</option>`)
    .join("");
  ["pfCat", "upCat"].forEach((id) => {
    const sel = document.getElementById(id);
    const current = sel.value;
    sel.innerHTML = options;
    if (current && [...sel.options].some((o) => o.value === current)) sel.value = current;
  });
}

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
  upload: "Ürün Yükle",
  categories: "Kategoriler",
  orders: "Siparişler",
  leads: "İletişim Talepleri",
  settings: "Ayarlar"
};

// Görsel dosyasını en fazla 900px olacak şekilde küçültüp JPEG'e çevirir;
// hem düzenleme penceresi hem ürün yükleme ekranı kullanır.
function readImageFile(file, cb) {
  const img = new Image();
  img.onload = () => {
    const MAX = 900;
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(img.src);
    cb(canvas.toDataURL("image/jpeg", 0.82));
  };
  img.onerror = () => alert("Bu dosya bir görsel olarak okunamadı.");
  img.src = URL.createObjectURL(file);
}

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
    <div class="stat-card"><span>İletişim Talebi</span><strong>${leads.length}</strong></div>
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
    '<tr><td colspan="5" class="empty-row">Henüz iletişim talebi yok.</td></tr>';
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
        <td class="cell-strong">${p.hit ? '<span class="hit-star" title="Çok satan">★</span> ' : ""}${escHtml(p.name)}</td>
        <td>${escHtml(catName(p.cat))}</td>
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

photoFile.addEventListener("change", () => {
  const file = photoFile.files[0];
  if (!file) return;
  readImageFile(file, (dataUrl) => {
    setPhoto(dataUrl);
    photoUrl.value = "";
  });
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
  document.getElementById("pfHit").checked = !!(product && product.hit);
  photoFile.value = "";
  photoUrl.value = product && product.photo && !product.photo.startsWith("data:") ? product.photo : "";
  setPhoto(product ? product.photo : "");
  productModal.hidden = false;
  document.getElementById("pfName").focus();
}

// "Yeni Ürün Ekle" butonu Ürün Yükle ekranına götürür
document.getElementById("newProductBtn").addEventListener("click", () => {
  document.querySelector('.admin-nav-btn[data-view="upload"]').click();
});
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
      hit: document.getElementById("pfHit").checked,
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

// ---------- ÜRÜN YÜKLE EKRANI ----------
const uploadForm = document.getElementById("uploadForm");
const dropZone = document.getElementById("dropZone");
const dropZoneInner = document.getElementById("dropZoneInner");
const upPhotoFile = document.getElementById("upPhotoFile");
const upPhotoUrl = document.getElementById("upPhotoUrl");
const uploadPreview = document.getElementById("uploadPreview");
const upStatus = document.getElementById("upStatus");
let uploadPhoto = "";

const DROP_ZONE_DEFAULT = dropZoneInner.innerHTML;

function setUploadPhoto(src) {
  uploadPhoto = src || "";
  dropZoneInner.innerHTML = uploadPhoto
    ? `<img src="${escHtml(uploadPhoto)}" alt="Önizleme"><span>Değiştirmek için tıklayın veya yeni fotoğraf sürükleyin</span>`
    : DROP_ZONE_DEFAULT;
  dropZone.classList.toggle("has-photo", !!uploadPhoto);
  renderUploadPreview();
}

dropZone.addEventListener("click", () => upPhotoFile.click());

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag");
});

dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag"));

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag");
  const file = e.dataTransfer.files[0];
  if (!file) return;
  readImageFile(file, (dataUrl) => {
    setUploadPhoto(dataUrl);
    upPhotoUrl.value = "";
  });
});

upPhotoFile.addEventListener("change", () => {
  const file = upPhotoFile.files[0];
  if (!file) return;
  readImageFile(file, (dataUrl) => {
    setUploadPhoto(dataUrl);
    upPhotoUrl.value = "";
  });
});

upPhotoUrl.addEventListener("change", () => {
  const url = upPhotoUrl.value.trim();
  if (!url) return;
  if (!/^https?:\/\//.test(url)) {
    alert("Görsel bağlantısı http:// veya https:// ile başlamalıdır.");
    return;
  }
  setUploadPhoto(url);
  upPhotoFile.value = "";
});

document.getElementById("upPhotoRemove").addEventListener("click", () => {
  setUploadPhoto("");
  upPhotoFile.value = "";
  upPhotoUrl.value = "";
});

// Mağazadaki ürün kartının birebir önizlemesi
function renderUploadPreview() {
  const name = document.getElementById("upName").value.trim() || "Ürün adı";
  const cat = document.getElementById("upCat").value;
  const img = document.getElementById("upImg").value;
  const price = parseInt(document.getElementById("upPrice").value, 10) || 0;
  const stock = parseInt(document.getElementById("upStock").value, 10);
  const specs = document.getElementById("upSpecs").value
    .split("\n").map((s) => s.trim()).filter(Boolean);
  const low = !isNaN(stock) && stock <= 5;

  uploadPreview.innerHTML = `
    <article class="product">
      <div class="product-img${uploadPhoto ? " has-photo" : ""}">
        <span class="stock-badge${low ? " low" : ""}">${low ? "Son " + stock + " adet" : "Stokta"}</span>
        ${uploadPhoto
          ? `<img src="${escHtml(uploadPhoto)}" alt="">`
          : (PRODUCT_ART[img] || PRODUCT_ART.panel)}
      </div>
      <div class="product-body">
        <span class="product-cat">${escHtml(catName(cat))}</span>
        <h3>${escHtml(name)}</h3>
        <ul class="product-specs">${specs.map((s) => `<li>${escHtml(s)}</li>`).join("") || "<li>Ürün özellikleri</li>"}</ul>
        <div class="product-foot">
          <div class="product-price">${tlFmt(price)}<span>KDV dahil</span></div>
          <button class="add-btn" type="button">Sepete Ekle</button>
        </div>
      </div>
    </article>`;
}

["upName", "upCat", "upImg", "upPrice", "upStock", "upSpecs"].forEach((id) => {
  document.getElementById(id).addEventListener("input", renderUploadPreview);
});

uploadForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("upName").value.trim();
  const price = parseInt(document.getElementById("upPrice").value, 10) || 0;
  if (!name || price <= 0) {
    upStatus.textContent = "Lütfen ürün adını ve geçerli bir fiyat girin.";
    upStatus.className = "form-status err";
    return;
  }
  try {
    Store.saveProduct({
      id: "p-" + Date.now(),
      name,
      cat: document.getElementById("upCat").value,
      img: document.getElementById("upImg").value,
      photo: uploadPhoto,
      hit: document.getElementById("upHit").checked,
      price,
      stock: parseInt(document.getElementById("upStock").value, 10) || 0,
      specs: document.getElementById("upSpecs").value
        .split("\n").map((s) => s.trim()).filter(Boolean)
    });
  } catch (err) {
    upStatus.textContent = "Kayıt başarısız: tarayıcı depolama alanı doldu. Daha küçük fotoğraf kullanın.";
    upStatus.className = "form-status err";
    return;
  }
  upStatus.textContent = '"' + name + '" mağazaya eklendi.';
  upStatus.className = "form-status ok";
  uploadForm.reset();
  setUploadPhoto("");
  renderAll();
});

renderUploadPreview();

// ---------- KATEGORİLER ----------
function renderCategories() {
  const cats = Store.getCategories();
  const products = Store.getProducts();
  document.getElementById("catRows").innerHTML =
    cats.map((c) => {
      const count = products.filter((p) => p.cat === c.id).length;
      return `
      <tr>
        <td class="cell-strong">${escHtml(c.name)}</td>
        <td>${count} ürün</td>
        <td class="cell-actions">
          <button class="row-btn" data-act="rename" data-id="${c.id}">Yeniden Adlandır</button>
          <button class="row-btn row-btn-danger" data-act="delcat" data-id="${c.id}">Sil</button>
        </td>
      </tr>`;
    }).join("") ||
    '<tr><td colspan="3" class="empty-row">Henüz kategori yok.</td></tr>';
}

document.getElementById("catForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("catNameInput");
  const status = document.getElementById("catStatus");
  const name = input.value.trim();
  if (!name) return;
  if (Store.getCategories().some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    status.textContent = "Bu isimde bir kategori zaten var.";
    status.className = "form-status err";
    return;
  }
  Store.saveCategory({ name });
  status.textContent = '"' + name + '" kategorisi eklendi.';
  status.className = "form-status ok";
  input.value = "";
  renderAll();
});

document.getElementById("catRows").addEventListener("click", (e) => {
  const btn = e.target.closest(".row-btn");
  if (!btn) return;
  const { id, act } = btn.dataset;
  const cat = Store.getCategories().find((c) => c.id === id);
  if (!cat) return;

  if (act === "rename") {
    const name = prompt("Kategorinin yeni adı:", cat.name);
    if (name && name.trim()) {
      Store.saveCategory({ id, name });
      renderAll();
    }
  }

  if (act === "delcat") {
    const count = Store.getProducts().filter((p) => p.cat === id).length;
    if (count > 0) {
      alert('"' + cat.name + '" kategorisinde ' + count + " ürün var. Silmeden önce bu ürünleri başka bir kategoriye taşıyın veya silin.");
      return;
    }
    if (confirm('"' + cat.name + '" kategorisi silinsin mi?')) {
      Store.deleteCategory(id);
      renderAll();
    }
  }
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
    '<tr><td colspan="7" class="empty-row">Henüz iletişim talebi yok.</td></tr>';
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
  populateCatSelects();
  renderDashboard();
  renderProducts();
  renderCategories();
  renderOrders();
  renderLeads();
  renderUploadPreview();
}

renderAll();
