// Gilded Vault — every tuning number and colour in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below depends on
// the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 13,
  walkSpeed: 175,
  sneakSpeed: 88,
  /** Noise radius in pixels while walking; sneaking is much quieter. */
  walkNoise: 115,
  sneakNoise: 30,
  /** Seconds of invulnerability after being caught and respawning. */
  respawnGrace: 2,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 72,
  chaseSpeed: 152,
  investigateSpeed: 105,
  /** Vision range in pixels; halved when the player hides in a dark zone. */
  visionRange: 195,
  /** Half-angle of the vision cone, in radians. */
  visionHalfAngle: 0.61,
  /** Seconds a guard waits at each patrol waypoint. */
  waypointPause: 1.2,
  /** Seconds of looking around at an investigated spot before giving up. */
  investigateLook: 2.0,
  /** Detection fills at this rate per second while a guard sees the player. */
  detectRate: 1.15,
  /** Detection drains at this rate per second while nobody sees the player. */
  decayRate: 0.45,
  /** In a dark zone the fill rate is multiplied by this. */
  darkFillFactor: 0.25,
};

export const LIVES = 3;
export const LOOT_POINTS = 100;
export const FLOOR_POINTS = 250;

export const VAULT = {
  /** Seconds standing at the vault to crack it open. */
  channelSeconds: 2,
  radius: 46,
};

export const PALETTE = {
  backdrop: '#0b0d12',
  floorA: '#23202a',
  floorB: '#1e1b24',
  floorLine: '#2e2a38',
  wall: '#4a4238',
  wallTop: '#6b5d4c',
  crate: '#7a5a33',
  crateTop: '#a07a44',
  pillar: '#5c5648',
  darkZone: '#101318',
  darkHatch: '#1a2027',
  player: '#2f3542',
  playerTrim: '#f2c94c',
  guard: '#c0392b',
  guardTrim: '#f5f5f5',
  cone: 'rgba(242, 201, 76, 0.20)',
  coneAlert: 'rgba(229, 83, 75, 0.30)',
  loot: '#f2c94c',
  lootGem: '#7ee0c3',
  lootRuby: '#e5534b',
  vault: '#d4af37',
  vaultOpen: '#8ff0a4',
  exit: '#2ecc71',
  exitLocked: '#7a2e2e',
  text: '#eef1f5',
  muted: '#9aa1ad',
  panel: '#1a1d26',
  danger: '#e5534b',
  gold: '#f2c94c',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'gilded-vault.best';

export const FLOOR_NAMES = ['The Gallery', 'The Hall of Kings', 'The Vault'];
