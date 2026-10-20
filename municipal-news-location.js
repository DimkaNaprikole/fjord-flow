/* Municipality containing the visitor's point, not the nearest town.
   Kartverket OpenAPI: https://ws.geonorge.no/kommuneinfo/v1/static/openapi_doc.json
   GPS is requested only from the button. No coordinates are stored. */
(() => {
  'use strict';
  const endpoint = 'https://ws.geonorge.no/kommuneinfo/v1/punkt';
  const problem = code => Object.assign(new Error(code), {code});
  async function resolveMunicipality(coords, {fetch: request = globalThis.fetch, signal} = {}) {
    if (!Number.isFinite(coords?.latitude) || !Number.isFinite(coords?.longitude) || Math.abs(coords.latitude) > 90 || Math.abs(coords.longitude) > 180) throw problem('position');
    const query = new URLSearchParams({nord: String(coords.latitude), ost: String(coords.longitude), koordsys: '4326'});
    const response = await request(endpoint + '?' + query, {signal, credentials: 'omit', referrerPolicy: 'no-referrer'});
    if (response.status === 404) throw problem('outside');
    if (!response.ok) throw problem('network');
    const data = await response.json();
    if (!/^\d{4}$/.test(data?.kommunenummer) || typeof data.kommunenavn !== 'string' || !data.kommunenavn.trim()) throw problem('network');
    return {id: data.kommunenummer, name: data.kommunenavn.trim()};
  }
  function errorKey(error) {
    return ({1:'denied',2:'position',3:'timeout',unsupported:'unsupported','gesture-required':'unsupported',outside:'outside',position:'position'})[error?.code] || (error?.name === 'AbortError' ? 'timeout' : 'network');
  }
  function createController({locate, resolve = resolveMunicipality, changed = () => {}, selected = () => {}, located = () => {}, timeoutMs = 12000} = {}) {
    let revision = 0, geo, abort, timer;
    const state = {busy:false, status:'', municipality:null};
    function stop() { revision++; clearTimeout(timer); geo?.cancel?.(); abort?.abort(); geo = abort = null; state.busy = false; }
    function cancel() { stop(); state.status = ''; state.municipality = null; changed(state); }
    async function start() {
      if (state.busy) return;
      stop(); const token = revision;
      state.busy = true; state.status = 'locating'; state.municipality = null; changed(state);
      try {
        if (typeof locate !== 'function') throw problem('unsupported');
        geo = locate({userInitiated:true});
        const position = await geo.promise;
        if (token !== revision) return;
        // Share the point only with the in-memory distance filter, never storage.
        if (!Number.isFinite(position?.coords?.latitude) || !Number.isFinite(position?.coords?.longitude) || Math.abs(position.coords.latitude)>90 || Math.abs(position.coords.longitude)>180) throw problem('position');
        located({latitude:position.coords.latitude, longitude:position.coords.longitude});
        state.status = 'resolving'; changed(state);
        abort = new AbortController();
        timer = setTimeout(() => abort?.abort(), timeoutMs);
        const result = await resolve(position.coords, {signal:abort.signal});
        if (token !== revision) return;
        state.municipality = result; state.status = 'found'; state.busy = false;
        changed(state); selected(result);
      } catch (error) {
        if (token !== revision) return;
        state.status = errorKey(error); state.busy = false; changed(state);
      } finally {
        if (token === revision) {clearTimeout(timer); geo = abort = null;}
      }
    }
    return {state, start, cancel};
  }
  if (typeof module !== 'undefined' && module.exports) {module.exports = {resolveMunicipality,errorKey,createController}; return;}
  const words = {
    uk: ['Новини поруч','Шукаємо вашу позицію…','Визначаємо комуну…','Комуна за вашою позицією: ','Доступ до геолокації заборонено. Оберіть комуну вручну.','Не вдалося визначити позицію. Оберіть комуну вручну.','Час очікування вичерпано. Спробуйте ще раз або оберіть комуну.','Геолокація недоступна. Оберіть комуну вручну.','У цій точці не знайдено норвезької комуни. Оберіть її вручну.','Не вдалося перевірити комуну в Kartverket. Спробуйте ще раз або оберіть вручну.','Лише після натискання та вашого дозволу координати передаються Kartverket для визначення комуни. Ця функція не зберігає GPS.'],
    nb: ['Nyheter nær meg','Finner posisjonen din…','Finner kommunen…','Kommune ved posisjonen din: ','Posisjonstilgang er avslått. Velg kommune manuelt.','Kunne ikke finne posisjonen. Velg kommune manuelt.','Tidsavbrudd. Prøv igjen eller velg kommune.','Posisjon er utilgjengelig. Velg kommune manuelt.','Ingen norsk kommune funnet ved dette punktet. Velg manuelt.','Kunne ikke sjekke kommunen hos Kartverket. Prøv igjen eller velg manuelt.','Først etter et trykk og din tillatelse sendes koordinater til Kartverket for å finne kommunen. Denne funksjonen lagrer ikke GPS.'],
    en: ['News near me','Finding your location…','Finding the municipality…','Municipality at your estimated location: ','Location permission denied. Select a municipality manually.','Could not determine your location. Select a municipality manually.','Request timed out. Retry or select a municipality.','Geolocation is unavailable. Select a municipality manually.','No Norwegian municipality found at this point. Select manually.','Could not check the municipality with Kartverket. Retry or select manually.','Only after a click and your permission are coordinates sent to Kartverket to find the municipality. This feature does not store GPS.'],
    sv: ['Nyheter nära mig','Söker din position…','Söker kommunen…','Kommun vid din position: ','Positionstillstånd nekades. Välj kommun manuellt.','Kunde inte hitta din position. Välj kommun manuellt.','Tidsgränsen nåddes. Försök igen eller välj kommun.','Position är inte tillgänglig. Välj kommun manuellt.','Ingen norsk kommun hittades vid punkten. Välj manuellt.','Kunde inte kontrollera kommunen hos Kartverket. Försök igen eller välj manuellt.','Först efter ett tryck och ditt tillstånd skickas koordinater till Kartverket för att hitta kommunen. Funktionen lagrar inte GPS.'],
    da: ['Nyheder nær mig','Finder din position…','Finder kommunen…','Kommune ved din position: ','Adgang til position blev afvist. Vælg kommune manuelt.','Kunne ikke finde din position. Vælg kommune manuelt.','Tidsgrænsen blev nået. Prøv igen eller vælg kommune.','Position er utilgængelig. Vælg kommune manuelt.','Ingen norsk kommune fundet ved punktet. Vælg manuelt.','Kunne ikke kontrollere kommunen hos Kartverket. Prøv igen eller vælg manuelt.','Først efter et tryk og din tilladelse sendes koordinater til Kartverket for at finde kommunen. Funktionen gemmer ikke GPS.']
  };
  let view, onSelect, onPosition;
  const controller = createController({
    locate: options => {if (!window.FjordBrowserGeolocation) throw problem('unsupported'); return window.FjordBrowserGeolocation.locate(options);},
    changed: paint, selected: result => onSelect?.(result), located: point => onPosition?.(point)
  });
  function paint() {
    if (!view?.isConnected) return;
    const text = words[window.FjordI18n?.language || document.documentElement.lang] || words.nb;
    const {busy,status,municipality} = controller.state;
    view.querySelector('button').disabled = busy;
    view.querySelector('button').textContent = text[0];
    const indices = {locating:1,resolving:2,found:3,denied:4,position:5,timeout:6,unsupported:7,outside:8,network:9};
    view.querySelector('[role="status"]').textContent = status ? text[indices[status]] + (status === 'found' ? municipality.name : '') : '';
    view.querySelector('small').textContent = text[10];
  }
  function mount({container, onSelect: callback, onPosition: positionCallback}) {
    if (!container) return;
    onSelect = callback;
    onPosition = positionCallback;
    view = document.createElement('div'); view.className = 'news-location'; view.dataset.i18nIgnore = '';
    const button = document.createElement('button'); button.type = 'button'; button.onclick = controller.start;
    const status = document.createElement('p'); status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
    const privacy = document.createElement('small');
    view.append(button,status,privacy); container.append(view); paint();
  }
  window.FjordMunicipalNewsLocation = Object.freeze({mount, cancel:controller.cancel});
})();
