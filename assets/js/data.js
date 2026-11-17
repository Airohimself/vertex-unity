// Catalogue loading plus all the "smart" logic: fit scores, readiness checklist, dated roadmap, calendar items.
import { iso, today, addDays, fromIso, parseMD, nextOccurrence, daysBetween, uid } from './util.js';

export const DATA = {
  unis: [], schs: [], majors: [], essays: [], prompts: [], tests: [], resources: [], guides: {},
  byUni: {}, bySch: {}, majorById: {}, countries: [], loaded: false,
};

export function isFull(u) { return u.tuition != null && u.ielts != null && !!u.deadline; }

export async function loadData(base = 'assets/data/') {
  const names = ['universities', 'scholarships', 'majors', 'essays', 'prompts', 'tests', 'resources', 'guides'];
  const res = await Promise.all(names.map((n) => fetch(`${base}${n}.json`).then((r) => { if (!r.ok) throw new Error(n); return r.json(); })));
  const [unis, schs, majors, essays, prompts, tests, resources, guides] = res;
  Object.assign(DATA, { unis, schs, majors, essays, prompts, tests, resources, guides });
  indexData();
  DATA.loaded = true;
  return DATA;
}
export function setData(obj) { Object.assign(DATA, obj); indexData(); DATA.loaded = true; }
function indexData() {
  DATA.byUni = Object.fromEntries(DATA.unis.map((u) => [u.id, u]));
  DATA.bySch = Object.fromEntries(DATA.schs.map((s) => [s.id, s]));
  DATA.majorById = Object.fromEntries(DATA.majors.map((m) => [m.id, m]));
  DATA.countries = [...new Set(DATA.unis.map((u) => u.country))].sort();
}
export function applyOverrides(map) {
  Object.entries(map || {}).forEach(([id, patch]) => {
    const u = DATA.byUni[id];
    if (!u) return;
    Object.assign(u, patch);
    u.full = isFull(u);
    u.edited = true;
  });
}

// ---------------------------------------------------------------- helpers
export const totalCost = (u) => (u.tuition != null ? u.tuition + (u.living ?? 0) : null);
export const levelCode = (lvl) => ({ Bachelor: 'b', Master: 'm', PhD: 'p' }[lvl] || 'b');
export function gpa4(g) {
  const n = parseFloat(g);
  if (!n || Number.isNaN(n)) return null;
  return n <= 4.5 ? n : n <= 100 ? (n / 100) * 4 : null;
}
export function bestScore(S, test) {
  const list = S.scores.filter((s) => s.test === test && s.official);
  if (list.length) return Math.max(...list.map((s) => Number(s.score)));
  if (test === 'ielts' && S.profile.ielts) return Number(S.profile.ielts);
  if (test === 'sat' && S.profile.sat) return Number(S.profile.sat);
  return null;
}

const COMMONWEALTH = ['India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nigeria', 'Ghana', 'Kenya', 'Uganda', 'Tanzania', 'Malaysia', 'Singapore', 'South Africa', 'Cameroon', 'Zambia', 'Malawi', 'Nepal'];
const AFRICA = ['Nigeria', 'Ghana', 'Kenya', 'Uganda', 'Tanzania', 'Ethiopia', 'Rwanda', 'South Africa', 'Zambia', 'Malawi', 'Senegal', 'Egypt', 'Morocco', 'Cameroon', 'Zimbabwe'];

// ---------------------------------------------------------------- university fit
// Returns {score:0-100|null, items:[{label, ok:true|false|null, note}]}
export function uniFit(u, S) {
  const p = S.profile;
  const items = [];
  const ielts = bestScore(S, 'ielts');
  if (u.ielts != null) {
    if (ielts == null) items.push({ label: 'English', ok: null, note: `Needs IELTS ${u.ielts}; add your score` });
    else items.push({ label: 'English', ok: ielts >= u.ielts, note: ielts >= u.ielts ? `IELTS ${ielts} meets the minimum of ${u.ielts}` : `IELTS ${ielts} is below the minimum of ${u.ielts}` });
  }
  const cost = totalCost(u);
  const budget = Number(p.budget);
  if (cost != null && budget > 0) items.push({ label: 'Budget', ok: cost <= budget, note: cost <= budget ? 'Within your yearly budget' : 'Above your yearly budget' });
  if (p.majors.length && u.strong.length) {
    const hit = p.majors.filter((m) => u.strong.includes(m));
    items.push({ label: 'Majors', ok: hit.length > 0, note: hit.length ? `Strong in ${hit.map((m) => DATA.majorById[m]?.name || m).join(', ')}` : 'None of your majors are listed as strengths' });
  }
  if (p.countries.length) items.push({ label: 'Country', ok: p.countries.some((c) => c.toLowerCase() === u.country.toLowerCase()), note: 'Matches your preferred countries' });
  const evald = items.filter((i) => i.ok !== null);
  const score = evald.length ? Math.round((evald.filter((i) => i.ok).length / evald.length) * 100) : null;
  return { score, items };
}
export function meetsIelts(u, S) { const b = bestScore(S, 'ielts'); return u.ielts == null || (b != null && b >= u.ielts); }

// ---------------------------------------------------------------- scholarship fit
export function schFit(s, S) {
  const p = S.profile;
  const items = [];
  const lvl = levelCode(p.level);
  items.push({ label: 'Level', ok: s.levels.includes(lvl), note: s.levels.includes(lvl) ? 'Meets the published requirement' : `Offered for ${s.levels.map((l) => ({ b: 'Bachelor', m: 'Master', p: 'PhD' }[l])).join(', ')}` });
  const nat = (p.nationality || '').trim();
  let natOk = true;
  let natNote = 'Open to international students';
  if (s.eligible === '!eligible') { natOk = null; natNote = 'Only selected countries: check the official list'; }
  else if (s.eligible === 'Commonwealth') { natOk = COMMONWEALTH.includes(nat); natNote = natOk ? 'Your country is eligible' : 'Only for Commonwealth countries'; }
  else if (s.eligible === 'Africa') { natOk = AFRICA.includes(nat); natNote = natOk ? 'Your country is eligible' : 'Only for students from Africa'; }
  else if (s.eligible !== 'all') { natOk = s.eligible.split(',').map((x) => x.trim().toLowerCase()).includes(nat.toLowerCase()); natNote = natOk ? 'Your nationality is eligible' : `Only for citizens of ${s.eligible}`; }
  items.push({ label: 'Nationality', ok: natOk, note: natNote });
  const ielts = bestScore(S, 'ielts');
  if (s.ielts != null) {
    if (ielts == null) items.push({ label: 'English', ok: null, note: `Typically needs IELTS ${s.ielts}` });
    else items.push({ label: 'English', ok: ielts >= s.ielts, note: ielts >= s.ielts ? `IELTS ${ielts} meets ${s.ielts}` : `IELTS ${ielts} is below ${s.ielts}` });
  }
  const g = gpa4(p.gpa);
  if (s.gpa != null) {
    if (g == null) items.push({ label: 'Grades', ok: null, note: `Competitive applicants have about ${s.gpa}/4.0` });
    else items.push({ label: 'Grades', ok: g >= s.gpa, note: g >= s.gpa ? 'Meets the usual level' : `Usually about ${s.gpa}/4.0 or higher` });
  }
  const evald = items.filter((i) => i.ok !== null);
  const score = evald.length ? Math.round((evald.filter((i) => i.ok).length / evald.length) * 100) : null;
  const eligible = items.filter((i) => i.label === 'Level' || i.label === 'Nationality').every((i) => i.ok !== false);
  return { score, items, eligible };
}
export const schNext = (s) => nextOccurrence(s.deadline);

// ---------------------------------------------------------------- readiness
export function readiness(S) {
  const items = [
    { id: 'dream', label: 'Choose your dream school', done: !!S.dream, go: 'dream' },
    { id: 'english', label: 'Add your English test score', done: bestScore(S, 'ielts') != null || S.scores.some((s) => ['toefl', 'duolingo'].includes(s.test)), go: 'tests' },
    { id: 'majors', label: "Pick the majors you're considering", done: S.profile.majors.length > 0, go: 'profile' },
    { id: 'unis', label: 'Save at least 3 universities', done: S.savedUnis.length >= 3, go: 'universities' },
    { id: 'sch', label: 'Save a scholarship', done: S.savedSch.length >= 1, go: 'scholarships' },
    { id: 'app', label: 'Start an application', done: S.apps.length >= 1, go: 'applications' },
    { id: 'essay', label: 'Start an essay draft', done: S.essays.some((e) => (e.body || '').trim().length > 0), go: 'essays' },
  ];
  return { items, done: items.filter((i) => i.done).length, total: items.length };
}

// ---------------------------------------------------------------- dated roadmap
// Finds the deadline for the intake year: the latest occurrence of the uni's month/day before Sep 1 of startYear.
export function deadlineFor(u, startYear) {
  const md = parseMD(u.deadline);
  if (!md) return null;
  const intake = new Date(startYear, 8, 1);
  let best = null;
  [startYear - 1, startYear].forEach((y) => { const d = new Date(y, md.m, md.d); if (d <= intake) best = d; });
  return best || nextOccurrence(u.deadline);
}
export function genPlan(S, u, startYear) {
  const dl = deadlineFor(u, startYear);
  const gaps = [];
  const ielts = bestScore(S, 'ielts');
  if (u.ielts != null) {
    if (ielts == null) gaps.push(`Take IELTS and aim for ${u.ielts}+ (no score logged yet).`);
    else if (ielts < u.ielts) gaps.push(`IELTS gap: you have ${ielts}, ${u.name} asks for ${u.ielts}.`);
  }
  const cost = totalCost(u);
  const budget = Number(S.profile.budget);
  if (cost != null && budget > 0 && cost > budget) gaps.push(`Budget gap: about $${(cost - budget).toLocaleString('en-US')} per year above your budget. Look at scholarships.`);
  if (cost != null && !(budget > 0)) gaps.push('Add your yearly budget in Profile & goals to see the cost gap.');
  if (!dl) return { deadline: null, tasks: [], gaps: [...gaps, 'No deadline known yet: check the official site and add it in Data Health.'] };
  const T = [];
  const add = (days, t) => T.push({ id: uid(), t, done: false, due: iso(addDays(dl, -days)) });
  add(150, `Read ${u.short || u.name} requirements on the official site and shortlist your major`);
  if (u.ielts != null && (ielts == null || ielts < u.ielts)) add(120, `Sit IELTS and reach ${u.ielts}+`);
  add(90, 'Write the first full draft of your main essay');
  add(75, 'Ask two teachers for recommendation letters');
  add(60, 'Collect transcripts, translations and passport copies');
  add(30, 'Finish essays and get feedback from a mentor');
  add(21, 'Prepare financial documents and scholarship forms');
  add(7, 'Final review of every field, then submit');
  return { deadline: iso(dl), tasks: T, gaps };
}
export function createApplication(S, u, plan, status = 'preparing') {
  const ex = S.apps.find((a) => a.uniId === u.id);
  const app = ex || { id: uid(), uniId: u.id, name: u.name, country: u.country, status, deadline: null, tasks: [], note: '' };
  app.status = ex ? ex.status : status;
  if (plan) {
    app.deadline = plan.deadline;
    if (!app.tasks.length) app.tasks = plan.tasks;
  } else if (!app.tasks.length) {
    app.tasks = ['Check requirements', 'Prepare documents', 'Write essays', 'Request recommendations', 'Take required tests', 'Submit application'].map((t) => ({ id: uid(), t, done: false, due: null }));
  }
  if (!ex) S.apps.push(app);
  return app;
}

// ---------------------------------------------------------------- calendar
// All dated things in one list: {date: Date, title, kind: 'sch'|'app'|'task'|'ev'|'test', ref}
export function calendarItems(S) {
  const out = [];
  S.savedSch.forEach((id) => { const s = DATA.bySch[id]; const d = s && schNext(s); if (d) out.push({ date: d, title: `${s.name} deadline`, kind: 'sch', ref: id }); });
  S.apps.forEach((a) => {
    if (a.deadline) out.push({ date: fromIso(a.deadline), title: `${a.name} deadline`, kind: 'app', ref: a.id });
    a.tasks.filter((t) => t.due && !t.done).forEach((t) => out.push({ date: fromIso(t.due), title: `${a.name}: ${t.t}`, kind: 'task', ref: a.id }));
  });
  S.events.forEach((e) => out.push({ date: fromIso(e.date), title: e.title, kind: e.kind === 'test' ? 'test' : 'ev', ref: e.id }));
  return out.sort((a, b) => a.date - b.date);
}
export function notifications(S) {
  const t0 = today();
  return calendarItems(S).filter((i) => { const n = daysBetween(t0, i.date); return n >= 0 && n <= 14; }).slice(0, 12);
}
