// Canvas rendering: the museum floor, the guards and their vision cones, the thief, the
// loot, the vault and the exit, plus the HUD and the title / pause / win / game-over
// screens. The playfield is a fixed 1280x720; the canvas is scaled to fit the window.
import { FIELD, FONT, GUARD, PALETTE, PLAYER, VAULT } from './config.js';
import { FLOOR_NAMES } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, guard, range, alerted) {
  const half = GUARD.visionHalfAngle;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, range, guard.facing - half, guard.facing + half);
  ctx.closePath();
  ctx.fillStyle = alerted ? PALETTE.coneAlert : PALETTE.cone;
  ctx.fill();
}

function drawGuard(ctx, guard, alerted) {
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.guard;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = PALETTE.guardTrim;
  ctx.stroke();
  // Facing tick and a tiny helmet brim.
  const fx = guard.x + Math.cos(guard.facing) * (GUARD.radius + 5);
  const fy = guard.y + Math.sin(guard.facing) * (GUARD.radius + 5);
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(fx, fy);
  ctx.lineWidth = 3;
  ctx.strokeStyle = PALETTE.guardTrim;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#f5f5f5';
  ctx.fill();
  if (alerted) {
    ctx.font = `bold 20px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.danger;
    ctx.fillText('!', guard.x, guard.y - GUARD.radius - 8);
  }
}

function drawLoot(ctx, item) {
  const bob = Math.sin(Date.now() / 300 + item.x) * 2;
  const y = item.y + bob;
  ctx.save();
  ctx.shadowColor = PALETTE.loot;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(item.x, y - 12);
  ctx.lineTo(item.x + 9, y);
  ctx.lineTo(item.x, y + 12);
  ctx.lineTo(item.x - 9, y);
  ctx.closePath();
  ctx.fillStyle = item.kind === 'ruby' ? PALETTE.lootRuby : item.kind === 'vase' ? PALETTE.lootGem : PALETTE.loot;
  ctx.fill();
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function resize() {
    const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
    canvas.width = Math.floor(FIELD.width * scale);
    canvas.height = Math.floor(FIELD.height * scale);
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
  }
  window.addEventListener('resize', resize);
  resize();

  function drawFloor(state) {
    const floor = state.floor;
    ctx.fillStyle = PALETTE.floorA;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // Marble checker.
    const tile = 80;
    ctx.fillStyle = PALETTE.floorB;
    for (let ty = 0; ty < FIELD.height / tile; ty += 1) {
      for (let tx = 0; tx < FIELD.width / tile; tx += 1) {
        if ((tx + ty) % 2 === 0) ctx.fillRect(tx * tile, ty * tile, tile, tile);
      }
    }
    ctx.strokeStyle = PALETTE.floorLine;
    ctx.lineWidth = 1;
    for (let x = 0; x <= FIELD.width; x += tile) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, FIELD.height); ctx.stroke();
    }
    for (let y = 0; y <= FIELD.height; y += tile) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(FIELD.width, y); ctx.stroke();
    }
    // Dark zones: pools of shadow where the thief is hard to spot.
    for (const zone of floor.darkZones) {
      ctx.fillStyle = PALETTE.darkZone;
      ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
      ctx.strokeStyle = PALETTE.darkHatch;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
      ctx.setLineDash([]);
      ctx.font = `11px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillStyle = PALETTE.muted;
      ctx.fillText('SHADOW', zone.x + 8, zone.y + 16);
    }
  }

  function drawExit(state) {
    const floor = state.floor;
    const open = !floor.vault || floor.vault.opened;
    const e = floor.exit;
    ctx.save();
    ctx.shadowColor = open ? PALETTE.exit : PALETTE.exitLocked;
    ctx.shadowBlur = open ? 16 : 6;
    ctx.fillStyle = open ? PALETTE.exit : PALETTE.exitLocked;
    roundRect(ctx, e.x - 22, e.y - 30, 44, 60, 6);
    ctx.fill();
    ctx.restore();
    ctx.font = `bold 11px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0b0d12';
    ctx.fillText(open ? 'EXIT' : 'LOCKED', e.x, e.y + 4);
  }

  function drawVault(state) {
    const floor = state.floor;
    if (!floor.vault) return;
    const v = floor.vault;
    ctx.save();
    ctx.shadowColor = PALETTE.vault;
    ctx.shadowBlur = 18;
    ctx.fillStyle = v.opened ? PALETTE.vaultOpen : PALETTE.vault;
    ctx.beginPath();
    ctx.arc(v.x, v.y, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#7a5f14';
    ctx.beginPath();
    ctx.arc(v.x, v.y, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(v.x, v.y, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = `bold 12px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0b0d12';
    ctx.fillText(v.opened ? 'OPEN' : 'VAULT', v.x, v.y + 46);
    // Crack progress ring while the thief works the lock.
    if (state.vaultChannel > 0 && !v.opened) {
      ctx.beginPath();
      ctx.arc(v.x, v.y, 40, -Math.PI / 2, -Math.PI / 2 + (state.vaultChannel / 2) * Math.PI * 2);
      ctx.lineWidth = 5;
      ctx.strokeStyle = PALETTE.gold;
      ctx.stroke();
    }
  }

  function drawWallsAndCover(state) {
    const floor = state.floor;
    for (const r of floor.walls) {
      ctx.fillStyle = PALETTE.wall;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = PALETTE.wallTop;
      ctx.fillRect(r.x, r.y, r.w, Math.min(6, r.h));
    }
    for (const c of floor.cover) {
      if (c.kind === 'crate') {
        ctx.fillStyle = PALETTE.crate;
        roundRect(ctx, c.x, c.y, c.w, c.h, 4);
        ctx.fill();
        ctx.fillStyle = PALETTE.crateTop;
        ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, 8);
        ctx.strokeStyle = '#5d4423';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(c.x + 4, c.y + 4);
        ctx.lineTo(c.x + c.w - 4, c.y + c.h - 4);
        ctx.moveTo(c.x + c.w - 4, c.y + 4);
        ctx.lineTo(c.x + 4, c.y + c.h - 4);
        ctx.stroke();
      } else {
        ctx.fillStyle = PALETTE.pillar;
        ctx.beginPath();
        ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7d7462';
        ctx.beginPath();
        ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawPlayer(state) {
    const p = state.player;
    const blink = state.grace > 0 && Math.floor(Date.now() / 120) % 2 === 0;
    if (blink) return;
    ctx.save();
    if (p.sneaking) ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER.radius, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.player;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = PALETTE.playerTrim;
    ctx.stroke();
    // Hood point in the facing direction.
    const hx = p.x + Math.cos(p.facing) * (PLAYER.radius + 4);
    const hy = p.y + Math.sin(p.facing) * (PLAYER.radius + 4);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(hx, hy);
    ctx.lineWidth = 3;
    ctx.strokeStyle = PALETTE.playerTrim;
    ctx.stroke();
    ctx.restore();
  }

  function drawHud(state, screen) {
    ctx.fillStyle = 'rgba(11, 13, 18, 0.82)';
    ctx.fillRect(0, 0, FIELD.width, 40);
    ctx.font = `bold 15px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(`${FLOOR_NAMES[state.floorIndex]}  ·  Floor ${state.floorIndex + 1}/3`, 16, 26);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText(`◆ Loot ${state.loot}/${state.lootTotal}`, 640, 26);
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.text;
    const mins = Math.floor(state.time / 60);
    const secs = Math.floor(state.time % 60);
    ctx.fillText(`Score ${state.score}   ${mins}:${String(secs).padStart(2, '0')}`, 1264, 26);
    // Lives as small hearts, left of the loot counter.
    ctx.textAlign = 'left';
    for (let i = 0; i < state.lives; i += 1) {
      ctx.fillStyle = PALETTE.danger;
      ctx.beginPath();
      ctx.arc(430 + i * 22, 20, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    // Detection meter.
    const mx = 950;
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, mx, 12, 180, 16, 8);
    ctx.fill();
    ctx.fillStyle = state.heat > 0.66 ? PALETTE.danger : state.heat > 0.33 ? PALETTE.gold : '#7ee0c3';
    if (state.heat > 0.01) {
      roundRect(ctx, mx, 12, 180 * state.heat, 16, 8);
      ctx.fill();
    }
    ctx.font = `bold 11px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.textAlign = 'right';
    ctx.fillText(state.alarm ? 'SPOTTED!' : 'SEEN', mx - 8, 25);
    // Objective line.
    ctx.textAlign = 'center';
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    const objective = state.floor.vault
      ? (state.floor.vault.opened ? 'Vault open — reach the EXIT unseen!' : 'Crack the VAULT, then reach the EXIT.')
      : 'Slip past the guards and reach the EXIT unseen.';
    ctx.fillText(objective, 640, 62);
    if (screen === SCREEN_PLAY && state.alarm) {
      ctx.font = `bold 34px ${FONT}`;
      ctx.fillStyle = PALETTE.danger;
      ctx.fillText('SPOTTED!  Break line of sight!', 640, 120);
    }
  }

  function overlay(title, lines, accent) {
    ctx.fillStyle = 'rgba(11, 13, 18, 0.78)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = accent || PALETTE.gold;
    ctx.font = `bold 64px ${FONT}`;
    ctx.fillText(title, 640, 250);
    ctx.font = `20px ${FONT}`;
    ctx.fillStyle = PALETTE.text;
    lines.forEach((line, i) => {
      ctx.fillText(line, 640, 310 + i * 34);
    });
  }

  function draw(state, screen, best) {
    ctx.save();
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    ctx.scale(scale, scale);
    drawFloor(state);
    drawExit(state);
    drawVault(state);
    for (const item of state.floor.loot) {
      if (!item.taken) drawLoot(ctx, item);
    }
    // Vision cones first, so walls drawn over them read as blocking the sight.
    const solids = state.floor.walls.concat(state.floor.cover);
    for (const guard of state.guards) {
      const range = guard.state === 'chase' ? GUARD.visionRange : GUARD.visionRange;
      drawCone(ctx, guard, range, state.alarm || guard.state === 'chase');
    }
    drawWallsAndCover(state);
    for (const guard of state.guards) {
      drawGuard(ctx, guard, state.alarm || guard.state === 'chase');
    }
    drawPlayer(state);
    drawHud(state, screen);
    if (screen === SCREEN_TITLE) {
      overlay('GILDED VAULT', [
        'A top-down stealth heist. Slip through the museum at night,',
        'lift the artifacts, crack the vault, and vanish out the exit unseen.',
        '',
        'Move: WASD / arrows or click  ·  Sneak (slow, quiet): Shift',
        'Guards see you in their golden cones — shadows hide you.',
        'Heard a noise? They come to look. Seen fully? They chase.',
        '',
        'Press Space or click to begin.',
      ]);
    } else if (screen === SCREEN_PAUSED) {
      overlay('PAUSED', ['Press P or Space to keep sneaking.']);
    } else if (screen === SCREEN_WIN) {
      overlay('CLEAN GETAWAY', [
        `You slipped out with ${state.loot} artifacts. Score ${state.score}.`,
        `Best ${Math.max(best, state.score)}.`,
        '',
        'Press Space or click to play again.',
      ], PALETTE.vaultOpen);
    } else if (screen === SCREEN_OVER) {
      overlay('CAUGHT', [
        'The guards dragged you out of the museum.',
        `Score ${state.score}.  Best ${best}.`,
        '',
        'Press Space or click to try again.',
      ], PALETTE.danger);
    }
    ctx.restore();
  }

  return { draw, resize };
}
