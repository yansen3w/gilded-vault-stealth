// Guard brains: patrol routes, vision cones, detection, and the chase. A guard is always
// in one state — patrol, suspicious (heard a noise), chase (saw the thief and raised the
// alarm), or return (walking back to its route). Vision is a cone: range, angle, and a
// line of sight that walls and cover block. Dark zones halve the range.
import { GUARD } from './config.js';

/** True when point (px, py) lies inside rect r. */
export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

/** True when the segment (x1,y1)-(x2,y2) is blocked by any rect in `solids`. Sampled. */
export function losBlocked(x1, y1, x2, y2, solids) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i += 1) {
    const px = x1 + (dx * i) / steps;
    const py = y1 + (dy * i) / steps;
    for (let s = 0; s < solids.length; s += 1) {
      if (pointInRect(px, py, solids[s])) return true;
    }
  }
  return false;
}

/** True when the player is inside a dark zone (vision is halved there). */
export function inDarkZone(x, y, darkZones) {
  for (let i = 0; i < darkZones.length; i += 1) {
    if (pointInRect(x, y, darkZones[i])) return true;
  }
  return false;
}

/** Can this guard see the player right now? Returns the effective vision range too. */
export function guardSees(guard, player, solids, darkZones) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const inDark = inDarkZone(player.x, player.y, darkZones);
  const range = inDark ? GUARD.visionRange * 0.5 : GUARD.visionRange;
  if (dist > range) return { sees: false, range };
  if (dist < 26) return { sees: true, range };
  const angle = Math.atan2(dy, dx);
  let diff = angle - guard.facing;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > GUARD.visionHalfAngle) return { sees: false, range };
  if (losBlocked(guard.x, guard.y, player.x, player.y, solids)) return { sees: false, range };
  return { sees: true, range };
}

export function createGuard(def) {
  const start = def.route[def.start];
  return {
    x: start.x,
    y: start.y,
    facing: 0,
    route: def.route,
    waypoint: def.start,
    pause: 0,
    state: 'patrol',
    investigate: null,
    lookTimer: 0,
    chaseLost: 0,
  };
}

/** Move a guard toward (tx, ty) at `speed`, sliding along solids. Returns distance left. */
function moveToward(guard, tx, ty, speed, dt, solids, radius) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return 0;
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  guard.facing = Math.atan2(dy, dx);
  const blocked = (x, y) => {
    for (let i = 0; i < solids.length; i += 1) {
      const r = solids[i];
      const cx = Math.max(r.x, Math.min(x, r.x + r.w));
      const cy = Math.max(r.y, Math.min(y, r.y + r.h));
      if (Math.hypot(x - cx, y - cy) < radius) return true;
    }
    return false;
  };
  if (!blocked(nx, guard.y)) guard.x = nx;
  if (!blocked(guard.x, ny)) guard.y = ny;
  return Math.hypot(tx - guard.x, ty - guard.y);
}

/**
 * Advance one guard a step. `hear` is the last noise position this guard heard (or null).
 * Returns 'chase' while the guard is actively hunting the player, else its state.
 */
export function updateGuard(guard, dt, player, solids, darkZones, hear, alarmOn) {
  if (alarmOn) {
    guard.state = 'chase';
    guard.chaseLost = 0;
    moveToward(guard, player.x, player.y, GUARD.chaseSpeed, dt, solids, GUARD.radius);
    return 'chase';
  }
  if (guard.state === 'chase') {
    // Alarm ended (player broke line of sight): cool down, then walk home.
    guard.state = 'return';
  }
  if (guard.state === 'patrol') {
    if (hear) {
      guard.state = 'suspicious';
      guard.investigate = { x: hear.x, y: hear.y };
      guard.lookTimer = 0;
      return 'patrol';
    }
    if (guard.pause > 0) {
      guard.pause -= dt;
      if (guard.pause <= 0) {
        guard.waypoint = (guard.waypoint + 1) % guard.route.length;
      }
      return 'patrol';
    }
    const target = guard.route[guard.waypoint];
    const left = moveToward(guard, target.x, target.y, GUARD.patrolSpeed, dt, solids, GUARD.radius);
    if (left < 4) guard.pause = GUARD.waypointPause;
    return 'patrol';
  }
  if (guard.state === 'suspicious') {
    const target = guard.investigate;
    const left = moveToward(guard, target.x, target.y, GUARD.investigateSpeed, dt, solids, GUARD.radius);
    if (left < 6) {
      guard.lookTimer += dt;
      guard.facing += dt * 1.6;
      if (guard.lookTimer >= GUARD.investigateLook) {
        guard.state = 'return';
        guard.investigate = null;
      }
    }
    return 'suspicious';
  }
  // return: walk to the nearest waypoint, then resume the patrol.
  let nearest = 0;
  let nearestDist = Infinity;
  for (let i = 0; i < guard.route.length; i += 1) {
    const d = Math.hypot(guard.route[i].x - guard.x, guard.route[i].y - guard.y);
    if (d < nearestDist) { nearestDist = d; nearest = i; }
  }
  const left = moveToward(guard, guard.route[nearest].x, guard.route[nearest].y, GUARD.patrolSpeed, dt, solids, GUARD.radius);
  if (left < 4) {
    guard.state = 'patrol';
    guard.waypoint = nearest;
  }
  return 'return';
}
