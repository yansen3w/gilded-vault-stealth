// The three floors of the museum. Each floor is data: solid walls (block movement and
// sight), cover (crates and pillars — block sight and movement, and hide the thief),
// dark zones (vision is halved there), loot, the entry, the exit, and each guard's patrol
// route. Coordinates are playfield pixels (1280x720). The vault lives on floor 3 only.
const W = 1280;
const H = 720;

function wall(x, y, w, h) {
  return { x, y, w, h };
}

function crate(x, y) {
  return { x, y, w: 46, h: 46, kind: 'crate' };
}

function pillar(x, y) {
  return { x, y, w: 38, h: 38, kind: 'pillar' };
}

function dark(x, y, w, h) {
  return { x, y, w, h };
}

function loot(x, y, kind) {
  return { x, y, kind, taken: false };
}

function guardRoute(points) {
  return points.map(([x, y]) => ({ x, y }));
}

const BORDER = [
  wall(0, 0, W, 22),
  wall(0, H - 22, W, 22),
  wall(0, 0, 22, H),
  wall(W - 22, 0, 22, H),
];

export const FLOORS = [
  {
    name: 'The Gallery',
    entry: { x: 78, y: 636 },
    exit: { x: 1202, y: 82 },
    vault: null,
    walls: [
      ...BORDER,
      wall(400, 110, 24, 300),
      wall(560, 380, 340, 24),
      wall(900, 110, 24, 200),
      wall(150, 300, 170, 24),
    ],
    cover: [
      crate(300, 180),
      crate(348, 180),
      pillar(640, 200),
      crate(1020, 300),
      crate(1020, 348),
      pillar(240, 520),
      crate(760, 560),
      crate(808, 560),
    ],
    darkZones: [
      dark(48, 470, 250, 180),
      dark(1000, 60, 210, 150),
    ],
    loot: [
      loot(330, 540, 'idol'),
      loot(1120, 470, 'vase'),
    ],
    guards: [
      { route: guardRoute([[500, 160], [500, 300], [820, 300], [820, 160]]), start: 0 },
      { route: guardRoute([[1050, 560], [700, 560], [700, 470], [1050, 470]]), start: 2 },
    ],
  },
  {
    name: 'The Hall of Kings',
    entry: { x: 78, y: 82 },
    exit: { x: 1202, y: 636 },
    vault: null,
    walls: [
      ...BORDER,
      wall(300, 90, 24, 260),
      wall(620, 200, 24, 320),
      wall(940, 90, 24, 260),
      wall(150, 520, 300, 24),
      wall(830, 520, 300, 24),
    ],
    cover: [
      pillar(470, 140),
      crate(480, 420),
      crate(528, 420),
      pillar(790, 300),
      crate(180, 250),
      pillar(1090, 420),
      crate(1050, 180),
      crate(700, 620),
    ],
    darkZones: [
      dark(340, 60, 240, 130),
      dark(660, 540, 260, 130),
      dark(1060, 240, 170, 200),
    ],
    loot: [
      loot(470, 620, 'ruby'),
      loot(1100, 120, 'idol'),
      loot(160, 620, 'vase'),
    ],
    guards: [
      { route: guardRoute([[400, 400], [400, 180], [560, 180], [560, 400]]), start: 0 },
      { route: guardRoute([[850, 180], [850, 420], [1080, 420], [1080, 180]]), start: 1 },
      { route: guardRoute([[640, 620], [980, 620], [980, 560], [640, 560]]), start: 3 },
    ],
  },
  {
    name: 'The Vault',
    entry: { x: 640, y: 640 },
    exit: { x: 1202, y: 82 },
    vault: { x: 640, y: 130 },
    walls: [
      ...BORDER,
      wall(300, 240, 24, 240),
      wall(956, 240, 24, 240),
      wall(480, 90, 320, 24),
      wall(150, 480, 200, 24),
      wall(930, 480, 200, 24),
    ],
    cover: [
      pillar(420, 140),
      pillar(820, 140),
      crate(200, 300),
      crate(200, 348),
      crate(1034, 300),
      crate(1034, 348),
      pillar(640, 380),
      crate(560, 560),
      crate(674, 560),
    ],
    darkZones: [
      dark(48, 250, 200, 220),
      dark(1032, 250, 200, 220),
      dark(480, 560, 320, 130),
    ],
    loot: [
      loot(180, 140, 'ruby'),
      loot(1100, 140, 'vase'),
      loot(640, 300, 'idol'),
    ],
    guards: [
      { route: guardRoute([[420, 300], [420, 480], [640, 480], [640, 300]]), start: 0 },
      { route: guardRoute([[860, 300], [860, 480], [640, 480], [640, 300]]), start: 2 },
      { route: guardRoute([[200, 620], [1080, 620]]), start: 0 },
    ],
  },
];

/** A fresh, mutable copy of a floor's layout (loot and guards are reset per run). */
export function loadFloor(index) {
  const floor = FLOORS[index];
  return {
    index,
    name: floor.name,
    entry: { ...floor.entry },
    exit: { ...floor.exit },
    vault: floor.vault ? { ...floor.vault, opened: false, progress: 0 } : null,
    walls: floor.walls.map((r) => ({ ...r })),
    cover: floor.cover.map((r) => ({ ...r, kind: r.kind })),
    darkZones: floor.darkZones.map((r) => ({ ...r })),
    loot: floor.loot.map((l) => ({ ...l, taken: false })),
    guards: floor.guards.map((g) => ({
      route: g.route.map((p) => ({ ...p })),
      start: g.start,
    })),
  };
}
