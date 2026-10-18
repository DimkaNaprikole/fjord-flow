/* Public editor contract. No credentials, executable HTML or arbitrary CSS. */
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
export const BLOCKS=[
 {id:'scenic',name:'Главная · готовые маршруты',root:'#scenicRoutes',title:'#scenicRoutes h2',intro:'#scenicRoutes .roadtrip-intro'},
 {id:'waterfall',name:'Главная · водопад',root:'.waterfall-story',title:'.waterfall-story h2',intro:'.waterfall-story p:not(.eyebrow)'},
 {id:'experiences',name:'Главная · впечатления',root:'#routeExperiences',title:'#routeExperiences h2',intro:'#routeExperiences .experiences-intro'},
 {id:'cafes',name:'Главная · кофейни',root:'#cafeStops',title:'#cafeStops h2',intro:'#cafeStops .discovery-heading p:not(.discovery-kicker)'},
 {id:'stays',name:'Главная · домики и сауны',root:'#staysSauna',title:'#staysSauna h2',intro:'#staysSauna .stays-intro'},
 {id:'film',name:'Главная · видео',root:'#droneExperience',title:'#droneExperience h2',intro:'#droneExperience .drone-experience-body p:not(.eyebrow):not(.drone-experience-note)'},
 {id:'contact',name:'Главная · контакты',root:'#contact',title:'#contact h2',intro:'#contact p'},
 {id:'map',name:'Главная · карта',root:'#norwayOverview',title:'#norwayOverview h2',intro:'#norwayOverview .norway-overview__intro'}
];
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
export const MEDIA_FIELDS=[{id:'header',name:'Фон шапки — композиция Украина / Норвегия'},{id:'hero',name:'Главная — фоновое фото'},{id:'waterfall',name:'Главная — фото водопада'}];
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
const keys=(x,allowed)=>{if(!plain(x)||Object.keys(x).some(k=>!allowed.includes(k)))throw new Error('invalid_editor_fields');};
export function safeMediaURL(value){
 if(typeof value!=='string'||value.length>1000||/[\u0000-\u0020<>"'`{}\\]/.test(value))return false;
 if(/^\.?\/?images\/[\w./%+-]+$/i.test(value)&&!value.includes('..'))return true;
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[)/i.test(u.hostname);}catch{return false;}
}
function translated(value,max){keys(value,LANGUAGES);const out={};for(const lang of LANGUAGES)if(value[lang]!==undefined){if(typeof value[lang]!=='string'||value[lang].length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value[lang]))throw new Error('invalid_editor_text');if(value[lang].trim())out[lang]=value[lang].trim();}return out;}
function records(value,descriptors){keys(value,descriptors.map(x=>x.id));const out={};for(const [id,item]of Object.entries(value)){keys(item,['title','intro','enabled']);const clean={};if(item.title!==undefined)clean.title=translated(item.title,240);if(item.intro!==undefined)clean.intro=translated(item.intro,1800);if(item.enabled!==undefined){if(typeof item.enabled!=='boolean'||id==='home'&&item.enabled===false)throw new Error('invalid_editor_visibility');clean.enabled=item.enabled;}out[id]=clean;}return out;}
export function validateDocument(value){
 keys(value,['schemaVersion','theme','pages','blocks','media','navOrder']);if(value.schemaVersion!==1)throw new Error('invalid_editor_schema');
 const out={schemaVersion:1,theme:{},pages:{},blocks:{},media:{},navOrder:[]};
 if(value.theme!==undefined){keys(value.theme,Object.keys(THEME_FIELDS));for(const [key,v]of Object.entries(value.theme)){const f=THEME_FIELDS[key];if(f.type==='color'&&!/^#[0-9a-f]{6}$/i.test(v)||f.type==='number'&&(!Number.isFinite(v)||v<f.min||v>f.max)||f.type==='select'&&!f.options.includes(v))throw new Error('invalid_editor_theme');out.theme[key]=v;}}
 if(value.pages!==undefined)out.pages=records(value.pages,PAGES);
 if(value.blocks!==undefined)out.blocks=records(value.blocks,BLOCKS);
 if(value.media!==undefined){keys(value.media,MEDIA_FIELDS.map(x=>x.id));for(const[id,m]of Object.entries(value.media)){keys(m,['src','alt','credit','source']);if(!safeMediaURL(m.src))throw new Error('invalid_editor_image');const image={src:m.src};for(const field of ['alt','credit','source'])if(m[field]!==undefined){if(typeof m[field]!=='string'||m[field].length>1000)throw new Error('invalid_editor_image');image[field]=m[field];}if(image.source&&!safeMediaURL(image.source))throw new Error('invalid_editor_source');out.media[id]=image;}}
 if(value.navOrder!==undefined){const ids=PAGES.map(p=>p.id);if(!Array.isArray(value.navOrder)||value.navOrder.length>ids.length||new Set(value.navOrder).size!==value.navOrder.length||value.navOrder.some(x=>!ids.includes(x)))throw new Error('invalid_editor_order');out.navOrder=[...value.navOrder];}
 if(JSON.stringify(out).length>42000)throw new Error('editor_document_too_large');return out;
}
export const emptyDocument=()=>validateDocument({schemaVersion:1});
