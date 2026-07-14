// ============================================================
// SİTE SAYFALARI ORTAK KODU (ana sayfa + ürünler sayfası)
// initSite(root): sayfadaki menü, mağaza, sepet, hesaplayıcı ve
// iletişim formunu başlatır. Çok dosyalı sürümde root=document,
// tek dosya sürümünde her sayfanın kapsayıcı div'idir.
// ============================================================

function initSite(root) {
  const $ = (sel) => root.querySelector(sel);

  const tlFmt = (n) => "₺" + Math.round(n).toLocaleString("tr-TR");

  // Sayfa bağlantısı: tek dosya sürümünde dosya adlarını hash rotasına çevirir
  function pageLink(href) {
    if (typeof goPage !== "function") return href; // çok dosyalı sürüm
    const map = {
      "urunler.html": "#magaza", "index.html": "#", "sepet.html": "#sepet",
      "giris.html": "#giris", "hesap.html": "#hesap", "admin.html": "#admin"
    };
    if (map[href]) return map[href];
    if (href.indexOf("index.html#") === 0) return "#" + href.slice("index.html#".length);
    return href;
  }

  // Admin panelinden düzenlenen iletişim/footer metinlerini yerleştir
  applySiteContent(root);

  // ============ MOBİL MENÜ ============
  const hamburger = $("#hamburger");
  const navLinks = $("#navLinks");

  if (hamburger && navLinks) {
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
  }

  // ============ HESAP / OTURUM ============
  const navAccount = $("#navAccount");
  const currentUser = Store.session();

  if (navAccount) {
    if (currentUser) {
      // Menü kalabalıklaşmasın diye admin için isim yerine panel linki gösterilir
      navAccount.innerHTML =
        (currentUser.role === "admin"
          ? '<a href="admin.html" class="admin-link">Yönetim Paneli</a>'
          : '<a href="hesap.html" class="admin-link">Hesabım (' + escHtml(currentUser.name.split(" ")[0]) + ")</a>") +
        '<a href="#" class="logout-link">Çıkış</a>';
      navAccount.querySelector(".logout-link").addEventListener("click", (e) => {
        e.preventDefault();
        Store.logout();
        location.reload();
      });
    } else {
      navAccount.innerHTML = '<a href="giris.html">Giriş Yap</a>';
    }
  }

  // ============ ÜRÜN VE KATEGORİ VERİSİ ============
  const PRODUCTS = Store.getProducts();
  const CATEGORIES = Store.getCategories();

  function catName(id) {
    const c = CATEGORIES.find((c) => c.id === id);
    return c ? c.name : "Diğer";
  }

  function productMedia(p) {
    return p.photo
      ? `<img src="${escHtml(p.photo)}" alt="${escHtml(p.name)}" loading="lazy">`
      : (PRODUCT_ART[p.img] || PRODUCT_ART.panel);
  }

  // ============ SEPET (rozet + sepete ekleme) ============
  // Sepetin kendisi tam ekran sepet.html sayfasında yönetilir.
  const cartCountEl = $("#cartCount");

  const readCart = () => {
    try {
      return JSON.parse(localStorage.getItem("gp-cart")) || {};
    } catch (_) {
      return {};
    }
  };

  function updateCartBadge() {
    if (!cartCountEl) return;
    const cart = readCart();
    const count = Object.entries(cart).reduce(
      (s, [id, qty]) => (PRODUCTS.some((p) => p.id === id) ? s + qty : s), 0
    );
    cartCountEl.hidden = count === 0;
    cartCountEl.textContent = count;
  }

  const addToCart = (id) => {
    const cart = readCart();
    cart[id] = (cart[id] || 0) + 1;
    localStorage.setItem("gp-cart", JSON.stringify(cart));
    updateCartBadge();
  };

  // Tek dosya sürümünde sayfalar arası geçişte rozeti tazele
  window.addEventListener("hashchange", updateCartBadge);
  updateCartBadge();

  // ============ ARAMA + MAĞAZA ============
  const shopGrid = $("#shopGrid");
  const shopFilters = $("#shopFilters");
  const searchForm = $("#siteSearch");
  const searchInput = $("#searchInput");

  // Türkçe küçük harfe çevir ve tüm kelimeler ürün metninde geçiyor mu bak
  const norm = (s) => (s || "").toLocaleLowerCase("tr");
  function matchesQuery(p, q) {
    if (!q) return true;
    const hay = norm(p.name + " " + catName(p.cat) + " " + p.specs.join(" "));
    return norm(q).split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
  }

  function productCard(p) {
    const low = p.stock <= 5;
    return `
      <article class="product">
        <div class="product-img${p.photo ? " has-photo" : ""}">
          <span class="stock-badge${low ? " low" : ""}">${low ? "Son " + p.stock + " adet" : "Stokta"}</span>
          ${productMedia(p)}
        </div>
        <div class="product-body">
          <span class="product-cat">${escHtml(catName(p.cat))}</span>
          <h3>${escHtml(p.name)}</h3>
          <ul class="product-specs">${p.specs.map((s) => `<li>${escHtml(s)}</li>`).join("")}</ul>
          <div class="product-foot">
            <div class="product-price">${tlFmt(p.price)}<span>KDV dahil</span></div>
            <button class="add-btn" data-id="${p.id}">Sepete Ekle</button>
          </div>
        </div>
      </article>`;
  }

  // Ürün adı/özelliklerinden güç-kapasite etiketleri çıkarır (460W, 100Ah, 5 kW, 48V…)
  const UNIT_RANK = { W: 0, kW: 1, kWh: 2, Wh: 3, Ah: 4, A: 5, V: 6 };
  const UNIT_CANON = { w: "W", kw: "kW", kwh: "kWh", wh: "Wh", ah: "Ah", a: "A", v: "V" };
  function extractTags(p) {
    const text = p.name + " " + p.specs.join(" ");
    const re = /(\d+(?:[.,]\d+)?)\s?(kWh|kW|Wh|W|Ah|A|V)\b/gi;
    const tags = new Set();
    let m;
    while ((m = re.exec(text))) {
      const unit = UNIT_CANON[m[2].toLowerCase()];
      const spaced = unit === "kW" || unit === "kWh";
      tags.add(m[1] + (spaced ? " " : "") + unit);
    }
    return tags;
  }
  function tagValue(t) {
    const m = t.match(/(\d+(?:[.,]\d+)?)\s?(\S+)/);
    return [UNIT_RANK[m[2]] ?? 9, parseFloat(m[1].replace(",", "."))];
  }
  PRODUCTS.forEach((p) => { p._tags = extractTags(p); });

  if (shopGrid) {
    // data-mode="featured": ana sayfadaki 'En Çok Satan Ürünler' vitrini
    const featured = shopGrid.dataset.mode === "featured";
    const catList = $("#catList");     // ürünler sayfası: sol kenar kategori listesi
    const powerBox = $("#powerBox");
    const powerList = $("#powerList");
    const resultCount = $("#resultCount");
    const clearBtn = $("#clearFilters");

    let currentCat = "all";
    let selectedPowers = new Set();

    const currentQuery = () => (!featured && searchInput ? searchInput.value.trim() : "");

    // Kategori + arama uygulanmış liste (güç filtresi hariç — facet bundan üretilir)
    function baseList() {
      const q = currentQuery();
      return PRODUCTS.filter(
        (p) => (currentCat === "all" || p.cat === currentCat) && matchesQuery(p, q)
      );
    }

    function renderShop() {
      let list;
      const q = currentQuery();
      if (featured) {
        list = PRODUCTS.filter((p) => p.hit);
        if (list.length === 0) list = PRODUCTS;
        list = list.slice(0, 8);
      } else {
        list = baseList().filter(
          (p) => selectedPowers.size === 0 || Array.from(p._tags).some((t) => selectedPowers.has(t))
        );
      }

      if (resultCount) resultCount.textContent = list.length + " ürün";

      if (list.length === 0) {
        shopGrid.innerHTML = q
          ? `<p class="shop-empty">“${escHtml(q)}” ile eşleşen ürün bulunamadı. Farklı bir kelime deneyin ya da <a href="${pageLink("index.html#iletisim")}">bize yazın</a>, tedarik edelim.</p>`
          : '<p class="shop-empty">Bu filtrelerle eşleşen ürün bulunamadı.</p>';
        return;
      }
      shopGrid.innerHTML = list.map(productCard).join("");
    }

    // ---- Sol kenar: kategori listesi + güç/kapasite facet'i (ürünler sayfası) ----
    function buildCatList() {
      catList.innerHTML =
        `<li><button class="cat-link${currentCat === "all" ? " active" : ""}" data-cat="all">Tüm Ürünler <span>${PRODUCTS.length}</span></button></li>` +
        CATEGORIES.map((c) => {
          const n = PRODUCTS.filter((p) => p.cat === c.id).length;
          return `<li><button class="cat-link${currentCat === c.id ? " active" : ""}" data-cat="${c.id}">${escHtml(c.name)} <span>${n}</span></button></li>`;
        }).join("");
    }

    function buildPowerFacet() {
      const counts = {};
      baseList().forEach((p) => p._tags.forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
      const tags = Object.keys(counts).sort((a, b) => {
        const [ra, va] = tagValue(a), [rb, vb] = tagValue(b);
        return ra - rb || va - vb;
      });
      // Artık geçerli olmayan seçili filtreleri temizle
      selectedPowers.forEach((t) => { if (!(t in counts)) selectedPowers.delete(t); });

      if (tags.length === 0) {
        powerBox.hidden = true;
        powerList.innerHTML = "";
        return;
      }
      powerBox.hidden = false;
      powerList.innerHTML = tags
        .map((t) => `<label class="facet"><input type="checkbox" value="${escHtml(t)}"${selectedPowers.has(t) ? " checked" : ""}> <span class="facet-name">${escHtml(t)}</span> <span class="facet-count">${counts[t]}</span></label>`)
        .join("");
    }

    function updateClear() {
      if (clearBtn) clearBtn.hidden = currentCat === "all" && selectedPowers.size === 0 && !currentQuery();
    }

    if (catList) {
      buildCatList();
      buildPowerFacet();

      catList.addEventListener("click", (e) => {
        const btn = e.target.closest(".cat-link");
        if (!btn) return;
        currentCat = btn.dataset.cat;
        selectedPowers.clear();
        buildCatList();
        buildPowerFacet();
        renderShop();
        updateClear();
      });

      powerList.addEventListener("change", (e) => {
        const cb = e.target.closest('input[type="checkbox"]');
        if (!cb) return;
        if (cb.checked) selectedPowers.add(cb.value);
        else selectedPowers.delete(cb.value);
        renderShop();
        updateClear();
      });

      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          currentCat = "all";
          selectedPowers.clear();
          if (searchInput) searchInput.value = "";
          buildCatList();
          buildPowerFacet();
          renderShop();
          updateClear();
        });
      }
    }

    shopGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".add-btn");
      if (!btn || !addToCart) return;
      addToCart(btn.dataset.id);
      btn.textContent = "Eklendi ✓";
      btn.classList.add("added");
      setTimeout(() => {
        btn.textContent = "Sepete Ekle";
        btn.classList.remove("added");
      }, 1200);
    });

    // Mağaza sayfasında arama kutusu ürünleri canlı filtreler
    if (!featured && searchInput) {
      const applySearch = () => {
        buildPowerFacet();
        renderShop();
        updateClear();
      };
      searchInput.addEventListener("input", applySearch);

      // Başka sayfadan arama/kategori seçilerek gelindiyse uygula
      const loadStoredState = () => {
        const q = sessionStorage.getItem("gp-q");
        if (q !== null) {
          searchInput.value = q;
          sessionStorage.removeItem("gp-q");
        }
        const c = sessionStorage.getItem("gp-cat");
        if (c !== null) {
          currentCat = c;
          selectedPowers.clear();
          sessionStorage.removeItem("gp-cat");
          if (catList) buildCatList();
        }
        applySearch();
      };
      window.addEventListener("hashchange", loadStoredState);
      window.addEventListener("gp-apply-filters", loadStoredState);
      loadStoredState();
    } else {
      renderShop();
    }
  }

  // Arama formu gönderimi (mağaza dışındaki sayfalar ürünler sayfasına yönlenir)
  if (searchForm) {
    const isShopPage = shopGrid && shopGrid.dataset.mode !== "featured";
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (isShopPage) return; // canlı filtre zaten çalışıyor
      const q = searchInput ? searchInput.value.trim() : "";
      sessionStorage.setItem("gp-q", q);
      if (typeof goPage === "function") location.hash = "#magaza"; // tek dosya sürümü
      else location.href = "urunler.html";
    });
  }

  // ============ KATEGORİ ÇUBUĞU (Solar Depo tarzı) ============
  const catbarLinks = $("#catbarLinks");
  const catbarDropdown = $("#catbarDropdown");
  const catbarAll = $("#catbarAll");

  if (catbarLinks || catbarDropdown) {
    if (catbarLinks) {
      catbarLinks.innerHTML = CATEGORIES.map(
        (c) => `<a href="${pageLink("urunler.html")}" class="catbar-link" data-cat="${c.id}">${escHtml(c.name)}</a>`
      ).join("");
    }
    if (catbarDropdown) {
      catbarDropdown.innerHTML =
        `<li><a href="${pageLink("urunler.html")}" data-cat="all">Tüm Ürünler</a></li>` +
        CATEGORIES.map(
          (c) => `<li><a href="${pageLink("urunler.html")}" data-cat="${c.id}">${escHtml(c.name)}</a></li>`
        ).join("");
    }

    const onProductsPage = !!$("#catList");

    const catbarClick = (e) => {
      const a = e.target.closest("[data-cat]");
      if (!a) return;
      e.preventDefault();
      if (catbarAll) catbarAll.classList.remove("open");
      sessionStorage.setItem("gp-cat", a.dataset.cat);
      if (onProductsPage) {
        window.dispatchEvent(new Event("gp-apply-filters"));
        const m = $("#magaza");
        if (m) m.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (typeof goPage === "function") {
        location.hash = "#magaza";
      } else {
        location.href = "urunler.html";
      }
    };

    if (catbarLinks) catbarLinks.addEventListener("click", catbarClick);
    if (catbarDropdown) catbarDropdown.addEventListener("click", catbarClick);

    // "TÜM KATEGORİLER" — dokunmatik için tıklamayla aç/kapa
    if (catbarAll) {
      const allBtn = catbarAll.querySelector(".catbar-all-btn");
      allBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        catbarAll.classList.toggle("open");
      });
      document.addEventListener("click", () => catbarAll.classList.remove("open"));
    }
  }

  // ============ VİTRİN / SHOWROOM SLIDER ============
  const showroomTrack = $("#showroomTrack");

  if (showroomTrack) {
    const showroom = showroomTrack.closest(".showroom");
    const dotsEl = $("#showroomDots");
    const slides = Store.getSlides();
    let index = 0;
    let timer = null;

    showroomTrack.innerHTML = slides
      .map((s) => {
        const bg = s.image
          ? `<div class="slide-bg" style="background-image:url('${String(s.image).replace(/'/g, "%27")}')"></div>`
          : `<div class="slide-bg slide-bg-art">${SLIDE_ART[s.art] || SLIDE_ART.roof}</div>`;
        return `
        <div class="slide">
          ${bg}
          <div class="slide-shade"></div>
          <div class="container slide-content">
            <h2 class="slide-title">${escHtml(s.title || "")}</h2>
            ${s.subtitle ? `<p class="slide-sub">${escHtml(s.subtitle)}</p>` : ""}
            ${s.btnText ? `<a class="btn" href="${escHtml(pageLink(s.btnLink || "urunler.html"))}">${escHtml(s.btnText)}</a>` : ""}
          </div>
        </div>`;
      })
      .join("");

    dotsEl.innerHTML = slides
      .map((_, i) => `<button class="dot" data-i="${i}" aria-label="Slayt ${i + 1}"></button>`)
      .join("");
    const dots = Array.from(dotsEl.children);

    // Tek slayt varsa ok ve noktaları gizle
    if (slides.length <= 1) showroom.classList.add("single");

    function go(i) {
      index = (i + slides.length) % slides.length;
      showroomTrack.style.transform = "translateX(-" + index * 100 + "%)";
      dots.forEach((d, di) => d.classList.toggle("active", di === index));
    }
    const next = () => go(index + 1);
    const prev = () => go(index - 1);
    const stop = () => timer && (clearInterval(timer), (timer = null));
    const start = () => { stop(); if (slides.length > 1) timer = setInterval(next, 5000); };

    $("#showroomNext").addEventListener("click", () => { next(); start(); });
    $("#showroomPrev").addEventListener("click", () => { prev(); start(); });
    dotsEl.addEventListener("click", (e) => {
      const b = e.target.closest(".dot");
      if (b) { go(+b.dataset.i); start(); }
    });

    showroom.addEventListener("mouseenter", stop);
    showroom.addEventListener("mouseleave", start);

    // Dokunmatik / fare ile kaydırma
    let x0 = null;
    showroom.addEventListener("pointerdown", (e) => { x0 = e.clientX; stop(); });
    window.addEventListener("pointerup", (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
      x0 = null;
      start();
    });

    go(0);
    start();
  }

  // ============ TASARRUF HESAPLAYICI ============
  // Varsayımlar (tahmini, Türkiye ortalamaları):
  const billInput = $("#billInput");

  if (billInput) {
    const TL_PER_KWH = 3.2;          // ortalama birim elektrik fiyatı (TL/kWh)
    const KWH_PER_KW_MONTH = 130;    // 1 kW kurulu gücün aylık üretimi (kWh)
    const COST_PER_KW = 36000;       // 1 kW kurulu güç yatırım maliyeti (TL)
    const COVERAGE = 0.9;            // faturanın karşılanma oranı

    const billValue = $("#billValue");
    const resPower = $("#resPower");
    const resSaving = $("#resSaving");
    const resPayback = $("#resPayback");
    const resTotal = $("#resTotal");

    function calculate() {
      const bill = parseInt(billInput.value, 10);
      billValue.textContent = tlFmt(bill);

      const monthlyKwh = bill / TL_PER_KWH;
      const requiredKw = (monthlyKwh * COVERAGE) / KWH_PER_KW_MONTH;
      const systemCost = requiredKw * COST_PER_KW;
      const yearlySaving = bill * 12 * COVERAGE;
      const paybackYears = systemCost / yearlySaving;
      const totalGain = yearlySaving * 25 - systemCost;

      resPower.textContent = requiredKw.toFixed(1).replace(".", ",") + " kW";
      resSaving.textContent = tlFmt(yearlySaving);
      resPayback.textContent = paybackYears.toFixed(1).replace(".", ",") + " yıl";
      resTotal.textContent = tlFmt(totalGain);
    }

    billInput.addEventListener("input", calculate);
    calculate();
  }

  // ============ İLETİŞİM FORMU ============
  const form = $("#contactForm");

  if (form) {
    const formStatus = $("#formStatus");

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
  }
}

// BUILD:init — tek dosya derlemesi bu satırı sayfa kapsayıcılarıyla değiştirir
initSite(document);
