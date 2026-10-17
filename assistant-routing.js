/* Directions links are built locally; no coordinates or journey times are invented. */
(()=>{'use strict';
const normalize=s=>String(s||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/ø/g,'o').replace(/æ/g,'ae').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const aliases={осло:'Oslo',берген:'Bergen',бергена:'Bergen',бергену:'Bergen',гран:'Gran',грана:'Gran',ставангер:'Stavanger',ставангера:'Stavanger',тронхейм:'Trondheim',тромсе:'Tromsø',тромсё:'Tromsø',флом:'Flåm',флома:'Flåm',лофотены:'Lofoten',лофотен:'Lofoten',гейрангер:'Geirangerfjord',гейрангерфьорд:'Geirangerfjord',тролльтунга:'Trolltunga',троллтунга:'Trolltunga',прекестулен:'Preikestolen',сеня:'Senja',рейне:'Reine',олесунн:'Ålesund',олесунд:'Ålesund',тролльстиген:'Trollstigen',троллстиген:'Trollstigen',лотефоссен:'Låtefossen',верингсфоссен:'Vøringsfossen',ворингсфоссен:'Vøringsfossen'};
const canonical=s=>{const name=String(s).replace(/^(?:город(?:а|у|е)?|водопад(?:а|у)?|city of|the city of)\s+/iu,'');return aliases[normalize(name)]||name};
function clean(s){return String(s||'').replace(/[?!\.]+$/u,'').replace(/\s+(?:пожалуйста|будь ласка|please|на машине|на автомобиле|на автобусе|на поезде|пешком|by car|by bus|by train|on foot|with public transport|med bil|med buss|til fots).*$/iu,'').trim()}
function parse(question){
 const q=String(question||'').trim();if(q.length>500||/[<>\n\r]|https?:|javascript:/iu.test(q))return null;
 if(!/(?:маршрут|доехать|добраться|дістатися|доїхати|directions|route|get to|rute|veien|rutt|vägen|vej)/iu.test(q))return null;
 let origin='',destination='';
 const pairs=[/\bfrom\s+(.+?)\s+to\s+(.+)/iu,/(?:^|\s)(?:из|от|з|від)\s+(.+?)\s+(?:до|в|к|у)\s+(.+)/iu,/(?:^|\s)(?:fra|från)\s+(.+?)\s+(?:til|till)\s+(.+)/iu];
 for(const p of pairs){const m=q.match(p);if(m){origin=clean(m[1]);destination=clean(m[2]);break}}
 if(!destination){const patterns=[/(?:доехать|добраться|доїхати|дістатися)\s+(?:до|в|к|у)\s+(.+)/iu,/(?:маршрут|дорогу)\s+(?:(?:до|в|к|у)\s+)?(.+)/iu,/(?:directions|route|way|get)\s+to\s+(.+)/iu,/(?:rute|veien|rutt|vägen|vej)\s+(?:til|till)\s+(.+)/iu];for(const p of patterns){const m=q.match(p);if(m){destination=clean(m[1]);break}}}
 if(!destination||destination.length>150||origin.length>150||/^(?:как|как-то|и |по |с |до |к |в |поездк|мне|нам|туда|там|here|there)/iu.test(destination))return null;
 if(/^(?:водопад(?:ам|ы|у|а)?|водоспад(?:ів|и)?|фьорды|фіорди|сауна|домики|waterfalls?|fjords?|sauna|the waterfalls)$/iu.test(destination))return null;
 if(/^(?:меня|моего местоположения|my location|here|meg)$/iu.test(origin))origin='';
 const mode=/(?:пешком|пішки|on foot|walking|til fots)/iu.test(q)?'walking':/(?:обществен|потяг|поезд|автобус|public transport|transit|kollektiv)/iu.test(q)?'transit':'driving';
 return {destination:canonical(destination),origin:origin?canonical(origin):'',mode};
}
function build(request,places=[]){
 const wanted=normalize(canonical(request.destination));
 const matches=places.filter(p=>p.showcase!==false&&[p.name,...String(p.name||'').split(/\s*&\s*/)].some(n=>normalize(n)===wanted));
 const place=matches.length===1?matches[0]:null;
 const url=new URL('https://www.google.com/maps/dir/');url.searchParams.set('api','1');url.searchParams.set('destination',place?.routeQuery||place?.routeLabel||request.destination);url.searchParams.set('travelmode',request.mode||'driving');if(request.origin)url.searchParams.set('origin',request.origin);
 return {url:url.href,name:place?.name||request.destination,placeId:place?.id||null,origin:request.origin||''};
}
window.FjordAssistantRouting={parse,build};
})();
