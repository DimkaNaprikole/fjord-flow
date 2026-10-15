/* Destination GPS follows the committed photograph, never the slideshow timer. */
(()=>{'use strict';
const hero=document.getElementById('heroScenery'),slot=document.querySelector('.hero-bottom>span');
if(!hero||!slot)return;
const labels={nb:'GPS for stedet',en:'Place GPS',uk:'GPS місця',sv:'Platsens GPS',da:'Stedets GPS'}; const photoLabels={nb:'Bildets GPS',en:'Photo GPS',uk:'GPS знімка',sv:'Fotots GPS',da:'Billedets GPS'};
const key=()=>window.FjordI18n?.language||'nb';
const heroIds={'hero-bergen.jpg':'bergen','hero-floibanen.jpg':'bergen','hero-geiranger.jpg':'geiranger','hero-naeroyfjord.jpg':'naeroyfjord','hero-atlantic.jpg':'atlantic','hero-alesund.jpg':'alesund','hero-trollstigen.jpg':'trollstigen','hero-loen.jpg':'loen','hero-stegastein.jpg':'stegastein'};
let catalogue=[],heroPoints={};
slot.dataset.i18nIgnore='';slot.classList.add('hero-gps');slot.replaceChildren();
const link=document.createElement('a'),label=document.createElement('small');link.id='heroGPS';link.target='_blank';link.rel='noopener noreferrer';link.hidden=true;slot.append(link,label);
const about=document.getElementById('about'),caption=about?.querySelector('.explorer-current-place');
const explorerLink=document.createElement('a');explorerLink.className='explorer-gps';explorerLink.target='_blank';explorerLink.rel='noopener noreferrer';explorerLink.hidden=true;explorerLink.dataset.i18nIgnore='';caption?.after(explorerLink);
function valid(p){return p&&Number.isFinite(p.latitude)&&Math.abs(p.latitude)<=90&&Number.isFinite(p.longitude)&&Math.abs(p.longitude)<=180}
function format(p){return Math.abs(p.latitude).toFixed(5)+'° '+(p.latitude<0?'S':'N')+' · '+Math.abs(p.longitude).toFixed(5)+'° '+(p.longitude<0?'W':'E')}
function paint(a,p,name){a.hidden=!valid(p);if(!valid(p)){a.removeAttribute('href');return}const u=new URL('https://www.google.com/maps/search/');u.search=new URLSearchParams({api:'1',query:p.latitude+','+p.longitude}).toString();a.href=u.href;a.textContent=(p.coordinateType==='place'?'≈ ':'')+format(p);a.title=name||p.name||'';a.setAttribute('aria-label',(name||p.name||'')+' · GPS '+format(p))}
function render(){const file=(hero.dataset.currentImage||'').split('/').pop()?.split('?')[0],point=heroPoints[file]||catalogue.find(p=>p.id===heroIds[file]);paint(link,point,hero.dataset.currentPlace);label.textContent=point?.coordinateType==='camera'?(photoLabels[key()]||photoLabels.nb):(labels[key()]||labels.nb);if(about){const selected=Number(about.dataset.selected||0),p=selected===0?{latitude:Number(about.dataset.currentLatitude),longitude:Number(about.dataset.currentLongitude)}:catalogue.find(p=>p.id===({1:'geiranger',2:'bergen'}[selected]));paint(explorerLink,selected===3?null:p,about.dataset.currentPlaceName)}}
new MutationObserver(render).observe(hero,{attributes:true,attributeFilter:['data-current-image','data-current-place']});
window.addEventListener('fjordexplorerphoto',render);window.addEventListener('fjordexplorerchange',render);window.addEventListener('fjordlanguagechange',render);
window.addEventListener('fjord:state',e=>{catalogue=e.detail?.destinations||[];render()});
if(typeof data!=='undefined'&&Array.isArray(data?.destinations))catalogue=data.destinations;
else fetch('./api/state').then(r=>r.ok?r.json():Promise.reject()).then(s=>{catalogue=s.destinations||[];render()}).catch(()=>{});
fetch('./hero-gps.json').then(r=>r.ok?r.json():Promise.reject()).then(value=>{heroPoints=value;render()}).catch(()=>{});
render();
})();
