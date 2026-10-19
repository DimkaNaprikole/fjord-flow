/* Operator status + decoded road images; tourism cameras visually checked separately. Click to load media. */
(()=>{'use strict';
let cameras=typeof module!=='undefined'&&module.exports?require('./webcam-directory-data.json').cameras:[];
let worldCameras=typeof module!=='undefined'&&module.exports?require('./webcam-directory-data.json').worldCameras||[]:[];
const photoCredits={loen:['Ximonic (Simo Räsänen)','CC BY-SA 4.0','https://commons.wikimedia.org/wiki/File:Summer_evening_at_Lovatnet,_Stryn,_Norway,_2013_June.jpg'],bergen:['Diego Delso','CC BY-SA 4.0','https://commons.wikimedia.org/wiki/File:Bryggen,_Bergen,_Noruega,_2019-09-08,_DD_115-117_PAN.jpg'],geiranger:['Andreas Trepte','CC BY-SA 2.5','https://commons.wikimedia.org/wiki/File:Geirangerfjord_.jpg']};
function recent(camera,now=Date.now()){const age=now-Date.parse(camera.checked+'T00:00:00Z');return age>=0&&age<7*86400000;}
function select(type='all',checkedOnly=true,now=Date.now()){return cameras.filter(c=>(type==='all'||c.type===type)&&(!checkedOnly||recent(c,now)));}
if(typeof module!=='undefined'&&module.exports){module.exports={cameras,worldCameras,recent,select};return;}
const copy={
 nb:['Norge gjennom webkameraer','Se været og utsikten før du drar.','Alle','Video','Panorama 360°','Bare nylig kontrollerte','Bilde kontrollert','Må kontrolleres igjen','Kontrollert','Kvalitet ikke oppgitt','Se kamera','Åpne hos operatøren ↗','Stedsfoto · ikke et direkte kamerabilde','Ingen nylig kontrollerte kameraer i dette utvalget.','Status gjelder siste visuelle kontroll, ikke kontinuerlig overvåking. Etter sju dager kreves ny kontroll. Bitrate er ikke oppgitt av operatørene; oppløsning vises bare når den er målt.','Spilleren lastes først når du trykker. Tredjeparten kan bruke informasjonskapsler.','Stopp video'],
 en:['Norway through webcams','Check the weather and the view before you go.','All','Video','360° panorama','Recently checked only','Picture checked','Needs a new check','Checked','Quality not provided','Watch camera','Open operator’s camera ↗','Location photo · not a live camera image','No recently checked cameras in this selection.','Status reflects the last visual check, not continuous monitoring. A new check is required after seven days. Operators do not publish bitrate; resolution is shown only when measured.','The player loads only when you press play. The third party may use cookies.','Stop video'],
 uk:['Норвегія через вебкамери','Подивіться погоду й краєвид перед поїздкою.','Усі','Відео','Панорама 360°','Лише нещодавно перевірені','Зображення перевірено','Потрібна нова перевірка','Перевірено','Якість не вказана','Дивитися камеру','Відкрити камеру оператора ↗','Фото місця · не прямий кадр із камери','У цій добірці немає нещодавно перевірених камер.','Статус стосується останньої візуальної перевірки, а не постійного моніторингу. Через сім днів потрібна нова перевірка. Оператори не вказують бітрейт; роздільність показуємо лише коли її виміряно.','Плеєр завантажиться лише після натискання. Сторонній сервіс може використовувати cookies.','Зупинити відео'],
 sv:['Norge genom webbkameror','Se vädret och utsikten före resan.','Alla','Video','Panorama 360°','Bara nyligen kontrollerade','Bilden kontrollerad','Behöver kontrolleras igen','Kontrollerad','Kvalitet inte angiven','Se kameran','Öppna hos operatören ↗','Platsfoto · inte en livebild','Inga nyligen kontrollerade kameror i urvalet.','Status avser senaste visuella kontrollen, inte ständig övervakning. Ny kontroll krävs efter sju dagar. Bitrate anges inte; upplösning visas bara när den har mätts.','Spelaren laddas först när du trycker. Tredje part kan använda cookies.','Stoppa video'],
 da:['Norge gennem webkameraer','Se vejret og udsigten før turen.','Alle','Video','Panorama 360°','Kun nyligt kontrollerede','Billedet kontrolleret','Skal kontrolleres igen','Kontrolleret','Kvalitet ikke oplyst','Se kamera','Åbn hos operatøren ↗','Stedsfoto · ikke et livebillede','Ingen nyligt kontrollerede kameraer i udvalget.','Status gælder seneste visuelle kontrol, ikke konstant overvågning. Ny kontrol kræves efter syv dage. Bitrate oplyses ikke; opløsning vises kun når den er målt.','Afspilleren indlæses først ved tryk. Tredjeparten kan bruge cookies.','Stop video']};
// A technical image check is distinct from a person visually inspecting a camera.
const policies={
 nb:'Turistkameraer er kontrollert visuelt. Veikameraer: operatørstatus og lesbar JPEG-fil er kontrollert, ikke hvert motiv manuelt. Oppdaterte bilder er ikke kontinuerlig video. Tidspunktet gjelder operatørdata; dette er ikke en garanti for kameraklokken. Etter sju dager vises ikke kameraet som nylig kontrollert.',
 en:'Tourist cameras were visually checked. Road cameras: operator status and a decodable JPEG were checked, not every scene manually. Updated snapshots are not continuous video. Operator update time is not a guarantee of image capture time. After seven days a camera is no longer shown as recently checked.',
 uk:'Туристичні камери перевірено візуально. Для дорожніх перевірено статус оператора й читабельність JPEG, а не кожен сюжет вручну. Оновлюваний знімок — не безперервне відео. Час оновлення оператора не гарантує час зйомки. Через сім днів камера більше не позначається як нещодавно перевірена.',
 sv:'Turistkameror är visuellt kontrollerade. För vägkameror kontrollerades operatörstatus och läsbar JPEG, inte varje motiv manuellt. Uppdaterade bilder är inte kontinuerlig video. Operatörens uppdateringstid garanterar inte bildens tid. Efter sju dagar räknas kameran inte som nyligen kontrollerad.',
 da:'Turistkameraer er visuelt kontrolleret. For vejkameraer er operatørstatus og læsbar JPEG kontrolleret, ikke hvert motiv manuelt. Opdaterede billeder er ikke kontinuerlig video. Operatørens opdateringstid garanterer ikke optagelsestidspunktet. Efter syv dage regnes kameraet ikke som nyligt kontrolleret.'};
for(const l of Object.keys(copy)){copy[l][14]=policies[l];copy[l][16]={nb:'Lukk kameraet',en:'Close camera',uk:'Закрити камеру',sv:'Stäng kameran',da:'Luk kameraet'}[l];}
const section=document.createElement('section');section.id='norwayWebcams';section.className='webcam-directory';section.dataset.i18nIgnore='';
(document.getElementById('buaEquipment')||document.getElementById('norwayCatalogue')).after(section);
let type='all',checkedOnly=true,stopCamera=null,query='',kind='all',limit=24,loadFailed=false;
const navLink=document.createElement('a');navLink.href='#norwayWebcams';navLink.dataset.i18nIgnore='';document.querySelector('header nav')?.append(navLink);
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
const extra={
 nb:['Oppdaterte bilder','Søk etter sted eller vei','Søk','Alle kilder','Turistkameraer','Veikameraer','Vis flere','kameraer i utvalget','Operatørstatus + bildefil kontrollert','Bilde visuelt kontrollert','Bildets klokkeslett er ikke bekreftet','Last inn kamerabilde','Kunne ikke laste kameraregisteret.','Prøv igjen','Tid hos operatøren','Kilder og Facebook'],
 en:['Updated snapshots','Search place or road','Search','All sources','Tourist cameras','Road cameras','Show more','cameras in this selection','Operator status + image file checked','Picture visually checked','Image capture time not confirmed','Load camera image','Could not load the camera registry.','Try again','Operator update time','Sources and Facebook'],
 uk:['Оновлювані знімки','Пошук місця або дороги','Знайти','Усі джерела','Туристичні камери','Дорожні камери','Показати ще','камер у добірці','Перевірено статус оператора й файл зображення','Зображення перевірено візуально','Час зйомки не підтверджено','Завантажити кадр камери','Не вдалося завантажити каталог камер.','Спробувати знову','Час оновлення оператора','Джерела та Facebook'],
 sv:['Uppdaterade bilder','Sök plats eller väg','Sök','Alla källor','Turistkameror','Vägkameror','Visa fler','kameror i urvalet','Operatörstatus och bildfil kontrollerade','Bilden visuellt kontrollerad','Bildens tid inte bekräftad','Ladda kamerabild','Kameraregistret kunde inte laddas.','Försök igen','Operatörens uppdateringstid','Källor och Facebook'],
 da:['Opdaterede billeder','Søg sted eller vej','Søg','Alle kilder','Turistkameraer','Vejkameraer','Vis flere','kameraer i udvalget','Operatørstatus og billedfil kontrolleret','Billedet visuelt kontrolleret','Billedets tidspunkt ikke bekræftet','Indlæs kamerabillede','Kameraregistret kunne ikke indlæses.','Prøv igen','Operatørens opdateringstid','Kilder og Facebook']};
const mediaWords={
 nb:['Laster kameraet…','Kamerabildet kunne ikke lastes. Prøv igjen eller åpne operatøren.','Spilleren er åpnet. Hvis bildet uteblir, åpne operatørens kamera.','Kameraet åpnes på operatørens nettsted.','Åpne kameraet ↗'],
 en:['Loading camera…','Could not load the camera image. Retry or open the operator.','Player opened. If there is no picture, open the operator’s camera.','This camera opens on the operator’s website.','Open camera ↗'],
 uk:['Завантажуємо камеру…','Не вдалося завантажити кадр. Спробуйте знову або відкрийте сайт оператора.','Плеєр відкрито. Якщо немає зображення, відкрийте камеру оператора.','Ця камера відкривається на сайті оператора.','Відкрити камеру ↗'],
 sv:['Laddar kameran…','Kamerabilden kunde inte laddas. Försök igen eller öppna operatören.','Spelaren är öppen. Om bilden saknas, öppna operatörens kamera.','Kameran öppnas på operatörens webbplats.','Öppna kameran ↗'],
 da:['Indlæser kamera…','Kamerabilledet kunne ikke indlæses. Prøv igen eller åbn operatøren.','Afspilleren er åben. Hvis billedet mangler, åbn operatørens kamera.','Kameraet åbnes på operatørens hjemmeside.','Åbn kamera ↗']};
const normal=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().replace(/ø/g,'o').replace(/æ/g,'ae');
function render(){
 stopCamera?.();const lang=window.FjordI18n?.language||document.documentElement.lang,t=copy[lang]||copy.nb,u=extra[lang]||extra.nb,m=mediaWords[lang]||mediaWords.nb;
 navLink.textContent=({nb:'Webkameraer',en:'Webcams',uk:'Вебкамери',sv:'Webbkameror',da:'Webkameraer'})[lang]||'Webkameraer';section.replaceChildren();section.append(el('p','FJORD / FLOW · WEBCAM','eyebrow'),el('h2',t[0]),el('p',t[1]));
 const controls=el('div',null,'webcam-filters');
 for(const [value,label]of[['all',t[2]],['video',t[3]],['panorama',t[4]],['snapshot',u[0]]]){const b=el('button',label);b.type='button';b.setAttribute('aria-pressed',String(type===value));b.onclick=()=>{type=value;limit=24;render();};controls.append(b);}
 const label=el('label'),check=el('input');check.type='checkbox';check.checked=checkedOnly;check.onchange=()=>{checkedOnly=check.checked;limit=24;render();};label.append(check,document.createTextNode(t[5]));controls.append(label);
 const searchLabel=el('label',u[1]),search=el('input');search.type='search';search.value=query;search.setAttribute('aria-label',u[1]);searchLabel.append(search);controls.append(searchLabel);
 const runSearch=()=>{query=search.value.trim();limit=24;render();},searchButton=el('button',u[2]);searchButton.type='button';searchButton.onclick=runSearch;search.onkeydown=e=>{if(e.key==='Enter')runSearch();};controls.append(searchButton);
 const sourceLabel=el('label',u[3]),sourceSelect=el('select');sourceSelect.setAttribute('aria-label',u[3]);for(const [v,text]of[['all',u[3]],['tourist',u[4]],['road',u[5]]]){const option=el('option',text);option.value=v;sourceSelect.append(option);}sourceSelect.value=kind;sourceSelect.onchange=()=>{kind=sourceSelect.value;limit=24;render();};sourceLabel.append(sourceSelect);controls.append(sourceLabel);section.append(controls);
 const rows=select(type,checkedOnly).filter(c=>(kind==='all'||c.kind===kind)&&normal([c.name,c.region,c.operator].join(' ')).includes(normal(query)));
 section.append(el('p',rows.length+' '+u[7],'webcam-count'));
 const grid=el('div',null,'webcam-grid');
 function addCamera(camera,grid){
  const card=el('article',null,'webcam-card'),visual=el('div',null,'webcam-visual');
  const placeholder=camera.image?el('img'):el('div','◉ '+camera.name,'webcam-placeholder');if(camera.image){placeholder.src=camera.image;placeholder.alt=camera.name;placeholder.loading='lazy';}visual.append(placeholder);card.append(visual);
  if(camera.image)card.append(el('small',t[12],'webcam-photo-note'));
  card.append(el('h3',camera.name),el('p',camera.operator,'webcam-operator'));
  const credit=photoCredits[camera.id];if(credit){const a=el('a',credit[0]+' · '+credit[1],'webcam-credit');a.href=credit[2];a.target='_blank';a.rel='noopener noreferrer';card.append(a);}
  const facts=el('div',null,'webcam-facts');facts.append(el('span',camera.type==='video'?t[3]:camera.type==='panorama'?t[4]:u[0]),el('span',camera.verification==='visual'?u[9]:u[8]));if(!recent(camera))facts.append(el('span',t[7]));if(camera.quality)facts.append(el('span',camera.quality));card.append(facts,el('p',t[8]+': '+camera.checked,'webcam-checked'));
  if(camera.captureTimeUnknown)card.append(el('small',u[10]));
  if(camera.sourceUpdated)card.append(el('small',u[14]+': '+new Intl.DateTimeFormat(lang,{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Oslo'}).format(new Date(camera.sourceUpdated))));
  const inline=Boolean(camera.youtube||camera.snapshot);
  if(inline){
   const play=el('button',camera.snapshot?u[11]:t[10]);play.type='button';
   const mediaStatus=el('p',null,'webcam-media-status');mediaStatus.setAttribute('role','status');mediaStatus.hidden=true;
   const start=()=>{stopCamera?.();let timer,active=true;mediaStatus.hidden=false;mediaStatus.textContent=m[0];
    const failed=()=>{if(!active)return;if(timer)clearInterval(timer);visual.replaceChildren(placeholder);mediaStatus.hidden=false;mediaStatus.textContent=m[1];play.textContent=u[13];play.onclick=start;};
    if(camera.youtube){const frame=el('iframe');frame.title=camera.name;frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';frame.onload=()=>{if(active)mediaStatus.textContent=m[2];};frame.onerror=failed;frame.src='https://www.youtube-nocookie.com/embed/'+camera.youtube+'?autoplay=1&mute=1&playsinline=1';visual.replaceChildren(frame);}
    else{const shot=el('img');shot.alt=camera.name;shot.onload=()=>{if(active)mediaStatus.hidden=true;};shot.onerror=failed;const refresh=()=>{shot.src=camera.snapshot+'?t='+Date.now();};refresh();visual.replaceChildren(shot);timer=setInterval(refresh,60000);}
    play.textContent=t[16];stopCamera=()=>{active=false;if(timer)clearInterval(timer);visual.replaceChildren(placeholder);mediaStatus.hidden=true;play.textContent=camera.snapshot?u[11]:t[10];play.onclick=start;stopCamera=null;};play.onclick=()=>stopCamera?.();
   };play.onclick=start;card.append(el('small',t[15]),mediaStatus,play);
  }else{
   const open=el('a',null,'webcam-open-view');open.href=camera.url;open.setAttribute('aria-label',m[4]+' · '+camera.name);visual.replaceChildren(open);open.append(placeholder,el('span',m[4],'webcam-open-overlay'));card.append(el('small',m[3],'webcam-external-note'));
  }
  const link=el('a',inline?t[11]:m[4],inline?'':'webcam-launch');link.href=camera.url;link.rel='noopener noreferrer';card.append(link);
  if(camera.license){const a=el('a',camera.operator+' · '+camera.license,'webcam-credit');a.href=camera.licenseUrl;a.target='_blank';a.rel='noopener noreferrer';card.append(a);}
  grid.append(card);
 }
 for(const camera of rows.slice(0,limit))addCamera(camera,grid);
 section.append(grid);const status=el('div',null,'webcam-status');if(!rows.length)status.append(el('p',loadFailed?u[12]:t[13]));
 if(rows.length>limit){const more=el('button',u[6]+' · '+Math.min(24,rows.length-limit),'webcam-more');more.type='button';more.onclick=()=>{limit+=24;render();};section.append(more);}
 if(loadFailed){const retry=el('button',u[13]);retry.onclick=load;status.append(retry);}section.append(status);
 const worldText={
  nb:['Webkameraer fra verden','Kontrollerte videoer og panoramaer på operatørens nettsted. Det kan vises reklame før bildet.','Til verdenskameraene ↓'],
  en:['Webcams around the world','Checked videos and panoramas on the operator’s website. An advertisement may play before the camera.','World webcams ↓'],
  uk:['Вебкамери світу','Перевірені відео й панорами на сайті оператора. Перед камерою може бути реклама.','До камер світу ↓'],
  sv:['Webbkameror i världen','Kontrollerade videor och panoramor på operatörens webbplats. Reklam kan visas före kamerabilden.','Till världskamerorna ↓'],
  da:['Webkameraer i verden','Kontrollerede videoer og panoramaer på operatørens hjemmeside. Reklamer kan vises før kameraet.','Til verdenskameraerne ↓']
 }[lang]||['World webcams','Live views on the operator website. Advertising may play first.','World webcams ↓'];
 const world=el('section',null,'webcam-world');world.id='worldWebcams';world.append(el('h2',worldText[0]),el('p',worldText[1]));
 const worldGrid=el('div',null,'webcam-grid');for(const camera of worldCameras.filter(c=>!checkedOnly||recent(c)))addCamera(camera,worldGrid);world.append(worldGrid);section.append(world);
 const worldJump=el('button',worldText[2],'webcam-world-jump');worldJump.type='button';worldJump.onclick=()=>world.scrollIntoView({behavior:'smooth',block:'start'});controls.prepend(worldJump);
 const sources=el('details',null,'webcam-sources');sources.append(el('summary',u[15]));
 for(const [name,url]of[['Statens vegvesen · data','https://dataut.vegvesen.no/dataservice/webkamera-statuser-api'],['Vegvesen trafikk','https://www.vegvesen.no/trafikk'],['Skiinfo Norge · Facebook','https://www.facebook.com/skiinfonorge'],['Skiinfo · Norge','https://www.skiinfo.no/norge/webcams']]){const a=el('a',name+' ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';sources.append(a);}section.append(sources,el('p',t[14],'webcam-policy'));window.dispatchEvent(new Event('fjord:sections-changed'));
}
async function load(){try{const r=await window.fetch('./webcam-directory-data.json?v=2');if(!r.ok)throw Error('registry unavailable');const data=await r.json();if(!Array.isArray(data.cameras))throw Error('invalid registry');cameras=data.cameras;worldCameras=Array.isArray(data.worldCameras)?data.worldCameras:[];loadFailed=false;}catch{loadFailed=true;}render();}
window.FjordWebcams={ready:load()};
const stopHiddenCamera=()=>{if(document.hidden||section.hidden||section.closest('[hidden]'))stopCamera?.();};
window.addEventListener('fjord:sections-changed',stopHiddenCamera);
document.addEventListener('visibilitychange',stopHiddenCamera);
window.addEventListener('fjordlanguagechange',render);
})();
