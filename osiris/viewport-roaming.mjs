/** Pure viewport geometry. Coordinates always describe the visible cat's center. */
const EPSILON = 1e-7;
const CORNER_GAP = 0.01;
const MAX_OBSTACLES = 2048;
const MAX_GRAPH_OBSTACLES = 48;
const MAX_WAYPOINTS = 256;
const MAX_COORDINATE = 1_000_000;

const finite = value => Number.isFinite(value) && Math.abs(value) <= MAX_COORDINATE;
const point = value => value && finite(value.x) && finite(value.y);
const dimensions = value => value && finite(value.width) && finite(value.height)
  && value.width > 0 && value.height > 0;
const copy = value => ({ x: value.x, y: value.y });
const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
const inside = (p, rect) => p.x >= rect.left - EPSILON && p.x <= rect.right + EPSILON
  && p.y >= rect.top - EPSILON && p.y <= rect.bottom + EPSILON;

function centerBounds(footprint, viewport, pad) {
  return {
    left: footprint.width / 2 + pad,
    top: footprint.height / 2 + pad,
    right: viewport.width - footprint.width / 2 - pad,
    bottom: viewport.height - footprint.height / 2 - pad,
  };
}

/**
 * Clamp a visible footprint center to the viewport. Oversized axes are centered;
 * they still cannot produce a safe planRoute. Invalid inputs return null.
 */
export function clampCenter(position, footprint, viewport, pad = 8) {
  if (!point(position) || !dimensions(footprint) || !dimensions(viewport)
    || !finite(pad) || pad < 0) return null;
  const bounds = centerBounds(footprint, viewport, pad);
  return {
    x: bounds.left > bounds.right ? viewport.width / 2
      : Math.max(bounds.left, Math.min(bounds.right, position.x)),
    y: bounds.top > bounds.bottom ? viewport.height / 2
      : Math.max(bounds.top, Math.min(bounds.bottom, position.y)),
  };
}

function obstacleRect(value) {
  if (!value || typeof value !== 'object') return null;
  const left = value.left ?? value.x;
  const top = value.top ?? value.y;
  const right = value.right ?? (left + value.width);
  const bottom = value.bottom ?? (top + value.height);
  if (![left, top, right, bottom].every(finite) || right < left || bottom < top) return null;
  return { left, top, right, bottom };
}

// Closed rectangle intersection: even a grazing route must keep the promised gap.
function intersectsSegment(a, b, rect) {
  let enter = 0;
  let exit = 1;
  for (const [axis, low, high] of [['x', 'left', 'right'], ['y', 'top', 'bottom']]) {
    const delta = b[axis] - a[axis];
    if (Math.abs(delta) <= EPSILON) {
      if (a[axis] < rect[low] - EPSILON || a[axis] > rect[high] + EPSILON) return false;
      continue;
    }
    let first = (rect[low] - a[axis]) / delta;
    let last = (rect[high] - a[axis]) / delta;
    if (first > last) [first, last] = [last, first];
    enter = Math.max(enter, first);
    exit = Math.min(exit, last);
    if (enter > exit + EPSILON) return false;
  }
  return true;
}

/**
 * Return waypoints excluding start and including target, or null if blocked.
 * Inputs must already fit the viewport; use clampCenter before requesting a route.
 * Rectangles accept DOMRect fields or {x,y,width,height}. At most 2048 obstacles.
 * All obstacles constrain every edge; at most 48 provide visibility-graph corners.
 *
 * If start is inside an expanded obstacle, only the first segment may exit it.
 * That segment must finish outside every obstacle. Later segments cannot re-enter.
 * This exception permits escape after a control appears underneath the cat; it
 * never permits a destination inside a control. Some constrained escapes can
 * conservatively return null instead of claiming a route through an obstacle.
 */
export function planRoute({ start, target, footprint, viewport, obstacles = [], clearance = 8 } = {}) {
  if (!point(start) || !point(target) || !dimensions(footprint) || !dimensions(viewport)
    || !finite(clearance) || clearance < 0 || !Array.isArray(obstacles)
    || obstacles.length > MAX_OBSTACLES) return null;
  const bounds = centerBounds(footprint, viewport, clearance);
  if (bounds.left > bounds.right || bounds.top > bounds.bottom
    || !inside(start, bounds) || !inside(target, bounds)) return null;

  const expanded = [];
  for (const value of obstacles) {
    const rect = obstacleRect(value);
    if (!rect) return null;
    // Hidden elements often have zero-area client rectangles.
    if (rect.left === rect.right || rect.top === rect.bottom) continue;
    const box = {
      left: rect.left - footprint.width / 2 - clearance,
      right: rect.right + footprint.width / 2 + clearance,
      top: rect.top - footprint.height / 2 - clearance,
      bottom: rect.bottom + footprint.height / 2 + clearance,
    };
    if (box.right < bounds.left || box.left > bounds.right
      || box.bottom < bounds.top || box.top > bounds.bottom) continue;
    expanded.push(box);
  }
  if (expanded.some(rect => inside(target, rect))) return null;
  if (distance(start, target) <= EPSILON) return [];

  const visible = (a, b, first = false) => expanded.every(rect => {
    if (first && inside(a, rect) && !inside(b, rect)) return true;
    return !intersectsSegment(a, b, rect);
  });
  if (visible(start, target, true)) return [copy(target)];

  // Obstacle corners form a complete visibility graph for disjoint rectangles.
  // Corner combinations also handle overlapping rectangles conservatively.
  const nodes = [copy(start), copy(target)];
  const addNode = candidate => {
    if (!inside(candidate, bounds) || expanded.some(rect => inside(candidate, rect))
      || nodes.some(existing => distance(existing, candidate) <= EPSILON)) return;
    nodes.push(candidate);
  };
  const dx = target.x - start.x;
  const dy = target.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const corridorDistance = rect => {
    const x = (rect.left + rect.right) / 2;
    const y = (rect.top + rect.bottom) / 2;
    const t = Math.max(0, Math.min(1, ((x - start.x) * dx + (y - start.y) * dy) / lengthSquared));
    return Math.hypot(x - start.x - t * dx, y - start.y - t * dy);
  };
  const graphObstacles = expanded.map((rect, index) => ({
    rect, index, blocking: intersectsSegment(start, target, rect), score: corridorDistance(rect),
  })).sort((a, b) => Number(b.blocking) - Number(a.blocking) || a.score - b.score || a.index - b.index)
    .slice(0, MAX_GRAPH_OBSTACLES);
  for (const { rect } of graphObstacles) {
    for (const x of [rect.left - CORNER_GAP, rect.right + CORNER_GAP]) {
      for (const y of [rect.top - CORNER_GAP, rect.bottom + CORNER_GAP]) addNode({ x, y });
    }
  }
  for (const x of [bounds.left, bounds.right]) {
    for (const y of [bounds.top, bounds.bottom]) addNode({ x, y });
  }

  const costs = Array(nodes.length).fill(Infinity);
  const previous = Array(nodes.length).fill(-1);
  const done = Array(nodes.length).fill(false);
  costs[0] = 0;
  for (let iteration = 0; iteration < nodes.length; iteration += 1) {
    let current = -1;
    for (let i = 0; i < nodes.length; i += 1) {
      if (!done[i] && (current < 0 || costs[i] < costs[current])) current = i;
    }
    if (current < 0 || !Number.isFinite(costs[current])) return null;
    if (current === 1) {
      const path = [];
      for (let index = 1; index !== 0; index = previous[index]) path.push(copy(nodes[index]));
      return path.reverse();
    }
    done[current] = true;
    for (let next = 1; next < nodes.length; next += 1) {
      if (done[next] || !visible(nodes[current], nodes[next], current === 0)) continue;
      const cost = costs[current] + distance(nodes[current], nodes[next]);
      if (cost < costs[next]) {
        costs[next] = cost;
        previous[next] = current;
      }
    }
  }
  return null;
}

/**
 * Consume no more than maxDistance of Euclidean route length, even across corners.
 * Inputs are never mutated. Invalid/unbounded inputs return null.
 */
export function stepRoute(position, waypoints, maxDistance) {
  if (!point(position) || !Array.isArray(waypoints) || waypoints.length > MAX_WAYPOINTS
    || !waypoints.every(point) || !finite(maxDistance) || maxDistance < 0) return null;
  let current = copy(position);
  let budget = maxDistance;
  let index = 0;
  while (index < waypoints.length) {
    const target = waypoints[index];
    const length = distance(current, target);
    if (length <= EPSILON) {
      current = copy(target);
      index += 1;
      continue;
    }
    if (length <= budget) {
      current = copy(target);
      budget -= length;
      index += 1;
      continue;
    }
    if (budget > 0) {
      current = {
        x: current.x + (target.x - current.x) * budget / length,
        y: current.y + (target.y - current.y) * budget / length,
      };
    }
    break;
  }
  return {
    position: current,
    remaining: waypoints.slice(index).map(copy),
    arrived: index === waypoints.length,
  };
}
