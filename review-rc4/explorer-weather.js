/* Current model conditions for public destination coordinates. No visitor geolocation.
 * API and WMO codes: https://open-meteo.com/en/docs (checked 2026-10-16).
 */
(()=>{'use strict';
const TTL=10*60*1000,RETRY=2*60*1000,KEY='fjordflow.weather.public.v3';
const places=[
 {id:'bergen',name:'Bergen',latitude:60.39323,longitude:5.3245},
 {id:'geiranger',name:'Geiranger',latitude:62.10186,longitude:7.20719},
 // The hero photograph is Austnesfjorden, rather than the catalogue gateway at Reine.
 {id:'austnesfjord',name:'Austnesfjorden',latitude:68.314,longitude:14.718},
 {id:'naeroyfjord',name:'Nærøyfjord · Gudvangen',latitude:60.87773,longitude:6.83795},
 {id:'atlantic',name:'Atlanterhavsveien',latitude:63.02134,longitude:7.37525},
 {id:'alesund',name:'Ålesund',latitude:62.47226,longitude:6.1549},
 {id:'stegastein',name:'Stegastein',latitude:60.90836182,longitude:7.21279388},
 {id:'trollstigen',name:'Trollstigen',latitude:62.453301,longitude:7.663136},
 {id:'loen',name:'Loen',latitude:61.87151,longitude:6.8459}
];
const heroPlaces={'hero-bergen.jpg':'bergen','hero-floibanen.jpg':'bergen','hero-geiranger.jpg':'geiranger','hero-lofoten.jpg':'austnesfjord','hero-naeroyfjord.jpg':'naeroyfjord','hero-atlantic.jpg':'atlantic','hero-alesund.jpg':'alesund','hero-trollstigen.jpg':'trollstigen','hero-loen.jpg':'loen','hero-stegastein.jpg':'stegastein'};
const explorerPlaces=['austnesfjord','geiranger','bergen',null];
const words={
 en:{near:'Now nearby',loading:'Loading weather…',unavailable:'Weather unavailable',at:'Model time',fetched:'Retrieved',clear:'Clear',mostly:'Mainly clear',partial:'Partly cloudy',cloud:'Overcast',fog:'Fog',rime:'Freezing fog',drizzle:'Drizzle',denseDrizzle:'Heavy drizzle',freezingDrizzle:'Freezing drizzle',lightRain:'Light rain',rain:'Rain',heavyRain:'Heavy rain',freezingRain:'Freezing rain',lightSnow:'Light snow',snow:'Snow',heavySnow:'Heavy snow',grains:'Snow grains',showers:'Rain showers',heavyShowers:'Heavy rain showers',snowShowers:'Snow showers',thunder:'Thunderstorm',hail:'Thunderstorm with hail',unknown:'Condition unavailable'},
 nb:{near:'Været i området nå',loading:'Laster vær…',unavailable:'Været er utilgjengelig',at:'Modelltid',fetched:'Hentet',clear:'Klart',mostly:'Lettskyet',partial:'Delvis skyet',cloud:'Overskyet',fog:'Tåke',rime:'Rimtåke',drizzle:'Yr',denseDrizzle:'Kraftig yr',freezingDrizzle:'Underkjølt yr',lightRain:'Lett regn',rain:'Regn',heavyRain:'Kraftig regn',freezingRain:'Underkjølt regn',lightSnow:'Lett snø',snow:'Snø',heavySnow:'Kraftig snø',grains:'Kornsnø',showers:'Regnbyger',heavyShowers:'Kraftige regnbyger',snowShowers:'Snøbyger',thunder:'Tordenvær',hail:'Tordenvær med hagl',unknown:'Værtype utilgjengelig'},
 uk:{near:'Зараз поблизу',loading:'Завантаження погоди…',unavailable:'Погода недоступна',at:'Час моделі',fetched:'Отримано',clear:'Ясно',mostly:'Переважно ясно',partial:'Мінлива хмарність',cloud:'Хмарно',fog:'Туман',rime:'Туман із памороззю',drizzle:'Мряка',denseDrizzle:'Сильна мряка',freezingDrizzle:'Крижана мряка',lightRain:'Невеликий дощ',rain:'Дощ',heavyRain:'Сильний дощ',freezingRain:'Крижаний дощ',lightSnow:'Невеликий сніг',snow:'Сніг',heavySnow:'Сильний сніг',grains:'Снігові зерна',showers:'Короткочасний дощ',heavyShowers:'Сильні зливи',snowShowers:'Снігові заряди',thunder:'Гроза',hail:'Гроза з градом',unknown:'Тип погоди недоступний'},
 sv:{near:'Vädret i området nu',loading:'Hämtar väder…',unavailable:'Vädret är otillgängligt',at:'Modelltid',fetched:'Hämtat',clear:'Klart',mostly:'Mestadels klart',partial:'Delvis molnigt',cloud:'Mulet',fog:'Dimma',rime:'Underkyld dimma',drizzle:'Duggregn',denseDrizzle:'Kraftigt duggregn',freezingDrizzle:'Underkylt duggregn',lightRain:'Lätt regn',rain:'Regn',heavyRain:'Kraftigt regn',freezingRain:'Underkylt regn',lightSnow:'Lätt snöfall',snow:'Snöfall',heavySnow:'Kraftigt snöfall',grains:'Snökorn',showers:'Regnskurar',heavyShowers:'Kraftiga regnskurar',snowShowers:'Snöbyar',thunder:'Åska',hail:'Åska med hagel',unknown:'Vädertyp saknas'},
 da:{near:'Vejret i området nu',loading:'Henter vejr…',unavailable:'Vejret er utilgængeligt',at:'Modeltid',fetched:'Hentet',clear:'Klart',mostly:'Overvejende klart',partial:'Delvist skyet',cloud:'Overskyet',fog:'Tåge',rime:'Rimtåge',drizzle:'Støvregn',denseDrizzle:'Kraftig støvregn',freezingDrizzle:'Isslag fra støvregn',lightRain:'Let regn',rain:'Regn',heavyRain:'Kraftig regn',freezingRain:'Isslag fra regn',lightSnow:'Let sne',snow:'Sne',heavySnow:'Kraftig sne',grains:'Snekorn',showers:'Regnbyger',heavyShowers:'Kraftige regnbyger',snowShowers:'Snebyger',thunder:'Torden',hail:'Torden med hagl',unknown:'Vejrtype utilgængelig'}
};
const language=()=>Object.hasOwn(words,window.FjordI18n?.language)?window.FjordI18n.language:'nb';
const conditionKey=code=>{if(code===0)return'clear';if(code===1)return'mostly';if(code===2)return'partial';if(code===3)return'cloud';if(code===45)return'fog';if(code===48)return'rime';if([51,53].includes(code))return'drizzle';if(code===55)return'denseDrizzle';if([56,57].includes(code))return'freezingDrizzle';if(code===61)return'lightRain';if(code===63)return'rain';if(code===65)return'heavyRain';if([66,67].includes(code))return'freezingRain';if(code===71)return'lightSnow';if(code===73)return'snow';if(code===75)return'heavySnow';if(code===77)return'grains';if([80,81].includes(code))return'showers';if(code===82)return'heavyShowers';if([85,86].includes(code))return'snowShowers';if([95,97].includes(code))return'thunder';if([96,99].includes(code))return'hail';return'unknown'};
function distance(a,b){const r=Math.PI/180,dlat=(a.latitude-b.latitude)*r,dlon=(a.longitude-b.longitude)*r,x=Math.sin(dlat/2)**2+Math.cos(a.latitude*r)*Math.cos(b.latitude*r)*Math.sin(dlon/2)**2;return 12742*Math.asin(Math.min(1,Math.sqrt(x)))}
function validCurrent(value){return value&&Number.isFinite(value.temperature_2m)&&value.temperature_2m>=-90&&value.temperature_2m<=65&&Number.isInteger(value.weather_code)&&[0,1].includes(value.is_day)&&Number.isFinite(value.time)&&value.time>0}
// Match returned grid coordinates, not array positions: reordered API results cannot swap places.
function mapResponse(payload,requested=places){const rows=(Array.isArray(payload)?payload:[payload]).filter(row=>Number.isFinite(row?.latitude)&&Number.isFinite(row?.longitude)&&validCurrent(row.current)),out={};for(const place of requested){const candidates=rows.map(row=>({row,gap:distance(place,row)})).filter(p=>p.gap<=25).sort((a,b)=>a.gap-b.gap||a.row.latitude-b.row.latitude||a.row.longitude-b.row.longitude||b.row.current.time-a.row.current.time||a.row.current.temperature_2m-b.row.current.temperature_2m||a.row.current.weather_code-b.row.current.weather_code);if(candidates.length)out[place.id]={...candidates[0].row.current}}return out}
// MET Norway is an independent fallback for temporary Open-Meteo failures.
// Low-volume simple CORS requests identify this site via the browser Origin header.
// https://api.met.no/doc/TermsOfService — coordinates <= 4 decimals, respect Expires.
function metURL(place){const url=new URL('https://api.met.no/weatherapi/locationforecast/2.0/compact');url.search=new URLSearchParams({lat:place.latitude.toFixed(4),lon:place.longitude.toFixed(4)});return url.href}
function mapMetResponse(payload,now=Date.now()){
 const rows=payload?.properties?.timeseries;
 if(!Array.isArray(rows))return null;
 const point=rows.filter(p=>Number.isFinite(Date.parse(p.time))&&Date.parse(p.time)<=now&&now-Date.parse(p.time)<90*60*1000).sort((a,b)=>Date.parse(b.time)-Date.parse(a.time))[0];
 if(!point)return null;
 const details=point.data?.instant?.details,symbol=point.data?.next_1_hours?.summary?.symbol_code||'',base=symbol.replace(/_(day|night|polartwilight)$/,'');
 const codes={clearsky:0,fair:1,partlycloudy:2,cloudy:3,fog:45,lightrain:61,rain:63,heavyrain:65,lightsnow:71,snow:73,heavysnow:75,lightrainshowers:80,rainshowers:80,heavyrainshowers:82,lightsnowshowers:85,snowshowers:85,heavysnowshowers:86,lightsleet:68,sleet:68,heavysleet:69,lightsleetshowers:83,sleetshowers:83,heavysleetshowers:84};
 const code=base.includes('thunder')?95:(codes[base]??-1);
 const current={temperature_2m:details?.air_temperature,weather_code:code,is_day:symbol.endsWith('_night')?0:1,time:Date.parse(point.time)/1000};
 return validCurrent(current)?current:null;
}
if(typeof module!=='undefined'&&module.exports){module.exports={mapMetResponse,mapResponse,metURL,conditionKey,validCurrent};return;}
let cache={at:0,data:{},until:{},sources:{},fetched:{}},pending=null,failedAt=0,openRetryAt=0;
const metFailures={};
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved?.data&&saved.until&&saved.sources&&saved.fetched&&Object.values(saved.data).every(validCurrent))cache=saved}catch{}
function persistWeather(){try{localStorage.setItem(KEY,JSON.stringify(cache))}catch{}}
function addPlaces(items){for(const place of items||[]){if(typeof place?.id!=='string'||typeof place.name!=='string'||!Number.isFinite(place.latitude)||!Number.isFinite(place.longitude)||Math.abs(place.latitude)>90||Math.abs(place.longitude)>180)continue;const saved=places.find(p=>p.id===place.id);if(saved){if(saved.latitude!==place.latitude||saved.longitude!==place.longitude)delete cache.until[place.id];Object.assign(saved,{name:place.name,latitude:place.latitude,longitude:place.longitude})}else places.push({id:place.id,name:place.name,latitude:place.latitude,longitude:place.longitude})}}
const catalogueReady=(async()=>{try{const state=typeof data!=='undefined'&&Array.isArray(data?.destinations)?data:await fetch('./api/state').then(r=>{if(!r.ok)throw Error('Weather catalogue unavailable');return r.json()});addPlaces(state.destinations)}catch{/* Hero locations remain available if the catalogue cannot load. */}})();
function visiblePlaces(){const ids=new Set(badges.filter(({el})=>{const host=el.parentElement;if(!host||host.closest('[hidden]'))return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth}).map(({resolve})=>resolve()));return places.filter(p=>ids.has(p.id))}
function apiURL(requested=visiblePlaces()){const url=new URL('https://api.open-meteo.com/v1/forecast');url.search=new URLSearchParams({latitude:requested.map(p=>p.latitude).join(','),longitude:requested.map(p=>p.longitude).join(','),current:'temperature_2m,weather_code,is_day',timezone:'Europe/Oslo',timeformat:'unixtime',forecast_days:'1'}).toString();return url.href}
function saveCurrent(id,current,source,expires){cache.data[id]=current;cache.sources[id]=source;cache.until[id]=expires;cache.fetched[id]=cache.at=Date.now();delete metFailures[id]}
async function loadWeather(requested){
 if(Date.now()>=openRetryAt){try{
  const r=await fetch(apiURL(requested),{credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(12000)});
  if(!r.ok){let reason='';try{reason=(await r.json()).reason||''}catch{};if(r.status===429){const now=new Date();openRetryAt=/daily/i.test(reason)?Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+1):Date.now()+60*60*1000;try{localStorage.setItem(KEY+'.openRetryAt',String(openRetryAt))}catch{}}throw Error('Weather HTTP '+r.status)}
  const result=mapResponse(await r.json(),requested);for(const [id,current]of Object.entries(result))saveCurrent(id,current,'open-meteo',Date.now()+TTL);
 }catch(error){openRetryAt=Math.max(openRetryAt,Date.now()+TTL);console.info('FJORD / FLOW weather source fallback:',error.message)}}
 for(const place of requested.filter(p=>!(cache.until[p.id]>Date.now())&&!(metFailures[p.id]>Date.now()))){try{
  const response=await fetch(metURL(place),{credentials:'omit',signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('MET Norway HTTP '+response.status);
  const current=mapMetResponse(await response.json());if(!current)throw Error('No recent MET Norway model data');
  saveCurrent(place.id,current,'met-norway',Math.max(Date.now()+30*60*1000,Date.parse(response.headers.get('Expires'))||0));
 }catch(error){metFailures[place.id]=Date.now()+RETRY;console.info('FJORD / FLOW weather unavailable:',error.message)}}
 persistWeather();
}
try{openRetryAt=Number(localStorage.getItem(KEY+'.openRetryAt'))||0}catch{}
async function refresh(){await catalogueReady;if(!weatherVisible()||pending)return pending;const requested=visiblePlaces().filter(p=>!(cache.until[p.id]>Date.now())&&!(metFailures[p.id]>Date.now()));if(!requested.length)return;pending=(async()=>{await Promise.resolve();try{await loadWeather(requested);failedAt=requested.some(p=>!(cache.until[p.id]>Date.now()))?Date.now():0}finally{pending=null;renderAll()}})();renderAll();return pending}
function icon(code,day){const key=conditionKey(code);if(key==='clear')return day?'☀️':'🌙';if(key==='mostly')return day?'🌤️':'🌙';if(key==='partial')return day?'⛅':'☁️';if(key==='cloud')return'☁️';if(['fog','rime'].includes(key))return'🌫️';if(['thunder','hail'].includes(key))return'⛈️';if(['lightSnow','snow','heavySnow','grains','snowShowers'].includes(key))return'🌨️';if(key==='unknown')return'—';return'🌧️'}
const badges=[];
function weatherVisible(){return !document.hidden&&badges.some(({el})=>{const host=el.parentElement;if(!host||host.closest('[hidden]'))return false;const rect=host.getBoundingClientRect();return rect.width>0&&rect.height>0;});}
function makeBadge(host,kind,resolve){if(!host)return;const el=document.createElement('aside');el.className='explorer-weather explorer-weather--'+kind;el.dataset.i18nIgnore='';el.setAttribute('aria-live','off');el.hidden=true;host.append(el);badges.push({el,resolve})}
function renderBadge({el,resolve}){const id=resolve(),place=places.find(p=>p.id===id);el.hidden=!place;if(!place)return;const lang=language(),w=words[lang],fresh=cache.until[id]>Date.now(),current=fresh?cache.data[id]:null;el.replaceChildren();const eyebrow=document.createElement('span');eyebrow.className='explorer-weather-label';eyebrow.textContent=w.near;const row=document.createElement('div');row.className='explorer-weather-row';const symbol=document.createElement('span');symbol.className='explorer-weather-icon';symbol.setAttribute('aria-hidden','true');symbol.textContent=current?icon(current.weather_code,current.is_day):'◌';const body=document.createElement('div'),name=document.createElement('strong');name.className='explorer-weather-place';name.textContent=place.name;const line=document.createElement('span');line.className='explorer-weather-condition';if(current){const locale={nb:'nb-NO',en:'en-GB',uk:'uk-UA',sv:'sv-SE',da:'da-DK'}[lang],temp=new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(current.temperature_2m),time=new Intl.DateTimeFormat(locale,{timeZone:'Europe/Oslo',dateStyle:'medium',timeStyle:'short'});line.textContent=temp+' °C · '+w[conditionKey(current.weather_code)];el.title=w.at+': '+time.format(new Date(current.time*1000))+' (Europe/Oslo) · '+w.fetched+': '+time.format(new Date(cache.fetched[id]))}else{line.textContent=pending||(!failedAt&&!fresh)?w.loading:w.unavailable;el.removeAttribute('title')}body.append(name,line);row.append(symbol,body);const credit=document.createElement('a');credit.className='explorer-weather-credit';credit.href=current&&cache.sources[id]==='met-norway'?'https://api.met.no/doc/License':'https://open-meteo.com/';credit.target='_blank';credit.rel='noopener noreferrer';credit.textContent=current&&cache.sources[id]==='met-norway'?'MET Norway · CC BY 4.0 ↗':'Open-Meteo ↗';el.append(eyebrow,row,credit)}
function renderAll(){badges.forEach(renderBadge)}
const hero=document.getElementById('heroScenery'),about=document.getElementById('about');
if(hero){makeBadge(hero.closest('.hero')||hero.parentElement,'hero',()=>{const filename=(hero.dataset.currentImage||'').split('/').pop()?.split('?')[0];return heroPlaces[filename]||null});new MutationObserver(()=>{renderAll();refresh()}).observe(hero,{attributes:true,attributeFilter:['data-current-image','data-current-place']})}
if(about){const frame=about.querySelector('.explorer-frame');makeBadge(frame,'navigator',()=>{const index=Number(about.dataset.selected||0);if(Number(about.dataset.photo)!==index)return null;return index===0?(about.dataset.currentPlaceId||'austnesfjord'):explorerPlaces[index]||null});new MutationObserver(()=>{renderAll();refresh()}).observe(about,{attributes:true,attributeFilter:['data-selected','data-photo','data-current-place-id','data-current-image']})}
window.addEventListener('fjordexplorerchange',()=>{renderAll();refresh()});window.addEventListener('fjordexplorerphoto',event=>{if(event.detail?.place)addPlaces([event.detail.place]);renderAll();refresh()});window.addEventListener('fjordlanguagechange',renderAll);
const resumeWeather=()=>{if(weatherVisible()){renderAll();refresh()}};
document.addEventListener('visibilitychange',resumeWeather);
window.addEventListener('fjord:sections-changed',resumeWeather);
let scrollWeather;window.addEventListener('scroll',()=>{clearTimeout(scrollWeather);scrollWeather=setTimeout(resumeWeather,250)},{passive:true});
setInterval(()=>{if(!document.hidden)refresh()},60*1000);
// Small public inspection surface also makes coordinate/code mapping independently testable.
window.FjordExplorerWeather={attach(host,resolve,items){addPlaces(items);makeBadge(host,'scene',resolve);const badge=badges[badges.length-1];renderBadge(badge);refresh();return {update(){renderBadge(badge);refresh();},dispose(){const i=badges.indexOf(badge);if(i>=0)badges.splice(i,1);badge.el.remove();}};},refresh,mapResponse,conditionKey,apiURL,get places(){return places.map(p=>({...p}))}};
renderAll();if(badges.length)refresh();
})();
