// ============================================================
// Solar Arena — Bağlantı Ayarları
// ------------------------------------------------------------
// Bu site KENDİ SUNUCUNUZDA (server.js) çalışıyor ve internete
// Cloudflare Tunnel ile "solararena.store" alan adından açılıyor.
//
// SUPABASE_URL'i "aynı adres" olacak şekilde otomatik alıyoruz:
// siteye hangi adresten girilirse (solararena.store veya localhost)
// veri API'si de o adrese gider. Böylece "sadece sunucuda çalışıyor"
// sorunu olmaz.
//
// DEMO moduna dönmek isterseniz SUPABASE_URL'i "" (boş) yapın.
// ============================================================
window.QS_CONFIG = {
  // Yalnızca http/https ile açıldığında sunucu modu; dosyaya çift tıklayınca
  // (file://) demo moduna düşer (aksi halde API çağrıları başarısız olurdu).
  SUPABASE_URL: /^https?:$/.test(location.protocol) ? location.protocol + "//" + location.host : "",
  SUPABASE_ANON_KEY: "local"                               // self-host modunda herhangi bir metin
};
