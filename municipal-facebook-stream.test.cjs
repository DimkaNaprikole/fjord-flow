const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),{readFileSync}=require('node:fs');
const {facebookURL,timelineURL}=require('./municipal-facebook-stream.js');
test('official Page and group URLs are validated separately before constructing a fixed plugin URL',()=>{
 assert.equal(facebookURL('https://www.facebook.com/Lunnerkommune/?x=1'),'https://www.facebook.com/Lunnerkommune');
 assert.equal(facebookURL('https://www.facebook.com/groups/123/','group'),'https://www.facebook.com/groups/123');
 for(const input of ['javascript:alert(1)','http://facebook.com/grankommune','https://facebook.com.evil.test/grankommune','https://user@facebook.com/grankommune','https://facebook.com:444/grankommune','https://facebook.com/plugins/page.php','https://facebook.com/groups/123','https://facebook.com/test/posts/123'])assert.equal(facebookURL(input),null);
 assert.equal(facebookURL('https://facebook.com/groups/123/posts/456','group'),null);
 const url=new URL(timelineURL('https://www.facebook.com/jevnakerkommune',1200));
 assert.equal(url.origin,'https://www.facebook.com');assert.equal(url.pathname,'/plugins/page.php');assert.equal(url.searchParams.get('tabs'),'timeline');assert.equal(url.searchParams.get('width'),'500');
 assert.equal(timelineURL('https://example.com/page'),null);
});
function harness(lang='uk'){
 const requests=[];
 function node(tag){return {tag,children:[],dataset:{},clientWidth:320,attrs:{},append(...children){for(const child of children){this.children.push(child);child.parent=this;}},remove(){this.parent.children.splice(this.parent.children.indexOf(this),1);},setAttribute(k,v){this.attrs[k]=v;},addEventListener(type,handler){this[type]=handler;},querySelector(tag){for(const child of this.children){if(child.tag===tag)return child;const found=child.querySelector(tag);if(found)return found;}return null;},set src(value){requests.push(value);this.source=value;}};}
 const window={},document={documentElement:{lang},createElement:node};
 vm.runInNewContext(readFileSync(__dirname+'/municipal-facebook-stream.js','utf8'),{window,document,URL,URLSearchParams});
 return {window,node,requests};
}
test('mounting and remounting never requests Facebook until the explicit load action',()=>{
 const h=harness(),container=h.node('div'),source={name:'Gran kommune',facebook:'https://www.facebook.com/grankommune',groups:[{name:'Hadeland',url:'https://facebook.com/groups/123/'},{name:'Fake',url:'https://evil.test/groups/123'}]};
 let root=h.window.FjordMunicipalFacebook.mount({container,source});
 assert.equal(root.querySelector('h3').textContent,'Gran kommune');assert.equal(root.querySelector('iframe'),null);assert.deepEqual(h.requests,[]);
 assert.equal(root.querySelector('button').textContent,'Завантажити стрічку Facebook');
 const groups=root.children.find(n=>n.className==='municipal-facebook-stream__groups');assert.equal(groups.children.length,2);
 root.querySelector('button').click();assert.equal(h.requests.length,1);assert.equal(root.querySelector('iframe').title,'Стрічка Facebook · Gran kommune');
 root.querySelector('button').click();assert.equal(h.requests.length,1);
 root=h.window.FjordMunicipalFacebook.mount({container,source:{...source,name:'Jevnaker kommune',facebook:'https://facebook.com/jevnakerkommune'}});
 assert.equal(container.children.length,1);assert.equal(root.querySelector('iframe'),null);assert.equal(h.requests.length,1);
 h.window.FjordMunicipalFacebook.mount({container,source:{name:'No Page',facebook:'https://evil.test/invalid'}});assert.equal(container.children.length,0);
});
