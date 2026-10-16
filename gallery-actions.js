/* Gallery shortcuts share the existing booking and route controls. */
(()=>{'use strict';
const thumbs=document.getElementById('galleryThumbs'),dialog=document.getElementById('galleryDialog');
const row=document.createElement('div');row.className='gallery-action-row';thumbs.before(row);row.append(thumbs);
const panel=document.createElement('div');panel.className='gallery-quick-actions';panel.dataset.i18nIgnore='';
const price=document.createElement('strong'),note=document.createElement('small'),book=document.createElement('button'),details=document.createElement('button');
book.type=details.type='button';panel.append(price,note,book,details);row.append(panel);
const labels={uk:['Бронювання','Докладніше ↓','Демонстраційна ціна · без оплати'],en:['Booking','Details ↓','Demo price · no payment'],nb:['Bestilling','Les mer ↓','Demopris · ingen betaling'],sv:['Bokning','Läs mer ↓','Demopris · ingen betalning'],da:['Booking','Læs mere ↓','Demopris · ingen betaling']};
function render(){if(typeof galleryPlace==='undefined'||!galleryPlace)return;const w=labels[window.FjordI18n?.language||document.documentElement.lang]||labels.en;const available=galleryPlace.price!=null;price.textContent=available?money(galleryPlace.price):'';price.hidden=note.hidden=book.hidden=!available;note.textContent=w[2];book.textContent=w[0];details.textContent=w[1];}
book.onclick=()=>document.getElementById('galleryBook').click();
details.onclick=()=>{const target=dialog.querySelector('#destinationDetails')||dialog.querySelector('.route-planner');target.tabIndex=-1;target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});target.focus({preventScroll:true});};
new MutationObserver(render).observe(dialog,{attributes:true,attributeFilter:['open']});window.addEventListener('fjordlanguagechange',render);
})();
