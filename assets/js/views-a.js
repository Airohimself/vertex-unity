// Views, part 1: shell, landing, home, saved, universities, scholarships, majors, compare.
// Every view is a pure function (ctx) => HTML string. Events are wired in main.js via data-act attributes.
import { esc, icon, ico, fmtDate, fmtDateY, relDays, daysUntil, bannerGradient, SKYLINE, initials, nextOccurrence } from './util.js';
import { DATA, totalCost, uniFit, schFit, schNext, readiness, meetsIelts, calendarItems, notifications, bestScore } from './data.js';
import { weekDays, streak } from './store.js';
import { t } from './i18n.js';

// ---------------------------------------------------------------- navigation
export const NAV = [
  { page: 'home', icon: 'home', color: '#3b82f6' },
  { grp: 'explore', items: [
    { page: 'saved', icon: 'heart', color: '#ef4a6b' },
    { page: 'universities', icon: 'landmark', color: '#6366f1' },
    { page: 'scholarships', icon: 'award', color: '#f59e0b' },
    { page: 'majors', icon: 'grad', color: '#14b8a6' },
    { page: 'compare', icon: 'scale', color: '#a855f7' }] },
  { grp: 'plan', items: [
    { page: 'dream', icon: 'target', color: '#f97316' },
    { page: 'applications', icon: 'kanban', color: '#22c55e' },
    { page: 'calendar', icon: 'calendar', color: '#ef4444' },
    { page: 'tests', icon: 'chart', color: '#f43f5e' }] },
  { grp: 'create', items: [
    { page: 'essays', icon: 'pen', color: '#f59e0b' },
    { page: 'essay-library', icon: 'book', color: '#38bdf8' },
    { page: 'ai', icon: 'sparkle', color: '#8b8cf8' }] },
  { grp: 'community', items: [{ page: 'channels', icon: 'message', color: '#3b82f6' }] },
  { grp: 'library', items: [
    { page: 'resources', icon: 'library', color: '#a8835a' },
    { page: 'files', icon: 'folder', color: '#3b82f6' },
    { page: 'health', icon: 'chart', color: '#6b7280' }] },
];
export const PAGE_TITLES = ['home', 'saved', 'universities', 'scholarships', 'majors', 'compare', 'dream', 'applications', 'calendar', 'tests', 'essays', 'essay-library', 'ai', 'channels', 'resources', 'files', 'health', 'profile', 'personalize'];

export function logo(size = 38) {
  return `<span class="logo" style="width:${size}px;height:${size}px"><img src="assets/emblem-128.webp" alt="" onerror="this.onerror=null;this.src='assets/emblem.svg'"></span>`;
}

export function shell(ctx, inner) {
  const { S, route, ui } = ctx;
  const nav = NAV.map((n) => {
    if (n.page) return `<a href="#/app/${n.page}" class="${route.page === n.page ? 'on' : ''}">${ico(n.icon, n.color, 18)}<span>${esc(t(n.page))}</span></a>`;
    const closed = ui.closedGroups?.[n.grp];
    return `<button class="grp ${closed ? 'closed' : ''}" data-act="grp" data-g="${n.grp}">${icon(n.page === undefined ? 'compass' : 'compass', 14)}<span>${esc(t(n.grp))}</span><span class="chev">${icon('chev', 14)}</span></button>` +
      (closed ? '' : `<div class="sub">${n.items.map((i) => `<a href="#/app/${i.page}" class="${route.page === i.page || (i.page === 'essays' && route.page === 'essay') ? 'on' : ''}">${ico(i.icon, i.color, 18)}<span>${esc(t(i.page))}</span></a>`).join('')}</div>`);
  }).join('');
  const name = ctx.userName || 'Student';
  const avatar = S.profile.photo ? `<img src="${esc(S.profile.photo)}" alt="">` : esc(initials(name));
  const n = notifications(S).length;
  const dark = S.settings.theme !== 'light';
  return `
  <div class="shell">
    <aside class="side glass">
      <div class="brand-card" data-act="goto" data-page="home">${logo(40)}<div><b>Vertex Unity</b><small>Dream · Plan · Apply</small></div></div>
      <nav class="nav">${nav}</nav>
      <div class="me" data-act="user-menu" style="cursor:pointer">
        <span class="avatar">${avatar}</span>
        <div class="grow" style="min-width:0"><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:.9rem">${esc(name)}</b><small class="muted" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(ctx.userEmail || (ctx.cloud ? '' : 'Demo mode · saved on this device'))}</small></div>
        ${icon('chev', 16)}
      </div>
    </aside>
    <div class="main">
      <header class="topbar glass">
        <button class="btn icon menu-btn" data-act="nav-toggle" aria-label="Menu">${icon('menu')}</button>
        <div class="search-box" data-act="palette">${icon('search', 16)}<span>${esc(t('search'))}</span><span class="kbd">Ctrl K</span></div>
        <span class="grow"></span>
        <button class="btn icon" data-act="theme" aria-label="Toggle theme">${icon(dark ? 'sun' : 'moon')}</button>
        <button class="btn icon badge-dot" ${n ? `data-n="${n}"` : ''} data-act="bell" aria-label="Notifications">${icon('bell')}</button>
      </header>
      ${inner}
    </div>
  </div>
  ${ui.menuOpen ? userMenu(ctx) : ''}
  ${ui.bellOpen ? bellPanel(ctx) : ''}`;
}
function userMenu(ctx) {
  return `<div class="scrim" data-act="close-pop" style="background:transparent;backdrop-filter:none"></div>
  <div class="pop glass" style="top:auto;bottom:90px;left:20px;right:auto;width:260px">
    <a class="chip" style="display:flex;margin-bottom:6px" href="#/app/profile" data-act="close-pop">${icon('user', 16)} ${esc(t('profile'))}</a>
    <a class="chip" style="display:flex;margin-bottom:6px" href="#/app/personalize" data-act="close-pop">${icon('palette', 16)} ${esc(t('personalize'))}</a>
    <button class="chip" style="display:flex;width:100%;color:var(--bad)" data-act="signout">${icon('logout', 16)} ${esc(t('signout'))}</button>
  </div>`;
}
function bellPanel(ctx) {
  const items = notifications(ctx.S);
  return `<div class="scrim" data-act="close-pop" style="background:transparent;backdrop-filter:none"></div>
  <div class="pop glass"><div class="eyebrow" style="margin-bottom:8px">Next 14 days</div>
  ${items.length ? items.map((i) => `<div class="row" style="padding:8px 0;border-top:1px solid var(--stroke)"><span class="tag ${i.kind === 'sch' ? 'warn' : i.kind === 'test' ? 'bad' : ''}">${fmtDate(i.date)}</span><span class="grow small">${esc(i.title)}</span></div>`).join('') : '<p class="muted small">Nothing due soon. Save a scholarship or add a deadline to get reminders.</p>'}
  </div>`;
}

export function pageHead(title, sub, right = '') {
  return `<div class="toolbar"><div><h1 class="page-title">${esc(title)}</h1>${sub ? `<p class="page-sub">${sub}</p>` : ''}</div>${right}</div>`;
}

// ---------------------------------------------------------------- landing
export function landing(ctx) {
  const { S } = ctx;
  const nUni = DATA.unis.length, nCountry = DATA.countries.length, nSch = DATA.schs.length, nEss = DATA.essays.length;
  const marquee = DATA.unis.filter((u) => u.full).slice(0, 14).map((u) => u.name);
  const feats = [
    ['landmark', '#6366f1', 'University discovery', `${nUni} universities across ${nCountry} countries: research universities, liberal arts colleges and campuses in Uzbekistan, each with a guide to studying in that country.`],
    ['award', '#f59e0b', 'Scholarships that fit', `${nSch} major scholarships checked against your level, nationality and scores.`],
    ['scale', '#a855f7', 'Compare', 'Put up to four universities next to each other and see the real cost per year.'],
    ['kanban', '#22c55e', 'Application tracker', 'Every application on one board, with a checklist and deadline for each.'],
    ['calendar', '#ef4444', 'One calendar', 'Application deadlines, scholarship dates, test days and your own events.'],
    ['chart', '#f43f5e', 'Tests & prep', 'Log IELTS, SAT, TOEFL and Duolingo scores and watch the gap to your target close.'],
    ['pen', '#f59e0b', 'Essay workspace & library', 'Draft with autosave, and learn from original, annotated examples.'],
    ['sparkle', '#8b8cf8', 'Vertex AI & Dream School', 'Pick your dream school and get a dated roadmap. Vertex AI coaches you through every step.'],
    ['users', '#3b82f6', 'Community', 'Channels for US, Europe, Asia, tests and master\'s applicants.'],
  ];
  return `
  <div class="land">
    <nav class="land-nav glass" style="border-radius:999px">
      <div class="brand">${logo(36)}<span>Vertex Unity</span></div>
      <div class="links"><a href="#" data-act="scroll" data-to="features">Features</a><a href="#" data-act="scroll" data-to="uni-marquee">Universities</a><a href="#" data-act="scroll" data-to="how">How it works</a>
        <button class="btn primary small" data-act="open-app">Open app ${icon('arrow', 16)}</button></div>
    </nav>
    <section class="hero">
      <div>
        <div class="eyebrow">Dream. Plan. Apply. Achieve.</div>
        <h1 style="margin-top:18px">Your university journey,<br><span class="gradient-text">in one place.</span></h1>
        <p class="lead">Find universities you can afford, scholarships you qualify for, and every deadline that matters. Built for ambitious students applying abroad from Uzbekistan and beyond.</p>
        <div class="row wrap" style="gap:14px"><button class="btn primary" style="padding:14px 26px;font-size:1rem" data-act="open-app">Open your dashboard ${icon('arrow', 16)}</button><button class="btn" style="padding:14px 26px;font-size:1rem" data-act="scroll" data-to="features">See what's inside</button></div>
        <div class="row wrap" style="margin-top:34px;gap:12px">
          <div class="stat-pill"><b>${nUni}</b><span>UNIVERSITIES</span></div><div class="stat-pill"><b>${nSch}</b><span>SCHOLARSHIPS</span></div>
          <div class="stat-pill"><b>${nEss}</b><span>ESSAY EXAMPLES</span></div><div class="stat-pill"><b>$0</b><span>FOR STUDENTS</span></div>
        </div>
      </div>
      <div class="hero-art">
        <div class="float-chip glass" style="right:6%;top:12%">${icon('check', 18)}<div><b>IELTS 6.5</b><span>Meets the minimum at ${DATA.unis.filter((u) => u.ielts != null && u.ielts <= 6.5).length} of ${DATA.unis.filter((u) => u.ielts != null).length} verified</span></div></div>
        <img class="emblem" src="assets/emblem-128.webp" alt="" onerror="this.onerror=null;this.src='assets/emblem.svg'">
        <div class="word">VERTEX UNITY</div>
        <div class="float-chip glass" style="left:5%;bottom:10%">${icon('calendar', 18)}<div><b>Stipendium Hungaricum</b><span>Typical deadline · Jan 15</span></div></div>
      </div>
    </section>
    <div class="marquee" id="uni-marquee"><div class="track">${[...marquee, ...marquee].map((n) => `<span>${esc(n)}</span>`).join('')}</div></div>
    <section id="features"><h2 class="section-title">Everything from first<br>search to acceptance letter</h2>
      <div class="grid g3">${feats.map(([ic, c, h, p]) => `<div class="feat glass hover-lift tilt">${ico(ic, c)}<h3>${h}</h3><p>${p}</p></div>`).join('')}</div></section>
    <section id="how" style="margin-top:70px"><h2 class="section-title">How it works</h2>
      <div class="grid g3 steps">
        <div class="glass card tight"><div class="num">01</div><h3 style="margin:6px 0">Tell us your goals</h3><p class="muted small">Degree level, majors, countries, budget and current scores. Two minutes.</p></div>
        <div class="glass card tight"><div class="num">02</div><h3 style="margin:6px 0">Build your list</h3><p class="muted small">Save universities and scholarships that fit, then compare the real yearly cost.</p></div>
        <div class="glass card tight"><div class="num">03</div><h3 style="margin:6px 0">Run the plan</h3><p class="muted small">Tracker, calendar and essays keep every deadline in front of you.</p></div>
      </div></section>
    <section class="cta glass"><h2>Start building your application today.</h2><button class="btn primary" style="padding:14px 28px;font-size:1rem" data-act="open-app">Open app ${icon('arrow', 16)}</button></section>
    <footer class="land-foot"><div class="row" style="margin-bottom:8px">${logo(26)}<b>Vertex Unity</b></div>
      <p>© ${new Date().getFullYear()} Vertex Unity. Independent platform. University names are listed for exploration and are not endorsements or partnerships. Data is approximate; always confirm on official websites.</p></footer>
  </div>`;
}

// ---------------------------------------------------------------- home
function greeting(S, userName) {
  const h = new Date().getHours();
  const key = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  const first = (S.profile.name || userName || '').split(/\s+/)[0];
  return `${t(key)}${first ? ', ' + first : ''}.`;
}
export function home(ctx) {
  const { S, money } = ctx;
  const W = S.settings.widgets;
  const ready = readiness(S);
  const next = calendarItems(S).find((i) => daysUntil(i.date) >= 0);
  const week = weekDays();
  const goal = S.settings.weeklyGoal;
  const activeCount = week.filter((d) => d.on).length;
  const st = streak();
  const dreamU = S.dream && DATA.byUni[S.dream.uniId];
  const dreamApp = dreamU && S.apps.find((a) => a.uniId === dreamU.id);
  const nextTask = dreamApp?.tasks.find((x) => !x.done);
  const dreamDone = dreamApp ? dreamApp.tasks.filter((x) => x.done).length : 0;
  const pipeline = ['researching', 'preparing', 'submitted', 'decision'].map((s) => [s, S.apps.filter((a) => a.status === s).length]);
  const fitList = DATA.unis.filter((u) => u.full).map((u) => ({ u, f: uniFit(u, S) }))
    .sort((a, b) => (b.f.score ?? -1) - (a.f.score ?? -1) || (totalCost(a.u) ?? 0) - (totalCost(b.u) ?? 0)).slice(0, 4);
  const schList = DATA.schs.map((s) => ({ s, f: schFit(s, S), d: schNext(s) })).filter((x) => x.f.eligible)
    .sort((a, b) => a.d - b.d).slice(0, 3);
  const p = S.profile;
  const sub = [p.level, `applicant for ${p.startYear}`, p.countries.slice(0, 3).join(', ')].filter(Boolean).join(' · ');
  const card = (cls, body, style = '') => `<div class="glass card ${cls}" style="${style}">${body}</div>`;

  const roadmap = W.roadmap ? (dreamU
    ? card('hover-lift', `<div class="row" style="gap:16px;align-items:flex-start"><div class="ico" style="background:linear-gradient(135deg,#f97316,#c2410c)">${icon('target', 26)}</div>
        <div class="grow"><div class="eyebrow">Your dream school</div><h2 style="font-size:1.7rem;margin:6px 0">${esc(dreamU.name)}</h2>
        <p class="muted small">${esc(dreamU.city)}, ${esc(dreamU.country)}${dreamApp?.deadline ? ` · deadline ${fmtDateY(dreamApp.deadline)} (${relDays(dreamApp.deadline)})` : ''}</p>
        ${dreamApp ? `<div class="progress"><i style="width:${Math.round(dreamDone / Math.max(1, dreamApp.tasks.length) * 100)}%"></i></div><p class="small">${dreamDone}/${dreamApp.tasks.length} steps done${nextTask ? ` · next: <b>${esc(nextTask.t)}</b>` : ''}</p>` : '<p class="small muted" style="margin-top:8px">Open Dream School to build your dated roadmap.</p>'}
        <div class="row wrap" style="margin-top:12px"><a class="btn small primary" href="#/app/dream">Open roadmap</a><a class="btn small" href="#/app/ai">Ask Vertex AI</a></div></div></div>`, 'min-height:220px')
    : `<div class="glass dream-card hover-lift" data-act="goto" data-page="dream">${ico('target', '#f97316', 30)}<div><h3 style="font-size:1.15rem">Pick your dream school</h3><p class="muted" style="margin-top:6px">Vertex builds a dated plan from your scores, budget and its deadlines, and Vertex AI coaches you through it.</p></div><span style="margin-left:auto">${icon('arrow', 20)}</span></div>`) : '';

  const weekW = W.week ? card('', `<div class="row between"><h3>This week</h3><span class="tag mute">${icon('flame', 12)}&nbsp;${st} days</span></div>
    <div class="row" style="margin:16px 0;gap:16px"><div class="ring" style="--p:${Math.min(100, activeCount / goal * 100)}"><b>${activeCount}/${goal}</b></div>
      <div><b>${Math.max(0, goal - activeCount) ? `${goal - activeCount} more active days to your goal` : 'Weekly goal reached!'}</b>
      <div class="week" style="margin-top:8px">${week.map((d) => `<i class="${d.on ? 'on' : ''}" title="${fmtDate(d.date)}"></i>`).join('')}</div></div></div>
    <div class="grid g2" style="gap:8px">
      <div class="mini">${icon('landmark', 18)}<div><b>${S.savedUnis.length}</b><span>Universities saved</span></div></div>
      <div class="mini">${icon('award', 18)}<div><b>${S.savedSch.length}</b><span>Scholarships saved</span></div></div>
      <div class="mini">${icon('kanban', 18)}<div><b>${S.apps.length}</b><span>Applications</span></div></div>
      <div class="mini">${icon('pen', 18)}<div><b>${S.essays.reduce((n, e) => n + (e.body || '').trim().split(/\s+/).filter(Boolean).length, 0)}</b><span>Essay words written</span></div></div></div>
    ${st === 0 ? `<p class="small muted" style="margin-top:12px">${icon('flame', 14)} Start a streak today: <a href="#/app/dream">choose your dream school</a></p>` : ''}`) : '';

  const readyW = W.readiness ? card('', `<div class="row between"><h3>Application readiness</h3><div class="ring" style="--p:${ready.done / ready.total * 100}"><b>${ready.done}/${ready.total}</b></div></div>
    <div style="margin-top:8px">${ready.items.map((i) => `<a class="check ${i.done ? 'done' : ''}" href="#/app/${i.go}" style="text-decoration:none"><span class="box">${i.done ? icon('check', 12) : ''}</span>${esc(i.label)}</a>`).join('')}</div>`) : '';

  const appsW = W.applications ? card('', `<div class="row between"><h3>Applications</h3><a class="small" href="#/app/applications">Open board</a></div>
    <div class="grid g2" style="gap:8px;margin-top:14px">${pipeline.map(([s, n]) => `<div class="mini" style="flex-direction:column;align-items:flex-start;gap:2px"><b>${n}</b><span style="text-transform:capitalize">${s}</span></div>`).join('')}</div>
    ${S.apps.length ? '' : '<p class="small muted" style="margin-top:12px">Add a university to start tracking.</p>'}`) : '';

  const quickW = W.quick ? card('', `<h3 style="margin-bottom:14px">Quick actions</h3><div class="grid g2" style="gap:10px">
    ${[['sparkle', '#8b8cf8', 'Ask Vertex AI', 'ai'], ['pen', '#f59e0b', 'Write an essay', 'essays'], ['chart', '#f43f5e', 'Log a score', 'tests'], ['book', '#38bdf8', 'Essay library', 'essay-library']].map(([ic, c, l, pg]) => `<button class="qa" data-act="goto" data-page="${pg}">${ico(ic, c)}<b>${l}</b></button>`).join('')}</div>`) : '';

  const fitW = W.fit ? card('', `<div class="row between"><h3>Universities that fit you</h3><a class="small" href="#/app/universities">See all ${DATA.unis.length}</a></div>
    <div class="grid g4" style="margin-top:14px;gap:12px">${fitList.map(({ u, f }) => `<div class="uni glass hover-lift" style="padding:8px;box-shadow:none" data-act="uni" data-id="${u.id}">${banner(u)}<div class="body"><b>${esc(u.short)}</b><span class="muted small">${esc(u.country)} · ${money(totalCost(u), { short: true })}/yr</span>${f.score != null ? `<span class="tag ${f.score >= 70 ? 'good' : f.score >= 40 ? 'warn' : 'bad'}">${f.score}% fit</span>` : `<span class="tag">IELTS ${u.ielts}</span>`}</div></div>`).join('')}</div>`) : '';

  const schW = W.scholarships ? card('', `<div class="row between"><h3>Scholarships you can apply for</h3><a class="small" href="#/app/scholarships">All</a></div>
    <div style="margin-top:10px">${schList.map(({ s, d }) => `<div data-act="sch" data-id="${s.id}" style="padding:10px 0;border-top:1px solid var(--stroke);cursor:pointer"><b>${esc(s.name)}</b><div class="muted small">${esc(s.funding)} · ${fmtDate(d)} · ${relDays(d)}</div></div>`).join('') || '<p class="muted small">Complete your profile to see matches.</p>'}</div>`) : '';

  return `
  <div class="toolbar"><div><div class="eyebrow">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}</div>
    <h1 class="page-title" style="margin-top:6px">${esc(greeting(S, ctx.userName))}</h1><p class="page-sub">${esc(sub)}</p></div>
    <div class="glass card tight row" style="gap:14px;min-width:260px">${ico('award', '#22d3ee')}<div><div class="eyebrow">${next ? 'Next deadline' : 'No deadlines yet'}</div><b>${next ? esc(next.title) : 'Save a scholarship to start'}</b>${next ? `<div class="muted small">${fmtDate(next.date)} · ${relDays(next.date)}</div>` : ''}</div></div></div>
  <div class="home-grid">${roadmap}${weekW}</div>
  <div class="grid g3">${readyW}${appsW}${quickW}</div>
  <div class="home-grid">${fitW}${schW}</div>`;
}

// ---------------------------------------------------------------- shared cards
export function banner(u) {
  return `<div class="banner" style="background:${bannerGradient(u.name)}"><b>${esc(u.short)}</b><small>${esc((u.city || '').split(',')[0].toUpperCase())}</small>${SKYLINE}</div>`;
}
export function uniCard(u, ctx) {
  const { S, money } = ctx;
  const saved = S.savedUnis.includes(u.id);
  const cmp = S.compare.includes(u.id);
  const inApp = S.apps.some((a) => a.uniId === u.id);
  const cost = totalCost(u);
  return `<article class="uni glass hover-lift tilt" data-act="uni" data-id="${u.id}">
    ${banner(u)}
    <div class="body"><h3>${esc(u.name)}</h3><span class="muted small">${esc(u.city)}${u.country && !u.city.includes(u.country) ? ', ' + esc(u.country) : ''}</span>
      <p class="muted small" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.6em">${esc(u.desc)}</p>
      <div class="row wrap" style="gap:6px">${u.full
        ? `<span class="tag">${money(cost, { short: true })}/yr</span><span class="tag mute">IELTS ${u.ielts}</span>${u.deadline ? `<span class="tag mute">${esc(u.deadline)}</span>` : ''}${u.accept ? `<span class="tag mute">Admit ${u.accept}%</span>` : ''}`
        : `<span class="tag mute">${icon('clock', 12)}&nbsp;Details coming</span>`}${u.edited ? '<span class="tag good">Community-verified</span>' : ''}</div></div>
    <div class="acts"><button class="btn icon small" data-act="save-uni" data-id="${u.id}" aria-label="Save" style="${saved ? 'color:var(--bad)' : ''}">${saved ? icon('heart') .replace('fill="none"', 'fill="currentColor"') : icon('heart')}</button>
      ${inApp ? '<span class="tag good">✓ In application</span>' : ''}<span class="grow"></span>
      <button class="btn small ${cmp ? 'primary' : ''}" data-act="cmp" data-id="${u.id}">${icon('scale', 14)} Compare</button></div>
  </article>`;
}
export function schRow(s, ctx) {
  const { S } = ctx;
  const f = schFit(s, S);
  const d = schNext(s);
  const saved = S.savedSch.includes(s.id);
  const lv = s.levels.map((l) => ({ b: 'Bachelor', m: 'Master', p: 'PhD' }[l])).join(' · ');
  return `<div class="sch glass hover-lift" data-act="sch" data-id="${s.id}">
    <div class="ring fit" style="--p:${f.score ?? 0}"><b>${f.score ?? '–'}</b></div>
    <div class="grow"><h3 style="font-size:1.05rem">${esc(s.name)}</h3><div class="muted small">${esc(s.provider)} · ${esc(s.country)}</div>
      <div class="row wrap" style="margin-top:8px;gap:6px"><span class="tag ${s.funding === 'Full' ? 'good' : 'warn'}">${s.funding} funding</span><span class="tag mute">${lv}</span>${f.eligible ? '' : '<span class="tag bad">Not eligible</span>'}</div></div>
    <div class="dl"><b>${icon('clock', 12)} ${fmtDate(d)}</b>${relDays(d)}<div style="margin-top:8px"><button class="btn icon small" data-act="save-sch" data-id="${s.id}" style="${saved ? 'color:var(--accent)' : ''}">${saved ? icon('bookmark').replace('fill="none"', 'fill="currentColor"') : icon('bookmark')}</button></div></div>
  </div>`;
}

// ---------------------------------------------------------------- saved
export function saved(ctx) {
  const { S } = ctx;
  const us = S.savedUnis.map((id) => DATA.byUni[id]).filter(Boolean);
  const ss = S.savedSch.map((id) => DATA.bySch[id]).filter(Boolean);
  return `${pageHead(t('saved'), 'Your shortlist of universities and scholarships.')}
  <h3>Universities (${us.length})</h3>
  ${us.length ? `<div class="grid auto">${us.map((u) => uniCard(u, ctx)).join('')}</div>` : '<div class="glass empty">Nothing saved yet. Tap the heart on any university.</div>'}
  <h3 style="margin-top:10px">Scholarships (${ss.length})</h3>
  ${ss.length ? `<div class="stack" style="gap:10px">${ss.map((s) => schRow(s, ctx)).join('')}</div>` : '<div class="glass empty">No scholarships saved. Saved ones appear on your calendar.</div>'}`;
}

// ---------------------------------------------------------------- universities
const TYPE_MAP = { research: /research/i, technical: /technical|institute|grande/i, liberal: /liberal/i, national: /national|regional|public university/i };
export function filterUnis(ctx) {
  const { S, ui } = ctx;
  const f = ui.uni;
  let list = DATA.unis.filter((u) => {
    if (f.q) { const q = f.q.toLowerCase(); if (!`${u.name} ${u.short} ${u.city} ${u.country}`.toLowerCase().includes(q)) return false; }
    if (f.country && u.country !== f.country) return false;
    if (f.cost) { const c = totalCost(u); if (c == null || c > Number(f.cost)) return false; }
    if (f.type && !(TYPE_MAP[f.type] || /./).test(u.type)) return false;
    if (f.onlyIelts && !(u.ielts != null && meetsIelts(u, S))) return false;
    if (f.onlyFull && !u.full) return false;
    if (f.onlySaved && !S.savedUnis.includes(u.id)) return false;
    return true;
  });
  const by = { name: (a, b) => a.name.localeCompare(b.name), cost: (a, b) => (totalCost(a) ?? 1e9) - (totalCost(b) ?? 1e9), accept: (a, b) => (b.accept ?? -1) - (a.accept ?? -1), fit: (a, b) => (uniFit(b, S).score ?? -1) - (uniFit(a, S).score ?? -1) };
  list.sort(by[f.sort] || by.name);
  return list;
}
export function uniResults(ctx) {
  const list = filterUnis(ctx);
  const lim = ctx.ui.uni.limit;
  const show = list.slice(0, lim);
  return `<p class="muted small" style="margin-bottom:12px">${DATA.unis.length - 1 > 0 ? `${list.length} of ${DATA.unis.length} universities` : ''} · showing ${show.length}</p>
  ${show.length ? `<div class="grid auto">${show.map((u) => uniCard(u, ctx)).join('')}</div>` : '<div class="glass empty">No universities match these filters.</div>'}
  ${list.length > lim ? `<div style="text-align:center;margin-top:18px"><button class="btn" data-act="more-unis">Show more</button></div>` : ''}`;
}
export function universities(ctx) {
  const { S, ui } = ctx;
  const f = ui.uni;
  const fullN = DATA.unis.filter((u) => u.full).length;
  const sel = (path, val, opts) => `<select data-bind="${path}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  const tog = (path, on, label, ic) => `<button class="chip ${on ? 'on' : ''}" data-act="tog" data-path="${path}">${ic ? icon(ic, 14) : ''}${label}</button>`;
  return `${pageHead(t('universities'), `${DATA.unis.length} universities in ${DATA.countries.length} countries. ${fullN} have full admissions data so far (cost per year, IELTS, deadlines); the rest are being added from official sources.`,
    `<button class="btn" data-act="goto" data-page="compare">${icon('scale', 16)} Compare <span class="tag">${S.compare.length}</span></button>`)}
  <div class="filters"><input class="search" data-bind="uni.q" value="${esc(f.q)}" placeholder="Search by name, city or country">
    ${sel('uni.country', f.country, [['', 'All countries'], ...DATA.countries.map((c) => [c, c])])}
    ${sel('uni.cost', f.cost, [['', 'Any cost'], ['10000', 'Up to $10k / year'], ['25000', 'Up to $25k / year'], ['45000', 'Up to $45k / year'], ['70000', 'Up to $70k / year']])}
    ${sel('uni.type', f.type, [['', 'All types'], ['research', 'Research'], ['technical', 'Technical'], ['liberal', 'Liberal arts'], ['national', 'National / public']])}</div>
  <div class="filters">${sel('uni.sort', f.sort, [['name', 'Sort: Name'], ['cost', 'Sort: Lowest cost'], ['accept', 'Sort: Easiest admission'], ['fit', 'Sort: Best fit']])}
    ${tog('uni.onlyIelts', f.onlyIelts, 'My IELTS meets it', 'check')}${tog('uni.onlyFull', f.onlyFull, 'Full data only', 'check')}${tog('uni.onlySaved', f.onlySaved, 'Saved', 'heart')}</div>
  <div id="results">${uniResults(ctx)}</div>`;
}

export function uniDrawer(id, ctx) {
  const u = DATA.byUni[id];
  if (!u) return '';
  const { S, money } = ctx;
  const saved = S.savedUnis.includes(u.id), cmp = S.compare.includes(u.id), inApp = S.apps.some((a) => a.uniId === u.id);
  const f = uniFit(u, S);
  const g = DATA.guides[u.country];
  const k = (kk, v, cls = '') => `<div class="${cls}"><div class="k">${kk}</div><div class="v">${v}</div></div>`;
  const cost = totalCost(u);
  const sch = DATA.schs.filter((s) => s.provider.toLowerCase().includes(u.name.toLowerCase()) || s.provider.toLowerCase().includes(u.short.toLowerCase()) || s.country === u.country).slice(0, 4);
  return `<button class="btn icon x" data-act="close" aria-label="Close">${icon('x')}</button>
  ${banner(u).replace('height:96px', 'height:150px')}
  <h2 style="font-size:1.7rem;margin:16px 0 4px">${esc(u.name)}</h2>
  <p class="muted">${esc(u.city)}${u.city.includes(u.country) ? '' : ', ' + esc(u.country)} · ${esc(u.type)}</p>
  <div class="row wrap" style="margin:16px 0;gap:8px">
    <button class="btn primary" data-act="add-app" data-id="${u.id}">${icon(inApp ? 'check' : 'plus', 16)} ${inApp ? 'In applications' : 'Add to applications'}</button>
    <button class="btn" data-act="save-uni" data-id="${u.id}">${icon('heart', 16)} ${saved ? 'Saved' : 'Save'}</button>
    <button class="btn ${cmp ? 'primary' : ''}" data-act="cmp" data-id="${u.id}">${icon('scale', 16)} Compare</button>
    <button class="btn" data-act="set-dream" data-id="${u.id}">${icon('target', 16)} Set as dream school</button></div>
  <h4>About</h4><p style="margin:8px 0">${esc(u.desc)}</p>
  <div class="statgrid">
    ${k('Tuition', u.tuition != null ? `${money(u.tuition)}/yr` : '—/yr')}${k('Living costs', u.living != null ? `${money(u.living)}/yr` : '—/yr')}
    ${k('Total per year', cost != null ? money(cost) : '—')}${k('Program length', u.years ? `${u.years} years` : '—')}
    ${k('IELTS minimum', u.ielts ?? '—')}${k('TOEFL minimum', u.toefl ?? '—')}
    ${k('SAT middle 50%', u.sat || 'Not published')}${k('Acceptance rate', u.accept != null ? `${u.accept}%` : 'Not published')}
    ${k('Typical deadline', u.deadline || '—')}${k('Financial aid', esc(u.aid || 'Not published'))}
  </div>
  ${f.items.length ? `<h4>Your fit${f.score != null ? ` · ${f.score}%` : ''}</h4><div class="stack" style="gap:8px;margin:10px 0">${f.items.map((i) => `<div class="stepitem"><span class="tag ${i.ok === true ? 'good' : i.ok === false ? 'bad' : 'warn'}">${i.ok === true ? '✓' : i.ok === false ? '✗' : '?'}</span><div><b>${i.label}</b> <span class="muted small">${esc(i.note)}</span></div></div>`).join('')}</div>` : '<p class="muted small">Complete your profile to see how you fit.</p>'}
  ${g ? `<details class="guide" open><summary>Studying in ${esc(u.country)}</summary><p class="muted small" style="margin:8px 0">${esc(g.note)}</p>
    <div class="statgrid" style="margin:8px 0">${k('Teaching language', esc(g.language))}${k('Typical intl. tuition / yr', esc(g.tuition))}${k('Living costs / month', esc(g.living))}${k('Intake', esc(g.intake))}${k('Work while studying', esc(g.workDuring))}${k('Work after graduating', esc(g.workAfter))}</div>
    <a class="small" href="${esc(g.portal)}" target="_blank" rel="noopener">${icon('ext', 14)} Official study portal for ${esc(u.country)}</a>
    <p class="faint small" style="margin-top:8px">Country-wide ranges, rounded. Visa and work rules change often: confirm on the official portal.</p></details>` : ''}
  ${u.strong.length ? `<h4>Known for</h4><div class="row wrap" style="margin:8px 0 14px;gap:8px">${u.strong.map((m) => `<span class="chip">${esc(DATA.majorById[m]?.name || m)}</span>`).join('')}</div>` : ''}
  ${sch.length ? `<h4>Scholarships here</h4><div class="stack" style="gap:8px;margin:8px 0 14px">${sch.map((s) => `<div class="stepitem" data-act="sch" data-id="${s.id}" style="cursor:pointer">${icon('award', 18)}<div><b>${esc(s.name)}</b><div class="muted small">${s.funding} · typical deadline ${fmtDate(schNext(s))}</div></div></div>`).join('')}</div>` : ''}
  ${u.url ? `<a class="btn" style="width:100%" href="${esc(u.url)}" target="_blank" rel="noopener">${icon('ext', 16)} Official admissions site</a>` : ''}
  <p class="faint small" style="margin-top:14px">Figures approximate, last reviewed ${esc(window.VERTEX_CONFIG?.DATA_VERSION || '')}. Confirm everything on the official site before applying. <a href="#/app/health" data-act="close">Edit in Data Health</a>.</p>`;
}

// ---------------------------------------------------------------- scholarships
export function filterSch(ctx) {
  const { S, ui } = ctx;
  const f = ui.sch;
  const lc = { Bachelor: 'b', Master: 'm', PhD: 'p' }[f.level];
  return DATA.schs.filter((s) => {
    if (f.q && !`${s.name} ${s.provider} ${s.country}`.toLowerCase().includes(f.q.toLowerCase())) return false;
    if (lc && !s.levels.includes(lc)) return false;
    if (f.funding && s.funding !== f.funding) return false;
    if (f.eligible && !schFit(s, S).eligible) return false;
    if (f.saved && !S.savedSch.includes(s.id)) return false;
    return true;
  }).sort((a, b) => schNext(a) - schNext(b));
}
export function schResults(ctx) {
  const list = filterSch(ctx);
  return `<p class="muted small" style="margin-bottom:12px">${list.length} scholarships · sorted by next deadline</p>
  <div class="stack" style="gap:12px">${list.map((s) => schRow(s, ctx)).join('') || '<div class="glass empty">No scholarships match.</div>'}</div>`;
}
export function scholarships(ctx) {
  const f = ctx.ui.sch;
  const sel = (path, val, opts) => `<select data-bind="${path}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  const tog = (path, on, label, ic) => `<button class="chip ${on ? 'on' : ''}" data-act="tog" data-path="${path}">${icon(ic, 14)}${label}</button>`;
  return `${pageHead(t('scholarships'), `${DATA.schs.length} major scholarships. The fit score counts how many published criteria you meet (level, nationality, English, grades). It is not a prediction of winning.`)}
  <div class="filters"><input class="search" data-bind="sch.q" value="${esc(f.q)}" placeholder="Search scholarships or countries">
    ${sel('sch.level', f.level, [['', 'All levels'], ['Bachelor', 'Bachelor'], ['Master', 'Master'], ['PhD', 'PhD']])}
    ${sel('sch.funding', f.funding, [['', 'Full or partial'], ['Full', 'Full'], ['Partial', 'Partial']])}
    ${tog('sch.eligible', f.eligible, "I'm eligible", 'check')}${tog('sch.saved', f.saved, 'Saved', 'bookmark')}</div>
  <div id="results">${schResults(ctx)}</div>`;
}
export function schDrawer(id, ctx) {
  const s = DATA.bySch[id];
  if (!s) return '';
  const { S } = ctx;
  const f = schFit(s, S);
  const d = schNext(s);
  const saved = S.savedSch.includes(s.id);
  const lv = s.levels.map((l) => ({ b: 'Bachelor', m: 'Master', p: 'PhD' }[l])).join(', ');
  const open = s.eligible === 'all' ? 'Students from most countries (check the current call)' : s.eligible === '!eligible' ? 'Selected countries only (check the official list)' : `Citizens of ${s.eligible}`;
  return `<button class="btn icon x" data-act="close" aria-label="Close">${icon('x')}</button>
  <div class="row" style="gap:14px"><div class="ring" style="--p:${f.score ?? 0}"><b>${f.score ?? '–'}</b></div><div><div class="eyebrow" style="color:var(--accent)">${esc(s.country.toUpperCase())}</div><h2 style="font-size:1.5rem;margin:4px 0">${esc(s.name)}</h2><p class="muted">${esc(s.provider)}</p></div></div>
  <div class="row wrap" style="margin:16px 0;gap:8px"><button class="btn primary" data-act="save-sch" data-id="${s.id}">${icon('calendar', 16)} ${saved ? 'On your calendar' : 'Add deadline to calendar'}</button></div>
  <p>${esc(s.desc)}</p>
  <div class="statgrid"><div><div class="k">Funding</div><div class="v">${s.funding}</div></div><div><div class="k">Levels</div><div class="v">${lv}</div></div>
    <div><div class="k">Typical deadline</div><div class="v">${fmtDate(d)} · ${relDays(d)}</div></div><div><div class="k">Open to</div><div class="v">${esc(open)}</div></div></div>
  <h4>What it covers</h4><div class="grid g2" style="margin:10px 0 16px;gap:6px">${s.covers.map((c) => `<span class="small">${icon('check', 14)} ${esc(c)}</span>`).join('')}</div>
  <h4>How to apply</h4><div class="stack" style="gap:8px;margin:10px 0 16px">${s.steps.map((x, i) => `<div class="stepitem"><span class="n">${i + 1}</span>${esc(x)}</div>`).join('')}</div>
  <h4>Documents you'll usually need</h4><div class="row wrap" style="gap:8px;margin:10px 0 16px">${s.docs.map((x) => `<span class="chip">${icon('file', 14)} ${esc(x)}</span>`).join('')}</div>
  <h4>Your eligibility</h4><div class="stack" style="gap:8px;margin:10px 0">${f.items.map((i) => `<div class="stepitem"><span class="tag ${i.ok === true ? 'good' : i.ok === false ? 'bad' : 'warn'}">${i.ok === true ? '✓' : i.ok === false ? '✗' : '?'}</span><div><b>${i.label}</b> <span class="muted small">${esc(i.note)}</span></div></div>`).join('')}</div>
  <p class="faint small">${f.eligible ? 'Eligible' : 'Likely not eligible'} based only on published criteria. Selection also weighs essays, interviews and recommendations.</p>
  <a class="btn" style="width:100%;margin-top:12px" href="${esc(s.url)}" target="_blank" rel="noopener">${icon('ext', 16)} Official page</a>
  <p class="faint small" style="margin-top:12px">Deadlines move every year. Last reviewed ${esc(window.VERTEX_CONFIG?.DATA_VERSION || '')}.</p>`;
}

// ---------------------------------------------------------------- majors
export function majors(ctx) {
  const cat = ctx.ui.majorCat;
  const cats = ['All', ...new Set(DATA.majors.map((m) => m.category))];
  const list = DATA.majors.filter((m) => cat === 'All' || m.category === cat);
  return `${pageHead(t('majors'), "What you'd study, where it leads, and which universities are strong in it.")}
  <div class="seg">${cats.map((c) => `<button class="${c === cat ? 'on' : ''}" data-act="majorcat" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div>
  <div class="grid auto">${list.map((m) => { const n = DATA.unis.filter((u) => u.strong.includes(m.id)).length; const mine = ctx.S.profile.majors.includes(m.id);
    return `<div class="glass card hover-lift" data-act="major" data-id="${m.id}" style="cursor:pointer"><div class="eyebrow" style="color:var(--accent)">${esc(m.category)}</div><h3 style="margin:6px 0">${esc(m.name)}${mine ? ' ✓' : ''}</h3><p class="muted small">${esc(m.courses)}</p><p class="faint small" style="margin-top:10px">${n} universities in Vertex</p></div>`; }).join('')}</div>`;
}
export function majorDrawer(id, ctx) {
  const m = DATA.majorById[id];
  if (!m) return '';
  const unis = DATA.unis.filter((u) => u.strong.includes(id));
  const mine = ctx.S.profile.majors.includes(id);
  return `<button class="btn icon x" data-act="close">${icon('x')}</button>
  <div class="eyebrow" style="color:var(--accent)">${esc(m.category)}</div><h2 style="font-size:1.7rem;margin:6px 0">${esc(m.name)}</h2>
  <p class="muted">${esc(m.courses)}</p><p style="margin:12px 0"><b>Where it leads:</b> ${esc(m.careers)}</p>
  <button class="btn ${mine ? '' : 'primary'}" data-act="toggle-major" data-id="${id}">${icon(mine ? 'check' : 'plus', 16)} ${mine ? 'In my majors' : 'Add to my majors'}</button>
  <h4 style="margin-top:20px">Universities strong in it (${unis.length})</h4>
  <div class="stack" style="gap:8px;margin-top:10px">${unis.slice(0, 40).map((u) => `<div class="stepitem" data-act="uni" data-id="${u.id}" style="cursor:pointer"><b>${esc(u.name)}</b><span class="muted small">${esc(u.country)}</span></div>`).join('') || '<p class="muted small">No data yet.</p>'}</div>`;
}

// ---------------------------------------------------------------- compare
export function compare(ctx) {
  const { S, money } = ctx;
  const list = S.compare.map((id) => DATA.byUni[id]).filter(Boolean);
  const opts = DATA.unis.filter((u) => !S.compare.includes(u.id));
  const rows = [
    ['Total per year', (u) => totalCost(u), (v) => money(v), 'min'],
    ['Tuition', (u) => u.tuition, (v) => money(v), 'min'],
    ['Living costs', (u) => u.living, (v) => money(v), 'min'],
    ['Full degree cost', (u) => (totalCost(u) != null && u.years ? totalCost(u) * u.years : null), (v) => money(v), 'min'],
    ['Program length', (u) => u.years, (v) => `${v} years`, 'min'],
    ['IELTS minimum', (u) => u.ielts, (v) => v, 'min'],
    ['TOEFL minimum', (u) => u.toefl, (v) => v, 'min'],
    ['SAT middle 50%', (u) => u.sat, (v) => v, null],
    ['Acceptance rate', (u) => u.accept, (v) => `${v}%`, 'max'],
    ['Typical deadline', (u) => u.deadline, (v) => v, null],
    ['Your fit', (u) => uniFit(u, S).score, (v) => `${v}%`, 'max'],
  ];
  const maxCost = Math.max(1, ...list.map((u) => totalCost(u) || 0));
  const bars = list.map((u) => {
    const c = totalCost(u);
    return `<div class="bar"><span>${esc(u.short)}</span><div class="track">${c == null ? '' : `<i style="width:${(u.tuition || 0) / maxCost * 100}%;background:var(--accent)"></i><i style="width:${(u.living || 0) / maxCost * 100}%;background:var(--warn)"></i>`}</div><span style="text-align:right">${c == null ? 'No data yet' : money(c, { short: true })}</span></div>`;
  }).join('');
  const table = list.length ? `<div class="glass card" style="overflow-x:auto"><table class="cmp"><tr><th></th>${list.map((u) => `<td style="min-width:170px">${banner(u)}<b style="display:block;margin-top:8px">${esc(u.name)}</b><span class="muted small">${esc(u.country)}</span><br><button class="btn small" style="margin-top:6px" data-act="cmp" data-id="${u.id}">Remove</button></td>`).join('')}</tr>
    ${rows.map(([label, get, fmt, best]) => {
      const vals = list.map(get);
      const nums = vals.filter((v) => typeof v === 'number');
      const target = best && nums.length > 1 ? (best === 'min' ? Math.min(...nums) : Math.max(...nums)) : null;
      return `<tr><th>${label}</th>${vals.map((v) => `<td class="${target != null && v === target ? 'best' : ''}">${v == null || v === '' ? '—' : esc(fmt(v))}</td>`).join('')}</tr>`;
    }).join('')}</table></div>` : '<div class="glass empty">Add universities to compare them side by side.</div>';
  return `${pageHead(t('compare'), 'Up to four universities side by side. Green marks the best value in each row.',
    `<select data-bind="cmp.add" style="width:auto;min-width:220px"><option value="">+ Add university</option>${opts.map((u) => `<option value="${u.id}">${esc(u.name)}</option>`).join('')}</select>`)}
  ${list.length ? `<div class="glass card"><h3 style="margin-bottom:14px">Cost per year</h3><div class="bars">${bars}</div><div class="row" style="margin-top:12px;gap:16px"><span class="small"><i style="display:inline-block;width:10px;height:10px;background:var(--accent);border-radius:3px"></i> Tuition</span><span class="small"><i style="display:inline-block;width:10px;height:10px;background:var(--warn);border-radius:3px"></i> Living</span></div></div>` : ''}
  ${table}`;
}

// palette search results (used by main.js)
export function searchAll(q, S) {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const out = [];
  DATA.unis.forEach((u) => { if (`${u.name} ${u.short} ${u.country} ${u.city}`.toLowerCase().includes(s)) out.push({ kind: 'University', title: u.name, sub: `${u.city}, ${u.country}`, act: 'uni', id: u.id }); });
  DATA.schs.forEach((x) => { if (`${x.name} ${x.provider} ${x.country}`.toLowerCase().includes(s)) out.push({ kind: 'Scholarship', title: x.name, sub: `${x.provider} · ${x.funding}`, act: 'sch', id: x.id }); });
  DATA.majors.forEach((m) => { if (m.name.toLowerCase().includes(s)) out.push({ kind: 'Major', title: m.name, sub: m.category, act: 'major', id: m.id }); });
  PAGE_TITLES.forEach((p) => { if (t(p).toLowerCase().includes(s)) out.push({ kind: 'Page', title: t(p), sub: 'Go to page', act: 'goto', page: p }); });
  return out.slice(0, 30);
}
