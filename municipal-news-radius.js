/* Pure distance filtering for reviewed event coordinates. No GPS, network, DOM or
   storage access. Callers must attach verified venue coordinates to each item;
   municipality centres, map queries and location names are never inferred here.

   API (CommonJS or window.FjordMunicipalNewsRadius):
   - validCoordinates({latitude, longitude}): boolean; finite numeric WGS84 degrees.
   - normalizeRadius(value): nearest 10 km, clamped 10..200; invalid/empty => 50.
   - distanceKm(origin, destination): great-circle km; invalid point => TypeError.
   - selectNearby(items, origin, radius?): {radiusKm, matches, totalCount,
       unknownCoordinatesCount, outsideRadiusCount}.
     matches contains {item, distanceKm}, nearest first with input-order ties.
     Missing/invalid item.coordinates are excluded and counted, never estimated.
     Date/category filtering belongs to the caller; input items are not mutated.
*/
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FjordMunicipalNewsRadius = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const EARTH_RADIUS_KM = 6371.0088;
  const DEFAULT_RADIUS_KM = 50;
  const MIN_RADIUS_KM = 10;
  const MAX_RADIUS_KM = 200;
  const RADIUS_STEP_KM = 10;
  const radians = degrees => degrees * Math.PI / 180;

  function validCoordinates(point) {
    return Boolean(point && Number.isFinite(point.latitude) &&
      Number.isFinite(point.longitude) && Math.abs(point.latitude) <= 90 &&
      Math.abs(point.longitude) <= 180);
  }

  function normalizeRadius(value) {
    const number = typeof value === 'number' ? value :
      typeof value === 'string' && value.trim() ? Number(value) : NaN;
    if (!Number.isFinite(number)) return DEFAULT_RADIUS_KM;
    return Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM,
      Math.round(number / RADIUS_STEP_KM) * RADIUS_STEP_KM));
  }

  function distanceKm(origin, destination) {
    if (!validCoordinates(origin) || !validCoordinates(destination)) {
      throw new TypeError('Valid numeric latitude and longitude are required');
    }
    const latitudeDelta = radians(destination.latitude - origin.latitude);
    const longitudeDelta = radians(destination.longitude - origin.longitude);
    const haversine = Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(radians(origin.latitude)) * Math.cos(radians(destination.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
    // Floating-point rounding at antipodes must not produce sqrt(negative)/NaN.
    const bounded = Math.min(1, Math.max(0, haversine));
    return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(bounded), Math.sqrt(1 - bounded));
  }

  function selectNearby(items, origin, radius) {
    if (!Array.isArray(items)) throw new TypeError('Items must be an array');
    if (!validCoordinates(origin)) throw new TypeError('A valid origin is required');
    const radiusKm = normalizeRadius(radius);
    let unknownCoordinatesCount = 0;
    let outsideRadiusCount = 0;
    const matches = [];
    items.forEach((item, index) => {
      if (!validCoordinates(item?.coordinates)) {
        unknownCoordinatesCount++;
        return;
      }
      const distance = distanceKm(origin, item.coordinates);
      // 1e-9 km tolerance includes mathematically exact boundary points only.
      if (distance <= radiusKm + 1e-9) matches.push({item, distanceKm:distance, index});
      else outsideRadiusCount++;
    });
    matches.sort((a, b) => a.distanceKm - b.distanceKm || a.index - b.index);
    return {
      radiusKm,
      matches:matches.map(({item, distanceKm:distance}) => ({item, distanceKm:distance})),
      totalCount:items.length,
      unknownCoordinatesCount,
      outsideRadiusCount
    };
  }

  return Object.freeze({EARTH_RADIUS_KM, DEFAULT_RADIUS_KM, MIN_RADIUS_KM,
    MAX_RADIUS_KM, RADIUS_STEP_KM, validCoordinates, normalizeRadius,
    distanceKm, selectNearby});
});
