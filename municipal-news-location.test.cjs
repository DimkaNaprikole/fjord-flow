const {test} = require('node:test');
const assert = require('node:assert/strict');
const {resolveMunicipality,createController,errorKey} = require('./municipal-news-location.js');
const point = {latitude:60.36677,longitude:10.5295};
test('uses administrative point lookup, preserves leading-zero municipality and omits credentials/referrer', async () => {
  const result = await resolveMunicipality(point, {fetch:async (url,options) => {
    const query = new URL(url);
    assert.equal(query.origin,'https://ws.geonorge.no');
    assert.equal(query.pathname,'/kommuneinfo/v1/punkt');
    assert.equal(query.searchParams.get('nord'),'60.36677');
    assert.equal(query.searchParams.get('ost'),'10.5295');
    assert.equal(query.searchParams.get('koordsys'),'4326');
    assert.equal(options.credentials,'omit'); assert.equal(options.referrerPolicy,'no-referrer');
    return {ok:true,json:async()=>({kommunenummer:'0301',kommunenavn:'Oslo'})};
  }});
  assert.deepEqual(result,{id:'0301',name:'Oslo'});
});
test('outside Norway, malformed results and network errors do not fabricate a local commune', async () => {
  await assert.rejects(resolveMunicipality(point,{fetch:async()=>({status:404})}),{code:'outside'});
  await assert.rejects(resolveMunicipality(point,{fetch:async()=>({ok:true,json:async()=>({kommunenummer:301,kommunenavn:'Oslo'})})}),{code:'network'});
  await assert.rejects(resolveMunicipality(point,{fetch:async()=>({ok:false,status:503})}),{code:'network'});
  await assert.rejects(resolveMunicipality({latitude:NaN,longitude:3},{fetch:()=>assert.fail('no request for invalid GPS')}),{code:'position'});
});
test('controller does nothing before user starts; success publishes municipality only', async () => {
  let calls = 0, selected;
  const controller = createController({locate:options=>{
    calls++; assert.equal(options.userInitiated,true);
    return {promise:Promise.resolve({coords:point})};
  },resolve:async()=>({id:'3446',name:'Gran'}),selected:result=>selected=result});
  assert.equal(calls,0); assert.equal(controller.state.busy,false);
  await controller.start(); assert.equal(calls,1);
  assert.deepEqual(selected,{id:'3446',name:'Gran'});
  assert.equal(controller.state.status,'found'); assert.equal(controller.state.busy,false);
  assert.equal('coords' in controller.state,false);
});
test('manual selection cancels pending GPS and stale results cannot overwrite it', async () => {
  let finish, cancelled = false;
  const controller = createController({locate:()=>({promise:new Promise(resolve=>finish=resolve),cancel:()=>cancelled=true}),resolve:()=>assert.fail('cancelled GPS is ignored'),selected:()=>assert.fail('no override')});
  const pending = controller.start(); controller.cancel();
  finish({coords:point}); await pending;
  assert.equal(cancelled,true); assert.equal(controller.state.status,'');
});
test('permission failure stays actionable and never queries Kartverket', async () => {
  const controller = createController({locate:()=>({promise:Promise.reject({code:1})}),resolve:()=>assert.fail('no GPS data')});
  await controller.start(); assert.equal(controller.state.status,'denied');
  assert.equal(controller.state.municipality,null);
  assert.equal(errorKey({code:3}),'timeout'); assert.equal(errorKey({code:2}),'position');
});
test('in-flight municipality request is aborted on manual selection; late response ignored', async () => {
  let signal, finish;
  const controller = createController({locate:()=>({promise:Promise.resolve({coords:point})}),resolve:(_,options)=>{
    signal=options.signal; return new Promise(resolve=>finish=resolve);
  },selected:()=>assert.fail('manual choice must win')});
  const pending=controller.start(); await Promise.resolve();
  controller.cancel(); assert.equal(signal.aborted,true);
  finish({id:'3446',name:'Gran'}); await pending;
  assert.equal(controller.state.municipality,null);
});
