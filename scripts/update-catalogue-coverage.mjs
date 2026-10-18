/* County/municipality assignment uses Kartverket, never nearest-town guessing. */
import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=async f=>JSON.parse(await readFile(new URL(f,root),'utf8'));
const rows=await read('norway-catalog.json');let cached={};try{cached=await read('catalog-counties.json');}catch{}
const out={};let cursor=0;
async function worker(){while(cursor<rows.length){const r=rows[cursor++];if(cached[r.id]?.coordinateKey===`${r.latitude},${r.longitude}`){out[r.id]=cached[r.id];continue;}const url=`https://api.kartverket.no/kommuneinfo/v1/punkt?nord=${r.latitude}&ost=${r.longitude}&koordsys=4258`,response=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('County HTTP '+response.status+' '+r.id);const d=await response.json();if(!d.fylkesnummer||!d.kommunenummer)throw Error('County missing '+r.id);out[r.id]={county:d.fylkesnavn,countyId:d.fylkesnummer,municipality:d.kommunenavn,municipalityId:d.kommunenummer,countySource:url,coordinateKey:`${r.latitude},${r.longitude}`};}}
await Promise.all(Array.from({length:4},worker));
await writeFile(new URL('catalog-counties.json',root),JSON.stringify(Object.fromEntries(Object.entries(out).sort()),null,2)+'\n');
const counties=[['03','Oslo'],['11','Rogaland'],['15','Møre og Romsdal'],['18','Nordland'],['31','Østfold'],['32','Akershus'],['33','Buskerud'],['34','Innlandet'],['39','Vestfold'],['40','Telemark'],['42','Agder'],['46','Vestland'],['50','Trøndelag'],['55','Troms'],['56','Finnmark']];
const coverage={checked:'2026-10-18',source:'https://www.kartverket.no/en/on-land/fakta-om-norge/norske-fylke-og-kommunar',total:rows.length,counties:counties.map(([id,name])=>{const matches=rows.filter(r=>out[r.id].countyId===id);return{id,name,total:matches.length,categories:Object.fromEntries(['cafe','cabin','sauna','rest'].map(k=>[k,matches.filter(r=>r.category===k).length])),ids:matches.map(r=>r.id)};})};
await writeFile(new URL('norway-coverage.json',root),JSON.stringify(coverage,null,2)+'\n');console.log(JSON.stringify(coverage.counties.map(c=>({name:c.name,total:c.total,...c.categories}))));
