/* Owner's digital business card; contact links only, no form or automatic sending. */
(() => {
 'use strict';
 const host=document.getElementById('contact');if(!host)return;
 const copy={
  nb:['Din digitale hjelper — fra idé til resultat','Nettsider og programvare.','Laget for deg.','Jeg lager nettsteder, webapper og skreddersydde verktøy. Fortell hva du trenger — så finner vi en praktisk løsning.',['Nettsider','Webapper','Automatisering'],'La oss snakke om ideen din','Skriv til meg — bare meldinger.','Visuelle designkonsepter'],
  en:['Your digital helper — from idea to result','Websites and software.','Made for you.','I create websites, web apps and custom tools. Tell me what you need — and we’ll work out a practical solution.',['Websites','Web apps','Automation'],'Let’s talk about your idea','Get in touch — messages only.','Visual design concepts'],
  uk:['Ваш цифровий помічник — від ідеї до результату','Сайти та програми.','На ваше замовлення.','Створюю сайти, вебзастосунки й індивідуальні інструменти. Розкажіть, що потрібно — разом знайдемо практичне рішення.',['Сайти','Вебзастосунки','Автоматизація'],'Обговорімо вашу ідею','Напишіть мені — спілкуємося в повідомленнях.','Візуальні дизайн-концепції'],
  sv:['Din digitala hjälpare — från idé till resultat','Webbplatser och programvara.','Skapade för dig.','Jag skapar webbplatser, webbappar och skräddarsydda verktyg. Berätta vad du behöver — så hittar vi en praktisk lösning.',['Webbplatser','Webbappar','Automatisering'],'Låt oss prata om din idé','Skriv till mig — bara meddelanden.','Visuella designkoncept'],
  da:['Din digitale hjælper — fra idé til resultat','Hjemmesider og software.','Skabt til dig.','Jeg skaber hjemmesider, webapps og skræddersyede værktøjer. Fortæl, hvad du har brug for — så finder vi en praktisk løsning.',['Hjemmesider','Webapps','Automatisering'],'Lad os tale om din idé','Skriv til mig — kun beskeder.','Visuelle designkoncepter']
 };
 const email='https://mail.google.com/mail/?view=cm&fs=1&to=laurkent123%40gmail.com';
 const messenger='https://m.me/100032941041934';
 const offers={
  nb:['Dette kan jeg lage','Digitale løsninger til din oppgave',[
   ['Nettsider','Landingssider, bedriftssider, porteføljer og kataloger. Design som fungerer på både mobil og datamaskin.'],
   ['Programvare','Webapper, kundesider og skreddersydde verktøy for konkrete arbeidsoppgaver.'],
   ['Automatisering','Boter, integrasjoner, skjemaer og databehandling som reduserer manuelt rutinearbeid.'],
   ['Reklamemateriell','Bannere, digitale visittkort, omslagsbilder og visuelle innlegg for nettsider og sosiale medier.']],'Fra en ny idé til forbedring av en eksisterende løsning. Omfang og pris avtaler vi før oppstart.'],
  en:['What I can create','Digital solutions for your needs',[
   ['Websites','Landing pages, business websites, portfolios and catalogues. Responsive design for phones and computers.'],
   ['Software','Web apps, client portals and custom tools built around specific tasks.'],
   ['Automation','Bots, integrations, forms and data processing to reduce repetitive manual work.'],
   ['Advertising visuals','Banners, digital business cards, cover images and promotional visuals for websites and social media.']],'A new idea or an improvement to an existing product. We agree on scope and price before starting.'],
  uk:['Що можу створити','Цифрові рішення під вашу задачу',[
   ['Розробка сайтів','Лендинги, сайти компаній, портфоліо й каталоги. Адаптивний дизайн для телефону та комп’ютера.'],
   ['Програмне забезпечення','Вебзастосунки, особисті кабінети й індивідуальні інструменти під конкретні робочі задачі.'],
   ['Автоматизація','Боти, інтеграції, форми та обробка даних — щоб зменшити ручну рутинну роботу.'],
   ['Рекламні матеріали','Банери, цифрові візитки, обкладинки та промовізуали для сайтів і соціальних мереж.']],'Нова ідея або доопрацювання готового рішення. Обсяг роботи й вартість узгоджуємо до початку.'],
  sv:['Det här kan jag skapa','Digitala lösningar för dina behov',[
   ['Webbplatser','Landningssidor, företagssidor, portföljer och kataloger. Anpassad design för mobil och dator.'],
   ['Programvara','Webbappar, kundportaler och skräddarsydda verktyg för konkreta arbetsuppgifter.'],
   ['Automatisering','Botar, integrationer, formulär och databehandling som minskar manuellt rutinarbete.'],
   ['Reklammaterial','Banners, digitala visitkort, omslagsbilder och reklambilder för webbplatser och sociala medier.']],'En ny idé eller förbättring av en befintlig lösning. Omfattning och pris kommer vi överens om före start.'],
  da:['Det kan jeg skabe','Digitale løsninger til din opgave',[
   ['Hjemmesider','Landingssider, virksomhedssider, porteføljer og kataloger. Design til både mobil og computer.'],
   ['Software','Webapps, kundeportaler og skræddersyede værktøjer til konkrete arbejdsopgaver.'],
   ['Automatisering','Bots, integrationer, formularer og databehandling, der reducerer manuelt rutinearbejde.'],
   ['Reklamemateriale','Bannere, digitale visitkort, coverbilleder og reklamegrafik til hjemmesider og sociale medier.']],'En ny idé eller forbedring af en eksisterende løsning. Omfang og pris aftaler vi før start.']
 };
 const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;return n;};
 const link=(cls,text,href)=>{const n=el('a',cls,text);n.href=href;n.target='_blank';n.rel='noopener noreferrer';return n;};
 const original=el('div','developer-card-original');original.hidden=true;original.append(...host.childNodes);host.append(original);host.classList.add('developer-card-host');host.dataset.i18nIgnore='';
 const card=el('div','developer-card'),backdrop=el('img','developer-card__backdrop'),glow=el('div','developer-card__glow'),glass=el('div','developer-card__glass');
 backdrop.src='images/laurkent-digital-backdrop.png';backdrop.alt='';backdrop.loading='lazy';backdrop.decoding='async';glow.setAttribute('aria-hidden','true');
 const brand=el('p','developer-card__brand'),eyebrow=el('p','developer-card__eyebrow'),title=el('h2','developer-card__title'),accent=el('span','developer-card__accent'),lead=el('p','developer-card__lead'),services=el('ul','developer-card__services'),cta=link('developer-card__cta','',messenger),note=el('p','developer-card__note'),contacts=el('nav','developer-card__contacts'),concept=el('small','developer-card__concept');
 brand.append(link('','DimkaNaprikole',messenger),document.createTextNode(' Digital'));const directEmail=link('developer-card__direct-email','laurkent123@gmail.com',email);
 title.id='developerCardTitle';host.setAttribute('aria-labelledby',title.id);
 contacts.append(link('','Messenger ↗',messenger),link('developer-card__email','laurkent123@gmail.com ↗',email));
 const offerPanel=el('details','developer-card__offer'),offerLabel=el('p','developer-card__offer-label'),offerTitle=el('h3','developer-card__offer-title'),offerList=el('dl','developer-card__offer-list'),offerNote=el('p','developer-card__offer-note');
 const offerToggle=el('summary','developer-card__offer-toggle');offerPanel.append(offerToggle,offerLabel,offerTitle,offerList,offerNote);card.classList.add('developer-card--detailed');
 glass.append(brand,directEmail,eyebrow,title,lead,services,cta,note,contacts);card.append(backdrop,glow,glass,offerPanel,concept);host.append(card);
 const supportCopy={
  nb:['Litt støtte. Nye muligheter.','Var informasjonen nyttig? Liker du appen?','Støtt videre utvikling av Fjord Flow og nye kreative prosjekter med et valgfritt beløp. Hvert bidrag betyr noe.','Helt frivillig · du velger beløpet','Støtt med Vipps'],
  en:['A little support. New possibilities.','Found something useful? Enjoying the app?','Support the development of Fjord Flow and new creative projects with any amount you feel comfortable giving. Every contribution matters.','Entirely optional · choose your own amount','Support with Vipps'],
  uk:['Трохи підтримки. Більше можливостей.','Інформація стала в пригоді? Подобається застосунок?','Підтримайте розвиток Fjord Flow та нові творчі проєкти будь-якою комфортною сумою. Кожен внесок має значення.','Це добровільно · суму обираєте ви','Підтримати через Vipps'],
  sv:['Lite stöd. Nya möjligheter.','Var informationen användbar? Gillar du appen?','Stöd utvecklingen av Fjord Flow och nya kreativa projekt med ett valfritt belopp. Varje bidrag betyder något.','Helt frivilligt · du väljer beloppet','Stöd med Vipps'],
  da:['Lidt støtte. Nye muligheder.','Var informationen nyttig? Kan du lide appen?','Støt udviklingen af Fjord Flow og nye kreative projekter med et valgfrit beløb. Hvert bidrag betyder noget.','Helt frivilligt · du vælger beløbet','Støt med Vipps']
 };
 const support=el('aside','developer-support'),supportLabel=el('p','developer-support__label','FJORD FLOW · SUPPORT'),supportTitle=el('h3','developer-support__title'),supportQuestion=el('p','developer-support__question'),supportBody=el('p','developer-support__body'),supportNote=el('small','developer-support__note');
 const supportPay=el('div','developer-support__pay'),qrLink=el('div','developer-support__qr'),qr=el('img','');
 qr.src='images/fjord-support-vipps.svg';qr.alt='Vipps QR';qr.width=112;qr.height=112;qrLink.append(qr);supportPay.append(qrLink);
 support.id='developerSupport';support.append(supportLabel,supportTitle,supportQuestion,supportBody,supportPay,supportNote);host.append(support);
 function render(){const language=window.FjordI18n?.language||document.documentElement.lang||'nb',w=copy[language]||copy.nb,o=offers[language]||offers.nb;eyebrow.textContent=w[0];title.replaceChildren(document.createTextNode(w[1]),accent);accent.textContent=w[2];lead.textContent=w[3];services.replaceChildren(...w[4].map(s=>el('li','',s)));cta.textContent=w[5]+' ↗';note.textContent=w[6];concept.textContent=w[7];contacts.setAttribute('aria-label',w[6]);offerToggle.textContent=({nb:'Tjenester og detaljer',en:'Services and details',uk:'Послуги та подробиці',sv:'Tjänster och detaljer',da:'Ydelser og detaljer'}[language]||'Services and details')+' ↗';offerLabel.textContent=o[0];offerTitle.textContent=o[1];offerList.replaceChildren(...o[2].flatMap(([heading,description])=>[el('dt','',heading),el('dd','',description)]));offerNote.textContent=o[3];const t=supportCopy[language]||supportCopy.nb;supportTitle.textContent=t[0];supportQuestion.textContent=t[1];supportBody.textContent=t[2];supportNote.textContent=t[3];}
 window.addEventListener('fjordlanguagechange',render);render();
 // Sparse golden code rain, confined behind the copy in the left glass panel.
 const matrix=el('canvas','developer-card__matrix');matrix.setAttribute('aria-hidden','true');glass.prepend(matrix);
 const context=matrix.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let width=0,height=0,streams=[],frame=0,lastDraw=0,clock=0,previous=0,running=false,protectedAreas=[];
 const glyphs='0101<>/{}[]:+';
 function draw(){
  if(!context||!width||!height)return;
  context.clearRect(0,0,width,height);context.font='600 16px ui-monospace,Consolas,monospace';context.textAlign='center';
  for(const stream of streams){
   const y=(stream.start+clock*stream.speed)%(height+220)-70;
   for(let j=0;j<stream.length;j++){
    const lineY=y-j*23;if(lineY<0||lineY>height)continue;
    // Keep complete glyphs away from real text, links and buttons.
    if(protectedAreas.some(r=>stream.x+12>r.left&&stream.x-12<r.right&&lineY+5>r.top&&lineY-19<r.bottom))continue;
    context.fillStyle=j===0?'rgba(255,224,126,.95)':`rgba(238,191,69,${Math.max(.055,.44-j*.06)})`;
    context.shadowColor='#efbd43';context.shadowBlur=j===0?5:0;
    context.fillText(glyphs[(stream.seed+j*7+Math.floor(clock*.7))%glyphs.length],stream.x,lineY);
   }
  }
  context.shadowBlur=0;
 }
 function resize(){
  if(!context)return;const r=glass.getBoundingClientRect();width=r.width;height=r.height;
  protectedAreas=[];
  for(const child of glass.children){
   if(child===matrix)continue;
   const range=document.createRange();range.selectNodeContents(child);
   const rects=child===cta?[child.getBoundingClientRect()]:Array.from(range.getClientRects());
   for(const box of rects)protectedAreas.push({left:box.left-r.left-9,right:box.right-r.left+9,top:box.top-r.top-7,bottom:box.bottom-r.top+7});
  }
  const ratio=Math.min(window.devicePixelRatio||1,1.5);matrix.width=Math.round(width*ratio);matrix.height=Math.round(height*ratio);context.setTransform(ratio,0,0,ratio,0,0);
  const count=Math.max(3,Math.min(6,Math.floor(width/88)));
  streams=Array.from({length:count},(_,i)=>({x:(i+.55)*width/count,start:Math.random()*(height+180),speed:30+Math.random()*22,length:4+Math.floor(Math.random()*3),seed:Math.floor(Math.random()*glyphs.length)}));draw();
 }
 function animate(time){
  if(!running)return;if(time-lastDraw>=66){if(previous)clock+=Math.min((time-previous)/1000,.12);previous=time;lastDraw=time;draw();}frame=requestAnimationFrame(animate);
 }
 let visible=false;
 const updateMotion=()=>{
  card.dataset.motionPaused=String(!visible||document.hidden);
  const play=!!context&&visible&&!document.hidden&&!reduced.matches;
  if(play&&!running){running=true;previous=0;frame=requestAnimationFrame(animate);}
  else if(!play&&running){running=false;cancelAnimationFrame(frame);}
  matrix.dataset.running=String(play);
 };
 if(context){if('ResizeObserver'in window)new ResizeObserver(resize).observe(glass);else window.addEventListener('resize',resize);resize();}
 reduced.addEventListener('change',updateMotion);
 window.addEventListener('fjordlanguagechange',()=>requestAnimationFrame(resize));
 document.fonts?.ready.then(resize);
 if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);updateMotion();},{threshold:.05}).observe(card);else visible=true;
 document.addEventListener('visibilitychange',updateMotion);updateMotion();
})();
