/* Non-interactive outer decoration, shared by all public tabs. */
(()=>{
  'use strict';
  if(document.querySelector('.portal-art-frame'))return;
  const frame=document.createElement('div');frame.className='portal-art-frame';frame.setAttribute('aria-hidden','true');
  for(const side of ['left','right','top','bottom']){
    const rail=document.createElement('span');rail.className='portal-art-rail '+side;
    frame.append(rail);
  }
  document.body.append(frame);
})();
