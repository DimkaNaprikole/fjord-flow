import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=await readFile(new URL('./chat-widget.js',import.meta.url),'utf8');
const directionsSource=await readFile(new URL('./assistant-routing.js',import.meta.url),'utf8');
const directionsCatalog=JSON.parse(await readFile(new URL('./demo-data/state.json',import.meta.url),'utf8'));
class Element {
 constructor(tag){this.tag=tag;this.children=[];this.events={};this.attrs={};this.value='';this.isConnected=true;this.classList={add(){}};this.scrollHeight=100;this.hidden=false;this.checked=false;this.open=false;}
 append(...items){for(const n of items){n.parent=this;this.children.push(n)}}
 replaceChildren(...items){this.children=[];this.append(...items)}
 setAttribute(key,value){this.attrs[key]=value}
 addEventListener(key,fn){(this.events[key]??=[]).push(fn)}
 emit(key,details={}){const event={button:0,pointerId:1,isPrimary:true,preventDefault(){this.defaultPrevented=true},...details};return Promise.all((this.events[key]||[]).map(fn=>fn(event)))}
 setPointerCapture(id){this.capturedPointer=id} hasPointerCapture(id){return this.capturedPointer===id} releasePointerCapture(id){if(this.capturedPointer===id){this.capturedPointer=null;this.emit('lostpointercapture',{pointerId:id})}}
 focus(){this.focused=true} scrollIntoView(options){this.scrolled=options} showModal(){this.open=true} show(){this.open=true} close(){this.open=false;this.emit('close')} click(){this.clicked=true} dispatchEvent(event){this.dispatched=event}
 play(){this.played=true;return Promise.resolve()} pause(){this.paused=true}
 reportValidity(){return true} remove(){this.parent.children=this.parent.children.filter(x=>x!==this)}
}
const flush=async()=>{for(let n=0;n<8;n++)await new Promise(resolve=>setImmediate(resolve))};
function boot(config={enabled:true,endpoint:'https://chat.example.test',paidVoice:true},voice=false){
 const dialog=new Element('dialog'),launch=new Element('button'),events={},calls=[];const sentinel=new Element('p');dialog.append(sentinel);
 const sections=Object.fromEntries(['collection','scenicRoutes','staysSauna','cafeNearby','routeExperiences','travelStories','norwayCatalogue','buaEquipment','about','placeSearch','explorerTab0','explorerTab1','explorerTab2','explorerTab3'].map(id=>[id,new Element('section')]));
 const documentEvents={};
 const document={readyState:'complete',hidden:false,documentElement:{lang:'en'},activeElement:launch,createElement:tag=>new Element(tag),getElementById:id=>id==='fjordHelper'?dialog:sections[id]||null,querySelector:()=>launch,addEventListener:(key,fn)=>documentEvents[key]=fn,emit:key=>documentEvents[key]?.()};
 let chatReply={answer:'<img src=x onerror=alert(1)>',needs_human:false},chatStatus=200;let contactReply={recorded:true,ticket_id:'a'.repeat(64)},replyResult={status:'pending'},moderateReply={severe:false,warnings:0,banned:false},skillReply={matched:false};
 const voiceState={spoken:[],timer:null,replyTimer:null,awayTimer:null,answerTimer:null,answerDelay:null,hoverTimer:null,recordTimer:null,stopped:false,peer:null,track:null};
 const fetch=async(url,options={})=>{calls.push({url,options});if(url==='./chat-config.json')return{ok:true,json:async()=>config};if(url.startsWith('./demo-data/state.json'))return{ok:true,json:async()=>directionsCatalog};if(url.endsWith('/health')){if(config.healthFailures>0){config.healthFailures--;throw Error('Temporary health failure')}return{ok:true,json:async()=>({ready:true})}};if(url.endsWith('/live-session'))return{ok:true,text:async()=>('v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n')};if(url.endsWith('/transcribe'))return{ok:true,json:async()=>({text:'Vis meg Lofoten',language:'no'})};if(url.endsWith('/moderate'))return{ok:true,json:async()=>moderateReply};if(url.endsWith('/skill-match'))return{ok:true,json:async()=>skillReply};if(url.endsWith('/chat'))return{ok:chatStatus===200,status:chatStatus,json:async()=>chatReply};if(url.includes('/ticket-reply?'))return{ok:true,json:async()=>replyResult};return{ok:true,json:async()=>contactReply}};
 class FakeRecorder { static isTypeSupported(type){return type==='audio/webm'} constructor(_stream,options){this.mimeType=options.mimeType;this.state='inactive'} start(){this.state='recording'} stop(){this.state='inactive';this.ondataavailable?.({data:new Blob([new Uint8Array(1000)],{type:'audio/webm'})});this.onstop?.()} }
 class FakeChannel {constructor(){this.readyState='connecting';this.sent=[]}send(value){this.sent.push(JSON.parse(value))}close(){this.readyState='closed'}message(value){this.onmessage?.({data:JSON.stringify(value)})}}
 class FakePeer {constructor(){voiceState.peer=this;this.connectionState='new'}addTrack(){}createDataChannel(){this.channel=new FakeChannel();return this.channel}async createOffer(){return{sdp:'v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n'+'.'.repeat(120)}}async setLocalDescription(){}async setRemoteDescription(){this.channel.readyState='open';this.channel.onopen?.()}close(){this.closed=true}}
 const synthesis={cancel(){},speak(utterance){voiceState.spoken.push(utterance.text)}};
 const browserWindow={addEventListener:(k,f)=>events[k]=f,emit:(key,details={})=>events[key]?.({preventDefault(){},...details})};
 if(voice){browserWindow.MediaRecorder=FakeRecorder;browserWindow.RTCPeerConnection=FakePeer;browserWindow.speechSynthesis=synthesis}
 const context={document,window:browserWindow,navigator:{},fetch,URL,Event:class{constructor(type){this.type=type}},AbortController,Blob,FormData,encodeURIComponent,matchMedia:()=>({matches:true}),setInterval,clearInterval,setTimeout:(fn,ms)=>{if(ms===10000){voiceState.initRetry=fn;return 785}if(ms===60000){voiceState.holdTimer=fn;return 783}if(ms===4000){voiceState.finalizeTimer=fn;return 784}if(ms===30000){voiceState.recordTimer=fn;return 782}if(voice&&ms===600000){voiceState.timer=fn;return 777}if(ms===15000){voiceState.replyTimer=fn;return 778}if(ms===5000){voiceState.awayTimer=fn;return 779}if(ms===500){voiceState.hoverTimer=fn;return 781}if(voice&&(ms===400||ms===2500)){voiceState.answerTimer=fn;voiceState.answerDelay=ms;return 780}return setTimeout(fn,ms)},clearTimeout:id=>{if(![777,778,779,780,781,782,783,784,785].includes(id))clearTimeout(id)}};
 if(voice){context.RTCPeerConnection=FakePeer;context.MediaRecorder=FakeRecorder;context.navigator={mediaDevices:{getUserMedia:async()=>{const track={stop(){voiceState.stopped=true}};voiceState.track=track;return{getAudioTracks:()=>[track],getTracks:()=>[track]}}}};context.speechSynthesis=synthesis;context.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};browserWindow.SpeechSynthesisUtterance=context.SpeechSynthesisUtterance}
 vm.runInNewContext(directionsSource,context);vm.runInNewContext(source,context);
 return{dialog,launch,calls,sentinel,sections,voiceState,browserWindow,document,setChat:(r,status=200)=>{chatReply=r;chatStatus=status},setContact:r=>contactReply=r,setReply:r=>replyResult=r,setModerate:r=>moderateReply=r,setSkill:r=>skillReply=r,find:cls=>{const visit=n=>n.className===cls?n:n.children?.map(visit).find(Boolean);return visit(dialog)}};
}
{
 const a=boot({enabled:false});await flush();assert.equal(a.dialog.children[0],a.sentinel);assert.equal(a.calls.length,1);
 const b=boot({enabled:true,endpoint:'http://untrusted.example'});await flush();assert.equal(b.dialog.children[0],b.sentinel);assert.equal(b.calls.length,1);
}
const a=boot();await flush();assert.equal(a.calls.length,2,'Only config and health before interaction');a.launch.onclick();assert.equal(a.dialog.open,true);assert.equal(a.calls.length,2,'Opening never sends a message');
{
 const app=boot();await flush();app.launch.onclick();const form=app.find('fjord-ai-compose'),input=form.children.find(n=>n.tag==='textarea'),routeButton=new Element('button');routeButton.dataset={roadtrip:'hadeland'};app.document.querySelector=selector=>selector==='[data-roadtrip="hadeland"]'?routeButton:null;app.browserWindow.FjordTripTools={localRoutes:{hadeland:{}}};
 input.value='Я еду из Грана. Хочу красивую поездку на один день, кафе рядом и без длинного перегона. Что посоветуешь?';await form.emit('submit');await flush();assert.equal(app.calls.filter(c=>c.url.endsWith('/chat')).length,0,'Available local day trip needs no GPT request');const log=app.find('fjord-ai-log');assert.ok(log.children.some(n=>n.textContent?.includes('Granavollen')));assert.ok(log.children.some(n=>n.textContent?.includes('Kistefos')));const guide=log.children.find(n=>n.tag==='button'&&n.textContent==='Открыть маршрут из Грана');assert.ok(guide);guide.onclick();assert.equal(app.dialog.open,false);assert.equal(routeButton.clicked,true,'The existing itinerary action opens the actual route');
 app.launch.onclick();input.value='Какие кафе рядом открыты сейчас?';await form.emit('submit');await flush();assert.equal(app.calls.filter(c=>c.url.endsWith('/chat')).length,1,'Cafe and opening-hour questions are not swallowed by a day-trip suggestion');app.dialog.close();console.log('PASS: Gran day-trip action uses a real itinerary without GPT, while cafe-only questions continue to the assistant.');
}
{
 const app=boot();await flush();app.launch.onclick();const form=app.find('fjord-ai-compose'),input=form.children.find(n=>n.tag==='textarea');
 for(const q of ['Я еду из Грана. Хочу красивую поездку на один день, кафе рядом и без длинного перегона. Что посоветуешь?','I am leaving from Gran, I want a short day trip']){const before=app.calls.filter(c=>c.url.endsWith('/chat')).length;input.value=q;await form.emit('submit');await flush();assert.equal(app.calls.filter(c=>c.url.endsWith('/chat')).length,before+1,'Mixed request reaches the assistant instead of being swallowed');assert.equal(app.find('fjord-ai-origin').children[0].textContent,'Start: Gran','Only the place is remembered');}
 input.value='Suggest a short trip nearby';await form.emit('submit');await flush();const posted=JSON.parse(app.calls.findLast(c=>c.url.endsWith('/chat')).options.body);assert.equal(posted.messages.at(-1).content,'My saved trip starting point is Gran.\nQuestion: Suggest a short trip nearby');assert.ok(!app.find('fjord-ai-log').children.some(n=>n.textContent?.includes('My saved trip starting point')),'Context is not displayed as a visitor message');assert.ok(posted.messages.slice(0,-1).every(n=>!n.content.includes('My saved trip starting point')),'Origin context does not accumulate in history');
 input.value='Я еду из Грана. Маршрут до Осло';await form.emit('submit');await flush();const map=app.find('fjord-ai-log').children.findLast(n=>n.tag==='a'&&n.href?.includes('/maps/dir/'));assert.equal(new URL(map.href).searchParams.get('origin'),'Gran');assert.equal(new URL(map.href).searchParams.get('destination'),'Oslo');assert.equal(app.calls.filter(c=>c.url.endsWith('/chat')).length,3,'Mixed explicit directions stay local');
 input.value='Please contact the owner';await app.find('fjord-ai-human').emit('click');await flush();const human=JSON.parse(app.calls.findLast(c=>c.url.endsWith('/chat')).options.body);assert.equal(human.request_human,true);assert.equal(human.messages.at(-1).content,'Please contact the owner','Owner handoff remains untouched');app.dialog.close();console.log('PASS: mixed origin and request, clean local directions, short GPT origin context without persistent duplication or handoff changes.');
}
const form=a.find('fjord-ai-compose'),input=form.children.find(n=>n.tag==='textarea');input.value='What should we see?';await form.emit('submit');await flush();assert.equal(a.calls.filter(c=>c.url.endsWith('/chat')).length,1);assert.equal(input.value,'');assert.equal(a.find('fjord-ai-log').children.at(-1).textContent,'<img src=x onerror=alert(1)>','Model text remains textContent');
a.setChat({answer:'I can pass that along.',needs_human:true,escalation_token:'signed-token'});input.value='My specific question';await a.find('fjord-ai-human').emit('click');await flush();const posted=JSON.parse(a.calls.filter(c=>c.url.endsWith('/chat')).at(-1).options.body);assert.equal(posted.request_human,true);assert.equal(posted.messages.at(-1).content,'My specific question');
const handoff=a.find('fjord-ai-handoff'),email=handoff.children.find(n=>n.type==='email'),consent=handoff.children.find(n=>n.className==='fjord-ai-consent').children[0];assert.equal(handoff.hidden,false);assert.equal(consent.checked,false);assert.equal(email.hidden,true,'Email is not requested for Codex handoff');await handoff.emit('submit');assert.equal(a.calls.filter(c=>c.url.endsWith('/contact')).length,0,'No contact without explicit consent');
consent.checked=true;a.setContact({recorded:false});await handoff.emit('submit');assert.equal(handoff.hidden,false);assert.ok(a.find('fjord-ai-status').textContent.includes('Could not save'));
a.setContact({recorded:true,ticket_id:'a'.repeat(64)});await handoff.emit('submit');await flush();assert.equal(handoff.hidden,true);const contactBody=JSON.parse(a.calls.filter(c=>c.url.endsWith('/contact')).at(-1).options.body);assert.equal('email' in contactBody,false,'Handoff does not send visitor email');assert.ok(a.find('fjord-ai-status').textContent.includes('saved in the Codex inbox'));assert.ok(!a.find('fjord-ai-status').textContent.includes('delivered'));a.setChat({answer:'Try the Hardanger route.',needs_human:false});await a.voiceState.awayTimer();await flush();assert.ok(a.find('fjord-ai-log').children.some(item=>item.textContent.includes('administrator has not replied')),'After 5 seconds Afonya discloses that the administrator is unavailable');assert.ok(!a.find('fjord-ai-log').children.some(item=>item.textContent.includes('as an AI helper')),'Owner waiting notice does not generate a duplicate GPT answer');a.setReply({status:'answered',answer:'Try Hardanger.'});await a.voiceState.replyTimer();await flush();assert.ok(a.find('fjord-ai-log').children.some(item=>item.textContent.includes('Try Hardanger.')),'Confirmed Codex reply appears in visitor chat');
console.log('PASS: disabled/unsafe config fallback, no send on open, text-only replies, human bypass request, explicit consent, failure preservation, truthful submission confirmation.');
for(const locale of ['en','nb','uk','sv','da']){assert.match(source,new RegExp(locale+":\\[[^\\n]+OpenAI[^\\n]+30"),'Privacy names OpenAI and 30-day enquiry retention: '+locale)}
a.setChat({answer:null});input.value='My question after the service fails';await form.emit('submit');await flush();assert.equal(input.value,'My question after the service fails');assert.ok(decodeURIComponent(a.find('fjord-ai-email').href).includes(input.value),'Failed question is preserved in owner email draft');console.log('PASS: all five privacy notices and failed-question email fallback.');

const navigation=boot();await flush();navigation.launch.onclick();
const navigationForm=navigation.find('fjord-ai-compose'),navigationInput=navigationForm.children.find(n=>n.tag==='textarea'),navigationLog=navigation.find('fjord-ai-log');
navigation.setChat({answer:'Выберите раздел.',navigation:[{section:'scenicRoutes',label:'Book now'},{section:'staysSauna'},{section:'unknown'},{section:'scenicRoutes'},{section:'travelStories'}]});
delete navigation.sections.travelStories;
navigationInput.value='Покажи маршрут и домик с сауной';await navigationForm.emit('submit');await flush();
let guides=navigationLog.children.filter(n=>n.className==='fjord-ai-guide');
assert.equal(guides.length,2,'Two real goals, duplicates/unknown/missing DOM targets rejected');
assert.equal(guides[0].textContent,'Открыть: Красивые маршруты ↗','Local Russian labels override model-supplied text');
assert.equal(guides[1].textContent,'Открыть: Домики и сауны ↗');
assert.equal(JSON.parse(navigation.calls.findLast(c=>c.url.endsWith('/chat')).options.body).language,'ru');
guides[1].onclick();assert.equal(navigation.dialog.open,false);assert.equal(navigation.sections.staysSauna.focused,true);assert.equal(navigation.sections.staysSauna.scrolled.block,'start');
assert.equal(navigation.calls.filter(c=>c.url.endsWith('/chat')).length,1,'Navigation is a local action with no external request');

navigation.setChat({answer:'No available section.',navigation:[]});navigationInput.value='route and sauna';await navigationForm.emit('submit');await flush();
assert.equal(navigationLog.children.filter(n=>n.className==='fjord-ai-guide').length,2,'Explicit empty backend navigation does not invent buttons');
navigation.setChat({answer:'Open the sections.'});navigationInput.value='маршрут и сауна';await navigationForm.emit('submit');await flush();
guides=navigationLog.children.filter(n=>n.className==='fjord-ai-guide');assert.equal(guides.length,4,'Legacy backend supports both route and sauna');
delete navigation.sections.scenicRoutes;guides.at(-2).onclick();
console.log('PASS: backend navigation allowlist, live DOM validation, two targets, Russian labels, local focus/scroll transition, empty-list authority and legacy two-goal fallback.');

const failures=boot();await flush();const failureForm=failures.find('fjord-ai-compose'),failureInput=failureForm.children.find(n=>n.tag==='textarea');
for(const [code,http,expected] of [['provider_rate_limit',429,'Провайдер ИИ'],['billing_limit_reached',503,'лимита расходов'],['site_minute_limit',429,'за минуту'],['site_daily_limit',429,'суточный'],['site_monthly_limit',429,'месячный'],['invalid_model_reply',502,'некорректный'],['model_reply_truncated',502,'оборвался'],['model_unavailable',502,'временно недоступен']]){
 const shouldRetry=http===429&&code!=='site_monthly_limit';failures.setChat({error:code,...(shouldRetry?{retry_after:45}:{})},http);failureInput.value='Покажи домики с сауной';const before=failures.calls.length;await failureForm.emit('submit');await flush();
 const message=failures.find('fjord-ai-status').textContent;assert.ok(message.includes(expected),code+': '+message);assert.equal(message.includes('45 сек.'),shouldRetry);assert.equal(failureInput.value,'Покажи домики с сауной');assert.equal(failures.calls.length,before+1,'No automatic retry');assert.ok(decodeURIComponent(failures.find('fjord-ai-email').href).includes(failureInput.value));
}
failures.setChat({error:'unknown'},429);failureInput.value='Show me cabins';await failureForm.emit('submit');await flush();assert.ok(failures.find('fjord-ai-status').textContent.includes('temporarily limiting requests'));assert.ok(!failures.find('fjord-ai-status').textContent.includes('free'));
console.log('PASS: provider/site-minute/site-daily limits distinguished, retry delay, invalid/truncated/unavailable replies, preserved question and no automatic retries.');

const hovered=boot(undefined,true);await flush();await hovered.launch.emit('mouseenter');await flush();assert.equal(hovered.dialog.open,true);assert.equal(hovered.calls.filter(c=>c.url.endsWith('/live-session')).length,0,'Hover never incurs a paid voice call');await hovered.launch.emit('mouseleave');hovered.voiceState.hoverTimer();assert.equal(hovered.dialog.open,false);

for(const interaction of ['pointerdown','focusin']){
 const pinned=boot();await flush();await pinned.launch.emit('mouseenter');await pinned.dialog.emit(interaction);await pinned.launch.emit('mouseleave');pinned.voiceState.hoverTimer();assert.equal(pinned.dialog.open,true,'Form interaction pins chat: '+interaction);
 await pinned.launch.emit('mouseenter');await pinned.launch.emit('mouseleave');pinned.voiceState.hoverTimer();assert.equal(pinned.dialog.open,true,'Crossing the launcher cannot unpin an active conversation');pinned.dialog.close();
}
function installRecognition(app,{endOnStop=true,startError=null,delayedStart=false}={}){
 const instances=[];
 app.browserWindow.SpeechRecognition=class{
  constructor(){instances.push(this);this.stops=0;this.aborts=0}
  start(){this.started=true;if(startError)throw Object.assign(new Error('denied'),{name:startError});if(!delayedStart)this.onstart?.()}
  stop(){this.stops++;if(endOnStop)this.onend?.()}
  abort(){this.aborts++;this.onerror?.({error:'aborted'});this.onend?.()}
  result(text,final=false){this.onresult?.({results:[Object.assign([{transcript:text}],{isFinal:final})]})}
 };
 return{instances,get last(){return instances.at(-1)}};
}
const micOf=app=>app.find('fjord-ai-compose').children.find(n=>n.className==='fjord-ai-compose-actions').children[1];
const chatCalls=app=>app.calls.filter(c=>c.url.endsWith('/chat'));
const paidCalls=app=>app.calls.filter(c=>c.url.endsWith('/transcribe')||c.url.endsWith('/live-session'));
const dictated=boot({enabled:true,endpoint:'https://chat.example.test',paidVoice:false},true);await flush();dictated.launch.onclick();await flush();dictated.document.documentElement.lang='ru';dictated.browserWindow.emit('fjordlanguagechange');
const recognition=installRecognition(dictated,{endOnStop:false}),dictationMic=micOf(dictated),dictationForm=dictated.find('fjord-ai-compose'),dictationInput=dictationForm.children.find(n=>n.tag==='textarea'),dictationLanguage=dictationForm.children.find(n=>n.className==='fjord-ai-compose-actions').children[3],dictationStatus=dictated.find('fjord-ai-status');
assert.equal(dictationForm.children.some(n=>n.className==='fjord-ai-mic-mode'),false,'No microphone mode switch is shown');
assert.equal(dictationForm.children.find(n=>n.className==='fjord-ai-compose-actions').children.filter(n=>n.tag==='select').length,1,'Only language selection remains');
assert.equal(dictationMic.attrs['aria-describedby'],'fjordAIMicHint');assert.match(dictationForm.children.find(n=>n.id==='fjordAIMicHint').textContent,/Слушаю/);
await dictationMic.emit('click');assert.equal(recognition.instances.length,0,'A generated click never starts capture');
await dictationMic.emit('pointerdown',{pointerId:5,pointerType:'mouse'});assert.equal(recognition.last.continuous,true);assert.equal(dictationMic.capturedPointer,5);assert.equal(dictationMic.attrs['aria-pressed'],'true');assert.match(dictationMic.textContent,/Слушаю/);
recognition.last.result('Покажи водопады',true);await flush();assert.equal(chatCalls(dictated).length,0,'Final recognition while held does not send');
await dictationMic.emit('pointerup',{pointerId:6});assert.equal(recognition.last.stops,0,'Another pointer cannot release the active hold');
await dictationMic.emit('pointerup',{pointerId:5});assert.equal(recognition.last.stops,1);assert.equal(dictationMic.capturedPointer,null);assert.equal(dictationMic.attrs['aria-pressed'],'false','Release immediately ends the listening state');assert.equal(chatCalls(dictated).length,0,'Release waits for browser finalization');
recognition.last.result('Покажи водопады в Норвегии',true);recognition.last.onend();await flush();assert.equal(chatCalls(dictated).length,1);assert.equal(JSON.parse(chatCalls(dictated)[0].options.body).messages.at(-1).content,'Покажи водопады в Норвегии');
recognition.last.onend();await dictationMic.emit('pointerup',{pointerId:5});await dictationMic.emit('click');await flush();assert.equal(chatCalls(dictated).length,1,'Duplicate end/up/click events never resend');
assert.equal(paidCalls(dictated).length,0,'Default hold-to-talk never starts paid audio');
console.log('PASS: hold starts capture, final text waits for release, release finalizes and sends once, pointer ownership and no click/paying fallback.');

for(const pointerType of ['touch','pen']){
 const app=boot({enabled:true,endpoint:'https://chat.example.test',paidVoice:true},true);await flush();app.launch.onclick();const fake=installRecognition(app),button=micOf(app);
 await button.emit('pointerdown',{pointerId:9,pointerType});fake.last.result('A held question.',true);await button.emit('pointerup',{pointerId:9,pointerType});await flush();assert.equal(chatCalls(app).length,1,pointerType+' sends on release');assert.equal(paidCalls(app).length,0,'Even stale paidVoice config cannot trigger audio billing');app.dialog.close();
}
for(const key of [' ','Enter']){
 const app=boot({enabled:true,endpoint:'https://chat.example.test',paidVoice:false});await flush();app.launch.onclick();const fake=installRecognition(app),button=micOf(app);
 await button.emit('keydown',{key});await button.emit('keydown',{key,repeat:true});assert.equal(fake.instances.length,1,'Key repeat does not restart recognition');fake.last.result('Keyboard question.',true);assert.equal(chatCalls(app).length,0);await button.emit('keyup',{key:'Escape'});assert.equal(fake.last.stops,0);await button.emit('keyup',{key});await button.emit('click');await flush();assert.equal(fake.last.stops,1);assert.equal(chatCalls(app).length,1,key+' sends once on key release');app.dialog.close();
}
console.log('PASS: touch, pen, keyboard Space/Enter and repeat suppression all use the same free hold/release flow.');

for(const cancel of ['pointercancel','lostpointercapture','button-blur','window-blur','hidden','close']){
 const app=boot({enabled:true,endpoint:'https://chat.example.test',paidVoice:false});await flush();app.launch.onclick();const fake=installRecognition(app),button=micOf(app);await button.emit('pointerdown',{pointerId:12});fake.last.result('Unsent editable draft');
 if(cancel==='button-blur')await button.emit('blur');else if(cancel==='window-blur')app.browserWindow.emit('blur');else if(cancel==='hidden'){app.document.hidden=true;app.document.emit('visibilitychange')}else if(cancel==='close')app.dialog.close();else await button.emit(cancel,{pointerId:12});
 assert.equal(fake.last.aborts,1,cancel+' aborts capture');assert.equal(button.attrs['aria-pressed'],'false');assert.equal(button.capturedPointer,null);assert.equal(chatCalls(app).length,0,cancel+' never sends');assert.equal(app.find('fjord-ai-compose').children.find(n=>n.tag==='textarea').value,'Unsent editable draft');fake.last.onend();await button.emit('pointerup',{pointerId:12});assert.equal(chatCalls(app).length,0);app.dialog.close();
}
const outside=boot();await flush();outside.launch.onclick();const outsideRecognition=installRecognition(outside),outsideMic=micOf(outside);outsideMic.setPointerCapture=()=>{throw Error('unsupported capture')};await outsideMic.emit('pointerdown',{pointerId:33});outsideRecognition.last.result('Release outside the button.');outside.browserWindow.emit('pointerup',{pointerId:33});await flush();assert.equal(chatCalls(outside).length,1,'Window pointerup releases if pointer capture is unavailable');outside.dialog.close();
console.log('PASS: cancellation, lost capture, blur, hidden tab, close and outside release cannot leave capture stuck or send cancelled speech.');

const errors=boot({enabled:true,endpoint:'https://chat.example.test',paidVoice:false});await flush();errors.launch.onclick();errors.document.documentElement.lang='ru';errors.browserWindow.emit('fjordlanguagechange');const errorRecognition=installRecognition(errors),errorMic=micOf(errors),errorStatus=errors.find('fjord-ai-status');
for(const [code,expected] of [['not-allowed','Разрешите микрофон'],['service-not-allowed','службу распознавания'],['audio-capture','получить звук'],['network','не отвечает по сети'],['language-not-supported','Этот язык недоступен']]){
 await errorMic.emit('pointerdown');const previous=errorRecognition.last;previous.onerror({error:code});previous.onend();assert.equal(errorStatus.attrs['data-speech-error'],code);assert.ok(errorStatus.textContent.includes(expected),code);assert.equal(errorMic.attrs['aria-pressed'],'false');assert.equal(errorMic.capturedPointer,null);
 await errorMic.emit('pointerdown');previous.onerror({error:'network'});assert.equal(errorMic.attrs['aria-pressed'],'true','Late failed-session events cannot cancel a new hold');await errorMic.emit('pointercancel');
}
assert.equal(chatCalls(errors).length,0);assert.equal(paidCalls(errors).length,0);
delete errors.browserWindow.SpeechRecognition;await errorMic.emit('pointerdown');assert.equal(errorStatus.attrs['data-speech-error'],'unsupported');assert.equal(errorMic.capturedPointer,null);
installRecognition(errors,{startError:'NotAllowedError'});await errorMic.emit('keydown',{key:' '});assert.equal(errorStatus.attrs['data-speech-error'],'not-allowed');assert.equal(errorMic.attrs['aria-pressed'],'false');errors.dialog.close();
console.log('PASS: specific speech/permission/unsupported errors, failed-start cleanup and stale-event isolation without paid fallback.');

const ending=boot({enabled:true,endpoint:'https://chat.example.test',paidVoice:false});await flush();ending.launch.onclick();const endingRecognition=installRecognition(ending,{endOnStop:false}),endingMic=micOf(ending),endingLanguage=ending.find('fjord-ai-compose').children.find(n=>n.className==='fjord-ai-compose-actions').children[3];endingLanguage.value='nb-NO';
await endingMic.emit('pointerdown');endingRecognition.last.result('Vis meg rutene',true);const firstRun=endingRecognition.last;firstRun.onend();assert.equal(chatCalls(ending).length,0,'Natural recognition end while held waits for release');assert.equal(endingRecognition.instances.length,2,'Natural end restarts recognition while held');firstRun.result('stale');endingRecognition.last.result('ved fjorden',true);endingRecognition.last.onerror({error:'no-speech'});await endingMic.emit('pointerup');endingRecognition.last.onend();await flush();assert.equal(chatCalls(ending).length,1);assert.equal(JSON.parse(chatCalls(ending)[0].options.body).language,'no');assert.equal(JSON.parse(chatCalls(ending)[0].options.body).messages.at(-1).content,'Vis meg rutene ved fjorden','Restart keeps distinct phrases separated without stale results or no-speech loss');
await endingMic.emit('pointerdown');endingRecognition.last.result('Keep this partial draft');await endingMic.emit('pointerup');ending.voiceState.finalizeTimer();assert.equal(endingRecognition.last.aborts,1,'A stalled finalization aborts capture');assert.equal(ending.find('fjord-ai-compose').children.find(n=>n.tag==='textarea').value,'Keep this partial draft');assert.equal(chatCalls(ending).length,1,'Stalled partial speech remains editable instead of being sent');
await endingMic.emit('pointerdown');endingRecognition.last.result('A very long hold');ending.voiceState.holdTimer();assert.equal(endingRecognition.last.aborts,1);assert.equal(endingMic.attrs['aria-pressed'],'false');assert.equal(chatCalls(ending).length,1,'The safety deadline cancels without sending');ending.dialog.close();
console.log('PASS: natural browser end waits for release, Norwegian locale maps correctly, finalization/hold timeouts safely retain drafts.');

const delayed=boot(undefined,true);await flush();delayed.launch.onclick();const delayedRecognition=installRecognition(delayed,{delayedStart:true}),delayedMic=micOf(delayed),delayedStatus=delayed.find('fjord-ai-status');
await delayedMic.emit('pointerdown');const notReady=delayedRecognition.last;assert.match(delayedStatus.textContent,/Starting/);assert.equal(delayedMic.attrs['aria-pressed'],'false','Permission/start delay never claims to listen');await delayedMic.emit('pointerup');assert.equal(notReady.aborts,1);notReady.onstart();notReady.result('late speech');notReady.onend();assert.equal(chatCalls(delayed).length,0,'Release before ready cancels, and late callbacks cannot send');
await delayedMic.emit('pointerdown');delayedRecognition.last.onstart();assert.equal(delayedMic.attrs['aria-pressed'],'true');delayedRecognition.last.result('First phrase',true);delayedRecognition.last.onend();await delayedMic.emit('pointerup');await flush();assert.equal(chatCalls(delayed).length,1,'Release during a restart sends already heard text once');
await delayedMic.emit('pointerdown');for(let i=0;i<4;i++){delayedRecognition.last.onstart();delayedRecognition.last.onend()}assert.equal(delayedRecognition.instances.length,7,'Restart attempts are bounded to three per hold');await delayedMic.emit('pointerup');delayed.dialog.close();
const locales=boot();await flush();locales.launch.onclick();const localeMic=micOf(locales),localeSelect=locales.find('fjord-ai-compose').children.find(n=>n.className==='fjord-ai-compose-actions').children[3];locales.document.documentElement.lang='nb';locales.browserWindow.emit('fjordlanguagechange');assert.equal(localeSelect.value,'nb-NO','Default microphone follows site language');localeSelect.value='ru-RU';await localeSelect.emit('change');locales.document.documentElement.lang='en';locales.browserWindow.emit('fjordlanguagechange');assert.equal(localeSelect.value,'ru-RU','Explicit microphone language survives site language changes');const localRecognition=installRecognition(locales,{delayedStart:true});await localeMic.emit('pointerdown');assert.match(locales.find('fjord-ai-status').textContent,/Подключаю/);localRecognition.last.onstart();assert.match(locales.find('fjord-ai-status').textContent,/Слушаю/);await localeMic.emit('pointercancel');locales.dialog.close();
console.log('PASS: delayed start/early release, restart release, bounded recovery and microphone-language UI/default selection.');

const manual=boot({enabled:true,endpoint:'https://chat.example.test',paidVoice:false});await flush();manual.launch.onclick();const manualRecognition=installRecognition(manual,{endOnStop:false}),manualMic=micOf(manual),manualForm=manual.find('fjord-ai-compose');
await manualMic.emit('pointerdown');manualRecognition.last.result('A manually submitted draft');await manualMic.emit('pointerup');const pendingRecognition=manualRecognition.last;await manualForm.emit('submit');await flush();pendingRecognition.onend();await flush();assert.equal(chatCalls(manual).length,1,'Manual Send cancels pending dictation before submitting once');assert.equal(pendingRecognition.aborts,1);
await manualMic.emit('keydown',{key:'Enter'});manualRecognition.last.result('A message for the owner');const ownerRecognition=manualRecognition.last;await manual.find('fjord-ai-human').emit('click');await flush();ownerRecognition.onend();await manualMic.emit('keyup',{key:'Enter'});await flush();assert.equal(chatCalls(manual).length,2,'Owner handoff cancels active dictation instead of sending it twice');assert.equal(JSON.parse(chatCalls(manual)[1].options.body).request_human,true);manual.dialog.close();
console.log('PASS: manual Send and Contact owner cancel in-flight dictation and submit exactly once.');

{
 const fallback=boot(undefined,true);await flush();fallback.launch.onclick();const button=fallback.find('fjord-ai-record-fallback');assert.equal(button.hidden,false,'Click-to-record is available immediately');assert.equal(micOf(fallback).hidden,true,'Hold-to-talk is hidden');const recognition=installRecognition(fallback);await micOf(fallback).emit('pointerdown');recognition.last.onerror({error:'network'});assert.equal(button.hidden,false);assert.equal(paidCalls(fallback).length,0,'Network errors never start paid audio automatically');await button.emit('click');assert.equal(button.attrs['aria-pressed'],'true');assert.equal(fallback.calls.filter(c=>c.url.endsWith('/transcribe')).length,0,'Starting recording never uploads audio');await button.emit('click');await flush();assert.equal(fallback.calls.filter(c=>c.url.endsWith('/transcribe')).length,1,'Explicit stop uploads one short recording');assert.equal(button.attrs['aria-pressed'],'false');assert.equal(chatCalls(fallback).length,1,'Auto-send posts the recognized question exactly once');assert.equal(JSON.parse(chatCalls(fallback)[0].options.body).messages.at(-1).content,'Vis meg Lofoten');const auto=fallback.find('fjord-ai-auto-send').children[0];auto.checked=false;await button.emit('click');await button.emit('click');await flush();assert.equal(fallback.find('fjord-ai-compose').children.find(n=>n.tag==='textarea').value,'Vis meg Lofoten');assert.equal(chatCalls(fallback).length,1,'Manual mode preserves draft without another chat request');await button.emit('click');fallback.dialog.close();await flush();assert.equal(fallback.calls.filter(c=>c.url.endsWith('/transcribe')).length,2,'Closing cancels capture without uploading');assert.equal(fallback.voiceState.stopped,true);
 console.log('PASS: failed browser speech offers explicit short recording; no automatic spend, one upload on stop, editable draft and close cancels capture.');
}

{
 const routes=boot();await flush();routes.launch.onclick();const form=routes.find('fjord-ai-compose'),input=form.children.find(n=>n.tag==='textarea');input.value='Как доехать из Грана в Берген?';await form.emit('submit');await flush();const log=routes.find('fjord-ai-log');const map=log.children.find(n=>n.tag==='a'&&n.href?.startsWith('https://www.google.com/maps/dir/'));assert.ok(map,'Real directions link appears in chat');assert.equal(new URL(map.href).searchParams.get('origin'),'Gran');assert.ok(log.children.some(n=>n.tag==='button'&&n.textContent.includes('Bergen')),'Known visible place gets its own site action');assert.equal(chatCalls(routes).length,0,'Directions do not spend GPT requests');input.value='Покажи маршрут до Drammen';await form.emit('submit');await flush();assert.equal(log.children.filter(n=>n.tag==='a').length,2);assert.equal(log.children.filter(n=>n.tag==='button').length,1,'An unknown place does not get a fake site card');assert.equal(routes.calls.filter(c=>c.url.startsWith('./demo-data/state.json')).length,1,'Public catalogue is reused');routes.dialog.close();console.log('PASS: chat renders Maps plus real catalogue action, unknown places only Maps, and no GPT requests.');
}

{
 const app=boot();await flush();app.launch.onclick();const form=app.find('fjord-ai-compose'),input=form.children.find(n=>n.tag==='textarea');for(const q of ['Я еду из Грана','Маршрут до Осло','Теперь еду из Бергена','Маршрут до Drammen']){input.value=q;await form.emit('submit');await flush()}const maps=app.find('fjord-ai-log').children.filter(n=>n.tag==='a');assert.equal(new URL(maps[0].href).searchParams.get('origin'),'Gran');assert.equal(new URL(maps[1].href).searchParams.get('origin'),'Bergen');assert.equal(app.find('fjord-ai-origin').hidden,false);await app.find('fjord-ai-origin').children[1].emit('click');input.value='Маршрут до Осло';await form.emit('submit');await flush();assert.equal(new URL(app.find('fjord-ai-log').children.filter(n=>n.tag==='a').at(-1).href).searchParams.has('origin'),false);assert.equal(app.find('fjord-ai-origin').hidden,true);assert.equal(chatCalls(app).length,0);app.dialog.close();console.log('PASS: origin statements, repeated routes and visible reset work in chat without GPT calls.');
}

{
 const app=boot(undefined,true);await flush();app.launch.onclick();await app.find('fjord-ai-record-fallback').emit('click');app.voiceState.recordTimer();await flush();assert.equal(app.calls.filter(c=>c.url.endsWith('/transcribe')).length,1);assert.equal(chatCalls(app).length,1,'The 30-second stop sends the captured question once instead of discarding it');app.dialog.close();console.log('PASS: reaching the recording deadline preserves and processes the question.');
 const recovering=boot({enabled:true,endpoint:'https://chat.example.test',healthFailures:1});await flush();assert.equal(recovering.dialog.children[0],recovering.sentinel);assert.ok(recovering.voiceState.initRetry);recovering.voiceState.initRetry();await flush();assert.ok(recovering.find('fjord-ai-compose'),'Chat initializes after a transient health failure');assert.equal(chatCalls(recovering).length,0,'Health recovery never submits a question');console.log('PASS: bounded initialization retry recovers from a transient health failure without GPT requests.');
}


{
 const guide=boot();await flush();guide.launch.onclick();
 const form=guide.find('fjord-ai-compose'),input=form.children.find(n=>n.tag==='textarea');
 guide.setChat({answer:'Откройте каталог и BUA.',navigation:['norwayCatalogue','buaEquipment']});
 input.value='Покажи места рядом и снаряжение BUA';await form.emit('submit');await flush();
 const buttons=guide.find('fjord-ai-log').children.filter(n=>n.className==='fjord-ai-guide');
 assert.deepEqual(buttons.map(n=>n.textContent),['Открыть: Места рядом ↗','Открыть: Снаряжение BUA ↗']);
 buttons[1].onclick();assert.equal(guide.sections.buaEquipment.focused,true);
 console.log('PASS: informational guide offers real local-catalogue and BUA navigation with local translated labels.');
}
