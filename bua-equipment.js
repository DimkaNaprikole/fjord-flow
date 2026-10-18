/* Local official-source BUA directory. No paid API, photographs or automatic GPS. */
(() => {
  'use strict';
  const valid = p => p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && Math.abs(p.latitude) <= 90 && Math.abs(p.longitude) <= 180;
  const norm = s => String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/ø/g, 'o').replace(/æ/g, 'ae');
  function distance(a, b) {
    if (!valid(a) || !valid(b)) return null;
    const rad = n => n * Math.PI / 180, dlat = rad(b.latitude-a.latitude), dlon = rad(b.longitude-a.longitude);
    const h = Math.sin(dlat/2)**2 + Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dlon/2)**2;
    return 12742.0176 * Math.asin(Math.sqrt(Math.min(1, h)));
  }
  function directions(row, origin) {
    const u = new URL('https://www.google.com/maps/dir/');
    u.searchParams.set('api','1'); u.searchParams.set('travelmode','driving');
    u.searchParams.set('destination',valid(row) ? `${row.latitude},${row.longitude}` : [row.name,row.address,row.town,'Norway'].filter(Boolean).join(', '));
    if(valid(origin)) u.searchParams.set('origin',`${origin.latitude},${origin.longitude}`);
    return u.href;
  }
  const filter = (rows, query, municipality) => rows.filter(r => (!municipality || r.municipality === municipality) && norm([r.name,r.municipality,r.county,r.town,r.address].join(' ')).includes(norm(query)));
  const weeklyHours = row => (row.openingHours || []).filter(h=>h.isActive===true && !h.date && Number.isInteger(h.dayOfWeek) && h.dayOfWeek>=0 && h.dayOfWeek<7 && /^\d\d:\d\d/.test(h.openingTime || '') && /^\d\d:\d\d/.test(h.closingTime || ''));
  if(typeof window === 'undefined') {if(typeof module !== 'undefined') module.exports={norm,distance,directions,filter,weeklyHours}; return;}
  const texts = {
    nb: ['BUA · utstyr på veien','Lån utstyr nær reisen din','Finn BUA-utlån i norske kommuner. Sjekk hva som finnes og om du kan låne før du drar.','Søk etter sted, kommune eller adresse','Alle kommuner','Finn nærmeste BUA','Henter posisjon…','Posisjonen kunne ikke hentes. Søk etter kommune i stedet.','utlånssteder','Ingen treff. Prøv en annen kommune.','Åpningstider og informasjon','Offisiell side','Kjørerute','Vanligvis gratis','Sist kontrollert','Åpningstider er ikke publisert. Sjekk den offisielle siden.','Mandag|Tirsdag|Onsdag|Torsdag|Fredag|Lørdag|Søndag','Tidene kan endres, særlig i ferier. Ingen sanntidsstatus eller reservasjon.','Forrige','Neste','Side','Avstand i luftlinje fra posisjonen din. GPS brukes bare etter ditt klikk i denne økten.','Utstyrslån er vanligvis gratis. Lokale regler og eventuelle gebyrer for personer utenfor kommunen varierer; turister må avklare lånerett. Ansvarlig låntaker må normalt være minst 18 år og ha norsk adresse og telefonnummer. Utstyret er ikke til kommersiell turistvirksomhet. Sjekk tilgjengelighet og lever tilbake på samme utlånssted.','Slik låner du','Lånevilkår','Laster BUA-katalogen…','Kunne ikke laste BUA-katalogen.','Prøv igjen','Vis alle uten avstand','kommune','Timer i lokal norsk tid'],
    en: ['BUA · equipment along the way','Borrow equipment near your trip','Find BUA lending locations across Norwegian municipalities. Check available gear and your eligibility before travelling.','Search place, municipality or address','All municipalities','Find the nearest BUA','Getting your location…','Location could not be obtained. Search for a municipality instead.','lending locations','No matches. Try another municipality.','Hours and information','Official website','Driving directions','Usually free','Last checked','Hours are not published. Check the official website.','Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday','Hours may change, especially during holidays. Not a live status or a reservation.','Previous','Next','Page','Straight-line distance from your position. GPS is used only after your click, during this session.','Borrowing is usually free. Local rules and possible nonresident fees vary; tourists must confirm eligibility. The responsible borrower normally needs to be 18 or older, with a Norwegian address and phone number. Equipment is not for commercial tourism. Check availability and return it to the same lending location.','How to borrow','Borrowing terms','Loading the BUA directory…','Could not load the BUA directory.','Try again','Show all without distance','municipality','Hours in local Norwegian time'],
    uk: ['BUA · спорядження в дорозі','Позичте спорядження поблизу маршруту','Пункти BUA у комунах Норвегії. Перед поїздкою уточніть наявність спорядження та можливість позичити його.','Пошук місця, комуни чи адреси','Усі комуни','Знайти найближчий BUA','Визначаємо місцезнаходження…','Не вдалося визначити місце. Скористайтеся пошуком комуни.','пунктів прокату','Нічого не знайдено. Спробуйте іншу комуну.','Години та інформація','Офіційний сайт','Маршрут автомобілем','Зазвичай безкоштовно','Перевірено','Години не опубліковані. Перевірте офіційний сайт.','Понеділок|Вівторок|Середа|Четвер|П’ятниця|Субота|Неділя','Години можуть змінюватися, особливо у свята. Це не поточний статус і не бронювання.','Назад','Далі','Сторінка','Відстань по прямій від вас. GPS використовується лише після натискання та в цьому сеансі.','Прокат зазвичай безкоштовний. Місцеві правила й можливі збори для нерезидентів різняться; туристам треба уточнити право на прокат. Відповідальний позичальник зазвичай має бути від 18 років, мати норвезьку адресу й номер телефону. Спорядження не для комерційного туризму. Уточніть наявність і поверніть речі в той самий пункт.','Як позичити','Умови прокату','Завантаження каталогу BUA…','Не вдалося завантажити каталог BUA.','Спробувати ще','Усі пункти без відстані','комуна','Час місцевий, норвезький'],
    sv: ['BUA · utrustning längs vägen','Låna utrustning nära resan','Hitta BUA-utlåning i norska kommuner. Kontrollera utrustning och lånerätt före besöket.','Sök plats, kommun eller adress','Alla kommuner','Hitta närmaste BUA','Hämtar din plats…','Platsen kunde inte hämtas. Sök efter kommun i stället.','utlåningsställen','Inga träffar. Prova en annan kommun.','Öppettider och information','Officiell webbplats','Vägbeskrivning med bil','Vanligen gratis','Senast kontrollerat','Öppettider saknas. Kontrollera den officiella sidan.','Måndag|Tisdag|Onsdag|Torsdag|Fredag|Lördag|Söndag','Tider kan ändras, särskilt under helger. Ingen realtidsstatus eller bokning.','Föregående','Nästa','Sida','Avstånd fågelvägen från dig. GPS används bara efter ditt klick under denna session.','Lån är vanligen gratis. Lokala regler och eventuella avgifter för personer utanför kommunen varierar; turister måste kontrollera lånerätten. Ansvarig låntagare behöver normalt vara minst 18 år och ha norsk adress och telefonnummer. Utrustningen är inte för kommersiell turism. Kontrollera tillgänglighet och återlämna på samma ställe.','Så lånar du','Lånevillkor','Laddar BUA-katalogen…','Kunde inte ladda BUA-katalogen.','Försök igen','Visa alla utan avstånd','kommun','Tider i lokal norsk tid'],
    da: ['BUA · udstyr undervejs','Lån udstyr tæt på din rejse','Find BUA-udlån i norske kommuner. Kontrollér udstyr og din låneret før besøget.','Søg sted, kommune eller adresse','Alle kommuner','Find nærmeste BUA','Henter din placering…','Placeringen kunne ikke hentes. Søg efter kommune i stedet.','udlånssteder','Ingen resultater. Prøv en anden kommune.','Åbningstider og information','Officiel hjemmeside','Kørselsvejledning','Normalt gratis','Sidst kontrolleret','Åbningstider er ikke offentliggjort. Se den officielle side.','Mandag|Tirsdag|Onsdag|Torsdag|Fredag|Lørdag|Søndag','Tider kan ændres, især på helligdage. Ingen realtidsstatus eller reservation.','Forrige','Næste','Side','Afstand i luftlinje fra dig. GPS bruges kun efter dit klik i denne session.','Lån er normalt gratis. Lokale regler og eventuelle gebyrer for personer uden for kommunen varierer; turister skal afklare låneretten. Ansvarlig låner skal normalt være mindst 18 år med norsk adresse og telefonnummer. Udstyret er ikke til kommerciel turisme. Kontrollér tilgængelighed og aflever på samme udlånssted.','Sådan låner du','Lånevilkår','Indlæser BUA-kataloget…','Kunne ikke indlæse BUA-kataloget.','Prøv igen','Vis alle uden afstand','kommune','Tider i lokal norsk tid']
  };
  let request, rows=[], page=0, query='', municipality='', origin=null, selected='', section, list, status, pager, geoStatus, geoButton, busy=false;
  const lang=()=>texts[window.FjordI18n?.language || document.documentElement.lang] ? (window.FjordI18n?.language || document.documentElement.lang) : 'nb';
  const t=n=>texts[lang()][n];
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
  const button=(text,fn)=>{const n=el('button','',text);n.type='button';n.onclick=fn;return n;};
  const link=(text,url)=>{const a=el('a','',text);try{const u=new URL(url);if(u.protocol==='https:'){a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';}}catch{}return a;};
  function load() {
    if(!request) request=fetch('./bua-locations.json?v=20261018').then(r=>{if(!r.ok)throw Error('BUA directory unavailable');return r.json();}).then(data=>{const source=Array.isArray(data)?data:data.locations||data.records;if(!Array.isArray(source))throw Error('Invalid BUA directory');return source.filter(r=>r && r.id && r.name);}).catch(e=>{request=null;throw e;});
    return request;
  }
  window.FjordBuaDirectory=Object.freeze({load});
  function hours(row) {
    const wrap=el('div','bua-hours'), active=weeklyHours(row);
    wrap.append(el('p','bua-hours-note',t(30)));
    if(!active.length)wrap.append(el('p','',t(15)));
    else {const dl=el('dl');for(let day=0;day<7;day++){const times=active.filter(h=>h.dayOfWeek===day);if(!times.length)continue;dl.append(el('dt','',t(16).split('|')[day]),el('dd','',times.map(h=>`${String(h.openingTime).slice(0,5)}–${String(h.closingTime).slice(0,5)}${h.date ? ` (${String(h.date).slice(0,10)})` : ''}`).join(', ')));}wrap.append(dl);}
    wrap.append(el('p','bua-hours-note',t(17)),el('p','bua-hours-note',`${t(14)}: ${row.checked || '2026-10-18'}`));return wrap;
  }
  function renderRows() {
    if(!list)return;
    let matches=filter(rows,query,municipality).map(r=>({...r,distance:distance(origin,r)}));
    matches.sort((a,b)=>origin ? (a.distance??Infinity)-(b.distance??Infinity) || a.name.localeCompare(b.name,'nb') : a.municipality?.localeCompare(b.municipality || '','nb') || a.name.localeCompare(b.name,'nb'));
    page=Math.min(page,Math.max(0,Math.ceil(matches.length/8)-1)); list.replaceChildren();
    status.textContent=`${matches.length} ${t(8)}`;
    if(!matches.length)list.append(el('p','bua-empty',t(9)));
    matches.slice(page*8,page*8+8).forEach(row=>{
      const item=el('article','bua-row');item.dataset.buaId=String(row.id);if(String(row.id)===selected)item.classList.add('is-selected');
      const heading=el('div','bua-row-heading'),copy=el('div');copy.append(el('p','bua-municipality',[row.municipality,row.county].filter(Boolean).join(' · ')),el('h3','',row.name));heading.append(copy,el('span','bua-price',t(13)));
      item.append(heading,el('p','bua-address',[row.address,row.town && !norm(row.address).includes(norm(row.town)) ? row.town : ''].filter(Boolean).join(' · ')));
      if(row.distance!==null)item.append(el('p','bua-distance',`${new Intl.NumberFormat(lang(),{maximumFractionDigits:1}).format(row.distance)} km · ${t(21).split('.')[0]}`));
      const details=el('details','bua-details');details.open=String(row.id)===selected;details.append(el('summary','',t(10)),hours(row));
      const actions=el('div','bua-actions');actions.append(link(t(11),row.website || row.source),link(t(12),directions(row,origin)));details.append(actions);item.append(details);list.append(item);
    });
    pager.replaceChildren();if(matches.length>8){const previous=button(t(18),()=>{page--;renderRows();status.scrollIntoView({block:'nearest'});}),next=button(t(19),()=>{page++;renderRows();status.scrollIntoView({block:'nearest'});});previous.disabled=page===0;next.disabled=(page+1)*8>=matches.length;pager.append(previous,el('span','',`${t(20)} ${page+1} / ${Math.ceil(matches.length/8)}`),next);}
  }
  async function locate(){if(busy)return;busy=true;geoButton.disabled=true;geoStatus.textContent=t(6);try{const result=await window.FjordBrowserGeolocation?.locate({userInitiated:true}).promise;if(!result?.coords)throw Error();origin={latitude:result.coords.latitude,longitude:result.coords.longitude};page=0;build();}catch{geoStatus.textContent=t(7);}finally{busy=false;geoButton.disabled=false;}}
  function build(){
    if(!section)return;
    const title=el('h2','',t(1));title.id='buaEquipmentTitle';
    const controls=el('div','bua-controls'), searchLabel=el('label','',t(3)),search=el('input');search.type='search';search.maxLength=120;search.value=query;search.placeholder='Gran, Oslo, Bergen…';search.oninput=()=>{query=search.value;page=0;selected='';renderRows();};searchLabel.append(search);
    const municipalityLabel=el('label','',t(29)),select=el('select'),all=el('option','',t(4));all.value='';select.append(all);[...new Set(rows.map(r=>r.municipality).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'nb')).forEach(name=>{const option=el('option','',name);option.value=name;select.append(option);});select.value=municipality;select.onchange=()=>{municipality=select.value;page=0;selected='';renderRows();};municipalityLabel.append(select);
    geoButton=button(t(5),locate);controls.append(searchLabel,municipalityLabel,geoButton);geoStatus=el('p','bua-geo-note',origin?t(21):'');geoStatus.setAttribute('role','status');
    if(origin){const reset=button(t(28),()=>{origin=null;page=0;build();});controls.append(reset);}
    status=el('p','bua-count');status.setAttribute('role','status');status.setAttribute('aria-live','polite');list=el('div','bua-list');pager=el('nav','bua-pagination');pager.setAttribute('aria-label',t(20));
    const terms=el('details','bua-terms');terms.append(el('summary','',t(24)),el('p','',t(22)));const sources=el('div','bua-actions');sources.append(link(t(23),'https://www.bua.no/hvordan-lane'),link(t(24),'https://www.bua.no/laanevilkaar'));terms.append(sources);
    section.replaceChildren(el('p','bua-eyebrow',t(0)),title,el('p','bua-intro',t(2)),controls,geoStatus,status,list,pager,terms);renderRows();window.dispatchEvent(new Event("fjord:sections-changed"));
  }
  async function start(){section=document.getElementById('buaEquipment');if(!section){const anchor=document.getElementById('norwayCatalogue');if(!anchor)return;section=el('section','bua-equipment');section.id='buaEquipment';section.dataset.i18nIgnore='';section.setAttribute('aria-labelledby','buaEquipmentTitle');anchor.after(section);}section.append(el('p','',t(25)));try{rows=await load();build();}catch{section.replaceChildren(el('p','',t(26)),button(t(27),start));}}
  window.addEventListener('fjordlanguagechange',build);
  window.addEventListener('fjord:bua-select',async event=>{const id=String(event.detail?.id||'');if(!id)return;try{rows=await load();const row=rows.find(r=>String(r.id)===id);if(!row)return;query='';municipality=row.municipality||'';selected=id;page=0;const matches=filter(rows,query,municipality).sort((a,b)=>origin ? (distance(origin,a)??Infinity)-(distance(origin,b)??Infinity) || a.name.localeCompare(b.name,'nb') : a.name.localeCompare(b.name,'nb'));page=Math.floor(matches.findIndex(r=>String(r.id)===id)/8);build();section?.scrollIntoView({behavior:'smooth',block:'start'});}catch{}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
