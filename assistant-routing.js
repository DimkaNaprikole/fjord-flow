/* Directions links are built locally; no coordinates or journey times are invented. */
(()=>{'use strict';
const normalize=s=>String(s||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/ø/g,'o').replace(/æ/g,'ae').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const aliases={осло:'Oslo',берген:'Bergen',бергена:'Bergen',бергену:'Bergen',гран:'Gran',грана:'Gran',ставангер:'Stavanger',ставангера:'Stavanger',тронхейм:'Trondheim',тромсе:'Tromsø',тромсё:'Tromsø',флом:'Flåm',флома:'Flåm',лофотены:'Lofoten',лофотен:'Lofoten',гейрангер:'Geirangerfjord',гейрангерфьорд:'Geirangerfjord',тролльтунга:'Trolltunga',троллтунга:'Trolltunga',прекестулен:'Preikestolen',сеня:'Senja',рейне:'Reine',олесунн:'Ålesund',олесунд:'Ålesund',тролльстиген:'Trollstigen',троллстиген:'Trollstigen',лотефоссен:'Låtefossen',верингсфоссен:'Vøringsfossen',ворингсфоссен:'Vøringsfossen'};
Object.assign(aliases,{гране:'Gran',грану:'Gran',бергене:'Bergen'});
const canonical=s=>{const name=String(s).replace(/^(?:город(?:а|у|е)?|водопад(?:а|у)?|city of|the city of)\s+/iu,'');return aliases[normalize(name)]||name};
function clean(s){return String(s||'').replace(/[?!\.]+$/u,'').replace(/\s+(?:пожалуйста|будь ласка|please|на машине|на автомобиле|на автобусе|на поезде|поездом|автобусом|машиной|пешком|by car|by bus|by train|on foot|with public transport|med bil|med buss|til fots).*$/iu,'').trim()}
function parse(question){
 const q=String(question||'').trim();if(q.length>500||/[<>\n\r]|https?:|javascript:/iu.test(q))return null;
 if(!/(?:маршрут|доехать|добраться|дістатися|доїхати|directions|route|get to|rute|veien|rutt|vägen|vej)/iu.test(q))return null;
 let origin='',destination='';
 const reverse=q.match(/(?:доехать|добраться|доїхати|дістатися|маршрут|дорогу)\s+(?:до|в|к|у)\s+(.+?)\s+(?:из|от|з|від)\s+(.+)/iu);if(reverse){destination=clean(reverse[1]);origin=clean(reverse[2])}
 const pairs=[/\bfrom\s+(.+?)\s+to\s+(.+)/iu,/(?:^|\s)(?:из|от|з|від)\s+(.+?)\s+(?:до|в|к|у)\s+(.+)/iu,/(?:^|\s)(?:fra|från)\s+(.+?)\s+(?:til|till)\s+(.+)/iu];
 for(const p of origin?[]:pairs){const m=q.match(p);if(m){origin=clean(m[1]);destination=clean(m[2]);break}}
 if(!destination){const patterns=[/(?:доехать|добраться|доїхати|дістатися)\s+(?:до|в|к|у)\s+(.+)/iu,/(?:маршрут|дорогу)\s+(?:(?:до|в|к|у)\s+)?(.+)/iu,/(?:directions|route|way|get)\s+to\s+(.+)/iu,/(?:rute|veien|rutt|vägen|vej)\s+(?:til|till)\s+(.+)/iu];for(const p of patterns){const m=q.match(p);if(m){destination=clean(m[1]);break}}}
 if(!destination||destination.length>150||origin.length>150||/^(?:как|как-то|и |по |с |до |к |в |поездк|мне|нам|туда|там|here|there)/iu.test(destination))return null;
 if(/^(?:водопад(?:ам|ы|у|а)?|водоспад(?:ів|и)?|фьорды|фіорди|сауна|домики|waterfalls?|fjords?|sauna|the waterfalls)$/iu.test(destination))return null;
 const useCurrent=/^(?:меня|моего местоположения|my location|here|meg)$/iu.test(origin);if(useCurrent)origin='';
 const mode=/(?:пешком|пішки|on foot|walking|til fots)/iu.test(q)?'walking':/(?:обществен|потяг|поезд|автобус|public transport|transit|kollektiv|\bby (?:bus|train)\b|\bmed (?:buss?|tog|tåg)\b)/iu.test(q)?'transit':'driving';
 return {destination:canonical(destination),origin:origin?canonical(origin):'',mode,...(useCurrent?{useCurrent:true}:{})};
}
function originCommand(question){
 const q=String(question||'').trim();if(q.length>1500||/[<>]|https?:|javascript:/iu.test(q))return null;
 if(/^(?:сбрось(?:те)? (?:старт|точку отправления)|забудь(?:те)?(?:,)? откуда я еду|reset (?:start|origin)|forget (?:my )?origin|nullstill start|glem start|скинь старт|забудь звідки я їду|nollställ start|nulstil start)[.! ]*$/iu.test(q))return {clear:true};
 const parts=q.split(/[.!?\n\r]+\s*|,\s*(?=(?:хочу|покажи|посоветуй|подскажи|нуж|що|порадь|I\s+(?:want|would|need)|show|suggest|recommend)(?:\s|$))/iu),statement=parts.shift().trim(),remaining=parts.join('. ').trim();
 const match=statement.match(/^(?:(?:афоня[, ]+)?(?:запомни[, ]+)?(?:я |теперь |сейчас )*(?:еду|выезжаю|начинаю путь) из|(?:запомни[, ]+)?(?:мой старт|старт|точка отправления)[: ]+|(?:тепер |я )*їду з|(?:now )?(?:I am |I'm )?(?:leaving|starting|travelling|traveling|driving) from|(?:my )?start(?:ing point)?(?: is|:) ?|(?:nå )?(?:jeg )?(?:reiser|kjører) fra|start(?:punkt)?(?: er|:) ?|(?:jag )?åker från|(?:jeg )?kører fra)\s*(.+?)[.! ]*$/iu);
 const origin=match&&canonical(match[1].trim());
 if(!origin||origin.length>100||origin.split(/\s+/u).length>8||!/^[\p{L}\p{N}\s’'(),–-]+$/u.test(origin)||/(?:\s(?:до|в|к|to|til|till)\s)|(?:хочу|посовет|покажи|подскажи|маршрут|кафе|I want|recommend|suggest|please|route|cafe)/iu.test(origin))return null;
 return {origin,...(remaining?{question:remaining}:{})};
}
function createOriginMemory(storage,key){
 let origin='';try{const saved=storage?.getItem(key);if(typeof saved==='string'&&saved.length<=150&&!/[<>\n\r]/u.test(saved))origin=saved}catch{}
 const save=value=>{origin=value;try{if(value)storage?.setItem(key,value);else storage?.removeItem(key)}catch{}return origin};
 return {get:()=>origin,set:value=>save(String(value||'').slice(0,150)),clear:()=>save(''),apply:request=>{if(request.useCurrent)save('');else if(request.origin)save(request.origin);return {...request,origin:request.useCurrent?'':request.origin||origin}}};
}
function build(request,places=[]){
 const wanted=normalize(canonical(request.destination));
 const matches=places.filter(p=>p.showcase!==false&&[p.name,...String(p.name||'').split(/\s*&\s*/)].some(n=>normalize(n)===wanted));
 const place=matches.length===1?matches[0]:null;
 const url=new URL('https://www.google.com/maps/dir/');url.searchParams.set('api','1');url.searchParams.set('destination',place?.routeQuery||place?.routeLabel||request.destination);url.searchParams.set('travelmode',request.mode||'driving');if(request.origin)url.searchParams.set('origin',request.origin);
 return {url:url.href,name:place?.name||request.destination,placeId:place?.id||null,origin:request.origin||''};
}
window.FjordAssistantRouting={parse,build,originCommand,createOriginMemory};
})();
