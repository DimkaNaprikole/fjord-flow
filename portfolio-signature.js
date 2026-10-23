/* Visual indexing follows rendered cards, including language re-renders. */
(()=>{'use strict';
function indexCards(){document.querySelectorAll('#scenicRoutes .ref-photo').forEach((b,i)=>b.dataset.editorialIndex=String(i+1).padStart(2,'0'));const more=document.querySelector('#scenicRoutes>.ref-panel>.ref-link');if(more&&/\s*›$/.test(more.textContent))more.textContent=more.textContent.replace(/\s*›$/,'');}
const root=document.querySelector('#scenicRoutes');
if(root)new MutationObserver(indexCards).observe(root,{childList:true,subtree:true});
indexCards();
})();
