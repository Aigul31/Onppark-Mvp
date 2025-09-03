(function () {
  try {
    const url = new URL(location.href);
    // Разовый сброс: https://.../tg?reset=1
    if (url.searchParams.get('reset') === '1') {
      try { localStorage.clear(); } catch(_) {}
      try { sessionStorage.clear(); } catch(_) {}
      try { window?.supabase?.auth?.signOut?.(); } catch(_) {}
      url.searchParams.delete('reset');
      history.replaceState(null, '', url.toString());
    }
    // Telegram WebApp (если доступен)
    try { window.Telegram?.WebApp?.ready?.(); } catch(_) {}
    // Гейт: если нет профиля — покажем регистрацию
    const profile = JSON.parse(localStorage.getItem('profile') || 'null');
    if (!profile || !profile.user_id) {
      window.showScreen?.('register');
    } else {
      window.showScreen?.('status');
    }
  } catch (e) { console.error('bootstrap error', e); }
})();
