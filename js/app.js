// 화면 전체를 묶는 코드: 반별 진행 상황 저장, 부품 버튼, 설정, 발사.
(function () {
  const D = window.ROCKET_DATA;
  const KEY = 'gnRocket.v1';
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

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
  }, store.settings || {});
  store.progress = store.progress || {};
  store.current = Math.min(store.current || 0, store.settings.classes.length - 1);
  let teacher = false;

  const S = () => store.settings;
  const cls = () => S().classes[store.current];
  const schoolOf = c => S().schools[c.school] || '';
  const prog = () => (store.progress[store.current] = store.progress[store.current] || { arrived: {}, launched: null });
  const total = D.parts.length;
  const count = () => D.parts.filter(p => prog().arrived[p.no]).length;
  const fmtTime = ts => { const d = new Date(ts); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

  Sound.setEnabled(S().sound);

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
    if (!b) return;
    store.current = +b.dataset.i;
    save();
    refresh(null);
  };

  // ── 부품 버튼 ──
  function renderParts() {
    const a = prog().arrived;
    $('#partGrid').innerHTML = [...D.parts].sort((x, y) => x.no - y.no).map(p => `
      <button class="part ${a[p.no] ? 'on' : ''}" data-no="${p.no}">
        <span class="no">${p.no}</span>
        <span class="nm">${esc(p.name)}</span>
        <span class="rg">📍 ${esc(p.region)}${teacher && p.company ? ` · ${esc(p.company)}` : ''}</span>
        <span class="st">${a[p.no] ? `✅ 도착 ${fmtTime(a[p.no])}` : '⏳ 기다리는 중'}</span>
      </button>`).join('');
    const n = count();
    $('#countText').textContent = `${n} / ${total}`;
    $('#barFill').style.width = `${(n / total) * 100}%`;
    $('#launchBtn').hidden = n < total;
    $('#launchBtn').textContent = prog().launched ? '🔁 발사 장면 다시 보기' : '🔥 발사 준비 완료! 눌러서 카운트다운 시작';
  }

  $('#partGrid').onclick = e => {
    const b = e.target.closest('.part');
    if (!b) return;
    Sound.unlock();
    const no = +b.dataset.no;
    const p = D.parts.find(x => x.no === no);
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
    a[no] = Date.now();
    save();
    refresh(no);
    Sound.arrive();
    banner(`⭐ ${p.region}에서 ${p.name} 도착!`);
    if (count() === total) setTimeout(() => { Sound.complete(); banner('🎉 모든 부품 도착! 발사 준비 완료'); }, 1300);
  };

  let bannerTimer;
  function banner(text) {
    const b = $('#banner');
    b.textContent = text;
    b.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => b.classList.remove('show'), 2600);
  }

  // ── 발사 ──
  function launch() {
    Sound.unlock();
    const c = cls();
    new Cinema({
      school: schoolOf(c),
      className: c.name,
      countdown: S().countdown,
      onClose: () => refresh(null),
    });
    if (count() === total && !prog().launched) { prog().launched = Date.now(); save(); }
  }
  $('#launchBtn').onclick = launch;

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
  $('#settingsBtn').onclick = () => {
    $('#setSchools').innerHTML = S().schools.map((s, i) => `<div class="row">학교 ${i + 1} <input data-school="${i}" value="${esc(s)}" size="22"></div>`).join('');
    $('#setClasses').innerHTML = S().classes.map((c, i) => `
      <div class="row">반 ${i + 1}
        <select data-cs="${i}">${S().schools.map((s, j) => `<option value="${j}" ${j === c.school ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>
        <input data-cn="${i}" value="${esc(c.name)}" size="10" placeholder="예: 5학년 1반">
      </div>`).join('');
    $('#setCountdown').value = S().countdown;
    $('#setSound').checked = S().sound;
    dlg.showModal();
  };
  $('#saveSettings').onclick = () => {
    dlg.querySelectorAll('[data-school]').forEach(i => { S().schools[+i.dataset.school] = i.value.trim() || S().schools[+i.dataset.school]; });
    dlg.querySelectorAll('[data-cs]').forEach(s => { S().classes[+s.dataset.cs].school = +s.value; });
    dlg.querySelectorAll('[data-cn]').forEach(i => { S().classes[+i.dataset.cn].name = i.value.trim() || S().classes[+i.dataset.cn].name; });
    S().countdown = Math.max(3, Math.min(30, +$('#setCountdown').value || 10));
    S().sound = $('#setSound').checked;
    Sound.setEnabled(S().sound);
    save();
    refresh(null);
  };
  $('#previewLaunch').onclick = () => { dlg.close(); Sound.unlock(); const c = cls(); new Cinema({ school: schoolOf(c), className: c.name, countdown: S().countdown, onClose: () => refresh(null) }); };
  $('#resetClass').onclick = () => {
    const c = cls();
    if (!confirm(`${schoolOf(c)} ${c.name}의 부품 도착 기록을 모두 지울까요?`)) return;
    store.progress[store.current] = { arrived: {}, launched: null };
    save(); refresh(null);
  };
  $('#resetAll').onclick = () => {
    if (!confirm('4개 반의 기록을 모두 지울까요? 되돌릴 수 없어요.')) return;
    store.progress = {};
    save(); refresh(null);
  };

  // 키보드: 1~9, 0(10), -(11), =(12)로 부품 도착, 스페이스로 발사
  document.addEventListener('keydown', e => {
    if (dlg.open || document.querySelector('.cinema') || e.target.matches('input, select')) return;
    const keys = '1234567890-=';
    const i = keys.indexOf(e.key);
    if (i >= 0 && $('#view-rocket').classList.contains('active')) document.querySelector(`.part[data-no="${i + 1}"]`)?.click();
    if (e.key === ' ' && !$('#launchBtn').hidden) { e.preventDefault(); launch(); }
  });

  function refresh(animateNo) {
    renderClasses();
    renderParts();
    RocketView.set(prog().arrived, animateNo);
    if ($('#view-map').classList.contains('active')) MapView.render();
  }

  RocketView.build($('#rocketSvg'), D.parts);
  MapView.init($('#mapSvg'), $('#mapPanel'), $('#mapNav'), D, window.GN_MAP, { state: () => ({ arrived: prog().arrived, teacher }) });
  refresh(null);
})();
