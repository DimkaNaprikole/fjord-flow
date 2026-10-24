/* Full Google Maps canvas. Uses the same restricted Maps JavaScript key.
 * No Places/Routes API requests. Load only after an explicit map selection.
 */
(() => {
  'use strict';
  // Official Google category glyphs, displayed only on the Google map.
  const iconURLs={shopping:'https://maps.gstatic.com/mapfiles/place_api/icons/v2/shopping_pinlet.svg',cafe:'https://maps.gstatic.com/mapfiles/place_api/icons/v2/cafe_pinlet.svg',cabin:'https://maps.gstatic.com/mapfiles/place_api/icons/v2/hotel_pinlet.svg',rest:'https://maps.gstatic.com/mapfiles/place_api/icons/v2/tree_pinlet.svg'};
  const colors={shopping:'#B58A40',cafe:'#FF9E67',cabin:'#909CE1',sauna:'#b76e9b',rest:'#4DB546',equipment:'#119c96'};
  const valid=p=>!!p&&Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&Math.abs(p.latitude)<=90&&Math.abs(p.longitude)<=180;
  function nativePin(record){
    const settings={background:colors[record.category]||colors.rest,borderColor:'#fff',scale:.75};
    if(record.category==='equipment'){settings.glyphText='↔';settings.glyphColor='#fff';}
    else if(record.category==='sauna'){settings.glyphText='♨';settings.glyphColor='#fff';}
    else settings.glyphSrc=iconURLs[record.category]||iconURLs.rest;
    return new google.maps.marker.PinElement(settings);
  }
  async function createGoogle(container,options={}) {
    if(options.enabled!==true||options.userActivated!==true)throw Error('GOOGLE_MAPS_NOT_ENABLED');
    await window.FjordGoogleNorwayMap.loadAPI(options);
    const [{Map,InfoWindow},{AdvancedMarkerElement}]=await Promise.all([google.maps.importLibrary('maps'),google.maps.importLibrary('marker')]);
    const map=new Map(container,{center:{lat:60.37,lng:10.56},zoom:10,mapId:'DEMO_MAP_ID',mapTypeId:'hybrid',gestureHandling:'greedy',scrollwheel:options.scrollwheel!==false,disableDoubleClickZoom:options.scrollwheel===false,draggable:true,zoomControl:true,cameraControl:true,mapTypeControl:true,mapTypeControlOptions:{mapTypeIds:['roadmap','hybrid','satellite','terrain']},fullscreenControl:false,streetViewControl:true,rotateControl:true,keyboardShortcuts:true,scaleControl:true,clickableIcons:true});
    const info=new InfoWindow({maxWidth:280});let markers=[],signature='',first=true,userMarker=null,routeLine=null,visitorPosition=null;
    function frame(rows,route){const points=Array.isArray(route?.points)?route.points.filter(valid):rows;if(!points.length)return;if(!route?.points?.length&&window.FjordMapRegion){window.FjordMapRegion.google(map,visitorPosition||points[0]);return;}if(points.length===1){map.setCenter({lat:points[0].latitude,lng:points[0].longitude});map.setZoom(14);return;}const bounds=new google.maps.LatLngBounds();points.forEach(p=>bounds.extend({lat:p.latitude,lng:p.longitude}));map.fitBounds(bounds,45);}
    const adapter = {
      render(rows,route,category='all',fit=false){
        const visible=rows.filter(p=>valid(p)&&(category==='all'||p.category===category));
        const next=visible.map(p=>p.id).join('|');
        if(next!==signature){markers.forEach(m=>{m.map=null;});markers=[];signature=next;
          visible.forEach(p=>{
            const badge=document.createElement('div');badge.className='fjord-google-marker';
            const pin=nativePin(p);
            const label=document.createElement('span');label.textContent=p.name;badge.append(pin,label);
            const marker=new AdvancedMarkerElement({map,position:{lat:p.latitude,lng:p.longitude},title:p.name,content:badge,collisionBehavior:p.kind==='attraction'?'REQUIRED_AND_HIDES_OPTIONAL':'OPTIONAL_AND_HIDES_LOWER_PRIORITY',zIndex:p.kind==='attraction'?100:10,gmpClickable:true});
            marker.addListener('click',()=>{info.setContent(options.buildInfo(p));info.open({map,anchor:marker});options.onPlaceClick?.(p);});markers.push(marker);
          });
        }
        if(first||fit){info.close();frame(visible,route);first=false;}return visible.length;
      },
      setPath(geometry){routeLine?.setMap(null);routeLine=null;if(!Array.isArray(geometry)||geometry.length<2)return;const path=geometry.filter(p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90).map(p=>({lat:p[1],lng:p[0]}));if(path.length<2)return;routeLine=new google.maps.Polyline({map,path,strokeColor:'#1976d2',strokeWeight:5,strokeOpacity:.9});const bounds=new google.maps.LatLngBounds();path.forEach(p=>bounds.extend(p));map.fitBounds(bounds,35);},
      setType(type){if(['roadmap','hybrid','satellite','terrain'].includes(type))map.setMapTypeId(type);},
      focus(p){if(valid(p)){map.setCenter({lat:p.latitude,lng:p.longitude});map.setZoom(14);}},
      locate(p){if(!valid(p))return;userMarker?.setMap(null);userMarker=new google.maps.Marker({map,position:{lat:p.latitude,lng:p.longitude},title:options.locationLabel||'Your location',icon:{path:google.maps.SymbolPath.CIRCLE,scale:9,fillColor:'#1678eb',fillOpacity:1,strokeColor:'#fff',strokeWeight:3}});visitorPosition=p;if(window.FjordMapRegion)window.FjordMapRegion.google(map,p);else{map.setCenter(userMarker.getPosition());map.setZoom(9);}},
      resize(){google.maps.event.trigger(map,'resize');},
      destroy(){locationControl?.destroy();routeLine?.setMap(null);info.close();markers.forEach(m=>{m.map=null;});userMarker?.setMap(null);container.replaceChildren();}
    };
    const locationControl=window.FjordMapLocation?.attach(container,{locate:p=>adapter.locate(p)});return adapter;
  }
  async function create(container,options={}){
    if(options.userActivated!==true)throw Error('GOOGLE_MAPS_NOT_ENABLED');
    if((options.provider||window.FjordGoogleMapConfig?.provider)==='google')return createGoogle(container,options);
    const fallback=()=>{if(!window.FjordLeafletMap)throw Error('MAP_FALLBACK_UNAVAILABLE');return window.FjordLeafletMap.create(container,options);};
    if(window.FjordLeafletMap?.preferred()||options.enabled!==true){if(!window.FjordLeafletMap&&options.enabled!==true)throw Error('GOOGLE_MAPS_NOT_ENABLED');return fallback();}
    let active;
    try{active=await createGoogle(container,options);}catch(error){if(!window.FjordLeafletMap)throw error;return fallback();}
    if(!window.FjordLeafletMap)return active;
    let lastRows=[],lastRoute=null,lastCategory='all',lastGeometry=null,lastFocus=null,disposed=false,recovering;
    async function recover(){
      if(disposed||recovering||active.provider==='openstreetmap')return recovering;
      recovering=(async()=>{active.destroy();active=await fallback();if(disposed){active.destroy();return;}active.render(lastRows,lastRoute,lastCategory,true);active.setPath(lastGeometry);if(lastFocus)active.focus(lastFocus);})().catch(()=>{options.onError?.(Error('MAP_FALLBACK_FAILED'));}).finally(()=>{recovering=null;});return recovering;
    }
    window.addEventListener('fjord:google-auth-failed',recover);
    const adapter={
      get provider(){return active.provider||'google';},
      render(rows,route,category='all',fit=false){lastRows=rows;lastRoute=route;lastCategory=category;return active.render(rows,route,category,fit);},
      setPath(path){lastGeometry=path;active.setPath?.(path);},focus(p){lastFocus=p;active.focus(p);},
      locate(p){active.locate(p);},setType(type){active.setType(type);},resize(){active.resize();},
      destroy(){disposed=true;window.removeEventListener('fjord:google-auth-failed',recover);active.destroy();}
    };
    if(window.FjordGoogleMapsFailed)await recover();return adapter;
  }
  if(typeof module!=='undefined')module.exports={iconURLs,valid};
  if(typeof window!=='undefined')window.FjordGoogleStandardMap={create,nativePin};
})();
