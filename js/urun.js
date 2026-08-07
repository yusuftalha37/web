// ============ ÜRÜN DETAY SAYFASI ============
// Çok sayfalı: urun.html?id=XXX   ·   Tek dosya: #urun/XXX
function initProductPage(root) {
  root = root || document;
  const wrap = root.querySelector("#productDetail");
  if (!wrap) return;
  const crumb = root.querySelector("#pBreadcrumb");

  const money = (n) => "₺" + Math.round(n).toLocaleString("tr-TR");
  const catName = (id) => { const c = Store.getCategories().find((x) => x.id === id); return c ? c.name : ""; };
  const link = (href) => (typeof goPage === "function"
    ? ({ "urunler.html": "#magaza", "index.html": "#", "sepet.html": "#sepet" }[href] || href)
    : href);

  // Ürün kimliği
  let id = new URLSearchParams(location.search).get("id");
  if (!id && location.hash.indexOf("#urun/") === 0) id = decodeURIComponent(location.hash.slice(6));

  const p = Store.getProducts().find((x) => x.id === id);
  try { document.title = (p ? p.name + " Fiyatı ve Özellikleri" : "Ürün bulunamadı") + " | Solar Arena"; } catch (_) {}

  // ---- Dinamik SEO: meta açıklama + canonical + ürün yapılandırılmış verisi ----
  if (p && typeof goPage !== "function") {
    try {
      let md = document.querySelector('meta[name="description"]');
      if (!md) { md = document.createElement("meta"); md.name = "description"; document.head.appendChild(md); }
      md.content = p.name + " uygun fiyat ve stoktan aynı gün kargo ile. " + (p.specs || []).slice(0, 2).join(" · ") + " — Türkiye'nin her yerine gönderim.";
      let cn = document.querySelector('link[rel="canonical"]');
      if (!cn) { cn = document.createElement("link"); cn.rel = "canonical"; document.head.appendChild(cn); }
      cn.href = "https://solararena.store/urun.html?id=" + encodeURIComponent(p.id);
      const ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        "name": p.name,
        "description": (p.specs || []).join(" · "),
        "image": p.photo || undefined,
        "brand": { "@type": "Brand", "name": "Solar Arena" },
        "offers": {
          "@type": "Offer",
          "url": "https://solararena.store/urun.html?id=" + encodeURIComponent(p.id),
          "priceCurrency": "TRY",
          "price": p.price,
          "availability": p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "itemCondition": "https://schema.org/NewCondition"
        }
      });
      document.head.appendChild(ld);
    } catch (_) {}
  }

  if (!p) {
    if (crumb) crumb.innerHTML = "";
    wrap.innerHTML = '<div class="pd-notfound"><p>Aradığınız ürün bulunamadı veya kaldırılmış olabilir.</p><a href="' + link("urunler.html") + '" class="btn">Mağazaya Dön</a></div>';
    return;
  }

  const media = p.photo ? `<img src="${escHtml(p.photo)}" alt="${escHtml(p.name)}">` : (PRODUCT_ART[p.img] || PRODUCT_ART.panel);
  const low = p.stock <= 5;
  const inStock = p.stock > 0;
  const authLabel = Store.getSiteContent().authorizedLabel || "Yetkili Satıcı";

  if (crumb) {
    const catChain = [];
    let cur = Store.getCategories().find((c) => c.id === p.cat);
    const guard = {};
    while (cur && !guard[cur.id]) {
      guard[cur.id] = true;
      catChain.unshift(cur);
      const pid = cur.parent || "";
      cur = pid ? Store.getCategories().find((c) => c.id === pid) : null;
    }
    const catLinks = catChain.map((c) =>
      ` <span>›</span> <a href="${link("urunler.html")}?cat=${encodeURIComponent(c.id)}" class="crumb-cat">${escHtml(c.name)}</a>`
    ).join("");
    crumb.innerHTML =
      `<a href="${link("index.html")}">Ana Sayfa</a> <span>›</span> ` +
      `<a href="${link("urunler.html")}">Ürünler</a>` +
      catLinks +
      ` <span>›</span> <span class="crumb-current">${escHtml(p.name)}</span>`;
  }

  wrap.innerHTML = `
    <div class="pd-grid">
      <div class="pd-media${p.photo ? " has-photo" : ""}">
        ${p.authorized ? `<span class="auth-ribbon">${escHtml(authLabel)}</span>` : ""}
        ${media}
      </div>
      <div class="pd-info">
        <span class="pd-cat">${escHtml(catName(p.cat))}</span>
        <h1 class="pd-title">${escHtml(p.name)}</h1>
        ${p.authorized ? `<span class="auth-badge"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>${escHtml(authLabel)}</span>` : ""}
        <div class="pd-price">${money(p.price)} <span>KDV dahil</span></div>
        <div class="pd-stock ${inStock ? (low ? "low" : "ok") : "out"}">${inStock ? (low ? "Son " + p.stock + " adet" : "Stokta var") : "Stokta yok"}</div>
        ${p.specs && p.specs.length ? `<ul class="pd-specs">${p.specs.map((s) => `<li>${escHtml(s)}</li>`).join("")}</ul>` : ""}
        <div class="pd-buy">
          <div class="pd-qty">
            <button type="button" id="pdDec" aria-label="Azalt">−</button>
            <input type="number" id="pdQty" value="1" min="1"${p.stock > 0 ? ` max="${p.stock}"` : ""}>
            <button type="button" id="pdInc" aria-label="Artır">+</button>
          </div>
          <button type="button" class="btn pd-add" id="pdAdd"${inStock ? "" : " disabled"}>${inStock ? "Sepete Ekle" : "Stokta Yok"}</button>
        </div>
        <a href="${link("sepet.html")}" class="pd-gocart" id="pdGoCart" hidden>Sepete git →</a>
        <div class="pd-trust">
          <span>✓ Türkiye'nin her yerine gönderim</span>
          <span>✓ Orijinal &amp; faturalı ürün</span>
          <span>✓ Havale / EFT ile güvenli ödeme</span>
        </div>
      </div>
    </div>`;

  const qtyEl = root.querySelector("#pdQty");
  const clampQty = () => {
    let v = parseInt(qtyEl.value, 10);
    if (isNaN(v) || v < 1) v = 1;
    if (p.stock > 0 && v > p.stock) v = p.stock;
    qtyEl.value = v;
    return v;
  };
  root.querySelector("#pdDec").addEventListener("click", () => { qtyEl.value = Math.max(1, (parseInt(qtyEl.value, 10) || 1) - 1); });
  root.querySelector("#pdInc").addEventListener("click", () => { qtyEl.value = (parseInt(qtyEl.value, 10) || 1) + 1; clampQty(); });
  qtyEl.addEventListener("change", clampQty);

  const addBtn = root.querySelector("#pdAdd");
  if (inStock) {
    addBtn.addEventListener("click", () => {
      const qty = clampQty();
      let cart;
      try { cart = JSON.parse(localStorage.getItem("gp-cart")) || {}; } catch (_) { cart = {}; }
      cart[p.id] = (cart[p.id] || 0) + qty;
      localStorage.setItem("gp-cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("hashchange")); // sepet rozetini tazele
      addBtn.textContent = "Sepete Eklendi ✓";
      root.querySelector("#pdGoCart").hidden = false;
      setTimeout(() => { addBtn.textContent = "Sepete Ekle"; }, 1500);
    });
  }
}

if (typeof goPage === "function") {
  // Tek dosya: hash rotası (#urun/ID). Yalnızca ürün DEĞİŞTİĞİNDE yeniden çiz;
  // aynı üründeyken gelen hashchange'lerde (ör. sepete eklerken rozet tazeleme)
  // sayfayı yeniden kurup "Sepete Eklendi" onayını silmemek için atla.
  let lastId = null;
  const run = () => {
    if (location.hash.indexOf("#urun/") !== 0) { lastId = null; return; }
    const id = decodeURIComponent(location.hash.slice(6));
    if (id === lastId) return;
    lastId = id;
    Store.ready(() => initProductPage(document.getElementById("page-urun")));
  };
  window.addEventListener("hashchange", run);
  run();
} else {
  Store.ready(() => initProductPage(document));
}
