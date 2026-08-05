// ============ GİRİŞ / KAYIT SAYFASI ============

// Zaten giriş yapılmışsa doğru sayfaya yönlendir
const existing = Store.session();
if (existing) {
  location.href = existing.role === "admin" ? "admin.html" : "index.html";
}

// Sekme geçişi
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

document.querySelectorAll(".auth-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const isLogin = tab.dataset.tab === "login";
    loginForm.hidden = !isLogin;
    registerForm.hidden = isLogin;
  });
});

function setStatus(el, msg, ok) {
  el.textContent = msg;
  el.className = "form-status " + (ok ? "ok" : "err");
}

// Giriş
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = document.getElementById("loginStatus");
  const email = document.getElementById("loginEmail").value.trim();
  const pass = document.getElementById("loginPass").value;

  if (!email || !pass) {
    setStatus(status, "Lütfen e-posta ve şifrenizi girin.", false);
    return;
  }

  const result = await Store.login(email, pass);
  if (!result.ok) {
    setStatus(status, result.error, false);
    return;
  }

  setStatus(status, "Giriş başarılı, yönlendiriliyorsunuz…", true);
  setTimeout(() => {
    location.href = result.session.role === "admin" ? "admin.html" : "index.html";
  }, 600);
});

// Şifremi unuttum
const forgotForm = document.getElementById("forgotForm");
const forgotLink = document.getElementById("forgotLink");
const forgotBack = document.getElementById("forgotBack");

forgotLink.addEventListener("click", (e) => {
  e.preventDefault();
  loginForm.hidden = true;
  forgotForm.hidden = false;
  document.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("active"));
});

forgotBack.addEventListener("click", (e) => {
  e.preventDefault();
  forgotForm.hidden = true;
  loginForm.hidden = false;
  document.querySelectorAll(".auth-tab")[0].classList.add("active");
});

forgotForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = document.getElementById("forgotStatus");
  const email = document.getElementById("forgotEmail").value.trim();
  if (!email) { setStatus(status, "Lütfen e-posta adresinizi girin.", false); return; }
  setStatus(status, "Gönderiliyor…", true);
  try {
    const r = await fetch("/auth/v1/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    if (r.ok) {
      setStatus(status, "Sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.", true);
    } else {
      const d = await r.json().catch(() => ({}));
      setStatus(status, d.msg || "Bir hata oluştu. Daha sonra tekrar deneyin.", false);
    }
  } catch (_) {
    setStatus(status, "Bağlantı hatası. İnternet bağlantınızı kontrol edin.", false);
  }
});

// Kayıt
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = document.getElementById("registerStatus");
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const phone = document.getElementById("regPhone").value;
  const pass = document.getElementById("regPass").value;
  const pass2 = document.getElementById("regPass2").value;

  if (!name || !email || !pass) {
    setStatus(status, "Lütfen zorunlu alanları doldurun.", false);
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setStatus(status, "Geçerli bir e-posta adresi girin.", false);
    return;
  }
  if (pass.length < 6) {
    setStatus(status, "Şifre en az 6 karakter olmalıdır.", false);
    return;
  }
  if (pass !== pass2) {
    setStatus(status, "Şifreler birbiriyle uyuşmuyor.", false);
    return;
  }

  const hp = document.getElementById("regWebsite");
  const result = await Store.register({ name, email, phone, pass, website: hp ? hp.value : "" });
  if (!result.ok) {
    setStatus(status, result.error, false);
    return;
  }

  await Store.login(email, pass);
  setStatus(status, "Hesabınız oluşturuldu, yönlendiriliyorsunuz…", true);
  setTimeout(() => (location.href = "index.html"), 700);
});
