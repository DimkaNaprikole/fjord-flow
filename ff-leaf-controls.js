/* Progressive select enhancement: native values/events remain the source of truth. */
(() => {
  'use strict';
  if (!document.body.classList.contains('ff-leaf-system')) return;
  let serial=0, opened=null, queued=false;
  const controls=new WeakMap();
  const fold=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
  const nativeLabel=s=>s.getAttribute('aria-label') || [...(s.labels||[])].map(l=>[...l.childNodes].filter(n=>n.nodeType===3 || (n.nodeType===1&&n.matches('.sr-only'))).map(n=>n.textContent.trim()).join(' ')).filter(Boolean).join(' ') || s.name || s.id || 'Select';
  function close(){if(opened){opened.panel.hidden=true;opened.button.setAttribute('aria-expanded','false');opened.button.removeAttribute('aria-activedescendant');opened=null;}}
  function enhance(select){
    if(controls.has(select)||select.multiple||(select.size>1)||select.hasAttribute('data-ff-native'))return;
    const uid=`ff-select-${++serial}`, wrap=document.createElement('span'), button=document.createElement('button'), text=document.createElement('span'), arrow=document.createElement('span'), panel=document.createElement('div');
    wrap.className='ff-select';button.className='ff-select-trigger';button.type='button';button.setAttribute('role','combobox');button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',uid);button.dataset.i18nIgnore='';
    text.className='ff-select-label';arrow.className='ff-select-chevron';arrow.setAttribute('aria-hidden','true');button.append(text,arrow);
    panel.className='ff-leaf-menu';panel.id=uid;panel.setAttribute('role','listbox');panel.hidden=true;panel.dataset.i18nIgnore='';
    const oldTab=select.getAttribute('tabindex'), oldHidden=select.getAttribute('aria-hidden');
    select.before(wrap);wrap.append(select,button);select.classList.add('ff-select-native');select.tabIndex=-1;select.setAttribute('aria-hidden','true');
    (select.closest('dialog')||document.body).append(panel);
    let active=0, prefix='',prefixTime=0;
    const state={button,panel,select};controls.set(select,state);
    function update(){
      text.textContent=select.selectedOptions[0]?.textContent || '';
      const label=nativeLabel(select);button.setAttribute('aria-label',`${label}: ${text.textContent}`);panel.setAttribute('aria-label',label);button.disabled=select.disabled;
      if(select.required)button.setAttribute('aria-required','true');else button.removeAttribute('aria-required');
      for(const attr of ['aria-describedby','aria-invalid']){if(select.hasAttribute(attr))button.setAttribute(attr,select.getAttribute(attr));else button.removeAttribute(attr);}
      if(opened===state)close();
    }
    state.sync=()=>{const value=select.selectedOptions[0]?.textContent||'';if(text.textContent!==value||button.disabled!==select.disabled||button.getAttribute('aria-label')!==`${nativeLabel(select)}: ${value}`)update();};
    function position(){
      const r=button.getBoundingClientRect(), margin=10, below=innerHeight-r.bottom-8, above=r.top-8;
      const up=below<180&&above>below, space=Math.max(44,(up?above:below)-margin);
      panel.style.width=`${Math.min(Math.max(r.width,180),innerWidth-2*margin)}px`;
      panel.style.maxHeight=`${Math.min(320,space)}px`;panel.style.left=`${Math.max(margin,Math.min(r.left,innerWidth-panel.offsetWidth-margin))}px`;
      panel.style.top=`${up?Math.max(margin,r.top-panel.offsetHeight-6):r.bottom+6}px`;
    }
    function highlight(index){
      active=index;[...panel.children].forEach((e,i)=>e.classList.toggle('is-active',i===active));
      const opt=panel.children[active];if(opt){button.setAttribute('aria-activedescendant',opt.id);opt.scrollIntoView({block:'nearest'});}
    }
    function allowed(i){const o=select.options[i];return o&&!o.disabled&&!o.hidden&&!o.parentElement.disabled;}
    function step(direction){let i=active;for(let n=0;n<select.options.length;n++){i=(i+direction+select.options.length)%select.options.length;if(allowed(i)){highlight(i);break;}}}
    function choose(i){if(!allowed(i))return;select.selectedIndex=i;close();update();button.focus({preventScroll:true});select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));}
    function open(){
      if(button.disabled)return;close();panel.replaceChildren();
      [...select.options].forEach((o,i)=>{const item=document.createElement('div');item.className='ff-leaf-option';item.id=`${uid}-${i}`;item.setAttribute('role','option');item.setAttribute('aria-selected',String(o.selected));item.setAttribute('aria-disabled',String(!allowed(i)));item.hidden=o.hidden;item.textContent=o.textContent;item.addEventListener('pointerdown',e=>e.preventDefault());item.addEventListener('click',()=>choose(i));panel.append(item);});
      opened=state;panel.hidden=false;button.setAttribute('aria-expanded','true');position();highlight(Math.max(0,select.selectedIndex));
    }
    button.addEventListener('click',e=>{e.preventDefault();if(opened===state)close();else open();});
    button.addEventListener('keydown',e=>{
      if(['ArrowDown','ArrowUp','Home','End','Enter',' ','Escape'].includes(e.key)){
        e.preventDefault();if(e.key==='Escape'){close();return;}
        if(e.key==='Enter'||e.key===' '){if(opened===state)choose(active);else open();return;}
        if(opened!==state)open();
        if(e.key==='ArrowDown')step(1);else if(e.key==='ArrowUp')step(-1);else{const indexes=[...select.options].map((_,i)=>i).filter(allowed);highlight(e.key==='Home'?indexes[0]:indexes.at(-1));}
      }else if(e.key==='Tab'){close();}
      else if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();if(opened!==state)open();prefix=performance.now()-prefixTime<700?prefix+e.key:e.key;prefixTime=performance.now();const i=[...select.options].findIndex((o,i)=>allowed(i)&&fold(o.textContent.trim()).startsWith(fold(prefix)));if(i>=0)highlight(i);}
    });
    select.addEventListener('change',update);select.addEventListener('focus',()=>button.focus({preventScroll:true}));select.addEventListener('invalid',e=>{e.preventDefault();button.setAttribute('aria-invalid','true');button.focus();});
    select.form?.addEventListener('reset',()=>requestAnimationFrame(update));
    const observer=new MutationObserver(update);observer.observe(select,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled','selected','aria-label','aria-invalid','aria-describedby','required']});
    state.dispose=()=>{observer.disconnect();panel.remove();if(oldTab===null)select.removeAttribute('tabindex');else select.setAttribute('tabindex',oldTab);if(oldHidden===null)select.removeAttribute('aria-hidden');else select.setAttribute('aria-hidden',oldHidden);};
    update();
  }
  function scan(){queued=false;document.querySelectorAll('select').forEach(s=>{const state=controls.get(s);if(state)state.sync();else enhance(s);});if(opened&&!opened.button.isConnected)close();document.querySelectorAll('.ff-leaf-menu').forEach(p=>{const b=document.querySelector(`[aria-controls="${p.id}"]`);if(!b)p.remove();});}
  new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(scan);}}).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('pointerdown',e=>{if(opened&&!opened.panel.contains(e.target)&&!opened.button.contains(e.target))close();});
  document.addEventListener('focusin',e=>{if(opened&&!opened.button.contains(e.target)&&!opened.panel.contains(e.target))close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened){e.preventDefault();e.stopPropagation();close();}},true);
  document.addEventListener('scroll',e=>{if(opened&&!opened.panel.contains(e.target)&&e.target!==opened.panel)close();},true);
  window.addEventListener('resize',close);scan();
})();
