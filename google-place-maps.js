/* Shared Google Maps panels for places, venue galleries and nearby results.
 * SDK and map instances are reused; hidden panels never trigger a map load. */
(() => {
  'use strict';
  const panels=new WeakMap();
  const words={nb:['Google Maps','Laster Google Maps…','Google Maps kunne ikke lastes.','Prøv igjen'],en:['Google Maps','Loading Google Maps…','Google Maps could not load.','Try again'],uk:['Google Maps','Завантажуємо Google Maps…','Не вдалося завантажити Google Maps.','Спробувати ще'],sv:['Google Maps','Laddar Google Maps…','Google Maps kunde inte laddas.','Försök igen'],da:['Google Maps','Indlæser Google Maps…','Google Maps kunne ikke indlæses.','Prøv igen']};
  const language=()=>words[window.FjordI18n?.language||document.documentElement.lang]?window.FjordI18n?.language||document.documentElement.lang:'nb';
  function normalize(p,i){const latitude=p.latitude??p.lat,longitude=p.longitude??p.lng??p.lon;if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)return null;return {...p,id:p.id||'place-'+i,latitude,longitude,name:typeof p.name==='string'?p.name:p.name?.[language()]||p.name?.en||p.name?.nb||'Norge',category:['cafe','cabin','sauna','rest'].includes(p.category)?p.category:'rest'};}
  function show(host,places,geometry){
    if(!host)return;
    const rows=(places||[]).map(normalize).filter(Boolean);let panel=panels.get(host);
    if(!panel){
      const section=document.createElement('section');section.className='google-place-map';section.dataset.i18nIgnore='';
      const heading=document.createElement('h3'),status=document.createElement('p'),canvas=document.createElement('div');canvas.className='google-place-map-canvas';canvas.setAttribute('role','region');canvas.setAttribute('aria-label','Google Maps');status.setAttribute('role','status');section.append(heading,status,canvas);host.append(section);
      panel={section,heading,status,canvas,rows:[],geometry:null,map:null,pending:false};panels.set(host,panel);
      panel.load=async()=>{
        if(panel.pending||!panel.rows.length)return;panel.pending=true;status.textContent=words[language()][1];
        try{
          if(!panel.map)panel.map=await window.FjordGoogleStandardMap.create(canvas,{...window.FjordGoogleMapConfig,userActivated:true,language:language(),buildInfo:p=>{const box=document.createElement('div');box.style.color='#173e49';const title=document.createElement('strong');title.textContent=p.name;const address=document.createElement('p');address.textContent=p.address||p.town||'';box.append(title,address);return box;}});
          panel.heading.textContent=panel.map.provider==='openstreetmap'?'OpenStreetMap':words[language()][0];panel.map.resize();panel.map.render(panel.rows,null,'all',true);if(panel.rows.length===1&&!panel.geometry?.length)panel.map.focus(panel.rows[0]);panel.map.setPath?.(panel.geometry);status.textContent='';
        }catch{status.textContent=words[language()][2]+' ';const retry=document.createElement('button');retry.type='button';retry.textContent=words[language()][3];retry.onclick=panel.load;status.append(retry);}
        finally{panel.pending=false;}
      };
      if('IntersectionObserver'in window){panel.observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&panel.rows.length)panel.load();},{rootMargin:'40px'});panel.observer.observe(canvas);}
    }
    if(!panel.section.isConnected)host.append(panel.section);
    panel.rows=rows;panel.geometry=geometry;panel.heading.textContent=words[language()][0];panel.section.hidden=!rows.length;
    const r=panel.canvas.getBoundingClientRect();if(rows.length&&r.width&&r.bottom>0&&r.top<innerHeight)panel.load();
  }
  window.FjordPlaceMaps={show};
  window.addEventListener('fjord:cafe-results',event=>{
    const results=document.getElementById('cafeNearbyResults');if(!results)return;
    let host=document.getElementById('cafeNearbyGoogleMap');if(!host){host=document.createElement('div');host.id='cafeNearbyGoogleMap';results.before(host);}
    show(host,event.detail?.places||[]);
  });
})();
