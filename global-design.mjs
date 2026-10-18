/* Reviewed global groups, never selectors or executable CSS from saved content. */
import {elementCSS} from './element-design.mjs?v=2';
export const DESIGN_SCOPE=':is(#fjordGlobalDesignScope,:root):is(#fjordGlobalDesignOverride,:root)';
export const GLOBAL_DESIGN_GROUPS=[
 {id:'buttons',name:'Все текстовые кнопки',selector:'body>header>nav>a,body>header>nav>button,.header-account-button,.hero-content>a.button,#waterfallExplore,.button,.text-link,.stay-booking,.stay-link,.stay-links>a,.cafe-route,.cafe-gallery-route,.cafe-gallery-website,.stay-gallery-venue-actions>a,.experience-actions>a,.experience-official,.experience-filters>button,.roadtrip-presets>button,.discovery-cafe-links>a,.discovery-cafe-links>button,.norway-catalog-actions>a,.norway-catalog-gps,.norway-catalog-retry,#cafeNearbySearch,#cafeNearbyOnline,#cafeNearbyTownForm button,.catalogue-flip-toggle'},
 {id:'cards',name:'Все карточки мест',selector:'.norway-catalog-card,.discovery-cafe-card,.stay-card,.experience-card,.discovery-story-card,.roadtrip-card,.shopping-card,.bua-card'},
 {id:'headings',name:'Все заголовки разделов',selector:'main h1,main h2,main h3'}
];
export const GLOBAL_DESIGN_FIELDS=['background','color','borderColor','borderStyle','borderWidth','borderOpacity','radius','radiusTopLeft','radiusTopRight','radiusBottomLeft','radiusBottomRight','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','shadow','padding','fontSize','fontWeight','textAlign','backgroundOpacity','opacity','widthPercent','align','marginTop','marginRight','marginBottom','marginLeft'];
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
export function validateGlobalDesign(value,validateStyle){
 if(!plain(value)||Object.keys(value).some(key=>!GLOBAL_DESIGN_GROUPS.some(group=>group.id===key)))throw new Error('invalid_global_design');
 const out={};for(const [id,record]of Object.entries(value)){
  if(!plain(record))throw new Error('invalid_global_design');
  const {mobile,tablet,...style}=record;
  const cleanStyle=entry=>{if(!plain(entry)||Object.keys(entry).some(key=>!GLOBAL_DESIGN_FIELDS.includes(key)))throw new Error('invalid_global_design_style');return validateStyle(entry);};
  const clean=cleanStyle(style);for(const [mode,entry]of Object.entries({mobile,tablet}))if(entry!==undefined)clean[mode]=cleanStyle(entry);
  out[id]=clean;
 }return out;
}
export function globalDesignCSS(value){return elementCSS(value,id=>{const group=GLOBAL_DESIGN_GROUPS.find(item=>item.id===id);return group?{...group,selector:DESIGN_SCOPE+' :where('+group.selector+')'}:null;});}
export function individualDesignDescriptor(item){return item?{...item,selector:DESIGN_SCOPE+' :is('+item.selector+')'}:null;}
