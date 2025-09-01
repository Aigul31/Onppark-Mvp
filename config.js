/* Централизованная конфигурация фронтенда */
window.APP_CONFIG = {
  API_BASE: window.location.origin,               // базовый адрес для fetch: `${API_BASE}/api/...`

  // TODO: подставь реальные значения Supabase (anon key допускается в браузере)
  SUPABASE_URL: "https://<YOUR_PROJECT>.supabase.co",
  SUPABASE_ANON_KEY: "<YOUR_PUBLIC_ANON_KEY>",

  // Если используем карты:
  // MAPBOX_TOKEN: "<YOUR_TOKEN>"
};