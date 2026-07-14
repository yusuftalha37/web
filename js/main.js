// ============================================================
// SİTE SAYFALARI ORTAK KODU (ana sayfa + ürünler sayfası)
// initSite(root): sayfadaki menü, mağaza, sepet, hesaplayıcı ve
// iletişim formunu başlatır. Çok dosyalı sürümde root=document,
// tek dosya sürümünde her sayfanın kapsayıcı div'idir.
// ============================================================

function initSite(root) {
  const $ = (sel) => root.querySelector(sel);

  const tlFmt = (n) => "₺" + Math.round(n).toLocaleString("tr-TR");

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

  if (shopGrid) {
    // data-mode="featured": ana sayfadaki 'En Çok Satan Ürünler' vitrini
    const featured = shopGrid.dataset.mode === "featured";
    let currentCat = "all";

    function renderShop() {
      let list;
      const q = (!featured && searchInput) ? searchInput.value.trim() : "";
      if (featured) {
        list = PRODUCTS.filter((p) => p.hit);
        if (list.length === 0) list = PRODUCTS; // hiç işaret yoksa hepsinden göster
        list = list.slice(0, 8);
      } else {
        list = PRODUCTS.filter(
          (p) => (currentCat === "all" || p.cat === currentCat) && matchesQuery(p, q)
        );
      }

      if (list.length === 0) {
        shopGrid.innerHTML = q
          ? `<p class="shop-empty">“${escHtml(q)}” ile eşleşen ürün bulunamadı. Farklı bir kelime deneyin ya da <a href="index.html#iletisim">bize yazın</a>, tedarik edelim.</p>`
          : '<p class="shop-empty">Bu kategoride henüz ürün bulunmuyor.</p>';
        return;
      }

      shopGrid.innerHTML = list.map(productCard).join("");
    }

    if (shopFilters) {
      shopFilters.innerHTML =
        '<button class="filter-btn active" data-cat="all">Tümü</button>' +
        CATEGORIES.map(
          (c) => `<button class="filter-btn" data-cat="${c.id}">${escHtml(c.name)}</button>`
        ).join("");

      shopFilters.addEventListener("click", (e) => {
        const btn = e.target.closest(".filter-btn");
        if (!btn) return;
        shopFilters.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentCat = btn.dataset.cat;
        renderShop();
      });
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
      searchInput.addEventListener("input", renderShop);

      // Başka sayfadan aranarak gelindiyse terimi al ve uygula
      const loadStoredQuery = () => {
        const q = sessionStorage.getItem("gp-q");
        if (q !== null) {
          searchInput.value = q;
          sessionStorage.removeItem("gp-q");
        }
        renderShop();
      };
      window.addEventListener("hashchange", loadStoredQuery);
      loadStoredQuery();
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
