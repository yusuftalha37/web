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

  // Ürün kimliği — SEO dostu ad (?urun=slug) ya da eski kod (?id=XXX / #urun/XXX)
  const params = new URLSearchParams(location.search);
  let id = params.get("id");
  let urunSlug = params.get("urun");
  if (!id && !urunSlug && location.hash.indexOf("#urun/") === 0) {
    urunSlug = decodeURIComponent(location.hash.slice(6)); // hash değeri slug ya da eski id olabilir
  }
  const products = Store.getProducts();
  let p = null;
  if (id) p = products.find((x) => x.id === id);
  if (!p && urunSlug) {
    // 1) doğrudan ad-slug eşleşmesi
    p = products.find((x) => slugify(x.name) === urunSlug);
    // 2) aynı slug'a düşen ürünler için sıra eki (-2, -3 …)
    if (!p) {
      const mm = urunSlug.match(/^(.*)-(\d+)$/);
      if (mm) {
        const base = mm[1], n = parseInt(mm[2], 10);
        const matches = products.filter((x) => slugify(x.name) === base);
        if (matches.length >= n) p = matches[n - 1];
      }
    }
    // 3) son çare: eski id ile gelen bağlantılar
    if (!p) p = products.find((x) => x.id === urunSlug);
  }
  // Ürünün SEO dostu adresi (canonical/og için) — sitemap ile aynı kural
  const prodSlug = p ? slugify(p.name) || slugify(p.id) : "";
  const prodPath = "/urun.html?urun=" + encodeURIComponent(prodSlug);
  try { document.title = (p ? p.name + " Fiyatı ve Özellikleri" : "Ürün bulunamadı") + " | Solar Arena"; } catch (_) {}

  // ---- Dinamik SEO: meta açıklama + canonical + ürün yapılandırılmış verisi ----
  if (p && typeof goPage !== "function") {
    try {
      let md = document.querySelector('meta[name="description"]');
      if (!md) { md = document.createElement("meta"); md.name = "description"; document.head.appendChild(md); }
      md.content = p.name + " uygun fiyat ve stoktan aynı gün kargo ile. " + (p.specs || []).slice(0, 2).join(" · ") + " — Türkiye'nin her yerine gönderim.";
      let cn = document.querySelector('link[rel="canonical"]');
      if (!cn) { cn = document.createElement("link"); cn.rel = "canonical"; document.head.appendChild(cn); }
      cn.href = "https://solararena.store" + prodPath;
      // Open Graph / sosyal paylaşım
      const prodUrl = "https://solararena.store" + prodPath;
      const ogImg = (p.photo && /^https?:\/\//.test(p.photo)) ? p.photo
        : (p.photo && p.photo.indexOf("/uploads/") === 0) ? "https://solararena.store" + p.photo
        : "https://solararena.store/og-image.jpg";
      const setMeta = (attr, key, val) => {
        let el = document.querySelector('meta[' + attr + '="' + key + '"]');
        if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
        el.setAttribute("content", val);
      };
      setMeta("property", "og:type", "product");
      setMeta("property", "og:title", p.name + " | Solar Arena");
      setMeta("property", "og:description", md.content);
      setMeta("property", "og:url", prodUrl);
      setMeta("property", "og:image", ogImg);
      setMeta("property", "og:locale", "tr_TR");
      setMeta("name", "twitter:card", "summary_large_image");
      setMeta("name", "twitter:title", p.name + " | Solar Arena");
      setMeta("name", "twitter:image", ogImg);
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
          "url": prodUrl,
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

  // Paket ise: içindeki ürünlerin görsellerinden çok sayfalı galeri
  // (1. sayfa otomatik kolaj, sonraki sayfalar tek tek ürün fotoğrafları)
  function bundleVisual(bp) {
    return bp && bp.photo
      ? `<img src="${escHtml(bp.photo)}" alt="${escHtml(bp.name)}" loading="lazy">`
      : (PRODUCT_ART[(bp && bp.img) || "panel"] || PRODUCT_ART.panel);
  }
  function buildBundleGallery(pk) {
    const prods = Store.getProducts();
    const items = pk.bundle.map((it) => ({ p: prods.find((x) => x.id === it.id), qty: it.qty })).filter((x) => x.p);
    if (!items.length) return null;
    const slides = [];
    // 1) Kolaj sayfası — her hücrede ürün görseli + adet rozeti
    const n = Math.min(items.length, 4);
    const cells = items.slice(0, 4).map((it) =>
      `<div class="pd-collage-cell"><span class="pd-collage-qty">${it.qty}×</span>${bundleVisual(it.p)}</div>`
    ).join("");
    const extra = items.length > 4 ? `<span class="pd-collage-more">+${items.length - 4} ürün daha</span>` : "";
    slides.push(`<div class="pd-slide pd-collage pd-collage-${n}">${cells}${extra}</div>`);
    // 2..) Her ürünün kendi görseli
    items.forEach((it) => slides.push(`<div class="pd-slide">${bundleVisual(it.p)}<span class="pd-slide-cap">${it.qty}× ${escHtml(it.p.name)}</span></div>`));
    const dots = slides.map((_, i) => `<button class="pd-dot${i === 0 ? " active" : ""}" data-i="${i}" aria-label="Görsel ${i + 1}"></button>`).join("");
    return `<div class="pd-gallery" data-slides="${slides.length}">
      <div class="pd-gallery-track">${slides.join("")}</div>
      <button type="button" class="pd-gal-arrow pd-gal-prev" aria-label="Önceki">‹</button>
      <button type="button" class="pd-gal-arrow pd-gal-next" aria-label="Sonraki">›</button>
      <div class="pd-gallery-dots">${dots}</div>
    </div>`;
  }
  const bundleGallery = (p.bundle && p.bundle.length) ? buildBundleGallery(p) : null;
  const media = bundleGallery
    ? bundleGallery
    : (p.photo ? `<img src="${escHtml(p.photo)}" alt="${escHtml(p.name)}">` : (PRODUCT_ART[p.img] || PRODUCT_ART.panel));
  const low = p.stock <= 5;
  const inStock = p.stock > 0;
  const authLabel = Store.getSiteContent().authorizedLabel || "Yetkili Satıcı";

  // Paket içeriği (ürün bir paketse): içindeki ürünler adet ve bağlantısıyla
  const prodLink = (bp) => (typeof goPage === "function" ? "#urun/" : "urun.html?urun=") + encodeURIComponent(slugify(bp.name) || slugify(bp.id));
  const bundleHtml = (p.bundle && p.bundle.length) ? (() => {
    const prods = Store.getProducts();
    const rows = p.bundle.map((it) => {
      const bp = prods.find((x) => x.id === it.id);
      const name = bp ? bp.name : it.id;
      const inner = bp
        ? `<a href="${escHtml(prodLink(bp))}">${escHtml(name)}</a>`
        : escHtml(name);
      return `<li><span class="pd-bundle-qty">${it.qty}×</span> ${inner}</li>`;
    }).join("");
    return `<div class="pd-bundle"><h2>Paket İçeriği</h2><ul class="pd-bundle-list">${rows}</ul></div>`;
  })() : "";

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
      <div class="pd-media${(p.photo || bundleGallery) ? " has-photo" : ""}${bundleGallery ? " pd-media-gallery" : ""}">
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
        ${bundleHtml}
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

  // Paket görsel galerisi — ok ve nokta ile sayfalar arası geçiş
  const gal = root.querySelector(".pd-gallery");
  if (gal) {
    const track = gal.querySelector(".pd-gallery-track");
    const gdots = Array.from(gal.querySelectorAll(".pd-dot"));
    const total = parseInt(gal.dataset.slides, 10) || 1;
    let gi = 0;
    const goGal = (i) => {
      gi = (i + total) % total;
      track.style.transform = "translateX(-" + gi * 100 + "%)";
      gdots.forEach((d, di) => d.classList.toggle("active", di === gi));
    };
    const nx = gal.querySelector(".pd-gal-next");
    const pv = gal.querySelector(".pd-gal-prev");
    if (nx) nx.addEventListener("click", () => goGal(gi + 1));
    if (pv) pv.addEventListener("click", () => goGal(gi - 1));
    gdots.forEach((d) => d.addEventListener("click", () => goGal(+d.dataset.i)));
    if (total <= 1) gal.classList.add("pd-gallery-single");
  }

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
