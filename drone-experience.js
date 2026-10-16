/* Optional trip-film concept. Enquiries never confirm a flight or a booking. */
(() => {
  'use strict';
  const copy = {
    uk: ['ДОДАТИ ДО ПОДОРОЖІ', 'Ваш маршрут. Ваш маленький фільм.', 'Коротке відео з подорожі: фіорди, зупинки й ваші найкращі миті. Зйомка дроном — ідея додаткової послуги за попереднім погодженням.', 'Обговорити зйомку', 'Маршрут і формат узгоджуємо окремо. Можливість польоту залежить від погоди, правил місцевості й дозволів. Послуга ще готується до запуску; це не бронювання.', 'Хочу обговорити відеозйомку подорожі. Місце / маршрут: '],
    en: ['ADD TO YOUR JOURNEY', 'Your journey. Your little film.', 'A short travel film: fjords, scenic stops and your favourite moments. Drone filming is a proposed optional extra, arranged in advance.', 'Discuss a travel film', 'Route and format are agreed separately. Flights depend on weather, local rules and permissions. This service is being prepared for launch; this is not a booking.', 'I would like to discuss a travel film. Place / route: '],
    nb: ['LEGG TIL REISEN', 'Din reise. Din lille film.', 'En kort reisefilm: fjorder, stopp og dine beste øyeblikk. Dronefilming er en planlagt tilleggstjeneste etter forhåndsavtale.', 'Snakk om en reisefilm', 'Rute og format avtales separat. Flyging avhenger av vær, lokale regler og tillatelser. Tjenesten er under forberedelse; dette er ikke en bestilling.', 'Jeg vil gjerne snakke om en reisefilm. Sted / rute: '],
    sv: ['LÄGG TILL RESAN', 'Din resa. Din lilla film.', 'En kort resefilm: fjordar, stopp och dina bästa ögonblick. Drönarfilmning är en planerad tilläggstjänst efter överenskommelse.', 'Prata om en resefilm', 'Rutt och format avtalas separat. Flygning beror på väder, lokala regler och tillstånd. Tjänsten förbereds för lansering; detta är ingen bokning.', 'Jag vill prata om en resefilm. Plats / rutt: '],
    da: ['FØJ TIL REJSEN', 'Din rejse. Din lille film.', 'En kort rejsefilm: fjorde, stop og dine bedste øjeblikke. Droneoptagelser er en planlagt ekstra service efter forudgående aftale.', 'Tal om en rejsefilm', 'Rute og format aftales separat. Flyvning afhænger af vejr, lokale regler og tilladelser. Servicen forberedes til lancering; dette er ikke en booking.', 'Jeg vil gerne tale om en rejsefilm. Sted / rute: ']
  };
  let section, language;
  const node = (tag, text, cls) => { const el = document.createElement(tag); if(text) el.textContent=text; if(cls) el.className=cls; return el; };
  function render() {
    const anchor=document.getElementById('staysSauna');
    if(!anchor) return;
    if(!section) { section=node('section', '', 'drone-experience'); section.id='droneExperience'; section.dataset.i18nIgnore=''; }
    if(anchor.nextElementSibling!==section) anchor.after(section);
    const lang=copy[window.FjordI18n?.language] ? window.FjordI18n.language : 'nb';
    if(language===lang) return;
    language=lang;
    const t=copy[lang], visual=node('div', '', 'drone-experience-visual');
    visual.setAttribute('aria-hidden','true');
    const mark=node('span','✧'); visual.append(mark);
    const body=node('div', '', 'drone-experience-body');
    const link=node('a', t[3]+' ↗', 'button');
    link.href='mailto:laurkent123@gmail.com?subject='+encodeURIComponent('FJORD / FLOW · Travel film')+'&body='+encodeURIComponent(t[5]);
    body.append(node('p',t[0],'eyebrow'), node('h2',t[1]),node('p',t[2]),link,node('p',t[4],'drone-experience-note'));
    section.replaceChildren(visual,body);
  }
  new MutationObserver(render).observe(document.querySelector('main')||document.body,{childList:true,subtree:true});
  window.addEventListener('fjordlanguagechange',render);
  render();
})();
