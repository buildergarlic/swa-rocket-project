// 발사 영상: 전체 화면 캔버스에 이송 → 기립 → 카운트다운 → 점화 → 상승 → 단 분리 → 페어링 분리
// → 인공위성 분리 → 불꽃놀이와 축하 자막을 그립니다.
// 모든 장면과 글자를 캔버스에 그리기 때문에 그대로 영상 파일로 녹화할 수 있습니다.
(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const mix = (c1, c2, t) => c1.map((v, i) => Math.round(lerp(v, c2[i], t)));
  const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const rand = (a, b) => a + Math.random() * (b - a);

  // 시간표(초, 점화 시점 T=0 기준)
  const LIFTOFF = 1.2;     // 엔진 점화 후 발사대를 떠나는 순간
  const CUT_WIDE = 2.6;    // 엔진 클로즈업 → 추적 화면
  const SEPARATION = 12.5; // 1단 분리
  const FAIRING = 15.5;    // 페어링(머리 덮개) 분리
  const ENGINE2_OFF = 18.3; // 2단 엔진 정지
  const SAT_SEP = 19.3;    // 인공위성 분리
  const FIREWORKS = 23;    // 불꽃놀이 시작
  const CAPTION = 24;      // 축하 자막
  const BUTTONS = 27;      // 버튼 표시
  const RECORD_END = 36;   // 녹화 종료
  // 발사 전 준비(카운트다운 시작 전 초): 이송 → 기립 → 안내 방송
  const PRE = 13;

  const alt = T => (T < LIFTOFF ? 0 : 30 * Math.pow(T - LIFTOFF, 2.5));
  const vel = T => (T < LIFTOFF ? 0 : 75 * Math.pow(T - LIFTOFF, 1.5));
  // 화면에 보여 줄 고도·속도(누리호 목표 궤도 약 700km, 궤도 속도 약 27,000km/h를 짧게 줄인 값)
  const displayKm = T => (T < LIFTOFF ? 0 : 700 * Math.pow(clamp((T - LIFTOFF) / 21, 0, 1), 2.6));
  const displayKmh = T => (T < LIFTOFF ? 0 : 27000 * Math.pow(clamp((T - LIFTOFF) / (19.3 - LIFTOFF), 0, 1), 1.3));

  function makeSprite(color, size = 128) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grd.addColorStop(0, rgb(color, 1));
    grd.addColorStop(0.4, rgb(color, 0.6));
    grd.addColorStop(1, rgb(color, 0));
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
    return c;
  }

  function ridge(n, base, amp) {
    const pts = [];
    let y = base;
    for (let i = 0; i <= n; i++) {
      y = clamp(y + rand(-amp, amp), base - amp * 2.5, base + amp * 1.2);
      pts.push(y);
    }
    return pts;
  }

  class Cinema {
    constructor(opts) {
      this.opts = opts;
      this.countdown = Math.max(3, opts.countdown || 10);
      this.quality = 1;
      this.build();
      this.reset();
      this.loop = this.loop.bind(this);
      this.onResize = this.resize.bind(this);
      window.addEventListener('resize', this.onResize);
      this.resize();
      this.raf = requestAnimationFrame(this.loop);
    }

    build() {
      const root = document.createElement('div');
      root.className = 'cinema';
      root.innerHTML = `
        <canvas></canvas>
        <button class="cine-close" title="닫기">✕</button>
        <button class="cine-hold" title="카운트다운 멈춤 (스페이스)">⏸ 카운트다운 멈춤</button>
        <div class="cine-rec" hidden>● 영상 녹화 중… 끝날 때까지 기다려 주세요</div>
        <div class="cine-actions" hidden>
          <button data-act="replay">🔁 다시 보기</button>
          <button data-act="record">🎬 영상 파일로 저장</button>
          <button data-act="close">닫기</button>
        </div>`;
      document.body.appendChild(root);
      this.root = root;
      this.canvas = root.querySelector('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.actions = root.querySelector('.cine-actions');
      this.recBadge = root.querySelector('.cine-rec');
      root.querySelector('.cine-close').onclick = () => this.close();
      this.holdBtn = root.querySelector('.cine-hold');
      this.holdBtn.onclick = () => this.toggleHold();
      this.onKey = e => { if (e.key === ' ') { e.preventDefault(); this.toggleHold(); } if (e.key === 'Escape') this.close(); };
      document.addEventListener('keydown', this.onKey);
      root.requestFullscreen?.().catch(() => {});
      this.actions.onclick = e => {
        const act = e.target.closest('button')?.dataset.act;
        if (act === 'replay') this.restart(false);
        if (act === 'record') this.restart(true);
        if (act === 'close') this.close();
      };
      if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
        root.querySelector('[data-act="record"]').hidden = true;
      }

      this.smokeSprite = makeSprite([235, 235, 240]);
      this.warmSprite = makeSprite([255, 150, 60]);
      this.graySprite = makeSprite([150, 150, 160]);
      this.cloudSprite = makeSprite([255, 236, 230]);

      this.far = ridge(40, 0.0, 0.025);
      this.near = ridge(28, 0.0, 0.04);
      this.stars = Array.from({ length: 260 }, () => ({ x: Math.random(), y: Math.random(), r: rand(0.4, 1.8), tw: rand(0, 6.28) }));
      this.clouds = Array.from({ length: 46 }, () => ({
        x: rand(-2600, 2600), y: rand(2300, 5200), w: rand(260, 900),
        puffs: Array.from({ length: 6 }, () => ({ dx: rand(-0.5, 0.5), dy: rand(-0.12, 0.12), r: rand(0.25, 0.45) })),
      }));
    }

    reset() {
      this.start = performance.now();
      this.last = this.start;
      this.particles = [];
      this.fireworks = [];
      this.confetti = [];
      this.flash = 0;
      this.events = {};
      this.nextFirework = 0;
      this.fpsAvg = 16;
      this.lastBeep = null;
      this.actions.hidden = true;
      this.lower = null;
      this.fairing = null;
      this.sat = null;
      this.paused = null;
      this.holdBtn.textContent = '⏸ 카운트다운 멈춤';
      window.Voice && Voice.cancel();
      window.Sound && Sound.stopAmbient();
    }

    // 실제 발사처럼 카운트다운을 잠시 멈출 수 있습니다(홀드).
    toggleHold() {
      const T = this.time(performance.now());
      if (T > 0) return;
      if (this.paused == null) {
        this.paused = performance.now();
        this.holdBtn.textContent = '▶ 카운트다운 다시 시작';
        Voice.cancel();
        Voice.say('카운트다운을 잠시 멈춥니다.');
      } else {
        this.start += performance.now() - this.paused;
        this.paused = null;
        this.holdBtn.textContent = '⏸ 카운트다운 멈춤';
        this.lastBeep = null;
      }
    }

    time(now) {
      const t = this.paused != null ? this.paused : now;
      return (t - this.start) / 1000 - this.countdown - (this.opts.skipPre ? 0 : PRE);
    }

    restart(record) {
      this.stopRecording(false);
      this.reset();
      if (record) this.startRecording();
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let w = window.innerWidth * dpr;
      let h = window.innerHeight * dpr;
      if (this.recording) { w = 1920; h = 1080; }
      const maxArea = 1920 * 1080;
      if (w * h > maxArea) { const s = Math.sqrt(maxArea / (w * h)); w *= s; h *= s; }
      this.canvas.width = Math.round(w);
      this.canvas.height = Math.round(h);
      this.W = this.canvas.width;
      this.H = this.canvas.height;
      this.u = this.H / 1080;
    }

    // ───────── 녹화 ─────────
    startRecording() {
      try {
        this.recording = true;
        this.resize();
        const stream = this.canvas.captureStream(30);
        const audio = window.Sound && Sound.recordStream();
        if (audio) audio.getAudioTracks().forEach(t => stream.addTrack(t));
        // 윈도우 기본 플레이어에서도 열리도록 H.264 mp4를 먼저 고릅니다.
        const types = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4;codecs=avc1', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
        const mime = types.find(t => MediaRecorder.isTypeSupported(t)) || '';
        this.recMime = mime;
        this.chunks = [];
        this.recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 8_000_000 } : undefined);
        this.recorder.ondataavailable = e => e.data.size && this.chunks.push(e.data);
        this.recorder.onstop = () => this.saveRecording();
        this.recorder.start(500);
        this.recBadge.hidden = false;
      } catch (err) {
        console.error(err);
        this.recording = false;
        alert('이 브라우저에서는 영상 저장을 할 수 없어요. 크롬 브라우저에서 다시 시도해 주세요.');
      }
    }

    stopRecording(save = true) {
      if (!this.recorder) return;
      this.saveOnStop = save;
      if (this.recorder.state !== 'inactive') this.recorder.stop();
      this.recorder = null;
      this.recording = false;
      this.recBadge.hidden = true;
      this.resize();
    }

    saveRecording() {
      if (!this.saveOnStop || !this.chunks.length) return;
      const type = (this.recMime || 'video/webm').split(';')[0];
      const ext = type.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(this.chunks, { type });
      const a = document.createElement('a');
      const name = `${this.opts.school || '로켓'}_${this.opts.className || ''}_로켓발사.${ext}`.replace(/\s+/g, '');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
    }

    close() {
      this.stopRecording(false);
      cancelAnimationFrame(this.raf);
      document.removeEventListener('keydown', this.onKey);
      Voice.cancel();
      Sound.stopAmbient();
      if (document.fullscreenElement === this.root) document.exitFullscreen?.();
      window.removeEventListener('resize', this.onResize);
      this.root.remove();
      this.opts.onClose && this.opts.onClose();
    }

    // ───────── 카메라 ─────────
    camera(T, A) {
      const zBase = (this.H * 0.6) / 520;
      const C = this.countdown;
      if (T < -C) {
        // 이송·기립 장면: 넓게 보다가 발사대 쪽으로 천천히 이동
        const p = smooth(-(C + PRE), -(C + 7), T);
        return { x: lerp(-520, 60, p), y: lerp(200, 280, smooth(-(C + 7), -C, T)), z: zBase * lerp(0.62, 0.78, smooth(-(C + 7), -C, T)), shot: 0 };
      }
      if (T < 0) {
        const p = clamp((T + this.countdown) / this.countdown, 0, 1);
        return { x: lerp(60, 10, p), y: lerp(280, 260, p), z: zBase * lerp(0.78, 0.98, smooth(0, 1, p)), shot: 1 };
      }
      if (T < CUT_WIDE) {
        // 엔진 클로즈업: 아래에서 올려다보는 느낌
        return { x: -10, y: 70 + A * 0.9, z: zBase * lerp(2.5, 2.25, T / CUT_WIDE), shot: 2 };
      }
      const f = smooth(CUT_WIDE, 4.2, T);
      const zoom = 1.05 - 0.5 * smooth(4.5, 11, T) - 0.25 * smooth(12, 17, T) + 0.45 * smooth(SAT_SEP - 1, SAT_SEP + 2.5, T);
      // 인공위성이 분리될 때는 위성 쪽으로 다가갑니다
      const satFocus = smooth(FAIRING, SAT_SEP + 1, T) * 260 + (this.sat ? this.sat.dy : 0) * smooth(SAT_SEP, SAT_SEP + 2, T);
      return { x: lerp(40, 0, f), y: 260 + Math.max(0, A - 140) * f + satFocus, z: zBase * zoom, shot: 3 };
    }

    // ───────── 메인 루프 ─────────
    loop(now) {
      this.raf = requestAnimationFrame(this.loop);
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.fpsAvg = lerp(this.fpsAvg, dt * 1000, 0.05);
      this.quality = this.fpsAvg > 34 ? 0.45 : this.fpsAvg > 24 ? 0.7 : 1;
      const T = this.time(now);
      this.holdBtn.hidden = T > 0 || this.recording;
      this.triggers(T);
      this.update(T, dt);
      this.draw(T);
      if (T > BUTTONS && this.actions.hidden && !this.recording) this.actions.hidden = false;
      if (this.recording && T > RECORD_END) this.stopRecording(true);
    }

    once(key, fn) { if (!this.events[key]) { this.events[key] = true; fn(); } }

    triggers(T) {
      const C = this.countdown;
      if (this.paused != null) return;
      if (!this.opts.skipPre) {
        this.once('pre', () => { Sound.ambient(); Sound.truck(PRE - 7); Voice.say('경남호가 발사대로 이동하고 있습니다.'); });
        if (T >= -(C + 7)) this.once('erect', () => { Sound.hydraulic(5); Voice.say('경남호를 발사대에 세웁니다.'); });
        if (T >= -(C + 2.6)) this.once('ready', () => { Sound.quindar(); Voice.say('발사 준비 완료. 카운트다운을 시작합니다.'); });
      } else this.once('pre', () => Sound.ambient());
      if (T >= -C - 0.05) this.once('cd', () => { if (Voice.hasRecording()) Voice.playRecording(); });
      if (T < 0 && T >= -C) {
        const n = Math.ceil(-T);
        if (n !== this.lastBeep) { this.lastBeep = n; Sound.beep(false); if (!Voice.hasRecording()) Voice.count(n); }
      }
      if (T >= 0) this.once('ign', () => { Sound.beep(true); Sound.rumble(18); this.flash = 0.55; if (!Voice.hasRecording()) Voice.say('발사!', true); });
      if (T >= LIFTOFF + 0.4) this.once('cheer', () => Sound.cheer());
      if (T >= 4.5) this.once('v1', () => Voice.say('경남호가 힘차게 날아오릅니다.'));
      if (T >= FAIRING) this.once('fair', () => {
        Sound.pyro();
        Voice.say('페어링 분리.');
        this.fairing = { T0: T };
      });
      if (T >= ENGINE2_OFF) this.once('meco', () => Voice.say('2단 엔진 정지.'));
      if (T >= SAT_SEP) this.once('sat', () => {
        Sound.pyro();
        Sound.chime();
        Voice.say('인공위성 분리 성공! 태양전지판을 펼칩니다.');
        this.sat = { T0: T, dy: 0 };
      });
      if (T >= CUT_WIDE) this.once('cut', () => { this.flash = Math.max(this.flash, 0.35); });
      if (T >= SEPARATION) this.once('sep', () => {
        Sound.boom();
        Voice.say('1단 분리. 2단 엔진 점화.');
        this.flash = 0.5;
        const A = alt(T);
        this.lower = { T0: T, alt0: A, v0: vel(T), x: 0, rot: 0 };
        for (let i = 0; i < 50; i++) this.spawn('spark', rand(-60, 60), A + 200, rand(-400, 400), rand(-300, 300), rand(0.5, 1.2), rand(6, 14));
      });
      if (T >= CAPTION) this.once('cap', () => {
        Sound.fanfare();
        setTimeout(() => { if (this.events.cap) Voice.say(this.captionLines().join(' '), false, true); }, 1600);
        for (let i = 0; i < 180; i++) this.addConfetti(true);
      });
    }

    spawn(kind, x, y, vx, vy, life, size, grow = 0) {
      if (this.particles.length > 1400) return;
      this.particles.push({ kind, x, y, vx, vy, life, max: life, size, grow, rot: rand(0, 6.28), gray: Math.random() < 0.4 });
    }

    update(T, dt) {
      const A = alt(T);
      const q = this.quality;
      const emit = (rate, fn) => { let n = rate * dt * q; while (n > 0) { if (n >= 1 || Math.random() < n) fn(); n -= 1; } };

      if (T < 0) {
        // 산소 배출 증기(발사대에 선 뒤부터)
        if (T > -(this.countdown + 2.5) || this.opts.skipPre)
        emit(26, () => this.spawn('vapor', rand(-55, 55) > 0 ? 60 : -60, rand(150, 330), rand(-60, 60), rand(-30, 5), rand(1.5, 2.8), rand(10, 18), 40));
      } else {
        const groundBlast = 1 - smooth(4, 7, T);
        if (groundBlast > 0) {
          // 발사대에서 옆으로 퍼지는 거대한 연기
          emit(150 * groundBlast, () => {
            const dir = Math.random() < 0.5 ? -1 : 1;
            this.spawn('smoke', rand(-40, 40), rand(-30, 20), dir * rand(150, 750), rand(10, 140), rand(3.5, 7), rand(40, 70), rand(50, 110));
          });
          // 화염 배출구(한쪽)로 뿜어져 나오는 연기 기둥
          emit(60 * groundBlast, () => this.spawn('smoke', rand(260, 320), rand(-40, 0), rand(150, 450), rand(80, 350), rand(3, 6), rand(40, 60), rand(60, 120)));
          emit(70 * groundBlast, () => this.spawn('spark', rand(-30, 30), A - rand(0, 40), rand(-500, 500), rand(-60, 260), rand(0.3, 0.8), rand(3, 7)));
        }
        if (T > LIFTOFF && T < ENGINE2_OFF) {
          const ny = T < SEPARATION ? A : A + 190;
          const trailRate = T < SEPARATION ? 70 : 30;
          emit(trailRate, () => this.spawn('trail', rand(-15, 15), ny - rand(80, 260), rand(-40, 40), rand(-120, -20), rand(4, 7), rand(30, 50), rand(40, 90)));
        }
      }

      for (const p of this.particles) {
        p.life -= dt;
        const drag = p.kind === 'spark' ? 0.6 : 1.4;
        p.vx *= 1 - drag * dt;
        p.vy *= 1 - drag * dt;
        if (p.kind === 'spark') p.vy -= 300 * dt;
        if (p.kind === 'smoke') p.vy += 10 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.size += p.grow * dt;
      }
      this.particles = this.particles.filter(p => p.life > 0);

      if (this.fairing) {
        const t = T - this.fairing.T0;
        this.fairing.open = t;
        this.fairing.alpha = 1 - smooth(2, 4, t);
      }
      if (this.sat) {
        const t = T - this.sat.T0;
        this.sat.dy = 70 * t;              // 로켓에서 천천히 멀어짐
        this.sat.rot = 0.05 * t;
        this.sat.deploy = smooth(0.8, 3, t); // 태양전지판 펼치기
        this.stageDrop = 45 * Math.pow(t, 1.4);
      }
      if (this.lower) {
        const t = T - this.lower.T0;
        this.lower.alt = this.lower.alt0 + this.lower.v0 * t - 0.5 * 2600 * t * t;
        this.lower.x = -60 * t * t;
        this.lower.rot = -0.25 * t * t;
        this.lower.alpha = 1 - smooth(1.5, 4, t);
      }

      // 불꽃놀이
      if (T > FIREWORKS) {
        if (T > this.nextFirework) {
          this.launchFirework();
          this.nextFirework = T + (T > 32 ? rand(0.6, 1.2) : rand(0.25, 0.55));
        }
      }
      const u = this.u;
      for (const fw of this.fireworks) {
        if (fw.shell) {
          fw.y += fw.vy * dt;
          fw.vy += 500 * u * dt;
          if (fw.vy > -80 * u || fw.y < fw.ty) this.burst(fw);
        }
        for (const s of fw.sparks) {
          s.px = s.x; s.py = s.y;
          s.vx *= 1 - 1.3 * dt; s.vy *= 1 - 1.3 * dt;
          s.vy += 120 * u * dt;
          s.x += s.vx * dt; s.y += s.vy * dt;
          s.life -= dt;
        }
        fw.sparks = fw.sparks.filter(s => s.life > 0);
      }
      this.fireworks = this.fireworks.filter(f => f.shell || f.sparks.length);

      for (const c of this.confetti) {
        c.y += c.vy * dt; c.x += c.vx * dt + Math.sin(c.ph + T * 2) * 30 * u * dt;
        c.rot += c.vr * dt;
      }
      this.confetti = this.confetti.filter(c => c.y < this.H + 40);
      if (T > CAPTION && T < 46 && Math.random() < 6 * dt) this.addConfetti(false);

      this.flash = Math.max(0, this.flash - dt * 1.4);
    }

    launchFirework() {
      const u = this.u;
      const colors = [[255, 80, 80], [255, 210, 70], [90, 200, 255], [150, 255, 120], [255, 120, 230], [255, 255, 255], [255, 160, 60]];
      this.fireworks.push({
        shell: true, x: rand(0.1, 0.9) * this.W, y: this.H * 0.95, vy: -rand(900, 1250) * u,
        ty: rand(0.12, 0.5) * this.H, color: colors[Math.floor(Math.random() * colors.length)],
        color2: colors[Math.floor(Math.random() * colors.length)], sparks: [],
      });
    }

    burst(fw) {
      fw.shell = false;
      Sound.pop();
      const u = this.u;
      const n = Math.round(90 * (0.5 + this.quality / 2));
      const power = rand(280, 480) * u;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rand(-0.05, 0.05);
        const sp = power * rand(0.6, 1);
        fw.sparks.push({ x: fw.x, y: fw.y, px: fw.x, py: fw.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(1.2, 2), max: 2, c: i % 3 ? fw.color : fw.color2 });
      }
    }

    addConfetti(top) {
      const u = this.u;
      const colors = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ffffff', '#ff9f1c'];
      this.confetti.push({
        x: rand(0, this.W), y: top ? rand(-this.H * 0.6, -10) : -20, vy: rand(120, 260) * u, vx: rand(-30, 30) * u,
        w: rand(8, 16) * u, h: rand(14, 26) * u, rot: rand(0, 6.28), vr: rand(-6, 6), ph: rand(0, 6.28),
        c: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // ───────── 그리기 ─────────
    draw(T) {
      const { ctx, W, H, u } = this;
      const A = alt(T);
      const cam = this.camera(T, A);
      this.cam = cam;
      // 흔들림
      let shake = 0;
      if (T > 0) shake = (T < CUT_WIDE ? 16 : 11) * (1 - smooth(1, 9, T)) * u;
      if (T > SEPARATION && T < SEPARATION + 0.6) shake = 6 * u;
      const sx = rand(-shake, shake), sy = rand(-shake, shake);
      this.ws = (x, y) => [W / 2 + (x - cam.x) * cam.z + sx, H / 2 - (y - cam.y) * cam.z + sy];

      const space = smooth(1500, 15000, cam.y);
      this.space = space;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      this.drawSky(T, space);
      this.drawEarth(T);
      this.drawLandscape(T, cam, space);
      this.drawClouds(cam, false);
      this.drawTower(T);
      this.drawParticles(['smoke', 'vapor', 'trail'], true);
      this.drawSpotlights(T);

      if (this.lower && this.lower.alpha > 0) {
        ctx.globalAlpha = this.lower.alpha;
        this.drawRocket(this.lower.x, this.lower.alt, 'lower', this.lower.rot);
        ctx.globalAlpha = 1;
      }
      const pose = this.pose(T);
      this.drawTransporter(T, pose, false);
      if (T > -0.2) this.drawEngineFlame(T, A);
      if (this.sat) {
        const t = T - this.sat.T0;
        this.drawRocket(0, A - this.stageDrop, 'upper', -0.06 * t);
        this.drawSatellite(8 * t, A + 362 + this.sat.dy, this.sat.rot, this.sat.deploy);
      } else {
        this.drawRocket(pose.x, A + pose.y, T < SEPARATION ? 'full' : 'upper', pose.rot);
      }
      if (this.fairing && this.fairing.alpha > 0) this.drawFairingHalves(A);
      this.drawTransporter(T, pose, true);
      this.drawParticles(['smoke', 'vapor'], false);
      this.drawParticles(['spark'], false);
      this.drawClouds(cam, true);

      this.drawFireworks();
      this.drawLightFx(T, A);
      this.drawVignette();
      this.drawConfetti();
      this.drawCaption(T);
      if (T < CAPTION) this.drawSubtitle();
      this.drawLetterbox(T);
      this.drawCountdown(T);
    }

    drawSky(T, space) {
      const { ctx, W, H } = this;
      const top = mix([22, 38, 92], [2, 3, 12], space);
      const mid = mix([96, 86, 150], [4, 6, 22], space);
      const hor = mix([255, 158, 92], [8, 14, 40], space);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, rgb(top));
      g.addColorStop(0.55, rgb(mid));
      g.addColorStop(1, rgb(hor));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      const starA = 0.15 + 0.85 * smooth(0.25, 0.9, space);
      ctx.fillStyle = '#fff';
      for (const s of this.stars) {
        const tw = 0.6 + 0.4 * Math.sin(s.tw + T * 3);
        ctx.globalAlpha = starA * tw * (s.y < 0.7 || space > 0.5 ? 1 : 0.3);
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r * this.u * 1.3, 0, 6.28);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 지는 해
      const sunA = 1 - space;
      if (sunA > 0.02) {
        const [x, y] = [W * 0.8, this.horizonY() - H * 0.02];
        const sg = ctx.createRadialGradient(x, y, 0, x, y, H * 0.5);
        sg.addColorStop(0, `rgba(255,240,200,${0.9 * sunA})`);
        sg.addColorStop(0.08, `rgba(255,190,120,${0.6 * sunA})`);
        sg.addColorStop(1, 'rgba(255,120,60,0)');
        ctx.fillStyle = sg;
        ctx.fillRect(0, 0, W, H);
      }
    }

    horizonY() { return this.H * 0.7 + this.cam.y * this.cam.z * 0.12; }

    drawEarth(T) {
      const a = smooth(12.5, 16.5, T);
      if (a <= 0) return;
      const { ctx, W, H } = this;
      const R = W * 1.25;
      const cx = W * 0.5, cy = H + R - H * lerp(0.05, 0.27, a);
      ctx.save();
      ctx.globalAlpha = a;
      const atm = ctx.createRadialGradient(cx, cy, R * 0.97, cx, cy, R * 1.06);
      atm.addColorStop(0, 'rgba(120,200,255,0.9)');
      atm.addColorStop(0.4, 'rgba(70,140,255,0.45)');
      atm.addColorStop(1, 'rgba(40,80,200,0)');
      ctx.fillStyle = atm;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.06, 0, 6.28); ctx.fill();
      const ground = ctx.createLinearGradient(0, cy - R, 0, cy - R + H * 0.4);
      ground.addColorStop(0, '#3f8fd8');
      ground.addColorStop(0.15, '#1f5aa0');
      ground.addColorStop(1, '#0a1e3c');
      ctx.fillStyle = ground;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.28); ctx.fill();
      // 구름 띠
      ctx.globalAlpha = a * 0.18;
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        ctx.ellipse(cx + (i - 4) * W * 0.11, cy - R + H * (0.04 + (i % 3) * 0.03), W * 0.07, H * 0.012, 0, 0, 6.28);
        ctx.fill();
      }
      // 지구 가장자리에서 빛나는 햇빛
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a;
      const fx = cx + R * Math.sin(0.55), fy = cy - R * Math.cos(0.55);
      const fl = ctx.createRadialGradient(fx, fy, 0, fx, fy, H * 0.35);
      fl.addColorStop(0, 'rgba(255,250,230,0.95)');
      fl.addColorStop(0.1, 'rgba(255,220,160,0.4)');
      fl.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = fl;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    drawLandscape(T, cam, space) {
      const { ctx, W, H } = this;
      const hy = this.horizonY();
      if (hy > H * 1.5) return;
      // 먼 산
      const layers = [[this.far, 0, [56, 52, 98]], [this.near, H * 0.05, [26, 26, 52]]];
      for (const [pts, off, col] of layers) {
        ctx.fillStyle = rgb(mix(col, [5, 5, 15], space));
        ctx.beginPath();
        ctx.moveTo(0, H * 2);
        pts.forEach((p, i) => ctx.lineTo((i / (pts.length - 1)) * W, hy + off + p * H - H * 0.04));
        ctx.lineTo(W, H * 2);
        ctx.fill();
      }
      // 바다(남해) 반짝임
      const [, gy] = this.ws(0, -40);
      const seaTop = hy + H * 0.03;
      if (gy > seaTop) {
        const sg = ctx.createLinearGradient(0, seaTop, 0, gy);
        sg.addColorStop(0, 'rgba(255,170,110,0.55)');
        sg.addColorStop(1, 'rgba(30,40,80,0.9)');
        ctx.fillStyle = sg;
        ctx.fillRect(0, seaTop, W, gy - seaTop);
      }
      // 땅
      if (gy < H) {
        const g = ctx.createLinearGradient(0, gy, 0, H);
        g.addColorStop(0, '#20232e');
        g.addColorStop(1, '#0c0d12');
        ctx.fillStyle = g;
        ctx.fillRect(0, gy, W, H - gy + 10);
      }
      // 발사대
      const z = cam.z;
      const [px, py] = this.ws(-280, 0);
      const pg = ctx.createLinearGradient(0, py, 0, py + 40 * z);
      pg.addColorStop(0, '#6d717d');
      pg.addColorStop(1, '#30333c');
      ctx.fillStyle = pg;
      ctx.fillRect(px, py, 560 * z, 40 * z);
      ctx.fillStyle = '#121318';
      const [tx, ty] = this.ws(-70, 0);
      ctx.fillRect(tx, ty, 140 * z, 40 * z);
      // 화염 배출구
      const [fx, fy] = this.ws(230, -5);
      ctx.fillStyle = '#0d0e12';
      ctx.fillRect(fx, fy, 100 * z, 40 * z);
      // 활주로 불빛
      for (let i = -6; i <= 6; i++) {
        const [lx, ly] = this.ws(i * 120, -42);
        ctx.fillStyle = i % 2 ? '#ffcf6b' : '#ff6b6b';
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(T * 4 + i);
        ctx.fillRect(lx, ly, 5 * z, 5 * z);
      }
      ctx.globalAlpha = 1;
    }

    drawTower(T) {
      const { ctx } = this;
      const z = this.cam.z;
      const [bx, by] = this.ws(0, 0);
      if (by < -100) return;
      ctx.save();
      ctx.setTransform(z, 0, 0, z, bx, by);
      ctx.strokeStyle = '#3a3e4a';
      ctx.fillStyle = '#2a2d36';
      ctx.lineWidth = 4;
      const x0 = 120, x1 = 165, h = 560;
      ctx.fillRect(x0 - 4, -h, 6, h);
      ctx.fillRect(x1 - 2, -h, 6, h);
      ctx.beginPath();
      for (let y = 0; y < h; y += 40) {
        ctx.moveTo(x0, -y); ctx.lineTo(x1, -y - 40);
        ctx.moveTo(x1, -y); ctx.lineTo(x0, -y - 40);
        ctx.moveTo(x0, -y); ctx.lineTo(x1, -y);
      }
      ctx.stroke();
      // 연결 팔: 발사 직전 뒤로 젖혀집니다
      const retract = smooth(-3, -1, T);
      for (const yy of [330, 170]) {
        ctx.save();
        ctx.translate(x0, -yy);
        ctx.rotate(-retract * 1.3);
        ctx.fillStyle = '#4a4f5c';
        ctx.fillRect(-58, -6, 58, 12);
        ctx.restore();
      }
      // 꼭대기 경고등
      ctx.fillStyle = Math.sin(T * 5) > 0 ? '#ff3b3b' : '#5a1010';
      ctx.beginPath(); ctx.arc((x0 + x1) / 2, -h - 12, 8, 0, 6.28); ctx.fill();
      // 피뢰침
      ctx.fillRect((x0 + x1) / 2 - 2, -h - 80, 4, 70);
      ctx.restore();
    }

    drawSpotlights(T) {
      const a = 0.16 * (1 - smooth(2, 5, T));
      if (a <= 0) return;
      const { ctx } = this;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const sxw of [-700, 650]) {
        const [x, y] = this.ws(sxw, -40);
        const [tx, ty] = this.ws(0, 300);
        const ang = Math.atan2(ty - y, tx - x);
        const len = Math.hypot(tx - x, ty - y) * 1.4;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(ang);
        const g = ctx.createLinearGradient(0, 0, len, 0);
        g.addColorStop(0, `rgba(220,230,255,${a * 2})`);
        g.addColorStop(1, 'rgba(220,230,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(len, -len * 0.12);
        ctx.lineTo(len, len * 0.12);
        ctx.lineTo(0, 4);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    drawClouds(cam, front) {
      const { ctx } = this;
      const z = cam.z;
      ctx.save();
      ctx.globalAlpha = 1;
      this.clouds.forEach((c, i) => {
        if ((i % 5 === 0) !== front) return;
        const [x, y] = this.ws(c.x, c.y);
        const w = c.w * z * (front ? 1.4 : 1);
        if (x < -w || x > this.W + w || y < -w || y > this.H + w) return;
        ctx.globalAlpha = front ? 0.3 : 0.42;
        for (const p of c.puffs) {
          const r = p.r * w;
          ctx.drawImage(this.cloudSprite, x + p.dx * w - r, y + p.dy * w - r, r * 2, r * 2);
        }
      });
      ctx.restore();
    }

    drawParticles(kinds, back) {
      const { ctx } = this;
      const z = this.cam.z;
      ctx.save();
      for (const p of this.particles) {
        if (!kinds.includes(p.kind)) continue;
        // 연기의 절반은 로켓 뒤에, 절반은 앞에 그려서 깊이감을 줍니다
        if (p.kind !== 'spark' && p.kind !== 'trail' && ((p.rot > 3.14) !== back)) continue;
        const [x, y] = this.ws(p.x, p.y);
        const r = p.size * z;
        if (x < -r || x > this.W + r || y < -r || y > this.H + r) continue;
        const life = p.life / p.max;
        if (p.kind === 'spark') {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = life;
          ctx.fillStyle = `rgb(255,${180 + 60 * life | 0},${80 * life | 0})`;
          ctx.beginPath(); ctx.arc(x, y, Math.max(1, r * 0.4), 0, 6.28); ctx.fill();
          continue;
        }
        ctx.globalCompositeOperation = 'source-over';
        const fadeIn = Math.min(1, (p.max - p.life) * 4);
        const base = p.kind === 'vapor' ? 0.45 : p.kind === 'trail' ? 0.38 : 0.5;
        ctx.globalAlpha = base * life * fadeIn;
        ctx.drawImage(p.gray ? this.graySprite : this.smokeSprite, x - r, y - r, r * 2, r * 2);
        // 불빛을 받아 주황색으로 물든 연기
        const age = p.max - p.life;
        if ((p.kind === 'smoke' || p.kind === 'trail') && age < 1.6) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = (1 - age / 1.6) * 0.3 * fadeIn;
          ctx.drawImage(this.warmSprite, x - r, y - r, r * 2, r * 2);
        }
      }
      ctx.restore();
    }

    drawEngineFlame(T, A) {
      const { ctx } = this;
      const z = this.cam.z;
      const upper = T >= SEPARATION;
      if (upper && T < SEPARATION + 0.8) return; // 2단 점화 전 잠깐 꺼짐
      if (T >= ENGINE2_OFF) return;              // 2단 엔진 정지
      const ny = upper ? A + 190 : A;
      const [nx, sy] = this.ws(0, ny);
      const ign = smooth(-0.2, 0.6, T);
      const thin = smooth(300, 12000, ny); // 높이 올라갈수록 화염이 넓게 퍼짐
      let w = (upper ? 46 : 96) * (1 + thin * 0.8);
      let L = (upper ? 420 : 300) * ign * (1 + thin * 1.8) * rand(0.9, 1.08);
      w *= z; L *= z;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const glow = ctx.createRadialGradient(nx, sy + L * 0.25, 0, nx, sy + L * 0.25, L * 1.4 + 40);
      glow.addColorStop(0, upper ? 'rgba(170,200,255,0.55)' : 'rgba(255,190,90,0.6)');
      glow.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(nx - L * 2 - 60, sy - L - 60, L * 4 + 120, L * 3 + 120);

      const plume = (ww, ll, stops) => {
        const g = ctx.createLinearGradient(0, sy, 0, sy + ll);
        stops.forEach(([o, c]) => g.addColorStop(o, c));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(nx - ww / 2, sy);
        ctx.bezierCurveTo(nx - ww * 0.85, sy + ll * 0.3, nx - ww * 0.3, sy + ll * 0.8, nx, sy + ll);
        ctx.bezierCurveTo(nx + ww * 0.3, sy + ll * 0.8, nx + ww * 0.85, sy + ll * 0.3, nx + ww / 2, sy);
        ctx.closePath();
        ctx.fill();
      };
      if (upper) {
        plume(w, L, [[0, 'rgba(230,240,255,0.95)'], [0.3, 'rgba(140,170,255,0.6)'], [1, 'rgba(80,100,255,0)']]);
        plume(w * 0.5, L * 0.5, [[0, 'rgba(255,255,255,1)'], [1, 'rgba(200,220,255,0)']]);
      } else {
        plume(w * 1.3, L * 1.15, [[0, 'rgba(255,200,120,0.7)'], [0.4, 'rgba(255,110,30,0.45)'], [1, 'rgba(255,50,0,0)']]);
        plume(w, L, [[0, 'rgba(255,245,210,0.95)'], [0.35, 'rgba(255,180,70,0.8)'], [1, 'rgba(255,80,20,0)']]);
        plume(w * 0.55, L * 0.55, [[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,230,150,0)']]);
        // 충격파 무늬(마하 다이아몬드)
        for (let k = 1; k <= 4; k++) {
          ctx.fillStyle = `rgba(255,255,230,${0.55 / k})`;
          ctx.beginPath();
          ctx.ellipse(nx, sy + w * 0.75 * k, w * 0.16, w * 0.09, 0, 0, 6.28);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // 발사 전 로켓의 위치: 눕혀서 옮긴 뒤 발사대에 세웁니다.
    pose(T) {
      const C = this.countdown;
      const tE = -(C + 7), tR = -(C + 2);
      if (this.opts.skipPre || T >= tR) return { x: 0, y: 0, rot: 0 };
      if (T < tE) {
        const p = smooth(-(C + PRE), tE - 0.6, T);
        return { x: lerp(-1900, 0, p), y: 75, rot: -Math.PI / 2 };
      }
      const q = smooth(tE, tR, T);
      return { x: 0, y: lerp(75, 0, q), rot: lerp(-Math.PI / 2, 0, q) };
    }

    // 이송·기립 차량: 로켓을 눕혀 싣고 와서 팔(스트롱백)로 들어 올립니다.
    drawTransporter(T, pose, front) {
      if (this.opts.skipPre) return;
      const C = this.countdown;
      const tE = -(C + 7), tR = -(C + 2);
      const away = smooth(-C + 0.5, -C + 5.5, T);
      if (away >= 1) return;
      const vx = T < tE ? pose.x : -2200 * away * away;
      const { ctx } = this;
      const z = this.cam.z;
      const [bx, by] = this.ws(vx, 0);
      ctx.save();
      ctx.setTransform(z, 0, 0, z, bx, by);
      if (!front) {
        // 들어 올리는 팔: 로켓과 같이 섰다가 다시 눕습니다
        const armRot = T < tR ? pose.rot : lerp(0, -Math.PI / 2, smooth(tR + 0.3, -C + 0.4, T));
        ctx.save();
        ctx.translate(10, -15);
        ctx.rotate(armRot);
        ctx.strokeStyle = '#c9a227';
        ctx.lineWidth = 6;
        ctx.strokeRect(70, -470, 26, 460);
        ctx.beginPath();
        for (let y = -10; y > -470; y -= 46) { ctx.moveTo(70, y); ctx.lineTo(96, y - 46); }
        ctx.stroke();
        ctx.restore();
      } else {
        // 차량 몸체(앞쪽에 그려 바퀴가 보이게)
        ctx.fillStyle = '#d8a31f';
        ctx.fillRect(-600, -15, 650, 26);
        ctx.fillStyle = '#3a3f4c';
        ctx.fillRect(-600, 11, 650, 14);
        // 운전석
        ctx.fillStyle = '#e9e2cf';
        ctx.fillRect(-760, -95, 150, 120);
        ctx.fillStyle = '#5ab0e0';
        ctx.fillRect(-745, -82, 70, 40);
        ctx.fillStyle = '#c1121f';
        ctx.fillRect(-760, -20, 150, 10);
        ctx.fillStyle = '#16181f';
        for (const wx of [-720, -640, -460, -380, -120, -40]) {
          ctx.beginPath(); ctx.arc(wx, 32, 26, 0, 6.28); ctx.fill();
          ctx.fillStyle = '#6b7080';
          ctx.beginPath(); ctx.arc(wx, 32, 10, 0, 6.28); ctx.fill();
          ctx.fillStyle = '#16181f';
        }
        // 경광등
        ctx.fillStyle = Math.sin(T * 9) > 0 ? '#ffb000' : '#5a3a00';
        ctx.beginPath(); ctx.arc(-690, -102, 9, 0, 6.28); ctx.fill();
      }
      ctx.restore();
    }

    drawFairingHalves(A) {
      const { ctx } = this;
      const z = this.cam.z;
      const t = this.fairing.open;
      for (const side of [-1, 1]) {
        const [bx, by] = this.ws(side * (60 + 90 * t * t), A + 330 - 140 * t * t);
        ctx.save();
        ctx.globalAlpha = this.fairing.alpha;
        ctx.setTransform(z, 0, 0, z, bx, by);
        ctx.rotate(side * (0.9 * t));
        const g = ctx.createLinearGradient(-60 * side, 0, 0, 0);
        g.addColorStop(0, '#8f1d22'); g.addColorStop(1, '#ff5a5f');
        ctx.fillStyle = g;
        ctx.beginPath();
        // 반쪽 덮개: 바깥 가장자리(0)에서 가운데(-60*side)까지
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -30);
        ctx.bezierCurveTo(0, -90, -side * 30, -140, -side * 60, -160);
        ctx.lineTo(-side * 60, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    drawSatellite(x, y, rot, deploy) {
      const { ctx } = this;
      const z = this.cam.z;
      const [bx, by] = this.ws(x, y);
      ctx.save();
      ctx.setTransform(z, 0, 0, z, bx, by);
      ctx.rotate(rot);
      // 태양전지판
      const pw = 20 + 210 * deploy;
      for (const s of [-1, 1]) {
        ctx.fillStyle = '#9aa3b5';
        ctx.fillRect(s > 0 ? 34 : -34 - 14, -40, 14, 6);
        const x0 = s > 0 ? 48 : -48 - pw;
        const g = ctx.createLinearGradient(x0, 0, x0 + pw, 0);
        g.addColorStop(0, '#16336b'); g.addColorStop(0.5, '#2f6fd1'); g.addColorStop(1, '#16336b');
        ctx.fillStyle = g;
        ctx.fillRect(x0, -62, pw, 50);
        ctx.strokeStyle = '#9fc4ff';
        ctx.lineWidth = 1.5;
        for (let i = 1; i < pw / 26; i++) { ctx.beginPath(); ctx.moveTo(x0 + i * 26, -62); ctx.lineTo(x0 + i * 26, -12); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(x0, -37); ctx.lineTo(x0 + pw, -37); ctx.stroke();
      }
      // 몸체(금색 단열 포일)
      const gb = ctx.createLinearGradient(-34, 0, 34, 0);
      gb.addColorStop(0, '#8a5a12'); gb.addColorStop(0.45, '#ffd56b'); gb.addColorStop(1, '#7a4c0e');
      ctx.fillStyle = gb;
      ctx.fillRect(-34, -80, 68, 74);
      ctx.strokeStyle = '#ffe9a8';
      ctx.lineWidth = 1;
      ctx.strokeRect(-34, -80, 68, 74);
      // 안테나 접시
      ctx.fillStyle = '#e8ecf3';
      ctx.beginPath(); ctx.ellipse(0, -92, 26, 10, 0, 0, Math.PI); ctx.fill();
      ctx.fillRect(-2, -92, 4, 14);
      // 반짝이는 표시등
      if (Math.sin(performance.now() / 180) > 0) {
        ctx.fillStyle = '#7dffb0';
        ctx.beginPath(); ctx.arc(20, -70, 4, 0, 6.28); ctx.fill();
      }
      ctx.restore();
    }

    drawRocket(x, y, part, rot) {
      const { ctx } = this;
      const z = this.cam.z;
      const [bx, by] = this.ws(x, y);
      ctx.save();
      ctx.setTransform(z, 0, 0, z, bx, by);
      ctx.rotate(rot);
      const cyl = (x0, w, c1, c2) => {
        const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
        g.addColorStop(0, c2); g.addColorStop(0.35, c1); g.addColorStop(0.55, c1); g.addColorStop(1, c2);
        return g;
      };
      const white = cyl(-60, 120, '#ffffff', '#9aa3b5');
      const red = cyl(-60, 120, '#ff5a5f', '#8f1d22');
      const navy = cyl(-60, 120, '#2a4d80', '#0d1b33');

      if (part !== 'upper') {
        // 엔진 노즐
        ctx.fillStyle = cyl(-50, 100, '#8d939f', '#2b2e36');
        ctx.beginPath();
        ctx.moveTo(-32, -50); ctx.lineTo(32, -50); ctx.lineTo(50, 0); ctx.lineTo(-50, 0); ctx.closePath(); ctx.fill();
        // 날개
        ctx.fillStyle = red;
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(s * 58, -150); ctx.lineTo(s * 110, -60); ctx.lineTo(s * 110, -10); ctx.lineTo(s * 58, -55); ctx.closePath(); ctx.fill();
        }
        // 1단 몸체
        ctx.fillStyle = white;
        ctx.fillRect(-60, -200, 120, 150);
        ctx.fillStyle = navy;
        ctx.fillRect(-60, -80, 120, 14);
        ctx.fillRect(-60, -200, 120, 10);
      }
      if (part !== 'lower') {
        if (part === 'upper') {
          ctx.fillStyle = cyl(-26, 52, '#9aa0ab', '#2b2e36');
          ctx.beginPath(); ctx.moveTo(-16, -206); ctx.lineTo(16, -206); ctx.lineTo(26, -186); ctx.lineTo(-26, -186); ctx.closePath(); ctx.fill();
        }
        // 2단 몸체
        ctx.fillStyle = white;
        ctx.fillRect(-60, -330, 120, 126);
        ctx.fillStyle = navy;
        ctx.fillRect(-60, -214, 120, 10);
        if (part === 'upper' && this.fairing) {
          // 페어링이 열린 뒤: 위성 어댑터와(분리 전이면) 위성
          ctx.fillStyle = cyl(-50, 100, '#c7ccd6', '#5b6270');
          ctx.beginPath(); ctx.moveTo(-60, -330); ctx.lineTo(60, -330); ctx.lineTo(36, -362); ctx.lineTo(-36, -362); ctx.closePath(); ctx.fill();
          ctx.restore();
          if (!this.sat) this.drawSatellite(x, y + 362, rot, 0);
          return;
        }
        // 위성 탑재칸
        ctx.fillStyle = cyl(-60, 120, '#e9eef8', '#8a94a8');
        ctx.fillRect(-60, -362, 120, 34);
        ctx.fillStyle = '#163a6b';
        ctx.beginPath(); ctx.arc(0, -345, 11, 0, 6.28); ctx.fill();
        ctx.fillStyle = 'rgba(160,220,255,0.9)';
        ctx.beginPath(); ctx.arc(-3, -348, 4, 0, 6.28); ctx.fill();
        // 노즈콘
        ctx.fillStyle = red;
        ctx.beginPath();
        ctx.moveTo(-60, -360);
        ctx.bezierCurveTo(-60, -420, -30, -470, 0, -490);
        ctx.bezierCurveTo(30, -470, 60, -420, 60, -360);
        ctx.closePath(); ctx.fill();
        // 이름
        ctx.save();
        ctx.translate(8, -268);
        ctx.rotate(Math.PI / 2); // 위에서 아래로 읽기(누워 있을 때도 바로 읽힘)
        ctx.fillStyle = '#1d3557';
        ctx.font = 'bold 30px "Noto Sans KR", "Malgun Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('경남호', 0, 0);
        ctx.restore();
      }
      ctx.restore();
    }

    drawLightFx(T, A) {
      const { ctx, W, H } = this;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      // 점화 직후 화면 전체가 밝게 달아오름
      const heat = T > 0 ? 0.2 * (1 - smooth(2, 8, T)) : 0;
      if (heat > 0) {
        const [x, y] = this.ws(0, A);
        const g = ctx.createRadialGradient(x, y, 0, x, y, H * 0.9);
        g.addColorStop(0, `rgba(255,170,80,${heat})`);
        g.addColorStop(1, 'rgba(255,120,40,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      if (this.flash > 0) {
        ctx.fillStyle = `rgba(255,240,215,${this.flash * 0.85})`;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
    }

    drawFireworks() {
      const { ctx } = this;
      const u = this.u;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (const fw of this.fireworks) {
        if (fw.shell) {
          ctx.fillStyle = 'rgba(255,230,180,0.9)';
          ctx.beginPath(); ctx.arc(fw.x, fw.y, 3 * u, 0, 6.28); ctx.fill();
          ctx.strokeStyle = 'rgba(255,200,120,0.4)';
          ctx.lineWidth = 2 * u;
          ctx.beginPath(); ctx.moveTo(fw.x, fw.y); ctx.lineTo(fw.x, fw.y + 40 * u); ctx.stroke();
        }
        for (const s of fw.sparks) {
          const a = clamp(s.life / 1.4, 0, 1);
          ctx.strokeStyle = rgb(s.c, a);
          ctx.lineWidth = 3 * u;
          ctx.beginPath(); ctx.moveTo(s.px, s.py); ctx.lineTo(s.x, s.y); ctx.stroke();
          if (Math.random() < 0.3) {
            ctx.fillStyle = `rgba(255,255,255,${a})`;
            ctx.fillRect(s.x, s.y, 2 * u, 2 * u);
          }
        }
      }
      ctx.restore();
    }

    drawConfetti() {
      const { ctx } = this;
      ctx.save();
      for (const c of this.confetti) {
        ctx.setTransform(Math.cos(c.rot), Math.sin(c.rot) * 0.4, -Math.sin(c.rot), Math.cos(c.rot * 0.7), c.x, c.y);
        ctx.fillStyle = c.c;
        ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
      }
      ctx.restore();
    }

    drawVignette() {
      const { ctx, W, H } = this;
      const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    text(str, x, y, size, opts = {}) {
      const { ctx } = this;
      ctx.font = `${opts.weight || 900} ${size}px "Noto Sans KR", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif`;
      ctx.textAlign = opts.align || 'center';
      ctx.textBaseline = 'middle';
      if (opts.glow) { ctx.shadowColor = opts.glow; ctx.shadowBlur = size * 0.5; }
      if (opts.stroke) { ctx.lineWidth = size * 0.12; ctx.strokeStyle = opts.stroke; ctx.lineJoin = 'round'; ctx.strokeText(str, x, y); }
      ctx.fillStyle = opts.fill || '#fff';
      ctx.fillText(str, x, y);
      ctx.shadowBlur = 0;
    }

    fitSize(str, size, maxW) {
      const { ctx } = this;
      ctx.font = `900 ${size}px "Noto Sans KR", "Malgun Gothic", sans-serif`;
      const w = ctx.measureText(str).width;
      return w > maxW ? size * maxW / w : size;
    }

    captionLines() {
      const c = this.opts.caption || [];
      return [c[0] || '로켓 발사를 위해 최선을 다한 여러분에게 감사드립니다.', c[1] || '로켓 발사 성공 축하합니다!'];
    }

    // 안내 방송 자막(목소리가 녹화되지 않아도 영상에 글자가 남습니다)
    drawSubtitle() {
      const sub = window.Voice && Voice.current();
      if (!sub) return;
      const { W, H, u } = this;
      const size = this.fitSize(sub, 40 * u, W * 0.8);
      this.text(`📢 ${sub}`, W / 2, H * 0.83, size, { weight: 800, fill: '#ffffff', stroke: 'rgba(0,0,0,0.85)' });
    }

    drawCaption(T) {
      if (T < CAPTION) return;
      const { ctx, W, H, u } = this;
      const a = smooth(CAPTION, CAPTION + 1.2, T);
      const s = lerp(1.25, 1, smooth(CAPTION, CAPTION + 1.4, T));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(W / 2, H * 0.47);
      ctx.scale(s, s);
      const band = ctx.createLinearGradient(-W / 2, 0, W / 2, 0);
      band.addColorStop(0, 'rgba(0,0,30,0)');
      band.addColorStop(0.2, 'rgba(0,0,30,0.55)');
      band.addColorStop(0.8, 'rgba(0,0,30,0.55)');
      band.addColorStop(1, 'rgba(0,0,30,0)');
      ctx.fillStyle = band;
      ctx.fillRect(-W / 2, -H * 0.2, W, H * 0.4);

      const who = `${this.opts.school || ''} ${this.opts.className || ''}`.trim();
      const [line1, line2] = this.captionLines();
      if (who) this.text(who, 0, -H * 0.13, 46 * u, { weight: 700, fill: '#ffe9a8', glow: 'rgba(255,200,80,0.8)' });
      const sz1 = this.fitSize(line1, 74 * u, W * 0.9);
      this.text(line1, 0, -H * 0.045, sz1, { fill: '#ffffff', stroke: 'rgba(0,0,40,0.8)', glow: 'rgba(120,180,255,0.9)' });
      const gold = ctx.createLinearGradient(0, H * 0.02, 0, H * 0.13);
      gold.addColorStop(0, '#fff7d1');
      gold.addColorStop(0.5, '#ffd34d');
      gold.addColorStop(1, '#ff9f1c');
      const sz2 = this.fitSize(line2, 112 * u, W * 0.9);
      this.text(line2, 0, H * 0.075, sz2, { fill: gold, stroke: 'rgba(60,20,0,0.85)', glow: 'rgba(255,170,40,0.9)' });
      ctx.restore();
    }

    drawLetterbox(T) {
      const { ctx, W, H, u } = this;
      const bar = H * 0.085;
      ctx.save();
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, bar);
      ctx.fillRect(0, H - bar, W, bar);
      // 방송 화면 느낌의 정보 표시
      const title = `경남 로켓 발사 · ${this.opts.school || ''} ${this.opts.className || ''}`.trim();
      this.text(title, 40 * u, bar / 2, 30 * u, { align: 'left', weight: 700, fill: '#d8e2ff' });
      if (Math.sin(T * 5) > -0.3) {
        ctx.fillStyle = '#ff3030';
        ctx.beginPath(); ctx.arc(W - 160 * u, bar / 2, 10 * u, 0, 6.28); ctx.fill();
      }
      this.text('LIVE', W - 100 * u, bar / 2, 30 * u, { weight: 900, fill: '#fff' });

      const y = H - bar / 2;
      const t = T < 0 ? `T-${String(Math.ceil(-T)).padStart(2, '0')}` : `T+${String(Math.floor(T)).padStart(2, '0')}`;
      if (this.paused != null) this.text('⏸ 카운트다운 멈춤(홀드)', W / 2, y, 30 * u, { weight: 900, fill: '#ff6b6b' });
      this.text(t, 40 * u, y, 34 * u, { align: 'left', weight: 900, fill: T < 0 ? '#ffcf5a' : '#7dffb0' });
      if (T >= 0) {
        const km = displayKm(T);
        const kmh = Math.round(displayKmh(T));
        this.text(`고도 ${km.toFixed(1)} km`, 230 * u, y, 30 * u, { align: 'left', weight: 700 });
        this.text(`속도 ${kmh.toLocaleString()} km/h`, 520 * u, y, 30 * u, { align: 'left', weight: 700 });
      }
      const C = this.countdown;
      let status = '발사 준비 중';
      if (!this.opts.skipPre && T < -(C + 7)) status = '경남호 발사대로 이송 중';
      else if (!this.opts.skipPre && T < -(C + 2)) status = '경남호 기립 중';
      else if (T < -C) status = '발사 준비 완료';
      if (T >= -3 && T < 0) status = '연결 팔 분리';
      if (T >= 0) status = '엔진 점화!';
      if (T >= LIFTOFF) status = '발사! 하늘로 올라갑니다';
      if (T >= 7) status = '구름을 뚫고 상승 중';
      if (T >= SEPARATION) status = '1단 분리 · 2단 엔진 점화';
      if (displayKm(T) >= 100) status = '고도 100 km 돌파 · 우주 도착!';
      if (T >= FAIRING) status = '페어링 분리';
      if (T >= ENGINE2_OFF) status = '2단 엔진 정지';
      if (T >= SAT_SEP) status = '인공위성 분리 성공 · 태양전지판 전개';
      if (T >= CAPTION) status = '임무 성공!';
      this.text(status, W - 40 * u, y, 30 * u, { align: 'right', weight: 700, fill: '#ffe9a8' });
      ctx.restore();
    }

    drawCountdown(T) {
      const { ctx, W, H, u } = this;
      if (T < -this.countdown) return;
      if (T < 0) {
        const n = Math.ceil(-T);
        const frac = n + T; // 1 → 0
        const s = 1 + 0.35 * Math.pow(frac, 3);
        ctx.save();
        ctx.translate(W * 0.73, H * 0.45);
        ctx.scale(s, s);
        ctx.globalAlpha = clamp(0.35 + frac, 0, 1);
        const col = n <= 3 ? '#ff5757' : '#ffffff';
        this.text(String(n), 0, 0, 300 * u, { fill: col, stroke: 'rgba(0,0,0,0.6)', glow: n <= 3 ? 'rgba(255,60,60,0.9)' : 'rgba(120,180,255,0.8)' });
        ctx.restore();
        this.text('발사 카운트다운', W * 0.73, H * 0.24, 44 * u, { weight: 800, fill: '#d8e2ff', stroke: 'rgba(0,0,0,0.6)' });
      } else if (T < 2.4) {
        const a = 1 - smooth(1.6, 2.4, T);
        ctx.save();
        ctx.globalAlpha = a;
        const s = 1 + T * 0.15;
        ctx.translate(W / 2, H * 0.3);
        ctx.scale(s, s);
        this.text(T < LIFTOFF ? '점화!' : '발사!', 0, 0, 190 * u, { fill: '#fff3c4', stroke: 'rgba(120,30,0,0.8)', glow: 'rgba(255,140,40,1)' });
        ctx.restore();
      }
    }
  }

  window.Cinema = Cinema;
})();
