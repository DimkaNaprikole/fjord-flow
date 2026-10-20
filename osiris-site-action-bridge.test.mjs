import test from 'node:test';
import assert from 'node:assert/strict';
import {approachPoint,createSiteActionBridge} from './osiris/site-actions.mjs';

function fixture(extra={}) {
  const document={hidden:false}, target={isConnected:true,getBoundingClientRect:()=>({left:400,right:480,top:100,bottom:140,width:80,height:40})};
  const moves=[], timers=new Map(); let count=0, next=0;
  const bridge=createSiteActionBridge({
    document,viewport:()=>({width:900,height:600}),reducedMotion:()=>false,
    getPresence:()=>({snapshot:()=>({position:{width:100,height:80,x:200,y:120}}),moveTo:(point,options)=>new Promise(resolve=>moves.push({point,...options,resolve}))}),
    setTimer:(fn,ms)=>{timers.set(++next,{fn,ms});return next},clearTimer:id=>timers.delete(id),...extra,
  });
  const run=(options={})=>bridge.perform({kind:'section',id:'journeys',target,commit:()=>{count++},...options});
  return {bridge,document,target,moves,timers,run,count:()=>count};
}
const tick=()=>Promise.resolve();
test('approach stays beside the control and commits once after arrival',async()=>{
  const f=fixture(), pending=f.run();await tick();assert.equal(f.count(),0);assert.deepEqual(f.moves[0].point,{x:338,y:120});
  f.moves[0].resolve(true);assert.equal((await pending).status,'completed');assert.equal(f.count(),1);assert.equal(f.moves[0].signal.aborted,true);assert.equal(f.timers.size,0);
});
test('three second cap aborts animation but still executes the current authorized handler',async()=>{
  const f=fixture(),pending=f.run();await tick();const timer=[...f.timers.values()][0];assert.equal(timer.ms,3000);timer.fn();
  assert.equal((await pending).status,'completed');assert.equal(f.moves[0].signal.aborted,true);assert.equal(f.count(),1);f.moves[0].resolve(true);await tick();assert.equal(f.count(),1);
});
test('new command cancels the older route and its late completion cannot commit',async()=>{
  const f=fixture(),old=f.run();await tick();const newer=f.run();await tick();
  assert.equal((await old).status,'cancelled');assert.equal(f.moves[0].signal.aborted,true);f.moves[0].resolve(true);f.moves[1].resolve(true);
  assert.equal((await newer).status,'completed');assert.equal(f.count(),1);
});
test('close/stop cancellation and external abort cannot execute the pending action',async()=>{
  for(const external of [false,true]){const f=fixture(),controller=new AbortController(),pending=f.run({signal:controller.signal});await tick();if(external)controller.abort();else f.bridge.cancel();assert.equal((await pending).status,'cancelled');assert.equal(f.count(),0);assert.equal(f.moves[0].signal.aborted,true);}
});
test('hidden document, disconnected target and revoked catalogue trust are checked at commit',async()=>{
  for(const changed of ['hidden','removed','untrusted']) {
    const f=fixture();let trusted=true;
    const pending=f.run(changed==='untrusted'?{kind:'place',id:'lofoten',isTrusted:()=>trusted}:{});await tick();
    if(changed==='hidden')f.document.hidden=true;if(changed==='removed')f.target.isConnected=false;if(changed==='untrusted')trusted=false;
    f.moves[0].resolve(true);assert.notEqual((await pending).status,'completed');assert.equal(f.count(),0);
  }
});
test('reduced motion, unavailable pet and unreachable route fall back to ordinary navigation',async()=>{
  for(const extra of [{reducedMotion:()=>true},{getPresence:()=>null},{getPresence:()=>({snapshot:()=>({position:{width:100,height:80,x:200}}),moveTo:async()=>false})}]) {
    const f=fixture(extra);assert.equal((await f.run()).status,'completed');assert.equal(f.count(),1);
  }
});
test('unknown section, arbitrary place and unsolicited generic click are unavailable',async()=>{
  const f=fixture();for(const options of [{id:'payment'},{kind:'place',id:'outside'},{kind:'click',id:'journeys'}])assert.equal((await f.run(options)).status,'unavailable');assert.equal(f.count(),0);
});
test('a control too wide/offscreen never produces a point inside the control',()=>{
  const position={width:100,height:80,x:200},viewport={width:900,height:600};
  assert.equal(approachPoint({getBoundingClientRect:()=>({left:0,right:900,top:100,bottom:140,width:900,height:40})},position,viewport),null);
  assert.equal(approachPoint({getBoundingClientRect:()=>({left:400,right:480,top:900,bottom:940,width:80,height:40})},position,viewport),null);
});
test('settings disable blocks initial actions and revokes an action awaiting arrival',async()=>{
  let allowed=false;const f=fixture({isAllowed:()=>allowed});
  assert.equal((await f.run()).status,'disabled');assert.equal(f.moves.length,0);
  allowed=true;const pending=f.run();await tick();allowed=false;f.bridge.cancel('disabled');
  assert.equal((await pending).status,'disabled');assert.equal(f.count(),0);
});

function contactFixture(extra={}) {
  const contacts=[];
  const f=fixture({getPresence:()=>({
    interactWith:(target,options)=>new Promise(resolve=>contacts.push({target,...options,resolve})),
    moveTo:()=>{throw Error('interactWith must take precedence')},
    snapshot:()=>{throw Error('interaction does not require a snapshot')},
  }),...extra});
  return {...f,contacts};
}
test('interaction targets the visual control and commits exactly once at contact, not on arrival',async()=>{
  const f=contactFixture(),visual={...f.target},pending=f.run({visualTarget:visual});await tick();
  const contact=f.contacts[0];assert.equal(contact.target,visual);assert.equal(f.count(),0);assert.equal([...f.timers.values()][0].ms,25000);
  assert.equal(contact.onContact(),true);assert.equal(f.count(),1);
  assert.equal(contact.onContact(),true);assert.equal(f.count(),1,'Repeated callback does not repeat the handler');
  contact.resolve(true);assert.equal((await pending).status,'completed');assert.equal(f.count(),1);
  assert.equal(contact.signal.aborted,false,'Successful departure is owned by presence');
  assert.equal(contact.onContact(),false,'Late callbacks after completion are closed');assert.equal(f.timers.size,0);
});
test('interaction timeout aborts before ordinary commit and a late contact cannot double activate',async()=>{
  const f=contactFixture();let abortedAtCommit=false;
  const pending=f.run({commit:()=>{abortedAtCommit=f.contacts[0].signal.aborted}});await tick();
  [...f.timers.values()][0].fn();assert.equal((await pending).status,'completed');assert.equal(abortedAtCommit,true);
  assert.equal(f.contacts[0].onContact(),false);f.contacts[0].resolve(true);
});
test('superseding interaction or an explicit abort prevents the old contact from executing',async()=>{
  for(const mode of ['new','abort']){
    const f=contactFixture(),controller=new AbortController(),old=f.run({signal:controller.signal});await tick();
    let next;if(mode==='new'){next=f.run();await tick()}else controller.abort();
    assert.equal(f.contacts[0].onContact(),false);f.contacts[0].resolve(true);assert.equal((await old).status,'cancelled');assert.equal(f.count(),0);
    if(next){f.contacts[1].onContact();f.contacts[1].resolve(true);assert.equal((await next).status,'completed');assert.equal(f.count(),1)}
  }
});
test('contact rechecks settings, current request, connected target and catalogue trust',async()=>{
  for(const mode of ['settings','current','removed','disabled','trust']){
    let allowed=true,current=true,trusted=true;const f=contactFixture({isAllowed:()=>allowed});
    const pending=f.run({kind:'place',id:'lofoten',isTrusted:()=>trusted,isCurrent:()=>current});await tick();
    if(mode==='settings')allowed=false;if(mode==='current')current=false;if(mode==='removed')f.target.isConnected=false;if(mode==='disabled')f.target.disabled=true;if(mode==='trust')trusted=false;
    assert.equal(f.contacts[0].onContact(),false,mode);assert.equal(f.count(),0);f.contacts[0].resolve(false);
    assert.notEqual((await pending).status,'completed',mode);assert.equal(f.count(),0);
  }
});
test('failed contact handler is not retried by fallback or duplicate callbacks',async()=>{
  for(const throws of [false,true]){
    const f=contactFixture();let attempts=0;
    const pending=f.run({commit:()=>{attempts++;if(throws)throw Error('handler failed');return false}});await tick();
    assert.equal(f.contacts[0].onContact(),false);assert.equal(f.contacts[0].onContact(),false);f.contacts[0].resolve(false);
    assert.equal((await pending).status,throws?'failed':'unavailable');assert.equal(attempts,1);
  }
});
test('unavailable/rejected interaction falls back once; success without a contact is not trusted as a commit',async()=>{
  for(const outcome of [false,true,'throw']){
    const f=fixture({getPresence:()=>({interactWith:async()=>{if(outcome==='throw')throw Error('unavailable');return outcome}})});
    assert.equal((await f.run()).status,'completed');assert.equal(f.count(),1);
  }
});
test('reduced motion skips interaction and still executes the explicit action once',async()=>{
  const f=contactFixture({reducedMotion:()=>true});assert.equal((await f.run()).status,'completed');assert.equal(f.count(),1);assert.equal(f.contacts.length,0);
});
test('a delayed completion after contact cannot time out and abort the successful departure',async()=>{
  const f=contactFixture(),pending=f.run();await tick();f.contacts[0].onContact();[...f.timers.values()][0].fn();
  assert.equal((await pending).status,'completed');assert.equal(f.contacts[0].signal.aborted,false);assert.equal(f.count(),1);f.contacts[0].resolve(true);
});
