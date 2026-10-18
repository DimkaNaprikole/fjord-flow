/* Owner-selected backgrounds: one Norwegian artwork, alternating with Ukrainian paintings. */
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const ukrainian=['images/portal-ukraine-ribbons.webp','images/portal-ukraine-brush.webp','images/portal-ukraine-marble.webp'];
const norwegian='images/norway-friendship-original.png';
const mountedArtwork=new WeakMap();
// Public section renderers replace their children for language and location changes.
const artworkContentObserver=new MutationObserver(records=>{
  for(const host of new Set(records.map(record=>record.target))){
    const mounted=mountedArtwork.get(host);
    if(host.isConnected&&mounted&&mounted.art.parentNode!==host)host.prepend(mounted.art);
  }
});
function mountArtwork(host,initialStep=0,canAdvance=null,resolvePair=null){
  if(!host)return null;
  const mounted=mountedArtwork.get(host);
  if(mounted){if(mounted.art.parentNode!==host)host.prepend(mounted.art);return mounted.advance;}
  const art=document.createElement('div');art.className='hero-artwork';art.setAttribute('aria-hidden','true');
  const layers=[0,1].map(()=>{
    const layer=document.createElement('div');layer.className='hero-artwork-pair';
    const images=[0,1].map(()=>{const img=document.createElement('img');img.alt='';img.decoding='async';layer.append(img);return img;});
    art.append(layer);return {layer,images};
  });
  host.prepend(art);
  let active=1,step=initialStep,request=0;
  async function show(advancing=false){
    const id=++request,index=reduced.matches?initialStep:step,ukraine=ukrainian[index%ukrainian.length];
    const pair=resolvePair?resolvePair(index):(index%2?[norwegian,ukraine]:[ukraine,norwegian]),incoming=layers[1-active];
    await Promise.all(incoming.images.map(async(img,i)=>{if(img.getAttribute('src')!==pair[i])img.src=pair[i];try{await img.decode();}catch{}}));
    if(id!==request||(advancing&&canAdvance&&!canAdvance()))return;
    incoming.layer.style.setProperty('--artwork-left',`url("${pair[0]}")`);
    incoming.layer.style.setProperty('--artwork-right',`url("${pair[1]}")`);
    incoming.layer.classList.add('is-visible');layers[active].layer.classList.remove('is-visible');active=1-active;
    art.dataset.step=String(index);art.dataset.left=pair[0];art.dataset.right=pair[1];
  }
  reduced.addEventListener('change',()=>void show());void show();
  const advance=()=>{if(!reduced.matches&&(!canAdvance||canAdvance())){step++;void show(true);}};
  mountedArtwork.set(host,{art,advance});
  artworkContentObserver.observe(host,{childList:true});return advance;
}
const scenery=document.getElementById('heroScenery');
const advanceHero=mountArtwork(scenery?.closest('.hero'));
if(scenery&&advanceHero){
  let last=scenery.dataset.currentImage||'';
  new MutationObserver(()=>{
    const photo=scenery.dataset.currentImage||'';if(!photo||photo===last)return;
    const hadPhoto=Boolean(last);last=photo;if(hadPhoto)advanceHero();
  }).observe(scenery,{attributes:true,attributeFilter:['data-current-image']});
}
const advanceExplorer=mountArtwork(document.querySelector('#about'));
if(advanceExplorer){
  window.addEventListener('fjordexplorerphoto',advanceExplorer);
}

/* Other public chapters share one clock and load their artwork only near view. */
const publicSections='#journeys>section:not(#homePanel):not(#about):not(.hero),body>section#advertising,body>section#contact,body>section#norwayOverview';
const sectionArtwork=new Map(),nearbySections=new Set();
let sectionOffset=0,artworkTimer=0;
const displayed=section=>section.isConnected&&!section.closest('[hidden]')&&section.getClientRects().length>0;
function inViewport(section){
  if(!displayed(section))return false;
  const box=section.getBoundingClientRect();
  return box.bottom>0&&box.top<window.innerHeight&&box.right>0&&box.left<window.innerWidth;
}
function synchronizeArtworkTimer(){
  const runnable=!document.hidden&&!reduced.matches&&[...nearbySections].some(displayed);
  if(!runnable){clearInterval(artworkTimer);artworkTimer=0;return;}
  if(artworkTimer)return;
  artworkTimer=setInterval(()=>{
    if(document.hidden||reduced.matches){synchronizeArtworkTimer();return;}
    for(const section of nearbySections){
      if(inViewport(section))sectionArtwork.get(section)?.advance?.();
    }
  },12000);
}
const artworkObserver='IntersectionObserver' in window?new IntersectionObserver(entries=>{
  for(const entry of entries){
    const section=entry.target,record=sectionArtwork.get(section);if(!record)continue;
    if(entry.isIntersecting&&displayed(section)){
      nearbySections.add(section);
      record.advance||=mountArtwork(section,record.offset,()=>!document.hidden&&!reduced.matches&&inViewport(section));
    }else nearbySections.delete(section);
  }
  synchronizeArtworkTimer();
},{rootMargin:'180px 0px',threshold:0}):null;
function discoverArtworkSections(){
  for(const [section] of sectionArtwork){
    if(!section.isConnected){artworkObserver?.unobserve(section);nearbySections.delete(section);sectionArtwork.delete(section);}
  }
  for(const section of document.querySelectorAll(publicSections)){
    if(sectionArtwork.has(section))continue;
    section.classList.add('portal-art-section');
    sectionArtwork.set(section,{offset:sectionOffset++%6,advance:null});
    artworkObserver?.observe(section);
  }
  if(!artworkObserver)scanNearbySections();
  synchronizeArtworkTimer();
}
function scanNearbySections(){
  for(const [section,record] of sectionArtwork){
    const box=section.getBoundingClientRect();
    if(displayed(section)&&box.bottom>-180&&box.top<window.innerHeight+180){
      nearbySections.add(section);record.advance||=mountArtwork(section,record.offset,()=>!document.hidden&&!reduced.matches&&inViewport(section));
    }else nearbySections.delete(section);
  }
  synchronizeArtworkTimer();
}
/* Only one country carries the painted slogan in each header frame. */
const friendship=document.querySelector('body>header>.solidarity-art-pair');
if(friendship){
  const pairs=[
    ['images/ukraine-friendship-original.png',norwegian],
    ['images/ukraine-friendship-clean.webp','images/norway-wake-up.webp']
  ];
  friendship.classList.add('friendship-alternating');
  sectionArtwork.set(friendship,{offset:0,advance:mountArtwork(friendship,0,()=>!document.hidden&&!reduced.matches&&inViewport(friendship),index=>pairs[index%2])});
  artworkObserver?.observe(friendship);
}
discoverArtworkSections();
const sectionStructureObserver=new MutationObserver(discoverArtworkSections);
sectionStructureObserver.observe(document.body,{childList:true});
const journeys=document.getElementById('journeys');
if(journeys)sectionStructureObserver.observe(journeys,{childList:true});
window.addEventListener('fjord:sections-changed',()=>{
  if(artworkObserver)synchronizeArtworkTimer();else scanNearbySections();
});
document.addEventListener('visibilitychange',synchronizeArtworkTimer);
reduced.addEventListener('change',synchronizeArtworkTimer);
if(!artworkObserver){
  window.addEventListener('scroll',scanNearbySections,{passive:true});
  window.addEventListener('resize',scanNearbySections,{passive:true});
}
