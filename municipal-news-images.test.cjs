const {test}=require('node:test');
const assert=require('node:assert/strict');
const {existsSync}=require('node:fs');
const {join}=require('node:path');
const {localizedImageText,imageRoleLabel}=require('./municipal-news.js');
const data=require('./municipal-news-data.json');

test('every dated announcement has a local image and new images keep reusable attribution',()=>{
 const stories=data.items.filter(x=>x.category!=='places');
 assert.ok(stories.length>=29);
 for(const item of stories){
  const image=item.image;assert.ok(image?.url,item.id);
  assert.ok(existsSync(join(__dirname,image.url)),item.id+' image file');
  assert.ok(image.credit&&image.source,item.id+' credit and source');
  if(item.publishedKind==='editorial'){
   assert.ok(['venue','illustration'].includes(image.kind));
   assert.ok(image.license&&image.licenseUrl);
   assert.equal(new URL(image.source).hostname,'commons.wikimedia.org');
  }
 }
});

test('localized image captions remain readable and illustrations are not called venue photos',()=>{
 const image=data.items.find(x=>x.id==='halloween-jevnaker-2026').image;
 for(const language of ['nb','en','uk','sv','da']){
  assert.equal(typeof localizedImageText(image.alt,language),'string');
  assert.ok(localizedImageText(image.caption,language).length>10);
 }
 assert.equal(imageRoleLabel(image,'uk'),'Ілюстрація');
 assert.equal(imageRoleLabel(data.items.find(x=>x.id==='oslo-petrushka-20261022').image,'uk'),'Фото місця');
 assert.equal(localizedImageText({uk:'Опис',nb:'Beskrivelse'},'uk'),'Опис');
 assert.equal(localizedImageText('Existing caption','en'),'Existing caption');
});
