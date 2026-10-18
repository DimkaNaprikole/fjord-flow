import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDocument,safeMediaURL,emptyDocument} from './site-editor-schema.mjs';
test('published documents accept translated text but never executable fields',()=>{
 const doc=validateDocument({schemaVersion:1,pages:{home:{title:{nb:'Norge',uk:'Норвегія'}}}});
 assert.equal(doc.pages.home.title.uk,'Норвегія');
 for(const value of [{html:'<script>alert(1)</script>'},{selector:'body'},{css:'body{display:none}'}])assert.throws(()=>validateDocument({schemaVersion:1,...value}));
 assert.throws(()=>validateDocument({schemaVersion:1,pages:{home:{title:{ru:'unsupported'}}}}));
});
test('media cannot introduce scripts, CSS escapes or local-network requests',()=>{
 for(const url of ['javascript:alert(1)','data:image/svg+xml,x','https://a.test/a");color:red','https://localhost/a','https://127.0.0.1/a','https://10.1.2.3/a','images/../../private.png','https://user:pass@site.test/a'])assert.equal(safeMediaURL(url),false,url);
 for(const url of ['images/friendship-header-cover.png','./images/hero-bergen.jpg','https://example.org/photo.jpg'])assert.equal(safeMediaURL(url),true,url);
});
test('theme bounds, fixed fonts and home visibility protect the site structure',()=>{
 for(const theme of [{gutter:1},{contentWidth:999999},{font:'evil;font'},{action:'white'},{radius:Infinity}])assert.throws(()=>validateDocument({schemaVersion:1,theme}));
 assert.throws(()=>validateDocument({schemaVersion:1,pages:{home:{enabled:false}}}));
 assert.throws(()=>validateDocument({schemaVersion:1,navOrder:['home','home']}));
 assert.equal(emptyDocument().schemaVersion,1);
});
