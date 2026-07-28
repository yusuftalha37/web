// ============================================================
// Quantora Solar — Bağlantı Ayarları
// ------------------------------------------------------------
// Bu site KENDİ SUNUCUNUZDA (server.js) çalışıyor ve internete
// Cloudflare Tunnel ile "solararena.store" alan adından açılıyor.
// Site ile veri API'si aynı adreste olduğu için adres alan adınızdır.
//
// DEMO moduna dönmek isterseniz iki değeri de "" (boş) yapın.
// ============================================================
window.QS_CONFIG = {
  SUPABASE_URL: "https://solararena.store",  // kendi alan adınız
  SUPABASE_ANON_KEY: "local"                 // self-host modunda herhangi bir metin
};
