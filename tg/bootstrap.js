(async () => {
  try {
    const url = new URL(location.href);
    // Если добавим ?reset=1 к URL — полностью сбросит локальное состояние
    if (url.searchParams.get('reset') === '1') {
      localStorage.clear();
      sessionStorage.clear();
      try { await window?.supabase?.auth?.signOut?.(); } catch (_e) {}
      // уберём флаг, чтобы не зациклиться
      url.searchParams.delete('reset');
      history.replaceState(null, '', url.toString());
    }

    // Telegram WebApp API (если есть)
    try { window.Telegram?.WebApp?.ready?.(); } catch (_e) {}

    // Простейший «гейт»: если нет профиля — на регистрацию
    const profile = JSON.parse(localStorage.getItem('profile') || 'null');
    if (!profile || !profile.user_id) {
      // функция показа экрана регистрации — подставь свою
      window.showScreen?.('register');
    } else {
      window.showScreen?.('status');
    }
  } catch (e) {
    console.error('bootstrap error', e);
  }
})();
