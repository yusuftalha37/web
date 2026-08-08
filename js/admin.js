// ============ YÖNETİM PANELİ ============

// Erişim koruması: yalnızca admin rolü girebilir.
// NOT: Bu istemci tarafı bir korumadır; sunucuya bağlanınca
// yetki kontrolü mutlaka sunucuda da yapılmalıdır.
const adminSession = Store.session();
if (!adminSession || adminSession.role !== "admin") {
  location.href = "giris.html";
}

Store.ready(function () {

function catName(id) {
  const c = Store.getCategories().find((c) => c.id === id);
  return c ? c.name : "Diğer";
}

// Ürün formlarındaki kategori listelerini doldurur (seçim korunur)
// Ağaçtaki derinliğe göre girinti öneki ("— — Ad")
function catIndent(depth) { return depth ? "  ".repeat(depth) + "└ " : ""; }

function populateCatSelects() {
  // Kategori listesi hiyerarşik: alt kategoriler girintili görünür.
  // Markalar burada YOKTUR — onlar hiyerarşi dışı, ayrı kutularda seçilir.
  const options = Store.catTree()
    .map((n) => `<option value="${n.cat.id}">${catIndent(n.depth)}${escHtml(n.cat.name)}</option>`)
    .join("");
  ["pfCat", "upCat"].forEach((id) => {
    const sel = document.getElementById(id);
    const current = sel.value;
    sel.innerHTML = options;
    if (current && [...sel.options].some((o) => o.value === current)) sel.value = current;
  });
  // Marka kutuları: tüm markalar (kategoriden bağımsız), işaretliler korunur
  renderBrandChecks("pfCats");
  renderBrandChecks("upCats");
}

// Tüm markaları kutu grubu olarak çizer. Markalar hiyerarşiden bağımsızdır:
// hangi kategori seçili olursa olsun aynı liste görünür.
function renderBrandChecks(containerId) {
  const box = document.getElementById(containerId);
  if (!box) return;
  const checked = getCheckedCats(containerId);
  const brands = Store.getBrands();
  let html = brands.map((c) =>
    `<label class="cat-check"><input type="checkbox" name="${containerId}" value="${escHtml(c.id)}"> <span>${escHtml(c.name)} <em class="cat-check-brand">marka</em></span></label>`
  ).join("");
  if (!brands.length) {
    html = '<span class="cat-check-empty">Henüz marka yok. Aşağıdan hemen ekleyebilirsiniz:</span>';
  }
  // Buradan doğrudan yeni marka ekleme — Kategoriler ekranına gitmeye gerek yok
  html += `<div class="cat-brand-add">
      <input type="text" class="cat-brand-add-input" placeholder="Yeni marka (ör. Lexron)" data-box="${containerId}">
      <button type="button" class="btn btn-small cat-brand-add-btn" data-box="${containerId}">+ Marka Ekle</button>
    </div>`;
  box.innerHTML = html;
  setCheckedCats(containerId, checked);
}

// Ürün formundan doğrudan yeni marka ekle (hiyerarşi dışı, üst kategori almaz)
function addBrandInline(boxId) {
  const box = document.getElementById(boxId);
  if (!box) return;
  const input = box.querySelector(".cat-brand-add-input");
  const name = (input && input.value.trim()) || "";
  if (!name) { if (input) input.focus(); return; }
  const existing = Store.getCategories().find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (existing && !Store.isBrandCat(existing)) {
    alert("“" + name + "” zaten bir kategori adı. Marka için farklı bir ad girin.");
    return;
  }
  if (!existing) Store.saveCategory({ name, kind: "brand" });
  const nb = Store.getCategories().find((c) => c.name.toLowerCase() === name.toLowerCase() && Store.isBrandCat(c));
  const keep = getCheckedCats(boxId).concat(nb ? [nb.id] : []);
  renderBrandChecks(boxId);
  setCheckedCats(boxId, keep);
}

// "+ Marka Ekle" butonu ve Enter tuşu (form gönderimini engelleyerek)
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".cat-brand-add-btn");
  if (btn) { e.preventDefault(); addBrandInline(btn.dataset.box); }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.classList && e.target.classList.contains("cat-brand-add-input")) {
    e.preventDefault();
    addBrandInline(e.target.dataset.box);
  }
});

function setCheckedCats(containerId, ids) {
  ids = Array.isArray(ids) ? ids : [];
  document.querySelectorAll("#" + containerId + " input[type=checkbox]").forEach((cb) => {
    cb.checked = ids.indexOf(cb.value) !== -1;
  });
}
function getCheckedCats(containerId, excludeId) {
  return [...document.querySelectorAll("#" + containerId + " input[type=checkbox]:checked")]
    .map((cb) => cb.value)
    .filter((v) => v !== excludeId);
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
  slides: "Vitrin (Slider)",
  orders: "Siparişler",
  users: "Kullanıcılar",
  leads: "İletişim Talepleri",
  content: "Site İçeriği",
  settings: "Ayarlar"
};

// Kayıt hatasını kullanıcı diline çevirir (sunucu/depolama kaynaklı)
function saveErrorText(err) {
  const msg = String((err && err.message) || err || "");
  if (/too_large|413/i.test(msg)) return "Kayıt başarısız: fotoğraf çok büyük. Daha küçük bir görsel seçin veya görsel bağlantısı kullanın.";
  if (/quota|exceeded|storage/i.test(msg)) return "Kayıt başarısız: tarayıcı depolama alanı doldu. Daha az/küçük fotoğraf kullanın.";
  if (/401|403|unauthorized|izin/i.test(msg)) return "Kayıt başarısız: oturum süreniz dolmuş olabilir. Çıkış yapıp tekrar giriş yapın.";
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return "Kayıt başarısız: sunucuya ulaşılamadı. Sunucunun (server.js) çalıştığından emin olun.";
  return "Kayıt başarısız: " + (msg || "bilinmeyen hata") + ". Sunucunun çalıştığından ve dosyaların güncel olduğundan emin olun.";
}

function readImageFile(file, cb, maxSize) {
  if (!file || !file.type.startsWith("image/")) {
    alert("Lütfen geçerli bir görsel dosyası seçin (JPG, PNG, WebP vb.).");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    alert("Dosya çok büyük (maks. 10 MB). Lütfen daha küçük bir görsel seçin.");
    return;
  }
  const MAX = maxSize || 900;
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(img.src);

    const s = Store.session();
    const token = s && s.token;
    if (Store.mode === "supabase" && token) {
      canvas.toBlob((blob) => {
        if (!blob) { alert("Görsel işlenemedi."); return; }
        const fd = new FormData();
        const ext = (file.name.match(/\.(jpe?g|png|webp)$/i) || [".jpg"])[0];
        fd.append("file", blob, "img" + ext);
        fetch("/api/upload-image", {
          method: "POST",
          headers: { Authorization: "Bearer " + token },
          body: fd
        })
          .then((r) => r.json().then((d) => ({ ok: r.ok, status: r.status, data: d })))
          .then(({ ok, status, data }) => {
            if (ok && data.url) cb(data.url);
            else if (status === 401 || status === 403) alert("Oturum süreniz dolmuş. Lütfen çıkış yapıp tekrar giriş yapın.");
            else if (status === 413) alert("Dosya çok büyük. Lütfen 10 MB'den küçük bir görsel seçin.");
            else alert("Resim yüklenemedi: " + (data.error_description || data.error || "Bilinmeyen hata"));
          })
          .catch(() => alert("Resim yüklenirken bağlantı hatası oluştu. İnternet bağlantınızı kontrol edin."));
      }, "image/jpeg", 0.85);
    } else {
      cb(canvas.toDataURL("image/jpeg", 0.82));
    }
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
    // Sipariş/talep ekranlarına girildiğinde sunucudan taze veri çek
    if (view === "orders" || view === "leads" || view === "dashboard") {
      Store.refreshOrders().then(() => { renderOrders(); renderLeads(); renderDashboard(); });
    }
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
        <td class="cell-strong">${p.hit ? '<span class="hit-star" title="Çok satan">★</span> ' : ""}${escHtml(p.name)}${p.authorized ? ' <span class="pill pill-ok">Yetkili</span>' : ""}</td>
        <td>${escHtml(Store.catPath(p.cat) || catName(p.cat))}${
          (p.cats || []).length ? '<br><span class="cat-note">' + escHtml((p.cats || []).map(catName).join(", ")) + "</span>" : ""
        }</td>
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
  // Üst kategoriye göre marka listesini kur, sonra ürünün markalarını işaretle
  renderBrandChecks("pfCats");
  setCheckedCats("pfCats", product ? product.cats : []);
  document.getElementById("pfImg").value = product ? product.img : "panel";
  document.getElementById("pfPrice").value = product ? product.price : "";
  document.getElementById("pfStock").value = product ? product.stock : "";
  document.getElementById("pfSpecs").value = product ? product.specs.join("\n") : "";
  document.getElementById("pfHit").checked = !!(product && product.hit);
  document.getElementById("pfAuthorized").checked = !!(product && product.authorized);
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

document.getElementById("productRows").addEventListener("click", async (e) => {
  const btn = e.target.closest(".row-btn");
  if (!btn) return;
  const { id, act } = btn.dataset;
  const product = Store.getProducts().find((p) => p.id === id);
  if (act === "edit" && product) openProductModal(product);
  if (act === "del" && product && confirm(`"${product.name}" silinsin mi?`)) {
    try {
      await Store.deleteProduct(id);
      renderAll();
    } catch (err) {
      alert("Silme başarısız: " + (err.message || "Sunucu hatası. Oturumunuzu kontrol edin."));
      await Store.reload();
      renderAll();
    }
  }
});

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("pfId").value || "p-" + Date.now();
  const saveBtn = productForm.querySelector('button[type=submit]');
  const oldLabel = saveBtn ? saveBtn.textContent : "";
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = "Kaydediliyor…"; }
  try {
    await Store.saveProduct({
      id,
      name: document.getElementById("pfName").value.trim(),
      cat: document.getElementById("pfCat").value,
      cats: getCheckedCats("pfCats", document.getElementById("pfCat").value),
      img: document.getElementById("pfImg").value,
      photo: currentPhoto,
      hit: document.getElementById("pfHit").checked,
      authorized: document.getElementById("pfAuthorized").checked,
      price: parseInt(document.getElementById("pfPrice").value, 10) || 0,
      stock: parseInt(document.getElementById("pfStock").value, 10) || 0,
      specs: document.getElementById("pfSpecs").value
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    });
  } catch (err) {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = oldLabel; }
    alert(saveErrorText(err));
    return;
  }
  if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = oldLabel; }
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
  const authorized = document.getElementById("upAuthorized").checked;
  const authLabel = Store.getSiteContent().authorizedLabel || "Yetkili Satıcı";

  uploadPreview.innerHTML = `
    <article class="product">
      <div class="product-img${uploadPhoto ? " has-photo" : ""}">
        <span class="stock-badge${low ? " low" : ""}">${low ? "Son " + stock + " adet" : "Stokta"}</span>
        ${authorized ? `<span class="auth-ribbon">${escHtml(authLabel)}</span>` : ""}
        ${uploadPhoto
          ? `<img src="${escHtml(uploadPhoto)}" alt="">`
          : (PRODUCT_ART[img] || PRODUCT_ART.panel)}
      </div>
      <div class="product-body">
        <span class="product-cat">${escHtml(catName(cat))}</span>
        ${authorized ? `<span class="auth-badge"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>${escHtml(authLabel)}</span>` : ""}
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
document.getElementById("upAuthorized").addEventListener("change", renderUploadPreview);

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("upName").value.trim();
  const price = parseInt(document.getElementById("upPrice").value, 10) || 0;
  if (!name || price <= 0) {
    upStatus.textContent = "Lütfen ürün adını ve geçerli bir fiyat girin.";
    upStatus.className = "form-status err";
    return;
  }
  upStatus.textContent = "Kaydediliyor…";
  upStatus.className = "form-status ok";
  try {
    await Store.saveProduct({
      id: "p-" + Date.now(),
      name,
      cat: document.getElementById("upCat").value,
      cats: getCheckedCats("upCats", document.getElementById("upCat").value),
      img: document.getElementById("upImg").value,
      photo: uploadPhoto,
      hit: document.getElementById("upHit").checked,
      authorized: document.getElementById("upAuthorized").checked,
      price,
      stock: parseInt(document.getElementById("upStock").value, 10) || 0,
      specs: document.getElementById("upSpecs").value
        .split("\n").map((s) => s.trim()).filter(Boolean)
    });
  } catch (err) {
    upStatus.textContent = saveErrorText(err);
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
  const products = Store.getProducts();
  const tree = Store.catTree();          // hiyerarşi (derinlikli, DFS sırasında)
  const brands = Store.getBrands();      // hiyerarşi dışı düz liste
  const countOf = (id) => products.filter((p) => Store.productCatIds(p).indexOf(id) !== -1).length;
  const thumbOf = (c) => c.image
    ? `<img class="table-thumb" src="${escHtml(c.image)}" alt="">`
    : '<span class="table-thumb table-thumb-empty">—</span>';

  // Hiyerarşi satırı — üst kategorisi açılır listeden değiştirilebilir (taşıma)
  const treeRow = (c, depth) => {
    // Kendisi ve alt ağacı seçenek olarak sunulmaz (döngü olurdu)
    const opts = tree
      .filter((n) => Store.canReparent(c.id, n.cat.id))
      .map((n) => `<option value="${n.cat.id}"${(c.parent || "") === n.cat.id ? " selected" : ""}>${catIndent(n.depth)}${escHtml(n.cat.name)}</option>`)
      .join("");
    const level = depth === 0 ? "Ana kategori" : depth + ". seviye";
    return `
      <tr class="cat-row-tree cat-row-d${depth > 3 ? 3 : depth}">
        <td>${thumbOf(c)}</td>
        <td class="cell-strong">${depth ? '<span class="cat-branch">' + "&nbsp;".repeat(depth * 3) + "└</span> " : ""}${escHtml(c.name)}</td>
        <td>
          <span class="pill pill-ok">${level}</span>
          <select class="cat-parent-sel" data-id="${c.id}" title="Üst kategori — değiştirerek taşıyın">
            <option value="">— en üst seviye —</option>${opts}
          </select>
        </td>
        <td>${countOf(c.id)}</td>
        <td class="cell-actions">
          <button class="row-btn" data-act="addchild" data-id="${c.id}">+ Alt Kategori</button>
          <button class="row-btn" data-act="setimg" data-id="${c.id}">${c.image ? "Görseli Değiştir" : "Görsel Ekle"}</button>
          ${c.image ? `<button class="row-btn" data-act="rmimg" data-id="${c.id}">Görseli Kaldır</button>` : ""}
          <button class="row-btn" data-act="rename" data-id="${c.id}">Yeniden Adlandır</button>
          <button class="row-btn row-btn-accent" data-act="tobrand" data-id="${c.id}">Markaya Çevir</button>
          <button class="row-btn row-btn-danger" data-act="delcat" data-id="${c.id}">Sil</button>
        </td>
      </tr>`;
  };

  // Marka satırı — hiyerarşi dışı, üst kategori seçimi yoktur
  const brandRow = (c) => `
      <tr class="cat-row-brand">
        <td>${thumbOf(c)}</td>
        <td class="cell-strong">${escHtml(c.name)}</td>
        <td><span class="pill pill-warn">Marka</span> <em class="cat-note">hiyerarşi dışı</em></td>
        <td>${countOf(c.id)}</td>
        <td class="cell-actions">
          <button class="row-btn" data-act="setimg" data-id="${c.id}">${c.image ? "Görseli Değiştir" : "Görsel Ekle"}</button>
          ${c.image ? `<button class="row-btn" data-act="rmimg" data-id="${c.id}">Görseli Kaldır</button>` : ""}
          <button class="row-btn" data-act="rename" data-id="${c.id}">Yeniden Adlandır</button>
          <button class="row-btn" data-act="totop" data-id="${c.id}">Kategoriye Çevir</button>
          <button class="row-btn row-btn-danger" data-act="delcat" data-id="${c.id}">Sil</button>
        </td>
      </tr>`;

  let html = '<tr class="cat-section-row"><td colspan="5">📂 Kategori hiyerarşisi <em>— üst kategoriyi değiştirerek istediğiniz seviyeye taşıyın</em></td></tr>';
  html += tree.length
    ? tree.map((n) => treeRow(n.cat, n.depth)).join("")
    : '<tr><td colspan="5" class="empty-row">Henüz kategori yok. Yukarıdaki formdan ekleyin.</td></tr>';
  html += '<tr class="cat-section-row"><td colspan="5">🏷 Markalar <em>— hiyerarşiden bağımsızdır, ürüne kategoriden ayrı olarak eklenir</em></td></tr>';
  html += brands.length
    ? brands.map(brandRow).join("")
    : '<tr><td colspan="5" class="empty-row">Henüz marka yok.</td></tr>';

  document.getElementById("catRows").innerHTML = html;

  // Üst kategori değişimi = ağaçta taşıma
  document.querySelectorAll("#catRows .cat-parent-sel").forEach((sel) => {
    sel.addEventListener("change", () => {
      Store.saveCategory({ id: sel.dataset.id, parent: sel.value });
      renderAll();
    });
  });
}

// Kategori formundaki "Üst kategori" listesini doldurur.
// Kategori (hiyerarşi) seçiliyse gösterilir; Marka seçiliyse gizlenir.
function refreshCatFormParent() {
  const kindSel = document.getElementById("catKind");
  const wrap = document.getElementById("catParentWrap");
  const parentSel = document.getElementById("catParent");
  if (!kindSel || !wrap || !parentSel) return;
  const isBrand = kindSel.value === "brand";
  const current = parentSel.value;
  parentSel.innerHTML = '<option value="">— en üst seviye (ana kategori) —</option>' +
    Store.catTree().map((n) => `<option value="${n.cat.id}">${catIndent(n.depth)}${escHtml(n.cat.name)}</option>`).join("");
  if (current && [...parentSel.options].some((o) => o.value === current)) parentSel.value = current;
  wrap.hidden = isBrand;
  // Ad alanı etiketi ve örneği türe göre değişsin
  const lbl = document.getElementById("catNameLabel");
  const inp = document.getElementById("catNameInput");
  if (lbl) lbl.textContent = isBrand ? "Marka adı" : "Kategori adı";
  if (inp) inp.placeholder = isBrand ? "Örn. Lexron" : "Örn. Hibrit İnvertörler";
}
document.getElementById("catKind").addEventListener("change", refreshCatFormParent);

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
  const kind = document.getElementById("catKind").value;
  // Marka hiyerarşi dışıdır; üst kategori yalnızca normal kategoriler için geçerli
  const parent = kind === "brand" ? "" : document.getElementById("catParent").value;
  Store.saveCategory({ name, kind, parent });
  status.textContent = kind === "brand"
    ? '"' + name + '" markası eklendi (hiyerarşi dışı).'
    : '"' + name + '" kategorisi eklendi' + (parent ? " — üst kategori: " + Store.catPath(parent) : " (en üst seviye)") + ".";
  status.className = "form-status ok";
  input.value = "";
  document.getElementById("catKind").value = "";
  document.getElementById("catParent").value = "";
  refreshCatFormParent();
  renderAll();
});

// Kategori görseli için gizli dosya girişi
const catImgFile = document.getElementById("catImgFile");
let pendingCatImgId = null;
catImgFile.addEventListener("change", () => {
  const file = catImgFile.files[0];
  if (!file || !pendingCatImgId) return;
  readImageFile(file, (dataUrl) => {
    Store.saveCategory({ id: pendingCatImgId, image: dataUrl });
    pendingCatImgId = null;
    catImgFile.value = "";
    renderAll();
  });
});

document.getElementById("catRows").addEventListener("click", async (e) => {
  const btn = e.target.closest(".row-btn");
  if (!btn) return;
  const { id, act } = btn.dataset;
  const cat = Store.getCategories().find((c) => c.id === id);
  if (!cat) return;

  if (act === "setimg") {
    pendingCatImgId = id;
    catImgFile.value = "";
    catImgFile.click();
    return;
  }

  if (act === "rmimg") {
    Store.saveCategory({ id, image: "" });
    renderAll();
    return;
  }

  if (act === "addchild") {
    const name = prompt('"' + cat.name + '" altına eklenecek alt kategorinin adı:');
    if (name && name.trim()) {
      if (Store.getCategories().some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
        alert("Bu isimde bir kategori zaten var.");
        return;
      }
      Store.saveCategory({ name: name.trim(), kind: "", parent: id });
      renderAll();
    }
    return;
  }

  if (act === "tobrand") {
    // Kategoriyi markaya çevir: hiyerarşiden çıkar. Alt kategorileri varsa
    // boşta kalmasınlar diye bir üst seviyeye taşınır.
    const kids = Store.catChildren(id);
    if (kids.length && !confirm('"' + cat.name + '" altındaki ' + kids.length + " alt kategori bir üst seviyeye taşınacak. Devam edilsin mi?")) return;
    const newParent = cat.parent || "";
    kids.forEach((k) => Store.saveCategory({ id: k.id, parent: newParent }));
    Store.saveCategory({ id, kind: "brand", parent: "" });
    renderAll();
    return;
  }
  if (act === "totop") {
    // Markayı hiyerarşiye al: en üst seviyede normal kategori olur
    Store.saveCategory({ id, kind: "", parent: "" });
    renderAll();
    return;
  }

  if (act === "rename") {
    const name = prompt("Kategorinin yeni adı:", cat.name);
    if (name && name.trim()) {
      Store.saveCategory({ id, name });
      renderAll();
    }
  }

  if (act === "delcat") {
    const count = Store.getProducts().filter((p) => Store.productCatIds(p).indexOf(id) !== -1).length;
    if (count > 0) {
      alert('"' + cat.name + '" kategorisinde ' + count + " ürün var. Silmeden önce bu ürünleri başka bir kategoriye taşıyın veya silin.");
      return;
    }
    const kids = Store.catChildren(id);
    const note = kids.length ? "\n\nAltındaki " + kids.length + " alt kategori bir üst seviyeye taşınacak." : "";
    if (confirm('"' + cat.name + '" silinsin mi?' + note)) {
      try {
        await Store.deleteCategory(id);
        renderAll();
      } catch (err) {
        alert("Silme başarısız: " + (err.message || "Sunucu hatası."));
        await Store.reload(); renderAll();
      }
    }
  }
});

// ---------- VİTRİN / SLIDER ----------
const slideForm = document.getElementById("slideForm");
const slDrop = document.getElementById("slDrop");
const slDropInner = document.getElementById("slDropInner");
const slPhotoFile = document.getElementById("slPhotoFile");
const slPhotoUrl = document.getElementById("slPhotoUrl");
let slidePhoto = "";
const SL_DROP_DEFAULT = slDropInner.innerHTML;

function setSlidePhoto(src) {
  slidePhoto = src || "";
  slDropInner.innerHTML = slidePhoto
    ? `<img src="${escHtml(slidePhoto)}" alt="Önizleme"><span>Değiştirmek için tıklayın veya yeni görsel sürükleyin</span>`
    : SL_DROP_DEFAULT;
  slDrop.classList.toggle("has-photo", !!slidePhoto);
}

slDrop.addEventListener("click", () => slPhotoFile.click());
slDrop.addEventListener("dragover", (e) => { e.preventDefault(); slDrop.classList.add("drag"); });
slDrop.addEventListener("dragleave", () => slDrop.classList.remove("drag"));
slDrop.addEventListener("drop", (e) => {
  e.preventDefault();
  slDrop.classList.remove("drag");
  const file = e.dataTransfer.files[0];
  if (file) readImageFile(file, (d) => { setSlidePhoto(d); slPhotoUrl.value = ""; }, 1920);
});
slPhotoFile.addEventListener("change", () => {
  const file = slPhotoFile.files[0];
  if (file) readImageFile(file, (d) => { setSlidePhoto(d); slPhotoUrl.value = ""; }, 1920);
});
slPhotoUrl.addEventListener("change", () => {
  const url = slPhotoUrl.value.trim();
  if (!url) return;
  if (!/^https?:\/\//.test(url)) { alert("Görsel bağlantısı http:// veya https:// ile başlamalıdır."); return; }
  setSlidePhoto(url);
  slPhotoFile.value = "";
});
document.getElementById("slPhotoRemove").addEventListener("click", () => {
  setSlidePhoto("");
  slPhotoFile.value = "";
  slPhotoUrl.value = "";
});

function resetSlideForm() {
  document.getElementById("slideFormTitle").textContent = "Yeni Slayt Ekle";
  document.getElementById("slId").value = "";
  document.getElementById("slTitle").value = "";
  document.getElementById("slSub").value = "";
  document.getElementById("slBtnText").value = "";
  document.getElementById("slBtnLink").value = "";
  document.getElementById("slArt").value = "roof";
  slPhotoFile.value = "";
  slPhotoUrl.value = "";
  setSlidePhoto("");
  document.getElementById("slCancel").hidden = true;
}

document.getElementById("slCancel").addEventListener("click", resetSlideForm);

function editSlide(s) {
  document.getElementById("slideFormTitle").textContent = "Slaytı Düzenle";
  document.getElementById("slId").value = s.id;
  document.getElementById("slTitle").value = s.title || "";
  document.getElementById("slSub").value = s.subtitle || "";
  document.getElementById("slBtnText").value = s.btnText || "";
  document.getElementById("slBtnLink").value = s.btnLink || "";
  document.getElementById("slArt").value = s.art || "roof";
  slPhotoUrl.value = s.image && !String(s.image).startsWith("data:") ? s.image : "";
  setSlidePhoto(s.image || "");
  document.getElementById("slCancel").hidden = false;
  window.scrollTo(0, 0);
}

function renderSlides() {
  const slides = Store.getSlides();
  document.getElementById("slideList").innerHTML =
    slides.map((s, i) => `
      <div class="slide-row">
        <div class="slide-row-thumb">${
          s.image ? `<img src="${escHtml(s.image)}" alt="">` : (SLIDE_ART[s.art] || SLIDE_ART.roof)
        }</div>
        <div class="slide-row-info">
          <strong>${escHtml(s.title || "(başlıksız)")}</strong>
          <span>${escHtml(s.subtitle || "")}</span>
        </div>
        <div class="slide-row-actions">
          <button class="row-btn" data-act="up" data-id="${s.id}" ${i === 0 ? "disabled" : ""} aria-label="Yukarı">↑</button>
          <button class="row-btn" data-act="down" data-id="${s.id}" ${i === slides.length - 1 ? "disabled" : ""} aria-label="Aşağı">↓</button>
          <button class="row-btn" data-act="edit" data-id="${s.id}">Düzenle</button>
          <button class="row-btn row-btn-danger" data-act="del" data-id="${s.id}">Sil</button>
        </div>
      </div>`).join("") ||
    '<p class="empty-row">Henüz slayt yok. Soldaki formdan ekleyin.</p>';
}

document.getElementById("slideList").addEventListener("click", async (e) => {
  const btn = e.target.closest(".row-btn");
  if (!btn) return;
  const { id, act } = btn.dataset;
  const slide = Store.getSlides().find((s) => s.id === id);
  if (act === "up") { Store.moveSlide(id, -1); renderSlides(); }
  if (act === "down") { Store.moveSlide(id, 1); renderSlides(); }
  if (act === "edit" && slide) editSlide(slide);
  if (act === "del" && slide && confirm("Bu slayt silinsin mi?")) {
    try {
      await Store.deleteSlide(id);
      if (document.getElementById("slId").value === id) resetSlideForm();
      renderSlides();
    } catch (err) {
      alert("Silme başarısız: " + (err.message || "Sunucu hatası."));
      await Store.reload(); renderSlides();
    }
  }
});

slideForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = document.getElementById("slStatus");
  const title = document.getElementById("slTitle").value.trim();
  if (!title) {
    status.textContent = "Lütfen bir başlık girin.";
    status.className = "form-status err";
    return;
  }
  try {
    await Store.saveSlide({
      id: document.getElementById("slId").value || "",
      image: slidePhoto,
      art: document.getElementById("slArt").value,
      title,
      subtitle: document.getElementById("slSub").value.trim(),
      btnText: document.getElementById("slBtnText").value.trim(),
      btnLink: document.getElementById("slBtnLink").value.trim() || "urunler.html"
    });
  } catch (err) {
    status.textContent = "Kaydetme başarısız: " + (err.message || "Sunucu hatası veya depolama alanı doldu.");
    status.className = "form-status err";
    return;
  }
  status.textContent = "Slayt kaydedildi.";
  status.className = "form-status ok";
  resetSlideForm();
  renderSlides();
});

// ---------- SİPARİŞLER ----------
const ORDER_STATUSES = [
  { value: "beklemede", label: "Beklemede", cls: "pill-warn" },
  { value: "odendi", label: "Ödendi", cls: "pill-ok" },
  { value: "kargoda", label: "Kargoda", cls: "pill-ok" },
  { value: "teslim", label: "Teslim Edildi", cls: "pill-ok" },
  { value: "iptal", label: "İptal", cls: "pill-danger" }
];

function orderStatusLabel(val) {
  const s = ORDER_STATUSES.find((x) => x.value === val);
  return s ? s.label : (val || "Beklemede");
}

function renderOrders() {
  const orders = Store.getOrders();
  const el = document.getElementById("orderList");
  el.innerHTML =
    orders.map((o) => {
      const st = o.status || "beklemede";
      const opts = ORDER_STATUSES.map((s) =>
        `<option value="${s.value}"${s.value === st ? " selected" : ""}>${s.label}</option>`
      ).join("");
      return `
      <div class="order-card" data-oid="${escHtml(o.id)}">
        <div class="order-head">
          <strong>${escHtml(o.customer || "Ziyaretçi")}</strong>
          <span>${dateFmt(o.date)}</span>
        </div>
        <div class="order-meta">
          <span class="pill ${o.payment === "eft" || o.payment === "card" ? "pill-warn" : "pill-ok"}">${o.payment === "eft" ? "Havale/EFT" : o.payment === "card" ? "Kredi Kartı" : "WhatsApp siparişi"}${o.id ? " · No: " + escHtml(o.id) : ""}</span>
          ${o.phone ? " · Tel: " + escHtml(o.phone) : ""}
          ${o.city ? " · " + escHtml(o.city) : ""}
        </div>
        <div class="order-status-row" style="margin:6px 0;display:flex;align-items:center;gap:8px">
          <label style="font-size:.85rem;font-weight:600;white-space:nowrap">Ödeme Durumu:</label>
          <select class="order-status-select" data-oid="${escHtml(o.id)}" style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);font-size:.85rem">${opts}</select>
          <span class="order-status-ok" style="color:var(--success);font-size:.82rem;display:none">✓ Kaydedildi</span>
        </div>
        ${o.address ? `<div class="order-addr">Adres: ${escHtml(o.address)}</div>` : ""}
        <ul class="order-items">
          ${o.items.map((i) => `<li>${i.qty} × ${escHtml(i.name)} <span>${tlFmt(i.price * i.qty)}</span></li>`).join("")}
        </ul>
        <div class="order-total">Toplam: <strong>${tlFmt(o.total)}</strong></div>
      </div>`;
    }).join("") ||
    '<p class="empty-row">Henüz sipariş talebi yok.</p>';
}

document.getElementById("orderList").addEventListener("change", (e) => {
  const sel = e.target.closest(".order-status-select");
  if (!sel) return;
  const oid = sel.dataset.oid;
  Store.updateOrderStatus(oid, sel.value);
  const ok = sel.parentElement.querySelector(".order-status-ok");
  if (ok) { ok.style.display = "inline"; setTimeout(() => (ok.style.display = "none"), 1500); }
});

document.getElementById("ordersRefreshBtn").addEventListener("click", () => {
  Store.refreshOrders().then(() => { renderOrders(); renderDashboard(); });
});

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

// ---------- KULLANICILAR ----------
// Geçerli yöneticinin kimliği (kendini değiştirememesi için):
// Supabase modunda uid, yerel modda e-posta.
const selfUserId = adminSession
  ? (Store.mode === "supabase" ? (adminSession.uid || "") : adminSession.email)
  : "";

function renderUsersModeNote() {
  const note = document.getElementById("usersModeNote");
  if (!note) return;
  if (Store.mode === "supabase") {
    note.innerHTML = '<div class="mode-note mode-note-ok">🟢 <strong>Sunucu modu.</strong> Müşteri kayıtları sunucuda saklanır ve burada listelenir.</div>';
  } else {
    note.innerHTML = '<div class="mode-note mode-note-warn">🔴 <strong>Demo modu (yalnızca bu tarayıcı).</strong> Site şu an sunucuya bağlı değil; müşterilerin kayıtları başka cihazlarda/tarayıcılarda saklanır ve burada GÖRÜNMEZ. Çözüm: siteyi <code>https://alanadınız</code> üzerinden açın ve <code>js/config.js</code> ayarının doğru olduğundan emin olun.</div>';
  }
}

let _allUsers = [];

async function renderUsers() {
  const tbody = document.getElementById("userRows");
  renderUsersModeNote();
  let users;
  try { users = await Store.listUsers(); }
  catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">Kullanıcılar yüklenemedi.</td></tr>';
    return;
  }
  if (users.length === 0 && Store.mode === "supabase") {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">Oturumunuz sunucuda geçerli değil. Lütfen <strong>Çıkış Yap</strong> deyip yeniden giriş yapın.</td></tr>';
    return;
  }
  _allUsers = users;
  filterAndRenderUsers();
}

function filterAndRenderUsers() {
  const tbody = document.getElementById("userRows");
  const q = (document.getElementById("userSearchInput").value || "").trim().toLowerCase();
  const users = q
    ? _allUsers.filter((u) =>
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q) ||
        (u.city || "").toLowerCase().includes(q))
    : _allUsers;
  tbody.innerHTML = users.map((u) => {
    const isSelf = String(u.id) === String(selfUserId);
    return `
      <tr>
        <td class="cell-strong">${escHtml(u.name || "—")}${isSelf ? ' <span class="pill pill-ok">siz</span>' : ""}</td>
        <td>${escHtml(u.email || "—")}</td>
        <td>${escHtml(u.phone || "—")}</td>
        <td>${escHtml(u.city || "—")}</td>
        <td>${u.role === "admin" ? '<span class="pill pill-warn">Yönetici</span>' : "Müşteri"}</td>
        <td>${u.blocked ? '<span class="pill pill-warn">Engelli</span>' : '<span class="pill pill-ok">Aktif</span>'}</td>
        <td class="cell-actions">${isSelf ? "—" : `
          <button class="row-btn row-btn-info" data-act="detail" data-id="${escHtml(u.id)}" data-email="${escHtml(u.email)}" data-name="${escHtml(u.name || "")}" data-phone="${escHtml(u.phone || "")}" data-city="${escHtml(u.city || "")}" data-role="${escHtml(u.role)}" data-created="${u.created || 0}">Detaylar</button>
          <button class="row-btn" data-act="role" data-id="${escHtml(u.id)}" data-role="${escHtml(u.role)}">${u.role === "admin" ? "Yetkiyi Al" : "Yönetici Yap"}</button>
          <button class="row-btn" data-act="block" data-id="${escHtml(u.id)}" data-blocked="${u.blocked ? 1 : 0}">${u.blocked ? "Engeli Kaldır" : "Engelle"}</button>
          <button class="row-btn row-btn-danger" data-act="deluser" data-id="${escHtml(u.id)}" data-name="${escHtml(u.name || u.email)}">Sil</button>`}
        </td>
      </tr>`;
  }).join("") ||
  (q ? '<tr><td colspan="7" class="empty-row">"' + escHtml(q) + '" ile eşleşen kullanıcı bulunamadı.</td></tr>'
     : '<tr><td colspan="7" class="empty-row">Henüz kayıtlı kullanıcı yok.</td></tr>');
}

document.getElementById("userSearchInput").addEventListener("input", filterAndRenderUsers);

document.getElementById("userRows").addEventListener("click", async (e) => {
  const btn = e.target.closest(".row-btn");
  if (!btn) return;
  const { id, act } = btn.dataset;
  if (act === "detail") {
    openUserDetail(btn.dataset);
    return;
  }
  if (act === "role") {
    const makeAdmin = btn.dataset.role !== "admin";
    if (!confirm(makeAdmin
      ? "Bu kullanıcı yönetici yapılsın mı? E-posta adresinize onay maili gönderilecek."
      : "Bu kullanıcının yönetici yetkisi kaldırılsın mı?")) return;
    try {
      const res = await Store.setUserRole(id, makeAdmin ? "admin" : "user");
      if (res.pending) {
        alert(res.msg || "Onay e-postası gönderildi. Lütfen mailinizi kontrol edip onaylayın.");
      } else {
        renderUsers();
      }
    } catch (err) {
      alert("Hata: " + (err.message || "Rol değiştirilemedi."));
    }
  }
  if (act === "block") {
    const block = btn.dataset.blocked !== "1";
    if (!confirm(block
      ? "Bu hesap engellensin mi? Kullanıcı giriş yapamayacak."
      : "Bu hesabın engeli kaldırılsın mı?")) return;
    await Store.setUserBlocked(id, block);
    renderUsers();
  }
  if (act === "deluser") {
    if (!confirm('"' + (btn.dataset.name || "") + '" hesabı kalıcı olarak silinsin mi?')) return;
    await Store.deleteUser(id);
    renderUsers();
  }
});

document.getElementById("usersRefreshBtn").addEventListener("click", () => renderUsers());

document.getElementById("userForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = document.getElementById("userFormStatus");
  const pass = document.getElementById("nuPass").value;
  if (pass.length < 6) {
    status.textContent = "Şifre en az 6 karakter olmalı.";
    status.className = "form-status err";
    return;
  }
  const res = await Store.adminCreateUser({
    name: document.getElementById("nuName").value.trim(),
    phone: document.getElementById("nuPhone").value.trim(),
    email: document.getElementById("nuEmail").value.trim(),
    pass,
    role: document.getElementById("nuRole").value
  });
  if (!res.ok) {
    status.textContent = res.error || "Kullanıcı oluşturulamadı.";
    status.className = "form-status err";
    return;
  }
  status.textContent = "Kullanıcı oluşturuldu.";
  status.className = "form-status ok";
  e.target.reset();
  renderUsers();
});

// ---------- ÜYE DETAYLARI MODAL ----------
const userDetailModal = document.getElementById("userDetailModal");
const udTabs = userDetailModal.querySelectorAll(".ud-tab");
const udPanels = userDetailModal.querySelectorAll(".ud-panel");

document.getElementById("userDetailClose").addEventListener("click", () => (userDetailModal.hidden = true));
userDetailModal.addEventListener("click", (e) => { if (e.target === userDetailModal) userDetailModal.hidden = true; });

udTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    udTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    udPanels.forEach((p) => (p.hidden = p.id !== tab.dataset.tab));
  });
});

function openUserDetail(data) {
  const email = data.email || "";
  document.getElementById("userDetailTitle").textContent = (data.name || email) + " — Üye Detayları";
  document.getElementById("udEmail").value = email;
  document.getElementById("udName").value = data.name || "";
  document.getElementById("udEmailShow").value = email;
  document.getElementById("udPhone").value = data.phone || "";
  document.getElementById("udCity").value = data.city || "";
  document.getElementById("udRole").value = data.role === "admin" ? "Yönetici" : "Müşteri";
  document.getElementById("udCreated").value = data.created && +data.created > 0 ? dateFmt(+data.created) : "—";
  document.getElementById("udProfileStatus").textContent = "";
  document.getElementById("udProfileStatus").className = "form-status";

  document.getElementById("udUserId").value = data.id || email;
  document.getElementById("udPassPlain").value = data.passPlain || "";
  renderUdPassword();

  udTabs[0].click();
  renderUdAddresses(email);
  renderUdOrders(email);
  renderUdFavorites(email);
  userDetailModal.hidden = false;
}

function renderUdPassword() {
  const cur = document.getElementById("udPassCurrent");
  const note = document.getElementById("udPassNote");
  const newInput = document.getElementById("udPassNew");
  const status = document.getElementById("udPassStatus");
  status.textContent = "";
  status.className = "form-status";
  newInput.value = "";
  newInput.disabled = false;

  if (Store.mode === "supabase") {
    const plain = document.getElementById("udPassPlain").value;
    if (plain) {
      cur.value = plain;
      note.textContent = "";
    } else {
      cur.value = "(henüz kaydedilmemiş)";
      note.textContent = "Yeni şifre belirleyin — sonraki girişte görünür olacak";
    }
  } else {
    const email = document.getElementById("udEmail").value;
    const raw = Store.adminGetPassword(email);
    if (raw) {
      try {
        cur.value = decodeURIComponent(escape(atob(raw))).replace(/^gp\$/, "");
      } catch (_) {
        cur.value = "(çözümlenemedi)";
      }
    } else {
      cur.value = "(bulunamadı)";
    }
    note.textContent = "";
  }
}

document.getElementById("udPassForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const userId = document.getElementById("udUserId").value;
  const newPass = document.getElementById("udPassNew").value;
  const status = document.getElementById("udPassStatus");
  if (!userId) return;
  try {
    const res = await Store.adminSetPassword(userId, newPass);
    if (!res || !res.ok) {
      status.textContent = (res && res.error) || "Şifre değiştirilemedi.";
      status.className = "form-status err";
      return;
    }
    status.textContent = "Şifre başarıyla değiştirildi.";
    status.className = "form-status ok";
    renderUdPassword();
  } catch (err) {
    status.textContent = "Hata: " + (err.message || "Şifre değiştirilemedi.");
    status.className = "form-status err";
  }
});

document.getElementById("udProfileForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("udEmail").value;
  const status = document.getElementById("udProfileStatus");
  if (!email) return;
  Store.adminUpdateUser(email, {
    name: document.getElementById("udName").value,
    phone: document.getElementById("udPhone").value,
    city: document.getElementById("udCity").value
  });
  status.textContent = "Profil bilgileri kaydedildi.";
  status.className = "form-status ok";
  renderUsers();
});

function renderUdAddresses(email) {
  const addrs = Store.getUserAddresses(email);
  const el = document.getElementById("udAddrList");
  if (!addrs.length) {
    el.innerHTML = '<p class="empty-row">Kayıtlı adres bulunmuyor.</p>';
    return;
  }
  el.innerHTML = addrs.map((a, i) => `
    <div class="ud-addr-card">
      <div class="ud-addr-head">
        <strong>${escHtml(a.title || "Adres " + (i + 1))}</strong>
        <button class="row-btn row-btn-danger row-btn-sm" data-i="${i}" data-email="${escHtml(email)}">Sil</button>
      </div>
      <p>${escHtml(a.city || "—")}</p>
      <p>${escHtml(a.full || "—")}</p>
    </div>`).join("");
  el.querySelectorAll(".row-btn-danger").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!confirm("Bu adres silinsin mi?")) return;
      const list = Store.getUserAddresses(btn.dataset.email);
      list.splice(+btn.dataset.i, 1);
      Store.setUserAddresses(btn.dataset.email, list);
      renderUdAddresses(btn.dataset.email);
    });
  });
}

function renderUdOrders(email) {
  const orders = Store.getOrders().filter((o) => o.email === email);
  const el = document.getElementById("udOrderList");
  if (!orders.length) {
    el.innerHTML = '<p class="empty-row">Bu üyeye ait sipariş bulunmuyor.</p>';
    return;
  }
  el.innerHTML = orders.map((o) => `
    <div class="order-card">
      <div class="order-head">
        <strong>${escHtml(o.customer || "—")}</strong>
        <span>${dateFmt(o.date)}</span>
      </div>
      <ul class="order-items">
        ${o.items.map((i) => `<li>${i.qty} &times; ${escHtml(i.name)} <span>${tlFmt(i.price * i.qty)}</span></li>`).join("")}
      </ul>
      <div class="order-total">Toplam: <strong>${tlFmt(o.total)}</strong></div>
    </div>`).join("");
}

function renderUdFavorites(email) {
  const favIds = Store.getUserFavorites();
  const products = Store.getProducts();
  const favProducts = favIds.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  const el = document.getElementById("udFavList");
  if (!favProducts.length) {
    el.innerHTML = '<p class="empty-row">Bu üyenin favori ürünü bulunmuyor.</p>';
    return;
  }
  el.innerHTML = '<div class="ud-fav-grid">' + favProducts.map((p) => `
    <div class="ud-fav-item">
      <div class="ud-fav-thumb">${p.photo ? '<img src="' + escHtml(p.photo) + '" alt="">' : (PRODUCT_ART[p.img] || PRODUCT_ART.panel)}</div>
      <div class="ud-fav-info">
        <strong>${escHtml(p.name)}</strong>
        <span>${tlFmt(p.price)}</span>
      </div>
    </div>`).join("") + '</div>';
}

// ---------- SİTE İÇERİĞİ (şema tabanlı editör) ----------
// [anahtar, etiket, tip?] — tip "area" ise çok satırlı metin kutusu
const CONTENT_SCHEMA = [
  { group: "İletişim & Genel", fields: [
    ["phone", "Telefon"], ["email", "E-posta"], ["address", "Adres"],
    ["hours", "Çalışma saatleri"], ["topNote", "Üst bar notu"],
    ["brandTagline", "Logo alt yazısı (ünvan)"], ["headerContactNote", "Başlıkta telefon altı not"],
    ["authorizedLabel", "Yetkili satıcı rozeti yazısı"]
  ]},
  { group: "Avantaj Şeridi", fields: [
    ["strip1", "1. madde"], ["strip2", "2. madde"], ["strip3", "3. madde"], ["strip4", "4. madde"]
  ]},
  { group: "En Çok Satanlar Bölümü", fields: [
    ["bestTitle", "Başlık"], ["bestText", "Açıklama", "area"]
  ]},
  { group: "Tasarruf Hesaplayıcı", fields: [
    ["calcTitle", "Başlık"], ["calcText", "Açıklama", "area"],
    ["calcNote1", "Madde 1"], ["calcNote2", "Madde 2"], ["calcNote3", "Madde 3"]
  ]},
  { group: "Süreç (4 Adım)", fields: [
    ["procTitle", "Bölüm başlığı"],
    ["step1Title", "1. adım başlık"], ["step1Text", "1. adım metin", "area"],
    ["step2Title", "2. adım başlık"], ["step2Text", "2. adım metin", "area"],
    ["step3Title", "3. adım başlık"], ["step3Text", "3. adım metin", "area"],
    ["step4Title", "4. adım başlık"], ["step4Text", "4. adım metin", "area"]
  ]},
  { group: "Proje Galerisi", fields: [
    ["galTitle", "Başlık"], ["galText", "Açıklama", "area"],
    ["gal1", "1. görsel yazısı"], ["gal2", "2. görsel yazısı"], ["gal3", "3. görsel yazısı"],
    ["gal4", "4. görsel yazısı"], ["gal5", "5. görsel yazısı"]
  ]},
  { group: "Referanslar (Yorumlar)", fields: [
    ["refTitle", "Bölüm başlığı"]
  ]},
  { group: "Sık Sorulan Sorular", fields: [
    ["faqTitle", "Bölüm başlığı"]
  ]},
  { group: "Alt Çağrı (CTA)", fields: [
    ["ctaTitle", "Başlık"], ["ctaText", "Açıklama", "area"]
  ]},
  { group: "İletişim Bölümü", fields: [
    ["contactTitle", "Başlık"], ["contactText", "Açıklama", "area"]
  ]},
  { group: "Neden Biz", fields: [
    ["whyTitle", "Bölüm başlığı"], ["whyText", "Açıklama", "area"]
  ]},
  { group: "Footer (Sayfa Altı)", fields: [
    ["footerAbout", "Açıklama metni", "area"], ["footerCopyright", "En alt satır (telif)"]
  ]}
];
const CONTENT_KEYS = [];

function loadContentForm() {
  const site = Store.getSiteContent();
  CONTENT_KEYS.length = 0;
  document.getElementById("contentFields").innerHTML = CONTENT_SCHEMA.map((sec) => {
    const rows = sec.fields.map(([key, label, type]) => {
      CONTENT_KEYS.push(key);
      const val = escHtml(site[key] != null ? site[key] : "");
      const input = type === "area"
        ? `<textarea id="ct_${key}" rows="2">${val}</textarea>`
        : `<input type="text" id="ct_${key}" value="${val}">`;
      return `<div class="form-group"><label for="ct_${key}">${escHtml(label)}</label>${input}</div>`;
    }).join("");
    return `<h2 class="content-group-title">${escHtml(sec.group)}</h2>${rows}`;
  }).join("");
}

document.getElementById("contentForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {};
  CONTENT_KEYS.forEach((key) => {
    const el = document.getElementById("ct_" + key);
    if (el) data[key] = el.value.trim();
  });
  const status = document.getElementById("contentStatus");
  try {
    await Store.saveSiteContent(data);
    applySiteContent(document);
    status.textContent = "Tüm site içeriği kaydedildi. Sitede otomatik güncellenecektir.";
    status.className = "form-status ok";
  } catch (err) {
    status.textContent = "Kaydetme başarısız: " + (err.message || "Sunucu hatası. Oturumunuz geçerli mi kontrol edin.");
    status.className = "form-status err";
  }
  window.scrollTo(0, 0);
});

loadContentForm();

// ---------- AYARLAR ----------
function loadSettingsForm() {
  const s = Store.getSettings();
  document.getElementById("waNumber").value = s.whatsapp || "";
  document.getElementById("bankName").value = s.bankName || "";
  document.getElementById("bankHolder").value = s.bankHolder || "";
  document.getElementById("iban").value = s.iban || "";
  document.getElementById("bankNote").value = s.bankNote || "";
}
loadSettingsForm();

document.getElementById("settingsForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = document.getElementById("settingsStatus");
  const num = document.getElementById("waNumber").value.replace(/\D/g, "");
  if (num && num.length < 11) {
    status.textContent = "WhatsApp numarası geçersiz (örn. 905321234567) — boş bırakabilirsiniz.";
    status.className = "form-status err";
    return;
  }
  try {
    await Store.saveSettings({
      whatsapp: num,
      bankName: document.getElementById("bankName").value.trim(),
      bankHolder: document.getElementById("bankHolder").value.trim(),
      iban: document.getElementById("iban").value.trim(),
      bankNote: document.getElementById("bankNote").value.trim()
    });
    document.getElementById("waNumber").value = num;
    status.textContent = "Kaydedildi.";
    status.className = "form-status ok";
  } catch (err) {
    status.textContent = "Kaydetme başarısız: " + (err.message || "Sunucu hatası.");
    status.className = "form-status err";
  }
});

// ---------- MAİL AYARLARI ----------
async function loadMailSettings() {
  try {
    const tk = Store.session() && Store.session().token;
    const r = await fetch("/api/mail-settings", { headers: { Authorization: "Bearer " + tk } });
    if (!r.ok) return;
    const d = await r.json();
    document.getElementById("smtpHost").value = d.host || "";
    document.getElementById("smtpPort").value = d.port || 587;
    document.getElementById("smtpUser").value = d.user || "";
    document.getElementById("smtpPass").value = d.pass || "";
    document.getElementById("smtpFrom").value = d.from || "";
  } catch (_) {}
}
loadMailSettings();

document.getElementById("mailSettingsForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = document.getElementById("mailSettingsStatus");
  const tk = Store.session() && Store.session().token;
  try {
    const r = await fetch("/api/mail-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + tk },
      body: JSON.stringify({
        host: document.getElementById("smtpHost").value.trim(),
        port: parseInt(document.getElementById("smtpPort").value, 10) || 587,
        user: document.getElementById("smtpUser").value.trim(),
        pass: document.getElementById("smtpPass").value,
        from: document.getElementById("smtpFrom").value.trim()
      })
    });
    const d = await r.json();
    status.textContent = d.msg || "Kaydedildi.";
    status.className = "form-status " + (r.ok ? "ok" : "err");
  } catch (_) {
    status.textContent = "Bağlantı hatası.";
    status.className = "form-status err";
  }
});

document.getElementById("smtpTestBtn").addEventListener("click", async () => {
  const status = document.getElementById("mailSettingsStatus");
  const tk = Store.session() && Store.session().token;
  status.textContent = "Test maili gönderiliyor…";
  status.className = "form-status ok";
  try {
    const r = await fetch("/api/mail-test", {
      method: "POST",
      headers: { Authorization: "Bearer " + tk }
    });
    const d = await r.json();
    status.textContent = d.msg;
    status.className = "form-status " + (r.ok ? "ok" : "err");
  } catch (_) {
    status.textContent = "Bağlantı hatası.";
    status.className = "form-status err";
  }
});

// ---------- DİNAMİK LİSTE YÖNETİCİLERİ (SSS, Yorumlar, Neden Biz) ----------

function migrateLegacyLists() {
  const site = Store.getSiteContent();
  let changed = false;
  if (!site.faqs || !Array.isArray(site.faqs)) {
    const faqs = [];
    for (let i = 1; i <= 20; i++) {
      if (site["faqQ" + i]) faqs.push({ q: site["faqQ" + i], a: site["faqA" + i] || "" });
    }
    if (faqs.length) { Store.saveSiteContent({ faqs: faqs }); changed = true; }
  }
  if (!site.testimonials || !Array.isArray(site.testimonials)) {
    const list = [];
    for (let i = 1; i <= 10; i++) {
      if (site["testi" + i + "Text"]) list.push({ text: site["testi" + i + "Text"], name: site["testi" + i + "Name"] || "", role: site["testi" + i + "Role"] || "" });
    }
    if (list.length) { Store.saveSiteContent({ testimonials: list }); changed = true; }
  }
  if (!site.whyCards || !Array.isArray(site.whyCards)) {
    const cards = [];
    for (let i = 1; i <= 10; i++) {
      if (site["why" + i + "Title"]) cards.push({ title: site["why" + i + "Title"], text: site["why" + i + "Text"] || "" });
    }
    if (cards.length) { Store.saveSiteContent({ whyCards: cards }); changed = true; }
  }
  return changed;
}
migrateLegacyLists();

// --- SSS Yöneticisi ---
function renderFaqManager() {
  const site = Store.getSiteContent();
  const faqs = site.faqs || [];
  const el = document.getElementById("faqManager");
  el.innerHTML = faqs.map((f, i) => `
    <div class="dyn-item" data-i="${i}">
      <div class="dyn-item-head">
        <span class="dyn-item-num">${i + 1}</span>
        <div class="dyn-item-actions">
          <button type="button" class="dyn-move" data-dir="up" data-i="${i}" title="Yukarı" ${i === 0 ? "disabled" : ""}>▲</button>
          <button type="button" class="dyn-move" data-dir="down" data-i="${i}" title="Aşağı" ${i === faqs.length - 1 ? "disabled" : ""}>▼</button>
          <button type="button" class="dyn-del" data-i="${i}" title="Sil">✕</button>
        </div>
      </div>
      <div class="form-group"><label>Soru</label><input type="text" class="faq-q" value="${escHtml(f.q)}"></div>
      <div class="form-group"><label>Cevap</label><textarea class="faq-a" rows="2">${escHtml(f.a)}</textarea></div>
    </div>`).join("") || '<p class="acc-empty">Henüz soru eklenmemiş.</p>';
}

function collectFaqs() {
  return [...document.querySelectorAll("#faqManager .dyn-item")].map((el) => ({
    q: el.querySelector(".faq-q").value.trim(),
    a: el.querySelector(".faq-a").value.trim()
  })).filter((f) => f.q);
}

document.getElementById("faqAddBtn").addEventListener("click", () => {
  const site = Store.getSiteContent();
  const faqs = site.faqs || [];
  faqs.push({ q: "", a: "" });
  Store.saveSiteContent({ faqs });
  renderFaqManager();
  const items = document.querySelectorAll("#faqManager .faq-q");
  if (items.length) items[items.length - 1].focus();
});

document.getElementById("faqSaveBtn").addEventListener("click", async () => {
  const faqs = collectFaqs();
  const s = document.getElementById("faqStatus");
  try {
    await Store.saveSiteContent({ faqs });
    renderFaqManager();
    s.textContent = faqs.length + " soru kaydedildi.";
    s.className = "form-status ok";
  } catch (err) {
    s.textContent = "Kaydetme başarısız: " + (err.message || "Sunucu hatası.");
    s.className = "form-status err";
  }
});

document.getElementById("faqManager").addEventListener("click", (e) => {
  const del = e.target.closest(".dyn-del");
  const move = e.target.closest(".dyn-move");
  if (del) {
    const faqs = collectFaqs();
    faqs.splice(+del.dataset.i, 1);
    Store.saveSiteContent({ faqs });
    renderFaqManager();
  }
  if (move) {
    const faqs = collectFaqs();
    const i = +move.dataset.i;
    const j = move.dataset.dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= faqs.length) return;
    [faqs[i], faqs[j]] = [faqs[j], faqs[i]];
    Store.saveSiteContent({ faqs });
    renderFaqManager();
  }
});

// --- Referanslar (Yorumlar) Yöneticisi ---
function renderTestiManager() {
  const site = Store.getSiteContent();
  const list = site.testimonials || [];
  const el = document.getElementById("testiManager");
  el.innerHTML = list.map((t, i) => `
    <div class="dyn-item" data-i="${i}">
      <div class="dyn-item-head">
        <span class="dyn-item-num">${i + 1}</span>
        <div class="dyn-item-actions">
          <button type="button" class="dyn-move" data-dir="up" data-i="${i}" title="Yukarı" ${i === 0 ? "disabled" : ""}>▲</button>
          <button type="button" class="dyn-move" data-dir="down" data-i="${i}" title="Aşağı" ${i === list.length - 1 ? "disabled" : ""}>▼</button>
          <button type="button" class="dyn-del" data-i="${i}" title="Sil">✕</button>
        </div>
      </div>
      <div class="form-group"><label>Yorum</label><textarea class="testi-text" rows="2">${escHtml(t.text)}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>İsim</label><input type="text" class="testi-name" value="${escHtml(t.name)}"></div>
        <div class="form-group"><label>Bilgi (şehir/sistem)</label><input type="text" class="testi-role" value="${escHtml(t.role)}"></div>
      </div>
    </div>`).join("") || '<p class="acc-empty">Henüz yorum eklenmemiş.</p>';
}

function collectTestimonials() {
  return [...document.querySelectorAll("#testiManager .dyn-item")].map((el) => ({
    text: el.querySelector(".testi-text").value.trim(),
    name: el.querySelector(".testi-name").value.trim(),
    role: el.querySelector(".testi-role").value.trim()
  })).filter((t) => t.text);
}

document.getElementById("testiAddBtn").addEventListener("click", () => {
  const site = Store.getSiteContent();
  const list = site.testimonials || [];
  list.push({ text: "", name: "", role: "" });
  Store.saveSiteContent({ testimonials: list });
  renderTestiManager();
  const items = document.querySelectorAll("#testiManager .testi-text");
  if (items.length) items[items.length - 1].focus();
});

document.getElementById("testiSaveBtn").addEventListener("click", async () => {
  const list = collectTestimonials();
  const s = document.getElementById("testiStatus");
  try {
    await Store.saveSiteContent({ testimonials: list });
    renderTestiManager();
    s.textContent = list.length + " yorum kaydedildi.";
    s.className = "form-status ok";
  } catch (err) {
    s.textContent = "Kaydetme başarısız: " + (err.message || "Sunucu hatası.");
    s.className = "form-status err";
  }
});

document.getElementById("testiManager").addEventListener("click", (e) => {
  const del = e.target.closest(".dyn-del");
  const move = e.target.closest(".dyn-move");
  if (del) {
    const list = collectTestimonials();
    list.splice(+del.dataset.i, 1);
    Store.saveSiteContent({ testimonials: list });
    renderTestiManager();
  }
  if (move) {
    const list = collectTestimonials();
    const i = +move.dataset.i;
    const j = move.dataset.dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    Store.saveSiteContent({ testimonials: list });
    renderTestiManager();
  }
});

// --- Neden Biz Kartları Yöneticisi ---
function renderWhyManager() {
  const site = Store.getSiteContent();
  const cards = site.whyCards || [];
  const el = document.getElementById("whyManager");
  el.innerHTML = cards.map((c, i) => `
    <div class="dyn-item" data-i="${i}">
      <div class="dyn-item-head">
        <span class="dyn-item-num">${i + 1}</span>
        <div class="dyn-item-actions">
          <button type="button" class="dyn-move" data-dir="up" data-i="${i}" title="Yukarı" ${i === 0 ? "disabled" : ""}>▲</button>
          <button type="button" class="dyn-move" data-dir="down" data-i="${i}" title="Aşağı" ${i === cards.length - 1 ? "disabled" : ""}>▼</button>
          <button type="button" class="dyn-del" data-i="${i}" title="Sil">✕</button>
        </div>
      </div>
      <div class="form-group"><label>Başlık</label><input type="text" class="why-title" value="${escHtml(c.title)}"></div>
      <div class="form-group"><label>Açıklama</label><textarea class="why-text" rows="2">${escHtml(c.text)}</textarea></div>
    </div>`).join("") || '<p class="acc-empty">Henüz kart eklenmemiş.</p>';
}

function collectWhyCards() {
  return [...document.querySelectorAll("#whyManager .dyn-item")].map((el) => ({
    title: el.querySelector(".why-title").value.trim(),
    text: el.querySelector(".why-text").value.trim()
  })).filter((c) => c.title);
}

document.getElementById("whyAddBtn").addEventListener("click", () => {
  const site = Store.getSiteContent();
  const cards = site.whyCards || [];
  cards.push({ title: "", text: "" });
  Store.saveSiteContent({ whyCards: cards });
  renderWhyManager();
  const items = document.querySelectorAll("#whyManager .why-title");
  if (items.length) items[items.length - 1].focus();
});

document.getElementById("whySaveBtn").addEventListener("click", async () => {
  const cards = collectWhyCards();
  const s = document.getElementById("whyStatus");
  try {
    await Store.saveSiteContent({ whyCards: cards });
    renderWhyManager();
    s.textContent = cards.length + " kart kaydedildi.";
    s.className = "form-status ok";
  } catch (err) {
    s.textContent = "Kaydetme başarısız: " + (err.message || "Sunucu hatası.");
    s.className = "form-status err";
  }
});

document.getElementById("whyManager").addEventListener("click", (e) => {
  const del = e.target.closest(".dyn-del");
  const move = e.target.closest(".dyn-move");
  if (del) {
    const cards = collectWhyCards();
    cards.splice(+del.dataset.i, 1);
    Store.saveSiteContent({ whyCards: cards });
    renderWhyManager();
  }
  if (move) {
    const cards = collectWhyCards();
    const i = +move.dataset.i;
    const j = move.dataset.dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= cards.length) return;
    [cards[i], cards[j]] = [cards[j], cards[i]];
    Store.saveSiteContent({ whyCards: cards });
    renderWhyManager();
  }
});

renderFaqManager();
renderTestiManager();
renderWhyManager();

// ---------- TÜMÜNÜ ÇİZ ----------
function renderAll() {
  populateCatSelects();
  refreshCatFormParent();
  renderDashboard();
  renderProducts();
  renderCategories();
  renderSlides();
  renderOrders();
  renderUsers();
  renderLeads();
  renderUploadPreview();
}

renderAll();

}); // Store.ready
