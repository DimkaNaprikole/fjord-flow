/* Explicit-click geolocation with one bounded fallback; no IP lookup or stored GPS. */
(() => {
  'use strict';
  function error(code, message) {const e = new Error(message); e.name = 'FjordGeolocationError'; e.code = code; return e;}
  function normalize(position) {
    const c = position?.coords;
    if (!c || !Number.isFinite(c.latitude) || !Number.isFinite(c.longitude) || Math.abs(c.latitude) > 90 || Math.abs(c.longitude) > 180) return null;
    return {coords: {latitude: c.latitude, longitude: c.longitude, accuracy: Number.isFinite(c.accuracy) && c.accuracy >= 0 ? c.accuracy : null,
      altitude: Number.isFinite(c.altitude) ? c.altitude : null, altitudeAccuracy: Number.isFinite(c.altitudeAccuracy) ? c.altitudeAccuracy : null,
      heading: Number.isFinite(c.heading) ? c.heading : null, speed: Number.isFinite(c.speed) ? c.speed : null}, timestamp: Number.isFinite(position.timestamp) ? position.timestamp : null};
  }
  function locate(options = {}) {
    const provider = options.geolocation ?? (typeof navigator !== 'undefined' ? navigator.geolocation : null);
    const coarseMs = Math.max(1, Math.min(12000, Number(options.coarseTimeoutMs) || 12000));
    const freshMs = Math.max(1, Math.min(25000, Number(options.freshTimeoutMs) || 25000));
    let settled = false, revision = 0, watchId = null, timer, rejectPromise, resolvePromise;
    const promise = new Promise((resolve, reject) => {resolvePromise = resolve; rejectPromise = reject;});
    function cleanup() {
      clearTimeout(timer); timer = undefined;
      if (watchId !== null) {try {provider.clearWatch(watchId);} catch {} watchId = null;}
    }
    function finish(problem, position) {
      if (settled) return; settled = true; revision++; cleanup();
      problem ? rejectPromise(problem) : resolvePromise(position);
    }
    function stage(name, timeoutMs) {try {options.onStage?.({stage: name, timeoutMs});} catch {}}
    function startFresh() {
      if (settled) return;
      cleanup(); const token = ++revision; stage('fresh', freshMs);
      timer = setTimeout(() => {if (token === revision) finish(error(3, 'Fresh geolocation timed out.'));}, freshMs);
      if (typeof provider.watchPosition !== 'function') {finish(error(2, 'Fresh geolocation is unavailable.')); return;}
      try {
        const id = provider.watchPosition(position => {
          if (settled || token !== revision) return;
          const result = normalize(position);
          result ? finish(null, result) : finish(error(2, 'Geolocation returned invalid coordinates.'));
        }, problem => {
          if (settled || token !== revision) return;
          finish(error([1,2,3].includes(problem?.code) ? problem.code : 2, problem?.message || 'Fresh geolocation failed.'));
        }, {enableHighAccuracy: true, maximumAge: 0, timeout: freshMs});
        // A mock or provider may call back synchronously before returning its watch ID.
        if (settled || token !== revision) {try {provider.clearWatch(id);} catch {}} else watchId = id;
      } catch (problem) {if (!settled && token === revision) finish(error(problem?.code === 1 ? 1 : 2, problem?.message || 'Fresh geolocation failed.'));}
    }
    function startCoarse() {
      const token = ++revision; stage('coarse', coarseMs);
      timer = setTimeout(() => {if (!settled && token === revision) startFresh();}, coarseMs);
      try {
        provider.getCurrentPosition(position => {
          if (settled || token !== revision) return;
          const result = normalize(position); result ? finish(null, result) : startFresh();
        }, problem => {
          if (settled || token !== revision) return;
          if (problem?.code === 1) finish(error(1, problem.message || 'Geolocation permission denied.'));
          else if (problem?.code === 2 || problem?.code === 3) startFresh();
          else finish(error(2, problem?.message || 'Geolocation failed.'));
        }, {enableHighAccuracy: false, maximumAge: 60000, timeout: coarseMs});
      } catch (problem) {if (!settled && token === revision) {
        if (problem?.code === 2 || problem?.code === 3) startFresh();
        else finish(error(problem?.code === 1 ? 1 : 2, problem?.message || 'Geolocation failed.'));
      }}
    }
    const cancel = () => finish(error('cancelled', 'Geolocation request cancelled.'));
    if (options.userInitiated !== true) finish(error('gesture-required', 'Start geolocation only after an explicit user action.'));
    else if (!provider || typeof provider.getCurrentPosition !== 'function') finish(error('unsupported', 'Geolocation is not supported.'));
    else startCoarse();
    return {promise, cancel};
  }
  const api = Object.freeze({locate});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.FjordBrowserGeolocation = api;
})();
