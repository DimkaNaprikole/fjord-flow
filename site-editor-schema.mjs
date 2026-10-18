/* Public editor contract. No credentials, executable HTML or arbitrary CSS. */
import {createElementDescriptors,resolveElementDescriptor,validateElements,validateElementStyle as validateStyle,validateFramePresets} from './element-design.mjs?v=1';
export {ELEMENT_NUMBER_FIELDS,ELEMENT_SELECT_FIELDS} from './element-design.mjs?v=1';
export const LANGUAGES=['nb','en','uk','sv','da'];
export const PAGES=[
 {id:'home',name:'Главная',root:'#homePanel',title:'.hero h1',intro:'.hero .hero-copy'},
 {id:'bua',name:'BUA · прокат',root:'#buaEquipment',title:'#buaEquipment h2',intro:'#buaEquipment .bua-intro'},
 {id:'journal',name:'Дневник путешествий',root:'#travelStories',title:'#travelStories h2',intro:'#travelStories .discovery-story-heading > p'},
 {id:'community',name:'Сообщество',root:'#community',title:'#community h2',intro:'#community .community-title p:not(.eyebrow)'},
 {id:'catalogue',name:'Каталог Норвегии',root:'#norwayCatalogue',title:'#norwayCatalogue h2',intro:'#norwayCatalogue .norway-catalog-intro'},
 {id:'webcams',name:'Веб-камеры',root:'#norwayWebcams',title:'#norwayWebcams h2',intro:'#norwayWebcams > p:not(.eyebrow)'},
 {id:'news',name:'Новости · рядом с вами',root:'#municipalNews',title:'#municipalNews h2',intro:'#municipalNews .news-intro'},
 {id:'useful',name:'В дороге',root:'#travelUpdates',title:'#travelUpdates h2',intro:null},
 {id:'services',name:'Сервисы для путешествий',root:'#travelServices',title:'#travelServices h2',intro:null},
 {id:'shopping',name:'Торговые центры',root:'#shoppingCentres',title:'#shoppingCentres h2',intro:null}
];
export const SECTIONS=[
 {id:'hero',name:'Первый экран',root:'#homePanel, #journeys > .hero',selectors:['#homePanel, #journeys > .hero']},
 {id:'about',name:'Как открыть Норвегию',root:'#about',selectors:['#about']},
 {id:'regions',name:'Регионы',root:'.region-section',selectors:['#journeys > .region-section']},
 {id:'scenic',name:'Готовые маршруты',root:'#scenicRoutes, .roadtrip-collection',selectors:['#scenicRoutes, #journeys > .roadtrip-collection']},
 {id:'collection',name:'Места · поиск и карточки',root:'#collection',selectors:['#collection','#journeys > .collection-search','#journeys > .filterline','#cards','#journeys > .place-pagination','#journeys > .place-pagination-status']},
 {id:'waterfall',name:'Водопады',root:'.waterfall-story',selectors:['#journeys > .waterfall-story']},
 {id:'experiences',name:'Впечатления',root:'#routeExperiences',selectors:['#routeExperiences']},
 {id:'cafes',name:'Кофейни',root:'#cafeStops',selectors:['#cafeStops']},
 {id:'stays',name:'Домики и сауны',root:'#staysSauna',selectors:['#staysSauna']},
 {id:'film',name:'Видео',root:'#droneExperience',selectors:['#droneExperience']},
 {id:'advertising',name:'Реклама',root:'#advertising',selectors:['#advertising']},
 {id:'contact',name:'Контакты',root:'#contact',selectors:['#contact']},
 {id:'map',name:'Карта Норвегии',root:'#norwayOverview',selectors:['#norwayOverview']}
];
export const BLOCKS=[
 {id:'about',name:'Главная · как открыть Норвегию',root:'#about',title:'#about h2',intro:'#about .explorer-intro'},
 {id:'collection',name:'Главная · места',root:'#collection',title:'#collection h2',intro:'#collection > p'},
 {id:'scenic',name:'Главная · готовые маршруты',root:'#scenicRoutes',title:'#scenicRoutes h2',intro:'#scenicRoutes .roadtrip-intro'},
 {id:'waterfall',name:'Главная · водопад',root:'.waterfall-story',title:'.waterfall-story h2',intro:'.waterfall-story p:not(.eyebrow)'},
 {id:'experiences',name:'Главная · впечатления',root:'#routeExperiences',title:'#routeExperiences h2',intro:'#routeExperiences .experiences-intro'},
 {id:'cafes',name:'Главная · кофейни',root:'#cafeStops',title:'#cafeStops h2',intro:'#cafeStops .discovery-heading p:not(.discovery-kicker)'},
 {id:'stays',name:'Главная · домики и сауны',root:'#staysSauna',title:'#staysSauna h2',intro:'#staysSauna .stays-intro'},
 {id:'film',name:'Главная · видео',root:'#droneExperience',title:'#droneExperience h2',intro:'#droneExperience .drone-experience-body p:not(.eyebrow):not(.drone-experience-note)'},
 {id:'contact',name:'Главная · контакты',root:'#contact',title:'#contact h2',intro:'#contact p'},
 {id:'map',name:'Главная · карта',root:'#norwayOverview',title:'#norwayOverview h2',intro:'#norwayOverview .norway-overview__intro'}
];
export const BUTTONS=[
 {id:'signIn',name:'Войти',selector:'#headerSignIn',action:'Вход в аккаунт'},
 {id:'register',name:'Регистрация',selector:'#headerRegister',action:'Регистрация посетителя'},
 {id:'account',name:'Мой аккаунт',selector:'#headerMyAccount',action:'Открыть аккаунт'},
 {id:'hero',name:'Главная · открыть места',selector:'.hero-content > a.button',action:'Перейти по ссылке',link:true},
 {id:'waterfall',name:'Открыть водопады',selector:'#waterfallExplore',action:'Открыть галерею водопадов'},
 ...PAGES.map(page=>({id:'nav_'+page.id,name:'Вкладка · '+page.name,selector:page.id==='home'?'body > header > nav > button[data-tab=journeys]':'body > header > nav > [href="'+page.root+'"]',action:'Открыть раздел '+page.name}))
];
export const BUTTON_STYLE_FIELDS={fontSize:{name:'Размер текста, px',min:11,max:32,default:14},padding:{name:'Отступ кнопки, px',min:4,max:28,default:12},radius:{name:'Скругление, px',min:0,max:50,default:12}};
export function safeButtonHref(value){return typeof value==='string'&&(PAGES.some(p=>value===p.root)||BLOCKS.some(p=>value===p.root&&value.startsWith('#'))||value.startsWith('https://')&&safeMediaURL(value));}
export const THEME_FIELDS={
 panel:{type:'color',label:'Фон разделов',default:'#123440'},card:{type:'color',label:'Фон карточек',default:'#193f4b'},
 action:{type:'color',label:'Кнопки',default:'#255563'},ink:{type:'color',label:'Основной текст',default:'#edf6f4'},
 muted:{type:'color',label:'Дополнительный текст',default:'#b8cecf'},accent:{type:'color',label:'Акценты',default:'#d0e7df'},
 gutter:{type:'number',label:'Боковые поля, px',min:8,max:64,step:1,default:24},
 inset:{type:'number',label:'Отступ внутри блока, px',min:12,max:56,step:1,default:24},
 radius:{type:'number',label:'Скругление карточек, px',min:0,max:36,step:1,default:18},
 contentWidth:{type:'number',label:'Максимальная ширина, px',min:960,max:1800,step:20,default:1440},
 headerOpacity:{type:'number',label:'Насыщенность фона шапки',min:0.08,max:0.6,step:0.01,default:0.22},
 headerHeight:{type:'number',label:'Высота шапки на компьютере, px',min:180,max:560,step:10,default:300},
 headerPosition:{type:'number',label:'Положение фона шапки, %',min:0,max:100,step:1,default:50},
 font:{type:'select',label:'Шрифт',options:['Manrope','DM Sans','Barlow Condensed'],default:'Manrope'}
};
export const MEDIA_FIELDS=[{id:'header',name:'Фон шапки — композиция Украина / Норвегия'},{id:'hero',name:'Главная — фоновое фото'},{id:'waterfall',name:'Главная — фото водопада'},{id:'cafes',name:'Кофейни — фоновое фото'}];
export const ELEMENTS=createElementDescriptors({PAGES,BLOCKS,BUTTONS,SECTIONS});
export const elementDescriptor=id=>resolveElementDescriptor(id,ELEMENTS);
export const validateElementStyle=value=>validateStyle(value,safeMediaURL);
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
const keys=(x,allowed)=>{if(!plain(x)||Object.keys(x).some(k=>!allowed.includes(k)))throw new Error('invalid_editor_fields');};
export function safeMediaURL(value){
 if(typeof value!=='string'||value.length>1000||/[\u0000-\u0020<>"'`{}\\]/.test(value))return false;
 if(/^\.?\/?images\/[\w./%+-]+$/i.test(value)&&!value.includes('..'))return true;
 if(/^\.?\/?[\w-]+\.(?:jpe?g|png|webp)$/i.test(value))return true;
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[)/i.test(u.hostname);}catch{return false;}
}
function translated(value,max){keys(value,LANGUAGES);const out={};for(const lang of LANGUAGES)if(value[lang]!==undefined){if(typeof value[lang]!=='string'||value[lang].length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value[lang]))throw new Error('invalid_editor_text');if(value[lang].trim())out[lang]=value[lang].trim();}return out;}
function records(value,descriptors){keys(value,descriptors.map(x=>x.id));const out={};for(const [id,item]of Object.entries(value)){keys(item,['title','intro','enabled']);const clean={};if(item.title!==undefined)clean.title=translated(item.title,240);if(item.intro!==undefined)clean.intro=translated(item.intro,1800);if(item.enabled!==undefined){if(typeof item.enabled!=='boolean'||id==='home'&&item.enabled===false)throw new Error('invalid_editor_visibility');clean.enabled=item.enabled;}out[id]=clean;}return out;}
export function validatePlace(value){
 keys(value,['id','name','category','town','county','countyId','region','address','lat','lon','description','hours','hoursSource','website','bookingUrl','source','checked','season','photos','enabled']);
 if(typeof value.id!=='string'||!/^[a-z0-9][a-z0-9-]{0,79}$/.test(value.id))throw new Error('invalid_place_id');
 const out={id:value.id,enabled:value.enabled!==false};if(value.enabled!==undefined&&typeof value.enabled!=='boolean')throw new Error('invalid_place_visibility');
 for(const key of ['name','town','county','countyId','region','address'])if(value[key]!==undefined){if(typeof value[key]!=='string'||value[key].length>(key==='address'?500:200)||/[\u0000-\u001f]/.test(value[key]))throw new Error('invalid_place_text');out[key]=value[key].trim();}
 if(value.category!==undefined){if(!['cafe','cabin','sauna','rest'].includes(value.category))throw new Error('invalid_place_category');out.category=value.category;}
 for(const [key,max]of [['lat',90],['lon',180]])if(value[key]!==undefined){if(!Number.isFinite(value[key])||Math.abs(value[key])>max)throw new Error('invalid_place_coordinates');out[key]=value[key];}
 if(out.enabled&&(!out.name||!out.category||!Number.isFinite(out.lat)||!Number.isFinite(out.lon)))throw new Error('place_name_category_coordinates_required');
 for(const key of ['description','hours','season'])if(value[key]!==undefined)out[key]=translated(value[key],key==='description'?1800:1000);
 for(const key of ['hoursSource','website','bookingUrl','source'])if(value[key]!==undefined){if(value[key]!==''&&(!safeMediaURL(value[key])||!value[key].startsWith('https://')))throw new Error('invalid_place_url');out[key]=value[key];}
 if(value.checked!==undefined){if(typeof value.checked!=='string'||value.checked!==''&&(!/^\d{4}-\d{2}-\d{2}$/.test(value.checked)||!Number.isFinite(Date.parse(value.checked))||new Date(value.checked).toISOString().slice(0,10)!==value.checked))throw new Error('invalid_place_date');out.checked=value.checked;}
 if(value.photos!==undefined){if(!Array.isArray(value.photos)||value.photos.length>12)throw new Error('invalid_place_photos');out.photos=value.photos.map(photo=>{keys(photo,['src','alt','credit','source','license','licenseUrl','kind']);if(!safeMediaURL(photo.src))throw new Error('invalid_place_photo');const image={src:photo.src};for(const key of ['alt','credit','source','license','licenseUrl','kind'])if(photo[key]!==undefined){if(typeof photo[key]!=='string'||photo[key].length>1000)throw new Error('invalid_place_photo');image[key]=photo[key];}for(const key of ['source','licenseUrl'])if(image[key]&&!safeMediaURL(image[key]))throw new Error('invalid_place_photo_source');return image;});}
 return out;
}
export function validateDocument(value){
 keys(value,['schemaVersion','theme','pages','blocks','media','navOrder','catalogue','buttons','headerButtonOrder','sectionOrder','elements','framePresets']);if(value.schemaVersion!==1)throw new Error('invalid_editor_schema');
 const out={schemaVersion:1,theme:{},pages:{},blocks:{},media:{},navOrder:[],catalogue:{places:[]},buttons:{},headerButtonOrder:[],sectionOrder:[],elements:{},framePresets:[]};
 if(value.elements!==undefined)out.elements=validateElements(value.elements,elementDescriptor,safeMediaURL);
 if(value.framePresets!==undefined)out.framePresets=validateFramePresets(value.framePresets,safeMediaURL);
 if(value.theme!==undefined){keys(value.theme,Object.keys(THEME_FIELDS));for(const [key,v]of Object.entries(value.theme)){const f=THEME_FIELDS[key];if(f.type==='color'&&!/^#[0-9a-f]{6}$/i.test(v)||f.type==='number'&&(!Number.isFinite(v)||v<f.min||v>f.max)||f.type==='select'&&!f.options.includes(v))throw new Error('invalid_editor_theme');out.theme[key]=v;}}
 if(value.pages!==undefined)out.pages=records(value.pages,PAGES);
 if(value.blocks!==undefined)out.blocks=records(value.blocks,BLOCKS);
 if(value.media!==undefined){keys(value.media,MEDIA_FIELDS.map(x=>x.id));for(const[id,m]of Object.entries(value.media)){keys(m,['src','alt','credit','source']);if(!safeMediaURL(m.src))throw new Error('invalid_editor_image');const image={src:m.src};for(const field of ['alt','credit','source'])if(m[field]!==undefined){if(typeof m[field]!=='string'||m[field].length>1000)throw new Error('invalid_editor_image');image[field]=m[field];}if(image.source&&!safeMediaURL(image.source))throw new Error('invalid_editor_source');out.media[id]=image;}}
 if(value.navOrder!==undefined){const ids=PAGES.map(p=>p.id);if(!Array.isArray(value.navOrder)||value.navOrder.length>ids.length||new Set(value.navOrder).size!==value.navOrder.length||value.navOrder.some(x=>!ids.includes(x)))throw new Error('invalid_editor_order');out.navOrder=[...value.navOrder];}
 if(value.buttons!==undefined){keys(value.buttons,BUTTONS.map(b=>b.id));for(const [id,item]of Object.entries(value.buttons)){keys(item,['label','fontSize','padding','radius','background','color','href']);const button={};if(item.label!==undefined)button.label=translated(item.label,120);for(const [key,field]of Object.entries(BUTTON_STYLE_FIELDS))if(item[key]!==undefined){if(!Number.isFinite(item[key])||item[key]<field.min||item[key]>field.max)throw new Error('invalid_button_style');button[key]=item[key];}for(const key of ['background','color'])if(item[key]!==undefined){if(typeof item[key]!=='string'||!/^#[0-9a-f]{6}$/i.test(item[key]))throw new Error('invalid_button_color');button[key]=item[key];}if(item.href!==undefined){if(id!=='hero'||!safeButtonHref(item.href))throw new Error('invalid_button_link');button.href=item.href;}out.buttons[id]=button;}}
 if(value.headerButtonOrder!==undefined){if(!Array.isArray(value.headerButtonOrder)||value.headerButtonOrder.length>2||new Set(value.headerButtonOrder).size!==value.headerButtonOrder.length||value.headerButtonOrder.some(id=>!['signIn','register'].includes(id)))throw new Error('invalid_header_button_order');out.headerButtonOrder=[...value.headerButtonOrder];}
 if(value.sectionOrder!==undefined){const ids=SECTIONS.map(s=>s.id);if(!Array.isArray(value.sectionOrder)||value.sectionOrder.length>ids.length||new Set(value.sectionOrder).size!==value.sectionOrder.length||value.sectionOrder.some(id=>!ids.includes(id)))throw new Error('invalid_section_order');out.sectionOrder=[...value.sectionOrder];}
 if(value.catalogue!==undefined){keys(value.catalogue,['places']);if(!Array.isArray(value.catalogue.places)||value.catalogue.places.length>200)throw new Error('invalid_catalogue');out.catalogue.places=value.catalogue.places.map(validatePlace);if(new Set(out.catalogue.places.map(r=>r.id)).size!==out.catalogue.places.length)throw new Error('duplicate_place_id');}
 if(JSON.stringify(out).length>200000)throw new Error('editor_document_too_large');return out;
}
export const emptyDocument=()=>validateDocument({schemaVersion:1});
