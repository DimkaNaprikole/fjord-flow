/* A complete route, rather than only its final destination. */
(() => {
  const dialog = document.createElement('dialog');
  dialog.id = 'itineraryDialog';
  dialog.setAttribute('aria-labelledby', 'itineraryTitle');
  dialog.innerHTML = `<header class="itinerary-header"><div><p class="eyebrow">YOUR JOURNEY, STOP BY STOP</p><h2 id="itineraryTitle"></h2><p id="itineraryOrder" data-i18n-ignore></p></div><button id="itineraryClose" type="button" aria-label="Close itinerary">×</button></header>
    <div class="itinerary-layout"><section class="itinerary-map-panel"><div id="itineraryMap" aria-label="Map of the whole itinerary"></div><p id="itineraryStatus" role="status"></p><p class="itinerary-notice">Driving estimates exclude visits, hikes, ferries and current road conditions. Check seasonal mountain-road closures before travelling.</p><a id="itineraryNavigation" class="button" target="_blank" rel="noopener noreferrer">Open full route in Google Maps ↗</a><button id="itineraryFit" class="text-link" type="button">Show the whole route</button></section><section><h3>All stops along the way</h3><ol id="itineraryStops"></ol></section></div>`;
  document.body.append(dialog);
  let map, layer, routeLine, activePoints = [], requestId = 0;
  const cache = new Map();
  const text = source => window.FjordI18n?.t(source) || source;
  const coords = p => [p.latitude, p.longitude];
  const query = p => p.routeQuery || coords(p).join(',');
  const find = id => data.destinations.find(p => p.id === id);
  const fit = () => {
    if (!map || !dialog.open || !activePoints.length) return;
    map.invalidateSize();
    const bounds = L.latLngBounds(activePoints.map(coords));
    if (routeLine) bounds.extend(routeLine.getBounds());
    map.fitBounds(bounds, {padding: [35, 35], maxZoom: 11, animate: false});
  };
  document.getElementById('itineraryClose').onclick = () => dialog.close();
  document.getElementById('itineraryFit').onclick = fit;
  dialog.addEventListener('close', () => { requestId++; });
  function stopCards(points, markers) {
    const list = document.getElementById('itineraryStops');
    list.replaceChildren();
    points.forEach((p, i) => {
      const item = document.createElement('li');
      item.id = `itinerary-stop-${i}`;
      const photos = [...new Set([p.image, ...(p.gallery || []).map(g => g.image)])].filter(Boolean).slice(0, 3);
      item.innerHTML = `<div class="itinerary-stop-title"><span data-i18n-ignore>${String(i + 1).padStart(2, '0')}</span><div><small>${i === 0 ? 'Starting point' : i === points.length - 1 ? 'Final stop' : 'Along the way'}</small><h4 data-i18n-ignore>${esc(p.name)}</h4></div><button type="button" class="stop-on-map" aria-label="Show on map">⌖</button></div><button type="button" class="itinerary-main-photo" aria-label="View photo journal"><img src="${esc(safeURL(photos[0]))}" alt="${esc(p.name)}" loading="lazy"><span>View photo journal ↗</span></button><div class="itinerary-thumbnails">${photos.slice(1).map(src => `<img src="${esc(safeURL(src))}" alt="${esc(p.name)}" loading="lazy">`).join('')}</div><p>${esc(p.description || '')}</p><small class="itinerary-access">${esc(p.routeLabel || p.name)}</small>`;
      item.querySelector('.itinerary-main-photo').onclick = () => openGallery(p.id);
      item.querySelector('.stop-on-map').onclick = () => {
        map.setView(coords(p), 11); markers[i].openPopup();
        document.getElementById('itineraryMap').scrollIntoView({block: 'nearest', behavior: 'smooth'});
      };
      list.append(item);
    });
  }
  async function openItinerary(key, button) {
    const config = roadTrips[key];
    const origin = find(key === 'sunnmore' ? 'rampestreken' : 'bergen');
    const points = [origin, ...config.stops.map(find), find(config.destination)];
    if (points.some(p => !p || !Number.isFinite(p.latitude) || !Number.isFinite(p.longitude))) return;
    // Åndalsnes is represented by the catalogue's Rampestreken road access.
    activePoints = points;
    const token = ++requestId;
    document.getElementById('itineraryTitle').textContent = button.querySelector('b').textContent;
    document.getElementById('itineraryOrder').textContent = points.map(p => p.name).join(' → ');
    document.getElementById('itineraryStatus').textContent = 'Calculating the road route…';
    if (!map) {
      map = L.map('itineraryMap', {scrollWheelZoom: false});
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
      }).addTo(map);
      layer = L.layerGroup().addTo(map);
      new ResizeObserver(fit).observe(document.getElementById('itineraryMap'));
    }
    layer.clearLayers(); routeLine = null;
    const markers = points.map((p, i) => {
      const marker = L.marker(coords(p), {icon: L.divIcon({className: 'itinerary-pin', html: `<span>${i + 1}</span>`, iconSize: [30, 30], iconAnchor: [15, 15]})}).addTo(layer);
      const popup = document.createElement('div');
      const name = document.createElement('b'); name.textContent = `${i + 1}. ${p.name}`;
      const action = document.createElement('button'); action.type = 'button'; action.textContent = text('View this stop');
      action.onclick = () => document.getElementById(`itinerary-stop-${i}`).scrollIntoView({block: 'nearest', behavior: 'smooth'});
      popup.append(name, document.createElement('br'), action); marker.bindPopup(popup);
      return marker;
    });
    stopCards(points, markers);
    const navigation = new URL('https://www.google.com/maps/dir/');
    navigation.searchParams.set('api', '1'); navigation.searchParams.set('travelmode', 'driving');
    navigation.searchParams.set('origin', query(points[0]));
    navigation.searchParams.set('destination', query(points[points.length - 1]));
    navigation.searchParams.set('waypoints', points.slice(1, -1).map(query).join('|'));
    document.getElementById('itineraryNavigation').href = navigation.href;
    dialog.showModal(); dialog.scrollTop = 0;
    window.FjordI18n?.apply(); requestAnimationFrame(fit);
    try {
      let result = cache.get(key);
      if (!result) {
        result = await api('route', {origin: coords(points[0]).join(','), destination: config.destination, stops: config.stops, max_detour_minutes: 90});
        cache.set(key, result);
      }
      if (token !== requestId || !dialog.open) return;
      if (!result.geometry?.length) throw Error('Missing road geometry');
      routeLine = L.polyline(result.geometry.map(p => [p[1], p[0]]), {color: '#bb1238', weight: 5, opacity: .9}).addTo(layer);
      const distance = Math.round(result.total_distance_km ?? result.distance_km);
      const minutes = Math.round(result.total_duration_minutes ?? result.duration_minutes);
      document.getElementById('itineraryStatus').textContent = `${distance} km · ${Math.floor(minutes / 60)} h ${minutes % 60} min · ${text('Driving only')}`;
      fit();
    } catch {
      if (token !== requestId || !dialog.open) return;
      document.getElementById('itineraryStatus').textContent = 'Road calculation is unavailable. All stops are shown; open Google Maps for directions.';
      window.FjordI18n?.apply();
    }
  }
  document.querySelectorAll('[data-roadtrip]').forEach(button => {
    button.onclick = () => openItinerary(button.dataset.roadtrip, button);
  });
})();
