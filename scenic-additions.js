/* Keep the local preview and static catalogue on the same editorial selection. */
(() => {
 let additions=[];
 function apply(){
  if(typeof data==='undefined'||!Array.isArray(data?.destinations)||!additions.length)return;
  let changed=false;
  for(const place of additions)if(!data.destinations.some(p=>p.id===place.id)){data.destinations.push(place);changed=true;}
  if(changed){
   cards();
   for(const place of additions){
    const credits=document.querySelector('#creditsList');if(!credits)continue;
    const p=document.createElement('p');p.append(place.name+' — '+place.imageCredit+' · ');
    for(const [label,href]of [[place.imageLicense,place.imageLicenseUrl],['Original photograph',place.imageSource]]){const a=document.createElement('a');a.textContent=label;a.href=href;a.target='_blank';a.rel='noopener noreferrer';p.append(a,' · ');}credits.append(p);
   }
   window.dispatchEvent(new CustomEvent('fjord:state',{detail:data}));
  }
 }
 window.addEventListener('fjord:state',apply);
 fetch('./scenic-additions.json?v=2').then(r=>{if(!r.ok)throw Error('Catalogue');return r.json();}).then(rows=>{additions=rows;apply();}).catch(()=>{});
})();
