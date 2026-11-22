/* Said & Done: a warm, private diary. Everything is stored on this device (IndexedDB). */
(() => {
'use strict';

const VERSION = '0.2.0';
const REST_PER_MONTH = 2;
const GLYPH = '<path transform="translate(22.70 92.20) scale(0.0422 -0.0422)" d="M1180.6 -42.6Q1339.4 -42.6 1454.9 28.3Q1570.4 99.2 1633.1 230.6Q1695.8 362 1695.8 543.8Q1695.8 784.4 1610 983.3Q1524.2 1182.2 1374 1322.4Q1248.2 1439.6 1084.7 1504.8Q921.2 1570 741.8 1570Q527.2 1570 379.4 1504Q231.6 1438 154.9 1315.3Q78.2 1192.6 78.2 1022.2Q78.2 927.4 115.9 868.4Q153.6 809.4 215.2 809.4Q270.6 809.4 305.3 845.9Q340 882.4 340 939.8Q340 978.8 331.2 1006.5Q322.4 1034.2 311 1057.4Q299.6 1080.6 290.8 1105.9Q282 1131.2 282 1165.8Q282 1239.8 328.4 1306.3Q374.8 1372.8 475.1 1415Q575.4 1457.2 736.6 1457.2Q892 1457.2 1035 1397.2Q1178 1337.2 1288.2 1232.6Q1424.2 1104.8 1501.5 928.4Q1578.8 752 1578.8 544.8Q1578.8 394.2 1536.3 298.4Q1493.8 202.6 1424.1 157.2Q1354.4 111.8 1272 111.8Q1210.4 111.8 1152.3 141.9Q1094.2 172 1032.8 242.8Q971.4 313.6 897 433.4Q832.8 537 792.7 628.6Q752.6 720.2 733.5 802.9Q714.4 885.6 714.4 960.4Q714.4 1057.8 749.4 1113.5Q784.4 1169.2 843.8 1169.2Q886 1169.2 913.9 1122.4Q941.8 1075.6 941.8 999.2Q941.8 917.6 916.6 856.1Q891.4 794.6 843.1 756.6Q794.8 718.6 726.2 705L739.4 616.4Q870.6 628.2 962.7 675.3Q1054.8 722.4 1103.4 798.6Q1152 874.8 1152 972.2Q1152 1059 1114.7 1125.4Q1077.4 1191.8 1011 1229.7Q944.6 1267.6 856.4 1267.6Q744.8 1267.6 664.3 1215.5Q583.8 1163.4 540.7 1074.1Q497.6 984.8 497.6 872.8Q497.6 765 521.4 664.7Q545.2 564.4 591.8 463.6Q638.4 362.8 706.4 252.4Q767.4 151.8 834.7 86.5Q902 21.2 986.4 -10.7Q1070.8 -42.6 1180.6 -42.6ZM1004 222.2 1041.4 153.6Q1220.6 251.6 1298.3 366.8Q1376 482 1376 602.6Q1376 672.6 1344.9 714.4Q1313.8 756.2 1269.8 756.2Q1221.4 756.2 1187.5 718.4Q1153.6 680.6 1153.6 628.2Q1153.6 601.4 1156.9 582.2Q1160.2 563 1163.3 543.9Q1166.4 524.8 1166.4 497Q1166.4 451.8 1149.5 406Q1132.6 360.2 1096.9 314.2Q1061.2 268.2 1004 222.2ZM568.2 596.8V692.4Q406.2 683 296.2 629.9Q186.2 576.8 129.8 491.3Q73.4 405.8 73.4 299Q73.4 138.8 171.4 54.4Q269.4 -30 446.2 -30Q528.8 -30 598.3 -13.9Q667.8 2.2 724.3 35.4Q780.8 68.6 825 119L777 190.8Q718.8 145.4 665.3 122.3Q611.8 99.2 549.8 99.2Q463 99.2 406 163.5Q349 227.8 349 327.2Q349 399.6 372.1 456.3Q395.2 513 444.1 549.6Q493 586.2 568.2 596.8Z" fill="#FFB627"></path>';

/* ---------- Small helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const fromKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d || 1); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const startOfWeek = (d = new Date()) => { const x = startOfDay(d); const wd = (x.getDay() + 6) % 7; return addDays(x, -wd); };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ICON = {
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>',
  days: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  goal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="#D9502A" aria-hidden="true"><path d="M12.5 2c.5 4.5 5.5 6 5.5 11.5a6 6 0 0 1-12 0c0-2.5 1.2-4.3 2.5-5.5 0 2.2.8 3.5 2 3.5.3-3.5-.5-6 2-9.5z"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>'
};

/* ---------- Storage (IndexedDB) ---------- */
const DB = {
  db: null,
  open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('said-and-done', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        db.createObjectStore('entries', { keyPath: 'id' });
        db.createObjectStore('audio', { keyPath: 'id' });
        db.createObjectStore('goals', { keyPath: 'id' });
        db.createObjectStore('kv', { keyPath: 'key' });
      };
      req.onsuccess = () => { this.db = req.result; resolve(); };
      req.onerror = () => reject(req.error);
    });
  },
  run(store, mode, fn) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, mode);
      const req = fn(tx.objectStore(store));
      let out;
      if (req) req.onsuccess = () => { out = req.result; };
      tx.oncomplete = () => resolve(out);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  },
  all(store) { return this.run(store, 'readonly', (s) => s.getAll()); },
  get(store, key) { return this.run(store, 'readonly', (s) => s.get(key)); },
  put(store, value) { return this.run(store, 'readwrite', (s) => s.put(value)); },
  del(store, key) { return this.run(store, 'readwrite', (s) => s.delete(key)); }
};

const S = { entries: [], goals: [], kv: {}, tab: 'today', calMonth: null, draft: '', draftAudio: null, query: '' };

async function setKV(key, value) { S.kv[key] = value; await DB.put('kv', { key, value }); }

async function load() {
  await DB.open();
  const [entries, goals, kv] = await Promise.all([DB.all('entries'), DB.all('goals'), DB.all('kv')]);
  S.entries = entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  S.goals = goals.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  kv.forEach((r) => { S.kv[r.key] = r.value; });
  S.draft = S.kv.draft || '';
  if (navigator.storage && navigator.storage.persist) {
    try { S.persisted = await navigator.storage.persist(); } catch (e) { S.persisted = false; }
  }
}

/* ---------- Streak with rest days ---------- */
function streakInfo() {
  const written = new Set(S.entries.map((e) => e.day));
  const today = startOfDay();
  const todayKey = dayKey(today);
  const info = { current: 0, longest: 0, rest: new Set(), restLeft: REST_PER_MONTH, written };
  if (!written.size) return info;
  const first = fromKey([...written].sort()[0]);
  const used = {};
  let cur = 0;
  let pending = [];
  for (let d = new Date(first); d <= today; d = addDays(d, 1)) {
    const k = dayKey(d);
    if (written.has(k)) {
      cur += 1;
      pending.forEach((p) => info.rest.add(p));
      pending = [];
      info.longest = Math.max(info.longest, cur);
      continue;
    }
    if (k === todayKey) break; // today is still open
    const m = monthKey(d);
    if (cur > 0 && (used[m] || 0) < REST_PER_MONTH) {
      used[m] = (used[m] || 0) + 1;
      pending.push(k);
    } else {
      pending.forEach((p) => { used[p.slice(0, 7)] -= 1; });
      pending = [];
      cur = 0;
    }
  }
  pending.forEach((p) => info.rest.add(p));
  info.current = cur;
  info.restLeft = REST_PER_MONTH - (used[monthKey(today)] || 0);
  return info;
}

/* ---------- Calendar ---------- */
function monthCells(year, month, marks) {
  const first = new Date(year, month, 1);
  const blanks = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const todayKey = dayKey(new Date());
  let html = WD.map((w) => `<span class="cal-wd" aria-hidden="true">${w[0]}</span>`).join('');
  for (let i = 0; i < blanks; i++) html += '<span class="cal-cell"></span>';
  for (let d = 1; d <= days; d++) {
    const k = `${year}-${pad(month + 1)}-${pad(d)}`;
    const cls = [marks.written.has(k) ? 'w' : '', marks.rest.has(k) ? 'r' : '', k === todayKey && !marks.noToday ? 't' : ''].join(' ');
    const label = marks.written.has(k) ? 'wrote' : marks.rest.has(k) ? 'rest day' : '';
    html += `<span class="cal-cell"><span class="cal-day ${cls}"${label ? ` aria-label="${d}, ${label}"` : ''}>${d}</span></span>`;
  }
  return html;
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

/* ---------- Tabs ---------- */
function renderTabs() {
  const tabs = $('#tabs');
  const items = [['today', 'Today', ICON.pen], ['days', 'Your days', ICON.days], ['goals', 'Goals', ICON.goal]];
  tabs.innerHTML = items.map(([id, label, icon]) =>
    `<button class="tab" data-tab="${id}" ${S.tab === id ? 'aria-current="page"' : ''}>${icon}<span>${label}</span></button>`).join('');
  tabs.hidden = S.tab === 'settings';
}
function go(tab) {
  S.tab = tab;
  render();
  window.scrollTo(0, 0);
}

function render() {
  renderTabs();
  const app = $('#app');
  if (S.tab === 'today') app.innerHTML = viewToday();
  else if (S.tab === 'days') app.innerHTML = viewDays();
  else if (S.tab === 'goals') app.innerHTML = viewGoals();
  else if (S.tab === 'settings') app.innerHTML = viewSettings();
  afterRender();
}

/* ---------- Today ---------- */
const PROMPTS = [
  'One small thing that went well',
  'Something that took energy today',
  'A moment I want to remember',
  'What I am looking forward to',
  'Someone who made today better',
  'What I would do differently',
  'How my body felt today'
];
function greeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 18) return 'Good afternoon';
  return 'Good evening';
}
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

function viewToday() {
  const st = streakInfo();
  const now = new Date();
  const weekStart = startOfWeek(now);
  const todayKey = dayKey(now);
  let dots = '';
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    const k = dayKey(d);
    const cls = [st.written.has(k) ? 'w' : '', st.rest.has(k) ? 'r' : '', k === todayKey ? 't' : ''].join(' ');
    dots += `<span class="dot ${cls}" aria-hidden="true">${WD[i][0]}</span>`;
  }
  const writtenThisWeek = Array.from({ length: 7 }, (_, i) => dayKey(addDays(weekStart, i))).filter((k) => st.written.has(k)).length;
  const todayCount = S.entries.filter((e) => e.day === todayKey).length;
  const prompt = PROMPTS[(now.getDate() + (S.promptShift || 0)) % PROMPTS.length];
  const showInstall = isIOS() && !isStandalone() && !S.kv.installDismissed;
  return `
  <main class="screen" id="today">
    <div class="blob" aria-hidden="true"></div>
    ${showInstall ? `<div class="install-banner" role="note">
      <div><strong>Add it to your Home Screen first</strong>Tap the Share button ${ICON.share.replace('<svg', '<svg style="width:16px;height:16px;vertical-align:-3px"')}, then "Add to Home Screen". Entries written here in Safari stay in Safari.</div>
      <button class="icon-btn" data-act="dismiss-install" aria-label="Dismiss">${ICON.close}</button>
    </div>` : ''}
    <header class="head">
      <div class="head-text">
        <p class="eyebrow">${now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1 class="title">${greeting()}</h1>
      </div>
      <button class="icon-btn" data-act="settings" aria-label="Settings">${ICON.gear}</button>
    </header>
    <div class="week" role="img" aria-label="${st.current} day streak. You wrote on ${writtenThisWeek} of 7 days this week.">
      <span class="flame-pill" aria-hidden="true">${ICON.flame}${st.current}</span>${dots}
    </div>
    <section class="write-card">
      <label for="entry">What's on your mind?</label>
      <textarea id="entry" placeholder="Write as much or as little as you like">${esc(S.draft)}</textarea>
      ${S.draftAudio ? `<div class="voice-attached"><span>Voice note</span><audio controls preload="metadata" src="${S.draftAudio.url}"></audio><button class="icon-btn" style="width:36px;height:36px;box-shadow:none" data-act="drop-audio" aria-label="Remove voice note">${ICON.close}</button></div>` : ''}
      <button class="prompt-chip" data-act="prompt" data-prompt="${esc(prompt)}">Try: ${esc(prompt.toLowerCase())}</button>
    </section>
    <div class="actions">
      <button class="mic-btn" data-act="record" aria-label="Record a voice entry">${ICON.mic}</button>
      <button class="btn btn-primary save-btn" data-act="save">Save entry</button>
    </div>
    ${todayCount ? `<p class="today-count">${todayCount === 1 ? 'You wrote once today' : `You wrote ${todayCount} times today`}</p>` : ''}
    <p class="lock-note">${ICON.lock}Only you can read this</p>
  </main>`;
}

async function saveEntry() {
  const ta = $('#entry');
  const text = (ta ? ta.value : S.draft).trim();
  if (!text && !S.draftAudio) { toast('Write a line or record a note first'); return; }
  const now = new Date();
  const entry = { id: uid(), text, createdAt: now.toISOString(), day: dayKey(now) };
  if (S.draftAudio) {
    const audioId = uid();
    await DB.put('audio', { id: audioId, buf: S.draftAudio.buf, type: S.draftAudio.type });
    entry.audioId = audioId;
    entry.duration = S.draftAudio.duration;
    URL.revokeObjectURL(S.draftAudio.url);
    S.draftAudio = null;
  }
  const before = streakInfo().current;
  await DB.put('entries', entry);
  S.entries.unshift(entry);
  S.draft = '';
  await setKV('draft', '');
  const after = streakInfo().current;
  render();
  toast(after > before ? `Saved. ${after} day streak` : 'Saved');
  if (navigator.vibrate) navigator.vibrate(12);
}

/* ---------- Voice recording ---------- */
const Rec = { stream: null, rec: null, chunks: [], start: 0, timer: null, speech: null, transcript: '', interim: '' };

async function startRecording() {
  if (!navigator.mediaDevices || !window.MediaRecorder) { toast('Voice recording is not supported here'); return; }
  try {
    Rec.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    toast('Microphone access was not allowed');
    return;
  }
  const type = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find((t) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
  Rec.rec = new MediaRecorder(Rec.stream, type ? { mimeType: type } : undefined);
  Rec.chunks = [];
  Rec.transcript = '';
  Rec.interim = '';
  Rec.rec.ondataavailable = (e) => { if (e.data && e.data.size) Rec.chunks.push(e.data); };
  Rec.rec.start(250);
  Rec.start = Date.now();

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    try {
      const sr = new SR();
      sr.lang = 'en-GB';
      sr.continuous = true;
      sr.interimResults = true;
      sr.onresult = (ev) => {
        let interim = '';
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const r = ev.results[i];
          if (r.isFinal) Rec.transcript += (Rec.transcript ? ' ' : '') + r[0].transcript.trim();
          else interim += r[0].transcript;
        }
        Rec.interim = interim;
        const live = $('.rec-live');
        if (live) live.textContent = (Rec.transcript + ' ' + Rec.interim).trim() || 'Listening…';
      };
      sr.onerror = () => {};
      sr.onend = () => { if (Rec.speech === sr && Rec.rec && Rec.rec.state === 'recording') { try { sr.start(); } catch (e) { /* ignore */ } } };
      sr.start();
      Rec.speech = sr;
    } catch (e) { Rec.speech = null; }
  }

  const root = $('#overlay-root');
  root.innerHTML = `
  <div class="rec" role="dialog" aria-modal="true" aria-label="Recording a voice entry">
    <div class="rec-orb" aria-hidden="true"><span>${ICON.mic}</span></div>
    <div class="rec-time" aria-live="off">0:00</div>
    <p class="rec-live">${Rec.speech ? 'Listening…' : 'Recording. Your voice note will be saved with the entry.'}</p>
    <button class="btn btn-primary" data-act="stop-rec">${ICON.stop.replace('<svg', '<svg style="width:18px;height:18px"')}Done</button>
    <button class="btn btn-ghost" style="color:#E3D9E0" data-act="cancel-rec">Cancel</button>
  </div>`;
  Rec.timer = setInterval(() => {
    const s = Math.floor((Date.now() - Rec.start) / 1000);
    const el = $('.rec-time');
    if (el) el.textContent = `${Math.floor(s / 60)}:${pad(s % 60)}`;
  }, 250);
}

function stopRecording(keep) {
  clearInterval(Rec.timer);
  const sr = Rec.speech;
  Rec.speech = null;
  if (sr) { try { sr.stop(); } catch (e) { /* ignore */ } }
  const finish = async () => {
    if (Rec.stream) Rec.stream.getTracks().forEach((t) => t.stop());
    $('#overlay-root').innerHTML = '';
    if (!keep) return;
    const type = (Rec.rec && Rec.rec.mimeType) || 'audio/mp4';
    const blob = new Blob(Rec.chunks, { type });
    const duration = Math.round((Date.now() - Rec.start) / 1000);
    if (blob.size) {
      if (S.draftAudio) URL.revokeObjectURL(S.draftAudio.url);
      S.draftAudio = { buf: await blob.arrayBuffer(), type, duration, url: URL.createObjectURL(blob) };
    }
    const words = (Rec.transcript + ' ' + Rec.interim).trim();
    const ta = $('#entry');
    const current = ta ? ta.value : S.draft;
    S.draft = words ? (current.trim() ? current.trim() + '\n\n' : '') + words : current;
    await setKV('draft', S.draft);
    render();
    toast(words ? 'Transcribed. Edit it, then save' : 'Voice note added');
  };
  if (Rec.rec && Rec.rec.state !== 'inactive') {
    Rec.rec.onstop = finish;
    Rec.rec.stop();
  } else finish();
}

/* ---------- Your days ---------- */
function viewDays() {
  const st = streakInfo();
  const now = new Date();
  const cm = S.calMonth || new Date(now.getFullYear(), now.getMonth(), 1);
  const isCurrent = cm.getFullYear() === now.getFullYear() && cm.getMonth() === now.getMonth();
  const firstEntry = S.entries.length ? fromKey(S.entries[S.entries.length - 1].day) : now;
  const canBack = cm > new Date(firstEntry.getFullYear(), firstEntry.getMonth(), 1);
  const moons = Array.from({ length: REST_PER_MONTH }, (_, i) => `<span class="${i < st.restLeft ? '' : 'used'}">${ICON.moon}</span>`).join('');
  const q = S.query.trim().toLowerCase();
  const list = q ? S.entries.filter((e) => e.text.toLowerCase().includes(q)) : S.entries;
  const groups = [];
  list.forEach((e) => {
    const d = new Date(e.createdAt);
    const label = d.getFullYear() === now.getFullYear() ? MONTHS[d.getMonth()] : `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    if (!groups.length || groups[groups.length - 1].label !== label) groups.push({ label, items: [] });
    groups[groups.length - 1].items.push(e);
  });
  return `
  <main class="screen" id="days">
    <header class="head">
      <div class="head-text">
        <p class="eyebrow">${S.entries.length === 1 ? '1 entry so far' : `${S.entries.length} entries so far`}</p>
        <h1 class="title">Your days</h1>
      </div>
    </header>
    <section class="card cal" aria-label="Calendar">
      <div class="cal-head">
        <h2>${MONTHS[cm.getMonth()]}${cm.getFullYear() !== now.getFullYear() ? ' ' + cm.getFullYear() : ''}</h2>
        ${isCurrent ? `<span class="cal-streak" role="img" aria-label="${st.current} day streak">${ICON.flame}${st.current}</span>` : ''}
        <div class="cal-nav">
          <button data-act="cal-prev" aria-label="Previous month" ${canBack ? '' : 'disabled'}>${ICON.left}</button>
          <button data-act="cal-next" aria-label="Next month" ${isCurrent ? 'disabled' : ''}>${ICON.right}</button>
        </div>
      </div>
      <div class="cal-body">
        <div class="cal-grid">${monthCells(cm.getFullYear(), cm.getMonth(), st)}</div>
        <div class="cal-foot">
          <span class="best" role="img" aria-label="Longest streak: ${st.longest} days">${ICON.trophy}${st.longest}</span>
          <button class="rest-moons" data-act="rest-info" aria-label="${st.restLeft} rest days left this month. What are rest days?">${moons}</button>
        </div>
      </div>
    </section>
    ${S.entries.length ? `<label class="search">${ICON.search}<span class="sr-only">Search your entries</span><input id="search" type="search" placeholder="Search your entries" value="${esc(S.query)}" autocomplete="off"></label>` : ''}
    ${!S.entries.length ? '<div class="card empty">Your entries will appear here after you save the first one.</div>' : ''}
    ${S.entries.length && !list.length ? '<div class="card empty">Nothing matches that search.</div>' : ''}
    ${groups.map((g) => `<h2 class="section-label">${g.label}</h2><div class="list">${g.items.map(entryCard).join('')}</div>`).join('')}
  </main>`;
}
function entryCard(e) {
  const d = new Date(e.createdAt);
  const text = e.text || 'Voice note';
  return `<button class="entry" data-act="open-entry" data-id="${e.id}">
    <span class="entry-date"><b>${d.getDate()}</b><span>${WD[(d.getDay() + 6) % 7]}</span></span>
    <span class="entry-body">
      <span class="entry-text">${esc(text)}</span>
      <span class="entry-meta">${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}${e.audioId ? ` · ${ICON.mic} Voice ${Math.floor((e.duration || 0) / 60)}:${pad((e.duration || 0) % 60)}` : ''}</span>
    </span>
  </button>`;
}

async function openEntry(id) {
  const e = S.entries.find((x) => x.id === id);
  if (!e) return;
  let audioUrl = '';
  if (e.audioId) {
    const a = await DB.get('audio', e.audioId);
    if (a) audioUrl = URL.createObjectURL(new Blob([a.buf], { type: a.type }));
  }
  const d = new Date(e.createdAt);
  sheet(`
    <div class="sheet-head">
      <div><p class="eyebrow">${d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p><h2>Your entry</h2></div>
      <button class="icon-btn" data-act="close-sheet" aria-label="Close">${ICON.close}</button>
    </div>
    ${audioUrl ? `<audio controls src="${audioUrl}" style="width:100%"></audio>` : ''}
    <label class="field"><span>Text</span><textarea id="edit-text">${esc(e.text)}</textarea></label>
    <div class="sheet-actions">
      <button class="btn btn-dark" data-act="update-entry" data-id="${e.id}">Save changes</button>
      <button class="btn btn-danger" data-act="delete-entry" data-id="${e.id}">Delete entry</button>
    </div>`, () => { if (audioUrl) URL.revokeObjectURL(audioUrl); });
}

/* ---------- Goals ---------- */
const HORIZONS = { month: 'This month', '3m': '3 months', '6m': '6 months', year: 'This year' };
const BAR = { month: 'var(--bar-month)', '3m': 'var(--bar-3m)', '6m': 'var(--bar-6m)', year: 'var(--bar-year)' };
function goalEnd(g) {
  const c = new Date(g.createdAt);
  if (g.horizon === 'month') return new Date(c.getFullYear(), c.getMonth() + 1, 0);
  if (g.horizon === 'year') return new Date(c.getFullYear(), 11, 31);
  const months = g.horizon === '3m' ? 3 : 6;
  return addDays(new Date(c.getFullYear(), c.getMonth() + months, c.getDate()), -1);
}
function goalProgress(g) {
  if (g.kind === 'weekly') {
    const ws = startOfWeek();
    const n = g.logs.filter((t) => new Date(t) >= ws).length;
    return { n, of: g.target, label: `${n} of ${g.target} this week` };
  }
  return { n: g.logs.length, of: g.target, label: `${g.logs.length} of ${g.target}` };
}
function goalNote(g) {
  const end = goalEnd(g);
  const today = startOfDay();
  if (end < today) return 'Finished';
  const left = Math.round((end - today) / 86400000);
  const endText = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  if (g.kind === 'weekly') {
    const p = goalProgress(g);
    const daysLeftInWeek = 7 - ((new Date().getDay() + 6) % 7);
    if (p.n >= p.of) return `Done for this week. Ends ${endText}.`;
    return `${p.of - p.n} to go, ${daysLeftInWeek === 1 ? 'last day of the week' : `${daysLeftInWeek} days left this week`}.`;
  }
  const total = Math.max(1, Math.round((end - startOfDay(new Date(g.createdAt))) / 86400000));
  const elapsed = total - left;
  const expected = (g.target * elapsed) / total;
  const pace = g.logs.length >= expected ? 'On pace' : 'A little behind';
  return `${pace}. ${left} days left, ends ${endText}.`;
}
function viewGoals() {
  const active = S.goals.filter((g) => goalEnd(g) >= startOfDay());
  const finished = S.goals.filter((g) => goalEnd(g) < startOfDay());
  return `
  <main class="screen" id="goals">
    <header class="head">
      <div class="head-text">
        <p class="eyebrow">${active.length ? `${active.length} you are working on` : 'Nothing set yet'}</p>
        <h1 class="title">Your goals</h1>
      </div>
      <button class="icon-btn dark" data-act="new-goal" aria-label="Add a goal">${ICON.plus}</button>
    </header>
    ${!S.goals.length ? `<div class="card empty">Set a goal for this month, the next few months or the whole year. Tap the plus to start. Small ones count too.</div>` : ''}
    <div class="list">${active.map(goalCard).join('')}</div>
    ${finished.length ? `<h2 class="section-label">Finished</h2><div class="list">${finished.map(goalCard).join('')}</div>` : ''}
  </main>`;
}
function goalCard(g) {
  const p = goalProgress(g);
  const pct = Math.min(100, Math.round((p.n / Math.max(1, p.of)) * 100));
  const done = goalEnd(g) < startOfDay();
  const loggedToday = g.logs.some((t) => dayKey(new Date(t)) === dayKey(new Date()));
  return `<section class="card goal ${done ? 'done-goal' : ''}">
    <div class="goal-top"><span class="chip h-${g.horizon}">${HORIZONS[g.horizon]}</span><span class="goal-count">${p.label}</span></div>
    <button class="goal-title" data-act="edit-goal" data-id="${g.id}">${esc(g.title)}</button>
    <div class="bar" role="img" aria-label="${p.label}"><span style="width:${pct}%;background:${BAR[g.horizon]}"></span></div>
    <div class="goal-foot">
      <p class="goal-note">${goalNote(g)}</p>
      ${done ? '' : `<div style="display:flex;align-items:center;gap:4px">${loggedToday ? `<button class="undo" data-act="undo-log" data-id="${g.id}">Undo</button>` : ''}<button class="btn btn-sm btn-dark" data-act="log-goal" data-id="${g.id}">${g.kind === 'weekly' ? 'Done today' : '+1'}</button></div>`}
    </div>
  </section>`;
}
function goalSheet(g) {
  const v = g || { title: '', horizon: 'month', kind: 'weekly', target: 3 };
  S.goalForm = { ...v };
  sheet(`
    <div class="sheet-head"><h2>${g ? 'Edit goal' : 'New goal'}</h2><button class="icon-btn" data-act="close-sheet" aria-label="Close">${ICON.close}</button></div>
    <label class="field"><span>What do you want to do?</span><input class="input" id="goal-title" maxlength="80" placeholder="Run 3 times a week" value="${esc(v.title)}"></label>
    <div class="field"><span>For how long?</span><div class="seg" data-group="horizon">${Object.entries(HORIZONS).map(([k, l]) => `<button type="button" data-val="${k}" aria-pressed="${v.horizon === k}" ${g ? 'disabled' : ''}>${l}</button>`).join('')}</div></div>
    <div class="field"><span>How will you count it?</span><div class="seg" data-group="kind">
      <button type="button" data-val="weekly" aria-pressed="${v.kind === 'weekly'}">Times per week</button>
      <button type="button" data-val="total" aria-pressed="${v.kind === 'total'}">A total</button></div></div>
    <div class="field"><span id="target-label">${v.kind === 'weekly' ? 'Times per week' : 'Total to reach'}</span>
      <div class="stepper"><button type="button" data-act="step" data-d="-1" aria-label="Less">−</button><output id="goal-target" aria-labelledby="target-label">${v.target}</output><button type="button" data-act="step" data-d="1" aria-label="More">+</button></div></div>
    <div class="sheet-actions">
      <button class="btn btn-dark" data-act="save-goal" data-id="${g ? g.id : ''}">${g ? 'Save changes' : 'Add goal'}</button>
      ${g ? `<button class="btn btn-danger" data-act="delete-goal" data-id="${g.id}">Remove goal</button>` : ''}
    </div>`);
}

/* ---------- Settings ---------- */
function viewSettings() {
  return `
  <main class="screen" id="settings">
    <button class="back" data-act="back">${ICON.left}Today</button>
    <h1 class="title">Make it yours</h1>
    <h2 class="section-label">Appearance</h2>
    <section class="card group">
      <div class="theme-row" style="border-bottom:0"><span id="theme-label">Theme</span>
        <div class="seg" role="group" aria-labelledby="theme-label">${[['system', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(([k, l]) => `<button type="button" data-act="theme" data-val="${k}" aria-pressed="${(S.kv.theme || 'system') === k}">${l}</button>`).join('')}</div>
      </div>
    </section>
    <p class="fine">Auto follows your iPhone's light and dark setting.</p>
    <h2 class="section-label">Privacy</h2>
    <section class="card group">
      ${S.kv.passHash
        ? `<button class="row" data-act="change-pass">Change passcode<small>On</small></button><button class="row" data-act="remove-pass">Turn off passcode</button>`
        : `<button class="row" data-act="set-pass">Lock with a passcode<small>Off</small></button>`}
    </section>
    <p class="fine">Your entries live only on this phone, inside this app. Nothing is sent anywhere.</p>
    <h2 class="section-label">Your data</h2>
    <section class="card group">
      <button class="row" data-act="export">Export a backup<small>Always free</small></button>
      <button class="row" data-act="import">Restore from a backup</button>
    </section>
    <p class="fine">Make a backup now and then and keep it in Files or iCloud Drive. Backups hold your text and goals; voice recordings stay on the phone. ${S.persisted === false ? 'Note: this browser has not promised to keep your data, so backups matter even more.' : ''}</p>
    <input type="file" id="import-file" accept="application/json,.json" hidden>
    <h2 class="section-label">Little things</h2>
    <section class="card group">
      <button class="row" data-act="replay-intro">Replay the opening animation</button>
      <button class="row" data-act="replay-tear">Replay the new month page</button>
    </section>
    <p class="fine">Said &amp; Done ${VERSION}. Reminders, the home screen widget and weekly summaries are planned for later versions.</p>
  </main>`;
}

async function exportBackup() {
  const data = { app: 'said-and-done', version: 1, exportedAt: new Date().toISOString(), entries: S.entries, goals: S.goals };
  const json = JSON.stringify(data, null, 2);
  const name = `said-and-done-backup-${dayKey(new Date())}.json`;
  const file = new File([json], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Said & Done backup' }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  toast('Backup saved');
}
async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'said-and-done' || !Array.isArray(data.entries)) throw new Error('bad file');
    let added = 0;
    for (const e of data.entries) {
      if (!e.id || typeof e.text !== 'string' || !e.createdAt) continue;
      if (S.entries.some((x) => x.id === e.id)) continue;
      const clean = { id: e.id, text: e.text, createdAt: e.createdAt, day: e.day || dayKey(new Date(e.createdAt)) };
      await DB.put('entries', clean);
      S.entries.push(clean);
      added += 1;
    }
    for (const g of data.goals || []) {
      if (!g.id || S.goals.some((x) => x.id === g.id)) continue;
      await DB.put('goals', g);
      S.goals.push(g);
    }
    S.entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    toast(added ? `Restored ${added} entries` : 'Everything was already here');
    render();
  } catch (e) {
    toast('That file is not a Said & Done backup');
  }
}

/* ---------- Sheets ---------- */
let sheetCleanup = null;
function sheet(inner, onClose) {
  closeSheet();
  sheetCleanup = onClose || null;
  const root = $('#overlay-root');
  root.innerHTML = `<div class="scrim" data-act="scrim"><div class="sheet" role="dialog" aria-modal="true"><div class="grabber" aria-hidden="true"></div>${inner}</div></div>`;
  const first = $('.sheet input, .sheet textarea', root);
  if (first && !first.value) setTimeout(() => first.focus(), 250);
}
function closeSheet() {
  if (sheetCleanup) { sheetCleanup(); sheetCleanup = null; }
  const root = $('#overlay-root');
  if ($('.scrim', root)) root.innerHTML = '';
}

/* ---------- Passcode ---------- */
async function hash(code) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('said-and-done:' + code));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
function passcode(mode) {
  // mode: unlock | set | confirm-off
  return new Promise((resolve) => {
    let code = '';
    let first = '';
    let stage = mode === 'set' ? 'new' : 'check';
    const el = document.createElement('div');
    el.className = 'lock';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    const title = () => (stage === 'new' ? 'Choose a 4-digit passcode' : stage === 'again' ? 'Type it once more' : mode === 'unlock' ? 'Welcome back' : 'Enter your passcode');
    const draw = (msg = '') => {
      el.innerHTML = `
        <h2>${title()}</h2>
        <div class="pins" aria-label="${code.length} of 4 digits entered">${[0, 1, 2, 3].map((i) => `<i class="${i < code.length ? 'on' : ''}"></i>`).join('')}</div>
        <p>${msg}</p>
        <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-k="${n}">${n}</button>`).join('')}
          ${mode === 'unlock' ? '<span></span>' : '<button class="plain" data-k="cancel">Cancel</button>'}<button data-k="0">0</button><button class="plain" data-k="del" aria-label="Delete">⌫</button></div>`;
    };
    const fail = (msg) => { code = ''; draw(msg); const p = $('.pins', el); p.classList.add('shake'); if (navigator.vibrate) navigator.vibrate(60); };
    el.addEventListener('click', async (ev) => {
      const b = ev.target.closest('button');
      if (!b) return;
      const k = b.dataset.k;
      if (k === 'cancel') { el.remove(); resolve(false); return; }
      if (k === 'del') { code = code.slice(0, -1); draw(); return; }
      if (code.length >= 4) return;
      code += k;
      draw();
      if (code.length < 4) return;
      if (stage === 'new') { first = code; code = ''; stage = 'again'; setTimeout(() => draw(), 120); return; }
      if (stage === 'again') {
        if (code !== first) { stage = 'new'; first = ''; setTimeout(() => fail('Those did not match. Try again.'), 120); return; }
        await setKV('passHash', await hash(code));
        el.remove(); resolve(true); return;
      }
      if ((await hash(code)) === S.kv.passHash) { el.remove(); resolve(true); }
      else setTimeout(() => fail('Not quite. Try again.'), 120);
    });
    draw();
    document.body.appendChild(el);
  });
}

/* ---------- Intro and month tear ---------- */
function playIntro() {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'intro';
    el.innerHTML = `
      <div class="intro-markwrap"><div class="intro-mark" role="img" aria-label="Said and Done">
        <div class="intro-sheet"></div>
        <svg class="intro-full" viewBox="15 15 90 90" width="230" height="230" aria-hidden="true">${GLYPH}</svg>
      </div></div>
      <p class="intro-word">Said <em>&amp;</em> Done</p>
      <p class="intro-skip">Tap to skip</p>`;
    let done = false;
    const end = () => {
      if (done) return;
      done = true;
      el.classList.add('out');
      setTimeout(() => { el.remove(); resolve(); }, 450);
    };
    el.addEventListener('click', end);
    document.body.appendChild(el);
    setTimeout(end, reduceMotion() ? 1400 : 4000);
    if (navigator.vibrate) setTimeout(() => navigator.vibrate(10), 2300);
  });
}
function playTear(prevMonth, newMonth) {
  return new Promise((resolve) => {
    const st = streakInfo();
    const page = (d, marks) => `<div class="tear-page"><div class="ph"><b>${MONTHS[d.getMonth()]}</b><span>${d.getFullYear()}</span></div>
      <div class="cal-grid">${monthCells(d.getFullYear(), d.getMonth(), marks)}</div></div>`;
    const el = document.createElement('div');
    el.className = 'tear';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', `A new month: ${MONTHS[newMonth.getMonth()]}`);
    el.innerHTML = `
      <div class="tear-stage">
        <div class="tear-new">${page(newMonth, st)}</div>
        <div class="tear-stub" aria-hidden="true"></div>
        <div class="tear-old" aria-hidden="true"><div class="tear-clip">${page(prevMonth, { ...st, noToday: true })}</div></div>
        <div class="tear-bind" aria-hidden="true"><i></i><i></i></div>
      </div>
      <div class="tear-after"><p>A fresh page</p><button class="btn btn-dark" data-act="tear-done">Start writing</button></div>`;
    // jagged edges
    const W = 310, teeth = 40, step = W / teeth;
    const top = Array.from({ length: teeth + 1 }, (_, k) => `${(k * step).toFixed(2)}px ${k % 2 ? 0 : 6}px`).join(', ');
    $('.tear-clip', el).style.clipPath = `polygon(${top}, 100% 100%, 0 100%)`;
    const bot = Array.from({ length: teeth + 1 }, (_, k) => `${((teeth - k) * step).toFixed(2)}px ${(teeth - k) % 2 ? 14 : 8}px`).join(', ');
    $('.tear-stub', el).style.clipPath = `polygon(0 0, 100% 0, ${bot})`;
    el.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-act="tear-done"]') || ev.target === el) { el.remove(); resolve(); }
    });
    document.body.appendChild(el);
    if (navigator.vibrate) setTimeout(() => navigator.vibrate([8, 40, 14]), 1350);
  });
}

/* ---------- Events ---------- */
document.addEventListener('click', async (ev) => {
  const tab = ev.target.closest('[data-tab]');
  if (tab) { go(tab.dataset.tab); return; }
  const el = ev.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  const id = el.dataset.id;
  switch (act) {
    case 'scrim': if (ev.target === el) closeSheet(); break;
    case 'close-sheet': closeSheet(); break;
    case 'settings': go('settings'); break;
    case 'back': go('today'); break;
    case 'dismiss-install': await setKV('installDismissed', true); render(); break;
    case 'save': await saveEntry(); break;
    case 'record': await startRecording(); break;
    case 'stop-rec': stopRecording(true); break;
    case 'cancel-rec': stopRecording(false); break;
    case 'drop-audio': if (S.draftAudio) URL.revokeObjectURL(S.draftAudio.url); S.draftAudio = null; render(); break;
    case 'prompt': {
      const ta = $('#entry');
      const p = el.dataset.prompt;
      const cur = ta.value.trim();
      ta.value = (cur ? cur + '\n\n' : '') + p + ': ';
      S.draft = ta.value; setKV('draft', S.draft);
      S.promptShift = (S.promptShift || 0) + 1;
      el.textContent = 'Try: ' + PROMPTS[(new Date().getDate() + S.promptShift) % PROMPTS.length].toLowerCase();
      el.dataset.prompt = PROMPTS[(new Date().getDate() + S.promptShift) % PROMPTS.length];
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
      break;
    }
    case 'cal-prev': { const c = S.calMonth || new Date(new Date().getFullYear(), new Date().getMonth(), 1); S.calMonth = new Date(c.getFullYear(), c.getMonth() - 1, 1); render(); break; }
    case 'cal-next': { const c = S.calMonth; S.calMonth = new Date(c.getFullYear(), c.getMonth() + 1, 1); render(); break; }
    case 'rest-info': {
      const st = streakInfo();
      sheet(`<div class="sheet-head"><h2>Rest days</h2><button class="icon-btn" data-act="close-sheet" aria-label="Close">${ICON.close}</button></div>
        <p style="font-size:16px;line-height:1.55">Missed a day? A rest day covers it automatically, so your streak survives. You get ${REST_PER_MONTH} each month. You have <b>${st.restLeft}</b> left this month.</p>
        <p class="fine">Rest days show in soft purple on the calendar. Any entry counts toward your streak, even one sentence or a short voice note.</p>`);
      break;
    }
    case 'open-entry': await openEntry(id); break;
    case 'update-entry': {
      const e = S.entries.find((x) => x.id === id);
      e.text = $('#edit-text').value.trim();
      await DB.put('entries', e);
      closeSheet(); render(); toast('Changes saved');
      break;
    }
    case 'delete-entry': {
      if (el.dataset.armed !== '1') { el.dataset.armed = '1'; el.textContent = 'Tap again to delete for good'; return; }
      const e = S.entries.find((x) => x.id === id);
      if (e && e.audioId) await DB.del('audio', e.audioId);
      await DB.del('entries', id);
      S.entries = S.entries.filter((x) => x.id !== id);
      closeSheet(); render(); toast('Entry deleted');
      break;
    }
    case 'new-goal': goalSheet(null); break;
    case 'edit-goal': goalSheet(S.goals.find((g) => g.id === id)); break;
    case 'step': {
      const f = S.goalForm;
      const max = f.kind === 'weekly' ? 7 : 999;
      f.target = Math.max(1, Math.min(max, f.target + Number(el.dataset.d)));
      $('#goal-target').textContent = f.target;
      break;
    }
    case 'save-goal': {
      const f = S.goalForm;
      f.title = $('#goal-title').value.trim();
      if (!f.title) { toast('Give your goal a name'); $('#goal-title').focus(); return; }
      if (id) {
        const g = S.goals.find((x) => x.id === id);
        Object.assign(g, { title: f.title, kind: f.kind, target: f.target });
        await DB.put('goals', g);
      } else {
        const g = { id: uid(), title: f.title, horizon: f.horizon, kind: f.kind, target: f.target, logs: [], createdAt: new Date().toISOString() };
        await DB.put('goals', g);
        S.goals.push(g);
      }
      closeSheet(); render(); toast(id ? 'Goal updated' : 'Goal added');
      break;
    }
    case 'delete-goal': {
      if (el.dataset.armed !== '1') { el.dataset.armed = '1'; el.textContent = 'Tap again to remove'; return; }
      await DB.del('goals', id);
      S.goals = S.goals.filter((x) => x.id !== id);
      closeSheet(); render(); toast('Goal removed');
      break;
    }
    case 'log-goal': {
      const g = S.goals.find((x) => x.id === id);
      g.logs.push(new Date().toISOString());
      await DB.put('goals', g);
      render();
      const p = goalProgress(g);
      toast(p.n === p.of ? 'Goal reached. Well done' : 'Logged');
      if (navigator.vibrate) navigator.vibrate(12);
      break;
    }
    case 'undo-log': {
      const g = S.goals.find((x) => x.id === id);
      g.logs.pop();
      await DB.put('goals', g);
      render();
      break;
    }
    case 'set-pass': case 'change-pass':
      if (act === 'change-pass' && !(await passcode('check'))) return;
      if (await passcode('set')) { toast('Passcode on'); render(); }
      break;
    case 'remove-pass':
      if (await passcode('check')) { await setKV('passHash', null); toast('Passcode off'); render(); }
      break;
    case 'theme': await setKV('theme', el.dataset.val); applyTheme(); render(); break;
    case 'export': await exportBackup(); break;
    case 'import': $('#import-file').click(); break;
    case 'replay-intro': await playIntro(); break;
    case 'replay-tear': {
      const n = new Date();
      await playTear(new Date(n.getFullYear(), n.getMonth() - 1, 1), new Date(n.getFullYear(), n.getMonth(), 1));
      break;
    }
    default: break;
  }
});

document.addEventListener('click', (ev) => {
  const b = ev.target.closest('.seg button');
  if (!b || b.disabled || !b.parentElement.dataset.group) return;
  const group = b.parentElement.dataset.group;
  $$('button', b.parentElement).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  S.goalForm[group] = b.dataset.val;
  if (group === 'kind') {
    $('#target-label').textContent = b.dataset.val === 'weekly' ? 'Times per week' : 'Total to reach';
    if (b.dataset.val === 'weekly' && S.goalForm.target > 7) { S.goalForm.target = 3; $('#goal-target').textContent = 3; }
  }
});

let draftTimer;
document.addEventListener('input', (ev) => {
  if (ev.target.id === 'entry') {
    S.draft = ev.target.value;
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => setKV('draft', S.draft), 400);
  }
  if (ev.target.id === 'search') {
    S.query = ev.target.value;
    const pos = ev.target.selectionStart;
    render();
    const s = $('#search');
    if (s) { s.focus(); s.setSelectionRange(pos, pos); }
  }
});
document.addEventListener('change', (ev) => {
  if (ev.target.id === 'import-file' && ev.target.files[0]) importBackup(ev.target.files[0]);
});
document.addEventListener('focusin', (ev) => { if (ev.target.matches('textarea, input')) document.body.classList.add('typing'); });
document.addEventListener('focusout', () => setTimeout(() => {
  if (!document.activeElement || !document.activeElement.matches('textarea, input')) document.body.classList.remove('typing');
}, 50));
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeSheet(); });

function afterRender() {
  const ta = $('#entry');
  if (ta && S.tab === 'today') ta.style.minHeight = '';
}

/* Lock again when the app has been in the background for a minute */
let hiddenAt = 0;
document.addEventListener('visibilitychange', async () => {
  if (document.hidden) { hiddenAt = Date.now(); return; }
  if (S.kv.passHash && hiddenAt && Date.now() - hiddenAt > 60000 && !$('.lock')) await passcode('unlock');
  if (S.tab === 'today' && !$('#overlay-root').children.length) render(); // refresh greeting and date
});

/* ---------- Theme ---------- */
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const t = S.kv.theme || 'system';
  try { localStorage.setItem('sd-theme', t); } catch (e) { /* ignore */ }
  if (t === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  const dark = t === 'dark' || (t === 'system' && darkQuery.matches);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#1B1520' : '#FFF6EE');
}
if (darkQuery.addEventListener) darkQuery.addEventListener('change', applyTheme);

/* ---------- Start ---------- */
async function start() {
  try {
    await load();
  } catch (e) {
    $('#app').innerHTML = '<main class="screen"><h1 class="title">Something went wrong</h1><p>Said &amp; Done could not open its storage. Private browsing can block it.</p></main>';
    return;
  }
  applyTheme();
  render();
  if (S.kv.passHash) await passcode('unlock');
  const now = new Date();
  const thisMonth = monthKey(now);
  if (!S.kv.introSeen) {
    await playIntro();
    await setKV('introSeen', true);
  } else if (S.kv.lastMonth && S.kv.lastMonth !== thisMonth) {
    await playTear(fromKey(S.kv.lastMonth), new Date(now.getFullYear(), now.getMonth(), 1));
  }
  await setKV('lastMonth', thisMonth);
  render();
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
start();
})();
