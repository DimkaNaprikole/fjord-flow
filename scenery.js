/* Local, credited still photographs. No video or third-party player is loaded here. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  const decks = [];
  let routeState = null;
  let experiencePhotos = null;
  let collectionDeck = null;
  let paused = reduce.matches;
  const shuffle = items => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  function localImage(path) {
    return typeof path === 'string' && /^(?:(?:\.\/|\/)?images\/[\w.-]+|(?:\.\/)?experience-(?:kistefos|storelgen)\.jpg)$/.test(path);
  }
  const credited = new Set();
  function credit(photo) {
    if (credited.has(photo.image)) return;
    credited.add(photo.image);
    const p = document.createElement('p');
    p.append(`${photo.title} — ${photo.author} · `);
    for (const [label, href] of [[photo.license, photo.licenseUrl], ['Original photograph', photo.source]]) {
      if (!/^https?:\/\//.test(href || '')) continue;
      const a = document.createElement('a');
      a.textContent = label; a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
      p.append(a, ' · ');
    }
    p.append('Responsive crop / beskåret.');
    document.getElementById('sceneryCredits').append(p);
  }
  function controls() {
    document.querySelectorAll('.roadtrip-scene').forEach(host => {
      host.dataset.sceneryPaused = String(paused);
    });
    document.querySelectorAll('[data-scenery-pause]').forEach(button => {
      button.textContent = paused ? 'Play photos' : 'Pause photos';
      button.setAttribute('aria-pressed', String(paused));
    });
    window.FjordI18n?.apply();
  }
  class PhotoDeck {
    constructor(host, photos, caption, counter) {
      this.host = host;
      this.photos = photos.filter(photo => localImage(photo.image));
      this.caption = caption;
      this.counter = counter;
      this.index = -1;
      this.layer = 0;
      this.visible = true;
      this.busy = false;
      this.route = host.classList.contains('route-scenery');
      this.hovered = false;
      this.focused = false;
      this.lastChange = Date.now();
      if (this.route) {
        const activate = () => {
          host.dataset.previewActive = String(this.hovered || this.focused);
          if (!paused && !reduce.matches) this.next();
        };
        host.addEventListener('mouseenter', () => { this.hovered = true; activate(); });
        host.addEventListener('mouseleave', () => {
          this.hovered = false; host.dataset.previewActive = String(this.focused);
        });
        const button = host.closest('[data-roadtrip]');
        button.addEventListener('focusin', () => {
          this.focused = button.matches(':focus-visible');
          if (this.focused) activate();
        });
        button.addEventListener('focusout', () => {
          this.focused = false; host.dataset.previewActive = String(this.hovered);
        });
      }
      this.layers = [0, 1].map(() => {
        const img = document.createElement('img');
        img.alt = '';
        img.decoding = 'async';
        img.className = 'scenery-frame';
        host.append(img);
        return img;
      });
      const observer = new IntersectionObserver(entries => {
        this.visible = entries[0].isIntersecting;
      });
      observer.observe(host);
      decks.push(this);
      this.next();
    }
    async next() {
      if (this.busy || !this.photos.length) return;
      this.busy = true;
      // Skip missing assets without replacing a successfully displayed frame.
      for (let attempt = 0; attempt < this.photos.length; attempt++) {
        this.index = (this.index + 1) % this.photos.length;
        const photo = this.photos[this.index];
        const incoming = this.layers[1 - this.layer];
        incoming.src = photo.image;
        try { await incoming.decode(); } catch { continue; }
        incoming.style.objectPosition = photo.position || 'center';
        incoming.classList.add('is-visible');
        this.layers[this.layer].classList.remove('is-visible');
        this.layer = 1 - this.layer;
        this.lastChange = Date.now();
        this.host.dataset.currentImage = photo.image;
        this.host.dataset.currentPlace = photo.title;
        if (this.caption) this.caption.textContent = photo.title;
        if (this.counter) this.counter.textContent = `${String(this.index + 1).padStart(2, '0')} / ${String(this.photos.length).padStart(2, '0')}`;
        break;
      }
      this.busy = false;
    }
  }
  document.querySelectorAll('[data-scenery-pause]').forEach(button => {
    button.addEventListener('click', () => { paused = !paused; controls(); });
  });
  document.getElementById('heroNextPhoto')?.addEventListener('click', () => {
    decks.find(deck => deck.host.id === 'heroScenery')?.next();
  });
  reduce.addEventListener('change', event => { paused = event.matches; controls(); });
  window.addEventListener('fjordlanguagechange', controls);
  controls();
  setInterval(() => {
    if (paused || document.hidden || document.querySelector('dialog[open]')) return;
    decks.filter(deck => deck.visible).forEach(deck => {
      const active = !deck.route || !hover.matches || deck.hovered ||
        (deck.focused && !decks.some(other => other.route && other.hovered));
      const delay = deck.route && hover.matches ? 3000 : 6500;
      if (active && Date.now() - deck.lastChange >= delay) deck.next();
    });
  }, 500);

  fetch('./hero-slides.json').then(response => {
    if (!response.ok) throw Error('Scenery catalog unavailable');
    return response.json();
  }).then(photos => {
    new PhotoDeck(document.getElementById('heroScenery'), photos,
      document.getElementById('heroPlace'), document.getElementById('heroPhotoCount'));
    photos.forEach(credit);
  }).catch(error => console.warn(error.message));

  function routeDecks(state) {
    if (!Array.isArray(state?.destinations)) return;
    routeState = state;
    const points = {
      hardanger: ['bergen', 'steinsdalsfossen', 'voringfossen', 'latefossen', 'trolltunga'],
      fjord: ['bergen', 'flam', 'stegastein', 'naeroyfjord'],
      sunnmore: ['rampestreken', 'trollstigen', 'geiranger', 'loen'],
      family: ['oslo'],
      osterdalen: ['roros']
    };
    for (const [route, ids] of Object.entries(points)) {
      const button = document.querySelector(`[data-roadtrip="${route}"]`);
      if (!button || button.querySelector('.route-scenery')) continue;
      const extraId = {family: 'kistefos', osterdalen: 'storelgen'}[route];
      // The added routes wait for the credited attraction photographs, not a substitute landscape.
      if (extraId && experiencePhotos === null) continue;
      const pools = shuffle(ids).map(id => {
        const place = state.destinations.find(p => p.id === id);
        if (!place) return [];
        const seen = new Set();
        return shuffle((extraId ? [place] : [place, ...(place.gallery || [])]).filter(p => {
          if (!localImage(p.image) || seen.has(p.image)) return false;
          seen.add(p.image); return true;
        }).map(p => ({image: p.image, title: place.name, author: p.imageCredit,
          license: p.imageLicense, licenseUrl: p.imageLicenseUrl, source: p.imageSource})));
      });
      // Round-robin across places, then alternate viewpoints of each place.
      const photos = [];
      for (let i = 0; pools.some(pool => i < pool.length); i++) {
        pools.forEach(pool => { if (pool[i]) photos.push(pool[i]); });
      }
      if (extraId && experiencePhotos[extraId]) photos.unshift(experiencePhotos[extraId]);
      if (!photos.length) continue;
      photos.forEach(credit);
      const viewport = document.createElement('div');
      viewport.className = 'route-scenery';
      const label = document.createElement('span');
      label.className = 'route-photo-place';
      label.setAttribute('data-i18n-ignore', '');
      button.prepend(viewport); viewport.append(label);
      new PhotoDeck(viewport, photos, label);
    }
    const collection = document.querySelector('.roadtrip-collection');
    if (collection && !collectionDeck && experiencePhotos !== null) {
      const photos = ['bergen', 'voringfossen', 'geiranger', 'roros'].map(id => {
        const p = state.destinations.find(place => place.id === id);
        return p && {image: p.image, title: p.name, author: p.imageCredit,
          license: p.imageLicense, licenseUrl: p.imageLicenseUrl, source: p.imageSource};
      }).filter(p => p && localImage(p.image));
      photos.push(...Object.values(experiencePhotos));
      if (photos.length) {
        photos.forEach(credit);
        const backdrop = document.createElement('div');
        backdrop.className = 'roadtrip-scene';
        backdrop.setAttribute('aria-hidden', 'true');
        backdrop.dataset.sceneryPaused = String(paused);
        collection.prepend(backdrop);
        collectionDeck = new PhotoDeck(backdrop, shuffle(photos));
      }
    }
  }
  window.addEventListener('fjord:state', event => routeDecks(event.detail));
  if (typeof data !== 'undefined' && data?.destinations) routeDecks(data);
  // Itinerary adds the two custom buttons after this script; handle either load order.
  const routePresets = document.querySelector('.roadtrip-presets');
  if (routePresets) new MutationObserver(() => {
    if (routeState) routeDecks(routeState);
  }).observe(routePresets, {childList: true, subtree: true});
  fetch('./route-experiences.json?v=2').then(response => {
    if (!response.ok) throw Error('Route attraction photographs unavailable');
    return response.json();
  }).then(records => {
    experiencePhotos = {};
    for (const record of Array.isArray(records) ? records : []) {
      if (!['kistefos', 'storelgen'].includes(record.id) || !localImage(record.image) || !record.photoCredit) continue;
      const c = record.photoCredit;
      experiencePhotos[record.id] = {image: record.image, title: record.name,
        author: c.authorPlain, license: c.license, licenseUrl: c.licenseUrl, source: c.commonsPage};
    }
    if (routeState) routeDecks(routeState);
  }).catch(error => {
    experiencePhotos = {};
    if (routeState) routeDecks(routeState);
    console.warn(error.message);
  });
})();
