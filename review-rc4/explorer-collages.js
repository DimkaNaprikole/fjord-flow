/* Layered photographic postcards; local assets, no video or generation service. */
(()=>{'use strict';
const root=document.getElementById('about'),frame=root?.querySelector('.explorer-frame');if(!frame)return;
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover: hover) and (pointer: fine)');
const collage=document.createElement('div');collage.className='explorer-collage';collage.setAttribute('aria-hidden','true');collage.hidden=true;frame.append(collage);
let catalogue=[],last='',raf=0,currentPlace=null;
function render(){
 const index=Number(root.dataset.selected||0),items=index===0&&currentPlace?[...new Set([currentPlace.image,...(currentPlace.gallery||[]).map(p=>p.image)].filter(Boolean))].slice(0,3).map(image=>({image,caption:currentPlace.name})):catalogue[index],key=index+':'+(index===0?currentPlace?.id||'':'');if(!items||last===key)return;last=key;
 collage.hidden=false;collage.replaceChildren();
 items.forEach((item,i)=>{
  const card=document.createElement('div');card.className='collage-card';card.style.setProperty('--card',i);
  const floating=document.createElement('div');floating.className='collage-float';
  const figure=document.createElement('figure');figure.className='collage-face';
  const picture=document.createElement('div');picture.className='collage-picture';
  const image=document.createElement('img');image.alt='';image.decoding='async';image.onerror=()=>{card.remove();if(!collage.children.length){collage.hidden=true;root.classList.remove('has-explorer-collage');last=''}};image.src=item.image;
  if(Number.isInteger(item.panel)){picture.classList.add('collage-illustration');image.style.left=(-100*item.panel)+'%'}
  picture.append(image);
  const caption=document.createElement('figcaption');caption.textContent=item.caption;
  const mark=document.createElement('span');mark.className='collage-stamp';mark.textContent='0'+(i+1);mark.setAttribute('aria-hidden','true');
  figure.append(picture,caption,mark);floating.append(figure);card.append(floating);collage.append(card);
 });
 root.classList.add('has-explorer-collage');
}
window.addEventListener('fjordexplorerchange',render);window.addEventListener('fjordexplorerphoto',event=>{if(event.detail?.index===0&&event.detail.place){currentPlace=event.detail.place;render()}});
function resetTilt(){if(raf)cancelAnimationFrame(raf);raf=0;collage.style.setProperty('--tilt-x','0deg');collage.style.setProperty('--tilt-y','0deg')}
frame.addEventListener('pointermove',event=>{
 if(!fine.matches||reduced.matches||document.hidden)return;
 const r=frame.getBoundingClientRect(),x=(event.clientX-r.left)/r.width-.5,y=(event.clientY-r.top)/r.height-.5;
 if(raf)cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{raf=0;collage.style.setProperty('--tilt-x',(-y*7).toFixed(2)+'deg');collage.style.setProperty('--tilt-y',(x*10).toFixed(2)+'deg')});
});
frame.addEventListener('pointerleave',resetTilt);reduced.addEventListener('change',resetTilt);
function pause(){root.classList.toggle('explorer-motion-paused',document.hidden||!!document.querySelector('[data-scenery-pause][aria-pressed="true"]'))}
document.querySelectorAll('[data-scenery-pause]').forEach(button=>button.addEventListener('click',pause));document.addEventListener('visibilitychange',pause);pause();
fetch('./explorer-collages.json').then(r=>{if(!r.ok)throw Error('Collage catalogue unavailable');return r.json()}).then(value=>{
 if(!Array.isArray(value)||value.length!==4||value.some(items=>!Array.isArray(items)||items.length!==3||items.some(item=>!/^\.\/images\/[a-z0-9._-]+$/i.test(item.image)||typeof item.caption!=='string'||(item.panel!==undefined&&![0,1,2].includes(item.panel)))))return;
 catalogue=value;render();
}).catch(()=>{/* The photographic navigator remains usable without the collage enhancement. */});
})();
