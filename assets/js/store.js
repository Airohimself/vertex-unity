// App state: one object, saved in localStorage, and mirrored to Supabase when signed in.
import { iso, today, addDays } from './util.js';

const KEY = 'vu_state_v1';
const WALL_KEY = 'vu_custom_wall';

export function defaults() {
  return {
    v: 1,
    onboarded: false,
    profile: { name: '', nationality: 'Uzbekistan', level: 'Bachelor', startYear: 2027, budget: '', gpa: '', ielts: '', sat: '', majors: [], countries: [], about: '', photo: '' },
    savedUnis: [],
    savedSch: [],
    compare: [],
    apps: [],          // {id, uniId, name, country, status, deadline, tasks:[{id,t,done,due}], note}
    events: [],        // {id, title, date, kind}
    scores: [],        // {id, test, score, date, official}
    targets: { ielts: 7, toefl: 100, sat: 1500, duolingo: 130, gre: 320, gmat: 645, ap: 5 },
    essays: [],        // {id, title, promptId, prompt, limit, body, updated}
    dream: null,       // {uniId, startYear, level}
    active: {},        // {'2026-11-16': 1}
    chat: [],          // Vertex AI conversation
    local: {},         // channel -> messages (demo mode)
    settings: {
      theme: 'dark', accent: '#22d3ee', wall: 'campus', dim: 50, blur: 'soft',
      textSize: 'A', density: 'comfortable', corners: 'round', labels: true,
      weeklyGoal: 4, language: 'en', currency: 'USD', motion: 'full', tilt: true, hc: false,
      widgets: { week: true, readiness: true, quick: true, scholarships: true, roadmap: true, applications: true, fit: true },
    },
  };
}

let S = defaults();
let remote = null;
let timer = null;
const subs = new Set();

function merge(base, saved) {
  const out = { ...base, ...saved };
  out.profile = { ...base.profile, ...(saved.profile || {}) };
  out.targets = { ...base.targets, ...(saved.targets || {}) };
  out.settings = { ...base.settings, ...(saved.settings || {}) };
  out.settings.widgets = { ...base.settings.widgets, ...((saved.settings || {}).widgets || {}) };
  return out;
}

export function load() {
  try { S = merge(defaults(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { S = defaults(); }
  return S;
}
export const get = () => S;
export const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };
export const setRemote = (r) => { remote = r; };

function persist(sync = true) {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* quota */ }
  if (sync && remote) {
    clearTimeout(timer);
    timer = setTimeout(() => { remote.save(S).catch(() => {}); }, 1500);
  }
}

// update(fn) mutates the state; pass {silent:true} to skip re-render (typing in an editor).
export function update(fn, { silent = false } = {}) {
  fn(S);
  persist();
  if (!silent) subs.forEach((f) => f(S));
}
export function replace(next, { sync = false } = {}) {
  S = merge(defaults(), next || {});
  persist(sync);
  subs.forEach((f) => f(S));
}
export function clearLocal() {
  try { localStorage.removeItem(KEY); localStorage.removeItem(WALL_KEY); } catch { /* ignore */ }
  S = defaults();
}

// Custom wallpaper photo is kept out of the synced state (it is big and private).
export const getCustomWall = () => { try { return localStorage.getItem(WALL_KEY) || ''; } catch { return ''; } };
export const setCustomWall = (d) => { try { if (d) localStorage.setItem(WALL_KEY, d); else localStorage.removeItem(WALL_KEY); return true; } catch { return false; } };

// ---------------------------------------------------------------- activity & streaks
export function touchActive() {
  const k = iso(today());
  if (!S.active[k]) { S.active[k] = 1; persist(); }
}
export function weekDays(from = today()) {
  const d = new Date(from);
  const dow = (d.getDay() + 6) % 7; // Monday=0
  const mon = addDays(d, -dow);
  return Array.from({ length: 7 }, (_, i) => { const x = addDays(mon, i); return { date: x, key: iso(x), on: !!S.active[iso(x)] }; });
}
export function streak() {
  let n = 0;
  let d = today();
  if (!S.active[iso(d)]) d = addDays(d, -1);
  while (S.active[iso(d)]) { n++; d = addDays(d, -1); }
  return n;
}
