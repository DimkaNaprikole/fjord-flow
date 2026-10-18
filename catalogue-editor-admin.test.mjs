import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeCataloguePlace} from './catalogue-editor-admin.mjs';
import {validatePlace,validateDocument,emptyDocument} from './site-editor-schema.mjs';

test('every existing place is editable without losing photo rights or breaking validation',()=>{
 const baseline=JSON.parse(fs.readFileSync(new URL('./norway-catalog.json',import.meta.url),'utf8'));
 for(const original of baseline){
  const editable=normalizeCataloguePlace(original),clean=validatePlace(editable);
  assert.equal(clean.id,original.id);assert.equal(clean.lat,original.latitude);assert.equal(clean.lon,original.longitude);
  assert.equal(clean.photos.length,original.gallery?.length??(original.image?1:0));
  for(const [index,photo]of (original.gallery||[]).entries()){assert.equal(clean.photos[index].src,photo.src);assert.equal(clean.photos[index].source,photo.source||'');assert.equal(clean.photos[index].license,photo.license||'');assert.equal(clean.photos[index].licenseUrl,photo.licenseUrl||'');}
 }
});
test('new place stays a single explicit override, supports five translated hours and photo ordering',()=>{
 const place=normalizeCataloguePlace({id:'custom-test',name:'Test café',category:'cafe',town:'Gran',latitude:60.36,longitude:10.57});
 place.hours={nb:'Ukjent',en:'Unknown',uk:'Невідомо',sv:'Okänt',da:'Ukendt'};place.photos=[{src:'https://example.com/cafe.jpg',alt:'Café',credit:'Owner',source:'https://example.com/'}];
 const doc=emptyDocument();doc.catalogue.places.push(place);const clean=validateDocument(doc);
 assert.equal(clean.catalogue.places.length,1);assert.deepEqual(clean.catalogue.places[0].hours,place.hours);assert.equal(clean.catalogue.places[0].photos[0].src,place.photos[0].src);
});
test('normalization does not mutate baseline records or retain translated object in alt',()=>{
 const original={id:'demo',name:'Demo',category:'rest',latitude:60,longitude:10,photoAlt:{nb:'Norsk tekst'},gallery:[{src:'images/test.jpg',license:'CC BY',credit:'Author'}],description:{nb:'Text'}};
 const before=JSON.stringify(original),copy=normalizeCataloguePlace(original);copy.description.nb='Changed';copy.photos[0].src='images/other.jpg';assert.equal(JSON.stringify(original),before);assert.equal(copy.photos[0].alt,'Norsk tekst');
});
test('published hours and legacy plain descriptions remain editable and keep separate licence',()=>{
 const copy=normalizeCataloguePlace({id:'legacy',name:'Legacy',category:'cafe',latitude:60,longitude:10,description:'Beskrivelse',openingHours:{publishedText:{nb:'10–18',en:'10–18'}},gallery:[{src:'images/cafe.jpg',credit:'Author',license:'CC BY 4.0'}]});
 assert.deepEqual(copy.description,{nb:'Beskrivelse'});assert.deepEqual(copy.hours,{nb:'10–18',en:'10–18'});assert.equal(copy.photos[0].credit,'Author');assert.equal(copy.photos[0].license,'CC BY 4.0');validatePlace(copy);
});
