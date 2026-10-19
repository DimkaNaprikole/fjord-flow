const {test}=require('node:test'),assert=require('node:assert/strict');
const {upcomingItems,osloDate}=require('./municipal-news.js');
const row=(id,eventDate,extra={})=>({id,municipality:'3446',category:'events',published:'2026-09-01',eventDate,...extra});
test('two-week agenda uses event date, not announcement date, and stays ordered',()=>{
 const now=Date.parse('2026-10-19T10:00:00Z');const rows=[row('later','2026-10-30'),row('tomorrow','2026-10-20'),row('past','2026-10-18'),row('last','2026-11-01'),row('outside','2026-11-02')];
 assert.deepEqual(upcomingItems(rows,'3446',now).map(x=>x.id),['tomorrow','later','last']);
});
test('multi-day notices stay until their last relevant date, never replace another commune',()=>{
 const now=Date.parse('2026-10-19T10:00:00Z');
 const rows=[row('multi',null,{category:'notice',eventDates:['2026-10-18','2026-10-21']}),row('wrong','2026-10-20',{municipality:'3234'}),row('cancelled','2026-10-20',{cancelled:true}),row('expired','2026-10-20',{expires:'2026-10-18T23:00:00Z'}),row('futurepost','2026-10-20',{published:'2026-10-21'})];
 assert.deepEqual(upcomingItems(rows,'3446',now).map(x=>x.id),['multi']);
});
test('Oslo calendar day determines the agenda even just after Norwegian midnight',()=>{
 const now=Date.parse('2026-10-18T22:30:00Z');assert.equal(osloDate(now),'2026-10-19');
 assert.deepEqual(upcomingItems([row('yesterday','2026-10-18'),row('today','2026-10-19')],'3446',now).map(x=>x.id),['today']);
});

test('regional announcements are included only for explicitly related municipalities',()=>{
 const now=Date.parse('2026-10-19T10:00:00Z');
 const rows=[row('regional','2026-10-26',{relatedMunicipalities:['3234','3236']})];
 assert.equal(upcomingItems(rows,'3234',now).length,1);assert.equal(upcomingItems(rows,'0301',now).length,0);
});


test('local editorial announcements keep source publication unknown and show actual event dates',()=>{
 const {publicationLabel}=require('./municipal-news.js');const data=require('./municipal-news-data.json');
 const now=Date.parse('2026-10-19T10:00:00Z');
 for(const id of ['lysfest-glassverk-2026','halloween-jevnaker-2026']){
  const item=data.items.find(x=>x.id===id);assert.ok(item);assert.equal(item.publishedKind,'editorial');assert.equal(item.sourcePublished,null);
  assert.equal(publicationLabel(item,'uk'),'Додано до Fjord Flow');assert.ok(upcomingItems(data.items,'3236',now).includes(item));assert.ok(!upcomingItems(data.items,'0301',now).includes(item));
  for(const l of ['nb','en','uk','sv','da'])assert.ok(item.copy[l][1]&&item.details[l].length);
 }
 assert.equal(publicationLabel(data.items[0],'en'),'Published');
 assert.equal(upcomingItems(data.items,'3236',Date.parse('2026-10-31T12:00:00Z')).some(x=>x.id==='halloween-jevnaker-2026'),false);
});
