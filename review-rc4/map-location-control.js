/* A shared, explicit-click location control for every map provider. No automatic GPS. */
(() => {
 'use strict';
 const texts={
 nb:['Hvor er jeg','Finner posisjon…','Tillat posisjon for dette nettstedet.','Posisjonen kunne ikke finnes. Prøv igjen.'],
 en:['Where am I','Finding location…','Allow location for this website.','Could not find your location. Try again.'],
 uk:['Де я','Визначаємо місце…','Дозвольте геолокацію для цього сайту.','Не вдалося визначити місце. Спробуйте ще.'],
 sv:['Var är jag','Söker position…','Tillåt platsåtkomst för webbplatsen.','Positionen kunde inte hittas. Försök igen.'],
 da:['Hvor er jeg','Finder position…','Tillad placering for denne hjemmeside.','Placeringen kunne ikke findes. Prøv igen.']};
 function attach(container,options){
  container.classList.add('fjord-map-has-location');const wrap=document.createElement('div');wrap.className='fjord-map-location';
  const button=document.createElement('button');button.type='button';const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.hidden=true;wrap.append(button,status);container.append(wrap);
  for(const type of ['click','dblclick','pointerdown','mousedown','touchstart','wheel'])wrap.addEventListener(type,event=>event.stopPropagation(),{passive:true});
  let request,pending=false,destroyed=false,errorIndex=null;
  const words=()=>texts[window.FjordI18n?.language||document.documentElement.lang]||texts.nb;
  function labels(){const w=words();button.textContent=pending?w[1]:'◎ '+w[0];button.disabled=pending;button.setAttribute('aria-label',w[0]);button.setAttribute('aria-busy',String(pending));status.hidden=errorIndex===null;status.textContent=errorIndex===null?'':w[errorIndex];}
  button.addEventListener('click',async()=>{
   if(pending||destroyed)return;pending=true;errorIndex=null;labels();
   try{
    if(!window.FjordBrowserGeolocation)throw Error('LOCATION_UNAVAILABLE');
    request=window.FjordBrowserGeolocation.locate({userInitiated:true});const position=await request.promise,c=position?.coords;
    if(destroyed||!button.isConnected)return;
    if(!Number.isFinite(c?.latitude)||!Number.isFinite(c?.longitude)||Math.abs(c.latitude)>90||Math.abs(c.longitude)>180)throw Error('LOCATION_INVALID');
    options.locate({latitude:c.latitude,longitude:c.longitude,accuracy:c.accuracy});
   }catch(error){if(!destroyed)errorIndex=error?.code===1?2:3;}
   finally{request=null;pending=false;if(!destroyed)labels();}
  });
  window.addEventListener('fjordlanguagechange',labels);labels();
  return {destroy(){destroyed=true;request?.cancel();window.removeEventListener('fjordlanguagechange',labels);wrap.remove();}};
 }
 window.FjordMapLocation={attach};
})();
