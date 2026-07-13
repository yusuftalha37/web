// ============ HESABIM SAYFASI ============

// Giriş yapılmamışsa giriş sayfasına yönlendir
const me = Store.session();
if (!me) location.href = "giris.html";

const tlFmt = (n) => "₺" + Math.round(n).toLocaleString("tr-TR");
const dateFmt = (ts) =>
  new Date(ts).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

function setStatus(el, msg, ok) {
  el.textContent = msg;
  el.className = "form-status " + (ok ? "ok" : "err");
}

// Çıkış
document.getElementById("accountLogout").addEventListener("click", (e) => {
  e.preventDefault();
  Store.logout();
  location.href = "index.html";
});

// ---- Hesap bilgileri ----
const accName = document.getElementById("accName");
const accEmail = document.getElementById("accEmail");
const accPhone = document.getElementById("accPhone");

const userInfo = me ? Store.getUser(me.email) : null;
if (userInfo) {
  accName.value = userInfo.name;
  accEmail.value = userInfo.email;
  accPhone.value = userInfo.phone;
}

document.getElementById("profileForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const status = document.getElementById("profileStatus");
  if (!accName.value.trim()) {
    setStatus(status, "Ad Soyad boş bırakılamaz.", false);
    return;
  }
  const result = Store.updateProfile(me.email, {
    name: accName.value,
    phone: accPhone.value
  });
  setStatus(status, result.ok ? "Bilgileriniz güncellendi." : result.error, result.ok);
});

// ---- Şifre değiştirme ----
document.getElementById("passwordForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const status = document.getElementById("passwordStatus");
  const oldPass = document.getElementById("passOld").value;
  const newPass = document.getElementById("passNew").value;
  const newPass2 = document.getElementById("passNew2").value;

  if (newPass.length < 6) {
    setStatus(status, "Yeni şifre en az 6 karakter olmalıdır.", false);
    return;
  }
  if (newPass !== newPass2) {
    setStatus(status, "Yeni şifreler birbiriyle uyuşmuyor.", false);
    return;
  }
  const result = Store.changePassword(me.email, oldPass, newPass);
  if (result.ok) {
    setStatus(status, "Şifreniz değiştirildi.", true);
    e.target.reset();
  } else {
    setStatus(status, result.error, false);
  }
});

// ---- Siparişlerim ----
function renderMyOrders() {
  const orders = me ? Store.getOrdersByEmail(me.email) : [];
  document.getElementById("myOrders").innerHTML =
    orders.map((o) => `
      <div class="order-entry">
        <div class="order-entry-head">
          <span>Sipariş Talebi</span>
          <span>${dateFmt(o.date)}</span>
        </div>
        <ul class="order-entry-items">
          ${o.items.map((i) => `<li>${i.qty} × ${escHtml(i.name)} <span>${tlFmt(i.price * i.qty)}</span></li>`).join("")}
        </ul>
        <div class="order-entry-total">Toplam: <strong>${tlFmt(o.total)}</strong></div>
      </div>`).join("") ||
    '<p class="account-empty">Henüz bir sipariş talebiniz bulunmuyor.<br><a href="index.html#urunler">Mağazamıza göz atın →</a></p>';
}

renderMyOrders();
