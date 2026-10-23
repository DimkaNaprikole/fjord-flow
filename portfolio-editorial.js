/* Static editorial hero; preserves the portfolio's existing data and actions. */
(()=>{'use strict';
const strings={
en:['Norway.','Seen differently.','Remarkable routes, fjords and landscapes worth seeing. A little closer to Norway.','Explore the routes','PORTFOLIO CONCEPT'],
nb:['Norge.','Sett med nye øyne.','Fjorder, kystlandskap og veier det er verdt å oppleve. Litt nærmere Norge.','Utforsk rutene','PORTFOLIOKONSEPT'],
uk:['Норвегія.','Інший погляд.','Фіорди, мальовничі дороги та місця, які варто побачити. Трохи ближче до Норвегії.','Переглянути маршрути','КОНЦЕПТ ПОРТФОЛІО'],
sv:['Norge.','Med nya ögon.','Fjordar, kustlandskap och vägar värda att upptäcka. Lite närmare Norge.','Utforska rutterna','PORTFOLIOKONCEPT'],
da:['Norge.','Med nye øjne.','Fjorde, kystlandskaber og veje, der er værd at opleve. Lidt tættere på Norge.','Udforsk ruterne','PORTEFØLJEKONCEPT']
};
function update(){
 const l=document.querySelector('#siteLanguage')?.value||'en',s=strings[l]||strings.en,h=document.querySelector('#advertisingTitle');
 if(!h)return;
 h.querySelector('strong').textContent=s[0];h.querySelector('span').textContent=s[1];
 const nav={nb:['Oversikt','Ruter'],en:['Overview','Routes'],uk:['Огляд','Маршрути'],sv:['Översikt','Rutter'],da:['Overblik','Ruter']}[l]||['Overview','Routes'];
 document.querySelector('header nav a[href="#advertising"]').textContent=nav[0];document.querySelector('header nav a[href="#scenicRoutes"]').textContent=nav[1];
 document.querySelector('#editorialIntro').textContent=s[2];document.querySelector('.portfolio-first-cta').textContent=s[3];document.querySelector('#editorialEyebrow').textContent=s[4];
}
window.addEventListener('fjordlanguagechange',update);document.querySelector('#siteLanguage')?.addEventListener('change',()=>setTimeout(update,0));update();
const credit=document.createElement('p');credit.className='editorial-credit';
const source=document.createElement('a');source.href='https://commons.wikimedia.org/wiki/File:Geirangerfjord_from_%C3%98rnesvingen,_2013_June.jpg';source.target='_blank';source.rel='noopener noreferrer';source.textContent='Hero photo: Ximonic (Simo Räsänen) · CC BY-SA 3.0';
credit.append(source,document.createTextNode(' · Eagle: decorative illustration. Osiris: Fjord Flow mascot.'));
document.querySelector('footer')?.append(credit);
document.querySelectorAll('header nav a').forEach(a=>a.addEventListener('click',()=>{document.querySelectorAll('header nav a').forEach(x=>x.removeAttribute('aria-current'));a.setAttribute('aria-current','page')}));
})();

