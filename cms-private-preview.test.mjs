import test from 'node:test';
import assert from 'node:assert/strict';
import {cmsAssetId,createPrivatePreviews,previewDocument,EMPTY_PREVIEW} from './cms-private-preview.mjs';
const endpoint='https://worker.test',src=endpoint+'/cms/assets/'+'a'.repeat(64),origin='https://site.test';
const blob=()=>new Blob(['synthetic photo'],{type:'image/png'});
function fixture(options={}){let calls=[],revoked=[],sequence=0;const urls={createObjectURL:()=>`blob:${origin}/fixture-${++sequence}`,revokeObjectURL:url=>revoked.push(url)};return {calls,revoked,preview:createPrivatePreviews({endpoint,urls,load:async path=>{calls.push(path);return blob();},...options})};}
test('authenticated preview fetches only exact configured CMS paths and caches blobs, never saved public URLs',async()=>{
 const {preview,calls,revoked}=fixture();
 for(const url of ['https://worker.test.evil.test/cms/assets/'+'a'.repeat(64),src+'?token=secret','https://elsewhere.test/image.png']){assert.equal(cmsAssetId(url,endpoint),null);assert.equal(await preview.resolve(url),url);}
 assert.equal(calls.length,0);const url=await preview.resolve(src);assert.match(url,/^blob:/);assert.equal(await preview.resolve(src),url);assert.deepEqual(calls,['/cms/admin/assets/'+'a'.repeat(64)]);
 const document={media:{hero:{src}},catalogue:{places:[{photos:[{src}]}]}};const before=JSON.stringify(document),map=await preview.prepare(document);assert.deepEqual(map,{[src]:url});assert.equal(JSON.stringify(document),before);preview.clear();await Promise.resolve();assert.deepEqual(revoked,[url]);
});
test('a failed owner check has no anonymous URL fallback and logout discards in-flight previews',async()=>{
 const denied=fixture({load:async()=>{throw Error('owner_login_required');}});await assert.rejects(denied.preview.resolve(src),/owner_login_required/);
 let finish;const pending=fixture({load:()=>new Promise(resolve=>finish=resolve)});const result=pending.preview.resolve(src);pending.preview.clear();finish(blob());await assert.rejects(result,/закрыт/);assert.equal(pending.revoked.length,0);
});
test('bounded preview validates image type, byte budget and asset count',async()=>{
 await assert.rejects(fixture({load:async()=>new Blob(['html'],{type:'text/html'})}).preview.resolve(src),/Некорректный/);
 await assert.rejects(fixture({maxBytes:1}).preview.resolve(src),/Лимит памяти/);
 await assert.rejects(fixture({maxAssets:0}).preview.resolve(src),/много фото/);
});
test('iframe render mapping accepts same-origin blobs only and never alters persisted canonical input',()=>{
 const document={media:{hero:{src}},theme:{panel:'#123440'}};const before=JSON.stringify(document);
 const mapped=previewDocument(document,{[src]:`blob:${origin}/safe-id`},origin);assert.equal(mapped.media.hero.src,`blob:${origin}/safe-id`);assert.equal(JSON.stringify(document),before);
 for(const value of ['https://evil.test/image.png','javascript:alert(1)','blob:https://elsewhere.test/id',`blob:${origin}/bad\"css`])assert.equal(previewDocument(document,{[src]:value},origin).media.hero.src,EMPTY_PREVIEW);
 assert.equal(previewDocument(document,undefined,origin).media.hero.src,EMPTY_PREVIEW);
});

test('one global queue bounds mixed library resolves and prepare, and clear cancels queued/late blobs across generations',async()=>{
 const asset=n=>endpoint+'/cms/assets/'+n.toString(16).padStart(64,'0');
 const jobs=[],revoked=[];let active=0,peak=0,created=0;
 const preview=createPrivatePreviews({endpoint,load:path=>new Promise(resolve=>{
  active++;peak=Math.max(peak,active);let done=false;
  jobs.push({path,finish(){if(done)return;done=true;active--;resolve(blob());}});
 }),urls:{createObjectURL:()=>`blob:${origin}/made-${++created}`,revokeObjectURL:url=>revoked.push(url)}});
 const libraryA=preview.resolve(asset(1)),libraryB=preview.resolve(asset(2));
 const prepared=preview.prepare({photos:[1,3,4,5].map(n=>({src:asset(n)}))});
 const libraryC=preview.resolve(asset(6));
 const outcomes=Promise.allSettled([libraryA,libraryB,prepared,libraryC]);
 assert.equal(active,3);assert.equal(jobs.length,3,'prepare and direct calls share slots; duplicate asset1 is cached');
 jobs[0].finish();await libraryA;await new Promise(setImmediate);
 assert.equal(active,3);assert.equal(jobs.length,4);assert.equal(created,1);assert.equal(peak,3);
 preview.clear();
 const cancelled=await outcomes;assert.equal(cancelled[0].status,'fulfilled');
 for(const result of cancelled.slice(1)){assert.equal(result.status,'rejected');assert.match(result.reason.message,/закрыт/);}
 assert.deepEqual(revoked,[`blob:${origin}/made-1`]);assert.equal(jobs.length,4,'queued old jobs never reach load');
 const fresh=preview.resolve(asset(7));const freshOutcome=Promise.allSettled([fresh]);
 assert.equal(jobs.length,4,'clear does not reset occupied transport slots');
 jobs[1].finish();await new Promise(setImmediate);
 assert.equal(jobs.length,5);assert.equal(active,3);assert.equal(peak,3);assert.equal(created,1,'late old loads allocate no blobs');
 preview.clear();assert.equal((await freshOutcome)[0].status,'rejected');
 for(const job of jobs)job.finish();await new Promise(setImmediate);
 assert.equal(active,0);assert.equal(created,1);assert.equal(jobs.length,5);
 const after=preview.resolve(asset(8));assert.equal(active,1);jobs.at(-1).finish();
 assert.equal(await after,`blob:${origin}/made-2`);assert.equal(peak,3);
 preview.clear();assert.equal(revoked.length,2);
});
