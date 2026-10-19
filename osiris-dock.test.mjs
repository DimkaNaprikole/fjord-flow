import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,existsSync} from 'node:fs';
test('one animated pet is reused across expanded, compact, auth and closed chat',()=>{
 const pet={},duplicate={remove(){this.removed=true}},portrait={querySelector:()=>duplicate,insertBefore(node){node.parentNode=this}},launch={hidden:false,querySelector:()=>pet,insertBefore(node){node.parentNode=this},setAttribute(key,value){this[key]=value}};pet.parentNode=launch;
 let sync;const classes=new Set(),dialog={open:false,classList:{contains:c=>classes.has(c)},querySelector:()=>portrait};
 const document={readyState:'complete',querySelector:()=>launch,getElementById:()=>dialog};
 vm.runInNewContext(readFileSync(new URL('./osiris-dock.js',import.meta.url),'utf8'),{document,window:{addEventListener(){}},MutationObserver:class{constructor(fn){sync=fn}observe(){}disconnect(){}}});
 assert.equal(duplicate.removed,true);assert.equal(pet.parentNode,launch);
 dialog.open=true;sync();assert.equal(pet.parentNode,portrait);assert.equal(launch.hidden,true);
 classes.add('osiris-compact');sync();assert.equal(pet.parentNode,launch);assert.equal(launch.hidden,false);
 classes.clear();classes.add('fjord-ai-auth-pending');sync();assert.equal(pet.parentNode,launch);
 classes.clear();sync();dialog.open=false;sync();assert.equal(pet.parentNode,launch);assert.equal(launch.hidden,false);
});
test('all registered Osiris motion sources exist and stay inside the public media directory',()=>{
 const registry=JSON.parse(readFileSync(new URL('./osiris/characters.json',import.meta.url),'utf8'));
 for(const character of registry.characters)for(const clip of Object.values(character.states))for(const asset of Object.values(clip)){
  assert.match(asset,/^media\/osiris-motion\/[\w-]+\.(png|webp)$/);assert.ok(existsSync(new URL(asset,import.meta.url)),asset);
 }
});
