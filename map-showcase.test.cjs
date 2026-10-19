const {test}=require('node:test');const assert=require('node:assert/strict');
const {createCycle,imageURL}=require('./map-showcase.js');
const rows=['cafe','cabin','sauna'].flatMap(category=>Array.from({length:4},(_,i)=>({id:category+i,category,image:'./images/'+category+i+'.jpg'})));
test('photos rotate within each category, then categories change in catalogue order',()=>{
 const c=createCycle(()=>rows);assert.equal(c.current().id,'cafe0');
 c.next();assert.equal(c.current().id,'cafe1');c.next();assert.equal(c.current().id,'cafe2');c.next();assert.equal(c.category,'cabin');assert.equal(c.current().id,'cabin0');
 for(let i=0;i<6;i++)c.next();assert.equal(c.category,'cafe');assert.equal(c.current().id,'cafe3','category cursor survives a full rotation');
});
test('manual category selection locks categories but keeps their own photos rotating',()=>{
 const c=createCycle(()=>rows);c.select('sauna');const ids=new Set();for(let i=0;i<12;i++){c.next();ids.add(c.current().id);assert.equal(c.category,'sauna');}assert.equal(ids.size,4);
 c.resume();for(let i=0;i<3;i++)c.next();assert.equal(c.category,'cafe');
});
test('empty categories are skipped and catalogue updates do not break selection',()=>{
 let data=rows.filter(p=>p.category==='sauna');const c=createCycle(()=>data);c.next();assert.equal(c.category,'sauna');data=[];assert.equal(c.next(),null);assert.equal(c.current(),null);
});
test('showcase accepts genuine photo formats and labels equipment using existing illustration',()=>{
 assert.equal(imageURL({image:{url:'images/shopping/granstunet.png'}}),'images/shopping/granstunet.png');assert.equal(imageURL({category:'equipment'}),'./images/bua-gear-illustration.webp');
 for(const image of ['javascript:alert(1)','images/../secret','https://user:pass@example.com/a.jpg','http://example.com/a.jpg'])assert.equal(imageURL({image}),null);
});
