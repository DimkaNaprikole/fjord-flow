const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {mapMetResponse,metURL}=require('./explorer-weather.js');
const now=Date.parse('2026-10-19T08:25:00Z');
const sample=(time,symbol='fair_day',temperature=7.9)=>({time,data:{instant:{details:{air_temperature:temperature}},next_1_hours:{summary:{symbol_code:symbol}}}});
test('MET fallback uses recent model hour, never future, missing or old readings',()=>{
 const response={properties:{timeseries:[sample('2026-10-19T09:00:00Z','rain',30),sample('2026-10-19T08:00:00Z'),sample('2026-10-19T07:00:00Z')]}};
 assert.deepEqual(mapMetResponse(response,now),{temperature_2m:7.9,weather_code:1,is_day:1,time:Date.parse('2026-10-19T08:00:00Z')/1000});
 assert.equal(mapMetResponse({properties:{timeseries:[sample('2026-10-18T08:00:00Z')]}},now),null);
 assert.equal(mapMetResponse({properties:{timeseries:[sample('2026-10-19T08:00:00Z','fair_day',null)]}},now),null);
 assert.equal(mapMetResponse({properties:{timeseries:[]}},now),null);
 assert.equal(mapMetResponse({properties:{timeseries:[sample('2026-10-19T08:00:00Z','heavysnow_night')]}},now).is_day,0);
 assert.equal(mapMetResponse({properties:{timeseries:[sample('2026-10-19T08:00:00Z','rainshowersandthunder_day')]}},now).weather_code,95);
 assert.equal(new URL(metURL({latitude:60.39323934,longitude:5.324522342})).searchParams.get('lat'),'60.3932');
});
test('weather loads only onscreen selected places, not the full catalogue',()=>{
 const source=fs.readFileSync('explorer-weather.js','utf8');
 const code=source.slice(source.indexOf('function visiblePlaces(){'),source.indexOf('function apiURL('));
 const badge=(id,top)=>({resolve:()=>id,el:{parentElement:{closest:()=>null},getBoundingClientRect:()=>({width:200,height:90,top,bottom:top+90,left:30,right:230})}});
 const context={badges:[badge('bergen',100),badge('bergen',150),badge('trolltunga',1800)],places:[{id:'bergen'},{id:'trolltunga'},{id:'unused'}],innerHeight:900,innerWidth:1200};
 vm.createContext(context);vm.runInContext(code,context);
 assert.deepEqual(Array.from(context.visiblePlaces(),p=>p.id),['bergen']);
});
test('daily rate limit is respected; MET fallback retained with source and expiry',async()=>{
 const source=fs.readFileSync('explorer-weather.js','utf8');
 const code=source.slice(source.indexOf('function saveCurrent('),source.indexOf('try{openRetryAt=Number'));
 const calls=[],stored=[];
 const context={Date,TTL:600000,RETRY:120000,cache:{data:{},sources:{},until:{},fetched:{}},metFailures:{},openRetryAt:0,apiURL:()=> 'https://api.open-meteo.com/v1/forecast',metURL:()=> 'https://api.met.no/weatherapi/locationforecast/2.0/compact',mapMetResponse:()=>({temperature_2m:8,weather_code:1,is_day:1,time:Math.floor(Date.now()/1000)}),AbortSignal,console:{info(){}},localStorage:{setItem:(...args)=>stored.push(args)},KEY:'test',persistWeather(){},fetch:async url=>{calls.push(url);return url.includes('open-meteo')?{ok:false,status:429,json:async()=>({reason:'Daily API request limit exceeded. Please try again tomorrow.'})}:{ok:true,json:async()=>({}),headers:{get:()=>new Date(Date.now()+3600000).toUTCString()}}}};
 vm.createContext(context);vm.runInContext(code,context);
 await context.loadWeather([{id:'bergen'}]);
 assert.equal(context.cache.sources.bergen,'met-norway');assert.ok(context.cache.until.bergen>Date.now()+3500000);
 await context.loadWeather([{id:'bergen'}]);
 assert.equal(calls.length,2,'fresh cached point and provider cooldown prevent repeated requests');
 assert.ok(context.openRetryAt>Date.now());assert.ok(stored.length);
});
