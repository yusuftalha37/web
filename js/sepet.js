// ============ TAM EKRAN SEPET & SİPARİŞ SAYFASI ============

function initCartPage() {
  const cartLayout = document.getElementById("cartLayout");
  if (!cartLayout) return; // bu sayfa değilse çık

  const cartEmptyEl = document.getElementById("cartEmpty");
  const orderSuccessEl = document.getElementById("orderSuccess");
  const cartRows = document.getElementById("cartRows");
  const sumSub = document.getElementById("sumSub");
  const sumTotal = document.getElementById("sumTotal");
  const checkoutStatus = document.getElementById("checkoutStatus");

  const PRODUCTS = Store.getProducts();
  const money = (n) => "₺" + Math.round(n).toLocaleString("tr-TR");

  const readCart = () => {
    try {
      return JSON.parse(localStorage.getItem("gp-cart")) || {};
    } catch (_) {
      return {};
    }
  };
  const writeCart = (c) => localStorage.setItem("gp-cart", JSON.stringify(c));

  const media = (p) =>
    p.photo
      ? `<img src="${escHtml(p.photo)}" alt="">`
      : (PRODUCT_ART[p.img] || PRODUCT_ART.panel);

  function entries() {
    const cart = readCart();
    return Object.entries(cart)
      .map(([id, qty]) => ({ product: PRODUCTS.find((p) => p.id === id), qty }))
      .filter((e) => e.product && e.qty > 0);
  }

  function refreshBadge() {
    // main.js'teki rozet dinleyicisini tetikle
    window.dispatchEvent(new Event("hashchange"));
  }

  function render() {
    const list = entries();
    const total = list.reduce((s, e) => s + e.product.price * e.qty, 0);

    orderSuccessEl.hidden = true;
    cartEmptyEl.hidden = list.length !== 0;
    cartLayout.hidden = list.length === 0;
    if (list.length === 0) return;

    cartRows.innerHTML = list
      .map(
        (e) => `
      <tr>
        <td class="ct-thumb"><div class="cart-thumb">${media(e.product)}</div></td>
        <td class="ct-name">${escHtml(e.product.name)}</td>
        <td class="ct-price">${money(e.product.price)}</td>
        <td class="ct-qty">
          <span class="cart-qty">
            <button type="button" data-id="${e.product.id}" data-act="dec" aria-label="Azalt">−</button>
            <span class="qty-val">${e.qty}</span>
            <button type="button" data-id="${e.product.id}" data-act="inc" aria-label="Artır">+</button>
          </span>
        </td>
        <td class="ct-line">${money(e.product.price * e.qty)}</td>
        <td class="ct-del"><button type="button" class="ct-remove" data-id="${e.product.id}" data-act="del" aria-label="Kaldır">×</button></td>
      </tr>`
      )
      .join("");

    sumSub.textContent = money(total);
    sumTotal.textContent = money(total);
    renderEftInfo();
  }

  // Banka/IBAN bilgilerini ayarlardan sepete yazar
  function renderEftInfo() {
    const el = document.getElementById("eftInfo");
    if (!el) return;
    const s = Store.getSettings();
    if (!s.iban && !s.bankName) {
      el.innerHTML = '<p class="eft-empty">Banka hesap bilgileri henüz girilmemiş. Yönetici, panelden (Ayarlar) IBAN bilgisini ekleyebilir; siparişinizi yine de oluşturabilirsiniz, ekibimiz ödeme bilgilerini iletir.</p>';
      return;
    }
    const row = (label, val) => val ? `<div class="eft-row"><span>${label}</span><strong>${escHtml(val)}</strong></div>` : "";
    el.innerHTML =
      row("Banka", s.bankName) +
      row("Hesap Sahibi", s.bankHolder) +
      (s.iban ? `<div class="eft-row eft-iban"><span>IBAN</span><strong>${escHtml(s.iban)}</strong></div>` : "") +
      (s.bankNote ? `<p class="eft-note">${escHtml(s.bankNote)}</p>` : "");
  }

  cartRows.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const { id, act } = btn.dataset;
    const cart = readCart();
    if (act === "inc") cart[id] = (cart[id] || 0) + 1;
    if (act === "dec") cart[id] = Math.max(0, (cart[id] || 0) - 1);
    if (act === "del" || cart[id] === 0) delete cart[id];
    writeCart(cart);
    refreshBadge();
    render();
  });

  // ---- Siparişi tamamla ----
  document.getElementById("checkoutBtn").addEventListener("click", async () => {
    const list = entries();
    if (list.length === 0) return;

    const name = document.getElementById("coName");
    const phone = document.getElementById("coPhone");
    const email = document.getElementById("coEmail");
    const city = document.getElementById("coCity");
    const address = document.getElementById("coAddress");

    let valid = true;
    [name, phone, city, address].forEach((f) => {
      if (!f.value.trim()) {
        f.classList.add("error");
        valid = false;
      } else {
        f.classList.remove("error");
      }
    });

    if (!valid) {
      checkoutStatus.textContent = "Lütfen zorunlu (*) teslimat alanlarını doldurun.";
      checkoutStatus.className = "form-status err";
      return;
    }

    const session = Store.session();
    const total = list.reduce((s, e) => s + e.product.price * e.qty, 0);
    const order = {
      id: "SA" + Date.now().toString().slice(-8),
      customer: name.value.trim(),
      phone: phone.value.trim(),
      email: (email.value.trim() || (session ? session.email : "")),
      city: city.value.trim(),
      address: address.value.trim(),
      payment: "eft",
      status: "Havale/EFT bekleniyor",
      // Ürün kimliği gönderilir; tutarı sunucu kendi kataloğundan hesaplar
      items: list.map((e) => ({ id: e.product.id, name: e.product.name, qty: e.qty, price: e.product.price })),
      total
    };

    const saved = await Store.addOrder(order);
    if (saved && saved.ok === false) {
      checkoutStatus.textContent = saved.error || "Sipariş oluşturulamadı, lütfen tekrar deneyin.";
      checkoutStatus.className = "form-status err";
      return;
    }
    const orderId = (saved && saved.id) || order.id;
    const finalTotal = (saved && saved.total != null) ? saved.total : total;

    const s = Store.getSettings();
    const bankLines = [];
    if (s.bankName) bankLines.push("Banka: " + s.bankName);
    if (s.bankHolder) bankLines.push("Hesap Sahibi: " + s.bankHolder);
    if (s.iban) bankLines.push("IBAN: " + s.iban);
    const bankHtml = bankLines.length
      ? "<div class='success-bank'>" + bankLines.map((l) => "<div>" + escHtml(l) + "</div>").join("") + "</div>"
      : "";

    showSuccess(
      "<strong>Sipariş No: " + escHtml(orderId) + "</strong><br>" +
      "Toplam <strong>" + money(finalTotal) + "</strong> tutarını aşağıdaki hesaba havale/EFT ile gönderin. " +
      "Açıklamaya <strong>" + escHtml(orderId) + "</strong> yazmayı unutmayın." +
      bankHtml +
      "<span class='success-sub'>Ödemeniz görüldüğünde siparişiniz hazırlanıp kargolanır. Dilerseniz dekontu WhatsApp/e-posta ile iletebilirsiniz.</span>"
    );

    writeCart({});
    refreshBadge();
  });

  function showSuccess(msg) {
    document.getElementById("successMsg").innerHTML = msg;
    cartLayout.hidden = true;
    cartEmptyEl.hidden = true;
    orderSuccessEl.hidden = false;
    window.scrollTo(0, 0);
  }

  // Tek dosya sürümünde sepete dönüldüğünde listeyi tazele
  window.addEventListener("hashchange", () => {
    if (orderSuccessEl.hidden) render();
  });

  render();
}

Store.ready(initCartPage);
