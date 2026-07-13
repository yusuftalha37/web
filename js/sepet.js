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
  document.getElementById("checkoutBtn").addEventListener("click", () => {
    const list = entries();
    if (list.length === 0) return;

    const name = document.getElementById("coName");
    const phone = document.getElementById("coPhone");
    const email = document.getElementById("coEmail");
    const city = document.getElementById("coCity");
    const address = document.getElementById("coAddress");
    const method = document.querySelector('input[name="payMethod"]:checked').value;

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
      customer: name.value.trim(),
      phone: phone.value.trim(),
      email: (email.value.trim() || (session ? session.email : "")),
      city: city.value.trim(),
      address: address.value.trim(),
      payment: method,
      status: method === "card" ? "Ödeme bekliyor (PayTR)" : "WhatsApp siparişi",
      items: list.map((e) => ({ name: e.product.name, qty: e.qty, price: e.product.price })),
      total
    };

    Store.addOrder(order);

    if (method === "card") {
      // PayTR bağlandığında müşteri burada ödeme sayfasına yönlendirilecek
      const result = Store.startCardPayment(order);
      showSuccess(
        "Siparişiniz kaydedildi (Toplam: " + money(total) + "). " + result.message +
        " Ekibimiz ödeme için sizinle iletişime geçecek."
      );
    } else {
      const lines = order.items.map((i) => `• ${i.qty} × ${i.name} — ${money(i.price * i.qty)}`);
      const msg =
        "Merhaba, sipariş vermek istiyorum:\n\n" + lines.join("\n") +
        "\n\nToplam: " + money(total) +
        "\n\nAd Soyad: " + order.customer +
        "\nTelefon: " + order.phone +
        "\nİl: " + order.city +
        "\nAdres: " + order.address;
      window.open(
        "https://wa.me/" + Store.getSettings().whatsapp + "?text=" + encodeURIComponent(msg),
        "_blank"
      );
      showSuccess(
        "Siparişiniz kaydedildi (Toplam: " + money(total) + "). " +
        "Açılan WhatsApp penceresindeki mesajı göndermeyi unutmayın; ekibimiz sizi arayarak onaylayacak."
      );
    }

    writeCart({});
    refreshBadge();
  });

  function showSuccess(msg) {
    document.getElementById("successMsg").textContent = msg;
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

initCartPage();
