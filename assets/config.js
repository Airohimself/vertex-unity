// Public configuration. These two Supabase values are SAFE to publish
// (they are protected by the row-level-security rules in supabase/schema.sql).
// Leave both empty to run in "demo mode": everything works and is saved in this
// browser only (no sign-in, no shared chat, no file uploads, no cross-device sync).
window.VERTEX_CONFIG = {
  SUPABASE_URL: "https://ksayojgrqozjwjwjpvnb.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_sgSbQwONiGO0pD4xfE6pmw_TXjMAcus",  // publishable key: safe to publish
  // Approximate exchange rates used only for display. Edit when you like.
  RATES: { USD: 1, UZS: 12800, EUR: 0.92 },
  DATA_VERSION: "2026-11",
};
