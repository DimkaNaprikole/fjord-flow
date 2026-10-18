import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { extractLocations, normalizeHours, weeklyActiveHours } from './update-bua-directory.mjs';
const directory = JSON.parse(await readFile(new URL('../bua-locations.json', import.meta.url), 'utf8'));
test('directory counts, unique official IDs and source links agree', () => {
  assert.equal(directory.count, directory.locations.length);
  assert.equal(new Set(directory.locations.map(p => p.id)).size, directory.count);
  assert.equal(new Set(directory.locations.map(p => p.locationId)).size, directory.count);
  for (const p of directory.locations) {
    assert.equal(new URL(p.website).hostname, 'bua.no');
    assert.equal(new URL(p.website).searchParams.get('location'), String(p.locationId));
    assert.equal(p.category, 'equipment');
    assert.ok(p.checked.match(/^\d{4}-\d{2}-\d{2}$/));
  }
});
test('every mapped point has Norwegian coordinates and a verified municipality', () => {
  const mapped = directory.locations.filter(p => p.latitude != null && p.longitude != null);
  assert.equal(directory.mappedCount, mapped.length);
  for (const p of mapped) {
    assert.ok(p.latitude >= 57 && p.latitude <= 72, p.id);
    assert.ok(p.longitude >= 4 && p.longitude <= 33, p.id);
    assert.ok(p.municipality && /^\d{4}$/.test(p.municipalityNumber), p.id);
    assert.equal(new URL(p.municipalitySource).hostname, 'api.kartverket.no');
  }
  for (const p of directory.locations.filter(p => p.latitude == null || p.longitude == null)) {
    assert.equal(p.municipality, null);
    assert.ok(p.municipalityNote);
  }
});
test('opening-hour adapter keeps inactive/dated records but weekly UI excludes them', () => {
  const raw = normalizeHours([
    {dayOfWeek: 0, isActive: false, openingTime: '12:00', closingTime: '18:00'},
    {dayOfWeek: 1, isActive: true, openingTime: '12:00', closingTime: '18:00', date:'2026-12-01'},
    {dayOfWeek: 2, isActive: true, openingTime: '16:00', closingTime: '19:00'}
  ]);
  assert.equal(raw.length, 3);
  assert.deepEqual(weeklyActiveHours(raw).map(h => h.dayOfWeek), [2]);
  const gran = directory.locations.find(p => p.id === 'bua-gran');
  assert.deepEqual(weeklyActiveHours(gran.openingHours).map(h => [h.dayOfWeek,h.openingTime,h.closingTime]),
    [[0,'16:00','19:00'],[2,'16:00','19:00']]);
  for (const p of directory.locations) for (const h of p.openingHours) {
    assert.ok(Number.isInteger(h.dayOfWeek) && h.dayOfWeek >= 0 && h.dayOfWeek <= 6, p.id);
    assert.equal(typeof h.isActive, 'boolean');
  }
});
test('public SSR parser extracts a location list and rejects missing props', () => {
  const props = ['$', '$L2e', null, {locations:[{id:'demo',visibleMap:true},{id:'hidden',visibleMap:false}]}];
  const html = `<script>self.__next_f.push(${JSON.stringify([1,`2c:${JSON.stringify(props)}`])})</script>`;
  assert.deepEqual(extractLocations(html).map(p => p.id), ['demo']);
  assert.throws(() => extractLocations('<html></html>'), /not found/);
});
