/* Independent travel-photography ideas, not a commercial filming service. */
(() => {
  'use strict';
  const copy = {
    uk: ['ЗБЕРЕЖІТЬ МИТЬ', 'Ваш маршрут. Ваш маленький фільм.', 'Вода, світло, фіорди й тихі зупинки — чудові сюжети для власного відео. Знімайте з оглядових майданчиків і дозволених стежок, залишаючи простір іншим.', 'Правила польотів у Норвегії', 'Для дрона спершу перевірте місцеві обмеження, погоду й потрібні дозволи. Поважайте приватність людей, дику природу та охоронювані території.'],
    en: ['KEEP THE MOMENT', 'Your journey. Your little film.', 'Water, light, fjords and quiet stops make beautiful subjects for your own travel film. Use viewpoints and permitted paths, leaving room for other visitors.', 'Drone rules in Norway', 'Before flying a drone, check local restrictions, weather and required permissions. Respect people’s privacy, wildlife and protected areas.'],
    nb: ['TA VARE PÅ ØYEBLIKKET', 'Din reise. Din lille film.', 'Vann, lys, fjorder og rolige stopp er fine motiver for din egen reisefilm. Film fra utsiktspunkter og tillatte stier, og gi plass til andre besøkende.', 'Droneregler i Norge', 'Før du flyr drone, sjekk lokale begrensninger, været og nødvendige tillatelser. Ta hensyn til personvern, dyreliv og verneområder.'],
    sv: ['BEVARA ÖGONBLICKET', 'Din resa. Din lilla film.', 'Vatten, ljus, fjordar och lugna stopp blir fina motiv för din egen resefilm. Filma från utsiktsplatser och tillåtna stigar och lämna plats för andra besökare.', 'Drönarregler i Norge', 'Kontrollera lokala begränsningar, väder och nödvändiga tillstånd innan du flyger drönare. Respektera människors privatliv, djurliv och skyddade områden.'],
    da: ['GEM ØJEBLIKKET', 'Din rejse. Din lille film.', 'Vand, lys, fjorde og rolige stop er smukke motiver til din egen rejsefilm. Film fra udsigtspunkter og tilladte stier, og giv plads til andre besøgende.', 'Droneregler i Norge', 'Tjek lokale begrænsninger, vejr og nødvendige tilladelser, før du flyver drone. Respekter privatliv, dyreliv og beskyttede områder.']
  };
  let section, language;
  const node = (tag, text, cls) => { const el = document.createElement(tag); if(text) el.textContent=text; if(cls) el.className=cls; return el; };
  function render() {
    const anchor=document.getElementById('staysSauna');
    if(!anchor) return;
    if(!section) { section=node('section', '', 'drone-experience'); section.id='droneExperience'; section.dataset.i18nIgnore=''; }
    if(!section.dataset.cmsSectionManaged&&anchor.nextElementSibling!==section) anchor.after(section);
    const lang=copy[window.FjordI18n?.language] ? window.FjordI18n.language : 'nb';
    if(language===lang) return;
    language=lang;
    const t=copy[lang], visual=node('div', '', 'drone-experience-visual');
    visual.setAttribute('aria-hidden','true'); visual.append(node('span','✧'));
    const body=node('div', '', 'drone-experience-body');
    const link=node('a', t[3]+' ↗', 'button');
    link.href='https://www.luftfartstilsynet.no/en/drones/'; link.target='_blank'; link.rel='noopener noreferrer';
    body.append(node('p',t[0],'eyebrow'), node('h2',t[1]),node('p',t[2]),link,node('p',t[4],'drone-experience-note'));
    section.replaceChildren(visual,body);
  }
  new MutationObserver(render).observe(document.querySelector('main')||document.body,{childList:true,subtree:true});
  window.addEventListener('fjordlanguagechange',render);
  render();
})();
