/* Convert owner-reviewed CMS overlays into the existing public catalogue shape. */
const languages=['nb','en','uk','sv','da'];
const own=(o,key)=>Object.prototype.hasOwnProperty.call(o,key);
const local=(v,lang)=>typeof v==='string'?v:v?.[lang]||v?.nb||v?.en||'';
function sameText(a,b){return languages.every(lang=>local(a,lang)===local(b,lang));}
function record(base,place){
 const out={...base};for(const key of ['id','name','category','town','county','countyId','region','address','description','website','bookingUrl','source','checked'])if(own(place,key))out[key]=place[key];
 if(own(place,'lat'))out.latitude=place.lat;if(own(place,'lon'))out.longitude=place.lon;
 if(place.lat!==undefined&&(place.lat!==base.latitude||place.lon!==base.longitude)||place.address!==undefined&&place.address!==base.address){delete out.directionsUrl;delete out.routeQuery;delete out.coordinatePrecision;}
 if(own(place,'hours')){
  const old=base.hoursNote||base.openingHours?.publishedText;
  out.hoursNote=place.hours;
  if(!sameText(place.hours,old))out.openingHours={timeZone:'Europe/Oslo',verified:false,publishedText:place.hours,source:place.hoursSource||place.source||place.website||'',checked:place.checked||''};
 }
 if(own(place,'hoursSource'))out.openingHours={...out.openingHours,source:place.hoursSource};
 if(own(place,'season')){out.hoursNote={};for(const lang of languages)out.hoursNote[lang]=[local(place.hours??base.hoursNote,lang),local(place.season,lang)].filter(Boolean).join('\n');}
 if(own(place,'photos')){
  out.gallery=place.photos.map(photo=>({...photo,kind:photo.kind||(out.category==='cafe'?'facade':'grounds')}));
  const cover=out.gallery[0];out.image=cover?.src||'';out.photoAlt=cover?.alt||out.name;out.imageSource=cover?.source||'';out.photoCredit=cover?.credit||'';out.photoLicense=cover?.license||'';out.photoLicenseUrl=cover?.licenseUrl||'';out.photoCaption=[cover?.credit,cover?.license].filter(Boolean).join(' · ');
 }
 return out;
}
export function mergeCatalogue(baseRows,places=[]){
 const overrides=new Map(places.map(place=>[place.id,place])),merged=[];
 for(const base of baseRows){const place=overrides.get(base.id);overrides.delete(base.id);if(place?.enabled===false)continue;merged.push(place?record(base,place):base);}
 for(const place of overrides.values())if(place.enabled!==false)merged.push(record({},place));
 return merged;
}
