// 안내 방송 목소리: 컴퓨터에 깔린 한국어 음성(윈도우 'Heami', 크롬 'Google 한국의' 등)으로 읽습니다.
// 선생님이 카운트다운을 직접 녹음해 두면 그 목소리를 대신 틀어 줍니다(영상 저장 때도 함께 담깁니다).
(function () {
  const synth = window.speechSynthesis;
  let voice = null;
  let sub = null;
  let recording = null;   // 녹음한 카운트다운(Blob)
  let enabled = true;

  function pickVoice() {
    if (!synth) return;
    const ko = synth.getVoices().filter(v => /^ko/i.test(v.lang));
    voice = ko.find(v => /Heami|SunHi|InJoon|Google/i.test(v.name)) || ko[0] || null;
  }
  if (synth) { pickVoice(); synth.onvoiceschanged = pickVoice; }

  // ── 녹음 저장(IndexedDB) ──
  function db() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('gnRocketVoice', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('clips');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  async function loadRecording() {
    try {
      const d = await db();
      recording = await new Promise(res => {
        const q = d.transaction('clips').objectStore('clips').get('countdown');
        q.onsuccess = () => res(q.result || null);
        q.onerror = () => res(null);
      });
    } catch { recording = null; }
  }
  async function saveRecording(blob) {
    recording = blob;
    try {
      const d = await db();
      const tx = d.transaction('clips', 'readwrite');
      if (blob) tx.objectStore('clips').put(blob, 'countdown');
      else tx.objectStore('clips').delete('countdown');
    } catch { /* 저장이 안 되면 이번 실행에서만 사용 */ }
  }
  loadRecording();

  const NUM = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구', '십'];

  const Voice = {
    setEnabled(v) { enabled = v; if (!v) this.cancel(); },
    available() { return !!(synth && voice); },
    voiceName() { return voice ? voice.name : ''; },

    say(text, urgent = false, slow = false) {
      sub = { text, until: performance.now() + Math.max(2600, text.length * 150) };
      if (!enabled || !synth) return;
      if (urgent) synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR';
      if (voice) u.voice = voice;
      u.rate = slow ? 0.92 : 1.05;
      u.pitch = 1;
      u.volume = 1;
      synth.speak(u);
    },
    // 누리호 중계처럼 "십, 구, 팔 …" 하고 셉니다.
    count(n) {
      const w = n <= 10 ? NUM[n] : String(n);
      sub = { text: `${n}`, until: performance.now() + 900 };
      if (!enabled || !synth) return;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(w);
      u.lang = 'ko-KR';
      if (voice) u.voice = voice;
      u.rate = 1.15;
      synth.speak(u);
    },
    cancel() { sub = null; if (synth) synth.cancel(); },
    current() { return sub && performance.now() < sub.until ? sub.text : null; },

    // ── 선생님 목소리 녹음 ──
    hasRecording() { return enabled && !!recording; },
    async playRecording() { if (recording && enabled) Sound.playBlob(recording); },
    async clearRecording() { await saveRecording(null); },
    async preview() { if (recording) Sound.playBlob(recording); },

    // seconds초 동안 녹음합니다. onTick(남은 초)으로 화면에 숫자를 보여 줍니다.
    async record(seconds, onTick) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = e => e.data.size && chunks.push(e.data);
      const done = new Promise(res => { rec.onstop = res; });
      rec.start();
      for (let i = seconds; i >= 0; i--) {
        onTick && onTick(i);
        if (i > 0) await new Promise(r => setTimeout(r, 1000));
      }
      await new Promise(r => setTimeout(r, 700)); // "발사!"가 잘리지 않게 조금 더
      rec.stop();
      await done;
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
      await saveRecording(blob);
      return blob;
    },
  };

  window.Voice = Voice;
})();
