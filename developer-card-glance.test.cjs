const {test}=require('node:test');const assert=require('node:assert/strict');const {freeSpots,pickCard}=require('./developer-card-glance.js');
test('positions stay within viewport and never cover information or controls',()=>{
 const viewport={width:1200,height:850},size={width:294,height:210},obstacles=[{left:0,top:0,right:1200,bottom:160},{left:30,top:180,right:690,bottom:840},{left:1080,top:720,right:1190,bottom:840}];
 const spots=freeSpots(viewport,size,obstacles);assert.ok(spots.length);
 for(const p of spots){assert.ok(p.left>=18&&p.right<=1182&&p.top>=100&&p.bottom<=832);for(const r of obstacles)assert.ok(!(p.left<r.right+14&&p.right>r.left-14&&p.top<r.bottom+14&&p.bottom>r.top-14));}
});
test('busy screens and small viewports produce no forced placement',()=>{
 assert.deepEqual(freeSpots({width:390,height:844},{width:280,height:210},[{left:0,top:0,right:390,bottom:844}]),[]);
 assert.deepEqual(freeSpots({width:270,height:500},{width:280,height:210},[]),[]);
});

test('only enabled cards can be picked, including an empty allowlist',()=>{
 const active=[{id:'one'},{id:'two'}];assert.equal(pickCard([],()=>0),null);assert.equal(pickCard(active,()=>0).id,'one');assert.equal(pickCard(active,()=>.99).id,'two');
});

test('relocation chooses a free region away from the old card',()=>{
 const old={left:600,top:400,right:820,bottom:550};const spots=freeSpots({width:1000,height:850},{width:220,height:150},[],old);assert.ok(spots.length);for(const p of spots)assert.ok(!(p.left<old.right+14&&p.right>old.left-14&&p.top<old.bottom+14&&p.bottom>old.top-14));
});
