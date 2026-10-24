export const SETTINGS_KEY = 'osiris.settings.v1';
export const SHORTCUT_PRESETS = Object.freeze([
  Object.freeze({ id: 'gmail', name: 'Gmail', url: 'https://mail.google.com/' }),
  Object.freeze({ id: 'outlook', name: 'Outlook', url: 'https://outlook.live.com/mail/' }),
  Object.freeze({ id: 'spotify', name: 'Spotify', url: 'https://open.spotify.com/' }),
  Object.freeze({ id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/' }),
  Object.freeze({ id: 'maps', name: 'Google Maps', url: 'https://www.google.com/maps/' }),
]);
const PRESETS = new Map(SHORTCUT_PRESETS.map(value => [value.id, value]));
const FLAGS = ['roaming', 'animations', 'siteActions'];
const defaults = () => ({ version: 1, roaming: true, animations: true, siteActions: true, shortcuts: [] });
const clone = value => ({ ...value, shortcuts: [...value.shortcuts] });
const installed = new WeakMap();
const COPY = {
  ru: {
    title: 'Настройки Osiris', close: 'Закрыть',
    intro: 'Выберите, как Osiris ведёт себя на этом сайте. Настройки сохраняются в этом браузере.',
    behavior: 'Поведение', animations: 'Анимации',
    animationsDetail: 'Движения и реакции Osiris. При выключении кот остаётся на паузе.',
    roaming: 'Самостоятельные прогулки',
    roamingDetail: 'Osiris может сам выбирать свободное место. Его по-прежнему можно перетаскивать.',
    siteActions: 'Действия на сайте',
    siteActionsDetail: 'Разрешить Osiris открывать разделы и нажимать доступные кнопки по вашей просьбе.',
    motion: 'Системная настройка уменьшения движения также учитывается.',
    apps: 'Приложения и сервисы',
    shortcutNote: 'Открывает сайт сервиса; почта и музыка не подключены.',
    addLabel: 'Добавить ярлык', add: 'Добавить', empty: 'Ярлыков пока нет.',
    memory: 'Личная память', memoryState: 'Между днями ещё не подключена',
    storage: 'Сохранение в браузере недоступно. Настройки действуют до перезагрузки страницы.',
    open: 'Открыть', remove: 'Удалить', removeLabel: 'Удалить ярлык',
  },
  en: {
    title: 'Osiris settings', close: 'Close',
    intro: 'Choose how Osiris behaves on this website. Preferences are saved in this browser.',
    behavior: 'Behavior', animations: 'Animations',
    animationsDetail: 'Osiris movements and reactions. Turning this off pauses the cat.',
    roaming: 'Automatic roaming',
    roamingDetail: 'Osiris can choose a free place to explore. You can still drag the cat.',
    siteActions: 'Website actions',
    siteActionsDetail: 'Allow Osiris to open sections and press available buttons when you ask.',
    motion: 'Your system reduced-motion setting is also respected.',
    apps: 'Apps and services',
    shortcutNote: 'Opens the provider’s website; email and music are not connected.',
    addLabel: 'Add a shortcut', add: 'Add', empty: 'No shortcuts yet.',
    memory: 'Personal memory', memoryState: 'Memory between days is not connected yet',
    storage: 'Browser storage is unavailable. Preferences apply until this page reloads.',
    open: 'Open', remove: 'Remove', removeLabel: 'Remove shortcut',
  },
};

/** Never store tokens, addresses, arbitrary links or unrecognised fields. */
export function sanitizePreferences(value) {
  const result = defaults();
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 1) return result;
  for (const key of FLAGS) if (typeof value[key] === 'boolean') result[key] = value[key];
  if (Array.isArray(value.shortcuts)) {
    result.shortcuts = [...new Set(value.shortcuts.slice(0, 20).filter(id => typeof id === 'string' && PRESETS.has(id)))];
  }
  return result;
}

function parsePreferences(raw) {
  if (typeof raw !== 'string' || raw.length > 4096) return defaults();
  try { return sanitizePreferences(JSON.parse(raw)); } catch { return defaults(); }
}

export function createSettingsStore(storage) {
  let preferences;
  let persistent = Boolean(storage);
  try { preferences = parsePreferences(storage?.getItem(SETTINGS_KEY)); } catch { preferences = defaults(); persistent = false; }
  const listeners = new Set();
  const emit = () => { for (const listener of listeners) listener(clone(preferences), persistent); };
  const update = patch => {
    if (!patch || typeof patch !== 'object') return clone(preferences);
    const next = clone(preferences);
    for (const key of FLAGS) if (typeof patch[key] === 'boolean') next[key] = patch[key];
    if (Array.isArray(patch.shortcuts)) next.shortcuts = sanitizePreferences({ version: 1, shortcuts: patch.shortcuts }).shortcuts;
    if (JSON.stringify(next) === JSON.stringify(preferences)) return clone(preferences);
    preferences = next;
    try {
      if (!storage) throw new Error('Storage unavailable');
      storage.setItem(SETTINGS_KEY, JSON.stringify(preferences));
      persistent = true;
    } catch { persistent = false; }
    emit();
    return clone(preferences);
  };
  return {
    get preferences() { return clone(preferences); },
    get persistent() { return persistent; },
    update,
    addShortcut(id) { return PRESETS.has(id) ? update({ shortcuts: [...preferences.shortcuts, id] }) : clone(preferences); },
    removeShortcut(id) { return update({ shortcuts: preferences.shortcuts.filter(item => item !== id) }); },
    restore(raw) {
      preferences = parsePreferences(raw);
      emit();
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
}

/** Mounts one separate native dialog; does not open chat, microphone or providers. */
export function mountOsirisSettings({ window: host = globalThis.window, document: doc = host?.document, storage } = {}) {
  if (!host || !doc) return null;
  if (installed.has(host)) return installed.get(host);
  if (storage === undefined) {
    try { storage = host.localStorage; } catch { storage = null; }
  }
  const store = createSettingsStore(storage);
  const make = (tag, className, text) => {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const language = () => String(host.FjordI18n?.language || doc.documentElement.lang || 'en').toLowerCase().split('-')[0] === 'ru' ? 'ru' : 'en';
  const textNodes = [];
  const translated = (tag, className, key) => {
    const node = make(tag, className, COPY[language()][key]);
    textNodes.push([node, key]);
    return node;
  };
  const button = translated('button', 'osiris-settings-open', 'title');
  button.type = 'button';
  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute('aria-controls', 'osiris-settings-dialog');
  const dialog = make('dialog', 'osiris-settings-panel');
  dialog.id = 'osiris-settings-dialog';
  dialog.setAttribute('aria-labelledby', 'osiris-settings-title');
  dialog.setAttribute('aria-describedby', 'osiris-settings-intro');
  const header = make('header', 'osiris-settings-header');
  const title = translated('h2', '', 'title');
  title.id = 'osiris-settings-title';
  const closeButton = translated('button', 'osiris-settings-close', 'close');
  closeButton.type = 'button';
  header.append(title, closeButton);
  const intro = translated('p', 'osiris-settings-note', 'intro');
  intro.id = 'osiris-settings-intro';
  const body = make('div', 'osiris-settings-body');
  const behavior = make('fieldset', 'osiris-settings-group');
  behavior.append(translated('legend', '', 'behavior'));
  const toggles = new Map();
  for (const key of ['animations', 'roaming', 'siteActions']) {
    const row = make('label', 'osiris-settings-toggle');
    const input = make('input');
    input.type = 'checkbox';
    input.name = key;
    const copy = make('span', 'osiris-settings-toggle-copy');
    copy.append(translated('strong', '', key), translated('span', 'osiris-settings-note', `${key}Detail`));
    row.append(input, copy);
    behavior.append(row);
    toggles.set(key, input);
    input.addEventListener('change', () => store.update({ [key]: input.checked }));
  }
  const motionNote = translated('p', 'osiris-settings-note', 'motion');
  behavior.append(motionNote);

  const apps = make('section', 'osiris-settings-group');
  const appsTitle = translated('h3', '', 'apps');
  const shortcutNote = translated('p', 'osiris-settings-note', 'shortcutNote');
  const addRow = make('form', 'osiris-settings-add');
  const selectLabel = translated('label', '', 'addLabel');
  selectLabel.htmlFor = 'osiris-shortcut-select';
  const select = make('select');
  select.id = 'osiris-shortcut-select';
  for (const preset of SHORTCUT_PRESETS) {
    const option = make('option', '', preset.name);
    option.value = preset.id;
    select.append(option);
  }
  select.value = SHORTCUT_PRESETS[0].id;
  const add = translated('button', '', 'add');
  add.type = 'submit';
  addRow.append(selectLabel, select, add);
  const list = make('ul', 'osiris-settings-shortcuts');
  const empty = translated('p', 'osiris-settings-note', 'empty');
  apps.append(appsTitle, shortcutNote, addRow, empty, list);
  addRow.addEventListener('submit', event => {
    event.preventDefault();
    store.addShortcut(select.value);
  });

  const memory = make('section', 'osiris-settings-group');
  memory.append(translated('h3', '', 'memory'));
  const memoryState = translated('button', 'osiris-settings-unavailable', 'memoryState');
  memoryState.type = 'button';
  memoryState.disabled = true;
  memory.append(memoryState);
  const status = make('p', 'osiris-settings-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  body.append(behavior, apps, memory, status);
  dialog.append(header, intro, body);

  let attached = false;
  let destroyed = false;
  let returnFocus = null;
  let observer = null;
  let lastPresence = null;
  let lastAnimations;
  let lastRoaming;
  function applyPresence(preferences) {
    const presence = host.OsirisPresence;
    if (!presence) return;
    const fresh = presence !== lastPresence;
    if (fresh || preferences.roaming !== lastRoaming || preferences.animations !== lastAnimations) {
      presence.setPreferences?.({ roaming: preferences.roaming, animations: preferences.animations });
    }
    if (fresh || preferences.animations !== lastAnimations) presence.setPaused?.(!preferences.animations);
    lastPresence = presence;
    lastAnimations = preferences.animations;
    lastRoaming = preferences.roaming;
  }
  function render(preferences, persistent) {
    const words = COPY[language()];
    for (const [node, key] of textNodes) node.textContent = words[key];
    dialog.lang = language();
    for (const [key, input] of toggles) input.checked = preferences[key];
    list.replaceChildren();
    empty.hidden = preferences.shortcuts.length > 0;
    for (const id of preferences.shortcuts) {
      const preset = PRESETS.get(id);
      const row = make('li', 'osiris-settings-shortcut');
      const link = make('a', '', `${words.open} ${preset.name} ↗`);
      link.href = preset.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      const remove = make('button', 'osiris-settings-remove', words.remove);
      remove.type = 'button';
      remove.setAttribute('aria-label', `${words.removeLabel} ${preset.name}`);
      remove.addEventListener('click', () => {
        store.removeShortcut(id);
        select.focus({ preventScroll: true });
      });
      row.append(link, remove);
      list.append(row);
    }
    for (const option of select.children) option.disabled = preferences.shortcuts.includes(option.value);
    if (!PRESETS.has(select.value) || preferences.shortcuts.includes(select.value)) {
      select.value = SHORTCUT_PRESETS.find(preset => !preferences.shortcuts.includes(preset.id))?.id || '';
    }
    select.disabled = preferences.shortcuts.length === SHORTCUT_PRESETS.length;
    add.disabled = select.disabled;
    status.textContent = persistent ? '' : words.storage;
  }
  function announce(preferences) {
    applyPresence(preferences);
    const detail = { preferences: clone(preferences) };
    host.dispatchEvent(new host.CustomEvent('osiris:settings-changed', { detail }));
  }
  const unsubscribe = store.subscribe((preferences, persistent) => {
    render(preferences, persistent);
    announce(preferences);
  });
  function attach() {
    if (attached || destroyed) return attached;
    const about = doc.querySelector('.fjord-ai-about');
    if (!about || !doc.body) return false;
    about.append(button);
    doc.body.append(dialog);
    attached = true;
    observer?.disconnect();
    render(store.preferences, store.persistent);
    return true;
  }
  function open() {
    if (destroyed || !attach() || dialog.open) return false;
    returnFocus = doc.activeElement || button;
    dialog.showModal();
    closeButton.focus({ preventScroll: true });
    return true;
  }
  function close() { if (dialog.open) dialog.close(); }
  button.addEventListener('click', open);
  closeButton.addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); event.stopPropagation(); close(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
  });
  dialog.addEventListener('close', () => {
    const target = returnFocus?.isConnected ? returnFocus : button;
    if (target.isConnected) target.focus({ preventScroll: true });
    returnFocus = null;
  });
  const ready = () => applyPresence(store.preferences);
  const localeChanged = () => render(store.preferences, store.persistent);
  const storageChanged = event => {
    if (event.key === SETTINGS_KEY && (!event.storageArea || event.storageArea === storage)) store.restore(event.newValue);
    else if (event.key === null && event.storageArea === storage) store.restore(null);
  };
  host.addEventListener('osiris:presence-ready', ready);
  host.addEventListener('fjordlanguagechange', localeChanged);
  host.addEventListener('storage', storageChanged);
  const api = {
    get preferences() { return store.preferences; },
    isAllowed(key) { return FLAGS.includes(key) ? store.preferences[key] : false; },
    setPreferences: patch => store.update(patch),
    open,
    close,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      close();
      unsubscribe();
      observer?.disconnect();
      host.removeEventListener('osiris:presence-ready', ready);
      host.removeEventListener('fjordlanguagechange', localeChanged);
      host.removeEventListener('storage', storageChanged);
      button.remove();
      dialog.remove();
      installed.delete(host);
      if (host.OsirisSettings === api) delete host.OsirisSettings;
    },
  };
  installed.set(host, api);
  host.OsirisSettings = api;
  if (!attach() && host.MutationObserver) {
    observer = new host.MutationObserver(attach);
    observer.observe(doc.documentElement, { childList: true, subtree: true });
  }
  announce(store.preferences);
  return api;
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') mountOsirisSettings();
