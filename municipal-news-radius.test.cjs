const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const radius = require('./municipal-news-radius.js');
const origin = Object.freeze({latitude:0,longitude:0});
const north = km => ({latitude:km / radius.EARTH_RADIUS_KM * 180 / Math.PI,longitude:0});

test('validates numeric WGS84 bounds without coercing missing or malformed positions', () => {
  for (const point of [origin,{latitude:90,longitude:180},{latitude:-90,longitude:-180}]) {
    assert.equal(radius.validCoordinates(point),true);
  }
  for (const point of [null,undefined,{},[],{latitude:'0',longitude:0},
    {latitude:null,longitude:0},{latitude:0,longitude:Infinity},
    {latitude:NaN,longitude:0},{latitude:90.01,longitude:0},
    {latitude:0,longitude:-180.01}]) assert.equal(radius.validCoordinates(point),false);
  assert.throws(() => radius.distanceKm(origin,{latitude:'0',longitude:0}),TypeError);
});

test('normalizes radius for slider strings, default 50 km and supported 10–200 km range', () => {
  for (const value of [undefined,null,'','  ',NaN,Infinity,{},'bad']) {
    assert.equal(radius.normalizeRadius(value),50);
  }
  assert.equal(radius.normalizeRadius('100'),100);
  assert.equal(radius.normalizeRadius(' 60 '),60);
  assert.equal(radius.normalizeRadius(54),50);
  assert.equal(radius.normalizeRadius(55),60);
  assert.equal(radius.normalizeRadius(-10),10);
  assert.equal(radius.normalizeRadius(0),10);
  assert.equal(radius.normalizeRadius(999),200);
});

test('Haversine distances handle equal points, known equatorial arc, antimeridian and antipodes', () => {
  assert.equal(radius.distanceKm(origin,origin),0);
  assert.ok(Math.abs(radius.distanceKm(origin,{latitude:0,longitude:1}) - 111.19508023) < 1e-7);
  assert.ok(Math.abs(radius.distanceKm({latitude:0,longitude:179.5},
    {latitude:0,longitude:-179.5}) - 111.19508023) < 1e-7);
  assert.ok(Math.abs(radius.distanceKm(origin,{latitude:0,longitude:180}) -
    Math.PI * radius.EARTH_RADIUS_KM) < 1e-7);
  assert.ok(Number.isFinite(radius.distanceKm({latitude:90,longitude:0},
    {latitude:-90,longitude:180})));
});

test('includes exact boundary, excludes a point just outside, and reports unknown coordinates', () => {
  const items = [
    {id:'edge',coordinates:north(50)},
    {id:'outside',coordinates:north(50.0001)},
    {id:'missing',municipality:'0301',location:'Oslo',mapQuery:'Oslo',latitude:0,longitude:0},
    {id:'bad',coordinates:{latitude:NaN,longitude:0}},
    null
  ];
  const result = radius.selectNearby(items,origin);
  assert.equal(result.radiusKm,50);
  assert.deepEqual(result.matches.map(r=>r.item.id),['edge']);
  assert.equal(result.unknownCoordinatesCount,3);
  assert.equal(result.outsideRadiusCount,1);
  assert.equal(result.totalCount,5);
});

test('sorts nearest first, preserves ties and input data, and reuses origin when radius changes', () => {
  const items = Object.freeze([
    Object.freeze({id:'far',coordinates:Object.freeze(north(90))}),
    Object.freeze({id:'tie-first',coordinates:Object.freeze(north(20))}),
    Object.freeze({id:'nearest',coordinates:origin}),
    Object.freeze({id:'tie-second',coordinates:Object.freeze(north(20))})
  ]);
  const before = JSON.stringify(items);
  assert.deepEqual(radius.selectNearby(items,origin).matches.map(r=>r.item.id),
    ['nearest','tie-first','tie-second']);
  const expanded = radius.selectNearby(items,origin,'100');
  assert.deepEqual(expanded.matches.map(r=>r.item.id),
    ['nearest','tie-first','tie-second','far']);
  assert.equal(expanded.matches[3].item,items[0]);
  assert.equal(JSON.stringify(items),before);
  assert.deepEqual(Object.keys(expanded.matches[0]).sort(),['distanceKm','item']);
});

test('invalid origins cannot silently become a town centre or zero point', () => {
  assert.throws(()=>radius.selectNearby([],null),TypeError);
  assert.throws(()=>radius.selectNearby([],{latitude:'60',longitude:10}),TypeError);
  assert.throws(()=>radius.selectNearby(null,origin),TypeError);
  assert.deepEqual(radius.selectNearby([],origin).matches,[]);
});

test('browser UMD export loads without DOM, GPS, storage or network access', () => {
  const window = {};
  const context = vm.createContext({window});
  vm.runInContext(fs.readFileSync(require.resolve('./municipal-news-radius.js'),'utf8'),context);
  assert.equal(window.FjordMunicipalNewsRadius.DEFAULT_RADIUS_KM,50);
  assert.equal(window.FjordMunicipalNewsRadius.normalizeRadius('100'),100);
  assert.equal(window.FjordMunicipalNewsRadius.selectNearby([],origin).unknownCoordinatesCount,0);
  assert.equal(Object.isFrozen(window.FjordMunicipalNewsRadius),true);
});
