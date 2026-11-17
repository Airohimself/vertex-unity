// Controller: routing, rendering, event delegation, Supabase boot, AI calls, uploads.
import * as store from './store.js';
import * as cloud from './cloud.js';
import { esc, uid, iso, today, fromIso, wordCount, debounce } from './util.js';
import { makeMoney } from './util.js';
import { setLang } from './i18n.js';
import { t } from './i18n.js';
import { DATA, loadData, applyOverrides, isFull, genPlan, createApplication } from './data.js';
import * as A from './views-a.js';
import * as B from './views-b.js';

const CFG = window.VERTEX_CONFIG || {};
const $ = (s, r = document) => r.querySelector(s);
const S = () => store.get();
const OVR_KEY = 'vu_overrides_v1';
const PAGES = new Set([...A.PAGE_TITLES, 'essay']);

// ------------------------------------------------------------------ UI state (not persisted)
const ui = {
  closedGroups: {}, menuOpen: false, bellOpen: false, layer: null,
  uni: { q: '', country: '', cost: '', type: '', sort: 'name', onlyIelts: false, onlyFull: false, onlySaved: false, limit: 48 },
  sch: { q: '', level: '', funding: '', eligible: false, saved: false },
  lib: { q: '', type: 'All essay types' },
  majorCat: 'All', cal: { y: new Date().getFullYear(), m: new Date().getMonth() },
  channel: 'general', msgs: [], online: 1, chanLoaded: null,
  files: [], fileCat: 'all', upCat: 'documents',
  dreamQ: '', dreamPick: null, dreamYear: '', dreamLevel: '',
  healthQ: '', healthMissing: false, persTab: 'presets', authMode: 'in', aiBusy: false,
  uid: null, obMajors: new Set(),
};
let session = null;
let chanUnsub = null;
let presUnsub = null;

// ------------------------------------------------------------------ helpers
function parseRoute() {
  const m = location.hash.match(/^#\/app\/([\w-]+)(?:\/([\w-]+))?/);
  if (!m) return { page: 'landing' };
  return { page: PAGES.has(m[1]) ? m[1] : 'home', id: m[2] };
}
const go = (page) => { location.hash = `#/app/${page}`; };
export function toast(msg) {
  const root = $('#toast-root');
  if (!root) return;
  const el = document.createElement('div');
  el.className = 'toast glass';
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
const active = () => store.touchActive();
const upd = (fn, opt) => store.update(fn, opt);

function ctxNow() {
  const s = S();
  const meta = session?.user?.user_metadata?.name;
  return {
    S: s, ui, route: parseRoute(), cloud: cloud.enabled, money: makeMoney(s.settings, CFG.RATES),
    userName: s.profile.name || meta || '', userEmail: session?.user?.email || '', customWall: store.getCustomWall(),
  };
}

// ------------------------------------------------------------------ settings -> DOM
function inkFor(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return l > 0.5 ? '#04222a' : '#ffffff';
}
function applySettings() {
  const s = S().settings;
  const r = document.documentElement;
  setLang(s.language);
  r.dataset.theme = s.theme;
  r.style.setProperty('--accent', s.accent);
  r.style.setProperty('--accent-ink', s.theme === 'light' ? '#ffffff' : inkFor(s.accent));
  r.style.setProperty('--dim', String(s.dim / 100));
  r.dataset.blur = s.blur;
  r.dataset.density = s.density;
  r.dataset.corners = s.corners;
  r.dataset.labels = s.labels ? '1' : '0';
  r.dataset.motion = s.motion;
  r.dataset.hc = s.hc ? '1' : '0';
  r.style.fontSize = { 'A-': '14.5px', A: '16px', 'A+': '17.5px', 'A++': '19px' }[s.textSize] || '16px';
  const bg = $('#bg');
  if (bg) {
    const css = B.wallCss(s.wall, store.getCustomWall());
    bg.style.background = !css ? '' : css.startsWith('url') ? `${css} center/cover no-repeat, #05070d` : css;
  }
}

// ------------------------------------------------------------------ render
const PAGE_FN = {
  home: A.home, saved: A.saved, universities: A.universities, scholarships: A.scholarships, majors: A.majors, compare: A.compare,
  dream: B.dream, applications: B.applications, calendar: B.calendar, tests: B.tests, essays: B.essays, essay: B.essay,
  'essay-library': B.essayLibrary, ai: B.ai, channels: B.channels, resources: B.resources, files: B.files, health: B.health,
  profile: B.profile, personalize: B.personalize,
};
function captureFocus() {
  const a = document.activeElement;
  if (!a || a === document.body) return null;
  const key = a.dataset?.bind ? `[data-bind="${a.dataset.bind}"]` : a.id ? `#${a.id}` : null;
  if (!key) return null;
  return { key, start: a.selectionStart, end: a.selectionEnd };
}
function restoreFocus(f) {
  if (!f) return;
  const el = $(f.key);
  if (!el) return;
  el.focus();
  try { if (f.start != null) el.setSelectionRange(f.start, f.end); } catch { /* not a text input */ }
}

let lastRouteKey = null;
export function render() {
  applySettings();
  const root = $('#app');
  const ctx = ctxNow();
  const routeKey = `${ctx.route.page}:${ctx.route.id || ''}`;
  root.classList.toggle('route-enter', routeKey !== lastRouteKey); // entrance animation only on real navigation
  lastRouteKey = routeKey;
  const navScroll = $('.nav')?.scrollTop || 0;
  const focus = captureFocus();
  const keep = {};
  ['chatInput', 'aiInput'].forEach((id) => { const e = document.getElementById(id); if (e) keep[id] = e.value; });
  const scrollY = window.scrollY;
  let html;
  const { page } = ctx.route;
  if (page === 'landing') html = A.landing(ctx);
  else if (cloud.enabled && !session) html = B.authScreen(ctx);
  else html = A.shell(ctx, (PAGE_FN[page] || A.home)(ctx));
  root.innerHTML = html;
  Object.entries(keep).forEach(([id, v]) => { const e = document.getElementById(id); if (e) e.value = v; });
  const nav = $('.nav'); if (nav) nav.scrollTop = navScroll;
  if (page === 'landing') initLanding();
  restoreFocus(focus);
  if (page !== 'landing') document.title = `${t(page === 'essay' ? 'essays' : page)} · Vertex Unity`;
  else document.title = 'Vertex Unity — Dream. Plan. Apply. Achieve.';
  ['chatMsgs', 'aiMsgs'].forEach((id) => { const e = document.getElementById(id); if (e) e.scrollTop = e.scrollHeight; });
  window.scrollTo(0, scrollY);
  renderLayer(false);
}

function layerHtml() {
  const L = ui.layer;
  if (!L) return '';
  const ctx = ctxNow();
  const scrim = '<div class="scrim" data-act="close"></div>';
  if (L.kind === 'drawer') {
    const fn = { uni: A.uniDrawer, sch: A.schDrawer, major: A.majorDrawer, app: B.appDrawer, lib: B.libDrawer }[L.type];
    return `${scrim}<aside class="drawer glass" id="drawer">${fn(L.id, ctx)}</aside>`;
  }
  if (L.type === 'onb') return B.onboarding(ctx);
  if (L.type === 'palette') {
    return `${scrim}<div class="palette glass"><input id="palInput" placeholder="${esc(t('search'))}" autocomplete="off" value="${esc(L.q || '')}"><div class="res" id="palRes">${paletteRes()}</div></div>`;
  }
  const m = {
    addApp: () => B.addAppModal(ctx), event: () => B.eventModal(ctx, L.date), score: () => B.scoreModal(),
    essay: () => B.essayModal(), edit: () => B.editUniModal(L.id),
  }[L.type];
  return `${scrim}${m ? m() : ''}`;
}
function renderLayer(force) {
  const host = $('#layer');
  if (!host) return;
  const L = ui.layer;
  if (!force && (!L || L.kind !== 'drawer')) {
    if (!L) host.innerHTML = '';
    else if (!host.innerHTML) host.innerHTML = layerHtml(); // layer set without an explicit open (e.g. onboarding)
    return;
  }
  const oldScroll = $('#drawer')?.scrollTop || 0;
  host.innerHTML = layerHtml();
  const d = $('#drawer');
  if (d) d.scrollTop = oldScroll;
  if (L?.type === 'event') { const k = $('#evKind'); if (k && L.evKind) k.value = L.evKind; }
  if (L?.type === 'palette') { const p = $('#palInput'); p?.focus(); }
}
function setLayer(l) { ui.layer = l; renderLayer(true); }
const closeLayer = () => setLayer(null);

function paletteRes() {
  const L = ui.layer;
  const res = A.searchAll(L.q || '', S());
  L.results = res;
  if (!L.q) return '<p class="muted small" style="padding:10px">Type to search universities, scholarships, majors and pages.</p>';
  if (!res.length) return '<p class="muted small" style="padding:10px">No results.</p>';
  L.sel = Math.min(L.sel || 0, res.length - 1);
  return res.map((r, i) => `<a data-act="pal-pick" data-i="${i}" class="${i === L.sel ? 'sel' : ''}"><span class="tag">${esc(r.kind)}</span><div><b>${esc(r.title)}</b><div class="muted small">${esc(r.sub)}</div></div></a>`).join('');
}
function openPalette() { setLayer({ kind: 'modal', type: 'palette', q: '', sel: 0 }); }

// ------------------------------------------------------------------ landing motion
let revealCheck = null;
function initLanding() {
  const motionOn = !['off', 'reduced'].includes(S().settings.motion) && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!motionOn) return;
  if (revealCheck) window.removeEventListener('scroll', revealCheck);
  const targets = [...document.querySelectorAll('.section-title, .feat, .steps > *, .cta, .land-foot')];
  targets.forEach((el) => el.classList.add('reveal'));
  let queued = false;
  const check = () => {
    queued = false;
    const limit = window.innerHeight - 40;
    let left = 0;
    targets.forEach((el) => {
      if (el.classList.contains('in')) return;
      if (el.getBoundingClientRect().top < limit) el.classList.add('in'); else left++;
    });
    if (!left) { window.removeEventListener('scroll', revealCheck); revealCheck = null; }
  };
  revealCheck = () => { if (!queued) { queued = true; requestAnimationFrame(check); } };
  window.addEventListener('scroll', revealCheck, { passive: true });
  check();
  // count-up for the hero numbers
  document.querySelectorAll('.stat-pill b').forEach((el) => {
    const n = parseInt(el.textContent, 10);
    if (!n || String(n) !== el.textContent.trim()) return;
    const t0 = performance.now();
    const dur = 1100;
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = String(Math.round(n * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(tick);
    };
    el.textContent = '0';
    requestAnimationFrame(tick);
  });
}

// ------------------------------------------------------------------ images
function fileToDataUrl(file, maxDim, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const k = Math.min(1, maxDim / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}
function pickImage(cb) {
  const i = document.createElement('input');
  i.type = 'file'; i.accept = 'image/*';
  i.onchange = () => { if (i.files[0]) cb(i.files[0]); };
  i.click();
}
function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ------------------------------------------------------------------ Vertex AI
function aiContext() {
  const p = S().profile;
  const bits = [`Level: ${p.level}`, `Start year: ${p.startYear}`, `Nationality: ${p.nationality}`];
  if (p.budget) bits.push(`Yearly budget: $${p.budget}`);
  if (p.gpa) bits.push(`GPA/grades: ${p.gpa}`);
  if (p.ielts) bits.push(`IELTS: ${p.ielts}`);
  if (p.sat) bits.push(`SAT: ${p.sat}`);
  if (p.majors.length) bits.push(`Majors: ${p.majors.map((m) => DATA.majorById[m]?.name || m).join(', ')}`);
  if (p.countries.length) bits.push(`Countries: ${p.countries.join(', ')}`);
  const saved = S().savedUnis.map((i) => DATA.byUni[i]?.name).filter(Boolean).slice(0, 8);
  if (saved.length) bits.push(`Saved universities: ${saved.join(', ')}`);
  const d = S().dream && DATA.byUni[S().dream.uniId];
  if (d) bits.push(`Dream school: ${d.name}`);
  return bits.join('\n');
}
async function sendAI(text, mode) {
  text = (text || '').trim();
  if (!text || ui.aiBusy) return;
  active();
  upd((s) => { s.chat.push({ role: 'user', content: text }); if (s.chat.length > 60) s.chat = s.chat.slice(-60); });
  ui.aiBusy = true; render();
  try {
    const msgs = S().chat.slice(-20);
    while (msgs.length && msgs[0].role !== 'user') msgs.shift();
    const headers = { 'content-type': 'application/json' };
    if (cloud.enabled) { const tk = await cloud.accessToken(); if (tk) headers.authorization = `Bearer ${tk}`; }
    const r = await fetch('/api/ai', { method: 'POST', headers, body: JSON.stringify({ messages: msgs, context: aiContext(), mode }) });
    let data = {};
    try { data = await r.json(); } catch { /* not json */ }
    if (!r.ok) throw new Error(data.error || (r.status === 404 ? 'Vertex AI works after you deploy to Vercel (see README).' : 'The AI request failed.'));
    upd((s) => { s.chat.push({ role: 'assistant', content: data.reply }); });
  } catch (e) { toast(e.message || 'The AI request failed.'); } finally { ui.aiBusy = false; render(); }
}

// ------------------------------------------------------------------ community
function leaveChannels() { chanUnsub?.(); chanUnsub = null; presUnsub?.(); presUnsub = null; ui.chanLoaded = null; }
async function ensureChannel() {
  if (!cloud.enabled || !session) { ui.online = 1; return; }
  if (!presUnsub) presUnsub = cloud.trackPresence(session.user.id, ctxNow().userName || 'Student', (n) => { ui.online = n; if (parseRoute().page === 'channels') render(); });
  if (ui.chanLoaded === ui.channel) return;
  const ch = ui.channel;
  ui.chanLoaded = ch; chanUnsub?.(); ui.msgs = []; render();
  try {
    ui.msgs = await cloud.listMessages(ch);
    chanUnsub = cloud.subscribeMessages(ch, (m) => { if (!ui.msgs.some((x) => x.id === m.id)) { ui.msgs.push(m); if (parseRoute().page === 'channels') render(); } });
  } catch (e) { toast('Could not load messages'); }
  render();
}
async function sendChat() {
  const inp = $('#chatInput');
  const body = (inp?.value || '').trim();
  if (!body) return;
  const c = ctxNow();
  const name = c.userName || 'Student';
  const p = S().profile;
  const card = [p.level, p.countries.slice(0, 2).join(' & '), p.startYear].filter(Boolean).join(' · ');
  inp.value = '';
  active();
  if (cloud.enabled && session) {
    try {
      const row = await cloud.sendMessage({ channel: ui.channel, user_id: session.user.id, name, card, body });
      if (row && !ui.msgs.some((x) => x.id === row.id)) ui.msgs.push(row);
      render();
    } catch (e) { toast('Message not sent'); inp.value = body; }
  } else {
    upd((s) => { (s.local[ui.channel] = s.local[ui.channel] || []).push({ created_at: new Date().toISOString(), name, card, body }); });
  }
}

// ------------------------------------------------------------------ files
async function loadFiles() {
  if (!cloud.enabled || !session) return;
  try { ui.files = await cloud.listFiles(session.user.id); } catch { toast('Could not load files'); }
  render();
}
async function uploadFiles(list) {
  const cat = $('#upCat')?.value || ui.upCat || 'documents';
  ui.upCat = cat;
  for (const f of list) {
    if (f.size > 52428800) { toast(`${f.name} is over 50 MB`); continue; }
    try { await cloud.uploadFile(session.user.id, cat, f); toast(`Uploaded ${f.name}`); } catch (e) { toast(`Upload failed: ${e.message}`); }
  }
  active();
  await loadFiles();
}

// ------------------------------------------------------------------ auth + boot
async function afterLogin() {
  ui.uid = session.user.id;
  try {
    const remote = await cloud.loadState(ui.uid);
    if (remote) store.replace(remote);
    else { const meta = session.user.user_metadata?.name; if (meta && !S().profile.name) upd((s) => { s.profile.name = meta; }, { silent: true }); await cloud.saveState(ui.uid, S()); }
  } catch (e) { toast('Could not load your saved data'); }
  store.setRemote({ save: (s) => cloud.saveState(ui.uid, s) });
  try { applyOverrides(await cloud.loadOverrides()); } catch { /* table may be empty */ }
  maybeOnboard();
  render();
}
function maybeOnboard() {
  const r = parseRoute();
  if (r.page !== 'landing' && !S().onboarded && !(cloud.enabled && !session)) ui.layer = { kind: 'modal', type: 'onb' };
}
async function boot() {
  store.load();
  store.subscribe(() => render());
  applySettings();
  const root = $('#app');
  root.innerHTML = '<div class="auth"><div class="glass card"><b>Loading Vertex Unity…</b></div></div>';
  try { await loadData(); } catch (e) {
    root.innerHTML = '<div class="auth"><div class="glass card"><h3>Could not load data</h3><p class="muted small" style="margin-top:8px">Open this site through a web server (Vercel, or <code>python3 -m http.server</code>), not by double-clicking index.html.</p></div></div>';
    return;
  }
  if (cloud.enabled) {
    try {
      await cloud.init();
      session = await cloud.getSession();
      cloud.onAuth(async (s) => {
        const prev = session?.user?.id;
        session = s;
        if (s && s.user.id !== prev) await afterLogin();
        else if (!s && prev) { store.setRemote(null); store.clearLocal(); leaveChannels(); ui.uid = null; location.hash = '#/'; render(); }
      });
    } catch (e) { toast('Could not connect to Supabase'); }
  } else {
    try { applyOverrides(JSON.parse(localStorage.getItem(OVR_KEY) || '{}')); } catch { /* ignore */ }
  }
  if (session) await afterLogin(); else { maybeOnboard(); render(); }
  enterPage();
}
async function enterPage() {
  const r = parseRoute();
  if (r.page === 'channels') ensureChannel(); else leaveChannels();
  if (r.page === 'files') loadFiles();
}

window.addEventListener('hashchange', () => {
  ui.layer = null; ui.menuOpen = false; ui.bellOpen = false;
  document.body.classList.remove('nav-open');
  window.scrollTo(0, 0);
  maybeOnboard();
  render();
  enterPage();
});

// ------------------------------------------------------------------ binding helpers
function bindSet(path, value) {
  if (path === 'cmp.add') {
    if (!value) return;
    upd((s) => { if (!s.compare.includes(value) && s.compare.length < 4) s.compare.push(value); });
    return;
  }
  const parts = path.split('.');
  if (parts.length === 1) ui[parts[0]] = value;
  else { ui[parts[0]][parts[1]] = value; if (parts[0] === 'uni') ui.uni.limit = 48; }
  render();
}
function togPath(path) {
  const parts = path.split('.');
  if (parts.length === 1) ui[parts[0]] = !ui[parts[0]];
  else { ui[parts[0]][parts[1]] = !ui[parts[0]][parts[1]]; if (parts[0] === 'uni') ui.uni.limit = 48; }
  render();
}
function findApp(id) { return S().apps.find((a) => a.id === id); }

// ------------------------------------------------------------------ click actions
const ACTIONS = {
  grp: (d) => { ui.closedGroups[d.g] = !ui.closedGroups[d.g]; render(); },
  goto: (d) => go(d.page),
  'user-menu': () => { ui.menuOpen = !ui.menuOpen; ui.bellOpen = false; render(); },
  bell: () => { ui.bellOpen = !ui.bellOpen; ui.menuOpen = false; render(); },
  'close-pop': () => { ui.menuOpen = false; ui.bellOpen = false; render(); },
  'nav-toggle': () => document.body.classList.toggle('nav-open'),
  palette: openPalette,
  'pal-pick': (d) => { const r = ui.layer?.results?.[Number(d.i)]; if (r) runPick(r); },
  theme: () => upd((s) => { s.settings.theme = s.settings.theme === 'light' ? 'dark' : 'light'; }),
  signout: async () => {
    ui.menuOpen = false;
    if (cloud.enabled) { await cloud.signOut(); } else { location.hash = '#/'; render(); }
  },
  scroll: (d) => document.getElementById(d.to)?.scrollIntoView({ behavior: 'smooth' }),
  'open-app': () => go('home'),
  'back-landing': () => { location.hash = '#/'; },
  'auth-mode': (d) => { ui.authMode = d.v; render(); },
  close: () => closeLayer(),

  // drawers
  uni: (d) => setLayer({ kind: 'drawer', type: 'uni', id: d.id }),
  sch: (d) => setLayer({ kind: 'drawer', type: 'sch', id: d.id }),
  major: (d) => setLayer({ kind: 'drawer', type: 'major', id: d.id }),
  'app-open': (d) => setLayer({ kind: 'drawer', type: 'app', id: d.id }),
  'lib-open': (d) => setLayer({ kind: 'drawer', type: 'lib', id: d.id }),

  // save / compare / dream
  'save-uni': (d) => { active(); upd((s) => { const i = s.savedUnis.indexOf(d.id); if (i >= 0) s.savedUnis.splice(i, 1); else s.savedUnis.push(d.id); }); },
  'save-sch': (d) => { active(); upd((s) => { const i = s.savedSch.indexOf(d.id); if (i >= 0) s.savedSch.splice(i, 1); else { s.savedSch.push(d.id); } }); toast(S().savedSch.includes(d.id) ? 'Deadline added to your calendar' : 'Removed'); },
  cmp: (d) => {
    const on = S().compare.includes(d.id);
    if (!on && S().compare.length >= 4) { toast('You can compare up to four universities'); return; }
    upd((s) => { if (on) s.compare = s.compare.filter((x) => x !== d.id); else s.compare.push(d.id); });
  },
  'more-unis': () => { ui.uni.limit += 48; render(); },
  tog: (d) => togPath(d.path),
  majorcat: (d) => { ui.majorCat = d.v; render(); },
  'toggle-major': (d) => { active(); upd((s) => { const a = s.profile.majors; const i = a.indexOf(d.id); if (i >= 0) a.splice(i, 1); else a.push(d.id); }); },
  'dream-pick': (d) => { ui.dreamPick = d.id; render(); },
  'dream-go': () => {
    const u = DATA.byUni[ui.dreamPick];
    if (!u) return;
    const year = Number(ui.dreamYear || S().profile.startYear);
    active();
    upd((s) => { s.dream = { uniId: u.id, startYear: year, level: ui.dreamLevel || s.profile.level }; createApplication(s, u, genPlan(s, u, year), 'preparing'); });
    ui.dreamPick = null; render();
    toast('Plan built. Steps are on your calendar.');
  },
  'set-dream': (d) => {
    const u = DATA.byUni[d.id];
    active();
    upd((s) => { s.dream = { uniId: u.id, startYear: s.profile.startYear, level: s.profile.level }; createApplication(s, u, genPlan(s, u, s.profile.startYear), 'preparing'); });
    closeLayer(); toast(`${u.name} is your dream school`); go('dream');
  },
  'dream-clear': () => upd((s) => { s.dream = null; }),
  'dream-track': (d) => { const u = DATA.byUni[d.id]; upd((s) => { createApplication(s, u, genPlan(s, u, s.dream?.startYear || s.profile.startYear), 'preparing'); }); },

  // applications
  'add-app': (d) => {
    const u = DATA.byUni[d.id];
    if (S().apps.some((a) => a.uniId === u.id)) { closeLayer(); go('applications'); return; }
    active();
    upd((s) => { createApplication(s, u, genPlan(s, u, s.profile.startYear), 'researching'); });
    toast('Added to applications');
  },
  'add-app-modal': () => setLayer({ kind: 'modal', type: 'addApp' }),
  'add-app-go': () => {
    const id = $('#appUni')?.value;
    const name = ($('#appName')?.value || '').trim();
    if (!id && !name) { toast('Choose a university or type a name'); return; }
    active();
    if (id) { const u = DATA.byUni[id]; upd((s) => { createApplication(s, u, genPlan(s, u, s.profile.startYear), 'researching'); }); }
    else upd((s) => { s.apps.push({ id: uid(), uniId: 'custom-' + uid(), name, country: '', status: 'researching', deadline: null, note: '', tasks: ['Check requirements', 'Prepare documents', 'Write essays', 'Request recommendations', 'Submit application'].map((x) => ({ id: uid(), t: x, done: false, due: null })) }); });
    closeLayer();
  },
  'app-del': (d) => { if (confirm('Remove this application?')) { upd((s) => { s.apps = s.apps.filter((a) => a.id !== d.id); }); closeLayer(); } },
  'task-toggle': (d) => { active(); upd((s) => { const t0 = s.apps.find((a) => a.id === d.app)?.tasks.find((x) => x.id === d.t); if (t0) t0.done = !t0.done; }); },
  'plan-task': (d) => { if (!d.app) return; active(); upd((s) => { const t0 = s.apps.find((a) => a.id === d.app)?.tasks.find((x) => x.id === d.t); if (t0) t0.done = !t0.done; }); },
  'task-del': (d) => upd((s) => { const a = s.apps.find((x) => x.id === d.app); if (a) a.tasks = a.tasks.filter((x) => x.id !== d.t); }),
  'task-add': (d) => { const v = ($('#newTask')?.value || '').trim(); if (v) upd((s) => { s.apps.find((a) => a.id === d.id)?.tasks.push({ id: uid(), t: v, done: false, due: null }); }); },

  // calendar + tests
  'cal-nav': (d) => { const x = new Date(ui.cal.y, ui.cal.m + Number(d.d), 1); ui.cal = { y: x.getFullYear(), m: x.getMonth() }; render(); },
  'cal-today': () => { const n = new Date(); ui.cal = { y: n.getFullYear(), m: n.getMonth() }; render(); },
  'ev-modal': (d) => setLayer({ kind: 'modal', type: 'event', date: d.date, evKind: d.kind }),
  'ev-add': () => {
    const title = ($('#evTitle')?.value || '').trim();
    const date = $('#evDate')?.value;
    if (!title || !date) { toast('Add a title and a date'); return; }
    const kind = $('#evKind')?.value || 'ev';
    active(); upd((s) => { s.events.push({ id: uid(), title, date, kind }); }); closeLayer();
  },
  'score-modal': () => setLayer({ kind: 'modal', type: 'score' }),
  'score-add': () => {
    const score = parseFloat($('#scScore')?.value);
    if (!score || score <= 0) { toast('Enter a score'); return; }
    active();
    upd((s) => { s.scores.push({ id: uid(), test: $('#scTest').value, score, date: $('#scDate').value || iso(today()), official: $('#scOff').checked }); });
    closeLayer();
  },
  'score-del': (d) => upd((s) => { s.scores = s.scores.filter((x) => x.id !== d.id); }),
  target: (d) => { const v = parseFloat(prompt('Target score', S().targets[d.t])); if (v > 0) upd((s) => { s.targets[d.t] = v; }); },

  // essays + AI
  'essay-modal': () => setLayer({ kind: 'modal', type: 'essay' }),
  'essay-add': () => {
    const pid = $('#esPrompt').value;
    let p = DATA.prompts.find((x) => x.id === pid);
    if (!p) { const txt = prompt('Paste or type your prompt'); if (!txt) return; p = { label: 'Custom prompt', text: txt, limit: 650 }; }
    const e = { id: uid(), title: ($('#esTitle').value || '').trim() || p.label, promptId: p.id || 'custom', prompt: p.text, limit: p.limit, body: '', updated: iso(today()) };
    active(); upd((s) => { s.essays.unshift(e); }, { silent: true });
    closeLayer(); location.hash = `#/app/essay/${e.id}`;
  },
  'essay-open': (d) => { location.hash = `#/app/essay/${d.id}`; },
  'essay-del': (d) => { if (confirm('Delete this essay?')) { upd((s) => { s.essays = s.essays.filter((e) => e.id !== d.id); }, { silent: true }); go('essays'); } },
  'essay-ai': (d) => {
    const e = S().essays.find((x) => x.id === d.id);
    if (!e || !e.body.trim()) { toast('Write something first'); return; }
    go('ai');
    sendAI(`Please give me feedback on my essay draft (do not rewrite it).\nPrompt: ${e.prompt}\n\nDraft:\n${e.body}`, 'essay');
  },
  'ai-suggest': (d) => sendAI(d.q),
  'ai-send': () => { const i = $('#aiInput'); const v = i.value; i.value = ''; sendAI(v); },
  'ai-clear': () => upd((s) => { s.chat = []; }),

  // community + files
  channel: (d) => { ui.channel = d.id; ensureChannel(); render(); },
  'chat-send': sendChat,
  filecat: (d) => { ui.fileCat = d.v; render(); },
  'file-open': async (d) => { try { window.open(await cloud.fileUrl(d.p), '_blank'); } catch { toast('Could not open file'); } },
  'file-del': async (d) => { if (!confirm('Delete this file?')) return; try { await cloud.removeFile(d.p); await loadFiles(); } catch { toast('Could not delete'); } },

  // data health
  'edit-uni': (d) => setLayer({ kind: 'modal', type: 'edit', id: d.id }),
  'edit-save': async (d) => {
    const patch = {};
    document.querySelectorAll('[data-ed]').forEach((el) => {
      const k = el.dataset.ed;
      const v = el.value.trim();
      patch[k] = v === '' ? null : el.type === 'number' ? Number(v) : v;
    });
    applyOverrides({ [d.id]: patch });
    if (cloud.enabled && session) { try { await cloud.saveOverride(d.id, patch, session.user.id); } catch (e) { toast('Saved here, but could not share: ' + e.message); } }
    else { try { const all = JSON.parse(localStorage.getItem(OVR_KEY) || '{}'); all[d.id] = patch; localStorage.setItem(OVR_KEY, JSON.stringify(all)); } catch { /* quota */ } }
    closeLayer(); render(); toast('Saved. Thank you for improving the data.');
  },

  // profile + personalize
  photo: () => pickImage(async (f) => { const u = await fileToDataUrl(f, 256, 0.85); upd((s) => { s.profile.photo = u; }); }),
  'photo-rm': () => upd((s) => { s.profile.photo = ''; }),
  set: (d) => upd((s) => { const k = d.k; s.settings[k] = k === 'weeklyGoal' ? Number(d.v) : d.v; }),
  preset: (d) => { const p = B.PRESETS.find((x) => x[0] === d.id); if (p) upd((s) => { Object.assign(s.settings, p[3]); if (!p[3].density) s.settings.density = 'comfortable'; if (!p[3].motion) s.settings.motion = 'full'; }); },
  'wall-upload': () => {
    if (store.getCustomWall() && S().settings.wall !== 'custom') { upd((s) => { s.settings.wall = 'custom'; }); return; }
    pickImage(async (f) => {
      const u = await fileToDataUrl(f, 1920, 0.8);
      if (!store.setCustomWall(u)) { toast('That photo is too large to store. Try a smaller one.'); return; }
      upd((s) => { s.settings.wall = 'custom'; });
    });
  },
  'pers-tab': (d) => { ui.persTab = d.v; render(); },
  'export-settings': () => download('vertex-settings.json', JSON.stringify(S().settings, null, 2)),
  'import-settings': () => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'application/json';
    i.onchange = async () => { try { const j = JSON.parse(await i.files[0].text()); upd((s) => { s.settings = { ...s.settings, ...j, widgets: { ...s.settings.widgets, ...(j.widgets || {}) } }; }); toast('Settings imported'); } catch { toast('That file is not a settings export'); } };
    i.click();
  },
  'reset-sidebar': () => { ui.closedGroups = {}; upd((s) => { s.settings.labels = true; }); },
  'reset-settings': () => { if (confirm('Reset all settings?')) upd((s) => { s.settings = store.defaults().settings; }); },

  // onboarding
  'ob-major': (d, el) => { el.classList.toggle('on'); if (ui.obMajors.has(d.id)) ui.obMajors.delete(d.id); else ui.obMajors.add(d.id); },
  'ob-skip': () => { upd((s) => { s.onboarded = true; }, { silent: true }); closeLayer(); },
  'ob-save': () => {
    const v = (id) => ($(id)?.value || '').trim();
    upd((s) => {
      const p = s.profile;
      if (v('#ob-name')) p.name = v('#ob-name');
      p.level = v('#ob-level') || p.level; p.startYear = Number(v('#ob-year')) || p.startYear;
      p.budget = v('#ob-budget'); p.ielts = v('#ob-ielts'); p.gpa = v('#ob-gpa');
      p.countries = v('#ob-countries').split(',').map((x) => x.trim()).filter(Boolean);
      if (ui.obMajors.size) p.majors = [...ui.obMajors];
      s.onboarded = true;
    }, { silent: true });
    ui.obMajors = new Set(); closeLayer(); render(); active();
  },
};
function runPick(r) {
  if (r.act === 'goto') { closeLayer(); go(r.page); return; }
  setLayer({ kind: 'drawer', type: r.act, id: r.id });
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) {
    if (e.target === document.body) document.body.classList.remove('nav-open');
    return;
  }
  const fn = ACTIONS[el.dataset.act];
  if (!fn) return;
  if (el.tagName === 'A' && ['scroll', 'back-landing'].includes(el.dataset.act)) e.preventDefault();
  if (el.tagName === 'DIV' && el.classList.contains('scrim')) { closeLayer(); return; }
  fn(el.dataset, el);
});

// ------------------------------------------------------------------ inputs
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.tagName === 'SELECT') return;
  if (el.dataset.bind) { bindSet(el.dataset.bind, el.value); return; }
  if (el.dataset.prof) {
    const k = el.dataset.prof;
    upd((s) => { s.profile[k] = k === 'countries' ? el.value.split(',').map((x) => x.trim()).filter(Boolean) : k === 'startYear' ? Number(el.value) || '' : el.value; }, { silent: true });
    return;
  }
  if (el.dataset.essayField) {
    const id = el.dataset.id;
    upd((s) => { const es = s.essays.find((x) => x.id === id); if (es) { es[el.dataset.essayField] = el.value; es.updated = iso(today()); } }, { silent: true });
    if (el.dataset.essayField === 'body') {
      active();
      const es = S().essays.find((x) => x.id === id);
      const w = wordCount(el.value);
      const wc = $('#wc');
      if (wc && es) { wc.textContent = `${w} / ${es.limit} words`; wc.className = `tag ${w > es.limit ? 'bad' : ''}`; }
    }
    return;
  }
  if (el.dataset.appField === 'note') { upd((s) => { const a = s.apps.find((x) => x.id === el.dataset.id); if (a) a.note = el.value; }, { silent: true }); return; }
  if (el.dataset.range) { upd((s) => { s.settings[el.dataset.range] = Number(el.value); }, { silent: true }); applySettings(); return; }
  if (el.id === 'palInput' && ui.layer?.type === 'palette') { ui.layer.q = el.value; ui.layer.sel = 0; $('#palRes').innerHTML = paletteRes(); }
});
document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.bind && el.tagName === 'SELECT') { bindSet(el.dataset.bind, el.value); if (el.dataset.bind === 'cmp.add') el.value = ''; return; }
  if (el.dataset.appField && el.dataset.appField !== 'note') { active(); upd((s) => { const a = s.apps.find((x) => x.id === el.dataset.id); if (a) a[el.dataset.appField] = el.value || null; }); return; }
  if (el.dataset.setCheck) {
    const k = el.dataset.setCheck;
    upd((s) => { if (k.startsWith('w.')) s.settings.widgets[k.slice(2)] = el.checked; else s.settings[k] = el.checked; });
    return;
  }
  if (el.dataset.range) { render(); return; }
  if (el.dataset.prof === 'level') { upd((s) => { s.profile.level = el.value; }, { silent: true }); return; }
  if (el.id === 'upCat') { ui.upCat = el.value; return; }
  if (el.id === 'fileInput' && el.files.length) uploadFiles([...el.files]);
});
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (cloud.enabled && !session && parseRoute().page !== 'landing') return; openPalette(); return; }
  if (e.key === 'Escape') { if (ui.layer && ui.layer.type !== 'onb') closeLayer(); ui.menuOpen = ui.bellOpen = false; document.body.classList.remove('nav-open'); return; }
  const L = ui.layer;
  if (L?.type === 'palette' && ['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
    e.preventDefault();
    const n = L.results?.length || 0;
    if (e.key === 'Enter') { const r = L.results?.[L.sel || 0]; if (r) runPick(r); return; }
    L.sel = n ? (((L.sel || 0) + (e.key === 'ArrowDown' ? 1 : -1)) + n) % n : 0;
    $('#palRes').innerHTML = paletteRes();
    return;
  }
  if (e.key === 'Enter' && !e.shiftKey) {
    if (e.target.id === 'chatInput') { e.preventDefault(); sendChat(); }
    if (e.target.id === 'aiInput') { e.preventDefault(); const i = e.target; const v = i.value; i.value = ''; sendAI(v); }
  }
});
document.addEventListener('submit', async (e) => {
  const f = e.target.closest('[data-form="auth"]');
  if (!f) return;
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(f));
  const msg = $('#authMsg');
  const say = (x, ok) => { msg.textContent = x; msg.style.color = ok ? 'var(--good)' : 'var(--bad)'; };
  say('Please wait…', true);
  try {
    if (ui.authMode === 'in') await cloud.signIn(fd.email, fd.password);
    else if (ui.authMode === 'up') { const r = await cloud.signUp(fd.email, fd.password, fd.name); if (!r.session) say('Check your email to confirm your account, then sign in.', true); }
    else { await cloud.resetPassword(fd.email); say('Reset link sent. Check your email.', true); }
  } catch (err) { say(err.message || 'Something went wrong', false); }
});

// ------------------------------------------------------------------ drag & drop (kanban + file drop zone)
document.addEventListener('dragstart', (e) => { const c = e.target.closest?.('[data-drag]'); if (c) { e.dataTransfer.setData('text/plain', c.dataset.drag); e.dataTransfer.effectAllowed = 'move'; } });
document.addEventListener('dragover', (e) => {
  const col = e.target.closest?.('[data-drop]');
  const dz = e.target.closest?.('[data-dropzone]');
  if (col) { e.preventDefault(); col.classList.add('over'); }
  if (dz) { e.preventDefault(); dz.classList.add('over'); }
});
document.addEventListener('dragleave', (e) => { e.target.closest?.('[data-drop],[data-dropzone]')?.classList.remove('over'); });
document.addEventListener('drop', (e) => {
  const col = e.target.closest?.('[data-drop]');
  const dz = e.target.closest?.('[data-dropzone]');
  if (col) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (findApp(id)) { active(); upd((s) => { s.apps.find((a) => a.id === id).status = col.dataset.drop; }); }
  }
  if (dz) { e.preventDefault(); dz.classList.remove('over'); if (e.dataTransfer.files.length) uploadFiles([...e.dataTransfer.files]); }
});
document.addEventListener('click', (e) => { const dz = e.target.closest?.('[data-dropzone]'); if (dz) $('#fileInput')?.click(); });

// ------------------------------------------------------------------ 3D tilt on cards
const canHover = window.matchMedia?.('(hover: hover)').matches;
if (canHover) {
  document.addEventListener('mousemove', (e) => {
    const s = S().settings;
    if (!s.tilt || s.motion !== 'full') return;
    const el = e.target.closest?.('.tilt');
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) translateY(-3px)`;
  });
  document.addEventListener('mouseout', (e) => { const el = e.target.closest?.('.tilt'); if (el && !el.contains(e.relatedTarget)) el.style.transform = ''; });
}

boot();
