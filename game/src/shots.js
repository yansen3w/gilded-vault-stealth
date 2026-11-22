// The screenshot scenes behind ?shot=start|play|alarm|win. Each one sets the world to a
// real state of the game — the same state a player could reach — and returns the screen
// to draw over it, so every frame is what the game really looks like.
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

/**
 * Set `world` to the named scene (start, play, alarm or win; any other name is start)
 * and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  const state = world.state;
  if (name === 'play') {
    // Mid-infiltration on floor 1: the thief crouched behind a crate, one artifact
    // already lifted, a guard's cone sweeping just past the hiding spot.
    world.reset();
    state.player.x = 560;
    state.player.y = 300;
    state.player.facing = Math.PI / 2;
    state.player.sneaking = true;
    state.loot = 1;
    state.score = 100;
    state.time = 38;
    state.heat = 0.45;
    const guard = state.guards[0];
    guard.x = 700;
    guard.y = 260;
    guard.facing = Math.PI * 0.85;
    guard.state = 'patrol';
    const guard2 = state.guards[1];
    guard2.x = 900;
    guard2.y = 500;
    guard2.facing = Math.PI;
    state.floor.loot[0].taken = true;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'alarm') {
    // Near-miss on floor 2: the alarm is up, a guard is closing in, the thief is
    // backing into the shadows with the meter full.
    world.reset();
    world.setupFloor(1);
    state.player.x = 380;
    state.player.y = 150;
    state.player.facing = Math.PI / 4;
    state.loot = 2;
    state.score = 450;
    state.time = 74;
    state.heat = 1;
    state.alarm = true;
    const guard = state.guards[0];
    guard.x = 470;
    guard.y = 205;
    guard.facing = Math.atan2(state.player.y - guard.y, state.player.x - guard.x);
    guard.state = 'chase';
    const guard2 = state.guards[1];
    guard2.x = 900;
    guard2.y = 260;
    guard2.facing = Math.PI * 0.75;
    guard2.state = 'chase';
    state.floor.loot[0].taken = true;
    state.floor.loot[1].taken = true;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'win') {
    // The getaway on floor 3: vault cracked open, loot lifted, thief at the exit.
    world.reset();
    world.setupFloor(2);
    state.floor.vault.opened = true;
    state.player.x = 1150;
    state.player.y = 110;
    state.player.facing = 0;
    state.loot = 9;
    state.score = 1780;
    state.time = 142;
    for (const item of state.floor.loot) item.taken = true;
    const guard = state.guards[0];
    guard.x = 500;
    guard.y = 420;
    guard.facing = Math.PI;
    return { screen: SCREEN_WIN, best: 1780 };
  }
  // start: the title over a fresh floor 1.
  world.reset();
  return { screen: SCREEN_TITLE, best: 0 };
}
