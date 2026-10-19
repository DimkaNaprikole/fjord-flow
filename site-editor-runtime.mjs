/* Published, validated content only. Drafts enter solely through the same-origin editor preview. */
import {PAGES,BLOCKS,BUTTONS,LANGUAGES,validateDocument,emptyDocument,elementDescriptor} from './site-editor-schema.mjs?v=7';
import {globalDesignCSS,individualDesignDescriptor,DESIGN_SCOPE} from './global-design.mjs?v=2';
import {elementCSS,createElementMedia} from './element-design.mjs?v=3';
import {createSectionOrder} from './section-order.mjs?v=1';
import {mergeCatalogue} from './catalogue-content.mjs';
let documentValue=emptyDocument(),scheduled=false,originalNavOrder=null,lastPreviewTarget='',lastCredits='';
const previewNonce=new URL(location.href).searchParams.get('editorPreview');
const preview=!!previewNonce&&window.parent!==window;
const style=document.createElement('style');style.id='fjordPublishedDesign';document.head.append(style);
const originals=new WeakMap(),mediaOriginals=new WeakMap(),buttonLinks=new WeakMap();
const applySectionOrder=createSectionOrder(document);
const applyElementMedia=createElementMedia(document,elementDescriptor,image);
let activePlaces=[],lastPlaces='';
window.FjordCatalogueContent=Object.freeze({merge:base=>mergeCatalogue(base,activePlaces),get places(){return activePlaces;}});
const language=()=>window.FjordI18n?.language||document.documentElement.lang||'nb';
let lastLanguage=language();
const select=s=>s?document.querySelector(s):null;
function text(node,value){
 if(!node)return;let state=originals.get(node);const lang=language();
 if(!state){state={versions:new Map(),last:null,ignore:node.hasAttribute('data-i18n-ignore')};originals.set(node,state);}
 if(node.innerHTML!==state.last)state.versions.set(lang,node.innerHTML);
 const original=state.versions.get(lang);
 if(value!==undefined){node.dataset.i18nIgnore='';if(node.textContent!==value)node.textContent=value;node.dataset.cmsText='true';state.last=node.innerHTML;}
 else if(original!==undefined){if(node.innerHTML!==original)node.innerHTML=original;delete node.dataset.cmsText;if(!state.ignore)delete node.dataset.i18nIgnore;state.last=node.innerHTML;}
}
function image(node,value){if(!node)return;if(!mediaOriginals.has(node))mediaOriginals.set(node,{src:node.getAttribute('src'),alt:node.getAttribute('alt')});const m=value||mediaOriginals.get(node);for(const key of ['src','alt']){const v=m[key]??'';if(node.getAttribute(key)!==v)node.setAttribute(key,v);}}
function themeCSS(theme){
 const vars=[];for(const key of ['panel','card','action','ink','muted','accent'])if(theme[key])vars.push(`--ff-${key}:${theme[key]}`);
 for(const [key,name]of Object.entries({gutter:'page-gutter',inset:'panel-inset',radius:'radius',contentWidth:'content-max'}))if(theme[key]!==undefined)vars.push(`--ff-${name}:${theme[key]}px`);
 let css='[data-cms-disabled="true"]{display:none!important}[data-cms-text]{white-space:pre-line;overflow-wrap:anywhere}.hero h1[data-cms-text]{font-size:clamp(36px,6vw,90px);max-width:100%;line-height:1.08} :root{'+vars.join(';')+'}';
 if(theme.font)css+=`body,h1,h2,h3,button,input,select,textarea{font-family:"${theme.font}",sans-serif!important}`;
 if(theme.panel)css+=':is(.roadtrip-collection,.route-experiences,.stays-sauna,.community-section,.discovery-cafes,.discovery-stories,.fjord-contact,.drone-experience){background:var(--ff-panel)!important}';
 if(theme.headerOpacity!==undefined)css+=`body>header>.solidarity-art-pair{opacity:${theme.headerOpacity}!important}`;
 if(theme.headerHeight!==undefined)css+=`@media(min-width:651px){body>header{min-height:${theme.headerHeight}px!important}}`;
 if(theme.headerPosition!==undefined)css+=`.solidarity-art-pair>.solidarity-art{object-position:50% ${theme.headerPosition}%!important}`;
 css+=globalDesignCSS(documentValue.globalDesign);
 for(const button of BUTTONS){const value=documentValue.buttons[button.id];if(!value)continue;const rules=[];for(const [key,property]of Object.entries({fontSize:'font-size',padding:'padding',radius:'border-radius'}))if(value[key]!==undefined)rules.push(property+':'+value[key]+'px!important');for(const [key,property]of Object.entries({background:'background',color:'color'}))if(value[key])rules.push(property+':'+value[key]+'!important');if(rules.length)css+=DESIGN_SCOPE+' :is('+button.selector+'){'+rules.join(';')+'}';}
 const hero=documentValue.media.hero;if(hero)css+=`#heroScenery{background-image:url("${hero.src}")!important}#heroScenery .hero-location-film{display:none!important}`;
 return css+elementCSS(documentValue.elements,id=>individualDesignDescriptor(elementDescriptor(id)));
}
function apply(){
 scheduled=false;
 applySectionOrder(documentValue.sectionOrder);
 const placesJSON=JSON.stringify(documentValue.catalogue.places);if(placesJSON!==lastPlaces){activePlaces=documentValue.catalogue.places;lastPlaces=placesJSON;style.dataset.catalogueCount=String(activePlaces.length);window.dispatchEvent(new CustomEvent('fjord:catalogue-content'));}
 if(language()!==lastLanguage){
  for(const item of [...PAGES,...BLOCKS,...BUTTONS.map(b=>({title:b.selector}))])for(const field of ['title','intro']){const node=select(item[field]),state=node&&originals.get(node);if(node?.dataset.cmsText&&state&&node.innerHTML===state.last){const native=state.versions.get(lastLanguage);if(native!==undefined){node.innerHTML=native;delete node.dataset.cmsText;if(!state.ignore)delete node.dataset.i18nIgnore;state.last=null;}}}
  window.FjordI18n?.apply();lastLanguage=language();
 }
 const css=themeCSS(documentValue.theme);if(style.textContent!==css)style.textContent=css;
 for(const [kind,items]of [['pages',PAGES],['blocks',BLOCKS]])for(const item of items){
  const value=documentValue[kind][item.id]||{},root=select(item.root);
  if(root){const disabled=String(value.enabled===false);if(root.dataset.cmsDisabled!==disabled)root.dataset.cmsDisabled=disabled;}
  for(const field of ['title','intro'])text(select(item[field]),value[field]?.[language()]);
 }
 for(const button of BUTTONS){const node=select(button.selector);if(!node)continue;const value=documentValue.buttons[button.id]||{};text(node,value.label?.[language()]);if(button.link){if(!buttonLinks.has(node))buttonLinks.set(node,node.getAttribute('href'));const href=value.href||buttonLinks.get(node);if(node.getAttribute('href')!==href)node.setAttribute('href',href);}}
 const account=select('#headerAccount');if(account)for(const [index,id]of [...documentValue.headerButtonOrder,...['signIn','register'].filter(id=>!documentValue.headerButtonOrder.includes(id))].entries()){const node=select(BUTTONS.find(b=>b.id===id).selector);if(node)node.style.order=String(index);}
 const nav=document.querySelector('body>header>nav');
 // The approved primary groups supersede the retired navigation ordering.
 if(nav&&!nav.querySelector('[data-primary-tab]')){const controls=[...nav.children].filter(n=>n.matches('a,button')),key=n=>PAGES.find(p=>n.getAttribute('href')===p.root)?.id||'home';
  controls.forEach(n=>{const disabled=String(documentValue.pages[key(n)]?.enabled===false);if(n.dataset.cmsDisabled!==disabled)n.dataset.cmsDisabled=disabled;});
  if(documentValue.navOrder.length&&!originalNavOrder)originalNavOrder=controls.map(key);
  const requested=documentValue.navOrder.length?documentValue.navOrder:originalNavOrder||controls.map(key);
  const order=[...requested,...PAGES.map(p=>p.id).filter(id=>!requested.includes(id))];
  const sorted=[...controls].sort((a,b)=>order.indexOf(key(a))-order.indexOf(key(b)));
  if(sorted.some((n,i)=>n!==controls[i]))sorted.forEach(n=>nav.append(n));
 }
 // An element photo wins over the older media setting. Do not reset its src and set it
 // again on every observer pass; restore normal media only after its overlay is removed.
 applyElementMedia(documentValue.elements,documentValue.media);
 const allMedia=[...Object.values(documentValue.media),...Object.values(documentValue.elements).flatMap(value=>[value.image,value.tablet?.image,value.mobile?.image]).filter(Boolean)];
 const creditJSON=JSON.stringify(allMedia);
 if(creditJSON!==lastCredits){const host=select('.photo-legal details');if(host){let credits=select('#editorPhotoCredits');if(!credits){credits=document.createElement('div');credits.id='editorPhotoCredits';host.append(credits);}credits.replaceChildren();for(const media of allMedia){if(!media.credit&&!media.source)continue;const row=document.createElement('p'),entry=document.createElement(media.source?'a':'span');entry.textContent=media.credit||media.source;if(media.source){entry.href=media.source;entry.target='_blank';entry.rel='noopener noreferrer';}row.append(entry);credits.append(row);}lastCredits=creditJSON;}}
 if(documentValue.pages[window.FjordTabs?.current]?.enabled===false)window.FjordTabs.activate('home');
}
function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(apply);}}
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
window.addEventListener('fjordlanguagechange',schedule);
window.addEventListener('resize',schedule);
if(preview){
 const reply=data=>parent.postMessage({...data,nonce:previewNonce},location.origin);
 window.addEventListener('message',event=>{
  if(event.source!==parent||event.origin!==location.origin||event.data?.nonce!==previewNonce)return;
  const message=event.data;
  if(message.type==='fjord-editor:apply'){try{const next=validateDocument(message.document);if(LANGUAGES.includes(message.language)&&language()!==message.language)window.FjordI18n?.setLanguage(message.language);documentValue=next;apply();if(PAGES.some(p=>p.id===message.pageId))window.FjordTabs?.activate(message.pageId);const target=BLOCKS.find(b=>b.id===message.blockId)||PAGES.find(p=>p.id===message.pageId);if(target&&target.id!==lastPreviewTarget)select(target.root)?.scrollIntoView({block:'start'});lastPreviewTarget=target?.id||'';reply({type:'fjord-editor:applied'});}catch{reply({type:'fjord-editor:error',error:'invalid_document'});}}
 });
 reply({type:'fjord-editor:ready'});
}else{
 try{const config=await fetch('./chat-config.json',{cache:'no-cache'}).then(r=>r.json());const response=await fetch(config.endpoint+'/cms/public',{signal:AbortSignal.timeout(6000)});if(response.ok){const data=await response.json();if(data.document)documentValue=validateDocument(data.document);}}
 catch{/* The original website remains available if the editor service is unavailable. */}
}
schedule();
