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
function populateCatSelects() {
  // "Ana kategori (üst)" yalnızca normal kategoriler — markalar burada olmaz,
  // onlar aşağıdaki "Ek kategoriler / markalar (alt)" kutularında yer alır.
  const options = Store.getCategories()
    .filter((c) => c.kind !== "brand")
    .map((c) => `<option value="${c.id}">${escHtml(c.name)}</option>`)
    .join("");
  ["pfCat", "upCat"].forEach((id) => {
    const sel = document.getElementById(id);
    const current = sel.value;
    sel.innerHTML = options;
    if (current && [...sel.options].some((o) => o.value === current)) sel.value = current;
  });
  // Marka (alt kategori) kutuları: üst kategoriye göre doldur (işaretlileri koru)
  renderBrandChecks("pfCats", document.getElementById("pfCat").value);
  renderBrandChecks("upCats", document.getElementById("upCat").value);
}

// Verilen üst kategoriye tanımlı markaları (parent === üst, ya da üstsüz) kutu grubu olarak çizer.
// İşaretli olanlar korunur.
function renderBrandChecks(containerId, topCatId) {
  const box = document.getElementById(containerId);
  if (!box) return;
  const checked = getCheckedCats(containerId);
  const topName = (Store.getCategories().find((c) => c.id === topCatId) || {}).name || "bu kategori";
  const brands = Store.getCategories().filter(
    (c) => c.kind === "brand" && (!c.parent || c.parent === topCatId)
  );
  let html = brands.map((c) =>
    `<label class="cat-check"><input type="checkbox" name="${containerId}" value="${escHtml(c.id)}"> <span>${escHtml(c.name)} <em class="cat-check-brand">marka</em></span></label>`
  ).join("");
  if (!brands.length) {
    html = `<span class="cat-check-empty">“${escHtml(topName)}” için henüz marka yok. Aşağıdan hemen ekleyebilirsiniz:</span>`;
  }
  // Buradan doğrudan yeni marka ekleme — Kategoriler ekranına gitmeye gerek yok
  html += `<div class="cat-brand-add">
      <input type="text" class="cat-brand-add-input" placeholder="Yeni marka (ör. Lexron)" data-box="${containerId}" data-top="${escHtml(topCatId)}">
      <button type="button" class="btn btn-small cat-brand-add-btn" data-box="${containerId}" data-top="${escHtml(topCatId)}">+ Marka Ekle</button>
    </div>`;
  box.innerHTML = html;
  setCheckedCats(containerId, checked);
}

// Ürün formundan doğrudan yeni marka ekle (seçili üst kategorinin altına)
function addBrandInline(boxId, topCatId) {
  const box = document.getElementById(boxId);
  if (!box) return;
  const input = box.querySelector(".cat-brand-add-input");
  const name = (input && input.value.trim()) || "";
  if (!name) { if (input) input.focus(); return; }
  const existing = Store.getCategories().find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    // Aynı isim zaten varsa: markaysa onu bu üst kategoriye bağlayıp işaretle, değilse uyar
    if (existing.kind === "brand") {
      Store.saveCategory({ id: existing.id, parent: topCatId });
    } else {
      alert("“" + name + "” zaten bir üst kategori. Marka için farklı bir ad girin.");
      return;
    }
  } else {
    Store.saveCategory({ name, kind: "brand", parent: topCatId });
  }
  const nb = Store.getCategories().find((c) => c.name.toLowerCase() === name.toLowerCase() && c.kind === "brand");
  const keep = getCheckedCats(boxId).concat(nb ? [nb.id] : []);
  renderBrandChecks(boxId, topCatId);
  setCheckedCats(boxId, keep);
}

// Üst kategori değişince marka (alt kategori) listesi o kategoriye göre yenilensin
["pfCat", "upCat"].forEach((id) => {
  const sel = document.getElementById(id);
  if (sel) sel.addEventListener("change", () => renderBrandChecks(id + "s", sel.value));
});

// "+ Marka Ekle" butonu ve Enter tuşu (form gönderimini engelleyerek)
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".cat-brand-add-btn");
  if (btn) { e.preventDefault(); addBrandInline(btn.dataset.box, btn.dataset.top); }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.classList && e.target.classList.contains("cat-brand-add-input")) {
    e.preventDefault();
    addBrandInline(e.target.dataset.box, e.target.dataset.top);
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
  // Üst kategoriye göre marka listesini kur, sonra ürünün markalarını işaretle
  renderBrandChecks("pfCats", document.getElementById("pfCat").value);
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
  const normals = cats.filter((c) => c.kind !== "brand");
  const brands = cats.filter((c) => c.kind === "brand");
  const countOf = (id) => products.filter((p) => Store.productCatIds(p).indexOf(id) !== -1).length;
  const thumbOf = (c) => c.image
    ? `<img class="table-thumb" src="${escHtml(c.image)}" alt="">`
    : '<span class="table-thumb table-thumb-empty">—</span>';

  // Üst kategori satırı
  const topRow = (c) => `
      <tr class="cat-row-top">
        <td>${thumbOf(c)}</td>
        <td class="cell-strong">${escHtml(c.name)}</td>
        <td><span class="pill pill-ok">Üst kategori</span></td>
        <td>${countOf(c.id)}</td>
        <td class="cell-actions">
          <button class="row-btn" data-act="setimg" data-id="${c.id}">${c.image ? "Görseli Değiştir" : "Görsel Ekle"}</button>
          ${c.image ? `<button class="row-btn" data-act="rmimg" data-id="${c.id}">Görseli Kaldır</button>` : ""}
          <button class="row-btn" data-act="rename" data-id="${c.id}">Yeniden Adlandır</button>
          <button class="row-btn row-btn-accent" data-act="tobrand" data-id="${c.id}">Markaya Çevir</button>
          <button class="row-btn row-btn-danger" data-act="delcat" data-id="${c.id}">Sil</button>
        </td>
      </tr>`;

  // Marka (alt) satırı — girintili; hangi üst kategoriye bağlı olduğu seçilebilir
  const brandRow = (c) => {
    const opts = normals.map((x) => `<option value="${x.id}"${c.parent === x.id ? " selected" : ""}>${escHtml(x.name)}</option>`).join("");
    return `
      <tr class="cat-row-brand">
        <td>${thumbOf(c)}</td>
        <td class="cell-strong"><span class="cat-branch">└</span> ${escHtml(c.name)} <span class="pill pill-warn">Marka</span></td>
        <td><select class="cat-parent-sel" data-id="${c.id}" title="Üst kategori"><option value="">— üst kategori seç —</option>${opts}</select></td>
        <td>${countOf(c.id)}</td>
        <td class="cell-actions">
          <button class="row-btn" data-act="setimg" data-id="${c.id}">${c.image ? "Görseli Değiştir" : "Görsel Ekle"}</button>
          ${c.image ? `<button class="row-btn" data-act="rmimg" data-id="${c.id}">Görseli Kaldır</button>` : ""}
          <button class="row-btn" data-act="rename" data-id="${c.id}">Yeniden Adlandır</button>
          <button class="row-btn" data-act="totop" data-id="${c.id}">Üst Kategori Yap</button>
          <button class="row-btn row-btn-danger" data-act="delcat" data-id="${c.id}">Sil</button>
        </td>
      </tr>`;
  };

  let html = "";
  normals.forEach((c) => {
    html += topRow(c);
    brands.filter((b) => b.parent === c.id).forEach((b) => { html += brandRow(b); });
  });
  // Üst kategorisi seçilmemiş (bağsız) markalar en altta, uyarı ile
  const orphans = brands.filter((b) => !b.parent || !normals.some((n) => n.id === b.parent));
  if (orphans.length) {
    html += '<tr class="cat-row-warn"><td colspan="5">⚠ Aşağıdaki markalar bir üst kategoriye bağlı değil — sağdaki listeden üst kategori seçin:</td></tr>';
    orphans.forEach((b) => { html += brandRow(b); });
  }
  document.getElementById("catRows").innerHTML = html ||
    '<tr><td colspan="5" class="empty-row">Henüz kategori yok. Önce bir üst kategori ekleyin.</td></tr>';

  // Marka → üst kategori seçimi
  document.querySelectorAll("#catRows .cat-parent-sel").forEach((sel) => {
    sel.addEventListener("change", () => {
      Store.saveCategory({ id: sel.dataset.id, parent: sel.value });
      renderAll();
    });
  });
}

// Kategori formundaki "Üst kategori" listesini doldurur ve Tür=Marka ise gösterir
function refreshCatFormParent() {
  const kindSel = document.getElementById("catKind");
  const wrap = document.getElementById("catParentWrap");
  const parentSel = document.getElementById("catParent");
  if (!kindSel || !wrap || !parentSel) return;
  const isBrand = kindSel.value === "brand";
  const normals = Store.getCategories().filter((c) => c.kind !== "brand");
  parentSel.innerHTML = '<option value="">— üst kategori seç —</option>' +
    normals.map((c) => `<option value="${c.id}">${escHtml(c.name)}</option>`).join("");
  wrap.hidden = !isBrand;
  // Ad alanı etiketi ve örneği türe göre değişsin
  const lbl = document.getElementById("catNameLabel");
  const inp = document.getElementById("catNameInput");
  if (lbl) lbl.textContent = isBrand ? "Marka adı" : "Üst kategori adı";
  if (inp) inp.placeholder = isBrand ? "Örn. Lexron" : "Örn. Şarj Kontrol Cihazları";
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
  const parent = kind === "brand" ? document.getElementById("catParent").value : "";
  if (kind === "brand" && !parent) {
    status.textContent = "Marka için bir üst kategori seçmelisiniz (ör. İnvertörler).";
    status.className = "form-status err";
    return;
  }
  Store.saveCategory({ name, kind, parent });
  status.textContent = '"' + name + '" ' + (kind === "brand" ? "markası eklendi (üst kategori: " + (Store.getCategories().find((c) => c.id === parent) || {}).name + ")" : "üst kategorisi eklendi") + ".";
  status.className = "form-status ok";
  input.value = "";
  document.getElementById("catKind").value = "";
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

document.getElementById("catRows").addEventListener("click", (e) => {
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

  if (act === "tobrand") {
    // Üst kategoriyi markaya çevir. Üst kategorisi henüz yok → aşağıda "bağsız
    // marka" uyarısıyla listelenir; oradan üst kategori seçilir.
    Store.saveCategory({ id, kind: "brand", parent: "" });
    renderAll();
    setTimeout(() => alert('"' + cat.name + '" artık bir MARKA. Aşağıda hangi üst kategorinin altında olacağını seçin.'), 30);
    return;
  }
  if (act === "totop") {
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
    if (confirm('"' + cat.name + '" kategorisi silinsin mi?')) {
      Store.deleteCategory(id);
      renderAll();
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
  if (file) readImageFile(file, (d) => { setSlidePhoto(d); slPhotoUrl.value = ""; });
});
slPhotoFile.addEventListener("change", () => {
  const file = slPhotoFile.files[0];
  if (file) readImageFile(file, (d) => { setSlidePhoto(d); slPhotoUrl.value = ""; });
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

document.getElementById("slideList").addEventListener("click", (e) => {
  const btn = e.target.closest(".row-btn");
  if (!btn) return;
  const { id, act } = btn.dataset;
  const slide = Store.getSlides().find((s) => s.id === id);
  if (act === "up") { Store.moveSlide(id, -1); renderSlides(); }
  if (act === "down") { Store.moveSlide(id, 1); renderSlides(); }
  if (act === "edit" && slide) editSlide(slide);
  if (act === "del" && slide && confirm("Bu slayt silinsin mi?")) {
    Store.deleteSlide(id);
    if (document.getElementById("slId").value === id) resetSlideForm();
    renderSlides();
  }
});

slideForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const status = document.getElementById("slStatus");
  const title = document.getElementById("slTitle").value.trim();
  if (!title) {
    status.textContent = "Lütfen bir başlık girin.";
    status.className = "form-status err";
    return;
  }
  try {
    Store.saveSlide({
      id: document.getElementById("slId").value || "",
      image: slidePhoto,
      art: document.getElementById("slArt").value,
      title,
      subtitle: document.getElementById("slSub").value.trim(),
      btnText: document.getElementById("slBtnText").value.trim(),
      btnLink: document.getElementById("slBtnLink").value.trim() || "urunler.html"
    });
  } catch (err) {
    status.textContent = "Kayıt başarısız: tarayıcı depolama alanı doldu. Daha küçük görsel kullanın.";
    status.className = "form-status err";
    return;
  }
  status.textContent = "Slayt kaydedildi.";
  status.className = "form-status ok";
  resetSlideForm();
  renderSlides();
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
        <div class="order-meta">
          <span class="pill ${o.payment === "eft" || o.payment === "card" ? "pill-warn" : "pill-ok"}">${o.payment === "eft" ? "Havale/EFT — ödeme bekleniyor" : o.payment === "card" ? "Kredi Kartı" : "WhatsApp siparişi"}${o.id ? " · No: " + escHtml(o.id) : ""}</span>
          ${o.phone ? " · Tel: " + escHtml(o.phone) : ""}
          ${o.city ? " · " + escHtml(o.city) : ""}
        </div>
        ${o.address ? `<div class="order-addr">Adres: ${escHtml(o.address)}</div>` : ""}
        <ul class="order-items">
          ${o.items.map((i) => `<li>${i.qty} × ${escHtml(i.name)} <span>${tlFmt(i.price * i.qty)}</span></li>`).join("")}
        </ul>
        <div class="order-total">Toplam: <strong>${tlFmt(o.total)}</strong></div>
      </div>`).join("") ||
    '<p class="empty-row">Henüz sipariş talebi yok.</p>';
}

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

async function renderUsers() {
  const tbody = document.getElementById("userRows");
  renderUsersModeNote();
  let users;
  try { users = await Store.listUsers(); }
  catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-row">Kullanıcılar yüklenemedi.</td></tr>';
    return;
  }
  if (users.length === 0 && Store.mode === "supabase") {
    // Sunucu modunda liste boşsa (admin bile yoksa) oturum jetonu geçersizdir
    tbody.innerHTML = '<tr><td colspan="6" class="empty-row">Oturumunuz sunucuda geçerli değil. Lütfen <strong>Çıkış Yap</strong> deyip yeniden giriş yapın.</td></tr>';
    return;
  }
  tbody.innerHTML = users.map((u) => {
    const isSelf = String(u.id) === String(selfUserId);
    return `
      <tr>
        <td class="cell-strong">${escHtml(u.name || "—")}${isSelf ? ' <span class="pill pill-ok">siz</span>' : ""}</td>
        <td>${escHtml(u.email || "—")}</td>
        <td>${escHtml(u.phone || "—")}</td>
        <td>${u.role === "admin" ? '<span class="pill pill-warn">Yönetici</span>' : "Müşteri"}</td>
        <td>${u.blocked ? '<span class="pill pill-warn">Engelli</span>' : '<span class="pill pill-ok">Aktif</span>'}</td>
        <td class="cell-actions">${isSelf ? "—" : `
          <button class="row-btn" data-act="role" data-id="${escHtml(u.id)}" data-role="${escHtml(u.role)}">${u.role === "admin" ? "Yetkiyi Al" : "Yönetici Yap"}</button>
          <button class="row-btn" data-act="block" data-id="${escHtml(u.id)}" data-blocked="${u.blocked ? 1 : 0}">${u.blocked ? "Engeli Kaldır" : "Engelle"}</button>
          <button class="row-btn row-btn-danger" data-act="deluser" data-id="${escHtml(u.id)}" data-name="${escHtml(u.name || u.email)}">Sil</button>`}
        </td>
      </tr>`;
  }).join("") ||
  '<tr><td colspan="6" class="empty-row">Henüz kayıtlı kullanıcı yok.</td></tr>';
}

document.getElementById("userRows").addEventListener("click", async (e) => {
  const btn = e.target.closest(".row-btn");
  if (!btn) return;
  const { id, act } = btn.dataset;
  if (act === "role") {
    const makeAdmin = btn.dataset.role !== "admin";
    if (!confirm(makeAdmin
      ? "Bu kullanıcı yönetici yapılsın mı? Yönetim paneline erişebilecek."
      : "Bu kullanıcının yönetici yetkisi kaldırılsın mı?")) return;
    await Store.setUserRole(id, makeAdmin ? "admin" : "user");
    renderUsers();
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
    ["refTitle", "Bölüm başlığı"],
    ["testi1Text", "1. yorum", "area"], ["testi1Name", "1. isim"], ["testi1Role", "1. bilgi (şehir/sistem)"],
    ["testi2Text", "2. yorum", "area"], ["testi2Name", "2. isim"], ["testi2Role", "2. bilgi"],
    ["testi3Text", "3. yorum", "area"], ["testi3Name", "3. isim"], ["testi3Role", "3. bilgi"]
  ]},
  { group: "Sık Sorulan Sorular", fields: [
    ["faqTitle", "Bölüm başlığı"],
    ["faqQ1", "1. soru"], ["faqA1", "1. cevap", "area"],
    ["faqQ2", "2. soru"], ["faqA2", "2. cevap", "area"],
    ["faqQ3", "3. soru"], ["faqA3", "3. cevap", "area"],
    ["faqQ4", "4. soru"], ["faqA4", "4. cevap", "area"],
    ["faqQ5", "5. soru"], ["faqA5", "5. cevap", "area"],
    ["faqQ6", "6. soru"], ["faqA6", "6. cevap", "area"],
    ["faqQ7", "7. soru"], ["faqA7", "7. cevap", "area"]
  ]},
  { group: "Alt Çağrı (CTA)", fields: [
    ["ctaTitle", "Başlık"], ["ctaText", "Açıklama", "area"]
  ]},
  { group: "İletişim Bölümü", fields: [
    ["contactTitle", "Başlık"], ["contactText", "Açıklama", "area"]
  ]},
  { group: "Neden Biz (6 Kart)", fields: [
    ["whyTitle", "Bölüm başlığı"], ["whyText", "Açıklama", "area"],
    ["why1Title", "1. kart başlık"], ["why1Text", "1. kart metin", "area"],
    ["why2Title", "2. kart başlık"], ["why2Text", "2. kart metin", "area"],
    ["why3Title", "3. kart başlık"], ["why3Text", "3. kart metin", "area"],
    ["why4Title", "4. kart başlık"], ["why4Text", "4. kart metin", "area"],
    ["why5Title", "5. kart başlık"], ["why5Text", "5. kart metin", "area"],
    ["why6Title", "6. kart başlık"], ["why6Text", "6. kart metin", "area"]
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

document.getElementById("contentForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = {};
  CONTENT_KEYS.forEach((key) => {
    const el = document.getElementById("ct_" + key);
    if (el) data[key] = el.value.trim();
  });
  Store.saveSiteContent(data);
  applySiteContent(document); // admin sayfasındaki data-site öğeleri varsa güncelle
  const status = document.getElementById("contentStatus");
  status.textContent = "Tüm site içeriği kaydedildi. Sitede otomatik güncellenecektir.";
  status.className = "form-status ok";
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

document.getElementById("settingsForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const status = document.getElementById("settingsStatus");
  const num = document.getElementById("waNumber").value.replace(/\D/g, "");
  if (num && num.length < 11) {
    status.textContent = "WhatsApp numarası geçersiz (örn. 905321234567) — boş bırakabilirsiniz.";
    status.className = "form-status err";
    return;
  }
  Store.saveSettings({
    whatsapp: num,
    bankName: document.getElementById("bankName").value.trim(),
    bankHolder: document.getElementById("bankHolder").value.trim(),
    iban: document.getElementById("iban").value.trim(),
    bankNote: document.getElementById("bankNote").value.trim()
  });
  document.getElementById("waNumber").value = num;
  status.textContent = "Kaydedildi.";
  status.className = "form-status ok";
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
