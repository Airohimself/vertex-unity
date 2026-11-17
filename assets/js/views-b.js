// Views, part 2: plan, create, community, library, profile, personalize.
import { esc, icon, ico, fmtDate, fmtDateY, relDays, daysUntil, iso, today, fromIso, MONTH_NAMES, addDays, startOfDay, initials, wordCount, uid } from './util.js';
import { DATA, totalCost, bestScore, genPlan, deadlineFor, calendarItems, uniFit } from './data.js';
import { pageHead, banner } from './views-a.js';
import { t } from './i18n.js';

// ---------------------------------------------------------------- dream school
export function dream(ctx) {
  const { S, ui, money } = ctx;
  const u = S.dream && DATA.byUni[S.dream.uniId];
  if (u) return dreamPlan(ctx, u);
  const q = (ui.dreamQ || '').toLowerCase();
  const top = ['mit', 'harvard', 'stanford', 'caltech', 'princeton', 'yale', 'uchicago', 'penn'].map((i) => DATA.byUni[i]).filter(Boolean);
  const list = (q ? DATA.unis.filter((x) => `${x.name} ${x.short} ${x.country}`.toLowerCase().includes(q)).slice(0, 8) : top);
  const pick = ui.dreamPick;
  return `${pageHead(t('dream'), 'Pick the university you want most. Vertex builds a dated plan from your scores, budget and its deadlines, then Vertex AI helps you follow it.')}
  <div class="glass card" style="max-width:640px;width:100%;margin:0 auto">
    <div class="row" style="padding:0 0 12px">${icon('search', 16)}<input data-bind="dreamQ" value="${esc(ui.dreamQ || '')}" placeholder="Pick your dream school…" style="border:0;background:none;padding:6px"></div>
    <div class="stack" style="gap:8px">${list.map((x) => `<button class="stepitem" data-act="dream-pick" data-id="${x.id}" style="text-align:left;${pick === x.id ? 'border-color:var(--accent);background:color-mix(in srgb,var(--accent) 15%,transparent)' : ''}"><span class="banner" style="width:70px;height:44px;padding:4px 8px;border-radius:10px;background:${'linear-gradient(135deg,#7c2d12,#1f2937)'}"><b style="font-size:.7rem">${esc(x.short)}</b></span><div><b>${esc(x.name)}</b><div class="muted small">${esc(x.city)}, ${esc(x.country)}</div></div></button>`).join('') || '<p class="muted small">No match.</p>'}</div>
    <div class="grid g2" style="margin-top:16px"><label class="f">Intake year<select data-bind="dreamYear">${[2026, 2027, 2028, 2029].map((y) => `<option ${y === (ui.dreamYear || S.profile.startYear) ? 'selected' : ''}>${y}</option>`).join('')}</select></label>
      <label class="f">Degree<select data-bind="dreamLevel">${['Bachelor', 'Master', 'PhD'].map((l) => `<option ${l === (ui.dreamLevel || S.profile.level) ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
    <button class="btn primary" style="width:100%;margin-top:16px" data-act="dream-go" ${pick ? '' : 'disabled'}>${icon('target', 16)} Build my plan</button></div>`;
}
function dreamPlan(ctx, u) {
  const { S, money } = ctx;
  const year = S.dream.startYear || S.profile.startYear;
  const app = S.apps.find((a) => a.uniId === u.id);
  const plan = app ? { deadline: app.deadline, tasks: app.tasks, gaps: genPlan(S, u, year).gaps } : genPlan(S, u, year);
  const done = plan.tasks.filter((x) => x.done).length;
  const cost = totalCost(u);
  return `${pageHead(t('dream'), `Your dated plan for ${esc(u.name)} · ${year} intake`, `<button class="btn" data-act="dream-clear">Change dream school</button>`)}
  <div class="glass card row" style="gap:20px;flex-wrap:wrap"><div style="width:210px">${banner(u)}</div>
    <div class="grow"><h2>${esc(u.name)}</h2><p class="muted">${esc(u.city)}, ${esc(u.country)}</p>
      <div class="row wrap" style="gap:8px;margin-top:10px">${cost != null ? `<span class="tag">${money(cost)}/yr</span>` : ''}${u.ielts ? `<span class="tag mute">IELTS ${u.ielts}</span>` : ''}${plan.deadline ? `<span class="tag warn">Deadline ${fmtDateY(plan.deadline)} · ${relDays(plan.deadline)}</span>` : ''}</div>
      <div class="row wrap" style="margin-top:14px"><button class="btn small" data-act="uni" data-id="${u.id}">View university</button>${app ? '' : `<button class="btn small primary" data-act="dream-track" data-id="${u.id}">${icon('plus', 14)} Track as application</button>`}<a class="btn small" href="#/app/ai">${icon('sparkle', 14)} Ask Vertex AI</a></div></div></div>
  ${plan.gaps.length ? `<div class="glass card"><h3>Gaps to close</h3><div class="stack" style="gap:8px;margin-top:12px">${plan.gaps.map((g) => `<div class="stepitem">${icon('target', 16)}<span>${esc(g)}</span></div>`).join('')}</div></div>` : '<div class="glass card tight"><span class="tag good">✓</span> Your scores and budget match this school on paper.</div>'}
  <div class="glass card"><div class="row between"><h3>Roadmap</h3><span class="muted small">${done}/${plan.tasks.length} done</span></div><div class="progress"><i style="width:${Math.round(done / Math.max(1, plan.tasks.length) * 100)}%"></i></div>
    <div class="stack" style="gap:8px;margin-top:12px">${plan.tasks.map((x) => `<label class="stepitem" style="cursor:pointer"><input type="checkbox" style="width:auto" ${x.done ? 'checked' : ''} data-act="plan-task" data-app="${app?.id || ''}" data-t="${x.id}" ${app ? '' : 'disabled'}><span class="grow" style="${x.done ? 'text-decoration:line-through;opacity:.6' : ''}">${esc(x.t)}</span>${x.due ? `<span class="tag mute">${fmtDate(x.due)}</span>` : ''}</label>`).join('') || '<p class="muted">No dated steps because no deadline is known yet.</p>'}</div>
    ${app ? '' : '<p class="muted small" style="margin-top:10px">Track this as an application to tick steps and see them on your calendar.</p>'}</div>`;
}

// ---------------------------------------------------------------- applications (kanban)
export const STATUSES = [['researching', 'Researching'], ['preparing', 'Preparing'], ['submitted', 'Submitted'], ['decision', 'Decision']];
export function applications(ctx) {
  const { S } = ctx;
  return `${pageHead(t('applications'), 'Drag a card to move it, or open it to change status, deadline and checklist.', `<button class="btn primary" data-act="add-app-modal">${icon('plus', 16)} Add application</button>`)}
  <div class="kanban">${STATUSES.map(([k, label]) => { const list = S.apps.filter((a) => a.status === k);
    return `<div class="col glass" data-drop="${k}"><h4>${label}<span class="muted">${list.length}</span></h4>
      ${list.map((a) => { const d = a.tasks.filter((x) => x.done).length; return `<div class="appcard" draggable="true" data-drag="${a.id}" data-act="app-open" data-id="${a.id}"><b>${esc(a.name)}</b><div class="muted small">${esc(a.country || '')}${a.deadline ? ` · ${fmtDate(a.deadline)}` : ''}</div><div class="progress"><i style="width:${Math.round(d / Math.max(1, a.tasks.length) * 100)}%"></i></div><span class="muted small">${d}/${a.tasks.length} tasks</span></div>`; }).join('') || '<div class="drop">Drop here</div>'}</div>`; }).join('')}</div>`;
}
export function appDrawer(id, ctx) {
  const a = ctx.S.apps.find((x) => x.id === id);
  if (!a) return '';
  return `<button class="btn icon x" data-act="close">${icon('x')}</button>
  <h2 style="font-size:1.6rem;margin-bottom:4px">${esc(a.name)}</h2><p class="muted">${esc(a.country || '')}</p>
  <div class="grid g2" style="margin:16px 0"><label class="f">Status<select data-app-field="status" data-id="${a.id}">${STATUSES.map(([k, l]) => `<option value="${k}" ${a.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="f">Deadline<input type="date" data-app-field="deadline" data-id="${a.id}" value="${esc(a.deadline || '')}"></label></div>
  <h4>Checklist</h4><div class="stack" style="gap:8px;margin:10px 0">${a.tasks.map((x) => `<div class="stepitem"><input type="checkbox" style="width:auto" ${x.done ? 'checked' : ''} data-act="task-toggle" data-app="${a.id}" data-t="${x.id}"><span class="grow" style="${x.done ? 'text-decoration:line-through;opacity:.6' : ''}">${esc(x.t)}</span>${x.due ? `<span class="tag mute">${fmtDate(x.due)}</span>` : ''}<button class="btn icon small" data-act="task-del" data-app="${a.id}" data-t="${x.id}" aria-label="Delete">${icon('x', 12)}</button></div>`).join('')}</div>
  <div class="row"><input id="newTask" placeholder="Add a task…"><button class="btn" data-act="task-add" data-id="${a.id}">${icon('plus', 16)}</button></div>
  <label class="f" style="margin-top:16px">Notes<textarea data-app-field="note" data-id="${a.id}" placeholder="Anything to remember">${esc(a.note || '')}</textarea></label>
  <div class="row" style="margin-top:16px;gap:8px"><button class="btn" data-act="uni" data-id="${a.uniId}">View university</button><button class="btn danger" data-act="app-del" data-id="${a.id}">${icon('trash', 16)} Remove</button></div>`;
}
export function addAppModal(ctx) {
  return `<div class="modal glass"><h3 style="margin-bottom:14px">Add application</h3>
    <label class="f">University<select id="appUni"><option value="">Choose…</option>${DATA.unis.map((u) => `<option value="${u.id}">${esc(u.name)}</option>`).join('')}</select></label>
    <label class="f" style="margin-top:12px">or a name that is not listed<input id="appName" placeholder="e.g. Local college"></label>
    <div class="row" style="margin-top:18px;justify-content:flex-end"><button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="add-app-go">Add</button></div></div>`;
}

// ---------------------------------------------------------------- calendar
export function calendar(ctx) {
  const { S, ui } = ctx;
  const { y, m } = ui.cal;
  const first = new Date(y, m, 1);
  const start = addDays(first, -((first.getDay() + 6) % 7));
  const items = calendarItems(S);
  const byDay = {};
  items.forEach((i) => { (byDay[iso(i.date)] = byDay[iso(i.date)] || []).push(i); });
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const rows = cells.slice(35).every((d) => d.getMonth() !== m) ? cells.slice(0, 35) : cells;
  const t0 = iso(today());
  const upcoming = items.filter((i) => daysUntil(i.date) >= 0).slice(0, 8);
  return `${pageHead(t('calendar'), 'Application deadlines, saved scholarships, test days and your own events.', `<button class="btn primary" data-act="ev-modal">${icon('plus', 16)} New event</button>`)}
  <div class="cal"><div class="glass card"><div class="row between wrap" style="margin-bottom:14px"><div class="row"><button class="btn icon" data-act="cal-nav" data-d="-1">${icon('arrow', 16).replace('<svg', '<svg style="transform:scaleX(-1)"')}</button><h3 style="min-width:140px;text-align:center;font-size:1.2rem">${MONTH_NAMES[m]} ${y}</h3><button class="btn icon" data-act="cal-nav" data-d="1">${icon('arrow', 16)}</button></div><button class="btn small" data-act="cal-today">Today</button></div>
    <div class="cal-grid">${['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) => `<div class="dow">${d}</div>`).join('')}
    ${rows.map((d) => { const k = iso(d); const ev = byDay[k] || []; return `<div class="day ${d.getMonth() !== m ? 'out' : ''} ${k === t0 ? 'today' : ''}" data-act="ev-modal" data-date="${k}"><div class="d">${d.getDate()}</div>${ev.slice(0, 3).map((e) => `<span class="ev ${e.kind === 'sch' ? 'sch' : e.kind === 'app' || e.kind === 'task' ? 'app' : e.kind === 'test' ? 'test' : ''}" title="${esc(e.title)}">${esc(e.title)}</span>`).join('')}${ev.length > 3 ? `<span class="muted" style="font-size:.66rem">+${ev.length - 3} more</span>` : ''}</div>`; }).join('')}</div></div>
    <div class="glass card" style="align-self:start"><h3>Coming up</h3>${upcoming.length ? upcoming.map((i) => `<div style="padding:10px 0;border-top:1px solid var(--stroke)"><b class="small">${esc(i.title)}</b><div class="muted small">${fmtDate(i.date)} · ${relDays(i.date)}</div></div>`).join('') : '<p class="muted" style="margin-top:8px">No upcoming events. Save a scholarship or add a deadline.</p>'}</div></div>`;
}
export function eventModal(ctx, date) {
  return `<div class="modal glass"><h3 style="margin-bottom:14px">New event</h3>
    <label class="f">Title<input id="evTitle" placeholder="e.g. IELTS speaking test"></label>
    <div class="grid g2" style="margin-top:12px"><label class="f">Date<input id="evDate" type="date" value="${esc(date || iso(today()))}"></label><label class="f">Type<select id="evKind"><option value="ev">Event</option><option value="test">Test day</option></select></label></div>
    <div class="row" style="margin-top:18px;justify-content:flex-end"><button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="ev-add">Save</button></div></div>`;
}

// ---------------------------------------------------------------- tests & prep
export function tests(ctx) {
  const { S } = ctx;
  const cards = ['ielts', 'toefl'].map((id) => {
    const t0 = DATA.tests.find((x) => x.id === id);
    const mine = S.scores.filter((s) => s.test === id).sort((a, b) => b.date.localeCompare(a.date));
    const best = mine.filter((s) => s.official).reduce((m, s) => Math.max(m, Number(s.score)), 0) || null;
    const latest = mine[0]?.score;
    const target = S.targets[id];
    const gap = best != null ? Math.round((target - best) * 10) / 10 : null;
    return `<div class="glass card"><div class="row between"><h3>${esc(t0.name)}</h3><button class="chip" data-act="target" data-t="${id}">Target: ${target}</button></div>
      <div class="grid g3" style="gap:10px;margin:14px 0">${[['BEST OFFICIAL', best ?? '—'], ['LATEST', latest ?? '—'], ['TO TARGET', gap == null ? '—' : gap <= 0 ? 'Reached ✓' : `+${gap}`]].map(([k, v]) => `<div class="mini" style="flex-direction:column;align-items:flex-start;gap:2px"><span style="letter-spacing:.1em;font-size:.65rem">${k}</span><b>${v}</b></div>`).join('')}</div>
      ${mine.length ? mine.slice(0, 4).map((s) => `<div class="row small" style="padding:6px 0;border-top:1px solid var(--stroke)"><b>${s.score}</b><span class="muted grow">${fmtDate(s.date)} · ${s.official ? 'Official' : 'Mock'}</span><button class="btn icon small" data-act="score-del" data-id="${s.id}">${icon('x', 12)}</button></div>`).join('') : '<p class="muted small">No scores yet. Log a mock test to start tracking.</p>'}</div>`;
  }).join('');
  const others = DATA.tests.map((x) => `<a class="glass card tight hover-lift" href="${esc(x.url)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><div class="row between"><b>${esc(x.name)}</b>${icon('ext', 14)}</div><div class="muted small" style="margin-top:6px">${esc(x.note)}</div></a>`).join('');
  const planned = S.events.filter((e) => e.kind === 'test' && daysUntil(fromIso(e.date)) >= 0).sort((a, b) => a.date.localeCompare(b.date));
  return `${pageHead(t('tests'), 'Log every attempt or mock test. Your best official score updates your profile and university fit.', `<div class="row"><button class="btn" data-act="ev-modal" data-kind="test">${icon('calendar', 16)} Plan a test date</button><button class="btn primary" data-act="score-modal">${icon('plus', 16)} Log a score</button></div>`)}
  <div class="grid g2">${cards}</div>
  ${planned.length ? `<div class="glass card"><h3>Planned tests</h3>${planned.map((e) => `<div class="row" style="padding:8px 0;border-top:1px solid var(--stroke)"><span class="tag bad">${fmtDate(e.date)}</span><span>${esc(e.title)}</span></div>`).join('')}</div>` : ''}
  <h3>All tests</h3><div class="grid auto">${others}</div>`;
}
export function scoreModal() {
  return `<div class="modal glass"><h3 style="margin-bottom:14px">Log a score</h3>
    <label class="f">Test<select id="scTest">${DATA.tests.map((x) => `<option value="${x.id}">${esc(x.name)} (${x.scale})</option>`).join('')}</select></label>
    <div class="grid g2" style="margin-top:12px"><label class="f">Score<input id="scScore" type="number" step="0.5" placeholder="7.5"></label><label class="f">Date<input id="scDate" type="date" value="${iso(today())}"></label></div>
    <label class="switch" style="margin-top:14px"><input type="checkbox" id="scOff" checked><span>Official result (not a mock)</span></label>
    <div class="row" style="margin-top:18px;justify-content:flex-end"><button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="score-add">Save</button></div></div>`;
}

// ---------------------------------------------------------------- essays
export function essays(ctx) {
  const { S } = ctx;
  return `${pageHead(t('essays'), 'Personal statements, supplements and statements of purpose. Everything autosaves.', `<div class="row"><a class="btn" href="#/app/essay-library">${icon('book', 16)} Essay library (${DATA.essays.length + 38})</a><button class="btn primary" data-act="essay-modal">${icon('plus', 16)} New essay</button></div>`)}
  ${S.essays.length ? `<div class="grid auto">${S.essays.map((e) => { const w = wordCount(e.body); return `<div class="glass card hover-lift" data-act="essay-open" data-id="${e.id}" style="cursor:pointer"><span class="tag mute">${w ? 'DRAFT' : 'EMPTY'}</span><h3 style="margin:8px 0">${esc(e.title)}</h3><p class="muted small" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(e.prompt || '')}</p><div class="progress"><i style="width:${Math.min(100, w / e.limit * 100)}%"></i></div><span class="muted small">${w} / ${e.limit} words · edited ${fmtDate(e.updated)}</span></div>`; }).join('')}</div>` : '<div class="glass empty">No essays yet. Start with a prompt, or read examples in the Essay library.</div>'}`;
}
export function essayModal() {
  return `<div class="modal glass"><h3 style="margin-bottom:14px">New essay</h3>
    <label class="f">Prompt<select id="esPrompt">${DATA.prompts.map((p) => `<option value="${p.id}">${esc(p.label)} · ${p.limit} words</option>`).join('')}<option value="custom">Custom prompt…</option></select></label>
    <label class="f" style="margin-top:12px">Title<input id="esTitle" placeholder="Personal statement"></label>
    <div class="row" style="margin-top:18px;justify-content:flex-end"><button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="essay-add">Create</button></div></div>`;
}
export function essay(ctx) {
  const e = ctx.S.essays.find((x) => x.id === ctx.route.id);
  if (!e) return `<div class="glass empty">Essay not found. <a href="#/app/essays">Back to essays</a></div>`;
  const w = wordCount(e.body);
  return `<div class="row between"><a class="btn small" href="#/app/essays">← All essays</a><div class="row"><span id="wc" class="tag ${w > e.limit ? 'bad' : ''}">${w} / ${e.limit} words</span><button class="btn small" data-act="essay-ai" data-id="${e.id}">${icon('sparkle', 14)} Get feedback</button><button class="btn small danger" data-act="essay-del" data-id="${e.id}">${icon('trash', 14)}</button></div></div>
  <div class="glass card"><input data-essay-field="title" data-id="${e.id}" value="${esc(e.title)}" style="font-size:1.6rem;font-weight:800;border:0;background:none;padding:0 0 10px;letter-spacing:-.02em">
    <p class="muted small" style="margin-bottom:14px">${esc(e.prompt || 'Custom prompt')}</p>
    <textarea class="editor" data-essay-field="body" data-id="${e.id}" placeholder="Start writing. This saves as you type.">${esc(e.body || '')}</textarea>
    <p class="faint small" style="margin-top:10px">Autosaves on this device${ctx.cloud ? ' and to your account' : ''}. Write in your own voice: admissions readers notice generic text.</p></div>`;
}
export function essayLibrary(ctx) {
  const { ui } = ctx;
  const f = ui.lib;
  const types = ['All essay types', ...new Set(DATA.essays.map((e) => e.type))];
  const list = DATA.essays.filter((e) => (!f.q || `${e.title} ${e.topic} ${e.summary}`.toLowerCase().includes(f.q.toLowerCase())) && (f.type === 'All essay types' || e.type === f.type));
  return `${pageHead(t('essay-library'), `${DATA.essays.length} original annotated examples written for Vertex, each with a breakdown of why it works. Read for structure and technique, then write your own story. For real published essays, universities such as Johns Hopkins post their own: see Resources.`, `<a class="btn" href="#/app/essays">${icon('pen', 16)} My essays</a>`)}
  <div class="filters"><input class="search" data-bind="lib.q" value="${esc(f.q)}" placeholder="Search topics, schools, techniques"><select data-bind="lib.type">${types.map((x) => `<option ${x === f.type ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
  <div class="grid auto-wide">${list.map((e) => `<div class="glass card hover-lift" data-act="lib-open" data-id="${e.id}" style="cursor:pointer"><div class="row between"><span class="tag good">Example</span><span class="muted small">${esc(e.type)}</span></div><h3 style="margin:10px 0 6px">${esc(e.title)}</h3><p class="muted small">${esc(e.topic)}</p></div>`).join('')}</div>`;
}
export function libDrawer(id) {
  const e = DATA.essays.find((x) => x.id === id);
  if (!e) return '';
  return `<button class="btn icon x" data-act="close">${icon('x')}</button><span class="tag good">Example</span>
  <h2 style="font-size:1.6rem;margin:10px 0 4px">${esc(e.title)}</h2><p class="muted">${esc(e.type)} · written for Vertex</p>
  <h4 style="margin-top:20px">What it's about</h4><p style="margin-top:6px">${esc(e.summary)}</p>
  <h4 style="margin-top:20px">Why it works</h4><div class="stack" style="gap:8px;margin-top:10px">${e.why.map((w) => `<div class="stepitem">${icon('check', 16)}${esc(w)}</div>`).join('')}</div>
  <div class="glass card tight" style="margin:20px 0;border-color:color-mix(in srgb,var(--warn) 40%,var(--stroke))"><b>${icon('sparkle', 14)} Takeaway:</b> ${esc(e.takeaway)}</div>
  <h4>An outline to borrow (not words)</h4><div class="stack" style="gap:8px;margin:10px 0">${e.outline.map((o, i) => `<div class="stepitem"><span class="n">${i + 1}</span>${esc(o)}</div>`).join('')}</div>
  <p class="faint small">These are original illustrations of structure and technique. Do not copy any essay, including real published ones: admissions offices check.</p>`;
}

// ---------------------------------------------------------------- vertex AI
export function ai(ctx) {
  const { S, ui } = ctx;
  const sugg = ['Which of my saved universities fits my budget?', 'Make me a 12-week IELTS study plan', 'How do I ask a teacher for a recommendation letter?', 'Explain the Common App deadlines (ED, EA, RD)'];
  return `${pageHead(t('ai'), 'Your application coach. Ask about universities, scholarships, tests and essays. It can see your profile summary, and it never writes your essay for you.')}
  <div class="glass pane" style="min-height:62vh"><div class="msgs" id="aiMsgs" style="max-height:56vh">
    ${S.chat.length ? S.chat.map((m) => `<div class="bubble ${m.role === 'user' ? 'me' : 'ai'}">${esc(m.content)}</div>`).join('') : `<div class="empty"><div class="ico" style="margin:0 auto 12px;background:linear-gradient(135deg,#8b8cf8,#22d3ee);width:54px;height:54px">${icon('sparkle', 26)}</div><h3 style="margin-bottom:6px">Ask Vertex AI anything</h3><p class="small">Try one of these:</p><div class="row wrap" style="justify-content:center;margin-top:12px">${sugg.map((q) => `<button class="chip" data-act="ai-suggest" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div></div>`}
    ${ui.aiBusy ? '<div class="bubble ai muted">Thinking…</div>' : ''}</div>
    <div class="composer"><textarea id="aiInput" placeholder="Message Vertex AI…" rows="1"></textarea><button class="btn primary icon" data-act="ai-send" style="padding:14px" ${ui.aiBusy ? 'disabled' : ''}>${icon('send', 18)}</button></div>
    <div class="row between" style="margin-top:8px"><span class="faint small">AI can make mistakes. Confirm facts on official websites.</span>${S.chat.length ? '<button class="btn small" data-act="ai-clear">Clear chat</button>' : ''}</div></div>`;
}

// ---------------------------------------------------------------- community
export const CHANNELS = [
  ['general', '💬', 'General', 'Say hi and meet other applicants'],
  ['intro', '👋', 'Introductions', 'Who you are, where you\'re applying'],
  ['tests', '📝', 'SAT & IELTS', 'Prep tips, test dates, score talk'],
  ['essays', '✍️', 'Essays', 'Swap drafts, ask for feedback, share'],
  ['scholarships', '🏅', 'Scholarships', 'Deadlines, nominations, interview stories'],
  ['us', 'US', 'US applications', 'Common App, CSS Profile, financial aid'],
  ['eu', 'EU', 'Europe', 'UK, Germany, Netherlands, Italy, Hungary'],
  ['asia', '🌏', 'Asia', 'Korea, Japan, Singapore, China'],
  ['masters', '🎓', "Master's", 'SOPs, Chevening, Erasmus Mundus'],
  ['buddies', '🤝', 'Study buddies', 'Find a partner for SAT, IELTS or essays'],
];
export function channels(ctx) {
  const { S, ui } = ctx;
  const ch = CHANNELS.find((c) => c[0] === ui.channel) || CHANNELS[0];
  const msgs = ctx.cloud ? ui.msgs || [] : S.local[ch[0]] || [];
  const me = ctx.userName || S.profile.name || 'You';
  const card = [S.profile.level, S.profile.countries.slice(0, 2).join(' & '), S.profile.startYear].filter(Boolean).join(' · ');
  let lastDay = '';
  const list = msgs.map((m) => {
    const d = new Date(m.created_at);
    const day = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
    const sep = day !== lastDay ? `<div class="eyebrow" style="text-align:center;margin:8px 0">${day}</div>` : '';
    lastDay = day;
    return `${sep}<div class="msg"><span class="avatar">${esc(initials(m.name))}</span><div><div class="who"><b>${esc(m.name)}</b>${m.card ? `<span class="card-tag">${esc(m.card)}</span>` : ''}<span class="faint small">${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span></div><div class="txt">${esc(m.body)}</div></div></div>`;
  }).join('');
  return `${pageHead(t('channels'), ctx.cloud ? 'Talk with other applicants in real time.' : 'Demo mode: messages stay on this device. Add Supabase keys in config.js to chat with everyone.')}
  <div class="chatbox"><div class="glass chanlist"><div class="eyebrow" style="padding:6px 10px">CHANNELS</div>${CHANNELS.map((c) => `<button class="chan ${c[0] === ch[0] ? 'on' : ''}" data-act="channel" data-id="${c[0]}"><span class="em">${c[1]}</span><span><b>${c[2]}</b><small>${esc(c[3])}</small></span></button>`).join('')}
      <div class="row" style="padding:12px 10px"><span class="tag good">●</span><span class="small muted">${ui.online || 1} online now</span></div></div>
    <div class="glass pane"><h2>${ch[2]}</h2><p class="muted small">${esc(ch[3])}</p><div class="hr"></div>
      <div class="msgs" id="chatMsgs">${list || '<div class="empty">No messages yet. Say hi 👋</div>'}</div>
      <div class="composer"><input id="chatInput" placeholder="Message ${esc(ch[2])}" maxlength="2000"><button class="btn primary icon" data-act="chat-send" style="padding:14px">${icon('send', 18)}</button></div>
      <p class="faint small" style="margin-top:8px">You appear as <b>${esc(me)}</b>${card ? ' · ' + esc(card) : ''} · <a href="#/app/profile">Edit card</a>. Be kind; never share passwords or ID numbers.</p></div></div>`;
}

// ---------------------------------------------------------------- resources
export function resources() {
  return `${pageHead(t('resources'), 'Official portals and trusted guides. Links open in a new tab.')}
  ${DATA.resources.map((g) => `<h3>${esc(g.group)}</h3><div class="grid auto">${g.items.map(([n, d, u]) => `<a class="glass card hover-lift" href="${esc(u)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><b>${esc(n)}</b><p class="muted small" style="margin:8px 0">${esc(d)}</p><span class="small" style="color:var(--accent)">${esc(u.replace(/^https?:\/\/(www\.)?/, ''))} ${icon('ext', 12)}</span></a>`).join('')}</div>`).join('')}`;
}

// ---------------------------------------------------------------- files
export function files(ctx) {
  const { ui } = ctx;
  const cats = ['documents', 'transcripts', 'certificates', 'essays', 'recommendations'];
  const list = (ui.files || []).filter((f) => ui.fileCat === 'all' || f.cat === ui.fileCat);
  if (!ctx.cloud) return `${pageHead(t('files'), 'Keep transcripts, certificates and recommendation letters in one place. Only you can see them.')}<div class="glass empty"><h3 style="margin-bottom:8px">File storage needs your Supabase project</h3><p class="small">Add your Supabase URL and anon key to <code>assets/config.js</code> and run <code>supabase/schema.sql</code>. Then uploads go to a private bucket that only you can open.</p></div>`;
  return `${pageHead(t('files'), 'Keep transcripts, certificates and recommendation letters in one place. Only you can see them.')}
  <div class="drop-zone glass" data-dropzone>${icon('upload', 26)}<p style="font-weight:700;margin:8px 0 4px">Drop files here or choose files</p><p class="muted small">PDF, images and documents up to 50 MB</p><input id="fileInput" type="file" multiple hidden></div>
  <div class="row wrap"><span class="muted small">Upload to</span><select id="upCat" style="width:auto">${cats.map((c) => `<option value="${c}" ${c === (ui.upCat || 'documents') ? 'selected' : ''}>${c[0].toUpperCase() + c.slice(1)}</option>`).join('')}</select>
    <div class="seg">${['all', ...cats].map((c) => `<button class="${ui.fileCat === c ? 'on' : ''}" data-act="filecat" data-v="${c}">${c[0].toUpperCase() + c.slice(1)}</button>`).join('')}</div></div>
  ${list.length ? `<div class="stack" style="gap:8px">${list.map((f) => `<div class="glass card tight row">${icon('file', 20)}<div class="grow"><b class="small">${esc(f.name.replace(/^\d+-/, ''))}</b><div class="muted small">${esc(f.cat)} · ${(f.size / 1024 / 1024).toFixed(2)} MB</div></div><button class="btn small" data-act="file-open" data-p="${esc(f.path)}">${icon('download', 14)} Open</button><button class="btn small danger" data-act="file-del" data-p="${esc(f.path)}">${icon('trash', 14)}</button></div>`).join('')}</div>` : '<div class="glass empty">No files yet.</div>'}`;
}

// ---------------------------------------------------------------- data health
export function health(ctx) {
  const { ui } = ctx;
  const n = DATA.unis.length;
  const m = [['Full admissions data', (u) => u.full], ['Tuition', (u) => u.tuition != null], ['IELTS minimum', (u) => u.ielts != null], ['Deadline', (u) => !!u.deadline], ['Acceptance rate', (u) => u.accept != null], ['Verified (reviewed)', (u) => u.full]];
  const q = (ui.healthQ || '').toLowerCase();
  const list = DATA.unis.filter((u) => (!ui.healthMissing || !u.full) && (!q || `${u.name} ${u.country}`.toLowerCase().includes(q))).slice(0, 80);
  return `${pageHead(t('health'), `How complete the catalogue is, and where to add verified details. ${ctx.cloud ? 'Edits save to your Supabase database for every student.' : 'Demo mode: edits are saved on this device.'}`)}
  <div class="glass card"><div class="bars">${m.map(([l, f]) => { const c = DATA.unis.filter(f).length; return `<div class="bar" style="grid-template-columns:200px 1fr 90px"><span>${l}</span><div class="track"><i style="width:${c / n * 100}%;background:var(--accent)"></i></div><b style="text-align:right">${c}/${n}</b></div>`; }).join('')}</div></div>
  <div class="filters"><input class="search" data-bind="healthQ" value="${esc(ui.healthQ || '')}" placeholder="Find a university"><button class="chip ${ui.healthMissing ? 'on' : ''}" data-act="tog" data-path="healthMissing">Missing details only</button></div>
  <div class="stack" style="gap:8px">${list.map((u) => `<button class="glass card tight row hover-lift" data-act="edit-uni" data-id="${u.id}" style="text-align:left">${icon('pen', 18)}<div><b>${esc(u.name)}</b><div class="muted small">${esc(u.country)} · ${u.full ? 'complete' : 'needs details'}${u.edited ? ' · community-edited' : ''}</div></div></button>`).join('')}</div>`;
}
export function editUniModal(id) {
  const u = DATA.byUni[id];
  if (!u) return '';
  const f = (k, label, type = 'text', step) => `<label class="f">${label}<input data-ed="${k}" type="${type}" ${step ? `step="${step}"` : ''} value="${esc(u[k] ?? '')}"></label>`;
  return `<div class="modal glass" style="width:min(560px,calc(100vw - 24px))"><h3 style="margin-bottom:4px">${esc(u.name)}</h3><p class="muted small" style="margin-bottom:14px">Only add figures you verified on the official site (USD per year). Leave blank if unknown.</p>
    <div class="grid g2">${f('tuition', 'Tuition / year (USD)', 'number')}${f('living', 'Living costs / year (USD)', 'number')}${f('years', 'Program length (years)', 'number', '0.5')}${f('ielts', 'IELTS minimum', 'number', '0.5')}${f('toefl', 'TOEFL minimum', 'number')}${f('accept', 'Acceptance rate %', 'number', '0.1')}${f('deadline', 'Typical deadline (e.g. Jan 15)')}${f('sat', 'SAT middle 50%')}</div>
    <label class="f" style="margin-top:12px">Financial aid note<input data-ed="aid" value="${esc(u.aid ?? '')}"></label>
    <label class="f" style="margin-top:12px">Official admissions URL<input data-ed="url" value="${esc(u.url ?? '')}"></label>
    <div class="row" style="margin-top:18px;justify-content:flex-end"><button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="edit-save" data-id="${id}">Save</button></div></div>`;
}

// ---------------------------------------------------------------- profile
export function profile(ctx) {
  const { S } = ctx;
  const p = S.profile;
  const photo = p.photo ? `<img src="${esc(p.photo)}" alt="">` : esc(initials(p.name || ctx.userName));
  const inp = (k, label, type = 'text', extra = '') => `<label class="f">${label}<input data-prof="${k}" type="${type}" ${extra} value="${esc(p[k] ?? '')}"></label>`;
  return `${pageHead(t('profile'), 'Vertex uses this to check university fit, scholarship eligibility and recommendations.')}
  <div class="glass card" style="max-width:760px;width:100%"><div class="row" style="gap:16px;margin-bottom:18px"><span class="avatar" style="width:72px;height:72px;font-size:1.4rem">${photo}</span><div><b>Profile photo</b><div class="muted small">Shown in your account menu. Stays private.</div><div class="row" style="margin-top:8px"><button class="btn small" data-act="photo">${icon('upload', 14)} Change photo</button>${p.photo ? '<button class="btn small" data-act="photo-rm">Remove</button>' : ''}</div></div></div>
    <div class="grid g3">${inp('name', 'Full name')}${inp('nationality', 'Nationality')}<label class="f">Degree level<select data-prof="level">${['Bachelor', 'Master', 'PhD'].map((l) => `<option ${p.level === l ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      ${inp('startYear', 'Start year', 'number')}${inp('budget', 'Yearly budget (USD)', 'number')}${inp('gpa', 'GPA / grades (%)', 'text')}${inp('ielts', 'IELTS overall', 'number', 'step="0.5"')}${inp('sat', 'SAT total', 'number')}</div>
    <div class="eyebrow" style="margin:20px 0 10px">MAJORS</div><div class="row wrap" style="gap:8px">${DATA.majors.map((m) => `<button class="chip ${p.majors.includes(m.id) ? 'on' : ''}" data-act="toggle-major" data-id="${m.id}">${esc(m.name)}</button>`).join('')}</div>
    <label class="f" style="margin-top:20px">Countries (comma separated)<input data-prof="countries" value="${esc(p.countries.join(', '))}" placeholder="United States, United Kingdom, Germany"></label>
    <label class="f" style="margin-top:14px">About me<textarea data-prof="about" placeholder="Interests, achievements, what you want to study and why">${esc(p.about)}</textarea></label>
    <p class="faint small" style="margin-top:12px">Saved automatically.</p></div>`;
}

// ---------------------------------------------------------------- personalize
export const PRESETS = [
  ['calm', 'Calm', 'Light, airy, blue', { theme: 'light', accent: '#3b82f6', wall: 'ocean', dim: 30, blur: 'soft' }, 'linear-gradient(135deg,#bcd3f5,#e9f0fb)'],
  ['night', 'Night focus', 'Dark, solid, no distractions', { theme: 'dark', accent: '#8b8cf8', wall: 'midnight', dim: 70, blur: 'sharp' }, 'linear-gradient(135deg,#1b1740,#0a0a1a)'],
  ['golden', 'Golden hour', 'Warm light and gold', { theme: 'dark', accent: '#f59e0b', wall: 'sunset', dim: 45, blur: 'soft' }, 'linear-gradient(135deg,#7a3b0c,#16100a)'],
  ['forest', 'Forest', 'Green and calm', { theme: 'dark', accent: '#34d399', wall: 'forest', dim: 50, blur: 'soft' }, 'linear-gradient(135deg,#0d3b2a,#050d0a)'],
  ['campus', 'Campus', 'The Vertex photo, frosted', { theme: 'dark', accent: '#22d3ee', wall: 'campus', dim: 50, blur: 'soft' }, 'linear-gradient(135deg,#2a5b9c,#c07a3c)'],
  ['minimal', 'Minimal', 'Plain, compact, fast', { theme: 'dark', accent: '#3b82f6', wall: 'plain', dim: 50, blur: 'sharp', density: 'compact', motion: 'reduced' }, '#05070d'],
];
export const WALLS = [
  ['aurora', 'Aurora', 'radial-gradient(500px 300px at 20% 20%,#0e7490,transparent),radial-gradient(500px 300px at 80% 70%,#7c3aed,transparent),#06101f'],
  ['sunset', 'Sunset', 'radial-gradient(500px 300px at 25% 15%,#f59e0b,transparent),radial-gradient(500px 300px at 85% 80%,#be185d,transparent),#12081a'],
  ['ocean', 'Ocean', 'radial-gradient(500px 300px at 20% 30%,#1d4ed8,transparent),radial-gradient(500px 300px at 80% 80%,#0d9488,transparent),#04112b'],
  ['forest', 'Forest', 'radial-gradient(500px 300px at 20% 25%,#047857,transparent),radial-gradient(500px 300px at 80% 80%,#14532d,transparent),#03100a'],
  ['rose', 'Rose quartz', 'radial-gradient(500px 300px at 20% 25%,#be123c,transparent),radial-gradient(500px 300px at 80% 80%,#6b21a8,transparent),#14060f'],
  ['midnight', 'Midnight', 'radial-gradient(500px 300px at 25% 25%,#312e81,transparent),radial-gradient(500px 300px at 80% 80%,#581c87,transparent),#05050f'],
  ['campus', 'Campus photo', null],
  ['blueprint', 'Blueprint', 'linear-gradient(rgba(120,160,255,.18) 1px,transparent 1px) 0 0/28px 28px,linear-gradient(90deg,rgba(120,160,255,.18) 1px,transparent 1px) 0 0/28px 28px,#071327'],
  ['plain', 'Plain', '#05070d'],
  ['custom', 'Your photo', null],
];
export const ACCENTS = ['#22d3ee', '#3b82f6', '#8b8cf8', '#a855f7', '#f43f5e', '#f59e0b', '#34d399', '#f97316'];
export function wallCss(id, custom) {
  if (id === 'campus') return null;
  if (id === 'custom') return custom ? `url("${custom}")` : null;
  const w = WALLS.find((x) => x[0] === id);
  return w ? w[2] : null;
}
export function personalize(ctx) {
  const { S, ui } = ctx;
  const s = S.settings;
  const tab = ui.persTab || 'presets';
  const tabs = [['presets', 'sparkle', 'Presets'], ['look', 'palette', 'Look'], ['wall', 'globe', 'Wallpaper'], ['layout', 'menu', 'Layout & text'], ['home', 'home', 'Home'], ['lang', 'globe', 'Language & money'], ['access', 'user', 'Accessibility'], ['backup', 'folder', 'Backup']];
  const seg = (key, val, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${String(val) === String(v) ? 'on' : ''}" data-act="set" data-k="${key}" data-v="${v}">${l}</button>`).join('')}</div>`;
  const sw = (key, on, label) => `<label class="switch"><input type="checkbox" ${on ? 'checked' : ''} data-set-check="${key}"><span>${label}</span></label>`;
  const sections = {
    presets: `<div class="glass card"><h3>Presets</h3><p class="muted small" style="margin:4px 0 14px">One tap sets theme, colour, wallpaper and density together. You can still tweak anything after.</p><div class="grid auto" style="grid-template-columns:repeat(auto-fill,minmax(170px,1fr))">${PRESETS.map(([id, n, d, , bg]) => `<button class="pick" data-act="preset" data-id="${id}"><span class="swatch" style="background:${bg}"></span><b>${n}</b><small>${d}</small></button>`).join('')}</div></div>`,
    look: `<div class="glass card stack"><h3>Look</h3><div><div class="eyebrow">THEME</div><div style="margin-top:8px">${seg('theme', s.theme, [['dark', 'Dark'], ['light', 'Light']])}</div></div>
      <div><div class="eyebrow">ACCENT COLOUR</div><div class="row wrap" style="margin-top:8px">${ACCENTS.map((c) => `<button class="sw ${s.accent === c ? 'on' : ''}" style="background:${c}" data-act="set" data-k="accent" data-v="${c}" aria-label="${c}"></button>`).join('')}</div></div></div>`,
    wall: `<div class="glass card stack"><h3>Wallpaper</h3><p class="muted small">Pick a scene or use your own photo. Your photo is stored only on this device.</p>
      <div class="grid auto" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr))">${WALLS.map(([id, n, bg]) => `<button class="pick ${s.wall === id ? 'on' : ''}" data-act="${id === 'custom' ? 'wall-upload' : 'set'}" data-k="wall" data-v="${id}"><span class="swatch" style="background:${id === 'campus' ? 'url(assets/vu.jpg),url(assets/campus.jpg),linear-gradient(135deg,#2a5b9c,#c07a3c)' : id === 'custom' ? (ctx.customWall ? `url(${ctx.customWall})` : 'repeating-linear-gradient(45deg,#333,#333 6px,#444 6px,#444 12px)') : bg};background-size:cover"></span><small>${n}</small></button>`).join('')}</div>
      <div><div class="row between"><b class="small">Dim</b><span class="small">${s.dim}%</span></div><input type="range" min="0" max="90" value="${s.dim}" data-range="dim"><p class="faint small">More dim keeps text easy to read on busy photos.</p></div>
      <div class="row between"><b class="small">Blur</b>${seg('blur', s.blur, [['sharp', 'Sharp'], ['soft', 'Soft'], ['strong', 'Strong']])}</div></div>`,
    layout: `<div class="glass card stack"><h3>Layout & text</h3><div class="grid g2"><div><div class="eyebrow">TEXT SIZE</div><div style="margin-top:8px">${seg('textSize', s.textSize, [['A-', 'A-'], ['A', 'A'], ['A+', 'A+'], ['A++', 'A++']])}</div></div>
      <div><div class="eyebrow">DENSITY</div><div style="margin-top:8px">${seg('density', s.density, [['comfortable', 'Comfortable'], ['compact', 'Compact']])}</div></div>
      <div><div class="eyebrow">CORNERS</div><div style="margin-top:8px">${seg('corners', s.corners, [['round', 'Round'], ['soft', 'Soft'], ['sharp', 'Sharp']])}</div></div>
      <div><div class="eyebrow">SIDEBAR</div><div style="margin-top:12px">${sw('labels', s.labels, 'Show section labels')}</div></div></div>
      <div class="glass card tight">The quick brown fox applies to twelve universities.</div></div>`,
    home: `<div class="glass card stack"><h3>Home</h3><div><div class="eyebrow">WEEKLY GOAL (ACTIVE DAYS)</div><div style="margin-top:8px">${seg('weeklyGoal', s.weeklyGoal, [3, 4, 5, 6, 7].map((n) => [n, n]))}</div><p class="faint small" style="margin-top:6px">A day counts as active when you save, write, log a score, move an application or ask Vertex AI.</p></div>
      <div><div class="eyebrow">HOME WIDGETS</div><div class="grid g2" style="margin-top:12px">${[['week', 'This week'], ['roadmap', 'Your roadmap'], ['readiness', 'Application readiness'], ['applications', 'Applications'], ['quick', 'Quick actions'], ['fit', 'Universities that fit you'], ['scholarships', 'Scholarships you can apply for']].map(([k, l]) => sw('w.' + k, s.widgets[k], l)).join('')}</div></div></div>`,
    lang: `<div class="glass card stack"><h3>Language & money</h3><div><div class="eyebrow">LANGUAGE</div><div style="margin-top:8px">${seg('language', s.language, [['en', 'English'], ['uz', "O'zbekcha"], ['ru', 'Русский']])}</div><p class="faint small" style="margin-top:6px">University and scholarship data stays in English, as on official sites.</p></div>
      <div><div class="eyebrow">CURRENCY</div><div style="margin-top:8px">${seg('currency', s.currency, [['USD', 'USD $'], ['UZS', "UZS so'm"], ['EUR', 'EUR €']])}</div></div></div>`,
    access: `<div class="glass card stack"><h3>Accessibility</h3><div><div class="eyebrow">MOTION</div><div style="margin-top:8px">${seg('motion', s.motion, [['full', 'Full'], ['reduced', 'Reduced'], ['off', 'Off']])}</div></div>${sw('tilt', s.tilt, '3D tilt on cards')}${sw('hc', s.hc, 'High contrast text and borders')}</div>`,
    backup: `<div class="glass card stack"><h3>Backup</h3><p class="muted small">Save your settings to a file, or bring them to another account. Photos aren't included.</p><div class="row wrap"><button class="btn" data-act="export-settings">${icon('upload', 16)} Export settings</button><button class="btn" data-act="import-settings">${icon('folder', 16)} Import settings</button><button class="btn" data-act="reset-sidebar">Reset sidebar</button><button class="btn danger" data-act="reset-settings">Reset all settings</button></div></div>`,
  };
  const p = S.profile;
  const wall = wallCss(s.wall, ctx.customWall);
  return `${pageHead(t('personalize'), 'Make Vertex yours. Everything applies instantly and follows your account to every device.')}
  <div class="glass card row wrap" style="gap:24px"><div style="width:min(420px,100%);aspect-ratio:16/10;border-radius:20px;overflow:hidden;border:1px solid var(--stroke);position:relative;background:${wall || 'url(assets/vu.jpg),url(assets/campus.jpg),linear-gradient(135deg,#2a5b9c,#c07a3c)'};background-size:cover;background-position:center"><div style="position:absolute;inset:0;background:rgba(4,6,13,${s.dim / 100})"></div><div class="glass" style="position:absolute;left:10px;top:10px;bottom:10px;width:24%;border-radius:14px"></div><div class="glass" style="position:absolute;left:30%;top:12%;right:6%;height:30%;border-radius:14px"></div><div class="glass" style="position:absolute;left:30%;top:50%;right:6%;height:30%;border-radius:14px"></div></div>
    <div><div class="row" style="gap:14px"><span class="avatar" style="width:64px;height:64px">${p.photo ? `<img src="${esc(p.photo)}" alt="">` : esc(initials(p.name || ctx.userName))}</span><div><h2 style="font-size:1.4rem">${esc(p.name || ctx.userName || 'Student')}</h2><p class="muted small">Your own mix · ${esc((WALLS.find((w) => w[0] === s.wall) || [0, 'Campus'])[1])}</p></div></div></div></div>
  <div class="sections-nav glass">${tabs.map(([k, ic, l]) => `<button class="chip ${tab === k ? 'on' : ''}" data-act="pers-tab" data-v="${k}">${icon(ic, 14)} ${l}</button>`).join('')}</div>
  ${sections[tab]}`;
}

// ---------------------------------------------------------------- auth screen
export function authScreen(ctx) {
  const m = ctx.ui.authMode || 'in';
  return `<div class="auth"><div class="glass card"><div class="row" style="margin-bottom:18px"><span class="logo">V</span><div><b style="font-size:1.2rem">Vertex Unity</b><div class="muted small">Dream · Plan · Apply</div></div></div>
    <h2 style="margin-bottom:14px">${m === 'in' ? 'Welcome back' : m === 'up' ? 'Create your account' : 'Reset password'}</h2>
    <form data-form="auth" class="stack" style="gap:12px">
      ${m === 'up' ? '<label class="f">Full name<input name="name" required autocomplete="name"></label>' : ''}
      <label class="f">Email<input name="email" type="email" required autocomplete="email"></label>
      ${m !== 'reset' ? `<label class="f">Password<input name="password" type="password" minlength="6" required autocomplete="${m === 'in' ? 'current-password' : 'new-password'}"></label>` : ''}
      <p id="authMsg" class="small" style="color:var(--bad);min-height:1em"></p>
      <button class="btn primary" style="width:100%;padding:13px">${m === 'in' ? 'Sign in' : m === 'up' ? 'Create account' : 'Send reset link'}</button></form>
    <div class="row between small" style="margin-top:14px"><button class="btn small" data-act="auth-mode" data-v="${m === 'in' ? 'up' : 'in'}">${m === 'in' ? 'Create account' : 'I have an account'}</button>${m === 'in' ? '<button class="btn small" data-act="auth-mode" data-v="reset">Forgot password?</button>' : ''}</div>
    <p class="faint small" style="margin-top:14px"><a href="#" data-act="back-landing">← Back to the website</a></p></div></div>`;
}

// ---------------------------------------------------------------- onboarding modal
export function onboarding(ctx) {
  const p = ctx.S.profile;
  return `<div class="scrim"></div><div class="modal glass" style="width:min(560px,calc(100vw - 24px))"><h3 style="font-size:1.4rem">Tell us your goals</h3><p class="muted small" style="margin:6px 0 16px">Two minutes. This powers university fit, scholarship eligibility and your roadmap. You can change it any time.</p>
    <div class="grid g2"><label class="f">Your name<input id="ob-name" value="${esc(p.name || ctx.userName || '')}"></label>
      <label class="f">Degree<select id="ob-level">${['Bachelor', 'Master', 'PhD'].map((l) => `<option ${p.level === l ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="f">Start year<input id="ob-year" type="number" value="${p.startYear}"></label>
      <label class="f">Yearly budget (USD)<input id="ob-budget" type="number" placeholder="15000" value="${esc(p.budget)}"></label>
      <label class="f">IELTS (if you have it)<input id="ob-ielts" type="number" step="0.5" value="${esc(p.ielts)}"></label>
      <label class="f">GPA / grades<input id="ob-gpa" value="${esc(p.gpa)}" placeholder="3.9 or 92%"></label></div>
    <label class="f" style="margin-top:12px">Countries you like (comma separated)<input id="ob-countries" placeholder="United States, Germany, Hungary"></label>
    <div class="eyebrow" style="margin:14px 0 8px">MAJORS</div><div class="row wrap" style="gap:6px" id="ob-majors">${DATA.majors.slice(0, 12).map((m) => `<button type="button" class="chip" data-act="ob-major" data-id="${m.id}">${esc(m.name)}</button>`).join('')}</div>
    <div class="row" style="margin-top:20px;justify-content:flex-end"><button class="btn" data-act="ob-skip">Skip</button><button class="btn primary" data-act="ob-save">Save and start</button></div></div>`;
}
