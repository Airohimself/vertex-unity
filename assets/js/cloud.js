// Supabase wrapper. Everything here is optional: with no keys in config.js the app
// runs in demo mode and none of these functions are ever called.

const cfg = (typeof window !== 'undefined' && window.VERTEX_CONFIG) || {};
export const enabled = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
let sb = null;

export async function init() {
  if (!enabled) return null;
  const m = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  sb = m.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  return sb;
}
export const client = () => sb;

// ------------------------------------------------------------ auth
export async function getSession() { const { data } = await sb.auth.getSession(); return data.session; }
export const onAuth = (cb) => sb.auth.onAuthStateChange((_e, session) => cb(session));
export async function signUp(email, password, name) {
  const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name } } });
  if (error) throw error;
  return data;
}
export async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}
export async function resetPassword(email) {
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin });
  if (error) throw error;
}
export const signOut = () => sb.auth.signOut();

// ------------------------------------------------------------ student data
export async function loadState(uid) {
  const { data, error } = await sb.from('user_state').select('state').eq('user_id', uid).maybeSingle();
  if (error) throw error;
  return data?.state || null;
}
export async function saveState(uid, state) {
  const { error } = await sb.from('user_state').upsert({ user_id: uid, state, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// ------------------------------------------------------------ shared catalogue fixes
export async function loadOverrides() {
  const { data, error } = await sb.from('catalog_overrides').select('id,patch');
  if (error) throw error;
  const map = {};
  (data || []).forEach((r) => { map[r.id] = r.patch; });
  return map;
}
export async function saveOverride(id, patch, uid) {
  const { error } = await sb.from('catalog_overrides').upsert({ id, patch, updated_by: uid, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// ------------------------------------------------------------ community
export async function listMessages(channel) {
  const { data, error } = await sb.from('messages').select('*').eq('channel', channel).order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  return (data || []).reverse();
}
export async function sendMessage(msg) {
  const { data, error } = await sb.from('messages').insert(msg).select().single();
  if (error) throw error;
  return data;
}
export function subscribeMessages(channel, cb) {
  const ch = sb.channel('msgs-' + channel)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel=eq.${channel}` }, (p) => cb(p.new))
    .subscribe();
  return () => sb.removeChannel(ch);
}
export function trackPresence(uid, name, onCount) {
  const ch = sb.channel('online', { config: { presence: { key: uid } } });
  ch.on('presence', { event: 'sync' }, () => onCount(Object.keys(ch.presenceState()).length));
  ch.subscribe(async (status) => { if (status === 'SUBSCRIBED') await ch.track({ name }); });
  return () => sb.removeChannel(ch);
}

// ------------------------------------------------------------ files (private bucket)
const BUCKET = 'user-files';
export const FILE_CATS = ['documents', 'transcripts', 'certificates', 'essays', 'recommendations'];
export async function listFiles(uid) {
  const out = [];
  for (const cat of FILE_CATS) {
    const { data } = await sb.storage.from(BUCKET).list(`${uid}/${cat}`, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
    (data || []).filter((f) => f.id).forEach((f) => out.push({ cat, name: f.name, size: f.metadata?.size || 0, path: `${uid}/${cat}/${f.name}`, created: f.created_at }));
  }
  return out;
}
export async function uploadFile(uid, cat, file) {
  const safe = file.name.replace(/[^\w.\- ]+/g, '_');
  const path = `${uid}/${cat}/${Date.now()}-${safe}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}
export async function fileUrl(path) {
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, 120);
  if (error) throw error;
  return data.signedUrl;
}
export async function removeFile(path) {
  const { error } = await sb.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
export async function accessToken() { const s = await getSession(); return s?.access_token || ''; }
