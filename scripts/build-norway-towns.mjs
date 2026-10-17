// Cache public Kartverket settlement names locally; no visitor location is sent.
import {writeFile} from 'node:fs/promises';
const source='https://ws.geonorge.no/stedsnavn/v1/sted?navneobjekttype=by&navneobjekttype=tettsted&utkoordsys=4258&treffPerSide=500';
const seen=new Map(); let page=1,total=Infinity,count=0;
while(count<total && page<=10){
  const response=await fetch(source+'&side='+page,{signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('Kartverket HTTP '+response.status);
  const value=await response.json();total=value.metadata.totaltAntallTreff;
  if(!Array.isArray(value.navn)||!value.navn.length)break;
  count+=value.navn.length;
  for(const row of value.navn){
    if(row.stedstatus!=='aktiv' || !['By','Tettsted'].includes(row.navneobjekttype))continue;
    const names=row.stedsnavn||[], preferred=names.find(n=>n.navnestatus==='hovednavn' && n['språk']==='Norsk' && n['skrivemåtestatus'].includes('prioritert'))||names.find(n=>n.navnestatus==='hovednavn'&&n['skrivemåtestatus'].includes('prioritert'))||names.find(n=>n.navnestatus==='hovednavn')||names.find(n=>n['språk']==='Norsk'&&n['skrivemåtestatus'].includes('prioritert'))||names.find(n=>n['skrivemåtestatus'].includes('prioritert'));
    const latitude=row.representasjonspunkt?.nord,longitude=row.representasjonspunkt?.['øst'];
    if(!preferred || !Number.isFinite(latitude)||!Number.isFinite(longitude))continue;
    seen.set(row.stedsnummer,{id:String(row.stedsnummer),name:preferred['skrivemåte'],municipality:row.kommuner?.map(m=>m.kommunenavn).join(' / ')||'',latitude,longitude,type:row.navneobjekttype});
  }
  page++;
}
if(seen.size<850)throw Error('Incomplete settlement download; keeping previous file');
const out={source,checked:'2026-10-17',attribution:'Stedsnavn © Kartverket / Sentralt stedsnavnregister (SSR)',attributionUrl:'https://www.kartverket.no/api-og-data/stedsnavndata',license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',modification:'Selected active town/settlement records, preferred names and representative points; duplicate place IDs removed.',towns:[...seen.values()].sort((a,b)=>a.id.localeCompare(b.id))};
await writeFile('norway-towns.json',JSON.stringify(out)+'\n');
console.log(JSON.stringify({settlements:seen.size,bytes:Buffer.byteLength(JSON.stringify(out)),pages:page-1}));
