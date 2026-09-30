/* Saikyo v5: real storm recordings + event-timed neon. No continuous synthetic hiss.
 * Real recordings: ezwa "Rain (1).ogg" (45s, public domain) and Caesar
 * "Rain and thunder.ogg" (19s, public domain), Wikimedia Commons.
 * Source/licence: commons.wikimedia.org/wiki/File:Rain_(1).ogg
 *                 commons.wikimedia.org/wiki/File:Rain_and_thunder.ogg
 * Audio is fetched only after the visitor enables ambience.
 */
(() => {
  if (window.saikyoAmbient?.version === 6) return;

  // Bundled recordings are shipped with each site; Wikimedia is the fallback
  // only if a local asset has failed to load.
  const assetBase = new URL('.', document.currentScript?.src || window.location.href);
  const RAIN_URL = new URL('storm-rain.ogg', assetBase).href;
  const THUNDER_URL = new URL('storm-thunder.ogg', assetBase).href;
  const NEON_URL = new URL('neon-flicker.ogg', assetBase).href;
  const RAIN_BACKUP = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Rain_%281%29.ogg';
  const THUNDER_BACKUP = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Rain_and_thunder.ogg';
  let active = false, ctx = null, effectsBus = null;
  let neonRecording = null, neonLoad = null;
  let rainTrack = null, thunderTrack = null;
  let usedRainBackup = false, usedThunderBackup = false;
  let thunderTimer = null, fallbackTimer = null;
  let fallbackRain = null;
  const timers = new Set();
  const volume = { rain: .59, thunder: .92 };

  function later(fn, ms) {
    const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
    return id;
  }
  function clearScheduled() {
    for (const id of timers) clearTimeout(id);
    timers.clear();
    thunderTimer = fallbackTimer = null;
  }
  function audioContext() {
    if (ctx) return ctx;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    ctx = new AudioCtor();
    effectsBus = ctx.createGain();
    effectsBus.gain.value = .9;
    effectsBus.connect(ctx.destination);
    return ctx;
  }
  function whiteNoise(seconds) {
    const frames = Math.ceil(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }
  function buzz(start, duration, frequency, peak) {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    // Midrange harmonics survive laptop speakers and cut through storm recordings.
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(frequency, start);
    osc.frequency.linearRampToValueAtTime(frequency * .86, start + duration);
    amp.gain.setValueAtTime(.0001, start);
    amp.gain.linearRampToValueAtTime(peak, start + .025);
    amp.gain.setValueAtTime(peak * .75, start + duration * .45);
    amp.gain.exponentialRampToValueAtTime(.0001, start + duration);
    const mid = ctx.createBiquadFilter();
    mid.type = 'lowpass';
    mid.frequency.value = 1200;
    osc.connect(mid).connect(amp).connect(effectsBus);
    osc.start(start);
    osc.stop(start + duration + .02);
  }
  function crack(start, duration, peak, frequency = 1750) {
    const source = ctx.createBufferSource();
    source.buffer = whiteNoise(duration + .02);
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = frequency;
    band.Q.value = .75;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(.0001, start);
    amp.gain.linearRampToValueAtTime(peak, start + .005);
    amp.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.connect(band).connect(amp).connect(effectsBus);
    source.start(start);
    source.stop(start + duration + .01);
  }
  function loadNeon() {
    // Loading only after the visitor opts in: the crackle recording is CC0.
    if (neonLoad || !ctx) return;
    neonLoad = fetch(NEON_URL).then(response => {
      if (!response.ok) throw Error('neon sound file missing');
      return response.arrayBuffer();
    }).then(data => ctx.decodeAudioData(data)).then(buffer => {
      neonRecording = buffer;
    }).catch(() => {
      neonRecording = null;
    });
  }

  function sputter(start, duration, peak, offset = 2.3) {
    if (!ctx || !effectsBus) return;
    if (!neonRecording) {
      // Fallback is short broadband arcing only, never the old pitched whine.
      crack(start, Math.min(duration, .11), peak * .6, 1850);
      return;
    }
    const span = Math.max(.04, Math.min(duration, neonRecording.duration - .1));
    const startOffset = Math.min(offset, Math.max(0, neonRecording.duration - span - .05));
    const source = ctx.createBufferSource();
    source.buffer = neonRecording;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 220;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(.0001, start);
    amp.gain.linearRampToValueAtTime(peak, start + Math.min(.012, span / 4));
    amp.gain.setValueAtTime(peak * .91, start + span * .40);
    amp.gain.exponentialRampToValueAtTime(.0001, start + span);
    source.connect(hp).connect(amp).connect(effectsBus);
    source.start(start, startOffset, span);
    source.stop(start + span + .01);
  }

  // Visual flicker timing for public CSS (340 ms) and app scene (360 ms).
  // Each source is an actual short neon-fixture recording, gated on light flashes.
  function neon(phase = 'flicker') {
    if (!active || document.hidden || !audioContext()) return;
    if (ctx.state !== 'running') return;
    const at = ctx.currentTime;
    if (phase === 'ignite') {
      // One final ragged buzz as the sign catches; silence after 1.1 seconds.
      sputter(at, .90, .48, 3.6);
      crack(at, .038, .10, 2000);
    } else if (phase === 'off') {
      sputter(at, .07, .31, 1.4);
    } else {
      // Brief sputters precisely under the light's off/on transitions.
      for (const [d, len] of [[0,.033],[.041,.024],[.068,.031],[.098,.020],[.119,.039],[.163,.025],[.181,.023],[.207,.032],[.238,.065]]) {
        sputter(at + d, len, .31 + Math.random() * .12, 1.1 + Math.random() * 9);
      }
    }
  }
  function synthThunder() {
    if (!active || document.hidden || !audioContext() || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    // Both the attack and the rolling tail have audible midrange, not just bass.
    const src = ctx.createBufferSource();
    src.buffer = whiteNoise(5.8);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(.0001, now);
    envelope.gain.linearRampToValueAtTime(.16, now + .14);
    envelope.gain.exponentialRampToValueAtTime(.055, now + .85);
    envelope.gain.linearRampToValueAtTime(.105, now + 1.7);
    envelope.gain.exponentialRampToValueAtTime(.0001, now + 5.55);
    src.connect(lp).connect(envelope).connect(effectsBus);
    src.start(now); src.stop(now + 5.7);
    buzz(now + .1, 3.9, 83, .037);
  }
  function stopAudio() {
    if (rainTrack) { rainTrack.pause(); rainTrack.currentTime = 0; }
    if (thunderTrack) { thunderTrack.pause(); thunderTrack.currentTime = 0; }
    if (fallbackRain) { try { fallbackRain.stop(); } catch {} fallbackRain = null; }
    if (effectsBus && ctx) effectsBus.gain.setTargetAtTime(.0001, ctx.currentTime, .06);
  }
  function startFallbackRain() {
    if (!active || fallbackRain || !audioContext() || ctx.state !== 'running') return;
    // Clearly quieter fallback; recordings are the intended primary sound.
    const source = ctx.createBufferSource();
    source.buffer = whiteNoise(7);
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 1450;
    const gain = ctx.createGain(); gain.gain.value = .022;
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
    fallbackRain = source;
  }
  function thunder() {
    if (!active || document.hidden) return;
    // A real thunder recording plus a distinct, speaker-friendly opening rumble.
    if (thunderTrack) {
      thunderTrack.currentTime = 0;
      const played = thunderTrack.play();
      if (played?.catch) void played.catch(() => {});
    }
    synthThunder();
  }
  function scheduleThunder() {
    if (!active) return;
    thunderTimer = later(() => {
      thunder();
      scheduleThunder();
    }, 25000 + Math.random() * 17000);
  }
  function initialiseTracks() {
    if (rainTrack) return;
    rainTrack = new Audio(RAIN_URL);
    rainTrack.loop = true;
    rainTrack.preload = 'none';
    rainTrack.volume = volume.rain;
    rainTrack.addEventListener('error', () => {
      if (!active) return;
      if (!usedRainBackup) {
        usedRainBackup = true;
        rainTrack.src = RAIN_BACKUP;
        const next = rainTrack.play();
        if (next?.catch) void next.catch(() => startFallbackRain());
      } else startFallbackRain();
    });
    thunderTrack = new Audio(THUNDER_URL);
    thunderTrack.preload = 'none';
    thunderTrack.volume = volume.thunder;
    thunderTrack.addEventListener('error', () => {
      if (!active || usedThunderBackup) return;
      usedThunderBackup = true;
      thunderTrack.src = THUNDER_BACKUP;
      const next = thunderTrack.play();
      if (next?.catch) void next.catch(() => {}); // audible synthThunder still plays
    });
  }
  function renderButton() {
    const button = document.getElementById('ambientSoundToggle');
    if (!button) return;
    button.classList.toggle('is-on', active);
    button.setAttribute('aria-pressed', String(active));
    const label = button.querySelector('.sound-label');
    if (label) label.textContent = active ? 'Ambience on' : 'Enable ambience';
  }
  async function toggle() {
    if (active) {
      active = false;
      clearScheduled();
      stopAudio();
      renderButton();
      return;
    }
    initialiseTracks();
    const ac = audioContext();
    try { if (ac) await ac.resume(); } catch {}
    if (active) return;
    active = true;
    if (effectsBus && ctx) effectsBus.gain.setTargetAtTime(.9, ctx.currentTime, .06);
    loadNeon();
    try {
      const playing = rainTrack.play();
      if (playing?.catch) void playing.catch(() => startFallbackRain());
    } catch { startFallbackRain(); }
    // First obvious thunder cue occurs soon after enabling, not 15–40s later.
    fallbackTimer = later(thunder, 1700);
    thunderTimer = later(scheduleThunder, 15500);
    // The visual scene listens for this and performs a matching early flicker.
    document.dispatchEvent(new CustomEvent('saikyo-ambience-enabled'));
    renderButton();
  }
  document.addEventListener('click', (event) => {
    if (event.target?.closest?.('#ambientSoundToggle')) void toggle();
  });
  window.addEventListener('pagehide', () => {
    active = false;
    clearScheduled();
    stopAudio();
    if (ctx) void ctx.close();
    ctx = effectsBus = neonRecording = neonLoad = null;
  });
  window.saikyoAmbient = { version: 6, neon };
})();
