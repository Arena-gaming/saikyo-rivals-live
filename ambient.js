(() => {
  const button = document.getElementById('ambientSoundToggle');
  if (!button) return;

  let ac = null;
  let rainGain = null;
  let enabled = false;
  let thunderTimer = null;

  function audioContext() {
    if (ac) return ac;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    ac = new AudioCtor();
    return ac;
  }

  function makeRain(ctx) {
    if (rainGain) return;
    const seconds = 4;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      brown = (brown + .02 * white) / 1.02;
      data[i] = brown * 3.15;
    }
    const source = ctx.createBufferSource();
    const high = ctx.createBiquadFilter();
    const low = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    high.type = 'highpass';
    high.frequency.value = 280;
    low.type = 'lowpass';
    low.frequency.value = 7600;
    gain.gain.value = .0001;
    source.buffer = buffer;
    source.loop = true;
    source.connect(high).connect(low).connect(gain).connect(ctx.destination);
    source.start();
    rainGain = gain;
  }

  function thunder(ctx) {
    if (!enabled) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const low = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(46, now);
    osc.frequency.exponentialRampToValueAtTime(27, now + 5.5);
    low.type = 'lowpass';
    low.frequency.value = 145;

    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(.045, now + .7);
    gain.gain.exponentialRampToValueAtTime(.015, now + 3.2);
    gain.gain.exponentialRampToValueAtTime(.0001, now + 6.2);

    osc.connect(low).connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 6.4);
  }

  function scheduleThunder() {
    if (!enabled || !ac) return;
    clearTimeout(thunderTimer);
    thunderTimer = setTimeout(() => {
      thunder(ac);
      scheduleThunder();
    }, 22000 + Math.random() * 30000);
  }

  function neonBuzz(intensity = 1) {
    if (!enabled) return;
    const ctx = audioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    const hum = ctx.createOscillator();
    const rasp = ctx.createOscillator();

    hum.type = 'square';
    rasp.type = 'sawtooth';
    hum.frequency.setValueAtTime(58 + Math.random() * 4, now);
    rasp.frequency.setValueAtTime(116 + Math.random() * 10, now);

    const peak = .013 + (.014 * Math.min(1.4, intensity));
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + .018);
    gain.gain.exponentialRampToValueAtTime(.005, now + .11);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .34);

    hum.connect(gain);
    rasp.connect(gain);
    gain.connect(ctx.destination);
    hum.start(now);
    rasp.start(now);
    hum.stop(now + .36);
    rasp.stop(now + .36);
  }

  async function toggle() {
    const ctx = audioContext();
    if (!ctx) return;
    if (!enabled) {
      await ctx.resume();
      makeRain(ctx);
      rainGain.gain.setTargetAtTime(.05, ctx.currentTime, .45);
      enabled = true;
      button.classList.add('is-on');
      button.setAttribute('aria-pressed', 'true');
      button.querySelector('.sound-label').textContent = 'Ambience on';
      scheduleThunder();
      setTimeout(() => neonBuzz(.55), 120);
    } else {
      enabled = false;
      rainGain?.gain.setTargetAtTime(.0001, ctx.currentTime, .35);
      clearTimeout(thunderTimer);
      button.classList.remove('is-on');
      button.setAttribute('aria-pressed', 'false');
      button.querySelector('.sound-label').textContent = 'Enable ambience';
    }
  }

  button.addEventListener('click', toggle);
  window.saikyoAmbient = { neon: neonBuzz };
})();
