// Demo-only stand-ins, never used in production:
//  :54321  Supabase Auth (fixed demo accounts) + /rest/v1/* proxied to PostgREST
//  :8787   static "edge": artwork, VOD HLS (any asset id → the demo video) and /live/{name}/ (MediaMTX stand-in)
// `node server.mjs keys` prints the anon / service-role JWTs signed with DEMO_JWT_SECRET.
import { createHmac } from 'node:crypto';
import { createReadStream, existsSync, statSync } from 'node:fs';
import http from 'node:http';
import { join, normalize } from 'node:path';

const SECRET = process.env.DEMO_JWT_SECRET ?? 'chouf-demo-jwt-secret-not-for-production-0001';
const POSTGREST = new URL(process.env.POSTGREST_URL ?? 'http://127.0.0.1:3001');
const MEDIA = process.env.MEDIA_DIR ?? new URL('../media', import.meta.url).pathname;
const PASSWORD = 'demo1234';
const USERS = {
  'samir@demo.tn': '11111111-1111-4111-8111-111111111111',
  'admin@demo.tn': '22222222-2222-4222-8222-222222222222',
  'leila@demo.tn': '33333333-3333-4333-8333-333333333333',
};

const b64 = (s) => Buffer.from(s).toString('base64url');
const sign = (data) => createHmac('sha256', SECRET).update(data).digest('base64url');
function jwt(claims) {
  const head = `${b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64(JSON.stringify(claims))}`;
  return `${head}.${sign(head)}`;
}
function verify(token) {
  const [h, p, s] = String(token ?? '').split('.');
  if (!h || !p || !s || sign(`${h}.${p}`) !== s) return null;
  try {
    const claims = JSON.parse(Buffer.from(p, 'base64url').toString());
    return claims.exp && claims.exp < Date.now() / 1000 ? null : claims;
  } catch {
    return null;
  }
}
const ANON = jwt({ role: 'anon', iss: 'supabase', exp: 4_000_000_000 });
const SERVICE = jwt({ role: 'service_role', iss: 'supabase', exp: 4_000_000_000 });
if (process.argv[2] === 'keys') {
  console.log(`ANON_KEY=${ANON}\nSERVICE_ROLE_KEY=${SERVICE}`);
  process.exit(0);
}

const userJson = (id, email) => ({ id, aud: 'authenticated', role: 'authenticated', email, email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: { provider: 'email' }, user_metadata: {}, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' });
function session(id, email) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const access_token = jwt({ sub: id, email, role: 'authenticated', aud: 'authenticated', iss: 'supabase', exp });
  return { access_token, token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: `rt-${id}`, user: userJson(id, email) };
}
function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
  res.end(JSON.stringify(body));
}
const readBody = (req) => new Promise((resolve) => { let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => resolve(d)); });

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' });
      return res.end();
    }
    if (url.pathname === '/auth/v1/token' && req.method === 'POST') {
      let body = {};
      try { body = JSON.parse((await readBody(req)) || '{}'); } catch { /* empty */ }
      if (url.searchParams.get('grant_type') === 'refresh_token') {
        const id = String(body.refresh_token ?? '').replace(/^rt-/, '');
        const email = Object.keys(USERS).find((e) => USERS[e] === id);
        return email ? json(res, 200, session(id, email)) : json(res, 400, { error: 'invalid_grant' });
      }
      const email = String(body.email ?? '').toLowerCase();
      if (!USERS[email] || body.password !== PASSWORD) return json(res, 400, { error: 'invalid_grant', error_description: 'Invalid login credentials' });
      return json(res, 200, session(USERS[email], email));
    }
    if (url.pathname === '/auth/v1/user') {
      const claims = verify((req.headers.authorization ?? '').replace(/^Bearer /, ''));
      return claims?.sub ? json(res, 200, userJson(claims.sub, claims.email)) : json(res, 401, { message: 'invalid token' });
    }
    if (url.pathname === '/auth/v1/logout') { res.writeHead(204); return res.end(); }
    if (url.pathname.startsWith('/auth/v1/')) return json(res, 400, { error: 'not_available', error_description: 'Inscription et e-mails désactivés dans la démo.' });
    if (url.pathname.startsWith('/rest/v1/')) {
      const headers = { ...req.headers, host: POSTGREST.host };
      // Signed out, supabase-js sends the anon key as bearer: make sure PostgREST always receives a valid JWT.
      if (!verify((headers.authorization ?? '').replace(/^Bearer /, ''))) headers.authorization = `Bearer ${ANON}`;
      delete headers.apikey;
      const upstream = http.request({ hostname: POSTGREST.hostname, port: POSTGREST.port || 80, method: req.method, path: req.url.slice('/rest/v1'.length), headers }, (up) => {
        res.writeHead(up.statusCode ?? 502, up.headers);
        up.pipe(res);
      });
      upstream.on('error', () => json(res, 502, { message: 'PostgREST indisponible' }));
      return req.pipe(upstream);
    }
    json(res, 404, { message: 'not found' });
  })
  .listen(54321, () => console.log('demo auth + rest :54321'));

const MIME = { m3u8: 'application/vnd.apple.mpegurl', ts: 'video/mp2t', jpg: 'image/jpeg', png: 'image/png' };
const safe = (p) => normalize(p).replace(/^(\.\.[/\\])+/, '');
http
  .createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/health') return json(res, 200, { ok: true });
    let file = null;
    const art = /^\/a\/artwork\/([\w.-]+)$/.exec(url.pathname);
    const vod = /^\/t\/\d+\/[\w-]+\/[0-9a-f-]{36}\/(.+)$/.exec(url.pathname); // token not checked: demo only
    const live = /^\/live\/([\w-]+)\/(.+)$/.exec(url.pathname);
    if (art) file = join(MEDIA, 'artwork', art[1]);
    else if (vod) file = join(MEDIA, 'hls', safe(vod[1]));
    // Hannibal's primary source is seeded as "down": keep it unreachable so the gateway uses the backup.
    else if (live && live[1] !== 'hannibal-principale') file = join(MEDIA, 'hls', live[2] === 'index.m3u8' ? 'master.m3u8' : safe(live[2]));
    if (!file || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'content-type': MIME[file.split('.').pop()] ?? 'application/octet-stream', 'access-control-allow-origin': '*', 'cache-control': 'no-store' });
    createReadStream(file).pipe(res);
  })
  .listen(8787, () => console.log('demo edge :8787'));
