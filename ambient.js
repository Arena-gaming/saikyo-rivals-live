/* Saikyo ambient soundscape: intermittent rain impacts, distant thunder, neon sputter + ignition.
   Original procedural synthesis. No external samples, no autoplay, no continuous neon hum. */
(() => {
  if (window.saikyoAmbient?.version === 3) return;
  let ctx = null;
  let master = null;
  let rainBed = null;
  let rainLoop = null;
  let thunderTimer = null;
  let active = false;
  const pending = new Set();

  function later(callback, milliseconds) {
    const timer = window.setTimeout(() => {
      pending.delete(timer);
      callback();
    }, milliseconds);
    pending.add(timer);
    return timer;
  }

  function clearScheduled() {
    for (const timer of pending) window.clearTimeout(timer);
    pending.clear();
    rainLoop = thunderTimer = null;
  }

  function getContext() {
    if (ctx) return ctx;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return null;
    ctx = new Audio();
    master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);
    return ctx;
  }

  function noise(seconds, color = 'white') {
    const count = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, count, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < count; i++) {
      const white = Math.random() * 2 - 1;
      brown = (brown + .018 * white) / 1.018;
      data[i] = color === 'brown' ? brown * 3 : white;
    }
    return buffer;
  }

  let droplets = null;
  let atmosphere = null;
  let rumbleNoise = null;
  let ignitionNoise = null;

  function prepareSounds() {
    if (droplets) return;
    // Precompute very short splatters rather than keeping white noise audible.
    droplets = Array.from({ length: 6 }, (_, i) => {
      const seconds = .015 + i * .006;
      const buffer = noise(seconds);
      const d = buffer.getChannelData(0);
      for (let j = 0; j < d.length; j++) {
        const progress = j / d.length;
        d[j] *= Math.pow(1 - progress, 2.6) * Math.sin(Math.PI * Math.min(1, progress * 8));
      }
      return buffer;
    });
    atmosphere = noise(4, 'brown');
    rumbleNoise = noise(8, 'brown');
    ignitionNoise = noise(1);
  }

  function startBackground() {
    if (rainBed) return;
    const source = ctx.createBufferSource();
    source.buffer = atmosphere;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 850;
    filter.Q.value = .28;
    rainBed = ctx.createGain();
    rainBed.gain.value = .003; // Keep the noise floor barely audible: individual drops create the rain.
    source.connect(filter).connect(rainBed).connect(master);
    source.start();
  }

  function drop() {
    if (!active || document.hidden) return;
    const now = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = droplets[Math.floor(Math.random() * droplets.length)];
    source.playbackRate.value = .74 + Math.random() * .76;

    const filter = ctx.createBiquadFilter();
    filter.type = Math.random() < .7 ? 'bandpass' : 'lowpass';
    filter.frequency.value = 1350 + Math.random() * 2750;
    filter.Q.value = .6 + Math.random() * 1.2;
    const amp = ctx.createGain();
    amp.gain.value = .085 + Math.random() * .15;
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.6 - .8;
    source.connect(filter).connect(amp).connect(pan).connect(master);
    source.start(now);

    // Nearby drops have a tiny, softer rounded tick after the surface splash.
    if (Math.random() < .14) {
      const osc = ctx.createOscillator();
      const envelope = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(670 + Math.random() * 450, now);
      osc.frequency.exponentialRampToValueAtTime(260 + Math.random() * 140, now + .04);
      envelope.gain.setValueAtTime(.0001, now);
      envelope.gain.exponentialRampToValueAtTime(.003, now + .003);
      envelope.gain.exponentialRampToValueAtTime(.0001, now + .058);
      osc.connect(envelope).connect(pan);
      osc.start(now);
      osc.stop(now + .063);
    }
  }

  function scheduleRain() {
    if (!active) return;
    if (!document.hidden) {
      const cluster = Math.random() < .20 ? 3 : Math.random() < .48 ? 2 : 1;
      for (let i = 0; i < cluster; i++) drop();
    }
    rainLoop = later(scheduleRain, 120 + Math.random() * 125);
  }

  function thunder() {
    if (!active || document.hidden) return;
    const now = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = rumbleNoise;
    source.playbackRate.value = .78 + Math.random() * .15;
    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 115;
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(.0001, now);
    envelope.gain.exponentialRampToValueAtTime(.033, now + .85);
    envelope.gain.exponentialRampToValueAtTime(.013, now + 2.6);
    envelope.gain.exponentialRampToValueAtTime(.018, now + 3.25);
    envelope.gain.exponentialRampToValueAtTime(.0001, now + 7.1);
    source.connect(low).connect(envelope).connect(master);
    source.start(now);
    source.stop(now + 7.3);

    const body = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    body.type = 'sine';
    body.frequency.setValueAtTime(46, now);
    body.frequency.exponentialRampToValueAtTime(30, now + 6.5);
    bodyGain.gain.setValueAtTime(.0001, now);
    bodyGain.gain.exponentialRampToValueAtTime(.020, now + .95);
    bodyGain.gain.exponentialRampToValueAtTime(.0001, now + 6.9);
    body.connect(bodyGain).connect(master);
    body.start(now);
    body.stop(now + 7);
  }

  function scheduleThunder() {
    if (!active) return;
    thunderTimer = later(() => {
      thunder();
      scheduleThunder();
    }, 35000 + Math.random() * 44000);
  }

  function shortTone(frequency, length, peak, type, delay = 0) {
    const at = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(32, frequency * .84), at + length);
    gain.gain.setValueAtTime(.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + .009);
    gain.gain.exponentialRampToValueAtTime(.0001, at + length);
    oscillator.connect(gain).connect(master);
    oscillator.start(at);
    oscillator.stop(at + length + .025);
  }

  // A crackling, short filtered electrical burst; every source is stopped.
  function electricSnap(delay, length, peak, frequency) {
    const at = ctx.currentTime + delay;
    const source = ctx.createBufferSource();
    source.buffer = ignitionNoise;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = frequency;
    band.Q.value = 2.1;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + .006);
    gain.gain.exponentialRampToValueAtTime(.0001, at + length);
    source.connect(band).connect(gain).connect(master);
    source.start(at);
    source.stop(at + length + .015);
  }

  function neon(phase = 'flicker') {
    if (!active || document.hidden || !ctx) return;
    // Match the visual 340–360 ms electrical flutter, including dark gaps.
    if (phase === 'ignite') {
      electricSnap(0, .13, .024, 3100);
      shortTone(2860, .15, .016, 'sine', .025); // brief glassy switch-on ting
      electricSnap(.11, .47, .011, 430);
      shortTone(116, .72, .013, 'sawtooth', .11); // fades out < 1s after illumination
    } else if (phase === 'off') {
      electricSnap(0, .055, .014, 850);
      shortTone(140, .065, .007, 'sawtooth');
    } else {
      // Pulses land on the opacity changes in neonElectricalFlicker (340 ms).
      for (const delay of [0, .041, .068, .098, .119, .163, .181, .207, .238]) {
        electricSnap(delay, .024 + Math.random() * .013, .011 + Math.random() * .009, 620 + Math.random() * 1800);
      }
      shortTone(2500, .085, .009, 'sine', .065);
      shortTone(130, .11, .009, 'sawtooth', .18);
    }
  }

  function renderButton() {
    const button = document.getElementById('ambientSoundToggle');
    if (!button) return;
    button.classList.toggle('is-on', active);
    button.setAttribute('aria-pressed', String(active));
    const label = button.querySelector('.sound-label');
    if (label) label.textContent = active ? 'Ambience on' : 'Enable ambience';
    else button.lastChild && (button.lastChild.textContent = active ? 'Ambience on' : 'Enable ambience');
  }

  async function toggle() {
    const audio = getContext();
    if (!audio) return;
    if (active) {
      active = false;
      clearScheduled();
      master.gain.cancelScheduledValues(audio.currentTime);
      master.gain.setTargetAtTime(.0001, audio.currentTime, .07);
    } else {
      try { await audio.resume(); } catch { return; }
      if (active) return;
      prepareSounds();
      startBackground();
      active = true;
      master.gain.cancelScheduledValues(audio.currentTime);
      master.gain.setTargetAtTime(.65, audio.currentTime, .55);
      scheduleRain();
      scheduleThunder();
    }
    renderButton();
  }

  // Delegated listener also works if Next.js mounts the button after this script.
  document.addEventListener('click', event => {
    if (event.target?.closest?.('#ambientSoundToggle')) void toggle();
  });
  window.addEventListener('pagehide', () => {
    active = false;
    clearScheduled();
    if (ctx) {
      master.gain.setValueAtTime(.0001, ctx.currentTime);
      void ctx.close();
      ctx = master = rainBed = droplets = atmosphere = rumbleNoise = ignitionNoise = null;
    }
  });
  window.saikyoAmbient = { version: 3, neon };
})();
