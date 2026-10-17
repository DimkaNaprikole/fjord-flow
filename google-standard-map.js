/* Full Google Maps canvas. Uses the same restricted Maps JavaScript key.
 * No Places/Routes API requests. Load only after an explicit map selection.
 */
(() => {
  'use strict';
  const colors={cafe:'#9c592b',cabin:'#28745d',sauna:'#a54255',rest:'#246ca0'};
  const paths={
    cafe:'M7 9h13v8a5 5 0 0 1-5 5h-3a5 5 0 0 1-5-5z M20 10h2a4 4 0 0 1 0 8h-2 M5 25h18 M10 3v3 M15 3v3',
    cabin:'M3 14 15 4l12 10 M7 12v14h16V12 M12 26v-9h6v9',
    sauna:'M5 24h20 M7 27h16 M9 5c-5 5 5 5 0 10 M16 3c-5 5 5 5 0 10 M23 5c-5 5 5 5 0 10',
    rest:'M2 25 12 7l6 10 4-7 7 15z M9 13l3 3 3-3'
  };
  const valid=p=>!!p&&Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&Math.abs(p.latitude)<=90&&Math.abs(p.longitude)<=180;
  function iconSVG(category='rest') {
    const color=colors[category]||colors.rest,path=paths[category]||paths.rest;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="50" viewBox="0 0 44 50"><path d="M22 48 14 36H30Z" fill="${color}" stroke="white" stroke-width="2"/><circle cx="22" cy="21" r="19" fill="${color}" stroke="white" stroke-width="3"/><g transform="translate(7 6)" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path.split(' M').map((p,i)=>`<path d="${i?'M':''}${p}"/>`).join('')}</g></svg>`;
  }
  async function create(container,options={}) {
    if(options.enabled!==true||options.userActivated!==true)throw Error('GOOGLE_MAPS_NOT_ENABLED');
    await window.FjordGoogleNorwayMap.loadAPI(options);
    const [{Map,InfoWindow},{AdvancedMarkerElement}]=await Promise.all([google.maps.importLibrary('maps'),google.maps.importLibrary('marker')]);
    const map=new Map(container,{center:{lat:60.37,lng:10.56},zoom:10,mapId:'DEMO_MAP_ID',mapTypeId:'hybrid',gestureHandling:'greedy',scrollwheel:true,zoomControl:true,cameraControl:true,mapTypeControl:true,mapTypeControlOptions:{mapTypeIds:['roadmap','hybrid','satellite','terrain']},fullscreenControl:true,streetViewControl:false,scaleControl:true,clickableIcons:true});
    const info=new InfoWindow({minWidth:275,maxWidth:325});let markers=[],signature='',first=true,userMarker=null;
    function frame(rows,route){const points=Array.isArray(route?.points)?route.points.filter(valid):rows;if(!points.length)return;const bounds=new google.maps.LatLngBounds();points.forEach(p=>bounds.extend({lat:p.latitude,lng:p.longitude}));map.fitBounds(bounds,45);}
    return {
      render(rows,route,category='all',fit=false){
        const visible=rows.filter(p=>valid(p)&&(category==='all'||p.category===category));
        const next=visible.map(p=>p.id).join('|');
        if(next!==signature){markers.forEach(m=>{m.map=null;});markers=[];signature=next;
          visible.forEach(p=>{
            const badge=document.createElement('div');badge.className='fjord-google-marker';
            const image=document.createElement('img');image.src='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(iconSVG(p.category));image.width=36;image.height=42;image.alt='';
            const label=document.createElement('span');label.textContent=p.name;badge.append(image,label);
            const marker=new AdvancedMarkerElement({map,position:{lat:p.latitude,lng:p.longitude},title:p.name,content:badge,collisionBehavior:p.kind==='attraction'?'REQUIRED_AND_HIDES_OPTIONAL':'OPTIONAL_AND_HIDES_LOWER_PRIORITY',zIndex:p.kind==='attraction'?100:10,gmpClickable:true});
            marker.addListener('click',()=>{info.setContent(options.buildInfo(p));info.open({map,anchor:marker});options.onPlaceClick?.(p);});markers.push(marker);
          });
        }
        if(first||fit){frame(visible,route);first=false;}return visible.length;
      },
      setType(type){if(['roadmap','hybrid','satellite','terrain'].includes(type))map.setMapTypeId(type);},
      focus(p){if(valid(p)){map.setCenter({lat:p.latitude,lng:p.longitude});map.setZoom(14);}},
      locate(p){if(!valid(p))return;userMarker?.setMap(null);userMarker=new google.maps.Marker({map,position:{lat:p.latitude,lng:p.longitude},title:options.locationLabel||'Your location',icon:{path:google.maps.SymbolPath.CIRCLE,scale:9,fillColor:'#1678eb',fillOpacity:1,strokeColor:'#fff',strokeWeight:3}});map.setCenter(userMarker.getPosition());map.setZoom(13);},
      resize(){google.maps.event.trigger(map,'resize');},
      destroy(){info.close();markers.forEach(m=>{m.map=null;});userMarker?.setMap(null);container.replaceChildren();}
    };
  }
  if(typeof module!=='undefined')module.exports={iconSVG,valid};
  if(typeof window!=='undefined')window.FjordGoogleStandardMap={create,iconSVG};
})();
