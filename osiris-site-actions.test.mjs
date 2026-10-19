import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const [source,directionsSource,fixtureSource,catalog]=await Promise.all(['chat-widget.js','assistant-routing.js','chat-widget.test.mjs','demo-data/state.json'].map(file=>readFile(new URL(file,import.meta.url),'utf8')));
const fixture=fixtureSource.slice(fixtureSource.indexOf('class Element {'),fixtureSource.indexOf('\n{\n const a=boot({enabled:false})'));
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
