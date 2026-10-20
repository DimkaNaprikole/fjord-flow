import {mountSiteGallery} from './site-gallery.mjs?v=20261020continuity1';

const copy={
 nb:['Språk','PROSJEKT OSIRIS','din digitale følgesvenn','Snakk med Osiris eller utforsk bevegelsene hans.','Åpne chat','Bevegelsesverksted','Utforsk de ferdige bevegelsene. Du starter forhåndsvisningen selv.'],
 en:['Language','PROJECT OSIRIS','your digital companion','Talk to Osiris or explore his movements.','Open chat','Motion workshop','Explore the finished movements. You start the preview yourself.'],
 ru:['Язык','ПРОЕКТ OSIRIS','твой цифровой спутник','Поговори с Osiris или посмотри его движения.','Открыть чат','Мастерская движений','Все готовые движения в одном месте. Большой показ запускается вручную.'],
 uk:['Мова','ПРОЄКТ OSIRIS','твій цифровий супутник','Поговори з Osiris або переглянь його рухи.','Відкрити чат','Майстерня рухів','Усі готові рухи в одному місці. Великий показ запускається вручну.'],
 sv:['Språk','PROJEKT OSIRIS','din digitala följeslagare','Prata med Osiris eller utforska hans rörelser.','Öppna chatt','Rörelseverkstad','Utforska de färdiga rörelserna. Du startar förhandsvisningen själv.'],
 da:['Sprog','PROJEKT OSIRIS','din digitale følgesvend','Tal med Osiris eller udforsk hans bevægelser.','Åbn chat','Bevægelsesværksted','Udforsk de færdige bevægelser. Du starter selv forhåndsvisningen.'],
};
const keys=['language','eyebrow','subtitle','intro','chat','lab','note'];
const language=document.querySelector('#language');
function translate(){
 const current=copy[language.value]||copy.nb;
 document.documentElement.lang=language.value;
 document.querySelectorAll('[data-copy]').forEach(el=>{
  const text=current[keys.indexOf(el.dataset.copy)];if(text!==undefined)el.textContent=text;
 });
 window.dispatchEvent(new Event('fjordlanguagechange'));
}
language.addEventListener('change',translate);
document.querySelector('#openChat').onclick=()=>window.dispatchEvent(new Event('fjord:open-chat'));
translate();
void mountSiteGallery(document.querySelector('[data-site-gallery]'));
