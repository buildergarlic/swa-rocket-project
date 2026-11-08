// 화면 전체를 묶는 코드: 반별 진행 상황 저장, 부품 버튼과 번호 입력, 조립 장면, 설정, 발사.
(function () {
  const D = window.ROCKET_DATA;
  const KEY = 'gnRocket.v1';
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const wait = ms => new Promise(r => setTimeout(r, ms));

  // ── 저장 ──
  let memory = null;
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return memory || {}; }
  }
  function save() {
    memory = store;
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* 저장 불가 시 메모리에만 */ }
  }
  const store = load();
  store.settings = Object.assign({
    schools: [...D.schools],
    classes: D.classes.map(c => ({ ...c })),
    countdown: D.countdown,
    sound: true,
    voice: true,
    caption: [...D.caption],
  }, store.settings || {});
  store.progress = store.progress || {};
  store.current = Math.min(store.current || 0, store.settings.classes.length - 1);
  let teacher = false;

  const S = () => store.settings;
  const cls = () => S().classes[store.current];
  const schoolOf = c => S().schools[c.school] || '';
  const prog = () => (store.progress[store.current] = store.progress[store.current] || { arrived: {}, launched: null });
  const total = D.parts.length;
  const partByNo = Object.fromEntries(D.parts.map(p => [p.no, p]));
  const maxNo = Math.max(...D.parts.map(p => p.no));
  const count = () => D.parts.filter(p => prog().arrived[p.no]).length;
  const complete = () => count() === total;
  const fmtTime = ts => { const d = new Date(ts); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

  Sound.setEnabled(S().sound);
  Voice.setEnabled(S().voice);

  // ── 반 선택 ──
  function renderClasses() {
    $('#classes').innerHTML = S().classes.map((c, i) => {
      const p = store.progress[i];
      const n = p ? D.parts.filter(x => p.arrived[x.no]).length : 0;
      return `<button data-i="${i}" class="${i === store.current ? 'active' : ''}">${esc(schoolOf(c).replace(/초등학교$/, '초'))} ${esc(c.name)}<small>${p?.launched ? '🚀 발사 완료' : `${n}/${total}`}</small></button>`;
    }).join('');
  }
  $('#classes').onclick = e => {
    const b = e.target.closest('button');
    if (!b || busy) return;
    store.current = +b.dataset.i;
    save();
    RocketView.reset(0);
    refresh(null);
  };

  // ── 부품 버튼 ──
  function renderParts() {
    const a = prog().arrived;
    const grid = $('#partGrid');
    grid.classList.toggle('many', total > 16);
    grid.innerHTML = [...D.parts].sort((x, y) => x.no - y.no).map(p => `
      <button class="part ${a[p.no] ? 'on' : ''}" data-no="${p.no}" title="${esc(p.name)} · ${esc(p.region)}">
        <span class="no">${p.no}</span>
        <span class="nm">${esc(p.name)}</span>
        <span class="rg">📍 ${esc(p.region)}${teacher && p.company ? ` · ${esc(p.company)}` : ''}</span>
        <span class="st">${a[p.no] ? `✅ ${fmtTime(a[p.no])}` : '⏳ 대기'}</span>
      </button>`).join('');
    const n = count();
    $('#countText').textContent = `${n} / ${total}`;
    $('#barFill').style.width = `${(n / total) * 100}%`;
    $('#launchBtn').hidden = n < total || busy;
    $('#launchBtn').textContent = prog().launched ? '🔁 발사 장면 다시 보기' : '🚀 발사대로 옮겨 발사하기';
  }

  $('#partGrid').onclick = e => {
    const b = e.target.closest('.part');
    if (b) press(+b.dataset.no);
  };

  // ── 부품 도착 처리 ──
  // 여러 부품을 빠르게 눌러도 하나씩 차례로 조립 장면을 보여 줍니다.
  const queue = [];
  let busy = false;

  function press(no) {
    Sound.unlock();
    const p = partByNo[no];
    if (!p) { hint(`${no}번 부품은 없어요 (1~${maxNo}번)`); return; }
    const a = prog().arrived;
    if (a[no]) {
      if (!confirm(`${p.no}번 ${p.name} 도착을 취소할까요?`)) return;
      delete a[no];
      prog().launched = null;
      Sound.undo();
      save();
      refresh(null);
      return;
    }
    if (queue.includes(no)) return;
    a[no] = Date.now();
    save();
    renderClasses();
    renderParts();
    queue.push(no);
    if (!busy) runQueue();
  }

  async function runQueue() {
    busy = true;
    $('#launchBtn').hidden = true;
    while (queue.length) {
      const no = queue.shift();
      await assemble(no);
    }
    busy = false;
    if (complete()) await finale();
    renderParts();
  }

  // 한 부품 조립 장면: 그 자리로 확대 → 부품이 날아와 붙음 → 부품 카드 → 다시 전체
  async function assemble(no) {
    const p = partByNo[no];
    showCard(p);
    await RocketView.focus(no);
    RocketView.set(prog().arrived, no, false);
    Sound.arrive();
    await wait(queue.length ? 1300 : 2300);
    hideCard();
    if (!queue.length) await RocketView.reset(600);
  }

  function showCard(p) {
    const card = $('#partCard');
    card.innerHTML = `
      <div class="pc-no">${p.no}</div>
      <div class="pc-body">
        <div class="pc-zone">${esc(RocketView.zoneName(p.no))}</div>
        <div class="pc-name">${esc(p.name)} 도착!</div>
        ${p.kidRole ? `<div class="pc-role">${esc(p.kidRole)}</div>` : ''}
        <div class="pc-where">📍 ${esc(p.place || p.region)}${p.company ? ` · 🏢 ${esc(p.company)}` : ''}</div>
      </div>`;
    card.classList.add('show');
  }
  function hideCard() { $('#partCard').classList.remove('show'); }

  // 모든 부품이 모이면: 완전체 공개 → 인공위성 탑재
  async function finale() {
    busy = true;
    await RocketView.reset(500);
    Sound.complete();
    banner('🎉 모든 부품 도착! 경남호 완성!', 3000);
    $('#stage').classList.add('reveal');
    await wait(2200);
    const sat = $('#satLoad');
    sat.classList.remove('go');
    void sat.offsetWidth;
    sat.classList.add('go');
    Sound.chime();
    await wait(1600);
    RocketView.set(prog().arrived, null, true);
    banner('🛰️ 인공위성 탑재 완료! 발사 준비가 끝났어요', 3200);
    await wait(1200);
    busy = false;
    renderParts();
  }

  let bannerTimer;
  function banner(text, ms = 2600) {
    const b = $('#banner');
    b.textContent = text;
    b.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => b.classList.remove('show'), ms);
  }
  function hint(text) { banner(text, 1600); }

  // ── 발사 ──
  function launch(opts = {}) {
    Sound.unlock();
    const c = cls();
    new Cinema({
      school: schoolOf(c),
      className: c.name,
      countdown: S().countdown,
      caption: S().caption,
      onClose: () => refresh(null),
      ...opts,
    });
    if (complete() && !prog().launched) { prog().launched = Date.now(); save(); }
  }
  $('#launchBtn').onclick = () => launch();

  // ── 화면 전환 ──
  $('#tabs').onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    document.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('active', x === b));
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `view-${b.dataset.view}`));
    if (b.dataset.view === 'map') MapView.render();
  };

  $('#teacherBtn').onclick = () => {
    if (!teacher && !confirm('강사용 정답(업체 이름과 근거 자료)을 화면에 보여줄까요?\n아이들이 조사를 마친 뒤에 켜 주세요.')) return;
    teacher = !teacher;
    $('#teacherBtn').classList.toggle('on', teacher);
    $('#teacherBtn').textContent = teacher ? '🔓 정답 보는 중' : '🔒 강사용';
    refresh(null);
  };

  $('#fullBtn').onclick = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  };

  // ── 설정 ──
  const dlg = $('#settings');
  function renderVoiceState() {
    const name = Voice.voiceName();
    $('#voiceState').textContent = Voice.hasRecording()
      ? '🎙️ 선생님 목소리로 카운트다운합니다.'
      : name ? `컴퓨터 목소리: ${name}` : '이 컴퓨터에서 한국어 음성을 찾지 못했어요. 숫자와 신호음만 나오거나, 선생님 목소리를 녹음해 주세요.';
    $('#recPreview').hidden = $('#recDelete').hidden = !Voice.hasRecording();
  }
  $('#settingsBtn').onclick = () => {
    $('#setSchools').innerHTML = S().schools.map((s, i) => `<div class="row">학교 ${i + 1} <input data-school="${i}" value="${esc(s)}" size="22"></div>`).join('');
    $('#setClasses').innerHTML = S().classes.map((c, i) => `
      <div class="row">반 ${i + 1}
        <select data-cs="${i}">${S().schools.map((s, j) => `<option value="${j}" ${j === c.school ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>
        <input data-cn="${i}" value="${esc(c.name)}" size="10" placeholder="예: 5학년 1반">
      </div>`).join('');
    $('#setCountdown').value = S().countdown;
    $('#setSound').checked = S().sound;
    $('#setVoice').checked = S().voice;
    $('#setCaption1').value = S().caption[0];
    $('#setCaption2').value = S().caption[1];
    renderVoiceState();
    dlg.showModal();
  };
  $('#saveSettings').onclick = () => {
    dlg.querySelectorAll('[data-school]').forEach(i => { S().schools[+i.dataset.school] = i.value.trim() || S().schools[+i.dataset.school]; });
    dlg.querySelectorAll('[data-cs]').forEach(s => { S().classes[+s.dataset.cs].school = +s.value; });
    dlg.querySelectorAll('[data-cn]').forEach(i => { S().classes[+i.dataset.cn].name = i.value.trim() || S().classes[+i.dataset.cn].name; });
    S().countdown = Math.max(3, Math.min(10, +$('#setCountdown').value || 10));
    S().sound = $('#setSound').checked;
    S().voice = $('#setVoice').checked;
    S().caption = [$('#setCaption1').value.trim() || D.caption[0], $('#setCaption2').value.trim() || D.caption[1]];
    Sound.setEnabled(S().sound);
    Voice.setEnabled(S().voice);
    save();
    refresh(null);
  };
  $('#voiceTest').onclick = () => { Sound.unlock(); Voice.say('경남호 발사 십 초 전. 십, 구, 팔.'); };
  $('#recStart').onclick = async () => {
    const n = Math.max(3, Math.min(10, +$('#setCountdown').value || 10));
    if (!confirm(`녹음을 시작하면 화면에 숫자가 ${n}부터 하나씩 나와요.\n숫자에 맞춰 "${n}, ${n - 1}, … 1, 발사!" 하고 크게 말해 주세요.`)) return;
    const out = $('#recCount');
    try {
      Sound.unlock();
      await Voice.record(n, i => { out.textContent = i > 0 ? i : '발사!'; Sound.beep(i === 0); });
      out.textContent = '✅ 녹음 완료';
    } catch (err) {
      console.error(err);
      out.textContent = '마이크를 사용할 수 없어요. 마이크 연결과 브라우저 권한을 확인해 주세요.';
    }
    renderVoiceState();
  };
  $('#recPreview').onclick = () => { Sound.unlock(); Voice.preview(); };
  $('#recDelete').onclick = async () => { await Voice.clearRecording(); $('#recCount').textContent = ''; renderVoiceState(); };
  $('#previewLaunch').onclick = () => { dlg.close(); launch(); };
  $('#previewQuick').onclick = () => { dlg.close(); launch({ skipPre: true }); };
  $('#resetClass').onclick = () => {
    const c = cls();
    if (!confirm(`${schoolOf(c)} ${c.name}의 부품 도착 기록을 모두 지우고 처음부터 시작할까요?`)) return;
    store.progress[store.current] = { arrived: {}, launched: null };
    save(); refresh(null);
  };
  $('#resetAll').onclick = () => {
    if (!confirm('4개 반의 기록을 모두 지울까요? 되돌릴 수 없어요.')) return;
    store.progress = {};
    save(); refresh(null);
  };

  // ── 교사 PC 키보드: 숫자를 치면 그 번호 부품이 도착합니다 ──
  // 한 자리 숫자를 치고 잠깐 기다리거나 Enter, 두 자리는 연달아(예: 2 → 7 = 27번).
  let typed = '';
  let typedTimer;
  function showTyped() {
    const box = $('#numInput');
    box.textContent = typed ? `${typed}번` : '';
    box.classList.toggle('show', !!typed);
  }
  function commitTyped() {
    clearTimeout(typedTimer);
    const n = parseInt(typed, 10);
    typed = '';
    showTyped();
    if (n) press(n);
  }
  document.addEventListener('keydown', e => {
    if (dlg.open || document.querySelector('.cinema') || e.target.matches('input, select, textarea')) return;
    if (!$('#view-rocket').classList.contains('active')) return;
    const d = e.key.length === 1 && e.key >= '0' && e.key <= '9' ? e.key : null;
    if (d) {
      e.preventDefault();
      typed = (typed + d).slice(-2);
      showTyped();
      clearTimeout(typedTimer);
      // 더 칠 수 없는 번호면 바로, 아니면 잠깐 기다렸다가 입력
      if (parseInt(typed, 10) * 10 > maxNo || typed.length === 2) typedTimer = setTimeout(commitTyped, 250);
      else typedTimer = setTimeout(commitTyped, 1100);
    } else if (e.key === 'Enter' && typed) commitTyped();
    else if (e.key === 'Backspace' || e.key === 'Escape') { typed = ''; showTyped(); }
    else if (e.key === ' ' && !$('#launchBtn').hidden) { e.preventDefault(); launch(); }
  });

  function refresh(animateNo) {
    renderClasses();
    renderParts();
    RocketView.set(prog().arrived, animateNo, complete());
    $('#stage').classList.toggle('reveal', complete());
    if ($('#view-map').classList.contains('active')) MapView.render();
  }

  RocketView.build($('#rocketSvg'), D.parts);
  MapView.init($('#mapSvg'), $('#mapPanel'), $('#mapNav'), D, window.GN_MAP, { state: () => ({ arrived: prog().arrived, teacher }) });
  $('#maxNo').textContent = maxNo;
  refresh(null);
})();
