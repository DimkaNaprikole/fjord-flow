/* One character moves between the page dock and the expanded conversation. */
(()=>{'use strict';
function attach(){
 const launch=document.querySelector('.osiris-launch[data-osiris-presence]'),dialog=document.getElementById('fjordHelper');
 if(!launch||!dialog)return false;
 const pet=launch.querySelector('.fjord-ai-pet'),portrait=dialog.querySelector('.fjord-ai-portrait');
 if(!pet||!portrait)return false;
 const duplicate=portrait.querySelector('.fjord-ai-pet');duplicate?.remove();
 function sync(){
  const expanded=dialog.open&&!dialog.classList.contains('osiris-compact')&&!dialog.classList.contains('fjord-ai-auth-pending');
  const parent=expanded?portrait:launch;
  if(pet.parentNode!==parent)parent.insertBefore(pet,parent.firstChild);
  launch.hidden=expanded;
  launch.setAttribute('data-osiris-docked',expanded?'chat':'page');
 }
 const observer=new MutationObserver(sync);observer.observe(dialog,{attributes:true,attributeFilter:['open','class']});
 sync();window.addEventListener('pagehide',e=>{if(!e.persisted)observer.disconnect()},{once:true});return true;
}
function start(){if(attach())return;const waiting=new MutationObserver(()=>{if(attach())waiting.disconnect()});waiting.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-osiris-presence']});window.addEventListener('pagehide',()=>waiting.disconnect(),{once:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
