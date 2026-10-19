/* World cameras with official embedded players. Norwegian data remains archived. */
(()=>{'use strict';
const recent=(camera,now=Date.now())=>{const age=now-Date.parse(camera.checked+'T00:00:00Z');return age>=0&&age<7*86400000;};
const playable=camera=>Boolean(camera.enabled!==false&&/^[\w-]{11}$/.test(camera.youtube||'')&&camera.verification==='embedded-visual');
const select=(items,now=Date.now())=>items.filter(camera=>playable(camera)&&recent(camera,now));
if(typeof module!=='undefined'&&module.exports){module.exports={recent,playable,select};return;}
const copy={
 nb:['Webkameraer fra verden','Direktebilder fra kontrollerte kameraer. Videoen starter uten lyd når kortet er synlig.','Se hos operatøren ↗','Kontrollert','Kameraene kunne ikke lastes.','Prøv igjen'],
 en:['World webcams','Live views from checked cameras. Video starts muted when the card is visible.','Watch at the source ↗','Checked','Could not load the cameras.','Retry'],
 uk:['Вебкамери світу','Прямі трансляції перевірених камер. Відео запускається без звуку, коли картку видно.','Дивитися в джерелі ↗','Перевірено','Не вдалося завантажити камери.','Спробувати знову'],
 sv:['Webbkameror i världen','Livebilder från kontrollerade kameror. Videon startar utan ljud när kortet syns.','Se hos operatören ↗','Kontrollerad','Kamerorna kunde inte laddas.','Försök igen'],
 da:['Webkameraer i verden','Livebilleder fra kontrollerede kameraer. Video starter uden lyd, når kortet er synligt.','Se hos operatøren ↗','Kontrolleret','Kameraerne kunne ikke indlæses.','Prøv igen']
};
const section=document.createElement('section');section.id='norwayWebcams';section.className='webcam-directory';section.dataset.i18nIgnore='';
(document.getElementById('buaEquipment')||document.getElementById('norwayCatalogue')).after(section);
const nav=document.createElement('a');nav.href='#norwayWebcams';nav.dataset.i18nIgnore='';document.querySelector('header nav')?.append(nav);
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
let items=[],failed=false,observer=null,players=[];
const visible=()=>!document.hidden&&!section.hidden&&!section.closest('[hidden]');
function refresh(){for(const player of players){const rect=player.card.getBoundingClientRect();if(visible()&&rect.bottom>0&&rect.top<innerHeight)player.start();else player.stop();}}
function render(){
 observer?.disconnect();for(const player of players)player.stop();players=[];
 const lang=window.FjordI18n?.language||document.documentElement.lang,t=copy[lang]||copy.nb;nav.textContent=t[0];section.replaceChildren();
 const world=el('section',null,'webcam-world');world.id='worldWebcams';world.append(el('h2',t[0]),el('p',t[1]));const grid=el('div',null,'webcam-grid');
 for(const camera of select(items)){
  const card=el('article',null,'webcam-card'),visual=el('div',null,'webcam-visual');card.append(visual,el('h3',camera.name),el('p',camera.operator,'webcam-operator'),el('small',t[3]+': '+camera.checked,'webcam-checked'));
  let frame=null;
  const player={card,start(){if(frame)return;frame=el('iframe');frame.title=camera.name;frame.allow='autoplay; encrypted-media';frame.referrerPolicy='strict-origin-when-cross-origin';frame.src='https://www.youtube-nocookie.com/embed/'+camera.youtube+'?autoplay=1&mute=1&playsinline=1&rel=0&controls=0&disablekb=1&fs=0&iv_load_policy=3';visual.replaceChildren(frame);},stop(){if(!frame)return;visual.replaceChildren();frame=null;}};
  players.push(player);grid.append(card);
 }
 world.append(grid);if(failed){world.append(el('p',t[4]));const retry=el('button',t[5]);retry.onclick=load;world.append(retry);}section.append(world);
 if(typeof IntersectionObserver!=='undefined'){observer=new IntersectionObserver(refresh,{threshold:0});for(const player of players)observer.observe(player.card);}
 window.dispatchEvent(new Event('fjord:sections-changed'));refresh();
}
async function load(){try{const response=await fetch('./world-webcams-data.json?v=1');if(!response.ok)throw Error('camera registry');const data=await response.json();if(!Array.isArray(data.cameras))throw Error('camera data');items=data.cameras;failed=false;}catch{items=[];failed=true;}render();}
window.FjordWebcams={ready:load()};document.addEventListener('visibilitychange',refresh);window.addEventListener('fjord:sections-changed',refresh);window.addEventListener('fjordlanguagechange',render);
})();
