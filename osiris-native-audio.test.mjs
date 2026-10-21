import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

// Reuse the widget's full browser fixture, without executing its test cases.
const [source,directionsSource,fixtureSource,catalog]=await Promise.all(['chat-widget.js','assistant-routing.js','chat-widget.test.mjs','demo-data/state.json'].map(file=>readFile(new URL(file,import.meta.url),'utf8')));
// Git may check out CRLF on Windows; normalize fixture boundaries, not app code.
const normalizedFixture=fixtureSource.replace(/\r\n/g,'\n');
const fixtureStart=normalizedFixture.indexOf('class Element {'),fixtureEnd=normalizedFixture.indexOf('\n{\n const a=boot({enabled:false})');
assert.ok(fixtureStart>=0&&fixtureEnd>fixtureStart,'Shared chat fixture boundaries must be present');
const fixture=normalizedFixture.slice(fixtureStart,fixtureEnd);
assert.ok(fixture.includes('function boot(')&&!fixture.includes('const a=boot({enabled:false})'));
// The shared account/history fixture uses browser globals inside this outer VM.
const context={atob,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}},source,directionsSource,directionsCatalog:JSON.parse(catalog),vm,URL,Blob,FormData,AbortController,setTimeout,clearTimeout,setInterval,clearInterval,setImmediate};
vm.runInNewContext(fixture+'\nthis.fixtureApi={boot,flush};',context);
const {boot,flush}=context.fixtureApi;
const config={enabled:true,endpoint:'https://chat.example.test',voiceConversation:true,nativeVoiceAudio:true};
async function start(options={},mode='conversation'){
 const app=boot({...config,...options},true);await flush();app.browserWindow.emit('fjord:open-chat');app.find('fjord-ai-input-mode').value=mode;await app.find('fjord-ai-record-fallback').emit('click');await flush();
 const remoteTrack={stopped:false,stop(){this.stopped=true}},remote={getTracks:()=>[remoteTrack]};app.voiceState.peer.ontrack({streams:[remote]});await flush();
 return{app,channel:app.voiceState.peer.channel,track:app.voiceState.track,remoteTrack,audio:app.find('osiris-live-audio')};
}
async function askVoice(channel,text='Привет, что посмотреть рядом?',id='q1'){
 channel.message({type:'input_audio_buffer.speech_stopped'});channel.message({type:'conversation.item.input_audio_transcription.completed',item_id:id,transcript:text,language:'ru'});await flush();
}
function created(channel,id='r1'){channel.message({type:'response.created',response:{id}});channel.message({type:'output_audio_buffer.started',response_id:id})}
function text(channel,value='Привет! Рядом есть музей.',id='r1'){channel.message({type:'response.output_audio_transcript.done',item_id:id+'-answer',response_id:id,transcript:value})}
function done(channel,id='r1'){channel.message({type:'response.done',response:{id,status:'completed'}})}
function drained(channel,id='r1'){channel.message({type:'output_audio_buffer.stopped',response_id:id})}

test('native audio opts in explicitly, renders Russian transcript once and waits for audible drain',async()=>{
 const {app,channel,track,audio}=await start();assert.ok(app.calls.some(call=>call.url.endsWith('/live-session?output=audio')));assert.equal(audio.muted,false);assert.equal(audio.autoplay,true);
 await askVoice(channel);created(channel);assert.equal(track.enabled,true);text(channel);text(channel);done(channel);
 assert.equal(track.enabled,true,'Capture remains open for barge-in while output drains');assert.equal(app.voiceState.peer.closed,undefined);assert.equal(app.voiceState.spoken.length,0,'Native audio never invokes browser TTS');
 assert.equal(app.find('fjord-ai-log').children.filter(item=>item.textContent==='Привет! Рядом есть музей.').length,1);assert.equal(app.find('fjord-ai-status').attrs['data-tts-language'],'ru-RU');
 drained(channel);assert.equal(track.enabled,true);assert.equal(app.find('fjord-ai-status').attrs['data-tts-state'],'ended');
 await askVoice(channel,'А где находится этот музей?','q2');created(channel,'r2');text(channel,'Музей находится рядом с городом.','r2');done(channel,'r2');drained(channel,'r2');assert.equal(app.calls.filter(call=>call.url.includes('/live-session')).length,1);assert.equal(track.enabled,true);app.dialog.close();
});

test('dictation finishes only after native audio has drained and preserves one answer in reconnect history',async()=>{
 const {app,channel,track}=await start({},'dictation');assert.ok(app.calls.some(call=>call.url.endsWith('/live-session?mode=dictation&output=audio')));
 await app.find('fjord-ai-record-fallback').emit('click');channel.message({type:'conversation.item.input_audio_transcription.completed',item_id:'q1',transcript:'Привет',language:'ru'});await flush();created(channel);text(channel);done(channel);assert.equal(track.readyState,'ended');assert.equal(app.voiceState.peer.closed,undefined);
 drained(channel);assert.equal(app.voiceState.peer.closed,true);await app.find('fjord-ai-record-fallback').emit('click');await flush();const restored=app.voiceState.peer.channel.sent.filter(message=>message.type==='conversation.item.create');assert.equal(restored.filter(message=>message.item.role==='assistant'&&message.item.content[0].text==='Привет! Рядом есть музей.').length,1);app.dialog.close();
});

test('local approved answer uses existing RTC audio without another chat request or duplicate transcript',async()=>{
 const {app,channel,track}=await start();app.setSkill({answer:'Проверенный адрес: Granavollen.'});await askVoice(channel,'Что ты знаешь про Granavollen?');const request=channel.sent.find(message=>message.type==='response.create');assert.equal(request.response.conversation,'none');assert.deepEqual(Array.from(request.response.output_modalities),['audio']);assert.match(request.response.instructions,/Проверенный адрес/);assert.equal(app.calls.filter(call=>call.url.endsWith('/chat')).length,0);
 created(channel);text(channel,'Проверенный адрес: Granavollen.');done(channel);drained(channel);assert.equal(track.enabled,true);assert.equal(app.voiceState.spoken.length,0);assert.equal(app.find('fjord-ai-log').children.filter(item=>item.textContent==='Проверенный адрес: Granavollen.').length,1);app.dialog.close();
});

test('blocked playback preserves local audio replay without another paid connection',async()=>{
 const {app,channel,audio}=await start();audio.play=()=>Promise.reject(Object.assign(new Error('autoplay denied'),{name:'NotAllowedError'}));await askVoice(channel);created(channel);await flush();text(channel);done(channel);drained(channel);assert.equal(app.voiceState.peer.closed,true);assert.equal(app.find('fjord-ai-status').attrs['data-tts-error'],'not-allowed');const requests=app.calls.length;
 await app.find('fjord-ai-voice fjord-ai-read-answer').emit('click');await flush();assert.equal(app.calls.length,requests);assert.equal(app.voiceState.spoken.length,0);const replay=app.dialog.children.find(item=>item.tag==='audio');assert.match(replay.src,/^blob:/);assert.equal(replay.played,true);replay.onended();assert.equal(app.find('fjord-ai-status').attrs['data-tts-state'],'ended');app.dialog.close();
});

for(const action of ['stop','close','hidden'])test(action+' stops microphone, remote output, recorder and late callbacks',async()=>{
 const {app,channel,track,remoteTrack,audio}=await start();await askVoice(channel);created(channel);text(channel);const oldMessage=channel.onmessage;
 if(action==='stop')await app.find('fjord-ai-record-fallback').emit('click');else if(action==='close')app.dialog.close();else{app.document.hidden=true;app.document.emit('visibilitychange')}
 assert.equal(track.readyState,'ended');assert.equal(remoteTrack.stopped,true);assert.equal(audio.paused,true);assert.equal(audio.srcObject,null);assert.equal(app.voiceState.peer.closed,true);const before=app.calls.length;oldMessage({data:JSON.stringify({type:'output_audio_buffer.stopped',response_id:'r1'})});app.document.hidden=false;app.document.emit('visibilitychange');await flush();assert.equal(app.calls.length,before);if(app.dialog.open)app.dialog.close();
});

test('failed native response does not enter history and does not auto resume',async()=>{
 const {app,channel,track}=await start();await askVoice(channel);created(channel);text(channel,'Незаконченный ответ');channel.message({type:'response.done',response:{id:'r1',status:'incomplete'}});assert.equal(track.readyState,'ended');assert.equal(app.find('fjord-ai-status').attrs['data-voice-error'],'response_incomplete');await app.find('fjord-ai-record-fallback').emit('click');await flush();assert.equal(app.voiceState.peer.channel.sent.filter(message=>message.type==='conversation.item.create'&&message.item.content[0].text==='Незаконченный ответ').length,0);app.dialog.close();
});

test('native playback works even when no browser speech synthesis exists',async()=>{
 const {app,channel,track}=await start();delete app.browserWindow.speechSynthesis;delete app.browserWindow.SpeechSynthesisUtterance;await askVoice(channel);created(channel);text(channel);done(channel);drained(channel);assert.equal(track.enabled,true);assert.equal(app.find('fjord-ai-status').attrs['data-tts-state'],'ended');app.dialog.close();
});

test('recording unavailable or too large cannot stall the native conversation',async()=>{
 for(const recordingBytes of [0,3100000]){const {app,channel,track}=await start({recordingBytes});await askVoice(channel);created(channel);text(channel);done(channel);drained(channel);assert.equal(track.enabled,true);assert.equal(app.voiceState.peer.closed,undefined);app.dialog.close()}
 const {app,channel,track}=await start();delete app.browserWindow.MediaRecorder;await askVoice(channel);created(channel);text(channel);done(channel);drained(channel);assert.equal(track.enabled,true);app.dialog.close();
});

test('native farewell stops capture immediately, speaks Russian and closes after audio drain',async()=>{
 const {app,channel,track,remoteTrack}=await start();await askVoice(channel,'Пока');assert.equal(track.readyState,'ended');assert.equal(track.enabled,false);assert.equal(app.voiceState.peer.closed,undefined,'Keep only output connected for the farewell');
 const request=channel.sent.find(message=>message.type==='response.create');assert.match(request.response.instructions,/До свидания|до свидания/);assert.equal(request.response.conversation,'none');assert.equal(app.voiceState.spoken.length,0);
 created(channel);text(channel,'Давай, до свидания. Связь окончена. Спасибо за внимание, обращайтесь завтра.');done(channel);assert.equal(app.voiceState.peer.closed,undefined);assert.equal(track.enabled,false);drained(channel);assert.equal(app.voiceState.peer.closed,true);assert.equal(track.enabled,false);assert.equal(remoteTrack.stopped,true);assert.equal([...app.voiceState.timers.values()].filter(timer=>timer.ms===30000).length,0);app.dialog.close();
});

test('native farewell failure or missing drain has bounded cleanup and never restarts capture',async()=>{
 for(const outcome of ['failed','missing-drain']){
  const {app,channel,track,remoteTrack}=await start();await askVoice(channel,'Пока');created(channel);text(channel,'До свидания.');
  if(outcome==='failed')channel.message({type:'response.done',response:{id:'r1',status:'failed'}});
  else{done(channel);const timeout=[...app.voiceState.timers.values()].find(timer=>timer.ms===30000);assert.ok(timeout,'A farewell has a bounded output cleanup');timeout.fn()}
  assert.equal(app.voiceState.peer.closed,true);assert.equal(track.readyState,'ended');assert.equal(track.enabled,false);assert.equal(remoteTrack.stopped,true);const calls=app.calls.length;app.document.emit('visibilitychange');await flush();assert.equal(app.calls.length,calls);app.dialog.close();
 }
});

test('moderation warning is spoken locally and resumes listening without model reply',async()=>{
 const {app,channel,track}=await start();const warning='Я кот учёный — давай без ругани.';
 app.setModerate({warned:true,disconnect:false,warning_text:warning,warnings:1});await askVoice(channel,'Осирис, тест предупреждения');
 const moderation=app.calls.find(call=>call.url.endsWith('/moderate'));assert.equal(JSON.parse(moderation.options.body).language,'ru');
 const responses=channel.sent.filter(message=>message.type==='response.create');assert.equal(responses.length,1);assert.equal(responses[0].response.conversation,'none');assert.match(responses[0].response.instructions,/кот учёный/);assert.equal(app.calls.some(call=>call.url.endsWith('/skill-match')),false);
 created(channel);text(channel,warning);done(channel);drained(channel);assert.equal(track.enabled,true);assert.equal(app.voiceState.peer.closed,undefined);
 app.setModerate({warned:false,disconnect:false});await askVoice(channel,'Спасибо, всё понятно','q2');assert.equal(channel.sent.filter(message=>message.type==='response.create').length,2);app.dialog.close();
});

test('moderation cooldown speaks server explanation and closes capture before farewell',async()=>{
 const {app,channel,track}=await start();app.setModerate({warned:true,banned:true,disconnect:true,warning_text:'Пауза на 3 часа.'});await askVoice(channel);
 assert.equal(track.readyState,'ended');assert.match(channel.sent.find(message=>message.type==='response.create').response.instructions,/Пауза на 3 часа/);
 created(channel);text(channel,'Пауза на 3 часа.');done(channel);drained(channel);assert.equal(app.voiceState.peer.closed,true);app.dialog.close();
});

test('native pet waits for actual playback and stops speaking at audio drain',async()=>{
 const {app,channel,audio,track}=await start();let resolvePlay;
 audio.play=()=>new Promise(resolve=>{resolvePlay=resolve});
 await askVoice(channel);created(channel);
 assert.equal(app.dialog.attrs['data-osiris-state'],'thinking');assert.equal(app.find('fjord-ai-status').attrs['data-tts-state'],'queued');assert.equal(track.enabled,true);
 resolvePlay();await flush();assert.equal(app.dialog.attrs['data-osiris-state'],'speaking');
 drained(channel);assert.equal(app.dialog.attrs['data-osiris-state'],'thinking','Audio has ended even if generation completion is delayed');assert.equal(track.enabled,true);
 done(channel);assert.equal(track.enabled,true);app.dialog.close();
});

test('blocked or stale native play promises never leave the pet speaking',async()=>{
 for(const outcome of ['blocked','stopped','drained']){
  const {app,channel,audio}=await start();let resolvePlay,rejectPlay;
  audio.play=()=>new Promise((resolve,reject)=>{resolvePlay=resolve;rejectPlay=reject});await askVoice(channel);created(channel);
  if(outcome==='blocked')rejectPlay(new Error('autoplay denied'));
  else if(outcome==='stopped'){await app.find('fjord-ai-record-fallback').emit('click');resolvePlay()}
  else{drained(channel);done(channel);resolvePlay()}
  await flush();assert.notEqual(app.dialog.attrs['data-osiris-state'],'speaking',outcome);
  if(outcome==='blocked'){assert.equal(app.dialog.attrs['data-osiris-state'],'idle');assert.equal(app.find('fjord-ai-status').attrs['data-tts-error'],'not-allowed')}
  app.dialog.close();
 }
});

test('local native replay also waits for play success and clears its state after rejection',async()=>{
 const {app,channel,audio}=await start();audio.play=()=>Promise.reject(new Error('blocked'));await askVoice(channel);created(channel);await flush();text(channel);done(channel);drained(channel);
 const create=app.document.createElement;let resolvePlay,rejectPlay;
 app.document.createElement=tag=>{const element=create(tag);if(tag==='audio')element.play=()=>new Promise((resolve,reject)=>{resolvePlay=resolve;rejectPlay=reject});return element};
 await app.find('fjord-ai-voice fjord-ai-read-answer').emit('click');assert.equal(app.dialog.attrs['data-osiris-state'],'thinking');resolvePlay();await flush();assert.equal(app.dialog.attrs['data-osiris-state'],'speaking');
 const replay=app.dialog.children.find(item=>item.tag==='audio');replay.onended();assert.equal(app.dialog.attrs['data-osiris-state'],'idle');
 // Simulate retry after another browser denial; no new model call is involved.
 await app.find('fjord-ai-voice fjord-ai-read-answer').emit('click');rejectPlay(new Error('blocked'));await flush();assert.equal(app.dialog.attrs['data-osiris-state'],'idle');app.dialog.close();
});


test('speech interrupts native output immediately and late cancelled events cannot kill the next turn',async()=>{
 const {app,channel,track,audio}=await start();await askVoice(channel);created(channel,'r1');
 assert.equal(track.enabled,true);const requests=app.calls.length;
 channel.message({type:'input_audio_buffer.speech_started'});
 assert.equal(audio.paused,true);assert.equal(track.enabled,true);assert.equal(app.dialog.attrs['data-osiris-state'],'listening');
 assert.equal(channel.sent.filter(event=>event.type==='output_audio_buffer.clear').length,1);
 assert.equal(channel.sent.filter(event=>event.type==='response.cancel').length,0,'Server VAD already cancels generation');
 assert.equal(app.calls.length,requests,'Speech start does not issue another paid request');
 await askVoice(channel,'Другой вопрос','q2');created(channel,'r2');
 channel.message({type:'response.done',response:{id:'r1',status:'cancelled'}});
 channel.message({type:'output_audio_buffer.cleared',response_id:'r1'});
 text(channel,'Новый ответ.','r2');done(channel,'r2');drained(channel,'r2');
 assert.equal(app.voiceState.peer.closed,undefined);assert.equal(track.enabled,true);
 assert.equal(app.find('fjord-ai-log').children.filter(item=>item.textContent==='Новый ответ.').length,1);app.dialog.close();
});

test('server cancellation before speech_started leaves a usable session without duplicate cancellation',async()=>{
 const {app,channel,track}=await start();await askVoice(channel);created(channel);
 channel.message({type:'response.done',response:{id:'r1',status:'cancelled'}});
 channel.message({type:'output_audio_buffer.cleared'});
 channel.message({type:'input_audio_buffer.speech_started'});
 assert.equal(channel.sent.filter(event=>event.type==='response.cancel').length,0);assert.equal(app.voiceState.peer.closed,undefined);assert.equal(track.enabled,true);
 await askVoice(channel,'Продолжим','q2');created(channel,'r2');text(channel,'Продолжаем.','r2');done(channel,'r2');drained(channel,'r2');assert.equal(track.enabled,true);app.dialog.close();
});

for(const command of ['Осирис, подожди','Осирис, стоять!','Osiris, wait','Osiris, stopp'])test('local pause command: '+command,async()=>{
 const {app,channel,track}=await start();await askVoice(channel);created(channel);channel.message({type:'input_audio_buffer.speech_started'});const requests=app.calls.length,responses=channel.sent.filter(event=>event.type==='response.create').length;
 await askVoice(channel,command,'q2');assert.equal(app.calls.length,requests,'Pause bypasses moderation and model calls');assert.equal(channel.sent.filter(event=>event.type==='response.create').length,responses);assert.equal(track.enabled,true);assert.equal(app.dialog.attrs['data-osiris-state'],'listening');assert.equal(app.voiceState.peer.closed,undefined);app.dialog.close();
});

test('addressed goodbye after interruption closes capture immediately without moderation or a new chat request',async()=>{
 const {app,channel,track}=await start();await askVoice(channel);created(channel);channel.message({type:'input_audio_buffer.speech_started'});const requests=app.calls.length;
 await askVoice(channel,'Осирис, всё, пока.','q2');assert.equal(track.readyState,'ended');assert.equal(track.enabled,false);assert.equal(app.calls.length,requests);
 created(channel,'farewell');done(channel,'farewell');drained(channel,'farewell');assert.equal(app.voiceState.peer.closed,true);app.dialog.close();
});
