/* Move existing nodes, never clone widgets or turn whole pages into wrappers. */
import {SECTIONS} from './site-editor-schema.mjs?v=4';

export function completeSectionOrder(requested=[]){
 const ids=SECTIONS.map(section=>section.id);
 return [...new Set(requested.filter(id=>ids.includes(id))),...ids.filter(id=>!requested.includes(id))];
}

export function createSectionOrder(root){
 const originals=new Map();let marker;
 function nodesFor(section){return [...new Set(section.selectors.flatMap(selector=>[...root.querySelectorAll(selector)]))].filter(node=>!node.closest('dialog'));}
 return function applySectionOrder(requested=[]){
  const main=root.querySelector('#journeys');if(!main)return false;
  let changed=false;
  if(!requested.length){
   for(const [node,slot] of originals){
    if(node.isConnected&&slot.isConnected&&slot.nextSibling!==node){slot.after(node);changed=true;}
    if(node.dataset.cmsSectionManaged)delete node.dataset.cmsSectionManaged;
   }
   if(marker?.isConnected){marker.remove();marker=undefined;changed=true;}
   return changed;
  }
  const groups=new Map(SECTIONS.map(section=>[section.id,nodesFor(section)]));
  const nodes=completeSectionOrder(requested).flatMap(id=>groups.get(id));
  if(!nodes.length)return false;
  for(const node of nodes){
   if(!originals.has(node)){
    const slot=root.createComment('fjord-section-original');node.before(slot);originals.set(node,slot);
   }
   node.dataset.cmsSectionManaged='true';node.dataset.siteTab='home';
  }
  if(!marker?.isConnected){marker=root.createComment('fjord-sections-start');main.prepend(marker);changed=true;}
  let previous=marker;
  for(const node of nodes){
   if(previous.nextSibling!==node){previous.after(node);changed=true;}
   previous=node;
  }
  return changed;
 };
}
