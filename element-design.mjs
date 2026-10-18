/* Bounded editor styles for reviewed targets; never accepts selectors or CSS from content. */
export const ELEMENT_NUMBER_FIELDS={borderWidth:{min:0,max:12},radius:{min:0,max:64},padding:{min:0,max:64},fontSize:{min:11,max:96},widthPercent:{min:30,max:100},offsetX:{min:-160,max:160},offsetY:{min:-160,max:160},opacity:{min:0,max:1},backgroundOpacity:{min:0,max:1},borderOpacity:{min:0,max:1},...Object.fromEntries(['TopLeft','TopRight','BottomLeft','BottomRight'].map(corner=>['radius'+corner,{min:0,max:160}])),...Object.fromEntries(['Top','Right','Bottom','Left'].map(side=>['border'+side+'Width',{min:0,max:16}]))};
export const ELEMENT_SELECT_FIELDS={borderStyle:['none','solid','dashed','dotted','double','groove','ridge','inset','outset'],align:['left','center','right'],textAlign:['left','center','right'],fontWeight:['400','500','600','700','800'],shadow:['none','soft','deep']};
export function createElementDescriptors({PAGES,BLOCKS,BUTTONS,SECTIONS}){
 const out=SECTIONS.map(item=>({id:'section_'+item.id,name:item.name,selector:item.root,kind:'section',group:'sections',itemId:item.id}));
 for(const page of PAGES)if(page.id!=='home')out.push({id:'page_'+page.id,name:page.name,selector:page.root,kind:'section',group:'pages',itemId:page.id});
 for(const [group,items]of [['pages',PAGES],['blocks',BLOCKS]])for(const item of items)for(const field of ['title','intro'])if(item[field])out.push({id:`text_${group}_${item.id}_${field}`,name:item.name+' · '+(field==='title'?'заголовок':'описание'),selector:item[field],kind:'text',group,itemId:item.id,field});
 for(const item of BUTTONS)out.push({id:'button_'+item.id,name:item.name,selector:item.selector,kind:'button',group:'buttons',itemId:item.id});
 for(const item of [
  {id:'header',name:'Фон шапки',selector:'.solidarity-art-pair>.solidarity-art',imageSelector:'.solidarity-art-pair>.solidarity-art'},
  {id:'hero',name:'Фото первого экрана',selector:'#heroScenery'},
  {id:'waterfall',name:'Фото водопада',selector:'.waterfall-story>img',imageSelector:'.waterfall-story>img'},
  {id:'cafes',name:'Фото кофеен',selector:'#cafeStops > img',imageSelector:'#cafeStops > img'}
 ])out.push({...item,id:'photo_'+item.id,itemId:item.id,kind:'photo',group:'media'});
 return out;
}
export function resolveElementDescriptor(id,elements){
 const fixed=elements.find(item=>item.id===id);if(fixed)return fixed;
 if(typeof id==='string'&&/^place_[a-z0-9][a-z0-9-]{0,79}$/.test(id)){const placeId=id.slice(6);return {id,name:placeId,selector:`[data-cms-place-id="${placeId}"]`,imageSelector:`[data-cms-place-id="${placeId}"] .norway-catalog-photo img`,kind:'place',group:'catalogue',itemId:placeId};}
 return null;
}
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
export function validateElementStyle(record,safeMediaURL){
  if(!plain(record)||Object.keys(record).some(key=>!['background','color','borderColor','image','borderImage',...Object.keys(ELEMENT_NUMBER_FIELDS),...Object.keys(ELEMENT_SELECT_FIELDS)].includes(key)))throw new Error('invalid_editor_element_style');
  const clean={};
  for(const key of ['background','color','borderColor'])if(record[key]!==undefined){if(typeof record[key]!=='string'||!/^#[0-9a-f]{6}$/i.test(record[key]))throw new Error('invalid_element_color');clean[key]=record[key];}
  for(const [key,bounds]of Object.entries(ELEMENT_NUMBER_FIELDS))if(record[key]!==undefined){if(!Number.isFinite(record[key])||record[key]<bounds.min||record[key]>bounds.max)throw new Error('invalid_element_number');clean[key]=record[key];}
  for(const [key,allowed]of Object.entries(ELEMENT_SELECT_FIELDS))if(record[key]!==undefined){if(!allowed.includes(record[key]))throw new Error('invalid_element_option');clean[key]=record[key];}
  if(record.image!==undefined){const image=record.image;if(!plain(image)||Object.keys(image).some(key=>!['src','alt','credit','source'].includes(key))||!safeMediaURL(image.src))throw new Error('invalid_element_image');clean.image={src:image.src};for(const key of ['alt','credit','source'])if(image[key]!==undefined){if(typeof image[key]!=='string'||image[key].length>1000||/[\u0000-\u001f]/.test(image[key]))throw new Error('invalid_element_image');clean.image[key]=image[key];}if(image.source&&!safeMediaURL(image.source))throw new Error('invalid_element_image_source');}
  if(record.borderImage!==undefined){const image=record.borderImage;if(!plain(image)||Object.keys(image).some(key=>!['src','slice','repeat'].includes(key))||!safeMediaURL(image.src)||image.slice!==undefined&&(!Number.isFinite(image.slice)||image.slice<1||image.slice>100)||image.repeat!==undefined&&!['stretch','round','repeat'].includes(image.repeat))throw new Error('invalid_element_border_image');clean.borderImage={src:image.src};if(image.slice!==undefined)clean.borderImage.slice=image.slice;if(image.repeat!==undefined)clean.borderImage.repeat=image.repeat;}
  return clean;
}
export function validateElements(value,resolve,safeMediaURL){
 if(!plain(value)||Object.keys(value).length>500)throw new Error('invalid_editor_elements');
 const out={};for(const [id,record]of Object.entries(value)){
  if(!resolve(id)||!plain(record))throw new Error('invalid_editor_element');
  const {name,mobile,tablet,...style}=record,clean=validateElementStyle(style,safeMediaURL);
  if(record.name!==undefined){if(typeof record.name!=='string'||record.name.length>120||/[\u0000-\u001f]/.test(record.name))throw new Error('invalid_element_name');clean.name=record.name.trim();}
  for(const [key,entry]of Object.entries({mobile,tablet}))if(entry!==undefined)clean[key]=validateElementStyle(entry,safeMediaURL);
  out[id]=clean;
 }return out;
}
export function elementCSS(elements,resolve){
 function rulesFor(value,item,responsive=false){const rules=[];
  const alpha=(color,opacity)=>opacity===undefined?color:`rgba(${[1,3,5].map(index=>parseInt(color.slice(index,index+2),16)).join(',')},${opacity})`;
  if(value.background!==undefined)rules.push('background-color:'+alpha(value.background,value.backgroundOpacity)+'!important');
  if(value.borderColor!==undefined)rules.push('border-color:'+alpha(value.borderColor,value.borderOpacity)+'!important');
  for(const [key,property]of Object.entries({color:'color',borderStyle:'border-style',fontWeight:'font-weight',textAlign:'text-align',opacity:'opacity'}))if(value[key]!==undefined)rules.push(`${property}:${value[key]}!important`);
  for(const [key,property]of Object.entries({borderWidth:'border-width',radius:'border-radius',padding:'padding',fontSize:'font-size'}))if(value[key]!==undefined)rules.push(`${property}:${value[key]}px!important`);
  if(value.widthPercent!==undefined)rules.push(`width:${value.widthPercent}%!important;max-width:100%!important;box-sizing:border-box`);
  if(value.align!==undefined){rules.push('text-align:'+value.align+'!important');rules.push('margin-left:'+(value.align==='left'?'0':'auto')+'!important','margin-right:'+(value.align==='right'?'0':'auto')+'!important');}
  if(value.textAlign!==undefined)rules.push('text-align:'+value.textAlign+'!important');
  if(responsive&&value.radius!==undefined)for(const corner of ['top-left','top-right','bottom-left','bottom-right'])rules.push('border-'+corner+'-radius:'+value.radius+'px!important');
  if(responsive&&value.borderWidth!==undefined)for(const side of ['top','right','bottom','left'])rules.push('border-'+side+'-width:'+value.borderWidth+'px!important');
  for(const corner of ['TopLeft','TopRight','BottomLeft','BottomRight'])if(value['radius'+corner]!==undefined)rules.push('border-'+corner.replace(/([a-z])([A-Z])/g,'$1-$2').toLowerCase()+'-radius:'+value['radius'+corner]+'px!important');
  for(const side of ['Top','Right','Bottom','Left'])if(value['border'+side+'Width']!==undefined)rules.push('border-'+side.toLowerCase()+'-width:'+value['border'+side+'Width']+'px!important');
  if(value.shadow!==undefined)rules.push('box-shadow:'+({none:'none',soft:'0 6px 18px #0003',deep:'0 12px 36px #0006'}[value.shadow])+'!important');
  if(value.image&&item.kind==='place')rules.push(`--catalogue-photo:url("${value.image.src}")!important`);
  if(value.image&&!item.imageSelector)rules.push(`background-image:url("${value.image.src}")!important;background-size:cover!important;background-position:center!important`);
  if(value.borderImage){rules.push(`border-image-source:url("${value.borderImage.src}")!important`,`border-image-slice:${value.borderImage.slice??25}%!important`,`border-image-repeat:${value.borderImage.repeat??'stretch'}!important`);if(value.borderWidth===undefined&&!['Top','Right','Bottom','Left'].some(side=>value['border'+side+'Width']!==undefined))rules.push('border-width:8px!important');if(value.borderStyle===undefined)rules.push('border-style:solid!important');}
  return rules.join(';');
 }
 let css='';for(const [id,value]of Object.entries(elements||{})){
  const item=resolve(id);if(!item)continue;const selector=':is('+item.selector+')';
  const base=rulesFor(value,item);if(base)css+=selector+'{'+base+'}';
  if(value.offsetX!==undefined||value.offsetY!==undefined)css+=`@media(min-width:1001px){${selector}{translate:${value.offsetX||0}px ${value.offsetY||0}px!important}}`;
  if(id==='photo_hero'&&value.image)css+='#heroScenery .hero-location-film{display:none!important}';
  for(const [mode,query]of [['tablet','(min-width:681px) and (max-width:1000px)'],['mobile','(max-width:680px)']])if(value[mode]){
   const override=value[mode],effective={...value,...override},rules=rulesFor(override,item,true);let scoped=rules?selector+'{'+rules+'}':'';
   // Alpha overrides use the inherited desktop colour without forcing any other desktop property.
   for(const [alphaKey,colorKey,property]of [['backgroundOpacity','background','background-color'],['borderOpacity','borderColor','border-color']])if(override[alphaKey]!==undefined&&override[colorKey]===undefined&&effective[colorKey]){const color=effective[colorKey];scoped+=selector+'{'+property+`:rgba(${[1,3,5].map(index=>parseInt(color.slice(index,index+2),16)).join(',')},${override[alphaKey]})!important}`;}
   if(override.offsetX!==undefined||override.offsetY!==undefined)scoped+=`${selector}{translate:${override.offsetX||0}px ${override.offsetY||0}px!important}`;
   if(id==='photo_hero'&&override.image)scoped+='#heroScenery .hero-location-film{display:none!important}';
   if(scoped)css+='@media'+query+'{'+scoped+'}';
  }
 }return css;
}
export function validateFramePresets(value,safeMediaURL){
 if(!Array.isArray(value)||value.length>30)throw new Error('invalid_frame_presets');const seen=new Set();
 return value.map(entry=>{if(!plain(entry)||Object.keys(entry).some(key=>!['id','name','style'].includes(key))||typeof entry.id!=='string'||!/^[a-z0-9][a-z0-9-]{0,79}$/.test(entry.id)||seen.has(entry.id)||typeof entry.name!=='string'||!entry.name.trim()||entry.name.length>120||/[\u0000-\u001f]/.test(entry.name))throw new Error('invalid_frame_preset');seen.add(entry.id);const style=validateElementStyle(entry.style,safeMediaURL);if(Object.keys(style).some(key=>!['borderStyle','borderWidth','borderColor','borderOpacity','borderImage','radius','radiusTopLeft','radiusTopRight','radiusBottomLeft','radiusBottomRight','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','shadow'].includes(key)))throw new Error('invalid_frame_preset_style');return {id:entry.id,name:entry.name.trim(),style};});
}
export function createElementImages(document,resolve){
 const originals=new Map();
 return (elements,viewportWidth=document.defaultView?.innerWidth??globalThis.innerWidth??1200)=>{
  const active=new Set();for(const [id,record]of Object.entries(elements||{})){const value={...record,...(viewportWidth<=680?record.mobile:viewportWidth<=1000?record.tablet:undefined)},item=resolve(id);if(!item?.imageSelector||!value.image)continue;for(const node of document.querySelectorAll(item.imageSelector)){
   active.add(node);if(!originals.has(node))originals.set(node,{original:{src:node.getAttribute('src'),alt:node.getAttribute('alt')},applied:{}});
   const state=originals.get(node);for(const field of ['src','alt']){
    const current=node.getAttribute(field);if(Object.hasOwn(state.applied,field)&&current!==state.applied[field])state.original[field]=current;
    const next=value.image[field]??state.original[field];if(current!==next){if(next===null)node.removeAttribute(field);else node.setAttribute(field,next);}state.applied[field]=next;
   }
  }}
  for(const [node,state]of originals)if(!active.has(node)){for(const field of ['src','alt'])if(node.getAttribute(field)===state.applied[field]){if(state.original[field]===null)node.removeAttribute(field);else if(node.getAttribute(field)!==state.original[field])node.setAttribute(field,state.original[field]);}originals.delete(node);}
 };
}
export function createElementMedia(document,resolve,applyBase){
 const applyImages=createElementImages(document,resolve);
 return (elements,media,viewportWidth=document.defaultView?.innerWidth??globalThis.innerWidth??1200)=>{
  applyImages(elements,viewportWidth);
  for(const id of ['header','waterfall','cafes']){const descriptor=resolve('photo_'+id),record=elements?.['photo_'+id]||{},effective={...record,...(viewportWidth<=680?record.mobile:viewportWidth<=1000?record.tablet:undefined)};
   if(descriptor?.imageSelector&&!effective.image)applyBase(document.querySelector(descriptor.imageSelector),media?.[id]);
  }
 };
}
