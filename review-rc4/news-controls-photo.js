/* One existing hero image extends to the live beginning of the news grid. */
(() => {
 let panel=null,layer=null,watch=null,scheduled=false;
 function update(){scheduled=false;const section=document.getElementById('municipalNews'),next=section?.querySelector(':scope>.ref-panel');if(!next)return;
  if(next!==panel){watch?.disconnect();layer?.remove();panel=next;layer=document.createElement('div');layer.className='ff-news-controls-backdrop';layer.setAttribute('aria-hidden','true');const image=document.createElement('img');image.alt='';layer.append(image);panel.prepend(layer);section.classList.add('ff-news-photo-through-controls');watch=new ResizeObserver(schedule);watch.observe(panel);}
  const original=panel.querySelector('.ref-hero>img');if(!original?.getAttribute('src'))return;
  const image=layer.querySelector('img');if(image.getAttribute('src')!==original.getAttribute('src'))image.src=original.getAttribute('src');
  const grid=panel.querySelector('.news-grid'),last=panel.querySelector('.news-location')||panel.querySelector('.news-filters');
  const top=panel.getBoundingClientRect().top;const stop=grid?grid.getBoundingClientRect().top-12:last?last.getBoundingClientRect().bottom+16:panel.querySelector('.ref-hero')?.getBoundingClientRect().bottom;
  if(!Number.isFinite(stop))return;const height=Math.max(0,Math.round(stop-top));if(layer.style.height!==height+'px')layer.style.height=height+'px';
 }
 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(update)}}
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});window.addEventListener('resize',schedule);update();
})();
