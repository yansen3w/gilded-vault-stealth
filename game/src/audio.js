// Synthesized WebAudio: no audio files, everything is an oscillator or filtered noise.
// The context is created on the first user gesture; until then every call is a no-op, so
// the screenshot scenes (which never get a gesture) stay silent.
let ctx = null;
let master = null;

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return;
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.16;
    master.connect(ctx.destination);
  } catch {
    ctx = null;
  }
}

function tone(freq, dur, type, vol, slideTo) {
  if (!ctx || !master) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch { /* audio is decoration; never break the game */ }
}

function noiseBurst(dur, vol, lowpass) {
  if (!ctx || !master) return;
  try {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start();
  } catch { /* audio is decoration */ }
}

/** Soft step tick; sneaking steps are quieter and lower. */
export function playStep(sneaking) {
  if (sneaking) noiseBurst(0.05, 0.10, 500);
  else noiseBurst(0.07, 0.22, 900);
}

/** Two-note alarm sting when the heat maxes out. */
export function playAlarm() {
  tone(620, 0.22, 'square', 0.25, 880);
  setTimeout(() => tone(880, 0.3, 'square', 0.25, 620), 180);
}

/** Bright chime for picking up an artifact. */
export function playPickup() {
  tone(880, 0.12, 'sine', 0.3);
  setTimeout(() => tone(1318, 0.18, 'sine', 0.3), 90);
}

/** Low clunk when the vault cracks open. */
export function playVault() {
  tone(140, 0.35, 'triangle', 0.4, 70);
  setTimeout(() => tone(523, 0.15, 'sine', 0.25), 200);
  setTimeout(() => tone(784, 0.25, 'sine', 0.25), 320);
}

/** Dull thud when a guard catches the thief. */
export function playCaught() {
  tone(220, 0.4, 'sawtooth', 0.3, 55);
}

/** Short rising arpeggio for escaping with the loot. */
export function playWin() {
  [523, 659, 784, 1046].forEach((freq, i) => {
    setTimeout(() => tone(freq, 0.22, 'sine', 0.3), i * 110);
  });
}
