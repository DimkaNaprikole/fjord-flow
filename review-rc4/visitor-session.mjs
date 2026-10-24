/* Shared visitor credentials. Passwords never belong in browser storage. */
export const VISITOR_SESSION_KEY='fjord-afonya-visitor';
const REMEMBER_KEY='fjord-afonya-remember';
export const REMEMBER_MAX_AGE_MS=30*24*60*60*1000;

const failure=code=>Object.assign(new Error(code),{code});
function tokenSubject(token){try{const payload=String(token).split('.')[1].replace(/-/g,'+').replace(/_/g,'/');const subject=JSON.parse(atob(payload.padEnd(Math.ceil(payload.length/4)*4,'='))).sub;return typeof subject==='string'?subject:''}catch{return ''}}
const identity=record=>{const uid=record?.localId||record?.uid||record?.userId||tokenSubject(record?.idToken);return uid?'uid:'+uid:'email:'+String(record?.email||'').toLowerCase()};
function cleanRecord(value){
  if(!value||typeof value!=='object'||Array.isArray(value)||typeof value.idToken!=='string'||!value.idToken||typeof value.email!=='string'||!value.email.trim())return null;
  const record={idToken:value.idToken,email:value.email.trim()};
  for(const key of ['refreshToken','localId','uid','userId'])if(typeof value[key]==='string'&&value[key])record[key]=value[key];
  if(typeof value.emailVerified==='boolean')record.emailVerified=value.emailVerified;
  for(const key of ['expiresAt','sessionStartedAt','sessionExpiresAt'])if(Number.isFinite(value[key])&&value[key]>0)record[key]=value[key];
  return record;
}

/** The factory permits deterministic storage/clock tests; the exports below share one browser instance. */
export function createVisitorSessionStore({host=globalThis,now=()=>Date.now()}={}){
  let revision=0,lastSignature,active=null,activeStorage=null,rememberFallback=false,forcedSignedOut=false;
  const storage=name=>{try{return host[name]||null}catch{return null}};
  const read=(name,key)=>{try{const target=storage(name);return target?{ok:true,value:target.getItem(key)}:{ok:false,value:null}}catch{return {ok:false,value:null}}};
  const put=(name,key,value,code)=>{
    try{const target=storage(name);if(!target)throw Error();if(value===null)target.removeItem(key);else target.setItem(key,value);if(target.getItem(key)!==value)throw Error()}catch{throw failure(code)}
  };
  const restore=(name,key,snapshot)=>{if(snapshot.ok)try{put(name,key,snapshot.value,'STORAGE_UNAVAILABLE')}catch{}};
  const announce=()=>{const Constructor=host.CustomEvent||globalThis.CustomEvent;const EventConstructor=host.Event||globalThis.Event;let event;
    if(Constructor)event=new Constructor('fjord:auth-changed',{detail:{revision}});else if(EventConstructor)event=new EventConstructor('fjord:auth-changed');
    if(event)host.dispatchEvent?.(event);
  };
  function changed(record,notify=true){active=record;lastSignature=JSON.stringify(record);revision++;if(notify)announce()}
  function getRememberPreference(){const result=read('localStorage',REMEMBER_KEY);if(result.ok)rememberFallback=result.value==='1';return rememberFallback}
  function readVisitorSession({notify=true}={}){
    if(forcedSignedOut)return null;
    const remember=getRememberPreference(),name=remember?'localStorage':'sessionStorage',result=read(name,VISITOR_SESSION_KEY);
    let record=null;
    if(result.ok){try{record=cleanRecord(JSON.parse(result.value||'null'))}catch{}}
    else if(active&&activeStorage===name)record=cleanRecord(active);
    const time=now(),hasWindow=record?.sessionStartedAt&&record?.sessionExpiresAt;
    // A persisted token without an explicit, bounded lifetime is never restored.
    const invalid=record&&((remember&&!hasWindow)||(!!record.sessionStartedAt!==!!record.sessionExpiresAt)||(hasWindow&&(record.sessionStartedAt>time||record.sessionExpiresAt>record.sessionStartedAt+REMEMBER_MAX_AGE_MS||record.sessionExpiresAt<=time)));
    if(invalid||result.ok&&result.value&&!record){
      record=null;
      try{put(name,VISITOR_SESSION_KEY,null,'STORAGE_UNAVAILABLE')}catch{}
      if(remember)try{put('sessionStorage',VISITOR_SESSION_KEY,null,'STORAGE_UNAVAILABLE')}catch{}
    }
    activeStorage=name;const signature=JSON.stringify(record);
    if(lastSignature!==undefined&&signature!==lastSignature)changed(record,notify);
    else{active=record;lastSignature=signature}
    return record?{...record}:null;
  }
  function getSessionRevision(){readVisitorSession();return revision}
  function writeVisitorSession(value,{remember,newSignIn=false,expectedRevision,notify=true}={}){
    const previous=readVisitorSession();
    remember=remember===undefined?(previous?activeStorage==='localStorage':getRememberPreference()):!!remember;
    if(expectedRevision!==undefined&&expectedRevision!==revision)throw failure('STALE_SESSION');
    const record=cleanRecord(value);if(!record)throw failure('SESSION_RECORD_INVALID');
    if(!newSignIn&&previous&&identity(previous)!==identity(record))throw failure('STALE_SESSION');
    if(!newSignIn&&!previous&&record.sessionExpiresAt&&record.sessionExpiresAt<=now())throw failure('STALE_SESSION');
    const started=!newSignIn&&previous?.sessionStartedAt||now();
    record.sessionStartedAt=started;
    record.sessionExpiresAt=!newSignIn&&previous?.sessionExpiresAt||started+REMEMBER_MAX_AGE_MS;
    const sessionBefore=read('sessionStorage',VISITOR_SESSION_KEY),localBefore=read('localStorage',VISITOR_SESSION_KEY),preferenceBefore=read('localStorage',REMEMBER_KEY);
    const serialized=JSON.stringify(record);
    try{
      if(remember){
        if(!localBefore.ok||!preferenceBefore.ok)throw failure('PERSISTENCE_UNAVAILABLE');
        put('localStorage',VISITOR_SESSION_KEY,serialized,'PERSISTENCE_UNAVAILABLE');
        put('localStorage',REMEMBER_KEY,'1','PERSISTENCE_UNAVAILABLE');
        // localStorage is authoritative while remembered, including in other tabs.
        if(sessionBefore.ok)put('sessionStorage',VISITOR_SESSION_KEY,null,'SESSION_STORAGE_UNAVAILABLE');
      }else{
        if(!sessionBefore.ok)throw failure('SESSION_STORAGE_UNAVAILABLE');
        put('sessionStorage',VISITOR_SESSION_KEY,serialized,'SESSION_STORAGE_UNAVAILABLE');
        if(localBefore.ok&&localBefore.value!==null)put('localStorage',VISITOR_SESSION_KEY,null,'PERSISTENCE_UNAVAILABLE');
        if(preferenceBefore.ok&&preferenceBefore.value!==null)put('localStorage',REMEMBER_KEY,null,'PERSISTENCE_UNAVAILABLE');
      }
    }catch(error){restore('sessionStorage',VISITOR_SESSION_KEY,sessionBefore);restore('localStorage',VISITOR_SESSION_KEY,localBefore);restore('localStorage',REMEMBER_KEY,preferenceBefore);throw error}
    rememberFallback=!!remember;activeStorage=remember?'localStorage':'sessionStorage';forcedSignedOut=false;changed(record,notify);return {...record};
  }
  function setRememberPreference(remember){
    remember=!!remember;const current=readVisitorSession();
    if(current)return writeVisitorSession(current,{remember});
    const before=read('localStorage',REMEMBER_KEY);
    if(remember||before.ok&&before.value!==null)put('localStorage',REMEMBER_KEY,remember?'1':null,'PERSISTENCE_UNAVAILABLE');
    rememberFallback=remember;changed(null);return null;
  }
  function clearVisitorSession(){
    const wasRemembered=getRememberPreference(),hadActiveSession=active&&activeStorage==='sessionStorage';let error;
    for(const [name,key] of [['sessionStorage',VISITOR_SESSION_KEY],['localStorage',VISITOR_SESSION_KEY],['localStorage',REMEMBER_KEY]]){
      const before=read(name,key);if(before.ok&&before.value!==null)try{put(name,key,null,name==='localStorage'?'PERSISTENCE_UNAVAILABLE':'SESSION_STORAGE_UNAVAILABLE')}catch(caught){error||=caught}
      else if(!before.ok&&name==='localStorage'&&wasRemembered)error||=failure('PERSISTENCE_UNAVAILABLE');
      else if(!before.ok&&name==='sessionStorage'&&hadActiveSession)error||=failure('SESSION_STORAGE_UNAVAILABLE');
    }
    forcedSignedOut=true;rememberFallback=false;changed(null);if(error)throw error;
  }
  const onStorage=event=>{
    if(event.key!==null&&event.key!==VISITOR_SESSION_KEY&&event.key!==REMEMBER_KEY)return;
    // Same-tab iframes share sessionStorage: accept their refresh/logout without deleting the shared record.
    if(event.storageArea===storage('sessionStorage')){forcedSignedOut=false;readVisitorSession();return;}
    // A different tab's persistent account/logout always wins over an old tab copy.
    try{put('sessionStorage',VISITOR_SESSION_KEY,null,'SESSION_STORAGE_UNAVAILABLE')}catch{}
    forcedSignedOut=false;lastSignature=undefined;const record=readVisitorSession({notify:false});changed(record);
  };
  host.addEventListener?.('storage',onStorage);
  return {readVisitorSession,writeVisitorSession,clearVisitorSession,getRememberPreference,setRememberPreference,getSessionRevision,destroy(){host.removeEventListener?.('storage',onStorage)}};
}

const shared=createVisitorSessionStore({host:globalThis.window||globalThis});
export const readVisitorSession=(...args)=>shared.readVisitorSession(...args);
export const writeVisitorSession=(...args)=>shared.writeVisitorSession(...args);
export const clearVisitorSession=(...args)=>shared.clearVisitorSession(...args);
export const getRememberPreference=(...args)=>shared.getRememberPreference(...args);
export const setRememberPreference=(...args)=>shared.setRememberPreference(...args);
export const getSessionRevision=(...args)=>shared.getSessionRevision(...args);
