/* Optional Google photorealistic 3D adapter. Inert until explicit enable + user activation.
 * API: https://developers.google.com/maps/documentation/javascript/reference/3d-map
 * Markers: https://developers.google.com/maps/documentation/javascript/reference/3d-map-draw
 */
(() => {
  'use strict';
  const categories=['cafe','cabin','sauna','rest'];
  const symbols={cafe:'☕',cabin:'⌂',sauna:'♨',rest:'◇'};
  const validPoint=p=>!!p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && Math.abs(p.latitude)<=90 && Math.abs(p.longitude)<=180;
  const filterPlaces=(rows,category='all')=>Array.isArray(rows)?rows.filter(p=>validPoint(p)&&categories.includes(p.category)&&(category==='all'||p.category===category)):[];
  function cameraForPoints(rows) {
    const points=Array.isArray(rows)?rows.filter(validPoint):[];
    if(!points.length)return {center:{lat:65,lng:14,altitude:0},range:2800000,tilt:35,heading:0};
    const minLat=Math.min(...points.map(p=>p.latitude)),maxLat=Math.max(...points.map(p=>p.latitude));
    const minLng=Math.min(...points.map(p=>p.longitude)),maxLng=Math.max(...points.map(p=>p.longitude));
    const lat=(minLat+maxLat)/2,lng=(minLng+maxLng)/2;
    const height=(maxLat-minLat)*111195,width=(maxLng-minLng)*111195*Math.max(.01,Math.cos(lat*Math.PI/180));
    return {center:{lat,lng,altitude:0},range:Math.max(2500,Math.min(15000000,Math.hypot(width,height)*2.15)),tilt:points.length===1?50:35,heading:0};
  }
  function scriptURL(key,language='nb',callback='__fjordGoogle3DReady') {
    if(typeof key!=='string'||!/^AIza[\w-]{20,80}$/.test(key))throw Error('GOOGLE_MAPS_KEY_INVALID');
    if(!/^__fjordGoogle3DReady\d*$/.test(callback))throw Error('GOOGLE_MAPS_CALLBACK_INVALID');
    const url=new URL('https://maps.googleapis.com/maps/api/js');
    Object.entries({key,v:'weekly',loading:'async',libraries:'maps3d',language:['nb','en','uk','sv','da'].includes(language)?language:'nb',callback}).forEach(([k,v])=>url.searchParams.set(k,v));
    return url.href;
  }
  function createWithLibrary(container,options,library) {
    if(!container||typeof container.append!=='function')throw Error('GOOGLE_MAPS_CONTAINER_INVALID');
    if(typeof library?.Map3DElement!=='function'||typeof library?.Marker3DInteractiveElement!=='function')throw Error('GOOGLE_MAPS_3D_UNAVAILABLE');
    const initial=cameraForPoints([]);
    if(Number.isFinite(options.range)&&options.range>=2500&&options.range<=15000000)initial.range=options.range;
    if(validPoint(options.center))initial.center={lat:options.center.latitude,lng:options.center.longitude,altitude:0};
    const map=new library.Map3DElement({...initial,mode:'HYBRID',gestureHandling:'GREEDY',defaultUIHidden:true});
    if(map.style){map.style.width='100%';map.style.height='100%';map.style.display='block';}
    container.append(map);
    let markers=[],destroyed=false,lastRows=[],lastRoute=null,lastCategory='all';
    const onMapError=()=>{if(!destroyed)options.onError?.(Error('GOOGLE_MAPS_RENDER_FAILED'));};
    map.addEventListener('gmp-error',onMapError);map.addEventListener('gmp-map-id-error',onMapError);
    const applyCamera=camera=>{if(destroyed)return;map.stopCameraAnimation?.();Object.assign(map,camera);};
    const clear=()=>{markers.forEach(({marker,click})=>{marker.removeEventListener('gmp-click',click);marker.remove();});markers=[];};
    const fit=(rows=lastRows,route=lastRoute,category=lastCategory)=>{
      const routePoints=Array.isArray(route?.points)?route.points.filter(validPoint):[];
      applyCamera(cameraForPoints(routePoints.length?routePoints:filterPlaces(rows,category)));
    };
    return {
      render(rows,route=null,category='all') {
        if(destroyed)return 0;clear();lastRows=Array.isArray(rows)?rows:[];lastRoute=route;lastCategory=category;
        filterPlaces(lastRows,category).forEach(record=>{
          const name=String(record.name||record.town||record.id||'').slice(0,140);
          const marker=new library.Marker3DInteractiveElement({position:{lat:record.latitude,lng:record.longitude,altitude:0},altitudeMode:'CLAMP_TO_GROUND',title:name,collisionBehavior:'OPTIONAL_AND_HIDES_LOWER_PRIORITY',sizePreserved:true});
          if(typeof window!=='undefined'&&window.FjordGoogleStandardMap?.nativePin)marker.append(window.FjordGoogleStandardMap.nativePin(record));
          const click=()=>{if(!destroyed)options.onPlaceClick?.(record);};
          marker.addEventListener('gmp-click',click);map.append(marker);markers.push({marker,click});
        });
        fit();return markers.length;
      },
      fit,
      reset(){if(!destroyed){lastRoute=null;lastCategory='all';this.render(lastRows,null,'all');}},
      destroy(){if(destroyed)return;destroyed=true;clear();map.removeEventListener('gmp-error',onMapError);map.removeEventListener('gmp-map-id-error',onMapError);map.stopCameraAnimation?.();map.remove();lastRows=[];lastRoute=null;},
      get markerCount(){return markers.length;}
    };
  }
  const exports={validPoint,filterPlaces,cameraForPoints,scriptURL,createWithLibrary};
  if(typeof window==='undefined'){if(typeof module!=='undefined')module.exports=exports;return;}
  let loading=null,sequence=0;
  function load(key,language) {
    if(window.google?.maps?.importLibrary)return Promise.resolve().then(()=>window.google.maps.importLibrary('maps3d'));
    if(loading)return loading;
    loading=new Promise((resolve,reject)=>{
      const callback='__fjordGoogle3DReady'+(++sequence),script=document.createElement('script');let finished=false;
      const previousAuth=window.gm_authFailure;
      const finish=(error,value)=>{if(finished)return;finished=true;clearTimeout(timer);script.onerror=null;window[callback]=()=>{};if(window.gm_authFailure===authFailure)window.gm_authFailure=previousAuth;if(error){script.remove();reject(error);}else resolve(value);};
      const authFailure=()=>{finish(Error('GOOGLE_MAPS_AUTH_FAILED'));if(typeof previousAuth==='function')previousAuth();};
      const timer=setTimeout(()=>finish(Error('GOOGLE_MAPS_LOAD_TIMEOUT')),18000);
      window[callback]=()=>{Promise.resolve().then(()=>window.google.maps.importLibrary('maps3d')).then(lib=>finish(null,lib),error=>finish(error));};
      window.gm_authFailure=authFailure;
      script.onerror=()=>finish(Error('GOOGLE_MAPS_NETWORK_ERROR'));
      script.src=scriptURL(key,language,callback);script.async=true;script.dataset.fjordGoogle3d='true';
      const nonce=document.querySelector('script[nonce]')?.nonce;if(nonce)script.nonce=nonce;
      document.head.append(script);
    }).catch(error=>{loading=null;throw error;});
    return loading;
  }
  async function create(container,options={}) {
    // Both flags are required. Merely loading this file or displaying its button makes no Google request.
    if(options.enabled!==true||options.userActivated!==true)throw Error('GOOGLE_MAPS_NOT_ENABLED');
    scriptURL(options.apiKey,options.language);
    let timer;
    try {
      const library=await Promise.race([load(options.apiKey,options.language||window.FjordI18n?.language||document.documentElement.lang),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('GOOGLE_MAPS_LOAD_TIMEOUT')),18000);})]);
      await window.google.maps.importLibrary('marker');
      return createWithLibrary(container,options,library);
    } finally {clearTimeout(timer);}
  }
  window.FjordGoogleNorwayMap={create,loadAPI:async(options={})=>{if(options.enabled!==true||options.userActivated!==true)throw Error('GOOGLE_MAPS_NOT_ENABLED');scriptURL(options.apiKey,options.language);await load(options.apiKey,options.language||'nb');}};
})();
