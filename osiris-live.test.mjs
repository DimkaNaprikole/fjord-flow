import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const [source,directionsSource,fixtureSource,catalog]=await Promise.all(['chat-widget.js','assistant-routing.js','chat-widget.test.mjs','demo-data/state.json'].map(file=>readFile(new URL(file,import.meta.url),'utf8')));
let fixture=fixtureSource.slice(fixtureSource.indexOf('class Element {'),fixtureSource.indexOf('\n{\n const a=boot({enabled:false})'));
// Extend only the transport response; all UI, RTC, auth and request fixtures remain shared.
fixture=fixture.replace("return{ok:true,text:async()=>('v=0", "return{ok:true,json:async()=>({session:{id:'live_fixture'},transport:{type:'webrtc',sdp:'v=0\\r\\nm=audio 9 UDP/TLS/RTP/SAVPF 111\\r\\n'}}),text:async()=>('v=0");
fixture=fixture.replace("if(url.endsWith('/chat'))return","if(url.endsWith('/chat')&&config.deferChat)await new Promise(resolve=>voiceState.resolveChat=resolve);if(url.endsWith('/chat'))return");
const context={source,directionsSource,directionsCatalog:JSON.parse(catalog),vm,URL,Blob,FormData,AbortController,setTimeout,clearTimeout,setInterval,clearInterval,setImmediate};
vm.runInNewContext(fixture+'\nthis.fixtureApi={boot,flush};',context);
const {boot,flush}=context.fixtureApi;
const config={enabled:true,endpoint:'https://chat.example.test',voiceConversation:true,nativeVoiceAudio:true,liveVoiceModel:'gpt-live-1'};
async function start(mode='conversation',extra={}){
 const app=boot({...config,...extra},true);await flush();app.browserWindow.emit('fjord:open-chat');app.find('fjord-ai-input-mode').value=mode;await app.find('fjord-ai-record-fallback').emit('click');await flush();const channel=app.voiceState.peer.channel;
 if(mode==='conversation')channel.message({type:'session.started',session:{id:'live_fixture'}});
 return{app,channel,track:app.voiceState.track};
}
const input=(channel,delta,id)=>channel.message({type:'session.input_transcript.delta',delta,event_id:id,start_ms:0,end_ms:100});
const output=(channel,delta,id)=>channel.message({type:'session.output_transcript.delta',delta,event_id:id,start_ms:100,end_ms:200});
const delegate=(channel,id='d1')=>channel.message({type:'session.delegation.created',delegation:{id,target:'client',type:'delegation'}});

test('Live negotiates JSON plus bounded history and never sends Realtime turn commands',async()=>{
 const {app,channel,track}=await start();const request=app.calls.find(c=>c.url.includes('/live-session'));assert.match(request.url,/output=audio&protocol=live$/);assert.equal(request.options.headers['Content-Type'],'application/json');const body=JSON.parse(request.options.body);assert.match(body.sdp,/^v=0/);assert.deepEqual(body.history,[]);assert.equal(channel.sent.length,0);assert.equal(track.enabled,true);assert.equal(app.find('fjord-ai-status').attrs['data-voice-stage'],'connected');app.dialog.close();assert.ok(channel.sent.some(e=>e.type==='session.close'));
});
test('Live preserves fragment spaces and repetitions, groups captions and avoids per-delta paid work',async()=>{
 const {app,channel}=await start();input(channel,'Привет, ','u1');input(channel,'как как дела?','u2');input(channel,'как как дела?','u2');output(channel,'Всё ','a1');output(channel,'хорошо.','a2');const rows=app.find('fjord-ai-log').children.map(n=>n.textContent);assert.equal(rows.filter(t=>t==='Привет, как как дела?').length,1);assert.equal(rows.filter(t=>t==='Всё хорошо.').length,1);assert.equal(app.calls.filter(c=>c.url.endsWith('/chat')).length,0);assert.equal(channel.sent.length,0);app.dialog.close();
});
test('delegation runs Sol once per task and returns content with the same delegation id',async()=>{
 const {app,channel}=await start();app.setChat({answer:'Короткий умный ответ.'});input(channel,'Почему море солёное?','u1');delegate(channel);delegate(channel);await flush();const calls=app.calls.filter(c=>c.url.endsWith('/chat'));assert.equal(calls.length,1);assert.equal(JSON.parse(calls[0].options.body).messages.at(-1).content,'Почему море солёное?');const result=channel.sent.find(e=>e.type==='session.commentary.append');assert.equal(result.delegation_id,'d1');assert.equal(result.content,'Короткий умный ответ.');assert.ok(channel.sent.every(e=>!e.type.startsWith('response.')&&!e.type.startsWith('conversation.')));app.dialog.close();
});
test('local navigation executes before a paid Sol lookup and uses Live commentary',async()=>{
 const {app,channel}=await start();input(channel,'Открой маршруты','u1');delegate(channel);await flush();assert.equal(app.calls.filter(c=>c.url.endsWith('/chat')).length,0);assert.ok(channel.sent.some(e=>e.type==='session.commentary.append'));app.dialog.close();
});
test('goodbye stops capture and closes Live without moderation, delegation or new session',async()=>{
 const {app,channel,track}=await start();input(channel,'Осирис, всё, пока','u1');await flush();assert.equal(track.readyState,'ended');assert.notEqual(app.voiceState.peer.closed,true);channel.message({type:'session.closed'});assert.equal(app.voiceState.peer.closed,true);assert.ok(channel.sent.some(e=>e.type==='session.close'));assert.equal(app.calls.filter(c=>/\/(chat|moderate)$/.test(c.url)).length,0);assert.equal(app.calls.filter(c=>c.url.includes('/live-session')).length,1);app.dialog.close();
});

test('bare pause stops playback immediately and a following goodbye closes capture without an intervening answer',async()=>{
 const {app,channel,track}=await start();app.voiceState.peer.ontrack({streams:[{getTracks:()=>[]}]});await flush();output(channel,'Расскажу о Норвегии.','a1');
 input(channel,'подожди','u1');assert.equal(app.find('osiris-live-audio').paused,true);
 assert.ok(channel.sent.some(e=>e.type==='session.instructions.append'&&/Stop speaking now/.test(e.content)));
 input(channel,'всё, ','u2');input(channel,'пока','u3');assert.equal(track.readyState,'ended');
 assert.ok(channel.sent.some(e=>e.type==='session.close'));channel.message({type:'session.closed'});assert.equal(app.calls.filter(c=>/\/(chat|moderate)$/.test(c.url)).length,0);app.dialog.close();
});
test('closed Live ignores late captions and task events',async()=>{
 const {app,channel,track}=await start();const old=channel.onmessage;app.dialog.close();const before=app.calls.length;old({data:JSON.stringify({type:'session.delegation.created',delegation:{id:'stale',target:'client'}})});old({data:JSON.stringify({type:'session.output_transcript.delta',delta:'stale'})});await flush();assert.equal(track.readyState,'ended');assert.equal(app.calls.length,before);assert.equal(app.find('fjord-ai-log').children.some(n=>n.textContent==='stale'),false);
});
test('a fresh delegation id cannot trigger a paid lookup loop for the same user request',async()=>{
 const {app,channel}=await start();app.setChat({answer:'Готовый ответ.'});input(channel,'Почему небо голубое?','u1');delegate(channel,'d1');await flush();output(channel,'Небо голубое из-за рассеяния.','a1');delegate(channel,'d2');await flush();assert.equal(app.calls.filter(c=>c.url.endsWith('/chat')).length,1);assert.ok(channel.sent.some(e=>e.type==='session.thinking.append'&&e.delegation_id==='d2'));app.dialog.close();channel.message({type:'session.closed'});
});
test('Live opt-in leaves manual dictation on the tested Realtime SDP protocol',async()=>{
 const {app,channel}=await start('dictation');const request=app.calls.find(c=>c.url.includes('/live-session'));assert.match(request.url,/mode=dictation&output=audio$/);assert.equal(request.options.headers['Content-Type'],'application/sdp');assert.ok(channel.sent.some(e=>e.type==='input_audio_buffer.clear'));app.dialog.close();
});

test('explicit interpreter mode persists across Russian and Norwegian questions without navigation or paid delegation',async()=>{
 const {app,channel}=await start();input(channel,'Осирис, будь переводчиком с русского на ','i1');assert.equal(channel.sent.length,0);input(channel,'норвежский и обратно','i2');input(channel,'норвежский и обратно','i2');
 assert.equal(channel.sent.filter(e=>e.type==='session.instructions.append').length,1);
 assert.match(channel.sent[0].content,/Russian into Norwegian Bokmål and Norwegian \(no\/nb\) into Russian/);
 output(channel,'Jeg er klar.','a1');input(channel,'Открой маршруты. Почему море солёное?','u1');delegate(channel,'translation1');await flush();
 output(channel,'Åpne rutene. Hvorfor er havet salt?','a2');input(channel,'Hvor er Oslo? Åpne kameraene.','u2');delegate(channel,'translation2');await flush();
 assert.equal(app.calls.filter(c=>/\/(chat|moderate|skill-match)$/.test(c.url)).length,0);
 assert.equal(channel.sent.filter(e=>e.type==='session.commentary.append').length,0);
 assert.equal(channel.sent.filter(e=>e.type==='session.thinking.append'&&/Interpreter mode is active/.test(e.content)).length,2);app.dialog.close();
});

test('pause keeps interpretation, standalone name exits and invalidates pending Sol, goodbye still ends capture',async()=>{
 const {app,channel,track}=await start('conversation',{deferChat:true});input(channel,'Почему море солёное?','q1');delegate(channel,'pending');await flush();
 output(channel,'Сейчас узнаю.','a1');input(channel,'Переводи с русского на норвежский и обратно','i1');output(channel,'Готов.','a2');input(channel,'подожди','p1');
 assert.match(channel.sent.at(-1).content,/Interpreter mode remains active/);
 input(channel,'Открой маршруты','t1');delegate(channel,'translated');await flush();assert.equal(app.calls.filter(c=>c.url.endsWith('/chat')).length,1);
 output(channel,'Åpne rutene.','a3');input(channel,'Осирис','name1');await new Promise(resolve=>setTimeout(resolve,280));
 assert.ok(channel.sent.some(e=>e.type==='session.instructions.append'&&/Interpreter mode is OFF/.test(e.content)));
 app.voiceState.resolveChat();await flush();assert.equal(channel.sent.some(e=>e.type==='session.commentary.append'),false);
 input(channel,'всё, пока','bye');assert.equal(track.readyState,'ended');channel.message({type:'session.closed'});app.dialog.close();
});

test('a name fragment followed by an interpreter command is not mistaken for a standalone call; mentions remain translation source',async()=>{
 const {app,channel}=await start();input(channel,'Osiris','n1');input(channel,', translate Russian to Norwegian and back','n2');await new Promise(resolve=>setTimeout(resolve,280));
 assert.equal(channel.sent.some(e=>/Interpreter mode is OFF/.test(e.content)),false);assert.equal(channel.sent.filter(e=>e.type==='session.instructions.append').length,1);
 output(channel,'Ready.','a1');input(channel,'Осирис любит Норвегию','m1');delegate(channel,'mention');await flush();assert.equal(app.calls.filter(c=>c.url.endsWith('/chat')).length,0);assert.equal(channel.sent.some(e=>/Interpreter mode is OFF/.test(e.content)),false);app.dialog.close();
});

test('interpreter state resets when the session is closed and Norwegian activation is supported',async()=>{
 const {app,channel}=await start();input(channel,'Vær min tolk mellom russisk og norsk','i1');assert.ok(channel.sent.some(e=>/Interpreter mode is active/.test(e.content)));app.dialog.close();channel.message({type:'session.closed'});
 app.browserWindow.emit('fjord:open-chat');await app.find('fjord-ai-record-fallback').emit('click');await flush();const fresh=app.voiceState.peer.channel;fresh.message({type:'session.started'});input(fresh,'Почему море солёное?','q1');delegate(fresh,'ordinary');await flush();assert.equal(app.calls.filter(c=>c.url.endsWith('/chat')).length,1);app.dialog.close();fresh.message({type:'session.closed'});
});
test('closing cancels a pending Sol delegation without stale commentary or a retry',async()=>{
 const {app,channel}=await start('conversation',{deferChat:true});input(channel,'Почему небо голубое?','u1');delegate(channel);await flush();assert.equal(typeof app.voiceState.resolveChat,'function');app.dialog.close();app.voiceState.resolveChat();await flush();assert.equal(channel.sent.some(e=>e.type==='session.commentary.append'),false);assert.equal(app.calls.filter(c=>c.url.endsWith('/chat')).length,1);channel.message({type:'session.closed'});
});

test('pause during a pending lookup suppresses its late answer and keeps microphone ready',async()=>{
 const {app,channel,track}=await start('conversation',{deferChat:true});input(channel,'Почему море солёное?','u1');delegate(channel);await flush();
 input(channel,'подожди','u2');assert.ok(channel.sent.some(e=>e.type==='session.instructions.append'));
 app.voiceState.resolveChat();await flush();assert.equal(channel.sent.some(e=>e.type==='session.commentary.append'),false);assert.equal(track.readyState,'live');
 input(channel,'всё, пока','u3');assert.equal(track.readyState,'ended');channel.message({type:'session.closed'});app.dialog.close();
});
test('budget-protected dictation never opens old paid RTC when browser ASR is missing',async()=>{
 const app=boot({...config,paidRealtimeDisabled:true,budgetProtectedVoice:true},true);await flush();app.browserWindow.emit('fjord:open-chat');await app.find('fjord-ai-record-fallback').emit('click');await flush();assert.equal(app.calls.filter(c=>c.url.includes('/live-session')).length,0);assert.equal(app.find('fjord-ai-status').attrs['data-speech-error'],'unsupported');assert.equal(app.voiceState.track,null);app.dialog.close();
});
for(const autoSend of [false,true])test('budget-protected browser dictation keeps Stop and auto-send '+autoSend,async()=>{
 const app=boot({...config,paidRealtimeDisabled:true,budgetProtectedVoice:true},true);await flush();let recognition;app.browserWindow.SpeechRecognition=class{constructor(){recognition=this}start(){this.onstart?.()}stop(){this.onend?.()}abort(){}};app.browserWindow.emit('fjord:open-chat');app.find('fjord-ai-auto-send').children[0].checked=autoSend;await app.find('fjord-ai-record-fallback').emit('click');recognition.onresult({results:[[{transcript:'Tell me about auroras'}]]});assert.equal(app.calls.filter(c=>c.url.includes('/live-session')).length,0);await app.find('fjord-ai-record-fallback').emit('click');await flush();assert.equal(app.calls.filter(c=>c.url.endsWith('/chat')).length,autoSend?1:0);if(!autoSend)assert.equal(app.find('fjord-ai-compose').children.find(n=>n.tag==='textarea').value,'Tell me about auroras');app.dialog.close();
});
