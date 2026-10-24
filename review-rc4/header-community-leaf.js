/* Delegate the compact Foto action to the existing photo button. */
(() => {
  let scheduled=false;
  function sync(){scheduled=false;const lang=(document.documentElement.lang||'nb').split('-')[0];const label=lang==='uk'?'Фото':lang==='en'?'Photo':'Foto';
    for(const card of document.querySelectorAll('#community article.ref-card.ref-card-plain')){
      const photo=card.querySelector('button.ref-photo'),actions=card.querySelector('.ref-actions');if(!photo||!actions)continue;
      let button=actions.querySelector('.community-photo-action');
      if(!button){button=document.createElement('button');button.type='button';button.className='ref-link community-photo-action';button.addEventListener('click',()=>photo.click());actions.prepend(button);}
      if(button.textContent!==label)button.textContent=label;
    }
    if(['127.0.0.1','localhost'].includes(location.hostname)){
      const social=document.querySelector('#fjordSiteAccount .fjord-social-buttons');
      if(social){let note=social.parentElement.querySelector('.local-auth-preview-note');
        if(!note){note=document.createElement('p');note.className='local-auth-preview-note';note.setAttribute('role','status');note.append(document.createElement('span'),document.createElement('a'));social.after(note);}
        const copy={nb:'Google-innlogging er ikke tilgjengelig på denne lokale adressen. ',en:'Google sign-in is unavailable at this local address. ',uk:'Вхід через Google недоступний за цією локальною адресою. ',sv:'Google-inloggning är inte tillgänglig på denna lokala adress. ',da:'Google-login er ikke tilgængeligt på denne lokale adresse. '};
        if(note.dataset.lang!==lang){note.dataset.lang=lang;note.querySelector('span').textContent=copy[lang]||copy.en;const link=note.querySelector('a');link.href='https://dimkanaprikole.github.io/fjord-flow/';link.target='_blank';link.rel='noopener noreferrer';link.textContent='Fjord Flow ↗';}
      }
    }
    for(const e of document.querySelectorAll('#municipalNews [title]')){
      const hint=(e.getAttribute('title')||'').trim();const label=(e.getAttribute('aria-label')||'').trim();const text=(e.textContent||'').trim();
      if(hint&&(hint===label||hint===text))e.removeAttribute('title');
    }
    for(const a of document.querySelectorAll('#contact a.developer-card__direct-email,#contact .developer-card__contacts a,#contact .ff-business-back a.developer-card__cta')){
      const href=a.getAttribute('href')||'';let text='';
      if(href.startsWith('mailto:')||href.includes('mail.google.com/'))text='E-post';
      else if(href.includes('m.me/')||href.includes('messenger.com/'))text='Messenger';
      if(text&&a.textContent!==text)a.textContent=text;
    }
    const back=document.querySelector('#contact .ff-business-back');
    if(back){const seen=new Set();for(const a of back.querySelectorAll('a.developer-card__direct-email,a.developer-card__cta,.developer-card__contacts a')){
      if(!['E-post','Messenger'].includes(a.textContent.trim()))continue;
      const key=a.href.replace(/\/$/,'');const duplicate=seen.has(key);a.classList.toggle('ff-contact-duplicate',duplicate);seen.add(key);
    }
    const row=back.querySelector('.developer-card__contacts');if(row){const links=[...row.querySelectorAll('a')];row.classList.toggle('ff-contact-duplicate',links.length>0&&links.every(a=>a.classList.contains('ff-contact-duplicate')));}}
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(sync)}}
  new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true});
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});sync();
})();
