// The world: the thief, the guards, the loot, the vault, the exit, the heat meter and
// the alarm. One fixed step at a time. Events are bit flags the loop reads.
import { FIELD, GUARD, LIVES, LOOT_POINTS, FLOOR_POINTS, PLAYER, STEP, VAULT } from './config.js';
import { loadFloor } from './level.js';
import { createGuard, guardSees, inDarkZone, pointInRect, updateGuard } from './guards.js';
import { playAlarm, playCaught, playPickup, playStep, playVault, playWin } from './audio.js';

export const EVENT_NONE = 0;
export const EVENT_LOOT = 1;
export const EVENT_CAUGHT = 2;
export const EVENT_FLOOR = 4;
export const EVENT_WIN = 8;
export const EVENT_OVER = 16;
export const EVENT_ALARM = 32;
export const EVENT_VAULT = 64;

/** True when a circle at (x, y, r) overlaps rect. */
function circleHitsRect(x, y, r, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return Math.hypot(x - cx, y - cy) < r;
}

/** All solid rects on this floor (walls + cover). */
function solidsOf(floor) {
  return floor.walls.concat(floor.cover);
}

export function createWorld(random) {
  const state = {
    floorIndex: 0,
    floor: null,
    guards: [],
    player: { x: 0, y: 0, facing: -Math.PI / 2, moving: false, sneaking: false },
    moveTarget: null,
    loot: 0,
    lootTotal: 0,
    lives: LIVES,
    heat: 0,
    alarm: false,
    alarmUnseen: 0,
    vaultChannel: 0,
    score: 0,
    time: 0,
    grace: 0,
    stepCount: 0,
    stepSoundTimer: 0,
    noiseTimer: 0,
    won: false,
    over: false,
  };

  function setupFloor(index) {
    state.floorIndex = index;
    state.floor = loadFloor(index);
    state.guards = state.floor.guards.map((g) => createGuard(g));
    state.player.x = state.floor.entry.x;
    state.player.y = state.floor.entry.y;
    state.player.facing = -Math.PI / 2;
    state.moveTarget = null;
    state.heat = 0;
    state.alarm = false;
    state.alarmUnseen = 0;
    state.vaultChannel = 0;
    state.grace = 0;
    state.lootTotal += 0;
  }

  function reset() {
    state.loot = 0;
    state.lootTotal = 0;
    state.lives = LIVES;
    state.score = 0;
    state.time = 0;
    state.stepCount = 0;
    state.won = false;
    state.over = false;
    for (let i = 0; i < 3; i += 1) state.lootTotal += loadFloor(i).loot.length;
    state.lootTotal += 1; // the vault's Gilded Idol on floor 3
    setupFloor(0);
  }

  function respawn() {
    state.player.x = state.floor.entry.x;
    state.player.y = state.floor.entry.y;
    state.moveTarget = null;
    state.heat = 0;
    state.alarm = false;
    state.alarmUnseen = 0;
    state.vaultChannel = 0;
    state.grace = PLAYER.respawnGrace;
    for (const guard of state.guards) {
      const start = guard.route[guard.waypoint];
      guard.x = start.x;
      guard.y = start.y;
      guard.state = 'patrol';
      guard.investigate = null;
      guard.pause = 0;
    }
  }

  function tryMove(dx, dy) {
    const solids = solidsOf(state.floor);
    const p = state.player;
    const nx = p.x + dx;
    const ny = p.y + dy;
    let okX = true;
    let okY = true;
    for (let i = 0; i < solids.length; i += 1) {
      if (circleHitsRect(nx, p.y, PLAYER.radius, solids[i])) okX = false;
      if (circleHitsRect(p.x, ny, PLAYER.radius, solids[i])) okY = false;
    }
    if (okX) p.x = Math.max(PLAYER.radius, Math.min(FIELD.width - PLAYER.radius, nx));
    if (okY) p.y = Math.max(PLAYER.radius, Math.min(FIELD.height - PLAYER.radius, ny));
  }

  /**
   * One fixed step. `move` is a normalised steering vector (or null), `sneaking` is the
   * Shift key, `clickTarget` is a click-to-move point (or null). Returns event flags.
   */
  function step(dt, move, sneaking, clickTarget) {
    if (state.won || state.over) return EVENT_NONE;
    state.time += dt;
    state.stepCount += 1;
    if (state.grace > 0) state.grace -= dt;
    const p = state.player;
    const floor = state.floor;
    const solids = solidsOf(floor);

    // --- movement -----------------------------------------------------------
    let dir = move;
    if (!dir && clickTarget) {
      const dx = clickTarget.x - p.x;
      const dy = clickTarget.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 8) dir = { x: dx / dist, y: dy / dist };
      else state.moveTarget = null;
    }
    if (!dir && state.moveTarget) {
      const dx = state.moveTarget.x - p.x;
      const dy = state.moveTarget.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 8) dir = { x: dx / dist, y: dy / dist };
      else state.moveTarget = null;
    }
    if (clickTarget) state.moveTarget = clickTarget;
    const speed = sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    p.sneaking = sneaking;
    p.moving = !!dir;
    if (dir) {
      p.facing = Math.atan2(dir.y, dir.x);
      tryMove(dir.x * speed * dt, dir.y * speed * dt);
      state.stepSoundTimer -= dt;
      if (state.stepSoundTimer <= 0) {
        playStep(sneaking);
        state.stepSoundTimer = sneaking ? 0.55 : 0.34;
      }
      // Walking is loud: guards nearby come to listen.
      state.noiseTimer -= dt;
      if (state.noiseTimer <= 0) {
        state.noiseTimer = 0.4;
        state.lastNoise = { x: p.x, y: p.y, radius: sneaking ? PLAYER.sneakNoise : PLAYER.walkNoise };
      }
    }

    // --- guards see the player? ---------------------------------------------
    let seen = false;
    let inDark = inDarkZone(p.x, p.y, floor.darkZones);
    for (const guard of state.guards) {
      const result = guardSees(guard, p, solids, floor.darkZones);
      if (result.sees) seen = true;
    }
    if (seen && state.grace <= 0) {
      state.heat += GUARD.detectRate * (inDark ? GUARD.darkFillFactor : 1) * dt;
    } else {
      state.heat -= GUARD.decayRate * dt;
    }
    state.heat = Math.max(0, Math.min(1, state.heat));
    let events = EVENT_NONE;
    if (state.heat >= 1 && !state.alarm) {
      state.alarm = true;
      state.alarmUnseen = 0;
      playAlarm();
      events |= EVENT_ALARM;
    }
    if (state.alarm) {
      if (seen) state.alarmUnseen = 0;
      else state.alarmUnseen += dt;
      if (state.alarmUnseen >= 3) {
        state.alarm = false;
        state.heat = 0.35;
      }
    }

    // --- guards move ----------------------------------------------------------
    for (const guard of state.guards) {
      let hear = null;
      if (state.lastNoise) {
        const d = Math.hypot(guard.x - state.lastNoise.x, guard.y - state.lastNoise.y);
        if (d < state.lastNoise.radius) hear = { x: state.lastNoise.x, y: state.lastNoise.y };
      }
      updateGuard(guard, dt, p, solids, floor.darkZones, hear, state.alarm);
    }
    state.lastNoise = null;

    // --- caught? ---------------------------------------------------------------
    if (state.alarm && state.grace <= 0) {
      for (const guard of state.guards) {
        if (Math.hypot(guard.x - p.x, guard.y - p.y) < GUARD.radius + PLAYER.radius + 2) {
          state.lives -= 1;
          playCaught();
          events |= EVENT_CAUGHT;
          if (state.lives <= 0) {
            state.over = true;
            return events | EVENT_OVER;
          }
          respawn();
          break;
        }
      }
    }

    // --- loot ------------------------------------------------------------------
    for (const item of floor.loot) {
      if (!item.taken && Math.hypot(item.x - p.x, item.y - p.y) < PLAYER.radius + 18) {
        item.taken = true;
        state.loot += 1;
        state.score += LOOT_POINTS;
        playPickup();
        events |= EVENT_LOOT;
      }
    }

    // --- vault (floor 3) ---------------------------------------------------------
    if (floor.vault && !floor.vault.opened) {
      const d = Math.hypot(floor.vault.x - p.x, floor.vault.y - p.y);
      if (d < VAULT.radius + PLAYER.radius) {
        state.vaultChannel += dt;
        if (state.vaultChannel >= VAULT.channelSeconds) {
          floor.vault.opened = true;
          state.loot += 1;
          state.score += LOOT_POINTS;
          playVault();
          events |= EVENT_VAULT;
        }
      } else {
        state.vaultChannel = 0;
      }
    }

    // --- exit ---------------------------------------------------------------------
    const exitOpen = !floor.vault || floor.vault.opened;
    const exit = floor.exit;
    if (exitOpen && Math.hypot(exit.x - p.x, exit.y - p.y) < 26) {
      if (state.floorIndex < 2) {
        state.score += FLOOR_POINTS;
        setupFloor(state.floorIndex + 1);
        return events | EVENT_FLOOR;
      }
      state.won = true;
      const timeBonus = Math.max(0, 1800 - Math.floor(state.time) * 10);
      state.score += timeBonus;
      playWin();
      return events | EVENT_WIN;
    }
    return events;
  }

  reset();
  return { state, reset, step, setupFloor };
}
