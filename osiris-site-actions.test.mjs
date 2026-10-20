import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
import {createSiteActionBridge} from './osiris/site-actions.mjs';

const [source,directionsSource,fixtureSource,catalog]=await Promise.all(['chat-widget.js','assistant-routing.js','chat-widget.test.mjs','demo-data/state.json'].map(file=>readFile(new URL(file,import.meta.url),'utf8')));
// Git may check out CRLF on Windows; normalize fixture boundaries, not app code.
const normalizedFixture=fixtureSource.replace(/\r\n/g,'\n');
const fixtureStart=normalizedFixture.indexOf('class Element {'),fixtureEnd=normalizedFixture.indexOf('\n{\n const a=boot({enabled:false})');
assert.ok(fixtureStart>=0&&fixtureEnd>fixtureStart,'Shared chat fixture boundaries must be present');
const fixture=normalizedFixture.slice(fixtureStart,fixtureEnd).replace("if(url.endsWith('/chat'))return","if(url.endsWith('/chat')&&config.deferIdentityReply)await new Promise(resolve=>voiceState.resolveIdentityReply=resolve);if(url.endsWith('/chat'))return");
const context={source,directionsSource,directionsCatalog:JSON.parse(catalog),vm,URL,Blob,FormData,AbortController,setTimeout,clearTimeout,setInterval,clearInterval,setImmediate};
vm.runInNewContext(fixture+'\nthis.fixtureApi={boot,flush};',context);
const {boot,flush}=context.fixtureApi;
async function start(){
 const app=boot({enabled:true,endpoint:'https://chat.example.test',voiceConversation:true,nativeVoiceAudio:true},true);await flush();
 for(const id of ['journeys','norwayWebcams'])app.sections[id]=app.document.createElement('section');
 app.revealed=[];app.browserWindow.FjordTabs={reveal:target=>app.revealed.push(target)};
 app.browserWindow.emit('fjord:open-chat');app.find('fjord-ai-input-mode').value='conversation';await app.find('fjord-ai-record-fallback').emit('click');await flush();
 app.voiceState.peer.ontrack({streams:[{getTracks:()=>[{stop(){}}]}]});await flush();return app;
}
async function heard(app,text,id='q1',language='ru'){
 const channel=app.voiceState.peer.channel;channel.message({type:'input_audio_buffer.speech_stopped'});channel.message({type:'conversation.item.input_audio_transcription.completed',item_id:id,transcript:text,language});await flush();return channel;
}
function finish(app,id='r1'){
 const channel=app.voiceState.peer.channel;channel.message({type:'response.created',response:{id}});channel.message({type:'output_audio_buffer.started',response_id:id});channel.message({type:'response.done',response:{id,status:'completed'}});channel.message({type:'output_audio_buffer.stopped',response_id:id});
}
const actions=app=>app.find('osiris-voice-actions').children;
const route=app=>new URL(actions(app).find(item=>item.tag==='a').href);

test('voice opens actual Tourism/Webcams pages without closing microphone or generating a second answer',async()=>{
 for(const [question,id] of [['Открой туризм','journeys'],['Покажи видеокамеры','norwayWebcams']]){
  const app=await start(),channel=await heard(app,question);assert.equal(app.revealed.at(-1),app.sections[id]);assert.equal(actions(app)[0].attrs['aria-controls'],id);assert.equal(app.dialog.open,true);assert.equal(app.voiceState.track.readyState,'live');assert.equal(app.voiceState.peer.closed,undefined);
  assert.equal(app.calls.filter(call=>/\/(chat|skill-match)$/.test(call.url)).length,0);const reply=channel.sent.filter(event=>event.type==='response.create');assert.equal(reply.length,1);assert.equal(reply[0].response.conversation,'none','Only approved local text is read aloud');assert.ok(channel.sent.some(event=>event.type==='conversation.item.create'&&event.item.role==='assistant'));
  actions(app)[0].onclick();assert.equal(app.dialog.open,true);finish(app);assert.equal(app.voiceState.track.enabled,true);app.dialog.close();
 }
});

test('camera information supplies a real page action; subsequent unrelated question clears it and keeps session instructions',async()=>{
 const app=await start();await heard(app,'Какие веб-камеры здесь есть?');assert.equal(app.revealed.length,0);assert.equal(actions(app)[0].attrs['aria-controls'],'norwayWebcams');finish(app);
 const channel=await heard(app,'Что ты думаешь о сегодняшней погоде?','q2');assert.equal(actions(app).length,0);const request=channel.sent.filter(event=>event.type==='response.create').at(-1);assert.deepEqual(Object.keys(request),['type'],'No response instructions replace server identity/site knowledge');assert.equal(app.calls.filter(call=>call.url.endsWith('/skill-match')).length,1);app.dialog.close();
});

test('route Oslo asks for actual start, accepts next spoken Gran and preserves the conversation',async()=>{
 const app=await start();await heard(app,'Построй маршрут до Осло');assert.equal(route(app).searchParams.get('destination'),'Oslo');assert.equal(route(app).searchParams.has('origin'),false);assert.ok(app.find('fjord-ai-log').children.some(item=>item.textContent?.includes('Откуда вы поедете')));finish(app);
 await heard(app,'Из Грана','q2');assert.equal(route(app).searchParams.get('origin'),'Gran');assert.equal(route(app).searchParams.get('destination'),'Oslo');assert.equal(actions(app).filter(item=>item.tag==='a').length,1,'Previous route is replaced');finish(app);assert.equal(app.voiceState.track.enabled,true);assert.equal(app.calls.filter(call=>call.url.includes('/live-session')).length,1);app.dialog.close();
});

test('voice directions use reviewed catalogue access point and supplied transit mode, never invented coordinates',async()=>{
 const app=await start();await heard(app,'Маршрут из Грана до Тролльтунги');
 // The inflected unsupported destination is not guessed into a catalogue record.
 assert.equal(route(app).searchParams.get('origin'),'Gran');finish(app);
 await heard(app,'route from Gran to Trolltunga by bus','q2','en');const place=JSON.parse(catalog).destinations.find(item=>item.name==='Trolltunga');assert.ok(place);assert.equal(route(app).searchParams.get('destination'),place.routeQuery||place.routeLabel||'Trolltunga');assert.equal(route(app).searchParams.get('travelmode'),'transit');app.dialog.close();
});

test('an available Gran day trip uses the same reviewed itinerary as text chat without ending voice',async()=>{
 const app=await start(),button=app.document.createElement('button');button.dataset={roadtrip:'hadeland'};app.document.querySelector=selector=>selector==='[data-roadtrip="hadeland"]'?button:null;app.browserWindow.FjordTripTools={localRoutes:{hadeland:{}}};
 await heard(app,'Я еду из Грана. Хочу поездку на один день рядом');assert.equal(app.calls.filter(call=>call.url.endsWith('/skill-match')).length,0);assert.ok(app.find('fjord-ai-log').children.some(item=>item.textContent?.includes('Granavollen')));actions(app)[0].onclick();assert.equal(button.clicked,true);assert.equal(app.dialog.open,true);assert.equal(app.voiceState.track.readyState,'live');finish(app);assert.equal(app.voiceState.track.enabled,true);app.dialog.close();
});

test('current-position route clears a remembered origin and asks for one; unrelated reply is not mistaken for a town',async()=>{
 const app=await start();await heard(app,'Маршрут из Грана до Осло');finish(app);await heard(app,'маршрут от меня до Бергена','q2');assert.equal(route(app).searchParams.has('origin'),false);assert.match(route(app).searchParams.get('destination'),/^Bergen/);finish(app,'r2');
 await heard(app,'Как тебя зовут?','q3');assert.equal(actions(app).length,0);assert.equal(app.calls.filter(call=>call.url.endsWith('/skill-match')).length,1);app.dialog.close();
});

test('BUA route chooses a verified address only on unique directory match, otherwise asks for location',async()=>{
 const rows=[{id:'gran',name:'BUA Gran',municipality:'Gran',town:'Jaren',address:'Storgata 1, Jaren'},{id:'oslo-a',name:'BUA Oslo øst',municipality:'Oslo',town:'Oslo',address:'Testgata 2, Oslo'},{id:'oslo-b',name:'BUA Oslo vest',municipality:'Oslo',town:'Oslo',address:'Testgata 3, Oslo'}];
 const app=await start();app.browserWindow.FjordBuaDirectory={load:async()=>rows};await heard(app,'Маршрут до БУА в Гране');assert.equal(route(app).searchParams.get('destination'),'Storgata 1, Jaren, Norway');assert.equal(route(app).searchParams.has('origin'),false,'A BUA municipality is never invented as the visitor origin');finish(app);
 await heard(app,'Route from Oslo to BUA Gran','q2','en');assert.equal(route(app).searchParams.get('destination'),'Storgata 1, Jaren, Norway');assert.equal(route(app).searchParams.get('origin'),'Oslo');finish(app,'r2');
 await heard(app,'Маршрут до BUA Oslo','q3');assert.equal(actions(app).some(item=>item.tag==='a'),false,'No fabricated route to a random branch');assert.equal(actions(app).filter(item=>item.textContent?.startsWith('BUA Oslo')).length,2);assert.equal(app.revealed.at(-1),app.sections.buaEquipment);app.dialog.close();
});

test('late directory loading after stop cannot navigate, read aloud or add actions',async()=>{
 const app=await start();let resolve;app.browserWindow.FjordBuaDirectory={load:()=>new Promise(done=>resolve=done)};await heard(app,'Маршрут до BUA Gran');await app.find('fjord-ai-record-fallback').emit('click');const count=app.voiceState.peer.channel.sent.length;resolve([{id:'gran',name:'BUA Gran',municipality:'Gran',address:'Storgata 1'}]);await flush();assert.equal(actions(app).length,0);assert.equal(app.revealed.length,0);assert.equal(app.voiceState.peer.channel.sent.length,count);app.dialog.close();
});

test('Dima/Dimka contact requests use the consent handoff, with no immediate message or WhatsApp promise',async()=>{
 for(const [question,language] of [['Свяжись с Димой','ru'],['Написать Диме','ru'],['Позови Диму','ru'],['Передай Диме','ru'],['Please contact Dimka','en'],['Skriv til Dima','nb'],['Напиши Дімі','uk'],['Kontakta Dima','sv'],['Tal med Dimka','da']]){
  const app=await start();const channel=await heard(app,question,'q1',language);const answer=channel.sent.find(event=>event.type==='response.create')?.response?.instructions;assert.match(answer||'',/Dima|Дим|Дім/);assert.doesNotMatch(answer,/WhatsApp/);assert.equal(app.calls.filter(call=>call.url.endsWith('/chat')||call.url.endsWith('/contact')).length,0);app.dialog.close();
 }
 const app=await start();app.setChat({answer:'Подтвердите отправку.',needs_human:true,escalation_token:'fixture-token'});await heard(app,'Свяжись с Димой');finish(app);await heard(app,'Хочу уточнить маршрут на завтра','q2');assert.equal(app.voiceState.track.readyState,'ended');const handoff=app.find('fjord-ai-handoff');assert.equal(handoff.hidden,false);assert.equal(handoff.children.find(item=>item.className==='fjord-ai-consent').children[0].checked,false);await handoff.emit('submit');assert.equal(app.calls.filter(call=>call.url.endsWith('/contact')).length,0,'Explicit unchecked consent prevents external sending');app.dialog.close();
});

function delayedBridge(app) {
 const moves=[];let allowed=true;
 for(const section of Object.values(app.sections))section.getBoundingClientRect=()=>({left:400,right:500,top:100,bottom:140,width:100,height:40});
 app.browserWindow.OsirisSettings={isAllowed:()=>allowed};
 app.browserWindow.OsirisSiteActions=createSiteActionBridge({
  document:app.document,viewport:()=>({width:1000,height:700}),reducedMotion:()=>false,isAllowed:()=>allowed,
  getPresence:()=>({snapshot:()=>({position:{width:100,height:80,x:200,y:100}}),moveTo:(point,{signal})=>new Promise(resolve=>moves.push({resolve,signal,point}))}),
 });
 return {moves,disable(){allowed=false;app.browserWindow.emit('osiris:settings-changed')}};
}
const submit=async(app,text)=>{const form=app.find('fjord-ai-compose');form.children.find(n=>n.tag==='textarea').value=text;await form.emit('submit');await flush()};

test('typed command waits for arrival, then reports success; correction cancels without a stale success',async()=>{
 const app=boot();await flush();app.browserWindow.emit('fjord:open-chat');app.sections.journeys=app.document.createElement('section');app.sections.norwayWebcams=app.document.createElement('section');
 const {moves}=delayedBridge(app);let old=submit(app,'Открой туризм');await flush();
 assert.equal(app.sections.journeys.scrolled,undefined);assert.equal(app.find('fjord-ai-log').children.some(n=>n.textContent?.startsWith('Открыт раздел')),false);
 const next=submit(app,'Покажи видеокамеры');await flush();assert.equal(moves[0].signal.aborted,true);moves[0].resolve(true);moves[1].resolve(true);await Promise.all([old,next]);await flush();
 assert.equal(app.sections.journeys.scrolled,undefined);assert.equal(app.sections.norwayWebcams.scrolled.block,'start');
 const answers=app.find('fjord-ai-log').children.filter(n=>n.textContent?.startsWith('Открыт раздел'));assert.equal(answers.length,1);assert.match(answers[0].textContent,/Веб-камеры/);assert.equal(app.dialog.open,true);assert.equal(app.calls.filter(c=>c.url.endsWith('/chat')).length,0);app.dialog.close();
});
test('voice Stop or a newly spoken correction cancels navigation while preserving only the current result',async()=>{
 for(const stop of [true,false]){const app=await start(),{moves}=delayedBridge(app);await heard(app,'Открой туризм');assert.equal(moves.length,1);assert.equal(app.revealed.length,0);
  if(stop)await app.find('fjord-ai-record-fallback').emit('click');else app.voiceState.peer.channel.message({type:'input_audio_buffer.speech_started'});
  moves[0].resolve(true);await flush();assert.equal(app.revealed.length,0);assert.equal(app.find('fjord-ai-log').children.some(n=>n.textContent?.startsWith('Открыт раздел')),false);app.dialog.close();
 }
});
test('close, hidden tab, typing a correction and settings off revoke queued typed navigation',async()=>{
 for(const mode of ['close','hidden','input','settings']){const app=boot();await flush();app.browserWindow.emit('fjord:open-chat');app.sections.journeys=app.document.createElement('section');const bridge=delayedBridge(app),pending=submit(app,'Открой туризм');await flush();
  if(mode==='close')app.dialog.close();if(mode==='hidden'){app.document.hidden=true;app.document.emit('visibilitychange')}if(mode==='input')await app.find('fjord-ai-compose').children.find(n=>n.tag==='textarea').emit('input');if(mode==='settings')bridge.disable();
  bridge.moves[0].resolve(true);await pending;assert.equal(app.sections.journeys.scrolled,undefined);assert.equal(app.find('fjord-ai-log').children.some(n=>n.textContent?.startsWith('Открыт раздел')),false);if(mode==='settings')assert.match(app.find('fjord-ai-status').textContent,/disabled|отключены/);app.dialog.close();
 }
});
test('negated commands, how-to questions and recommendations do not navigate; all ten known section labels do',async()=>{
 const app=boot();await flush();app.browserWindow.emit('fjord:open-chat');
 for(const id of ['journeys','norwayWebcams'])app.sections[id]=app.document.createElement('section');
 for(const text of ['Не открывай веб-камеры','Как открыть веб-камеры?','Покажи как открыть веб-камеры','Покажи водопады в Норвегии']){await submit(app,text);assert.ok(Object.values(app.sections).every(section=>!section.scrolled))}
 for(const [title,id] of [['Места','collection'],['Красивые маршруты','scenicRoutes'],['Домики и сауны','staysSauna'],['Кафе рядом','cafeNearby'],['Впечатления по маршруту','routeExperiences'],['Истории путешествий','travelStories'],['Места рядом','norwayCatalogue'],['Снаряжение BUA','buaEquipment'],['Туризм','journeys'],['Веб-камеры','norwayWebcams']]){
  await submit(app,'Открой '+title);assert.ok(app.sections[id].scrolled,id);
 }
 assert.equal(app.calls.filter(c=>c.url.endsWith('/chat')).length,4);app.dialog.close();
});
test('settings off also blocks the no-module fallback',async()=>{
 const app=boot();await flush();app.browserWindow.emit('fjord:open-chat');app.sections.journeys=app.document.createElement('section');app.browserWindow.OsirisSettings={isAllowed:()=>false};
 await submit(app,'Открой туризм');assert.equal(app.sections.journeys.scrolled,undefined);assert.match(app.find('fjord-ai-status').textContent,/disabled/);app.dialog.close();
});

function authFixture(app) {
 const store=new Map();app.browserWindow.atob=globalThis.atob;
 app.browserWindow.sessionStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value),removeItem:key=>store.delete(key)};
 let visitor=null;app.browserWindow.__fixtureAuth={ensureVerified:async()=>visitor,getVisitorToken:async()=>visitor?.idToken||''};
 return (uid,revision=1)=>{visitor=uid?{idToken:'header.'+Buffer.from(JSON.stringify({sub:uid,exp:revision})).toString('base64url')+'.signature',email:'same-address@example.test',emailVerified:true}:null;if(visitor)store.set('fjord-afonya-visitor',JSON.stringify(visitor));else store.delete('fjord-afonya-visitor');app.browserWindow.emit('fjord:auth-changed');};
}
test('same UID token refresh retains chat; Alice to Bob clears history, handoff, route origin and pending navigation',async()=>{
 const app=boot({enabled:true,endpoint:'https://chat.example.test',firebaseApiKey:'fixture-key'});await flush();const identity=authFixture(app);identity('Alice');app.browserWindow.emit('fjord:open-chat');await flush();
 await submit(app,'Я еду из Грана');assert.equal(app.find('fjord-ai-origin').hidden,false);app.setChat({answer:'Alice private answer',needs_human:true,escalation_token:'alice-only'});await submit(app,'Мой личный вопрос');const log=app.find('fjord-ai-log');const before=log.children.length;assert.equal(app.find('fjord-ai-handoff').hidden,false);
 identity('Alice',2);assert.equal(log.children.length,before);assert.equal(app.find('fjord-ai-handoff').hidden,false);
 app.sections.journeys=app.document.createElement('section');const {moves}=delayedBridge(app),pending=submit(app,'Открой туризм');await flush();identity('Bob');moves[0].resolve(true);await pending;
 assert.equal(log.children.length,0);assert.equal(app.sections.journeys.scrolled,undefined);assert.equal(app.find('fjord-ai-handoff').hidden,true);assert.equal(app.find('fjord-ai-origin').hidden,true);assert.doesNotMatch(decodeURIComponent(app.find('fjord-ai-email').href),/Alice|личный|Gran/);
 app.setChat({answer:'Bob answer'});await submit(app,'Новый вопрос');const posted=JSON.parse(app.calls.filter(c=>c.url.endsWith('/chat')).at(-1).options.body);assert.deepEqual(posted.messages.map(m=>m.content),['Новый вопрос']);
 identity(null);assert.equal(log.children.length,0);assert.equal(app.dialog.open,false);
});
test('UID switch ends active voice and never restarts the microphone',async()=>{
 const app=await start();const identity=authFixture(app);identity('Alice');assert.equal(app.voiceState.track.readyState,'ended');assert.equal(app.find('fjord-ai-log').children.length,0);
 app.find('fjord-ai-input-mode').value='conversation';await app.find('fjord-ai-record-fallback').emit('click');await flush();const track=app.voiceState.track;
 identity('Alice',2);assert.equal(track.readyState,'live');identity('Bob');assert.equal(track.readyState,'ended');assert.equal(app.find('fjord-ai-log').children.length,0);app.dialog.close();
});
test('an old in-flight chat reply cannot restore private history or handoff after UID change',async()=>{
 const config={enabled:true,endpoint:'https://chat.example.test',firebaseApiKey:'fixture-key',deferIdentityReply:true};
 const app=boot(config);await flush();const identity=authFixture(app);identity('Alice');app.browserWindow.emit('fjord:open-chat');await flush();
 await submit(app,'Alice private question');assert.equal(typeof app.voiceState.resolveIdentityReply,'function');
 identity('Bob');app.setChat({answer:'Alice private response',needs_human:true,escalation_token:'alice-ticket'});app.voiceState.resolveIdentityReply();await flush();
 assert.equal(app.find('fjord-ai-log').children.length,0);assert.equal(app.find('fjord-ai-handoff').hidden,true);assert.equal(app.find('fjord-ai-status').textContent,'');
 config.deferIdentityReply=false;app.setChat({answer:'Bob response'});await submit(app,'Bob question');const body=JSON.parse(app.calls.filter(call=>call.url.endsWith('/chat')).at(-1).options.body);
 assert.deepEqual(body.messages.map(message=>message.content),['Bob question']);app.dialog.close();
});
test('a late token refresh from the previous UID cannot reset the new account or send its question',async()=>{
 const app=boot({enabled:true,endpoint:'https://chat.example.test',firebaseApiKey:'fixture-key'});await flush();const identity=authFixture(app);identity('Alice');app.browserWindow.emit('fjord:open-chat');await flush();
 const auth=app.browserWindow.__fixtureAuth,normalToken=auth.getVisitorToken,aliceToken=await normalToken();let resolve;
 auth.getVisitorToken=()=>new Promise(done=>resolve=done);await submit(app,'Old private question');assert.equal(typeof resolve,'function');
 identity('Bob');auth.getVisitorToken=normalToken;app.setChat({answer:'Bob answer'});await submit(app,'Bob question');resolve(aliceToken);await flush();
 assert.deepEqual(Array.from(app.find('fjord-ai-log').children,n=>n.textContent),['Bob question','Bob answer']);
 assert.equal(app.calls.filter(call=>call.url.endsWith('/chat')).length,1);app.dialog.close();
});
test('cafe command reveals the visible cafeStops section, not its hidden legacy cafeNearby panel',async()=>{
 for(const voice of [false,true]){
  const app=voice?await start():boot();await flush();if(!voice)app.browserWindow.emit('fjord:open-chat');
  const section=app.document.createElement('section');section.id='cafeStops';section.getBoundingClientRect=()=>({width:900,height:650});
  app.sections.cafeStops=section;const legacy=app.sections.cafeNearby;legacy.id='cafeNearby';legacy.parentElement=section;legacy.getBoundingClientRect=()=>({width:0,height:0});
  app.browserWindow.getComputedStyle=node=>({display:node===legacy?'none':'block',visibility:'visible'});
  const revealed=[];app.browserWindow.FjordTabs={reveal:target=>revealed.push(target)};
  if(voice)await heard(app,'Открой кафе');else await submit(app,'Открой кафе');
  assert.equal(revealed.at(-1),section);assert.equal(section.scrolled.block,'start');assert.equal(section.focused,true);assert.equal(legacy.scrolled,undefined);
  assert.equal(actions(app)[0].attrs['aria-controls'],'cafeStops');assert.ok(app.find('fjord-ai-log').children.some(node=>node.textContent?.startsWith('Открыт раздел:')));
  if(voice)assert.equal(app.voiceState.track.readyState,'live');app.dialog.close();
 }
});
test('a tab-hidden section is revealed before visibility is checked and scrolling starts',async()=>{
 for(const [id,label] of [['travelStories','Истории путешествий'],['norwayCatalogue','Места рядом'],['norwayWebcams','Веб-камеры']]){
  const app=boot();await flush();app.browserWindow.emit('fjord:open-chat');const section=app.sections[id]||app.document.createElement('section');app.sections[id]=section;
  section.hidden=true;section.getBoundingClientRect=()=>({width:section.hidden?0:900,height:section.hidden?0:600});
  app.browserWindow.getComputedStyle=node=>({display:node.hidden?'none':'block',visibility:'visible'});
  app.browserWindow.FjordTabs={reveal:target=>{assert.equal(target,section);target.hidden=false}};
  await submit(app,'Открой '+label);assert.equal(section.scrolled.block,'start');assert.ok(app.find('fjord-ai-log').children.some(node=>node.textContent?.startsWith('Открыт раздел:')));app.dialog.close();
 }
});
test('permanently hidden, zero-area or hidden-ancestor targets never report navigation success',async()=>{
 for(const mode of ['display-none','zero-area','ancestor']){
  const app=boot();await flush();app.browserWindow.emit('fjord:open-chat');const target=app.sections.collection;
  target.getBoundingClientRect=()=>({width:mode==='zero-area'?0:900,height:600});
  app.browserWindow.getComputedStyle=node=>({display:mode==='display-none'&&node===target?'none':'block',visibility:'visible'});
  if(mode==='ancestor'){target.parentElement=app.document.createElement('section');target.parentElement.hidden=true}
  app.browserWindow.FjordTabs={reveal:()=>{}};
  await submit(app,'Открой места');assert.equal(target.scrolled,undefined);assert.equal(target.focused,undefined);
  assert.equal(app.find('fjord-ai-log').children.some(node=>node.textContent?.startsWith('Открыт раздел:')),false);assert.match(app.find('fjord-ai-status').textContent,/Не удалось открыть/);app.dialog.close();
 }
});
