import {getVisitorToken} from './afonya-auth.js?v=7';
const OWNER='laurkent123@gmail.com';
const ENDPOINT='https://fjord-flow-chat.laurkent123.workers.dev/account-profile';
const fail=code=>Object.assign(new Error(code),{code});
let sdkPromise;
async function loadSDK(apiKey){
 if(!sdkPromise)sdkPromise=Promise.all([import('https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js')]).then(async([app,sdk])=>{
  const instance=app.getApps().find(a=>a.name==='fjord-flow-postman')||app.initializeApp({apiKey,authDomain:'fjord-flow-afonya.firebaseapp.com',projectId:'fjord-flow-afonya'},'fjord-flow-postman');
  const auth=sdk.getAuth(instance);await sdk.setPersistence(auth,sdk.inMemoryPersistence);return {sdk,auth};
 }).catch(()=>{sdkPromise=null;throw fail('authUnavailable');});
 return sdkPromise;
}
async function verifyOwner(apiKey,overrideToken){
 const token=overrideToken||await getVisitorToken(apiKey);if(!token)throw fail('authExpired');
 const response=await fetch(ENDPOINT,{headers:{Authorization:'Bearer '+token},credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw fail(response.status===401?'authExpired':response.status===403?'ownerOnly':'authUnavailable');
 const value=await response.json();if(value.role!=='owner'||String(value.profile?.email).toLowerCase()!==OWNER||!value.profile?.uid)throw fail('ownerOnly');
 return value.profile;
}
// Factory makes cancellation, account binding and scopes testable without real OAuth.
export function createGmailAuthorizer({load=loadSDK,verify=verifyOwner}={}){
 let generation=0,active=null,busy=false;
 async function disconnect(){generation++;const previous=active;active=null;if(previous)try{await previous.sdk.signOut(previous.auth);}catch{} }
 async function authorize(apiKey,{send=false}={}){
  if(busy)throw fail('authBusy');busy=true;const run=generation;
  try{
   const expected=await verify(apiKey);if(run!==generation)throw fail('stale');
   const context=await load(apiKey);if(run!==generation)throw fail('stale');active=context;
   const {sdk,auth}=context;const provider=new sdk.GoogleAuthProvider();
   provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
   if(send===true)provider.addScope('https://www.googleapis.com/auth/gmail.send');
   provider.setCustomParameters({login_hint:OWNER,prompt:'consent'});
   const result=await sdk.signInWithPopup(auth,provider);if(run!==generation)throw fail('stale');
   if(result.user.emailVerified!==true||result.user.uid!==expected.uid||String(result.user.email).toLowerCase()!==OWNER)throw fail('wrongAccount');
   const profile=await verify(apiKey,await result.user.getIdToken());if(run!==generation)throw fail('stale');
   if(profile.uid!==expected.uid)throw fail('wrongAccount');
   const accessToken=sdk.GoogleAuthProvider.credentialFromResult(result)?.accessToken;
   if(typeof accessToken!=='string'||accessToken.length<20)throw fail('permission');
   // No refresh token or mailbox content is persisted by this isolated auth instance.
   return {accessToken,email:profile.email,uid:profile.uid,expiresAt:Date.now()+50*60*1000};
  }catch(error){
   if(['ownerOnly','wrongAccount','permission','authExpired','stale','authUnavailable'].includes(error.code))throw error;
   const code=String(error?.code||'');throw fail(code.includes('popup-blocked')?'popupBlocked':/popup-closed|cancelled-popup/.test(code)?'cancelled':/unauthorized-domain|operation-not-allowed/.test(code)?'authUnavailable':'permission');
  }finally{
   const context=active;active=null;if(context)try{await context.sdk.signOut(context.auth);}catch{}busy=false;
  }
 }
 return {authorize,disconnect};
}
const authorizer=createGmailAuthorizer();
export const prepareGmailAuthorization=apiKey=>loadSDK(apiKey).then(()=>undefined);
export const authorizeGmail=(apiKey,options)=>authorizer.authorize(apiKey,options);
export const disconnectGmailAuthorization=()=>authorizer.disconnect();
