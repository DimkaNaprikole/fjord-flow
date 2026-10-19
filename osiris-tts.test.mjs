import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const source=await readFile(new URL('./chat-widget.js',import.meta.url),'utf8');
const languageCode=source.slice(source.indexOf('function speechLanguageCode('),source.indexOf('const serviceErrors='));
const speechCode=source.slice(source.indexOf('let ttsVoiceCleanup='),source.indexOf('\nfunction refresh(){'));
assert.ok(languageCode&&speechCode,'Test the shipped language and speech functions');
const russian={lang:'ru-RU',name:'Russian'},norwegian={lang:'nb-NO',name:'Norwegian'},english={lang:'en-US',name:'English'};

function fixture({voices=[russian,norwegian,english],page='nb',heard='',conversation=false,blocked=false}={}){
 const timers=new Map(),listeners=new Map(),played=[],attributes={},events={},calls={resume:0,stop:0,pin:0},pets=[];let nextTimer=1;
 const synth={voices,paused:false,cancel(){},getVoices(){return this.voices},resume(){this.paused=false;calls.unpause=(calls.unpause||0)+1},addEventListener(name,fn){(listeners.get(name)||listeners.set(name,new Set()).get(name)).add(fn)},removeEventListener(name,fn){listeners.get(name)?.delete(fn)},speak(utterance){played.push(utterance);if(blocked)utterance.onerror?.({error:'not-allowed'});else utterance.onstart?.()}};
 const sandbox={window:{speechSynthesis:synth,SpeechSynthesisUtterance:class{constructor(text){this.text=text}}},config:{voiceConversation:true},dialog:{open:true},speaker:{setAttribute(){},addEventListener(name,fn){events[name]=fn}},status:{setAttribute(name,value){attributes[name]=value},textContent:''},lang:()=>page,clearTimeout:id=>timers.delete(id),setTimeout:(fn,ms)=>{const id=nextTimer++;timers.set(id,{fn,ms});return id},setPet:value=>pets.push(value),microphoneMuted:value=>calls.muted=value,pinAssistant:()=>calls.pin++,resumeLiveConversation:()=>calls.resume++,stopLive:()=>{calls.stop++;sandbox.voiceMode=false},endVoice:()=>{sandbox.voiceMode=false;vm.runInContext('cancelSpeech()',context)},speechGeneration:0,speakingAnswer:false,activeUtterance:null,lastHeardLanguage:heard,ttsStartTimer:null,liveDeadline:null,voiceMode:conversation,liveMode:'conversation'};
 const context=vm.createContext(sandbox);vm.runInContext(languageCode+'\n'+speechCode+'\nthis.api={speakAnswer,answerVoiceLanguage,questionLanguage,cancelSpeech};',context);
 return{...sandbox,api:sandbox.api,synth,played,attributes,timers,listeners,calls,events,pets,get speaking(){return sandbox.speakingAnswer},setPage(value){page=value},setVoices(value){synth.voices=value;for(const fn of [...(listeners.get('voiceschanged')||[])])fn()},fire(ms){const entry=[...timers].find(([,v])=>v.ms===ms);assert.ok(entry,'Pending timer '+ms);timers.delete(entry[0]);entry[1].fn()},state:()=>({answer:vm.runInContext('lastVoiceAnswer',context),hint:vm.runInContext('lastVoiceHint',context)})};
}

test('actual Russian answer wins over Norwegian page, hint and default voice',()=>{
 const app=fixture({heard:'no'});app.api.speakAnswer('Привет! Я Осирис. Чем могу помочь?','no');
 assert.equal(app.played.length,1);assert.equal(app.played[0].voice,russian);assert.equal(app.played[0].lang,'ru-RU');assert.equal(app.attributes['data-tts-language'],'ru-RU');assert.equal(app.attributes['data-tts-voice-language'],'ru-RU');
 app.played[0].onend();assert.equal(app.attributes['data-tts-state'],'ended');
});

test('Russian text never falls back to a Norwegian-only voice',()=>{
 const app=fixture({voices:[norwegian],conversation:true});app.api.speakAnswer('Привет! Расскажу о Норвегии.','nb');
 assert.equal(app.played.length,0);assert.equal(app.speaking,true,'Keep pending answer alive while voices are loading');assert.equal(app.calls.muted,true);
 app.fire(2500);assert.equal(app.played.length,0);assert.equal(app.attributes['data-tts-error'],'voice-unavailable');assert.match(app.status.textContent,/ru-RU/);assert.equal(app.calls.stop,1);assert.equal(app.calls.resume,0);assert.equal(app.speaker.hidden,false,'Local replay remains available');assert.equal(app.listeners.get('voiceschanged').size,0);assert.equal(app.state().answer,'Привет! Расскажу о Норвегии.');
});

test('Russian voice arriving in voiceschanged speaks once and resumes conversation',()=>{
 const app=fixture({voices:[],conversation:true});app.api.speakAnswer('Рядом есть красивый водопад.','ru');assert.equal(app.played.length,0);
 app.setVoices([norwegian]);assert.equal(app.played.length,0,'Partial voice list must not select another language');
 app.setVoices([norwegian,russian]);assert.equal(app.played.length,1);assert.equal(app.played[0].voice,russian);assert.equal(app.listeners.get('voiceschanged').size,0);assert.equal(app.timers.size,0,'Loading and start timers are cleared');
 app.setVoices([russian]);assert.equal(app.played.length,1);app.played[0].onend();assert.equal(app.calls.resume,1);assert.equal(app.calls.stop,0);assert.equal(app.calls.muted,false);
});

test('late voice without event is picked up by bounded fallback read',()=>{
 const app=fixture({voices:[]});app.api.speakAnswer('Привет','ru');app.synth.voices=[russian];app.fire(2500);assert.equal(app.played[0].voice,russian);assert.equal(app.attributes['data-tts-state'],'speaking');
});

test('cancel and replacement cannot speak stale delayed answers',()=>{
 const app=fixture({voices:[]});app.api.speakAnswer('Первый ответ','ru');app.api.cancelSpeech();app.setVoices([russian]);assert.equal(app.played.length,0);assert.equal(app.timers.size,0);
 app.synth.voices=[];app.api.speakAnswer('Старый ответ','ru');app.api.speakAnswer('Новый ответ','ru');app.setVoices([russian]);assert.equal(app.played.length,1);assert.equal(app.played[0].text,'Новый ответ');
});

test('browser playback restriction is visible; replay uses same answer and language',()=>{
 const app=fixture({blocked:true,conversation:true,page:'ru'});app.api.speakAnswer('Русский ответ','nb');assert.equal(app.attributes['data-tts-error'],'not-allowed');assert.match(app.status.textContent,/Прослушать ответ/);assert.equal(app.calls.stop,1);assert.equal(app.speaker.hidden,false);
 app.events.click();assert.equal(app.played.length,2);assert.equal(app.played[1].voice,russian);assert.equal(app.played[1].text,'Русский ответ');assert.equal(app.calls.pin,1);
});

test('page language changes do not override detected reply or speech language',()=>{
 const app=fixture({page:'nb',heard:'ru'});
 assert.equal(app.api.answerVoiceLanguage('Могу помочь с маршрутом.','no'),'ru-RU');
 assert.equal(app.api.answerVoiceLanguage('Можу допомогти з маршрутом.','ru'),'uk-UA');
 assert.equal(app.api.answerVoiceLanguage('Hello, how can I help you?','ru'),'en-US');
 assert.equal(app.api.answerVoiceLanguage('Jeg kan hjelpe deg med en tur.','ru'),'nb-NO');
 app.setPage('sv');assert.equal(app.api.answerVoiceLanguage('Да, продолжим.','nb'),'ru-RU');
 assert.equal(app.api.answerVoiceLanguage('Osiris','ru-RU'),'ru-RU');
 assert.equal(app.api.questionLanguage('Что посмотреть?','no'),'ru');assert.equal(app.api.questionLanguage('Hej, jag är här.','nb'),'sv');
 assert.equal(app.api.questionLanguage('Takk','en'),'nb');assert.equal(app.api.questionLanguage('Osiris','ru-RU'),'ru');
});

test('voice locales are case-insensitive and Norwegian no/nb aliases match',()=>{
 const upper={lang:'RU_ru',localService:true},no={lang:'no-NO'};const app=fixture({voices:[norwegian,upper,no]});app.api.speakAnswer('Спасибо','ru');assert.equal(app.played[0].voice,upper);
 app.api.cancelSpeech();app.synth.voices=[no];app.api.speakAnswer('Takk!','nb');assert.equal(app.played[1].voice,no);assert.equal(app.played[1].lang,'nb-NO');
});

test('paused synthesis resumes and failed startup stays replayable without a speech-length timer',()=>{
 const app=fixture();app.synth.paused=true;app.api.speakAnswer('Привет','ru');assert.equal(app.calls.unpause,1);assert.equal(app.timers.size,0);
 app.api.cancelSpeech();app.synth.speak=utterance=>app.played.push(utterance);app.api.speakAnswer('Ещё один ответ','ru');app.fire(8000);assert.equal(app.attributes['data-tts-error'],'playback-start-timeout');assert.equal(app.speaker.hidden,false);assert.equal(app.speaking,false);
});
