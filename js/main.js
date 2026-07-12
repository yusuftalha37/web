// ============ MOBİL MENÜ ============
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

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

// ============ İSTATİSTİK SAYAÇLARI ============
const counters = document.querySelectorAll("[data-count]");

function animateCounter(el) {
  const target = parseInt(el.dataset.count, 10);
  const duration = 1600;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    // easeOutCubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased).toLocaleString("tr-TR");
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.6 }
);

counters.forEach((c) => counterObserver.observe(c));

// ============ TASARRUF HESAPLAYICI ============
// Varsayımlar (tahmini, Türkiye ortalamaları):
const TL_PER_KWH = 3.2;          // ortalama birim elektrik fiyatı (TL/kWh)
const KWH_PER_KW_MONTH = 130;    // 1 kW kurulu gücün aylık üretimi (kWh)
const COST_PER_KW = 36000;       // 1 kW kurulu güç yatırım maliyeti (TL)
const COVERAGE = 0.9;            // faturanın karşılanma oranı

const billInput = document.getElementById("billInput");
const billValue = document.getElementById("billValue");
const resPower = document.getElementById("resPower");
const resSaving = document.getElementById("resSaving");
const resPayback = document.getElementById("resPayback");
const resTotal = document.getElementById("resTotal");

const tl = (n) =>
  "₺" + Math.round(n).toLocaleString("tr-TR");

function calculate() {
  const bill = parseInt(billInput.value, 10);
  billValue.textContent = tl(bill);

  const monthlyKwh = bill / TL_PER_KWH;
  const requiredKw = (monthlyKwh * COVERAGE) / KWH_PER_KW_MONTH;
  const systemCost = requiredKw * COST_PER_KW;
  const yearlySaving = bill * 12 * COVERAGE;
  const paybackYears = systemCost / yearlySaving;
  const totalGain = yearlySaving * 25 - systemCost;

  resPower.textContent = requiredKw.toFixed(1).replace(".", ",") + " kW";
  resSaving.textContent = tl(yearlySaving);
  resPayback.textContent = paybackYears.toFixed(1).replace(".", ",") + " yıl";
  resTotal.textContent = tl(totalGain);
}

billInput.addEventListener("input", calculate);
calculate();

// ============ İLETİŞİM FORMU ============
const form = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

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

  // Demo site: gerçek bir backend olmadığı için gönderim simüle edilir.
  formStatus.textContent =
    "Teşekkürler " + name.value.trim() + "! Talebiniz alındı, 24 saat içinde sizi arayacağız. (Demo)";
  formStatus.className = "form-status ok";
  form.reset();
});
