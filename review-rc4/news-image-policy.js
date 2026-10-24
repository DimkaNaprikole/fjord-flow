/* Editorial images only: approved feed media first; honest thematic illustration otherwise. */
(() => {
  const failed=new Set(),failedItems=new WeakMap();
  function theme(item){
    const type=String(item.eventType||item.eventKind||'').toLowerCase();
    if(type==='concert')return 'concert';if(type==='market')return 'market';
    if(['cinema','family','theatre'].includes(type))return 'notice';
    const text=Object.values(item.copy||{}).map(value=>Array.isArray(value)?value[0]:'').filter(x=>typeof x==='string').join(' ').toLowerCase();
    if(/(veg|vei|road|дорог|v[aä]g)/u.test(text)&&/(stengt|stengd|closed|closure|перекрит|закрит|roadwork|veiarbeid)/u.test(text))return 'roadworks';
    if(/(?<![\p{L}\p{N}])(?:konsert|concert|jazz|korps|piano|choir)(?![\p{L}\p{N}])|концерт|filharm/u.test(text))return 'concert';
    if(/(?<![\p{L}\p{N}])(?:market|markets|marked|markedet|marknad|messe|messer|fair|fairs|loppis|orremesså|solamessen)(?![\p{L}\p{N}])|ярмар|ринок/u.test(text))return 'market';
    return 'notice';
  }
  const alt={market:{nb:'Illustrasjon av et marked',en:'Market illustration',uk:'Ілюстрація ярмарку',sv:'Illustration av en marknad',da:'Illustration af et marked'},roadworks:{nb:'Illustrasjon av veiarbeid',en:'Roadworks illustration',uk:'Ілюстрація дорожніх робіт',sv:'Illustration av vägarbete',da:'Illustration af vejarbejde'},concert:{nb:'Illustrasjon av en konsert',en:'Concert illustration',uk:'Ілюстрація концерту',sv:'Illustration av en konsert',da:'Illustration af en koncert'},notice:{nb:'Illustrasjon av en lokal kunngjøring',en:'Local announcement illustration',uk:'Ілюстрація місцевого оголошення',sv:'Illustration av ett lokalt meddelande',da:'Illustration af en lokal meddelelse'}};
  const thematicPhotos={"food": {"url": "./images/news/topics/bread-basket.webp", "alt": {"nb": "Bakervarer / Bread", "en": "Bakervarer / Bread", "uk": "Bakervarer / Bread", "sv": "Bakervarer / Bread", "da": "Bakervarer / Bread"}, "credit": "Adnergje", "source": "https://commons.wikimedia.org/wiki/File:Bread_in_basket.jpg", "license": "CC BY-SA 2.5", "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.5", "kind": "thematic", "caption": {"nb": "Illustrasjonsfoto, ikke bilde fra arrangementet.", "en": "Illustrative photograph, not a photograph of the event.", "uk": "Ілюстративне фото, не знімок цієї події.", "sv": "Illustrationsfoto, inte en bild från evenemanget.", "da": "Illustrationsfoto, ikke et billede fra begivenheden."}, "checked": "2026-10-19", "modifications": "Resized and re-encoded as WebP, no content edits."}, "concert": {"url": "./images/news/topics/concert-lights.webp", "alt": {"nb": "Konsertlys / Concert lights", "en": "Konsertlys / Concert lights", "uk": "Konsertlys / Concert lights", "sv": "Konsertlys / Concert lights", "da": "Konsertlys / Concert lights"}, "credit": "veeterzy", "source": "https://commons.wikimedia.org/wiki/File:Recording_a_concert_(Unsplash).jpg", "license": "CC0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en", "kind": "thematic", "caption": {"nb": "Illustrasjonsfoto, ikke bilde fra arrangementet.", "en": "Illustrative photograph, not a photograph of the event.", "uk": "Ілюстративне фото, не знімок цієї події.", "sv": "Illustrationsfoto, inte en bild från evenemanget.", "da": "Illustrationsfoto, ikke et billede fra begivenheden."}, "checked": "2026-10-19", "modifications": "Resized and re-encoded as WebP, no content edits."}};
  // Rejected thematic artwork is disabled. No candidate is cleared by discovery alone.
  function select(item){
    if(typeof item.image?.url==='string'&&/^(https:\/\/|\/|\.\/|images\/)/.test(item.image.url)&&!failed.has(item.image.url)&&!failedItems.get(item)?.has(item.image.url))return item.image;
    const kind=theme(item),title=Object.values(item.copy||{}).map(c=>Array.isArray(c)?c[0]:'').join(' ');
    const fallback=kind==='concert'?thematicPhotos.concert:kind==='market'&&/bondens|farmer|food market|matmarked/iu.test(title)?thematicPhotos.food:null;
    return fallback&&!failed.has(fallback.url)&&!failedItems.get(item)?.has(fallback.url)?fallback:null;
  }
  window.FjordNewsImagePolicy=Object.freeze({select,theme,markFailed:(url,item)=>{if(item&&typeof item==='object'){let urls=failedItems.get(item);if(!urls){urls=new Set();failedItems.set(item,urls);}urls.add(url);}else failed.add(url);}});
})();
