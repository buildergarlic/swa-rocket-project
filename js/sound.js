// 효과음: 외부 파일 없이 Web Audio로 직접 만듭니다.
// 녹화할 때는 recordDest로도 소리를 보내 영상에 소리가 함께 담깁니다.
(function () {
  let ctx = null;
  let master = null;
  let recordDest = null;
  let enabled = true;
  let ambientNodes = null;

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

  function noiseBuffer(c, seconds, kind = 'brown') {
    const len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    if (kind === 'white') { for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; return buf; }
    if (kind === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + w * 0.029591; b1 = 0.985 * b1 + w * 0.032534; b2 = 0.95 * b2 + w * 0.048056;
        d[i] = (b0 + b1 + b2 + w * 0.05) * 2;
      }
      return buf;
    }
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

    // ── 발사장 현장음 ──
    // 바람 소리 + 멀리서 웅성거리는 관람객 + 가끔 들리는 관제 무전 신호음
    ambient() {
      const c = ensure();
      if (!c || ambientNodes) return;
      const t0 = c.currentTime;
      const out = c.createGain();
      out.gain.setValueAtTime(0.0001, t0);
      out.gain.exponentialRampToValueAtTime(1, t0 + 2);
      out.connect(master);
      const wind = c.createBufferSource();
      wind.buffer = noiseBuffer(c, 8, 'pink');
      wind.loop = true;
      const wl = c.createBiquadFilter(); wl.type = 'bandpass'; wl.frequency.value = 500; wl.Q.value = 0.6;
      const wg = c.createGain(); wg.gain.value = 0.12;
      const lfo = c.createOscillator(); lfo.frequency.value = 0.13;
      const lg = c.createGain(); lg.gain.value = 0.06;
      lfo.connect(lg).connect(wg.gain);
      wind.connect(wl).connect(wg).connect(out);
      const crowd = c.createBufferSource();
      crowd.buffer = noiseBuffer(c, 6, 'white');
      crowd.loop = true;
      const cb = c.createBiquadFilter(); cb.type = 'bandpass'; cb.frequency.value = 900; cb.Q.value = 1.4;
      const cg = c.createGain(); cg.gain.value = 0.035;
      const lfo2 = c.createOscillator(); lfo2.frequency.value = 0.7;
      const lg2 = c.createGain(); lg2.gain.value = 0.015;
      lfo2.connect(lg2).connect(cg.gain);
      crowd.connect(cb).connect(cg).connect(out);
      [wind, crowd, lfo, lfo2].forEach(n => n.start(t0));
      const radio = setInterval(() => { if (Math.random() < 0.45) Sound.quindar(0.06); }, 3800);
      ambientNodes = { out, srcs: [wind, crowd, lfo, lfo2], radio };
    },
    stopAmbient() {
      if (!ambientNodes || !ctx) return;
      const { out, srcs, radio } = ambientNodes;
      clearInterval(radio);
      const t0 = ctx.currentTime;
      out.gain.cancelScheduledValues(t0);
      out.gain.setValueAtTime(out.gain.value, t0);
      out.gain.exponentialRampToValueAtTime(0.0001, t0 + 1);
      srcs.forEach(n => { try { n.stop(t0 + 1.1); } catch { /* 이미 멈춤 */ } });
      ambientNodes = null;
    },
    // 관제 무전 시작/끝 신호음
    quindar(vol = 0.1) {
      tone(2525, 0.25, { type: 'sine', vol });
      tone(2475, 0.25, { type: 'sine', vol, delay: 0.9 });
    },
    // 이송 차량 엔진 소리
    truck(seconds) {
      const c = ensure();
      if (!c) return;
      const t0 = c.currentTime;
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 42;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 180;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.8);
      g.gain.setValueAtTime(0.16, t0 + seconds - 1);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
      o.connect(f).connect(g).connect(master);
      o.start(t0); o.stop(t0 + seconds + 0.1);
    },
    // 기립 장치 유압 소리
    hydraulic(seconds) {
      const c = ensure();
      if (!c) return;
      const t0 = c.currentTime;
      const o = c.createOscillator(); o.type = 'square';
      o.frequency.setValueAtTime(110, t0);
      o.frequency.linearRampToValueAtTime(150, t0 + seconds);
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 400; f.Q.value = 3;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.5);
      g.gain.setValueAtTime(0.07, t0 + seconds - 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
      o.connect(f).connect(g).connect(master);
      o.start(t0); o.stop(t0 + seconds + 0.1);
      tone(90, 0.6, { type: 'triangle', vol: 0.3, delay: seconds - 0.2 }); // "철컥" 고정
    },
    // 관람객 환호와 박수
    cheer() {
      const c = ensure();
      if (!c) return;
      const t0 = c.currentTime;
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c, 9, 'white');
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 0.9;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.32, t0 + 1.2);
      g.gain.setValueAtTime(0.32, t0 + 4);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 9);
      src.connect(bp).connect(g).connect(master);
      src.start(t0);
      // 박수: 짧은 잡음을 여러 번
      const clapBuf = noiseBuffer(c, 0.05, 'white');
      for (let i = 0; i < 160; i++) {
        const t = t0 + 0.8 + Math.random() * 7;
        const b = c.createBufferSource(); b.buffer = clapBuf;
        const h = c.createBiquadFilter(); h.type = 'bandpass'; h.frequency.value = 1500 + Math.random() * 1500;
        const cg = c.createGain(); cg.gain.setValueAtTime(0.05 + Math.random() * 0.05, t); cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        b.connect(h).connect(cg).connect(master);
        b.start(t);
      }
    },
    // 분리 장치 터지는 소리
    pyro() {
      const c = ensure();
      if (!c) return;
      const t0 = c.currentTime;
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c, 0.5, 'white');
      const g = c.createGain();
      g.gain.setValueAtTime(0.5, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
      src.connect(g).connect(master);
      src.start(t0);
    },
    chime() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.8, { delay: 0.3 + i * 0.15, type: 'sine', vol: 0.15 })); },
    // 녹음한 목소리 재생(녹화 때 함께 담기도록 master로 보냄)
    async playBlob(blob) {
      const c = ensure();
      if (!c) return;
      const buf = await c.decodeAudioData(await blob.arrayBuffer());
      const src = c.createBufferSource();
      src.buffer = buf;
      const g = c.createGain(); g.gain.value = 1.4;
      src.connect(g).connect(master);
      src.start();
    },

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
