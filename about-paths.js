/* Four deliberate ways into the guide. Selecting a tab previews; the action opens it. */
(()=>{'use strict';
const root=document.getElementById('about');
if(!root||!window.FjordExplorerCopy)return;
const photoPaths=['./images/hero-lofoten.jpg','./images/hero-geiranger.jpg','./images/hero-bergen.jpg','./images/travel-story-illustrations.png'];
const targets=['#collection','#collection','#cafeStops','#travelStories'];
root.innerHTML=`<div class="explorer-heading"><p class="explorer-eyebrow"></p><h2></h2><p class="explorer-intro"></p></div><div class="explorer-frame"><div class="explorer-visual" aria-hidden="true"><img alt="" decoding="async"><img alt="" decoding="async"></div><span class="explorer-ghost" aria-hidden="true">01</span><div class="explorer-copy" id="explorerPanel" role="tabpanel" tabindex="0"><p class="explorer-kicker"></p><h3></h3><p class="explorer-description"></p><a class="explorer-action" href="#collection"><span></span><b aria-hidden="true">↗</b></a></div><div class="explorer-tabs" role="tablist">${[0,1,2,3].map(i=>`<button type="button" role="tab" id="explorerTab${i}" aria-controls="explorerPanel" data-explorer-tab="${i}"><span class="explorer-tab-number">0${i+1}</span><span class="explorer-tab-label"></span><span class="explorer-tab-arrow" aria-hidden="true">↗</span></button>`).join('')}</div></div>`;
const buttons=[...root.querySelectorAll('[data-explorer-tab]')],images=[...root.querySelectorAll('.explorer-visual img')];
const action=root.querySelector('.explorer-action'),panel=root.querySelector('#explorerPanel');
let selected=0,layer=1,photoToken=0,shownPhoto='';
const copy=()=>window.FjordExplorerCopy[window.FjordI18n?.language||'nb']||window.FjordExplorerCopy.nb;
async function photograph(index){
 const path=photoPaths[index];if(path===shownPhoto)return;
 const token=++photoToken,incoming=images[1-layer];incoming.src=path;
 try{await incoming.decode()}catch{return}
 if(token!==photoToken)return;
 images.forEach(img=>img.classList.toggle('is-visible',img===incoming));
 layer=images.indexOf(incoming);shownPhoto=path;
 root.dataset.photo=String(index);
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
 root.dataset.selected=String(selected);photograph(selected);window.dispatchEvent(new CustomEvent('fjordexplorerchange',{detail:{index:selected}}));
}
function select(index,focus=false){selected=(index+buttons.length)%buttons.length;render();if(focus)buttons[selected].focus()}
buttons.forEach((button,i)=>button.addEventListener('click',()=>select(i)));
root.querySelector('.explorer-tabs').addEventListener('keydown',event=>{
 if(!event.target.closest('[role="tab"]'))return;
 let next;if(event.key==='ArrowRight')next=selected+1;else if(event.key==='ArrowLeft')next=selected-1;else if(event.key==='Home')next=0;else if(event.key==='End')next=buttons.length-1;else return;
 event.preventDefault();select(next,true);
});
action.addEventListener('click',event=>{if(selected===1&&typeof openGallery==='function'){event.preventDefault();openGallery('geiranger')}});
const observer=new IntersectionObserver(entries=>root.classList.toggle('is-in-view',entries[0].isIntersecting));observer.observe(root);
window.addEventListener('fjordlanguagechange',render);
render();
})();
