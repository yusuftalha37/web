#!/usr/bin/env python3
"""
Tüm siteyi (index + giriş + hesabım + admin) tek bir HTML dosyasında birleştirir.
Çıktı: solar-arena.html — çift tıklayınca tarayıcıda doğrudan çalışır.

Kullanım: python3 build_tek_dosya.py
"""
import re
import pathlib

ROOT = pathlib.Path(__file__).parent
OUT = ROOT / "solar-arena.html"


def body_of(path):
    """HTML dosyasının <body> içeriğini script etiketleri olmadan döndürür."""
    html = (ROOT / path).read_text()
    m = re.search(r"<body[^>]*>(.*)</body>", html, re.DOTALL)
    content = m.group(1)
    content = re.sub(r'\s*<script src="[^"]+"></script>', "", content)
    return content.strip()


def rewrite_links(html):
    """Sayfalar arası dosya bağlantılarını tek dosya içi hash rotalarına çevirir."""
    html = html.replace('href="index.html#', 'href="#')
    html = html.replace('href="index.html"', 'href="#"')
    html = html.replace('href="giris.html"', 'href="#giris"')
    html = html.replace('href="hesap.html"', 'href="#hesap"')
    html = html.replace('href="admin.html"', 'href="#admin"')
    html = html.replace('href="urunler.html"', 'href="#magaza"')
    html = html.replace('href="sepet.html"', 'href="#sepet"')
    # Blog sayfaları tek dosya sürümüne dahil değil; ana sayfaya yönlendir
    html = html.replace('href="blog.html"', 'href="#"')
    return html


# ---- sayfa gövdeleri ----
index_body = rewrite_links(body_of("index.html"))
urunler_body = rewrite_links(body_of("urunler.html"))
urun_body = rewrite_links(body_of("urun.html"))
sepet_body = rewrite_links(body_of("sepet.html"))
giris_body = rewrite_links(body_of("giris.html"))
hesap_body = rewrite_links(body_of("hesap.html"))
admin_body = rewrite_links(body_of("admin.html"))

# ---- CSS ----
css = (ROOT / "css/style.css").read_text() + "\n" + (ROOT / "css/admin.css").read_text()

# ---- JS: sayfa geçişleri hash rotasına, yönlendirmeler goPage()'e çevrilir ----
store_js = (ROOT / "js/store.js").read_text()

main_js = (ROOT / "js/main.js").read_text()
main_js = main_js.replace('href="admin.html"', 'href="#admin"')
main_js = main_js.replace('href="hesap.html"', 'href="#hesap"')
main_js = main_js.replace('href="giris.html"', 'href="#giris"')
main_js = main_js.replace(
    '// BUILD:init — tek dosya derlemesi bu satırı sayfa kapsayıcılarıyla değiştirir\nStore.ready(() => initSite(document));',
    'Store.ready(() => {\n  initSite(document.getElementById("page-index"));\n  initSite(document.getElementById("page-urunler"));\n  initSite(document.getElementById("page-urun"));\n  initSite(document.getElementById("page-sepet"));\n});'
)

urun_js = (ROOT / "js/urun.js").read_text()

auth_js = (ROOT / "js/auth.js").read_text()
auth_js = auth_js.replace(
    "const existing = Store.session();\nif (existing) {",
    'const existing = Store.session();\nif (existing && location.hash === "#giris") {'
)
auth_js = auth_js.replace(
    'location.href = existing.role === "admin" ? "admin.html" : "index.html";',
    'goPage(existing.role === "admin" ? "#admin" : "#");'
)
auth_js = auth_js.replace(
    'location.href = result.session.role === "admin" ? "admin.html" : "index.html";',
    'goPage(result.session.role === "admin" ? "#admin" : "#");'
)
auth_js = auth_js.replace('(location.href = "index.html")', 'goPage("#")')

hesap_js = (ROOT / "js/hesap.js").read_text()
hesap_js = hesap_js.replace(
    'if (!me) location.href = "giris.html";',
    'if (!me && location.hash === "#hesap") goPage("#giris");'
)
hesap_js = hesap_js.replace('location.href = "index.html";', 'goPage("#");')
hesap_js = hesap_js.replace('href="index.html#', 'href="#')

sepet_js = (ROOT / "js/sepet.js").read_text()
sepet_js = sepet_js.replace("href=\"urunler.html\"", "href=\"#magaza\"")

admin_js = (ROOT / "js/admin.js").read_text()
admin_js = admin_js.replace(
    'if (!adminSession || adminSession.role !== "admin") {\n  location.href = "giris.html";\n}',
    'if (location.hash === "#admin" && (!adminSession || adminSession.role !== "admin")) {\n  goPage("#giris");\n}'
)
admin_js = admin_js.replace('location.href = "giris.html";', 'goPage("#giris");')

router_js = """
// ---- TEK DOSYA SAYFA YÖNLENDİRİCİSİ ----
const PAGE_IDS = { "#magaza": "page-urunler", "#sepet": "page-sepet", "#giris": "page-giris", "#hesap": "page-hesap", "#admin": "page-admin" };

function route() {
  let target = PAGE_IDS[location.hash] || (location.hash.indexOf("#urun/") === 0 ? "page-urun" : "page-index");
  // Sayfa açıkken elle #admin yazılırsa da yetki kontrolü yap
  if (target === "page-admin" && typeof Store !== "undefined") {
    const s = Store.session();
    if (!s || s.role !== "admin") {
      location.hash = "#giris";
      target = "page-giris";
    }
  }
  document.querySelectorAll(".single-page").forEach((d) => {
    d.style.display = d.id === target ? "" : "none";
  });
  if (PAGE_IDS[location.hash] || location.hash.indexOf("#urun/") === 0) window.scrollTo(0, 0);
}

// Oturum durumu değiştiğinde sayfayı hedef rotayla yeniden yükler
function goPage(hash) {
  location.hash = hash === "#" ? "" : hash;
  location.reload();
}

window.addEventListener("hashchange", route);
"""

single = f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Solar Arena Enerji — güneş enerjisi sistemleri satış ve kurulum. Tek dosyalık sürüm.">
  <title>Solar Arena Enerji | Güneş Paneli Satış &amp; Kurulum</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>☀️</text></svg>">
  <style>
{css}
  </style>
</head>
<body>

<div id="page-index" class="single-page">
{index_body}
</div>

<div id="page-urunler" class="single-page" style="display:none">
{urunler_body}
</div>

<div id="page-urun" class="single-page" style="display:none">
{urun_body}
</div>

<div id="page-sepet" class="single-page" style="display:none">
{sepet_body}
</div>

<div id="page-giris" class="single-page auth-body" style="display:none">
{giris_body}
</div>

<div id="page-hesap" class="single-page account-body" style="display:none">
{hesap_body}
</div>

<div id="page-admin" class="single-page admin-body" style="display:none">
{admin_body}
</div>

<script>
{router_js}

{store_js}

route();

// ---- ANA SAYFA ----
(() => {{
{main_js}
}})();

// ---- ÜRÜN DETAY SAYFASI ----
(() => {{
{urun_js}
}})();

// ---- SEPET SAYFASI ----
(() => {{
{sepet_js}
}})();

// ---- GİRİŞ / KAYIT ----
(() => {{
{auth_js}
}})();

// ---- HESABIM ----
(() => {{
{hesap_js}
}})();

// ---- YÖNETİM PANELİ ----
(() => {{
{admin_js}
}})();
</script>
</body>
</html>
"""

OUT.write_text(single)
print(f"Oluşturuldu: {OUT.name} ({OUT.stat().st_size // 1024} KB)")
