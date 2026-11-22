# Gilded Vault

[![best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/yansen3w/gilded-vault-stealth/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/yansen3w/gilded-vault-stealth/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

Gilded Vault is a top-down 2D stealth game built for the [best-stealth-game-20261121-1759 bounty](https://make.fun/bounty/best-stealth-game-20261121-1759) on make.fun.

You are a thief in a museum at night. Slip past the guards' vision cones across three floors — The Gallery, The Hall of Kings, and The Vault — hiding behind crates and pillars and in pools of shadow. Lift the artifacts, crack the vault on the last floor, and reach the exit unseen. Getting seen fills the detection meter; fill it and the alarm goes up and the guards chase until you break line of sight. Walking is fast but loud; sneaking is slow and quiet. Three lives, a score for loot and a time bonus for a clean getaway.

## Play

- Move: WASD / arrow keys, or click the floor to walk there
- Sneak (slow, quiet): hold Shift
- Pause: P or Esc
- Restart: Space or click on the end screen

No image, font, or audio files: everything is drawn with canvas primitives and the sound is synthesized with WebAudio. The game runs fully offline in a desktop browser.

## Run it

Serve `game/` with any static server — `node serve.ts` serves it at http://localhost:8080 — and open `game/index.html` in desktop Chrome.
