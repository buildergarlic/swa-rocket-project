// 효과음: 외부 파일 없이 Web Audio로 직접 만듭니다.
// 녹화할 때는 recordDest로도 소리를 보내 영상에 소리가 함께 담깁니다.
(function () {
  let ctx = null;
  let master = null;
  let recordDest = null;
  let enabled = true;

  function ensure() {
    if (!enabled) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, opts = {}) {
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + (opts.delay || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur);
    const vol = opts.vol ?? 0.25;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noiseBuffer(c, seconds) {
    const len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    // 브라운 노이즈: 낮고 묵직한 소리
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
    return buf;
  }

  const Sound = {
    setEnabled(v) { enabled = v; if (!v && master) master.gain.value = 0; else if (master) master.gain.value = 0.9; },
    unlock() { ensure(); },

    // 녹화용 오디오 스트림
    recordStream() {
      const c = ensure();
      if (!c || !c.createMediaStreamDestination) return null;
      if (!recordDest) {
        recordDest = c.createMediaStreamDestination();
        master.connect(recordDest);
      }
      return recordDest.stream;
    },

    arrive() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, { delay: i * 0.09, type: 'triangle', vol: 0.22 }));
    },
    undo() { tone(400, 0.25, { slideTo: 200, type: 'sine', vol: 0.15 }); },
    complete() {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.6, { delay: i * 0.12, type: 'triangle', vol: 0.2 }));
    },
    beep(last) { tone(last ? 1320 : 880, last ? 0.5 : 0.18, { type: 'square', vol: 0.12 }); },

    // 엔진 굉음: 낮은 노이즈 + 저역 진동, 서서히 줄어듭니다
    rumble(seconds = 14) {
      const c = ensure();
      if (!c) return;
      const t0 = c.currentTime;
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c, seconds);
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(300, t0);
      lp.frequency.linearRampToValueAtTime(1400, t0 + 1.2);
      lp.frequency.linearRampToValueAtTime(500, t0 + seconds);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(1.0, t0 + 0.6);
      g.gain.setValueAtTime(1.0, t0 + 4);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
      src.connect(lp).connect(g).connect(master);
      src.start(t0);

      const sub = c.createOscillator();
      const sg = c.createGain();
      sub.type = 'sawtooth';
      sub.frequency.setValueAtTime(38, t0);
      sub.frequency.linearRampToValueAtTime(55, t0 + seconds);
      const sl = c.createBiquadFilter();
      sl.type = 'lowpass';
      sl.frequency.value = 120;
      sg.gain.setValueAtTime(0.0001, t0);
      sg.gain.exponentialRampToValueAtTime(0.5, t0 + 0.8);
      sg.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds * 0.8);
      sub.connect(sl).connect(sg).connect(master);
      sub.start(t0);
      sub.stop(t0 + seconds);
    },
    boom() {
      const c = ensure();
      if (!c) return;
      const t0 = c.currentTime;
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c, 1.5);
      const g = c.createGain();
      g.gain.setValueAtTime(1.2, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
      src.connect(g).connect(master);
      src.start(t0);
    },
    pop() {
      const c = ensure();
      if (!c) return;
      tone(180 + Math.random() * 120, 0.3, { slideTo: 60, type: 'triangle', vol: 0.3 });
      const t0 = c.currentTime;
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c, 0.6);
      const hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1500;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.1);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
      src.connect(hp).connect(g).connect(master);
      src.start(t0);
    },
    fanfare() {
      const notes = [
        [523, 0], [659, 0.18], [784, 0.36], [1047, 0.54],
        [784, 0.9], [1047, 1.08], [1319, 1.26],
      ];
      notes.forEach(([f, d]) => {
        tone(f, 0.5, { delay: d, type: 'triangle', vol: 0.2 });
        tone(f / 2, 0.5, { delay: d, type: 'sine', vol: 0.12 });
      });
      [523, 659, 784, 1047].forEach(f => tone(f, 2.2, { delay: 1.5, type: 'triangle', vol: 0.12 }));
    },
  };

  window.Sound = Sound;
})();
