/* Non-interactive outer decoration, shared by all public tabs. */
(()=>{
  'use strict';
  if(document.querySelector('.portal-art-frame'))return;
  const frame=document.createElement('div');frame.className='portal-art-frame';frame.setAttribute('aria-hidden','true');
  for(const side of ['left','right']){
    const rail=document.createElement('span');rail.className='portal-art-rail '+side;
    frame.append(rail);
  }
  document.body.append(frame);
  const header=document.querySelector('body>header');
  if(header){
    const top=document.createElement('span');
    top.className='portal-art-rail top portal-art-start';
    top.setAttribute('aria-hidden','true');
    header.append(top);
  }
  {
    const end=document.createElement('div');
    end.className='portal-art-finish';
    end.setAttribute('aria-hidden','true');
    const bottom=document.createElement('span');
    bottom.className='portal-art-rail bottom portal-art-end';
    bottom.setAttribute('aria-hidden','true');
    end.append(bottom);
    document.body.append(end);
  }
})();
