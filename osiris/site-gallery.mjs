import {AlphaSequence} from './alpha-sequence.mjs?v=20261020continuity1';
import {buildMovementCatalog} from './movement-catalog.mjs';
import {fitCharacterClip} from './character-layout.mjs';

const MEDIA=new URL('../media/osiris-life/metadata.json',import.meta.url);
const ENGLISH={
 blink:'Slow blink',yawn:'Yawn',listen:'Listen',groom:'Wash paw','nose-lick':'Lick nose',
 yarn:'Play with yarn',mouse:'Catch toy mouse',feather:'Catch feather',tail:'Chase tail',paper:'Play with paper',
 'side-hop':'Playful hop','lying-toy':'Play lying down',sniff:'Explore scents',stretch:'Stretch',knead:'Knead',
 scratch:'Scratch ear',shake:'Shake head and neck','body-groom':'Groom shoulder',roll:'Roll over',
 'look-back':'Look back','rear-leg-stretch':'Stretch hind leg','lie-down':'Lie down',pleading:'Hold hat',
 rub:'Rub cheek','ledge-reach':'Check the ledge','arched-back':'Arch back','jump-panther-short':'Panther jump',
 cursor:'Touch the arrow',
};
const COPY={
 ru:['Движение','Показать','Пауза','Продолжить','Все по очереди','Стоп','Фон','Тёмный','Светлый','Клетка','Загрузка…','Не удалось загрузить движение. Нажми «Показать», чтобы повторить.','Готово к показу','Показ завершён','Показ приостановлен','Все движения — по одному разу, без технических дублей. Микрофон не включается.','Уменьшение движения включено: доступен ручной показ одного ролика.'],
 en:['Movement','Play','Pause','Resume','Play all in order','Stop','Background','Dark','Light','Checker','Loading…','The movement could not be loaded. Press Play to retry.','Ready to play','Finished','Paused','Each movement plays once, without technical duplicates. The microphone stays off.','Reduced motion is enabled: play one movement manually.'],
 nb:['Bevegelse','Vis','Pause','Fortsett','Vis alle i rekkefølge','Stopp','Bakgrunn','Mørk','Lys','Ruter','Laster…','Bevegelsen kunne ikke lastes. Trykk Vis for å prøve igjen.','Klar til visning','Ferdig','Satt på pause','Hver bevegelse vises én gang, uten tekniske duplikater. Mikrofonen slås ikke på.','Redusert bevegelse er aktivert: vis én bevegelse manuelt.'],
 uk:['Рух','Показати','Пауза','Продовжити','Усі по черзі','Стоп','Тло','Темне','Світле','Клітинка','Завантаження…','Не вдалося завантажити рух. Натисни «Показати», щоб повторити.','Готово до показу','Показ завершено','Показ призупинено','Кожен рух показується один раз, без технічних дублів. Мікрофон не вмикається.','Увімкнено зменшення руху: доступний ручний показ одного ролика.'],
 sv:['Rörelse','Visa','Pausa','Fortsätt','Visa alla i ordning','Stoppa','Bakgrund','Mörk','Ljus','Rutor','Laddar…','Rörelsen kunde inte laddas. Tryck Visa för att försöka igen.','Redo att visa','Färdig','Pausad','Varje rörelse visas en gång, utan tekniska dubbletter. Mikrofonen slås inte på.','Minskad rörelse är aktiverad: visa en rörelse manuellt.'],
 da:['Bevægelse','Vis','Pause','Fortsæt','Vis alle i rækkefølge','Stop','Baggrund','Mørk','Lys','Tern','Indlæser…','Bevægelsen kunne ikke indlæses. Tryk Vis for at prøve igen.','Klar til visning','Færdig','Sat på pause','Hver bevægelse vises én gang, uden tekniske dubletter. Mikrofonen tændes ikke.','Reduceret bevægelse er aktiveret: vis én bevægelse manuelt.'],
};

// The dock and gallery use the same physical character scale.
export const fitGalleryClip=fitCharacterClip;

/** One presentation stage; no DOM, timers, microphone or page navigation. */
export function createGalleryPlayback({renderer,clips,mediaUrl=MEDIA,onState=()=>{},onFrame=()=>{},isHidden=()=>false,isReduced=()=>false}){
 const accepted=new Map(clips.map(clip=>[clip.id,clip]));
 let selectedId=clips[0]?.id||'',playing=false,paused=false,loading=false,ready=false,hasFrame=false,dead=false;
 let queue=[],queueIndex=-1,generation=0,controller=null,error=null,finished=false;
 const snapshot=()=>({selectedId,playing,paused,loading,ready,hasFrame,queue:[...queue],queueIndex,error,finished});
 const publish=()=>onState(snapshot());
 function cancel({keepQueue=false}={}){
  generation++;controller?.abort();controller=null;renderer.pause();
  if(loading)ready=false;
  loading=false;playing=false;paused=true;finished=false;
  if(!keepQueue){queue=[];queueIndex=-1;}
 }
 async function run(token){
  if(dead||token!==generation||isHidden())return;
  playing=true;paused=false;finished=false;publish();
  try{
   await renderer.play(time=>{if(!dead&&token===generation&&playing)onFrame(time,accepted.get(selectedId));});
  }catch(cause){
   if(dead||token!==generation||cause.name==='AbortError')return;
   playing=false;paused=true;error=cause;publish();
  }
 }
 async function load(id,{autoplay=false,keepQueue=false}={}){
  if(dead||!accepted.has(id))return false;
  cancel({keepQueue});const token=generation;
  selectedId=id;controller=new AbortController();loading=true;ready=false;error=null;paused=false;publish();
  try{
   const media=accepted.get(id).media;
   await renderer.load(new URL(media.packed,mediaUrl).href,{clip:media,signal:controller.signal});
   if(dead||token!==generation)return false;
   loading=false;ready=true;hasFrame=true;publish();onFrame(0,accepted.get(id));
   if(autoplay&&!paused&&!isHidden())await run(token);
   return true;
  }catch(cause){
   if(dead||token!==generation||cause.name==='AbortError')return false;
   loading=false;playing=false;paused=true;error=cause;queue=[];queueIndex=-1;publish();
   return false;
  }
 }
 function select(id){return load(id);}
 async function play(){
  if(dead||!selectedId||isHidden())return false;
  if(!ready||error||loading)return load(selectedId,{autoplay:true,keepQueue:true});
  const token=++generation;error=null;paused=false;
  try{
   if(renderer.video.ended)await renderer.seek(0);
   if(token!==generation||dead||isHidden())return false;
   await run(token);return true;
  }catch(cause){
   if(token===generation&&!dead&&cause.name!=='AbortError'){error=cause;paused=true;publish();}
   return false;
  }
 }
 function pause(){if(dead)return;cancel({keepQueue:true});publish();}
 function stop(){if(dead)return;cancel();publish();}
 function playAll(){
  if(dead||isHidden()||isReduced()||!clips.length)return false;
  queue=clips.map(clip=>clip.id);queueIndex=0;
  void load(queue[0],{autoplay:true,keepQueue:true});return true;
 }
 function ended(){
  if(dead||loading||!playing||!renderer.video.ended)return;
  renderer.pause();playing=false;
  if(queue.length&&queueIndex+1<queue.length&&!isHidden()&&!isReduced()){
   queueIndex++;void load(queue[queueIndex],{autoplay:true,keepQueue:true});
  }else{queue=[];queueIndex=-1;paused=false;finished=true;publish();}
 }
 renderer.video.addEventListener('ended',ended);
 function destroy(){if(dead)return;cancel();dead=true;renderer.video.removeEventListener('ended',ended);renderer.destroy();}
 return {select,play,pause,stop,playAll,destroy,snapshot};
}

export async function mountSiteGallery(root,{mediaUrl=MEDIA}={}){
 if(!root)return null;
 const $=selector=>root.querySelector(selector),canvas=$('[data-gallery-canvas]'),stage=$('[data-gallery-stage]');
 const select=$('[data-gallery-select]'),play=$('[data-gallery-play]'),pause=$('[data-gallery-pause]');
 const all=$('[data-gallery-all]'),stop=$('[data-gallery-stop]'),background=$('[data-gallery-background]');
 const title=$('[data-gallery-title]'),status=$('[data-gallery-status]'),description=$('[data-gallery-description]');
 const count=$('[data-gallery-count]');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),events=[];
 let playback,renderer,catalog,dead=false,clip=null,seconds=0;
 const startup=new AbortController(),timeout=setTimeout(()=>startup.abort(),15000);
 const listen=(el,type,fn)=>{el.addEventListener(type,fn);events.push(()=>el.removeEventListener(type,fn));};
 const lang=()=>document.documentElement.lang.split('-')[0],words=()=>COPY[lang()]||COPY.en;
 const label=item=>lang()==='ru'?item.title:ENGLISH[item.id]||item.title;
 function position(){
  if(!renderer)return;const {width,height}=stage.getBoundingClientRect();
  if(width<25||height<25)return;
  // Both decoded buffers are laid out inside this stable stage; CSS must not
  // stretch or reposition the composite according to the incoming clip.
  canvas.style.width='100%';canvas.style.height='100%';canvas.style.left='0';canvas.style.top='0';
  renderer.resize(width,height);
 }
 function render(state=playback?.snapshot()){
  if(!state)return;
  clip=catalog.clips.find(item=>item.id===state.selectedId);if(!clip)return;
  const c=words();select.value=state.selectedId;title.textContent=label(clip);
  description.textContent=lang()==='ru'?clip.description:'';
  play.textContent=c[state.paused&&state.ready&&!renderer.video.ended?3:1];
  pause.disabled=!state.playing&&!state.loading;stop.disabled=!state.playing&&!state.loading&&!state.queue.length;
  all.disabled=reduced.matches||!catalog.clips.length;
  canvas.hidden=!state.hasFrame;position();
  const itemIndex=catalog.clips.indexOf(clip)+1;
  count.textContent=`${itemIndex} / ${catalog.actionCount} · ${clip.media.duration.toFixed(1)} s · ${clip.media.fps} FPS`;
  const progress=state.queue.length?`${state.queueIndex+1} / ${state.queue.length} · `:'';
  status.textContent=progress+(state.error?c[11]:state.loading?c[10]:state.playing?`${seconds.toFixed(1)} s`:state.finished?c[13]:state.paused?c[14]:c[12]);
 }
 function translate(){
  const c=words();
  root.querySelectorAll('[data-gallery-copy]').forEach(el=>{el.textContent=c[Number(el.dataset.galleryCopy)];});
  if(catalog){
   const current=select.value;select.replaceChildren();
   for(const item of catalog.clips)select.add(new Option(label(item),item.id));
   select.value=current;render();
  }
  $('[data-gallery-note]').textContent=c[reduced.matches?16:15];
 }
 function destroy(){
  if(dead)return;dead=true;startup.abort();clearTimeout(timeout);playback?.destroy();resize.disconnect();events.forEach(off=>off());
 }
 const resize=new ResizeObserver(position);resize.observe(stage);
 listen(window,'pagehide',event=>{if(!event.persisted)destroy();else playback?.pause();});
 listen(document,'visibilitychange',()=>{if(document.hidden)playback?.pause();});
 listen(reduced,'change',()=>{
  playback?.pause();
  if(renderer)renderer.transitionMs=reduced.matches?0:180;
  translate();
 });
 listen(window,'fjordlanguagechange',translate);
 listen(select,'change',()=>{seconds=0;void playback?.select(select.value);});
 listen(play,'click',()=>void playback?.play());listen(pause,'click',()=>playback?.pause());
 listen(all,'click',()=>{seconds=0;playback?.playAll();});listen(stop,'click',()=>playback?.stop());
 listen(background,'change',()=>{stage.dataset.background=['dark','light','checker'].includes(background.value)?background.value:'dark';});
 translate();status.textContent=words()[10];play.disabled=pause.disabled=all.disabled=stop.disabled=true;
 try{
  const response=await fetch(mediaUrl,{signal:startup.signal});if(!response.ok)throw Error('Movement manifest unavailable');
  catalog=buildMovementCatalog(await response.json());if(dead||startup.signal.aborted)return null;
  if(!catalog.clips.length)throw Error('No accepted movements');
  renderer=new AlphaSequence(canvas,{fit:fitGalleryClip,transitionMs:reduced.matches?0:180});
  position();
  playback=createGalleryPlayback({
   renderer,clips:catalog.clips,mediaUrl,isHidden:()=>document.hidden,isReduced:()=>reduced.matches,
   onState:render,onFrame:(time,item)=>{seconds=time;clip=item;render();},
  });
  play.disabled=false;translate();await playback.select(catalog.clips[0].id);
  return {destroy,snapshot:playback.snapshot};
 }catch(error){
  if(!dead)status.textContent=words()[11];
  return null;
 }finally{clearTimeout(timeout);}
}
