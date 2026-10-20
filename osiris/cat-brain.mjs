export const CAT_BEHAVIOR_WEIGHTS=Object.freeze({
 waiting:5,'lie-look':4,thinking:3,stretch:2,'peek-left':1.4,'peek-right':1.4,'tail-chase':.8,'greet-pointer':1.2,surprise:.8,celebrate:.45
});

export function chooseCatBehavior({available=[],recent=[],random=Math.random}={}){
 const blocked=new Set(recent.slice(-2)),choices=available.filter(id=>!blocked.has(id)&&CAT_BEHAVIOR_WEIGHTS[id]);
 const pool=choices.length?choices:available.filter(id=>CAT_BEHAVIOR_WEIGHTS[id]);
 if(!pool.length)return null;
 const total=pool.reduce((sum,id)=>sum+CAT_BEHAVIOR_WEIGHTS[id],0);let cursor=Math.max(0,Math.min(.999999,random()))*total;
 for(const id of pool){cursor-=CAT_BEHAVIOR_WEIGHTS[id];if(cursor<0)return id}
 return pool.at(-1);
}

export function planCatInteraction({start,goal}={}){
 const dx=(goal?.x||0)-(start?.x||0),distance=Math.hypot(dx,(goal?.y||0)-(start?.y||0));
 const travel=distance<220?'one-jump':distance<430?'two-jumps':'mist-leap';
 return Object.freeze(['notice-target',dx>=0?'turn-right':'turn-left','crouch',travel,'landing-squish','face-target','paw-tap','recover']);
}

export const PLAY_BEHAVIORS = Object.freeze({
 yarn: Object.freeze({weight: 3, durationMs: 8000, energyCost: 13}),
 mouse: Object.freeze({weight: 2.5, durationMs: 8000, energyCost: 20}),
 feather: Object.freeze({weight: 2, durationMs: 7000, energyCost: 16}),
 tail: Object.freeze({weight: 1, durationMs: 6000, energyCost: 15}),
 paper: Object.freeze({weight: 2, durationMs: 7000, energyCost: 15}),
 'side-hop': Object.freeze({weight: 1.5, durationMs: 6000, energyCost: 20}),
 'lying-toy': Object.freeze({weight: 2, durationMs: 8000, energyCost: 9}),
 cursor: Object.freeze({weight: 1, durationMs: 6000, energyCost: 13}),
});

// IDs and durations correspond to expression-library.json. A host can override
// durations when a newly reviewed clip has different timing.
export const EXPRESSION_BEHAVIORS = Object.freeze({
 yawn: Object.freeze({weight: 1.1, durationMs: 5040, energyCost: 1}),
 blink: Object.freeze({weight: 5, durationMs: 4040, energyCost: 0}),
 'nose-lick': Object.freeze({weight: 2, durationMs: 4040, energyCost: 1}),
 listen: Object.freeze({weight: 2, durationMs: 5040, energyCost: 1}),
 groom: Object.freeze({weight: 1.5, durationMs: 6040, energyCost: 3}),
 pleading: Object.freeze({weight: 0.25, durationMs: 5040, energyCost: 1}),
});

// These IDs become available only after a host supplies reviewed media.
// Prop-based scenes remain manual: they do not claim contact with arbitrary UI.
export const DAILY_BEHAVIORS = Object.freeze({
 sniff: Object.freeze({weight: 2.5, durationMs: 7000, energyCost: 1}),
 stretch: Object.freeze({weight: 1.5, durationMs: 7000, energyCost: 4}),
 knead: Object.freeze({weight: 1.4, durationMs: 5000, energyCost: 3}),
 scratch: Object.freeze({weight: 1, durationMs: 5000, energyCost: 3}),
 shake: Object.freeze({weight: 0.6, durationMs: 5000, energyCost: 5}),
 'body-groom': Object.freeze({weight: 1.6, durationMs: 6000, energyCost: 2}),
 roll: Object.freeze({weight: 0.8, durationMs: 7000, energyCost: 7}),
 rub: Object.freeze({weight: 0.7, durationMs: 5000, energyCost: 2, manualOnly: true}),
 'look-back': Object.freeze({weight: 2, durationMs: 5000, energyCost: 1}),
 'ledge-reach': Object.freeze({weight: 0.4, durationMs: 5000, energyCost: 4, manualOnly: true}),
 // The accepted take briefly opens its mouth and looks tense: owner-command only.
 'arched-back': Object.freeze({weight: 0.7, durationMs: 3000, energyCost: 3, manualOnly: true}),
 'rear-leg-stretch': Object.freeze({weight: 0.9, durationMs: 3000, energyCost: 4}),
 'lie-down': Object.freeze({weight: 0.6, durationMs: 7000, energyCost: 1}),
 'jump-panther-short': Object.freeze({weight: 0.4, durationMs: 5208.333333333333, energyCost: 14, manualOnly: true}),
});
const IDLE_BEHAVIORS = Object.freeze({...EXPRESSION_BEHAVIORS, ...DAILY_BEHAVIORS});
const REQUIRE_SOURCE_REVIEW = new Set(['arched-back', 'rear-leg-stretch', 'lie-down', 'jump-panther-short']);

// Every category needs accepted alpha. New completion clips additionally
// require a reviewed source bound to the same version/hash as their alpha.
export function isReadyLifeClip(clip) {
 if (!clip || typeof clip.id !== 'string') return false;
 if (clip.visualReview !== 'sampled-pass') return false;
 if (!REQUIRE_SOURCE_REVIEW.has(clip.id)) return true;
 const review = clip.sourceReview;
 return Boolean(review?.status === 'sampled-pass' &&
  /^[a-f0-9]{64}$/.test(clip.sourceSha256 || '') &&
  review.sourceSha256 === clip.sourceSha256 &&
  Number.isInteger(clip.sourceVersion) && clip.sourceVersion > 0 &&
  review.version === clip.sourceVersion &&
  clip.verification?.fullDecode === 'passed');
}

// Explicit intentions share a priority: the newest click or command wins.
const REACTION_PRIORITIES = Object.freeze({hover: 30, focus: 40, click: 100, command: 100});
const isAttention = kind => kind === 'hover' || kind === 'focus';
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const unique = values => [...new Set(values)];

/**
 * Pure decision engine; it owns no DOM, timers, pointer, media, or network.
 *
 * createCatBrain({now: () => milliseconds, random: () => [0,1), ...options})
 * - next(time?) returns a decision or null while stopped. A token remains the
 *   same until finish, expiry, or interruption; do not restart it on each tick.
 * - queueReaction({kind, targetId?, actionId?, id?}, time?) queues one response.
 *   Click requires targetId + actionId and must come from an explicit host event.
 *   id may select a known play/expression for a command; otherwise it is listen.
 *   The latest explicit click/command replaces either one, even before next().
 *   Hover/focus wait for active movement to finish; they can interrupt rest,
 *   but never displace an explicit intention.
 * - cancelAttention(targetId, time?) drops only queued hover/focus for that
 *   target, e.g. after pointerleave/blur. It never cancels an active clip/click.
 * - noteUserActivity(time?) interrupts autonomous activity and extends quiet time.
 * - reportPhase(token, 'hit', time?) / hit(token, time?) returns at most one
 *   {type:'activate', targetId, actionId, token}, only for an explicit click.
 *   The host validates the target is still present/enabled before acting.
 * - finish(token, time?) releases a completed clip; stale tokens are ignored.
 * - cancel(time?) discards active and pending work; stop also disables next;
 *   resume permits new decisions. None of them performs a pending activation.
 * - snapshot(time?) exposes state without choosing another action.
 *
 * Decisions: {token, mode:'idle'|'rest'|'play'|'react', id, startedAt, endsAt,
 * durationMs, priority, phase, targetId, actionId, reducedMotion}.
 * Rest is a calm held frame. The renderer chooses a safe landing/settling
 * transition when a token is interrupted. It must discard stale hit events.
 *
 * availablePlay defaults to every catalog ID EXCEPT cursor. Cursor play is
 * opt-in because it needs a visible pointer target supplied by the host; even
 * then it never moves or clicks the actual pointer. For media not yet ready,
 * pass only IDs whose clips the host can play.
 * availableDaily defaults to []. Only supplied ready IDs enter autonomous
 * idle selection. rub and ledge-reach remain manual even if supplied.
 * restDurationRangeMs optionally samples a pause from [min,max] once per
 * completed movement. Without a valid range, restDurationMs stays fixed.
 */
export function createCatBrain(options = {}) {
 const {
  now: clock = () => Date.now(),
  random = Math.random,
  availablePlay = Object.keys(PLAY_BEHAVIORS).filter(id => id !== 'cursor'),
  availableExpressions = Object.keys(EXPRESSION_BEHAVIORS),
  availableDaily = [],
  durations = {},
  playCooldownMs = 30000,
  samePlayCooldownMs = 120000,
  expressionCooldownMs = 12000,
  dailyCooldownMs = 20000,
  sameDailyCooldownMs = 60000,
  initialPlayDelayMs = 20000,
  restDurationMs = 8000,
  restDurationRangeMs = null,
  activityQuietMs = 2500,
  reactionCooldownMs = 1800,
  playChance = 0.55,
  playEnergyMinimum = 35,
  initialEnergy = 75,
  recoverEnergyPerSecond = 2,
  reducedMotion: initialReducedMotion = false,
 } = options;
 const playIds = unique(availablePlay).filter(id => PLAY_BEHAVIORS[id]);
 const expressionIds = unique(availableExpressions).filter(id => EXPRESSION_BEHAVIORS[id]);
 const dailyIds = unique(availableDaily).filter(id => DAILY_BEHAVIORS[id] && !DAILY_BEHAVIORS[id].manualOnly);
 const positive = (value, fallback) => Number.isFinite(value) && value > 0 ? value : fallback;
 const nonnegative = value => Number.isFinite(value) ? Math.max(0, value) : 0;
 const draw = () => clamp(Number(random()) || 0, 0, 0.999999999);
 const fixedRestMs = positive(restDurationMs, 8000);
 const restRange = Array.isArray(restDurationRangeMs) && restDurationRangeMs.length === 2 &&
  restDurationRangeMs.every(value => Number.isFinite(value) && value > 0) &&
  restDurationRangeMs[1] >= restDurationRangeMs[0] ? [...restDurationRangeMs] : null;
 const sampleRestMs = () => restRange ?
  Math.round(restRange[0] + draw() * (restRange[1] - restRange[0])) : fixedRestMs;
 let lastTime = Number(clock());
 if (!Number.isFinite(lastTime)) throw new TypeError('The clock must return finite milliseconds.');
 let energy = clamp(initialEnergy, 0, 100);
 let serial = 0;
 let current = null;
 let pending = null;
 let stopped = false;
 let reducedMotion = Boolean(initialReducedMotion);
 let quietUntil = lastTime;
 let nextPlayAt = lastTime + nonnegative(initialPlayDelayMs);
 let nextDailyAt = lastTime;
 let lastReactionAt = -Infinity;
 const recent = [];
 const lastStarted = new Map();

 function time(value) {
  const requested = value === undefined ? Number(clock()) : Number(value);
  if (!Number.isFinite(requested)) throw new TypeError('Time must be finite milliseconds.');
  // A backward host clock cannot rewind cooldowns, refill actions, or double-hit.
  const at = Math.max(lastTime, requested);
  let restingMs = 0;
  if (current?.decision.mode === 'rest') {
   restingMs = Math.max(0, Math.min(at, current.decision.endsAt) - lastTime);
  } else if (!current || stopped) {
   restingMs = at - lastTime;
  }
  energy = clamp(energy + restingMs * nonnegative(recoverEnergyPerSecond) / 1000, 0, 100);
  lastTime = at;
  return at;
 }

 function remember(id, at) {
  recent.push(id);
  if (recent.length > 8) recent.shift();
  lastStarted.set(id, at);
 }

 function release(at) {
  if (!current) return null;
  const previous = current.decision;
  current = null;
  if (previous.mode !== 'rest') {
   quietUntil = Math.max(quietUntil, at + sampleRestMs());
  }
  if (PLAY_BEHAVIORS[previous.id]) {
   nextPlayAt = Math.max(nextPlayAt, at + nonnegative(playCooldownMs));
  }
  if (DAILY_BEHAVIORS[previous.id]) {
   nextDailyAt = Math.max(nextDailyAt, at + nonnegative(dailyCooldownMs));
  }
  return previous.token;
 }

 function weighted(ids, catalog, at, cooldown) {
  const blocked = new Set(recent.slice(-2));
  const cooldownFor = id => nonnegative(typeof cooldown === 'function' ? cooldown(id) : cooldown);
  const eligible = ids.filter(id =>
   at - (lastStarted.get(id) ?? -Infinity) >= cooldownFor(id)
  );
  let candidates = eligible.filter(id => !blocked.has(id));
  // A small installed library must not deadlock once both clips enter recent.
  // Reuse its oldest clip only after a substantial calm interval.
  if (!candidates.length) {
   candidates = eligible.filter(id => at - (lastStarted.get(id) ?? -Infinity) >=
   Math.max(cooldownFor(id), fixedRestMs * 2))
    .sort((a, b) => (lastStarted.get(a) ?? -Infinity) - (lastStarted.get(b) ?? -Infinity))
    .slice(0, 1);
  }
  const total = candidates.reduce((sum, id) => sum + catalog[id].weight, 0);
  if (!total) return null;
  let cursor = draw() * total;
  for (const id of candidates) {
   cursor -= catalog[id].weight;
   if (cursor < 0) return id;
  }
  return candidates.at(-1);
 }

 function begin(mode, id, at, details = {}) {
  const spec = PLAY_BEHAVIORS[id] || IDLE_BEHAVIORS[id];
  // Reuse the already sampled quiet interval instead of drawing another pause
  // at every tick or accidentally extending it when the host starts rest late.
  const durationMs = mode === 'rest' && restRange ?
   (at < quietUntil ? quietUntil - at : sampleRestMs()) :
   positive(durations[id], spec?.durationMs || fixedRestMs);
  const decision = Object.freeze({
   token: ++serial, mode, id, startedAt: at, endsAt: at + durationMs,
   durationMs, priority: 0, phase: 'start', targetId: null, actionId: null,
   reducedMotion, ...details,
  });
  current = {decision, hitConsumed: false};
  if (mode !== 'rest') {
   energy = clamp(energy - (spec?.energyCost || 0), 0, 100);
   remember(id, at);
  }
  if (PLAY_BEHAVIORS[id]) nextPlayAt = at + durationMs + nonnegative(playCooldownMs);
  if (DAILY_BEHAVIORS[id]) nextDailyAt = at + durationMs + nonnegative(dailyCooldownMs);
  return decision;
 }

 function next(value) {
  const at = time(value);
  if (stopped) return null;
  if (current && at >= current.decision.endsAt) release(current.decision.endsAt);
  if (pending) {
   if (current && isAttention(pending.kind) && current.decision.mode !== 'rest') {
    return current.decision;
   }
   const reaction = pending;
   pending = null;
   if (current) release(at);
   lastReactionAt = at;
   return begin('react', reaction.id, at, reaction);
  }
  if (current) return current.decision;
  if (at < quietUntil || energy < playEnergyMinimum || reducedMotion) {
   return begin('rest', 'rest', at);
  }
  if (at >= nextPlayAt && draw() < clamp(playChance, 0, 1)) {
   const playId = weighted(playIds, PLAY_BEHAVIORS, at, samePlayCooldownMs);
   if (playId) return begin('play', playId, at);
  }
  const idleIds = at >= nextDailyAt ? [...expressionIds, ...dailyIds] : expressionIds;
  const expressionId = weighted(idleIds, IDLE_BEHAVIORS, at,
   id => DAILY_BEHAVIORS[id] ? sameDailyCooldownMs : expressionCooldownMs);
  return expressionId ? begin('idle', expressionId, at) : begin('rest', 'rest', at);
 }

 function queueReaction(request, value) {
  const at = time(value);
  const kind = request?.kind;
  const priority = REACTION_PRIORITIES[kind];
  if (!priority) throw new TypeError('Reaction kind must be hover, focus, click, or command.');
  if (kind === 'click' && (!request.targetId || !request.actionId)) {
   throw new TypeError('An explicit click requires targetId and actionId.');
  }
  if (stopped) return false;
  if (DAILY_BEHAVIORS[request.id]?.manualOnly && kind !== 'command') return false;
  if (current && at >= current.decision.endsAt) release(current.decision.endsAt);
  const existingPriority = Math.max(current?.decision.priority || 0, pending?.priority || 0);
  if (priority < existingPriority) return false;
  const existing = pending || current?.decision;
  if (isAttention(kind) &&
      existing?.kind === kind && existing.targetId === (request.targetId || null)) return false;
  if (isAttention(kind) &&
      at - lastReactionAt < nonnegative(reactionCooldownMs)) return false;
  const requestedId = request.id;
  const id = (PLAY_BEHAVIORS[requestedId] || IDLE_BEHAVIORS[requestedId]) ? requestedId : 'listen';
  pending = Object.freeze({
   kind, id, priority,
   targetId: request.targetId || null,
   actionId: kind === 'click' ? request.actionId : null,
  });
  if (current && (!isAttention(kind) || current.decision.mode === 'rest')) release(at);
  quietUntil = Math.max(quietUntil, at + nonnegative(activityQuietMs));
  return true;
 }

 function cancelAttention(targetId, value) {
  time(value);
  if (!targetId || !pending || !isAttention(pending.kind) || pending.targetId !== targetId) return false;
  pending = null;
  return true;
 }

 function noteUserActivity(value) {
  const at = time(value);
  quietUntil = Math.max(quietUntil, at + nonnegative(activityQuietMs));
  if (current && current.decision.priority === 0 && current.decision.mode !== 'rest') release(at);
 }

 function reportPhase(token, phase, value) {
  const at = time(value);
  if (stopped || !current || current.decision.token !== token || at >= current.decision.endsAt) return null;
  current.decision = Object.freeze({...current.decision, phase});
  if (phase !== 'hit' || current.hitConsumed || current.decision.kind !== 'click') return null;
  current.hitConsumed = true;
  return Object.freeze({
   type: 'activate', token,
   targetId: current.decision.targetId,
   actionId: current.decision.actionId,
  });
 }

 function finish(token, value) {
  const at = time(value);
  if (!current || current.decision.token !== token) return false;
  release(at);
  return true;
 }

 function cancel(value) {
  const at = time(value);
  pending = null;
  const token = release(at);
  quietUntil = Math.max(quietUntil, at + nonnegative(activityQuietMs));
  return token;
 }

 function stop(value) {
  const token = cancel(value);
  stopped = true;
  return token;
 }

 function resume(value) {
  const at = time(value);
  stopped = false;
  quietUntil = Math.max(quietUntil, at + nonnegative(activityQuietMs));
 }

 function setReducedMotion(enabled, value) {
  const at = time(value);
  reducedMotion = Boolean(enabled);
  if (reducedMotion && current?.decision.priority === 0 && current.decision.mode !== 'rest') release(at);
 }

 function snapshot(value) {
  time(value);
  return Object.freeze({
   energy, stopped, reducedMotion, quietUntil, nextPlayAt, nextDailyAt,
   current: current?.decision || null, pending,
   recent: Object.freeze([...recent]),
  });
 }

 return Object.freeze({
  next, queueReaction, cancelAttention, noteUserActivity, reportPhase,
  hit: (token, value) => reportPhase(token, 'hit', value),
  finish, cancel, stop, resume, setReducedMotion, snapshot,
 });
}
