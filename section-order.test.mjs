import test from 'node:test';
import assert from 'node:assert/strict';
import {SECTIONS,validateDocument} from './site-editor-schema.mjs';
import {createSectionOrder,completeSectionOrder} from './section-order.mjs';

class Node {
 constructor(id,root){this.id=id;this.root=root;this.children=[];this.dataset={};this.parentNode=null;}
 get isConnected(){return this===this.root.body||!!this.parentNode?.isConnected;}
 get nextSibling(){return this.parentNode?.children[this.parentNode.children.indexOf(this)+1]||null;}
 closest(){return null;}
 remove(){if(this.parentNode){this.parentNode.children.splice(this.parentNode.children.indexOf(this),1);this.parentNode=null;this.root.moves++;}}
 insertAt(node,index){node.remove();this.children.splice(index,0,node);node.parentNode=this;this.root.moves++;}
 before(node){this.parentNode.insertAt(node,this.parentNode.children.indexOf(this));}
 after(node){const p=this.parentNode;node.remove();p.insertAt(node,p.children.indexOf(this)+1);}
 prepend(node){this.insertAt(node,0);}
 append(node){this.insertAt(node,this.children.length);}
}
function fixture(){
 const root={moves:0,selectors:new Map(),createComment(){return new Node('comment',root);},querySelector(s){return this.querySelectorAll(s)[0]||null;},querySelectorAll(s){return this.selectors.get(s)||[];}};
 root.body=new Node('body',root);const main=new Node('journeys',root);root.body.append(main);root.selectors.set('#journeys',[main]);
 const nodes={};for(const section of SECTIONS)for(const [i,selector]of section.selectors.entries()){const node=new Node(section.id+(i?'-'+i:''),root);nodes[node.id]=node;root.selectors.set(selector,[node]);(['advertising','contact','map'].includes(section.id)?root.body:main).append(node);}
 const otherPage=new Node('catalogue-tab',root);otherPage.dataset.siteTab='catalogue';main.append(otherPage);return{root,main,nodes,otherPage};
}
test('section schema is optional, bounded and whitelisted; catalogue stays intact',()=>{
 const old={schemaVersion:1,catalogue:{places:[{id:'cafe',name:'Coffee',category:'cafe',lat:60,lon:10}]}};
 assert.deepEqual(validateDocument(old).sectionOrder,[]);assert.equal(validateDocument({...old,sectionOrder:['map','hero']}).catalogue.places[0].name,'Coffee');
 for(const order of [['hero','hero'],['community'],['#contact'],'hero'])assert.throws(()=>validateDocument({schemaVersion:1,sectionOrder:order}));
 assert.deepEqual(completeSectionOrder(['map']).slice(0,3),['map','hero','about']);
});
test('whole collection, external home sections and dynamic widgets move without cloning; other tabs stay untouched',()=>{
 const {root,main,nodes,otherPage}=fixture(),apply=createSectionOrder(root);const originalParent=new Map(Object.values(nodes).map(node=>[node,node.parentNode]));
 const originalMain=main.children.map(node=>node.id),originalBody=root.body.children.map(node=>node.id);
 assert.equal(apply(['map','collection','cafes','experiences']),true);
 const visible=main.children.filter(node=>node.id!=='comment'&&node!==otherPage);
 assert.deepEqual(visible.slice(0,8).map(node=>node.id),['map','collection','collection-1','collection-2','collection-3','collection-4','collection-5','cafes']);
 assert.equal(nodes.map.parentNode,main);assert.equal(nodes.experiences.dataset.cmsSectionManaged,'true');assert.equal(otherPage.dataset.siteTab,'catalogue');assert.equal(otherPage.parentNode,main);
 root.moves=0;assert.equal(apply(['map','collection','cafes','experiences']),false);assert.equal(root.moves,0,'observer-driven second pass must not mutate child lists');
 assert.equal(apply([]),true);for(const [node,parent]of originalParent){assert.equal(node.parentNode,parent,node.id);assert.equal(node.dataset.cmsSectionManaged,undefined);}
 assert.deepEqual(main.children.filter(node=>node.id!=='comment').map(node=>node.id),originalMain);
 assert.deepEqual(root.body.children.filter(node=>node.id!=='comment').map(node=>node.id),originalBody);
 root.moves=0;assert.equal(apply([]),false);assert.equal(root.moves,0);
});
test('late-mounted section joins the saved order on the next pass and stays stable',()=>{
 const {root,main,nodes}=fixture(),late=nodes.film,selector=SECTIONS.find(s=>s.id==='film').selectors[0];late.remove();root.selectors.set(selector,[]);const apply=createSectionOrder(root);
 apply(['film','map']);main.append(late);root.selectors.set(selector,[late]);apply(['film','map']);assert.equal(main.children.filter(n=>n.id!=='comment')[0],late);
 root.moves=0;apply(['film','map']);assert.equal(root.moves,0);
});
