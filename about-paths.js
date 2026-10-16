/* Four deliberate ways into the guide. Selecting a tab previews; the action opens it. */
(()=>{'use strict';
const root=document.getElementById('about');
if(!root||!window.FjordExplorerCopy)return;
const photoPaths=['./images/hero-lofoten.jpg','./images/hero-geiranger.jpg','./images/hero-bergen.jpg','./images/travel-story-illustrations.png'];
const targets=['#collection','#collection','#routeExperiences','#travelStories'];
root.innerHTML=`<div class="explorer-heading"><p class="explorer-eyebrow"></p><h2></h2><p class="explorer-intro"></p></div><div class="explorer-frame"><div class="explorer-visual" aria-hidden="true"><img alt="" decoding="async"><img alt="" decoding="async"></div><span class="explorer-ghost" aria-hidden="true">01</span><div class="explorer-copy" id="explorerPanel" role="tabpanel" tabindex="0"><p class="explorer-kicker"></p><h3></h3><p class="explorer-description"></p><a class="explorer-action" href="#collection"><span></span><b aria-hidden="true">↗</b></a></div><div class="explorer-tabs" role="tablist">${[0,1,2,3].map(i=>`<button type="button" role="tab" id="explorerTab${i}" aria-controls="explorerPanel" data-explorer-tab="${i}"><span class="explorer-tab-number">0${i+1}</span><span class="explorer-tab-label"></span><span class="explorer-tab-arrow" aria-hidden="true">↗</span></button>`).join('')}</div></div>`;
const buttons=[...root.querySelectorAll('[data-explorer-tab]')],images=[...root.querySelectorAll('.explorer-visual img')];
const action=root.querySelector('.explorer-action'),panel=root.querySelector('#explorerPanel');
let selected=0,layer=1,photoToken=0,shownPhoto='',catalogue=[],bag=[],currentPlace=null,timer=0,inView=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const caption=document.createElement('p');caption.className='explorer-current-place';caption.dataset.i18nIgnore='';caption.hidden=true;root.querySelector('.explorer-copy h3').after(caption);
const nextButton=document.createElement('button');nextButton.type='button';nextButton.className='explorer-next-place';nextButton.dataset.i18nIgnore='';nextButton.hidden=true;action.after(nextButton);
const nextLabels={nb:'Neste sted',en:'Next place',uk:'Наступне місце',sv:'Nästa plats',da:'Næste sted'};
const portableImage=path=>typeof path==='string'?path.replace(/^\/images\//,'./images/'):path;
const localImage=path=>typeof path==='string'&&/^\.\/images\/[a-z0-9._-]+$/i.test(path);
function stopped(){return selected!==0||reduced.matches||document.hidden||!inView||!!document.querySelector('[data-scenery-pause][aria-pressed="true"]')}
function schedule(){clearTimeout(timer);timer=0;if(!stopped()&&catalogue.length>1)timer=setTimeout(()=>nextPlace(),7000)}
function shuffle(items){const list=[...items];for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]]}if(list.length>1&&list.at(-1).id===currentPlace?.id)[list[0],list[list.length-1]]=[list.at(-1),list[0]];return list}
function takePlace(){if(!bag.length)bag=shuffle(catalogue);return bag.pop()}
function showCaption(){caption.hidden=selected!==0||!currentPlace;caption.textContent=currentPlace?.name||'';nextButton.hidden=selected!==0||catalogue.length<2;nextButton.textContent=(nextLabels[window.FjordI18n?.language]||nextLabels.nb)+' →'}
async function nextPlace(){if(selected!==0||!catalogue.length)return false;const place=takePlace();return photograph(0,place)}
nextButton.addEventListener('click',()=>nextPlace());
const copy=()=>window.FjordExplorerCopy[window.FjordI18n?.language||'nb']||window.FjordExplorerCopy.nb;
async function photograph(index,place=null){
 const path=place?.image||photoPaths[index];if(path===shownPhoto&&(!place||currentPlace?.id===place.id)){schedule();return true}
 const token=++photoToken,incoming=images[1-layer];incoming.src=path;
 try{await incoming.decode()}catch{if(token===photoToken)schedule();return false}
 if(token!==photoToken||selected!==index)return false;
 images.forEach(img=>img.classList.toggle('is-visible',img===incoming));
 layer=images.indexOf(incoming);shownPhoto=path;root.dataset.photo=String(index);
 if(index===0&&place){currentPlace=place;root.dataset.currentPlaceId=place.id;root.dataset.currentPlaceName=place.name;root.dataset.currentImage=place.image;root.dataset.currentLatitude=String(place.latitude);root.dataset.currentLongitude=String(place.longitude)}
 else if(index!==0){delete root.dataset.currentPlaceId;delete root.dataset.currentPlaceName;delete root.dataset.currentLatitude;delete root.dataset.currentLongitude;root.dataset.currentImage=path}
 showCaption();window.dispatchEvent(new CustomEvent('fjordexplorerphoto',{detail:{index,place:index===0?currentPlace:null}}));schedule();return true;
}
function render(){
 const c=copy(),item=c.items[selected];
 root.querySelector('.explorer-eyebrow').textContent=c.eyebrow;
 root.querySelector('.explorer-heading h2').textContent=c.introTitle;
 root.querySelector('.explorer-intro').textContent=c.introText;
 root.querySelector('.explorer-tabs').setAttribute('aria-label',c.tabLabel);
 buttons.forEach((button,i)=>{button.querySelector('.explorer-tab-label').textContent=c.items[i].label;button.setAttribute('aria-selected',String(i===selected));button.tabIndex=i===selected?0:-1});
 root.querySelector('.explorer-kicker').textContent=item.kicker;
 root.querySelector('.explorer-copy h3').textContent=item.title;
 root.querySelector('.explorer-description').textContent=item.description;
 action.querySelector('span').textContent=item.action;action.href=targets[selected];
 panel.setAttribute('aria-labelledby',buttons[selected].id);
 root.querySelector('.explorer-ghost').textContent='0'+(selected+1);
 root.dataset.selected=String(selected);showCaption();photograph(selected,selected===0?currentPlace:null);schedule();window.dispatchEvent(new CustomEvent('fjordexplorerchange',{detail:{index:selected}}));
}
function select(index,focus=false){++photoToken;selected=(index+buttons.length)%buttons.length;render();if(focus)buttons[selected].focus()}
buttons.forEach((button,i)=>button.addEventListener('click',()=>select(i)));
root.querySelector('.explorer-tabs').addEventListener('keydown',event=>{
 if(!event.target.closest('[role="tab"]'))return;
 let next;if(event.key==='ArrowRight')next=selected+1;else if(event.key==='ArrowLeft')next=selected-1;else if(event.key==='Home')next=0;else if(event.key==='End')next=buttons.length-1;else return;
 event.preventDefault();select(next,true);
});
action.addEventListener('click',event=>{if(selected===1&&typeof openGallery==='function'){event.preventDefault();openGallery('geiranger')}});
const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;root.classList.toggle('is-in-view',inView);schedule()},{threshold:.15});observer.observe(root);
root.addEventListener('focusin',schedule);root.addEventListener('focusout',()=>setTimeout(schedule,0));
document.addEventListener('visibilitychange',schedule);reduced.addEventListener('change',schedule);document.querySelectorAll('[data-scenery-pause]').forEach(button=>button.addEventListener('click',schedule));
function usablePlaces(state){return (Array.isArray(state?.destinations)?state.destinations:[]).map(p=>({...p,image:portableImage(p.image),gallery:(p.gallery||[]).map(photo=>({...photo,image:portableImage(photo.image)}))})).filter(p=>typeof p.id==='string'&&typeof p.name==='string'&&localImage(p.image)&&Number.isFinite(p.latitude)&&Number.isFinite(p.longitude))}
async function loadPlaces(){try{let state;try{state=typeof data!=='undefined'&&Array.isArray(data?.destinations)?data:await fetch('./api/state').then(r=>{if(!r.ok)throw Error('Places unavailable');return r.json()})}catch{}catalogue=usablePlaces(state);if(!catalogue.length)catalogue=usablePlaces(await fetch('./demo-data/state.json').then(r=>{if(!r.ok)throw Error('Places snapshot unavailable');return r.json()}));bag=shuffle(catalogue);showCaption();if(selected===0)await nextPlace()}catch(error){console.info('Explorer places unavailable:',error.message)}}
window.FjordExplorerSlides={nextPlace,get places(){return catalogue.map(p=>({id:p.id,name:p.name}))},get currentPlace(){return currentPlace}};
window.addEventListener('fjordlanguagechange',render);
render();loadPlaces();
})();
