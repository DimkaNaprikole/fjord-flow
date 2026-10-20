// A narrow bridge for explicitly requested, already implemented site actions.
// It never interprets model URLs/selectors and never clicks controls on its own.
export const SECTION_IDS = Object.freeze(['collection','scenicRoutes','staysSauna','cafeNearby','routeExperiences','travelStories','norwayCatalogue','buaEquipment','journeys','norwayWebcams']);

export function approachPoint(target, position, viewport) {
  if (!target?.getBoundingClientRect || !position) return null;
  const rect = target.getBoundingClientRect(), width = Number(position.width), height = Number(position.height);
  if (!(rect.width > 0 && rect.height > 0 && width > 0 && height > 0)) return null;
  const y = Math.max(height / 2 + 8, Math.min(viewport.height - height / 2 - 8, rect.top + rect.height / 2));
  if (rect.bottom < 0 || rect.top > viewport.height || viewport.height < height + 16) return null;
  const options = [rect.left - width / 2 - 12, rect.right + width / 2 + 12]
    .filter(x => x >= width / 2 + 8 && x <= viewport.width - width / 2 - 8)
    .sort((a,b) => Math.abs(a-position.x)-Math.abs(b-position.x));
  return options.length ? {x:options[0],y} : null;
}

export function createSiteActionBridge({
  document = globalThis.document,
  getPresence = () => globalThis.window?.OsirisPresence,
  reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  isAllowed = () => globalThis.window?.OsirisSettings?.isAllowed('siteActions') !== false,
  viewport = () => ({width:globalThis.innerWidth,height:globalThis.innerHeight}),
  setTimer = setTimeout, clearTimer = clearTimeout, timeoutMs = 25000,
} = {}) {
  let pending = null;
  const cancel = (reason='cancelled') => {
    const previous = pending; pending = null;
    if (previous) previous.reason=reason;
    previous?.request.abort(); previous?.movement.abort();
  };
  const usable = target => Boolean(target && target.isConnected !== false && !target.disabled);
  async function perform({kind,id,target,visualTarget=target,commit,isCurrent=()=>true,isTrusted=()=>false,signal}={}) {
    cancel();
    if (!isAllowed()) return {status:'disabled'};
    const allowed = kind==='section' && SECTION_IDS.includes(id)
      || kind==='daytrip' && id==='hadeland'
      || kind==='explorer' && /^explorerTab[0-3]$/.test(id)
      || kind==='place' && typeof id==='string' && /^[\w-]{1,100}$/.test(id) && isTrusted()===true;
    if (!allowed || typeof commit!=='function' || !usable(target)) return {status:'unavailable'};
    const entry={request:new AbortController(),movement:new AbortController(),attempted:false,result:null,contactClosed:false}; pending=entry;
    const onAbort=()=>{entry.request.abort();entry.movement.abort()};
    signal?.addEventListener('abort',onAbort,{once:true});
    if (signal?.aborted) onAbort();
    const current=()=>pending===entry&&!entry.request.signal.aborted&&!document?.hidden&&usable(target)&&isCurrent();
    let timer=null, abortWait=null, interaction=false;
    const refusal=()=>{
      if (!isAllowed()) return 'disabled';
      if (!current()) return entry.reason||'cancelled';
      if (kind==='place' && isTrusted()!==true) return 'unavailable';
      return null;
    };
    // The local handlers are synchronous. Record the attempt before invoking one
    // so duplicate/reentrant contact events cannot activate it a second time.
    const commitOnce=()=>{
      if (entry.attempted) return entry.result?.status==='completed';
      const blocked=refusal();
      if (blocked) return false;
      entry.attempted=true;
      try {entry.result={status:commit()===false?'unavailable':'completed'}}
      catch {entry.result={status:'failed'}}
      return entry.result.status==='completed';
    };
    const onContact=()=>{
      if (entry.contactClosed||entry.movement.signal.aborted||!usable(visualTarget)) return false;
      return commitOnce();
    };
    const animate=async(start,limit)=>{
      const interrupted=new Promise(resolve=>{
        abortWait=()=>resolve(false);entry.request.signal.addEventListener('abort',abortWait,{once:true});
        timer=setTimer(()=>{
          // Contact may already have committed while presence starts its own
          // departure. A delayed promise must not kill that successful exit.
          if (entry.result?.status!=='completed') entry.movement.abort();
          resolve(false);
        },Math.max(0,Math.min(limit,timeoutMs)));
      });
      await Promise.race([
        Promise.resolve().then(()=>current()&&!entry.movement.signal.aborted?start():false).catch(()=>false),
        interrupted,
      ]);
      if (timer!==null) clearTimer(timer);timer=null;
      entry.request.signal.removeEventListener('abort',abortWait);abortWait=null;
    };
    try {
      if (!current()) return {status:entry.reason||'cancelled'};
      const presence=getPresence(), motion=!reducedMotion();
      if (motion && typeof presence?.interactWith==='function' && usable(visualTarget)) {
        interaction=true;
        // Allow a viewport-length native walk (85px/s), buffering and the
        // measured 4.5s paw gesture without speeding up the actual movement.
        await animate(()=>presence.interactWith(visualTarget,{signal:entry.movement.signal,onContact}),25000);
      } else {
        const point=motion&&approachPoint(visualTarget,presence?.snapshot?.()?.position,viewport());
        if (point && typeof presence?.moveTo==='function') {
          await animate(()=>presence.moveTo(point,{signal:entry.movement.signal,reason:'command'}),3000);
        }
      }
      entry.contactClosed=true;
      if (entry.attempted) return entry.result;
      // No contact: stop any late animation before using the ordinary handler.
      // Unreachable/timeout never discards an otherwise valid user command.
      entry.movement.abort();
      const blocked=refusal();
      if (blocked) return {status:blocked};
      commitOnce();
      return entry.result;
    } catch {
      return entry.result||{status:current()?'failed':'cancelled'};
    } finally {
      entry.contactClosed=true;
      if (timer!==null) clearTimer(timer);
      if (abortWait) entry.request.signal.removeEventListener('abort',abortWait);
      signal?.removeEventListener('abort',onAbort);
      // interactWith owns the post-contact depart/play/rest scene. A successful
      // contact ends this bridge's responsibility, not that autonomous scene.
      if (!interaction||entry.result?.status!=='completed') {
        entry.movement.abort();
      }
      if (pending===entry) pending=null;
    }
  }
  return Object.freeze({perform,cancel});
}

if (typeof window!=='undefined' && typeof document!=='undefined') {
  const bridge=createSiteActionBridge();window.OsirisSiteActions=bridge;
  document.addEventListener('visibilitychange',()=>{if(document.hidden)bridge.cancel()});
  window.addEventListener('pagehide',()=>bridge.cancel());
  window.addEventListener('osiris:settings-changed',()=>{
    if(window.OsirisSettings?.isAllowed('siteActions')===false)bridge.cancel('disabled');
  });
}
