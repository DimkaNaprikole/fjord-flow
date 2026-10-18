/** Refresh the public BUA directory. No credentials or paid APIs.
 * node scripts/update-bua-directory.mjs [--html=qa/bua-directory.html]
 * Municipality boundaries: https://api.kartverket.no/kommuneinfo/v1/
 */
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const SOURCE = 'https://bua.no/finn-bua';
export function extractLocations(html) {
  const chunks = [...html.matchAll(/self\.__next_f\.push\((\[.*?\])\)<\/script>/gs)]
    .map(match => JSON.parse(match[1])).filter(chunk => chunk[0] === 1).map(chunk => chunk[1]);
  for (const chunk of chunks) {
    if (!chunk.includes('"locations":[')) continue;
    const value = JSON.parse(chunk.slice(chunk.indexOf(':') + 1));
    if (Array.isArray(value?.[3]?.locations)) return value[3].locations.filter(place => place.visibleMap !== false);
  }
  throw new Error('Public BUA location props not found; source format may have changed.');
}
export function normalizeHours(hours = []) {
  return hours.map(h => ({ dayOfWeek: h.dayOfWeek, isActive: h.isActive === true,
    openingTime: h.openingTime ?? null, closingTime: h.closingTime ?? null, date: h.date ?? null }));
}
export function weeklyActiveHours(hours) {
  // Dated exceptions must not become repeating weekly hours. Inactive times are retained
  // in raw openingHours but must never be shown as opening intervals.
  return hours.filter(h => h.isActive && !h.date && h.openingTime && h.closingTime);
}
export async function updateDirectory({ htmlPath, output = 'bua-locations.json' } = {}) {
  const response = htmlPath ? null : await fetch(SOURCE);
  if (response && !response.ok) throw new Error(`BUA HTTP ${response.status}`);
  const locations = extractLocations(htmlPath ? await readFile(htmlPath, 'utf8') : await response.text());
  if (locations.length < 250) throw new Error(`Unexpectedly small directory: ${locations.length}`);
  let previous = []; try { previous = JSON.parse(await readFile(output, 'utf8')).locations ?? []; } catch {}
  const cache = new Map(previous.filter(p => p.municipalityNumber && p.latitude != null)
    .map(p => [`${p.latitude},${p.longitude}`, p]));
  const checked = new Date().toISOString().slice(0, 10);
  const normalized = new Array(locations.length);
  let next = 0;
  async function worker() {
    while (next < locations.length) {
      const index = next++; const p = locations[index];
      const latitude = Number.isFinite(p.lat) ? p.lat : null;
      const longitude = Number.isFinite(p.lng) ? p.lng : null;
      const url = `${SOURCE}?location=${p.locationId}`;
      const record = { id: p.id, locationId: p.locationId, slug: p.slug, name: p.name,
        municipality: null, municipalityNumber: null, county: p.county ?? null,
        town: p.visitCity ?? null, address: p.location ?? null, latitude, longitude,
        website: url, source: url, category: 'equipment', type: p.type, loanType: p.loanType,
        openingHours: normalizeHours(p.openingHours), checked };
      if (latitude != null && longitude != null) {
        const key = `${latitude},${longitude}`;
        const cached = cache.get(key);
        if (cached) {
          record.municipality = cached.municipality;
          record.municipalityNumber = cached.municipalityNumber;
          record.county = cached.county;
          record.municipalitySource = cached.municipalitySource;
        } else {
          const geoUrl = `https://api.kartverket.no/kommuneinfo/v1/punkt?nord=${latitude}&ost=${longitude}&koordsys=4258`;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              const geo = await fetch(geoUrl, { signal: AbortSignal.timeout(20000) });
              if (!geo.ok) throw new Error(`Kartverket HTTP ${geo.status}`);
              const data = await geo.json();
              if (!data.kommunenavn) throw new Error('No municipality returned');
              record.municipality = data.kommunenavn;
              record.municipalityNumber = data.kommunenummer;
              record.county = data.fylkesnavn;
              record.municipalitySource = geoUrl;
              break;
            } catch (error) {
              if (attempt === 2) record.municipalityNote = String(error.message);
              else await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            }
          }
        }
      } else record.municipalityNote = 'Official BUA directory does not publish coordinates; municipality not inferred from a nearby city.';
      normalized[index] = record;
      if ((index + 1) % 50 === 0) console.log(`Processed ${index + 1}/${locations.length}`);
    }
  }
  await Promise.all([worker(), worker()]);
  const payload = { source: SOURCE, checked, coordinatesSource: 'Official public BUA directory',
    municipalitySource: 'Kartverket kommuneinfo point-in-municipality API (EPSG:4258)',
    openingHoursNote: 'dayOfWeek 0=Monday; preserve inactive periods and dated exceptions. Hours and stock may change; confirm on BUA.',
    count: normalized.length, mappedCount: normalized.filter(p => p.latitude != null && p.longitude != null).length,
    locations: normalized };
  await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(JSON.stringify({ count: payload.count, mappedCount: payload.mappedCount,
    municipalities: new Set(normalized.map(p => p.municipality).filter(Boolean)).size,
    unresolved: normalized.filter(p => !p.municipality).map(p => ({id:p.id,note:p.municipalityNote})) }, null, 2));
  return payload;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const htmlPath = process.argv.find(a => a.startsWith('--html='))?.slice(7);
  await updateDirectory({ htmlPath });
}
