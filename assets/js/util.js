// Small shared helpers: escaping, dates, icons, money, colours.

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);
export const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

// ---------------------------------------------------------------- dates
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const today = () => startOfDay(new Date());
export const iso = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
export const fromIso = (s) => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
export const fmtDate = (d) => { const x = new Date(d); return `${MONTHS[x.getMonth()]} ${x.getDate()}`; };
export const fmtDateY = (d) => { const x = new Date(d); return `${MONTHS[x.getMonth()]} ${x.getDate()}, ${x.getFullYear()}`; };
export const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / 86400000);
export const daysUntil = (d) => daysBetween(today(), d);
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

// Accepts "Jan 1" or "11-30". Returns {m (0-11), d} or null.
export function parseMD(str) {
  if (!str) return null;
  const s = String(str).trim();
  let m = s.match(/^(\d{1,2})-(\d{1,2})$/);
  if (m) return { m: Number(m[1]) - 1, d: Number(m[2]) };
  m = s.match(/^([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2})/);
  if (m) {
    const i = MONTHS.findIndex((x) => x.toLowerCase() === m[1].toLowerCase());
    if (i >= 0) return { m: i, d: Number(m[2]) };
  }
  return null;
}
// Next calendar date (today or later) for a recurring month/day.
export function nextOccurrence(str, from = today()) {
  const md = parseMD(str);
  if (!md) return null;
  let d = new Date(from.getFullYear(), md.m, md.d);
  if (d < from) d = new Date(from.getFullYear() + 1, md.m, md.d);
  return d;
}
export const relDays = (d) => { const n = daysUntil(d); return n === 0 ? 'today' : n === 1 ? 'tomorrow' : n < 0 ? `${-n} days ago` : `in ${n} days`; };

// ---------------------------------------------------------------- money
export function makeMoney(settings, rates) {
  const cur = settings?.currency || 'USD';
  const r = rates?.[cur] ?? 1;
  return (usd, opts = {}) => {
    if (usd == null || Number.isNaN(usd)) return '—';
    const v = usd * r;
    if (opts.short) {
      const sym = cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '';
      const num = cur === 'UZS' ? `${Math.round(v / 1e6 * 10) / 10}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : `${Math.round(v)}`;
      return `${sym}${num}${cur === 'UZS' ? ' so\'m' : ''}`;
    }
    const sym = cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '';
    const num = Math.round(v).toLocaleString('en-US');
    return `${sym}${num}${cur === 'UZS' ? " so'm" : ''}`;
  };
}

// ---------------------------------------------------------------- colours
export function hash(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; }
export function bannerGradient(name) {
  const h = hash(name) % 360;
  return `linear-gradient(135deg, hsl(${h} 70% 46%), hsl(${(h + 55) % 360} 65% 26%))`;
}
export const SKYLINE = '<svg viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40V26h10v-8h8v10h10V14h8v14h12V20h10v8h8V10h8v18h12v-9h10v13h10V16h8v12h14v-8h12v20z" fill="rgba(0,0,0,.45)"/></svg>';

// ---------------------------------------------------------------- icons
const P = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  pen: '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/><path d="M16 4.5a3.5 3.5 0 010 7"/><path d="M18 14c2.5.6 4 2.6 4 6"/>',
  library: '<rect x="3" y="4" width="4" height="16" rx="1"/><rect x="9" y="4" width="4" height="16" rx="1"/><path d="M15.5 6l4.5 14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
  moon: '<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>',
  bell: '<path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"/><path d="M10 21h4"/>',
  heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 018-2.5A4.5 4.5 0 0120 9c0 6-8 11-8 11z"/>',
  landmark: '<path d="M3 9l9-5 9 5"/><path d="M5 10v8M10 10v8M14 10v8M19 10v8M3 20h18"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 21l5-3 5 3-1.5-7"/>',
  grad: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c3 2.5 9 2.5 12 0v-4.5"/>',
  scale: '<path d="M12 4v16M6 20h12M4 8h16"/><path d="M4 8l-2 6a3 3 0 004 0zM20 8l-2 6a3 3 0 004 0z"/>',
  kanban: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 7v7M12 7v10M16 7v4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  sparkle: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/><path d="M19 3v4M17 5h4"/>',
  message: '<path d="M4 5h16v11H9l-5 4z"/>',
  book: '<path d="M4 5a2 2 0 012-2h6v18H6a2 2 0 01-2-2zM12 3h6a2 2 0 012 2v14a2 2 0 01-2 2h-6"/>',
  folder: '<path d="M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/>',
  palette: '<path d="M12 3a9 9 0 100 18c1.5 0 2-1 1.5-2s0-2 1.5-2h2a3 3 0 003-3c0-6-4-11-8-11z"/><circle cx="8" cy="11" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16" cy="11" r="1"/>',
  logout: '<path d="M9 4H5a2 2 0 00-2 2v12a2 2 0 002 2h4M16 8l4 4-4 4M20 12H9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
  send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
  chev: '<path d="M6 9l6 6 6-6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  file: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
};
export function icon(name, size = 18) {
  return `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
}
export const ico = (name, color, size = 20) => `<span class="ico" style="background:linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 55%, #000))">${icon(name, size)}</span>`;

export function initials(name) {
  return String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || '?';
}
export function wordCount(text) { const m = String(text || '').trim().match(/\S+/g); return m ? m.length : 0; }
