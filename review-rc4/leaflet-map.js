/* Shared map fallback. Leaflet 1.9.4 (BSD-2-Clause); OSM interactive tiles only. */
(() => {
 'use strict';
 const valid=p=>!!p&&Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&Math.abs(p.latitude)<=90&&Math.abs(p.longitude)<=180;
 const pathPoints=geometry=>(Array.isArray(geometry)?geometry:[]).filter(p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90).map(p=>[p[1],p[0]]);
 if(typeof window==='undefined'){if(typeof module!=='undefined')module.exports={valid,pathPoints};return;}
 const preferred=()=>window.FjordGoogleMapConfig?.provider!=='google'&&(['localhost','127.0.0.1','[::1]','::1'].includes(window.location.hostname)||window.FjordGoogleMapsFailed===true);
 const language=()=>window.FjordI18n?.language||document.documentElement.lang||'nb';
 const strings={nb:['Kartflisene kunne ikke lastes.','Prøv igjen','Åpne kartet','Din posisjon'],en:['Map tiles could not load.','Try again','Open map','Your location'],uk:['Не вдалося завантажити карту.','Спробувати ще','Відкрити карту','Ваше місце'],sv:['Kartbilderna kunde inte laddas.','Försök igen','Öppna kartan','Din position'],da:['Kortbillederne kunne ikke indlæses.','Prøv igen','Åbn kortet','Din position']};
 const words=()=>strings[language()]||strings.nb;
 let loading;
 function load(){
  if(window.L?.map)return Promise.resolve(window.L);
  if(loading)return loading;
  loading=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='./vendor/leaflet/leaflet.js';script.async=true;
   const timer=setTimeout(()=>{script.remove();reject(Error('MAP_LIBRARY_TIMEOUT'));},12000);
   script.onload=()=>{clearTimeout(timer);if(window.L?.map)resolve(window.L);else reject(Error('MAP_LIBRARY_UNAVAILABLE'));};
   script.onerror=()=>{clearTimeout(timer);script.remove();reject(Error('MAP_LIBRARY_UNAVAILABLE'));};
   document.head.append(script);
  }).catch(e=>{loading=null;throw e;});return loading;
 }
 async function create(container,options={}){
  const L=await load();container.replaceChildren();container.dataset.mapProvider='openstreetmap';container.classList.add('fjord-leaflet-map');
  const map=L.map(container,{center:[64.5,11],zoom:5,scrollWheelZoom:options.scrollwheel!==false,zoomControl:true,attributionControl:true});
  const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'}).addTo(map);
  const markers=L.layerGroup().addTo(map);let routeLine,userMarker,lastRows=[],lastRoute=null,lastCategory='all',first=true,destroyed=false,failures=0;
  const banner=document.createElement('div');banner.className='fjord-map-error';banner.hidden=true;banner.setAttribute('role','status');container.append(banner);
  function showError(){if(destroyed)return;banner.replaceChildren();const text=document.createElement('span');text.textContent=words()[0];const retry=document.createElement('button');retry.type='button';retry.textContent=words()[1];retry.onclick=()=>{failures=0;banner.hidden=true;tiles.redraw();};const external=document.createElement('a');external.textContent=words()[2]+' ↗';const center=map.getCenter();external.href='https://www.openstreetmap.org/?mlat='+center.lat+'&mlon='+center.lng+'#map='+map.getZoom()+'/'+center.lat+'/'+center.lng;external.target='_blank';external.rel='noopener noreferrer';banner.append(text,retry,external);banner.hidden=false;}
  tiles.on('tileerror',()=>{if(++failures>=3)showError();});tiles.on('tileload',()=>{failures=0;banner.hidden=true;});
  function frame(rows,route){const points=Array.isArray(route?.points)?route.points.filter(valid):rows;if(!points.length)return;if(points.length===1){map.setView([points[0].latitude,points[0].longitude],14);return;}map.fitBounds(points.map(p=>[p.latitude,p.longitude]),{padding:[35,35],maxZoom:14});}
  const colors={cafe:'#d47c25',cabin:'#397f66',sauna:'#ab4970',rest:'#256c92',equipment:'#16847e',shopping:'#966717'};
  const adapter={
   provider:'openstreetmap',
   render(rows,route,category='all',fit=false){
    if(destroyed)return 0;lastRows=rows||[];lastRoute=route;lastCategory=category;const visible=lastRows.filter(p=>valid(p)&&(category==='all'||p.category===category));markers.clearLayers();
    for(const p of visible){const marker=L.circleMarker([p.latitude,p.longitude],{radius:p.kind==='attraction'?8:6,color:'#fff',weight:2,fillColor:colors[p.category]||colors.rest,fillOpacity:1}).addTo(markers);marker.bindTooltip(String(p.name||''));
     if(options.buildInfo)marker.bindPopup(()=>options.buildInfo(p),{maxWidth:280});
     marker.on('click',()=>options.onPlaceClick?.(p));}
    if(first||fit){frame(visible,route);first=false;}container.dataset.mapPoints=String(visible.length);return visible.length;
   },
   setPath(geometry){if(destroyed)return;if(routeLine)map.removeLayer(routeLine);routeLine=null;const points=pathPoints(geometry);if(points.length<2)return;routeLine=L.polyline(points,{color:'#1976d2',weight:5,opacity:.9}).addTo(map);map.fitBounds(routeLine.getBounds(),{padding:[35,35],maxZoom:14});},
   focus(p){if(valid(p)&&!destroyed)map.setView([p.latitude,p.longitude],14);},
   locate(p){if(!valid(p)||destroyed)return;if(userMarker)map.removeLayer(userMarker);userMarker=L.circleMarker([p.latitude,p.longitude],{radius:9,color:'#fff',weight:3,fillColor:'#1678eb',fillOpacity:1}).addTo(map).bindTooltip(options.locationLabel||words()[3]);map.setView([p.latitude,p.longitude],13);},
   setType(){},resize(){if(!destroyed)map.invalidateSize({pan:false});},
   destroy(){if(destroyed)return;destroyed=true;locationControl?.destroy();observer?.disconnect();map.remove();container.replaceChildren();delete container.dataset.mapProvider;delete container.dataset.mapPoints;}
  };
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(()=>adapter.resize()):null;observer?.observe(container);const locationControl=window.FjordMapLocation?.attach(container,{locate:p=>adapter.locate(p)});return adapter;
 }
 window.FjordLeafletMap={create,preferred,load};
})();
