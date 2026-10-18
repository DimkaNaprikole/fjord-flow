/* Real section tabs, retaining deep links and navigation from the guide and maps. */
(() => {
 'use strict';
 const nav=document.querySelector('body>header>nav'),main=document.getElementById('journeys');
 if(!nav||!main)return;
 const groups={travelStories:'journal',community:'community',norwayCatalogue:'catalogue',buaEquipment:'bua',norwayWebcams:'webcams',municipalNews:'news',travelUpdates:'useful',travelServices:'services',shoppingCentres:'shopping'};
 let current='home',refreshing=false;
 const controls=()=>[...nav.children].filter(el=>el.matches('a,button')&&el.dataset.cmsDisabled!=='true');
 const keyFor=el=>groups[(el.getAttribute('href')||'').replace(/^#/,'')]||'home';
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
  [...main.children].forEach(el=>{el.dataset.siteTab=groups[el.id]||'home';});
  for(const id of ['advertising','contact','norwayOverview']){const el=document.getElementById(id);if(el)el.dataset.siteTab='home';}
  const hero=main.querySelector('.hero');if(hero&&!hero.id)hero.id='homePanel';
  nav.classList.add('site-tabs');nav.setAttribute('role','tablist');nav.setAttribute('aria-label','FJORD / FLOW');nav.setAttribute('aria-orientation','horizontal');
  controls().forEach((el,index)=>{el.setAttribute('role','tab');if(!el.id)el.id='siteTab'+index;const key=keyFor(el),target=key==='home'?hero:document.getElementById(Object.keys(groups).find(id=>groups[id]===key));if(target){el.setAttribute('aria-controls',target.id);target.setAttribute('role','tabpanel');target.setAttribute('aria-labelledby',el.id);}});
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
 refresh();fromHash();
})();
