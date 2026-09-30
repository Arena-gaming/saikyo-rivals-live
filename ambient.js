/* Saikyo v9: rain and thunder ambience only. Old neon audio removed. */
(() => {
  if (window.saikyoAmbient?.version === 9) return;

  // Bundled recordings are shipped with each site; Wikimedia is the fallback
  // only if a local asset has failed to load.
  const assetBase = new URL('.', document.currentScript?.src || window.location.href);
  const RAIN_URL = new URL('storm-rain.ogg', assetBase).href;
  const THUNDER_URL = new URL('storm-thunder.ogg', assetBase).href;
  const RAIN_BACKUP = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Rain_%281%29.ogg';
  const THUNDER_BACKUP = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Rain_and_thunder.ogg';
  let active = false, ctx = null, effectsBus = null;
  let rainBuffer = null, rainLoad = null, rainSource = null, rainGain = null;
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

  // Crossfade the actual recording into itself in an AudioBuffer. Browser
  // HTMLMediaElement.loop can expose a silent encoder/browser boundary; an
  // AudioBufferSourceNode loops sample-accurately across the blended seam.
  function seamlessRain(original) {
    const rate = original.sampleRate;
    const samples = original.length;
    const trimStart = Math.round(.15 * rate);
    // Some field recordings include a silent tail. Find and exclude it.
    const windowSize = Math.max(1, Math.round(rate * .15));
    const first = original.getChannelData(0);
    function level(start, end) {
      let energy = 0;
      for (let i = start; i < end; i += 8) energy += first[i] * first[i];
      return Math.sqrt(energy / Math.max(1, Math.ceil((end - start) / 8)));
    }
    let end = samples;
    let best = 0;
    for (let p = trimStart; p + windowSize < samples; p += windowSize) {
      best = Math.max(best, level(p, p + windowSize));
    }
    while (end - windowSize > trimStart + rate * 9 &&
           level(end - windowSize, end) < best * .12) {
      end -= windowSize;
    }
    const overlap = Math.min(Math.round(rate * 2.4), Math.floor((end - trimStart) / 5));
    const length = end - trimStart - overlap;
    if (length < rate * 3 || !overlap) throw Error('Rain recording too short');
    const result = ctx.createBuffer(original.numberOfChannels, length, rate);
    for (let channel = 0; channel < original.numberOfChannels; channel++) {
      const input = original.getChannelData(channel);
      const output = result.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        if (i < overlap) {
          const mix = i / overlap;
          const tail = input[end - overlap + i];
          const head = input[trimStart + i];
          output[i] = tail * Math.cos(mix * Math.PI / 2) +
                      head * Math.sin(mix * Math.PI / 2);
        } else {
          output[i] = input[trimStart + i];
        }
      }
    }
    return result;
  }

  function startRainLoop() {
    if (!active || !ctx || ctx.state !== 'running' || !rainBuffer || rainSource) return;
    rainSource = ctx.createBufferSource();
    rainSource.buffer = rainBuffer;
    rainSource.loop = true;
    rainGain = ctx.createGain();
    const now = ctx.currentTime;
    rainGain.gain.setValueAtTime(.0001, now);
    rainGain.gain.linearRampToValueAtTime(volume.rain, now + 1.5);
    rainSource.connect(rainGain).connect(ctx.destination);
    rainSource.start(now);
    if (rainTrack && !rainTrack.paused) {
      // Overlap live recording and seamless buffer instead of creating a gap.
      for (let step = 1; step <= 15; step++) {
        later(() => {
          if (!active || !rainTrack) return;
          rainTrack.volume = volume.rain * (1 - step / 15);
          if (step === 15) rainTrack.pause();
        }, step * 100);
      }
    }
  }

  function loadRain() {
    if (rainBuffer) { startRainLoop(); return; }
    if (rainLoad || !ctx) return;
    rainLoad = fetch(RAIN_URL).then(response => {
      if (!response.ok) throw Error('Rain sound file missing');
      return response.arrayBuffer();
    }).then(data => ctx.decodeAudioData(data)).then(decoded => {
      rainBuffer = seamlessRain(decoded);
      startRainLoop();
    }).catch(() => {
      // HTML audio remains a fallback if decoding or streaming fails.
      rainLoad = null;
    });
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
  }
  function stopAudio() {
    if (rainSource) {
      try { rainSource.stop(); } catch {}
      rainSource = null;
      rainGain = null;
    }
    if (rainTrack) {
      rainTrack.pause();
      rainTrack.currentTime = 0;
      rainTrack.volume = volume.rain;
    }
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
    rainTrack.loop = true; // fallback until decoded crossfaded AudioBuffer is ready
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
    if (effectsBus && ctx) effectsBus.gain.setTargetAtTime(.9, ctx.currentTime, .06);    if (rainBuffer) {
      startRainLoop();
    } else {
      rainTrack.volume = volume.rain;
      try {
        const playing = rainTrack.play();
        if (playing?.catch) void playing.catch(() => startFallbackRain());
      } catch { startFallbackRain(); }
      loadRain();
    }
    // First obvious thunder cue occurs soon after enabling, not 15–40s later.
    fallbackTimer = later(thunder, 1700);
    thunderTimer = later(scheduleThunder, 15500);    renderButton();
  }
  document.addEventListener('click', (event) => {
    if (event.target?.closest?.('#ambientSoundToggle')) void toggle();
  });
  window.addEventListener('pagehide', () => {
    active = false;
    clearScheduled();
    stopAudio();
    if (ctx) void ctx.close();    ctx = effectsBus = null;
  });  window.saikyoAmbient = { version: 9 };
})();
