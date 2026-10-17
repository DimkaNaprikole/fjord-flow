/** Build the curated local catalogue. Run from any cwd: node scripts/build-local-catalog.mjs.
 * Remote property photos are cached once, preserving attribution and original URLs.
 * A failed download or missing local image aborts the build; no remote fallback.
 */
import {readFile, writeFile, access, mkdir, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimeRequire = createRequire('C:/Users/laurk/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp = runtimeRequire('sharp');
const langs = ['nb', 'en', 'uk', 'sv', 'da'];
const genericStay = {
  nb: 'Tilgjengelighet, innsjekking og badstutider må avtales med verten. Se bestillingskalenderen før avreise.',
  en: 'Availability, check-in and sauna times must be confirmed with the host. Check the booking calendar before travelling.',
  uk: 'Наявність місць, заселення й час відвідування сауни потрібно узгодити з господарем. Перед поїздкою перевірте календар бронювань.',
  sv: 'Tillgänglighet, incheckning och bastutider behöver bekräftas av värden. Kontrollera bokningskalendern före avresa.',
  da: 'Ledighed, indtjekning og saunatider skal aftales med værten. Kontrollér bookingkalenderen før afrejse.'
};
const read = async f => JSON.parse(await readFile(path.join(root, f), 'utf8'));
const save = (f, data) => writeFile(path.join(root, f), JSON.stringify(data, null, 2) + '\n', 'utf8');
const exists = async file => {try {await access(file); return true;} catch {return false;}};
let downloaded = 0, reused = 0, bytes = 0;
const pending = new Map();
let active = 0; const queue = [];
async function limited(fn) {if (active >= 2) await new Promise(resolve => queue.push(resolve)); active++; try {return await fn();} finally {active--; queue.shift()?.();}}
function localPath(src) {
  if (typeof src !== 'string' || !src.trim() || /^(?:https?:)?\/\//i.test(src)) throw Error('Expected local image: ' + src);
  const resolved = path.resolve(root, src.split('?')[0]);
  if (!resolved.startsWith(root + path.sep)) throw Error('Image outside repository: ' + src);
  return resolved;
}
async function image(src) {
  if (!/^https:\/\//i.test(src || '')) {const file = localPath(src); if (!await exists(file)) throw Error('Missing image: ' + src); return src;}
  if (!pending.has(src)) pending.set(src, limited(async () => {
    const relative = './images/catalog/cached-' + createHash('sha256').update(src).digest('hex').slice(0, 20) + '.webp';
    const file = localPath(relative);
    if (await exists(file)) {await sharp(file).metadata(); reused++; bytes += (await stat(file)).size; return relative;}
    const response = await fetch(src, {signal: AbortSignal.timeout(20000), headers: {'User-Agent': 'FjordFlow-Catalog/1.0 (local venue photograph cache)', 'Accept': 'image/*'}});
    if (!response.ok) throw Error(`Photo HTTP ${response.status}: ${src}`);
    const content = Buffer.from(await response.arrayBuffer());
    if (content.length > 30 * 1024 * 1024) throw Error('Photo too large: ' + src);
    await mkdir(path.dirname(file), {recursive: true});
    const result = await sharp(content, {limitInputPixels: 100000000}).rotate().resize({width: 1280, withoutEnlargement: true}).webp({quality: 82}).toBuffer();
    await writeFile(file, result); downloaded++; bytes += result.length;
    return relative;
  }));
  return pending.get(src);
}
async function localisePhotos(record) {
  const next = {...record};
  if (record.image) {next.image = await image(record.image); if (/^https:\/\//i.test(record.image)) next.imageOriginal = record.image;}
  if (Array.isArray(record.gallery)) next.gallery = await Promise.all(record.gallery.map(async p => {
    const src = await image(p.src); return {...p, src, ...(/^https:\/\//i.test(p.src) ? {original: p.original || p.src} : {})};
  }));
  return next;
}
function normalized(record, category) {
  const next = {...record, category};
  next.region = record.region || record.area || ({gran: 'Hadeland', hadeland: 'Hadeland', hardanger: 'Hardanger', fjord: 'Aurland', sunnmore: 'Sunnmøre'})[record.route] || record.town || '';
  next.town = record.town || record.area?.split(' · ')[0] || '';
  next.address = record.address || record.area || '';
  next.source = record.source || record.openingHours?.source || record.website || record.sources?.[0] || '';
  next.checked = record.checked || record.openingHours?.checked || '';
  next.directionsUrl = record.directionsUrl || 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(Number.isFinite(record.latitude) && Number.isFinite(record.longitude) ? `${record.latitude},${record.longitude}` : record.routeQuery || [record.name, next.address, next.town, 'Norway'].filter(Boolean).join(', '));
  if (!next.gallery?.length && record.image) {
    const credit = record.photoCredit || {};
    next.gallery = [{src: record.image, kind: category === 'rest' ? 'place' : category === 'cafe' ? 'facade' : category === 'sauna' ? 'sauna' : 'grounds', source: record.imageSource || credit.commonsPage || record.website, ...(credit.authorPlain ? {credit: credit.authorPlain} : {}), ...(credit.license ? {license: credit.license} : {}), ...(credit.licenseUrl ? {licenseUrl: credit.licenseUrl} : {})}];
  }
  next.imageSource = record.imageSource || record.photoCredit?.commonsPage || next.gallery?.[0]?.source || record.website;
  next.photoCaption = record.photoCaption || record.imageCaption || '';
  return next;
}
const rawStays = await read('stays-sauna.json');
const stays = await Promise.all(rawStays.map(localisePhotos));
// Save cached source galleries early, even when supplementary data is not ready yet.
await save('stays-sauna.json', stays);
if (!await exists(path.join(root, 'catalog-rest.json'))) {
  console.log(JSON.stringify({status: 'cached-stays-only; catalog-rest.json not ready', stays: stays.length, downloaded, reused, bytes}));
  process.exit(0);
}
const additions = (await Promise.all(['catalog-new-venues.json', 'catalog-central.json', 'catalog-north.json', 'catalog-west-south.json', 'catalog-sorlandet.json', 'catalog-kristiansand.json', 'catalog-oslofjord.json', 'catalog-east-coast-places.json', 'catalog-east-coast-stays.json', 'catalog-east-coast-cafes.json'].map(read))).flat();
const coordinateOverrides = await read('catalog-coordinates.json');
const visitNotes = await read('catalog-visit-notes.json');
const oldCafes = await read('cafes.json');
const cafeMap = new Map(oldCafes.map(r => [r.id, r]));
for (const entry of additions.filter(r => r.category === 'cafe')) cafeMap.set(entry.id, {...cafeMap.get(entry.id), ...entry});
const cafes = await Promise.all([...cafeMap.values()].map(localisePhotos));
const newNonCafes = await Promise.all(additions.filter(r => r.category !== 'cafe').map(localisePhotos));
const experiences = (await read('route-experiences.json')).filter(r => r.image && !r.placeholder);
const rest = await Promise.all((await read('catalog-rest.json')).map(localisePhotos));
const entries = [
  ...cafes.map(r => normalized(r, 'cafe')),
  ...stays.map(r => normalized({...r, hoursNote: r.hoursNote || Object.fromEntries(langs.map(l => [l, genericStay[l] + (r.sauna?.[l] ? ' ' + r.sauna[l] : '')]))}, 'cabin')),
  ...newNonCafes.map(r => normalized(r, r.category)),
  ...experiences.map(r => normalized({...r, subcategory: r.category, hoursNote: r.hoursNote || r.season}, 'rest')),
  ...rest.map(r => normalized(r, r.category || 'rest'))
].map(record => ({...record, ...(coordinateOverrides[record.id] || {}), ...(visitNotes[record.id] ? {visitInfo: visitNotes[record.id]} : {})}));
const ids = new Set();
for (const entry of entries) {
  if (!entry.id || ids.has(entry.id)) throw Error('Duplicate or empty ID: ' + entry.id);
  ids.add(entry.id);
  if (!['cafe', 'cabin', 'sauna', 'rest'].includes(entry.category)) throw Error('Bad category: ' + entry.id);
  if (!entry.image) throw Error('Missing real photo: ' + entry.id);
  for (const src of [entry.image, ...(entry.gallery || []).map(p => p.src)]) if (!await exists(localPath(src))) throw Error('Missing local photo ' + src);
}
await save('cafes.json', cafes);
await save('norway-catalog.json', entries);
console.log(JSON.stringify({status: 'built', entries: entries.length, counts: Object.fromEntries(['cafe', 'cabin', 'sauna', 'rest'].map(c => [c, entries.filter(r => r.category === c).length])), localPhotos: new Set(entries.flatMap(r => [r.image, ...(r.gallery || []).map(p => p.src)])).size, downloaded, reused, cachedBytes: bytes}, null, 2));
