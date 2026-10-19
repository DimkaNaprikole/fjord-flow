/* A regional view: about 50 km from the centre, without requesting location. */
(() => {
 'use strict';
 const radiusKm=50;
 function bounds(p){
  if(!p||!Number.isFinite(p.latitude)||!Number.isFinite(p.longitude)||Math.abs(p.latitude)>90||Math.abs(p.longitude)>180)return null;
  const lat=Math.max(-85,Math.min(85,p.latitude));
  const dy=radiusKm/111.195,dx=dy/Math.max(.087,Math.cos(lat*Math.PI/180));
  return {north:Math.min(85,lat+dy),south:Math.max(-85,lat-dy),east:p.longitude+dx,west:p.longitude-dx};
 }
 function google(map,p){const area=bounds(p);if(area)map.fitBounds(area,24);}
 const api={radiusKm,bounds,google};
 if(typeof module!=='undefined')module.exports=api;
 if(typeof window!=='undefined')window.FjordMapRegion=api;
})();
