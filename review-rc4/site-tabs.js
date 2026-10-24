/* Real section tabs, retaining deep links and navigation from the guide and maps. */
(() => {
 'use strict';
 const groups={travelStories:'forum',community:'forum',norwayCatalogue:'catalogue',buaEquipment:'home',norwayWebcams:'webcams',municipalNews:'news',travelUpdates:'home',travelServices:'home',shoppingCentres:'catalogue'};
 const aliases={journal:'forum',community:'forum',bua:'home',useful:'home',services:'home',shopping:'catalogue'};
 const keyForId=id=>groups[id]||'home';
 const normalizeKey=key=>aliases[key]||key;
 const primary=[['home','journeys'],['catalogue','norwayCatalogue'],['webcams','norwayWebcams'],['forum','community'],['news','municipalNews']];
 const labels={nb:['Turisme','Katalog','Webkameraer','Facebook','Nyheter'],en:['Tourism','Catalogue','Webcams','Facebook','News'],uk:['Туризм','Каталог','Вебкамери','Facebook','Новини'],sv:['Turism','Katalog','Webbkameror','Facebook','Nyheter'],da:['Turisme','Katalog','Webkameraer','Facebook','Nyheder']};
 const shortcuts={home:[['collection',['Steder','Places','Місця','Platser','Steder']],['buaEquipment',['BUA','BUA','BUA','BUA','BUA']],['scenicRoutes',['Ruter','Routes','Маршрути','Rutter','Ruter']],['waterfallChapter',['Fossefall','Waterfalls','Водоспади','Vattenfall','Vandfald']],['cafeStops',['Kafeer','Cafes','Кав’ярні','Kaféer','Caféer']],['staysSauna',['Hytter og badstuer','Cabins and saunas','Будиночки та сауни','Stugor och bastur','Hytter og saunaer']],['travelServices',['Tjenester for reisen','Travel services','Сервіси для подорожей','Resetjänster','Tjenester til rejsen']],['travelUpdates',['På veien','On the road','У дорозі','På vägen','På vejen']]],catalogue:[['norwayCatalogue',['Steder og overnatting','Places and stays','Місця та проживання','Platser och boende','Steder og overnatning']],['shoppingCentres',['Kjøpesentre og butikker','Shopping centres and shops','Торгові центри та магазини','Köpcentrum och butiker','Indkøbscentre og butikker']]],forum:[['community',['Samtaler','Discussions','Обговорення','Samtal','Samtaler']],['travelStories',['Reisejournalen vår','Our travel journal','Наш щоденник подорожей','Vår resejournal','Vores rejsedagbog']]]};
 if(typeof module!=='undefined'&&module.exports){module.exports={groups,keyForId,normalizeKey,primary,labels};return;}
 const nav=document.querySelector('body>header>nav'),main=document.getElementById('journeys');
 if(!nav||!main)return;
 const language=()=>Object.hasOwn(labels,window.FjordI18n?.language||document.documentElement.lang)?window.FjordI18n?.language||document.documentElement.lang:'nb';
 const groupMenus=new Map();
 for(const [key,items]of Object.entries(shortcuts)){
  const menu=document.createElement('nav');menu.className='site-group-links';menu.dataset.fjordGroupMenu=key;menu.dataset.i18nIgnore='';
  for(const [id,words]of items){const link=document.createElement('a');link.href='#'+id;link.dataset.words=JSON.stringify(words);menu.append(link);}
  const picker=document.createElement('select');picker.className='site-group-picker';picker.onchange=()=>{if(picker.value)location.hash=picker.value;};menu.prepend(picker);
  main.prepend(menu);groupMenus.set(key,menu);
 }
 for(const [key,id]of primary){const link=document.createElement('a');link.href='#'+id;link.id='sitePrimary-'+key;link.dataset.primaryTab=key;link.dataset.i18nIgnore='';nav.append(link);}
 function renderLabels(){const lang=language(),index=['nb','en','uk','sv','da'].indexOf(lang);primary.forEach(([key],i)=>{document.getElementById('sitePrimary-'+key).textContent=labels[lang][i];});for(const [key,menu]of groupMenus){menu.setAttribute('aria-label',labels[lang][primary.findIndex(item=>item[0]===key)]);const links=[...menu.querySelectorAll('a')];for(const link of links)link.textContent=JSON.parse(link.dataset.words)[index];const picker=menu.querySelector('select');picker.setAttribute('aria-label',['Seksjoner','Sections','Розділи','Avsnitt','Afsnit'][index]);picker.replaceChildren();const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent=['Seksjoner','Sections','Розділи','Avsnitt','Afsnit'][index];picker.append(placeholder);for(const link of links){const option=document.createElement('option');option.value=link.hash.slice(1);option.textContent=link.textContent;picker.append(option);}}}
 renderLabels();window.addEventListener('fjordlanguagechange',renderLabels);
 let current='home',refreshing=false;
 const controls=()=>primary.map(([key])=>document.getElementById('sitePrimary-'+key)).filter(el=>el&&el.dataset.cmsDisabled!=='true');
 const keyFor=el=>el.dataset.primaryTab||keyForId((el.getAttribute('href')||'').replace(/^#/,''));
 const modified=event=>event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||(typeof event.button==='number'&&event.button!==0);
 const motion=()=>matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth';
 function rootFor(target){return target?.closest('[data-site-tab]');}
 function reveal(target,{historyMode='',scroll=false}={}){
  if(typeof target==='string')target=document.getElementById(target.replace(/^#/,''));
  const root=rootFor(target),key=root?.dataset.siteTab||'home';
  activate(key,{historyMode,scroll:false});
  if(scroll&&target)target.scrollIntoView({block:'start',behavior:motion()});
 }
 function activate(key,{historyMode='',scroll=false}={}){
  key=normalizeKey(key);
  if(key!=='home'&&!Object.values(groups).includes(key))key='home';
  if(controls().every(el=>keyFor(el)!==key))key='home';
  current=key;
  document.querySelectorAll('[data-site-tab]').forEach(el=>{const selected=el.dataset.siteTab===key;el.dataset.siteTabActive=String(selected);el.hidden=!selected;});
  controls().forEach(el=>{const selected=keyFor(el)===key;el.setAttribute('aria-selected',String(selected));el.tabIndex=selected?0:-1;el.classList.toggle('active',selected);});
  const selected=controls().find(el=>keyFor(el)===key);
  if(selected&&nav.scrollWidth>nav.clientWidth){const box=selected.getBoundingClientRect(),bounds=nav.getBoundingClientRect();if(box.left<bounds.left||box.right>bounds.right)nav.scrollTo({left:Math.max(0,nav.scrollLeft+box.left-bounds.left-(nav.clientWidth-box.width)/2),behavior:motion()});}
  if(historyMode){const control=controls().find(el=>keyFor(el)===key),hash=control?.getAttribute('href')||'#journeys';history[historyMode==='push'?'pushState':'replaceState'](null,'',hash);}
  window.dispatchEvent(new Event('fjord:sections-changed'));
  window.dispatchEvent(new Event('resize'));
  if(scroll)main.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
 }
 function refresh(){
  if(refreshing)return;refreshing=true;
  [...main.children].forEach(el=>{if(el.dataset.followMenuGap)return;el.dataset.siteTab=el.dataset.fjordGroupMenu||keyForId(el.id);});
  for(const el of nav.children)if(el.matches('a,button')&&!el.dataset.primaryTab){el.dataset.legacyTab='';el.hidden=true;el.removeAttribute('role');el.removeAttribute('aria-selected');el.tabIndex=-1;}
  for(const id of ['advertising','contact','norwayOverview']){const el=document.getElementById(id);if(el)el.dataset.siteTab='home';}
  const hero=main.querySelector('.hero');if(hero&&!hero.id)hero.id='homePanel';
  nav.classList.add('site-tabs');nav.setAttribute('role','tablist');nav.setAttribute('aria-label','FJORD / FLOW');nav.setAttribute('aria-orientation','horizontal');
  controls().forEach((el,index)=>{el.setAttribute('role','tab');if(!el.id)el.id='siteTab'+index;const key=keyFor(el),target=key==='home'?hero:document.getElementById(primary.find(item=>item[0]===key)?.[1]);if(target){el.setAttribute('aria-controls',target.id);target.setAttribute('role','tabpanel');target.setAttribute('aria-labelledby',el.id);}});
  activate(current);refreshing=false;
 }
 nav.addEventListener('click',event=>{const control=event.target.closest('[role=tab]');if(!control||!nav.contains(control)||modified(event))return;event.preventDefault();event.stopImmediatePropagation();activate(keyFor(control),{historyMode:'push',scroll:false});},true);
 nav.addEventListener('keydown',event=>{const control=event.target.closest('[role=tab]');if(!control||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const tabs=controls(),i=tabs.indexOf(control),next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(i+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].focus();activate(keyFor(tabs[next]),{historyMode:'push'});});
 document.addEventListener('click',event=>{const a=event.target.closest('a[href^="#"]');if(!a||nav.contains(a)||modified(event))return;const target=document.getElementById(a.hash.slice(1));if(target)reveal(target);},true);
 const fromHash=()=>{const target=document.getElementById(location.hash.slice(1));if(target)reveal(target);else activate('home');};
 window.addEventListener('hashchange',fromHash);window.addEventListener('popstate',fromHash);
 for(const [name,id] of Object.entries({'fjord:bua-select':'buaEquipment','fjord:shopping-select':'shoppingCentres','fjord:catalogue-select':'norwayCatalogue','fjord:catalogue-nearby':'norwayCatalogue','fjord:shopping-map':'norwayOverview','fjord:open-place':'collection'}))window.addEventListener(name,()=>reveal(id),true);
 window.FjordTabs={reveal,activate,get current(){return current;}};
 new MutationObserver(refresh).observe(main,{childList:true});
 new MutationObserver(refresh).observe(nav,{childList:true});
 function markSection(){for(const menu of groupMenus.values()){if(menu.hidden)continue;const links=[...menu.querySelectorAll('a')];let active,best=-Infinity;for(const link of links){const target=document.getElementById(link.hash.slice(1));const top=target?.getBoundingClientRect().top;if(target?.getBoundingClientRect().height&&top<=180&&top>best){active=link;best=top;}}for(const link of links){if(link===active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}menu.querySelector('select').value=active?active.hash.slice(1):'';}}
 let markQueued=false;window.addEventListener('scroll',()=>{if(!markQueued){markQueued=true;requestAnimationFrame(()=>{markQueued=false;markSection();});}},{passive:true});window.addEventListener('hashchange',markSection);window.addEventListener('fjord:sections-changed',()=>requestAnimationFrame(markSection));
 refresh();fromHash();
})();
