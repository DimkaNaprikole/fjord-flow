/* Shared site account. Authentication and credentials stay with Firebase. */
(() => {
  'use strict';
  const labels = {
    nb: ['Din Fjord Flow-konto','Lukk konto','Logg ut','E-posten er bekreftet','Laster sikker innlogging …','Kunne ikke åpne innlogging. Prøv igjen.','Denne kontoen brukes også med Fjordi. Publisering i fellesskapet er ikke tilgjengelig ennå.'],
    en: ['Your Fjord Flow account','Close account','Sign out','Email verified','Loading secure sign-in …','Could not open sign-in. Please try again.','This account also works with Fjordi. Community posting is not available yet.'],
    uk: ['Ваш акаунт Fjord Flow','Закрити акаунт','Вийти','Пошту підтверджено','Завантаження безпечного входу …','Не вдалося відкрити вхід. Спробуйте ще раз.','Цей акаунт також працює з Фьорді. Публікації у спільноті поки недоступні.'],
    ru: ['Ваш аккаунт Fjord Flow','Закрыть аккаунт','Выйти','Почта подтверждена','Загрузка безопасного входа …','Не удалось открыть вход. Попробуйте ещё раз.','Этот аккаунт также работает с Фьорди. Публикации в сообществе пока недоступны.'],
    sv: ['Ditt Fjord Flow-konto','Stäng konto','Logga ut','E-postadressen är verifierad','Laddar säker inloggning …','Kunde inte öppna inloggningen. Försök igen.','Kontot fungerar även med Fjordi. Inlägg i gemenskapen är inte tillgängliga ännu.'],
    da: ['Din Fjord Flow-konto','Luk konto','Log ud','E-mailen er bekræftet','Indlæser sikkert login …','Kunne ikke åbne login. Prøv igen.','Kontoen fungerer også med Fjordi. Indlæg i fællesskabet er endnu ikke tilgængelige.']
  };
  let auth, config, dialog, status, body, opener, pending = false;
  const language = () => window.FjordI18n?.language || document.getElementById('siteLanguage')?.value || document.documentElement.lang || 'nb';
  const words = () => labels[language()] || labels.en;
  const getProfile = () => {
    const visitor = auth?.getStoredVisitor?.();
    return visitor?.email && visitor?.idToken ? { email: visitor.email } : null;
  };
  const changed = () => window.dispatchEvent(new CustomEvent('fjord:site-auth-ready'));
  let loading;
  const load = () => loading ||= Promise.all([
    import('./afonya-auth.js?v=6'),
    fetch('./chat-config.json', {cache: 'no-cache'}).then(response => {
      if (!response.ok) throw Error('CONFIG_UNAVAILABLE');
      return response.json();
    })
  ]).then(async ([module, settings]) => {
    auth = module; config = settings;
    if (!config.firebaseApiKey) throw Error('CONFIG_UNAVAILABLE');
    await auth.getVisitorToken(config.firebaseApiKey);
    changed();
    return auth;
  }).catch(error => {loading = null; throw error;});
  function createDialog() {
    dialog = document.createElement('dialog');
    dialog.id = 'fjordSiteAccount';
    dialog.setAttribute('aria-labelledby', 'fjordSiteAccountTitle');
    dialog.setAttribute('data-i18n-ignore', '');
    const close = document.createElement('button');
    close.className = 'site-account-close'; close.type = 'button'; close.textContent = '×';
    close.addEventListener('click', () => dialog.close());
    const title = document.createElement('h2'); title.id = 'fjordSiteAccountTitle';
    status = document.createElement('p'); status.className = 'site-account-status'; status.setAttribute('role', 'status');
    body = document.createElement('div'); body.className = 'site-account-body';
    dialog.append(close, title, status, body); document.body.append(dialog);
    dialog.addEventListener('close', () => {
      pending = false; body.replaceChildren();
      if (opener?.isConnected) opener.focus({preventScroll: true});
    });
    dialog.addEventListener('click', event => { if (event.target === dialog) {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    }});
  }
  function localize() {
    if (!dialog) return;
    dialog.querySelector('h2').textContent = words()[0];
    dialog.querySelector('.site-account-close').setAttribute('aria-label', words()[1]);
  }
  function showProfile(visitor) {
    status.textContent = words()[3]; body.replaceChildren();
    const email = document.createElement('p'); email.className = 'site-account-email'; email.textContent = visitor.email;
    const note = document.createElement('p'); note.className = 'site-account-note'; note.textContent = words()[6];
    const logout = document.createElement('button'); logout.type = 'button'; logout.textContent = words()[2];
    logout.addEventListener('click', async () => {
      logout.disabled = true;
      try {await auth.signOutVisitor(); dialog.close(); changed();}
      catch {status.textContent = words()[5]; logout.disabled = false;}
    });
    body.append(email, note, logout);
  }
  async function open(mode = 'login') {
    if (!dialog) createDialog();
    if (dialog.open && pending) return;
    opener = document.activeElement; localize();
    if (!dialog.open) dialog.showModal();
    status.textContent = words()[4]; body.replaceChildren(); pending = true;
    try {
      await load();
      if (!dialog.open) return;
      status.textContent = '';
      const verified = auth.ensureVerified(dialog, config.firebaseApiKey, language());
      if (mode === 'register') dialog.querySelector('.fjord-ai-auth-buttons button')?.focus({preventScroll:true});
      const visitor = await verified;
      if (visitor && dialog.open) {showProfile(visitor); changed();}
    } catch {if (dialog.open) status.textContent = words()[5];}
    finally {pending = false;}
  }
  window.FjordSiteAuth = {open, getProfile};
  window.addEventListener('fjord:auth-changed', () => {
    changed();
    if (dialog?.open && getProfile()) showProfile(getProfile());
  });
  window.addEventListener('fjordlanguagechange', () => {
    localize(); if (dialog?.open && getProfile() && !dialog.querySelector('.fjord-ai-auth')) showProfile(getProfile());
  });
  void load().catch(() => {});
})();

