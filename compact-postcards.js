/* Two sides of one postcard, with the existing gallery and booking actions. */
(() => {
  const grid = document.querySelector('#cards');
  if (!grid) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  const copy = {uk:['Про місце','До фотографії'],nb:['Om stedet','Til bildet'],en:['About this place','Back to photo'],sv:['Om platsen','Till bilden'],da:['Om stedet','Til billedet']};
  const labels = () => copy[document.documentElement.lang] || copy.en;
  const observed = new WeakSet();
  const visible = new Set();
  const observer = new IntersectionObserver(items => items.forEach(x => x.isIntersecting ? visible.add(x.target) : visible.delete(x.target)), {threshold:.2});
  function mount() {
    for (const card of grid.querySelectorAll(':scope > .card')) {
      if (observed.has(card)) continue;
      const photo = card.querySelector(':scope > .photo');
      const heading = card.querySelector(':scope > .card-place-heading');
      if (!photo || !heading) continue;
      observed.add(card);
      const back = document.createElement('div');
      back.className = 'postcard-back';
      for (const child of [heading,card.querySelector(':scope > .description'),card.querySelector(':scope > .card-bottom'),card.querySelector(':scope > .reference')]) if(child) back.append(child);
      back.inert = true;
      card.append(back);
      const caption = document.createElement('button');
      caption.type = 'button';
      caption.className = 'postcard-caption';
      const region = document.createElement('small');
      region.textContent = heading.querySelector('.region')?.textContent || '';
      const title = document.createElement('strong');
      title.textContent = heading.querySelector('h3')?.textContent || '';
      caption.append(region,title);
      caption.addEventListener('click', () => heading.querySelector('[data-gallery]').click());
      card.append(caption);
      const toggle = document.createElement('button');
      toggle.type = 'button';toggle.className='postcard-toggle';
      toggle.setAttribute('aria-expanded','false');
      toggle.textContent=labels()[0]+' ↻';
      let dwell=0,returnTimer=0;
      const setSide = open => {
        clearTimeout(dwell);clearTimeout(returnTimer);
        if(open){
          const current=photo.querySelector('img')?.src;
          if(current)card.style.setProperty('--postcard-photo',`url("${current}")`);
        }
        card.classList.toggle('postcard-open',open);
        back.inert=!open;photo.inert=open;caption.inert=open;
        toggle.setAttribute('aria-expanded',String(open));
        toggle.textContent=labels()[open?1:0]+(open?' ↶':' ↻');
      };
      toggle.addEventListener('click', () => {
        setSide(!card.classList.contains('postcard-open'));
      });
      card.addEventListener('pointerenter',event=>{
        if(!hover.matches||event.pointerType==='touch')return;
        clearTimeout(returnTimer);
        dwell=setTimeout(()=>{
          if(card.isConnected&&card.matches(':hover')&&!document.querySelector('dialog[open]')&&!grid.classList.contains('card-focus-scrolling'))setSide(true);
        },4000);
      });
      card.addEventListener('pointerleave',()=>{
        clearTimeout(dwell);
        if(hover.matches&&!card.matches(':focus-within'))returnTimer=setTimeout(()=>setSide(false),280);
      });
      card.addEventListener('focusout',()=>{
        setTimeout(()=>{if(!card.matches(':focus-within,:hover'))setSide(false);},0);
      });
      card.append(toggle);
      card.style.setProperty('--postcard-photo',`url("${photo.querySelector('img')?.src || ''}")`);
      card.classList.add('compact-postcard');
      observer.observe(card);
    }
  }
  new MutationObserver(mount).observe(grid,{childList:true});
  window.addEventListener('fjordlanguagechange', () => {
    for(const card of grid.querySelectorAll('.compact-postcard')) {
      const open=card.classList.contains('postcard-open');
      card.querySelector('.postcard-toggle').textContent=labels()[open?1:0]+' ↻';
    }
  });
  let turn=0;
  setInterval(() => {
    if(reduced.matches || document.hidden || document.querySelector('dialog[open]'))return;
    const cards=[...visible].filter(x=>x.isConnected&&!x.matches(':hover,:focus-within')&&!x.classList.contains('postcard-open'));
    if(!cards.length)return;
    const card=cards[turn++%cards.length];
    const pictures=[...new Set([...card.querySelectorAll('.card-atmosphere img')].map(x=>x.src))];
    const image=card.querySelector('.photo > img');
    if(!image||pictures.length<2)return;
    const next=pictures[(pictures.indexOf(image.src)+1)%pictures.length];
    const preload=new Image();preload.onload=()=>{if(card.isConnected){image.src=next;card.style.setProperty('--postcard-photo',`url("${next}")`);}};preload.src=next;
  },4500);
  mount();
})();
