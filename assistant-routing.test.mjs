import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context={window:{},URL};
vm.runInNewContext(readFileSync(new URL('./assistant-routing.js',import.meta.url),'utf8'),context);
const {parse,build}=context.window.FjordAssistantRouting;
const places=JSON.parse(readFileSync(new URL('./demo-data/state.json',import.meta.url),'utf8')).destinations;
for(const question of ['Покажи мне маршрут до Осло','Как мне доехать до Осло?','Show directions to Oslo','Vis rute til Oslo','Visa rutt till Oslo','Vis vej til Oslo']){
 const route=build(parse(question),places),url=new URL(route.url);
 assert.equal(url.origin,'https://www.google.com');assert.equal(url.pathname,'/maps/dir/');assert.equal(url.searchParams.get('destination').toLowerCase(),'oslo');assert.equal(url.searchParams.has('origin'),false);
 assert.equal(route.placeId,null,'A hidden catalogue destination has no advertised place button');
}
const bergen=build(parse('Покажи маршрут из Грана в Берген'),places);
assert.equal(bergen.placeId,'bergen');assert.equal(new URL(bergen.url).searchParams.get('origin'),'Gran');
assert.ok(new URL(bergen.url).searchParams.get('destination').includes('Bergen'));
const cliff=build(parse('Как доехать до Trolltunga?'),places);
assert.equal(cliff.placeId,'trolltunga');assert.match(new URL(cliff.url).searchParams.get('destination'),/Skjeggedal|access|parking/i,'Route to a road access point, not a hiking summit');
const foreign=build(parse('Show route from Paris to Berlin'),places);
assert.equal(new URL(foreign.url).searchParams.get('origin'),'Paris');assert.equal(new URL(foreign.url).searchParams.get('destination'),'Berlin');assert.equal(foreign.placeId,null);
assert.equal(parse('Как добраться до Бергена пешком?').mode,'walking');
assert.equal(parse('Как доехать до Oslo на автобусе?').mode,'transit');
for(const q of ['Какие водопады красивые?','Покажи маршруты','маршрут и сауна','маршрут к водопадам','route to there','route to javascript:alert(1)','route to <script>'])assert.equal(parse(q),null,q);
const unknown=build(parse('Маршрут до Drammen'),places);assert.equal(unknown.placeId,null);assert.equal(new URL(unknown.url).searchParams.get('destination'),'Drammen');
console.log('PASS: multilingual directions, optional/explicit origin, known/hidden/unknown destinations, road access, travel modes and unsafe/generic input.');
