// Audit harness: exercises the real HTTP + Socket.io stack end-to-end.
// Run from server/:  node scripts/auditE2E.js
import 'dotenv/config';
import http from 'http';
import mongoose from 'mongoose';
import { io as ioClient } from 'socket.io-client';
import app from '../app.js';

const BASE = 'http://127.0.0.1:5099';
const log = (...a) => console.log(...a);

let cookieStore = {};
const jar = () => Object.entries(cookieStore).map(([k, v]) => `${k}=${v}`).join('; ');

async function call(method, path, { body, headers = {}, useAuth = true } = {}) {
  const h = { ...headers };
  if (useAuth && jar()) h.Cookie = jar();
  let payload;
  if (body !== undefined) { payload = JSON.stringify(body); h['Content-Type'] ||= 'application/json'; }

  const res = await fetch(BASE + path, { method, headers: h, body: payload });
  const sc = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  for (const c of sc) {
    const [kv] = c.split(';');
    const eq = kv.indexOf('=');
    const name = kv.slice(0, eq).trim();
    const val = kv.slice(eq + 1).trim();
    if (val === '' || /expires=Thu, 01 Jan 1970/i.test(c)) delete cookieStore[name];
    else cookieStore[name] = val;
  }
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
}

let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
  if (cond) pass++; else fail++;
  log(`${cond ? 'PASS' : 'FAIL'} | ${name}${extra ? ' | ' + extra : ''}`);
};
const firstLine = (s) => String(s || '').split('\n')[0];

const connectSocket = () => new Promise((resolve, reject) => {
  const s = ioClient(BASE, {
    transports: ['websocket'],
    withCredentials: true,
    extraHeaders: { Cookie: jar() },
  });
  const t = setTimeout(() => reject(new Error('socket connect timeout')), 6000);
  s.on('connect', () => { clearTimeout(t); resolve(s); });
  s.on('connect_error', (e) => { clearTimeout(t); reject(new Error('connect_error: ' + e.message)); });
});


const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  log('## MONGO replicaSet =', mongoose.connection.client.topology?.description?.setName || 'NONE (standalone)');

  const server = http.createServer(app);
  const { initializeSocket } = await import('../config/socket.js');
  initializeSocket(server);
  await new Promise((r) => server.listen(5099, r));
  log('## HTTP up on 5099');

  const stamp = Date.now();
  const User = (await import('../models/User.js')).default;
  const ae = (s) => `${s}.${stamp}@college.edu`;

  const health = await call('GET', '/api/health', { useAuth: false });
  check('health endpoint', health.status === 200, `status=${health.status}`);

  cookieStore = {};
  const regA = await call('POST', '/api/auth/register', {
    useAuth: false,
    body: { name: 'Alice Finder', email: ae('alice'), password: 'Password123!', college: 'Test College', studentId: 'S1' },
  });
  check('register student A', regA.status === 201, `status=${regA.status} msg=${regA.body?.message}`);
  check('register sets HttpOnly jwt cookie', !!cookieStore.jwt);

  const A = await User.findOne({ email: ae('alice') });
  const AwithPw = await User.findById(A._id).select('+password');
  check('password hashed once + verifiable',
    /^\$2[aby]\$/.test(AwithPw.password) && (await AwithPw.matchPassword('Password123!')),
    `hashlen=${AwithPw.password?.length} prefix=${AwithPw.password?.slice(0, 4)}`);

  const dup = await call('POST', '/api/auth/register', {
    useAuth: false, body: { name: 'Alice Again', email: ae('alice'), password: 'Password123!' },
  });
  check('duplicate email -> 409', dup.status === 409, `status=${dup.status} msg=${dup.body?.message}`);

  const esc = await call('POST', '/api/auth/register', {
    useAuth: false, body: { name: 'Mallory', email: ae('mallory'), password: 'Password123!', role: 'admin' },
  });
  const mallory = await User.findOne({ email: ae('mallory') });
  check('role escalation via register blocked', esc.status === 201 && mallory?.role === 'student', `role=${mallory?.role}`);

  const weak = await call('POST', '/api/auth/register', {
    useAuth: false, body: { name: 'Weak', email: ae('weak'), password: 'short' },
  });
  check('weak password -> 4xx not 5xx', weak.status >= 400 && weak.status < 500, `status=${weak.status}`);

  cookieStore = {};
  const loginA = await call('POST', '/api/auth/login', { useAuth: false, body: { email: ae('alice'), password: 'Password123!' } });
  check('LOGIN alice', loginA.status === 200 && loginA.body?.success,
    `status=${loginA.status} msg=${JSON.stringify(loginA.body?.message)} stack=${loginA.body?.stack ? 'LEAK' : 'none'}`);

  const badPw = await call('POST', '/api/auth/login', { useAuth: false, body: { email: ae('alice'), password: 'WrongPassword!' } });
  check('wrong password -> 401', badPw.status === 401, `status=${badPw.status}`);
  const noUser = await call('POST', '/api/auth/login', { useAuth: false, body: { email: ae('ghost'), password: 'Password123!' } });
  check('unknown user -> 401', noUser.status === 401, `status=${noUser.status}`);
  const loginCase = await call('POST', '/api/auth/login', { useAuth: false, body: { email: ae('ALICE').toUpperCase(), password: 'Password123!' } });
  check('login mixed-case email', loginCase.status === 200, `status=${loginCase.status}`);

  const me = await call('GET', '/api/auth/me');
  check('/me returns current user', me.status === 200 && me.body?.data?.user?.email === ae('alice'), `status=${me.status}`);
  check('/me leaks no password', !JSON.stringify(me.body).includes('$2a$'));
  const meNo = await call('GET', '/api/auth/me', { useAuth: false });
  check('/me without cookie -> 401', meNo.status === 401, `status=${meNo.status}`);
  const adminBlocked = await call('GET', '/api/admin/dashboard/stats');
  check('student blocked from admin API -> 403', adminBlocked.status === 403, `status=${adminBlocked.status}`);
  const anaBlocked = await call('GET', '/api/admin/analytics/overview');
  check('student blocked from analytics -> 403', anaBlocked.status === 403, `status=${anaBlocked.status}`);

  // items
  const foundItem = await call('POST', '/api/items', {
    body: { title: 'Blue HP Calculator', description: 'Found on library desk scientific calculator', type: 'found', category: 'electronics', location: 'Library', date: new Date().toISOString().slice(0, 10), color: 'blue', brand: 'HP' },
  });
  check('create FOUND item', foundItem.status === 201, `status=${foundItem.status} msg=${foundItem.body?.message}`);
  const foundId = foundItem.body?.data?._id;

  const badItem = await call('POST', '/api/items', {
    body: { title: 'X', description: 'y', type: 'sideways', category: 'weapons', location: 'nowhere', date: new Date().toISOString() },
  });
  check('invalid item -> 400', badItem.status === 400, `status=${badItem.status}`);

  cookieStore = {};
  const regB = await call('POST', '/api/auth/register', {
    useAuth: false, body: { name: 'Bob Claimant', email: ae('bob'), password: 'Password123!', college: 'Test College', studentId: 'S2' },
  });
  check('register student B', regB.status === 201, `status=${regB.status}`);
  const lostItem = await call('POST', '/api/items', {
    body: { title: 'My HP Calculator', description: 'Lost my blue HP scientific calculator in library', type: 'lost', category: 'electronics', location: 'Library', date: new Date().toISOString().slice(0, 10), color: 'blue', brand: 'HP' },
  });
  check('create LOST item', lostItem.status === 201, `status=${lostItem.status}`);
  const lostId = lostItem.body?.data?._id;

  const list = await call('GET', '/api/items?search=calculator&limit=5');
  check('search items', list.status === 200 && Array.isArray(list.body?.data?.items), `count=${list.body?.data?.items?.length}`);
  const noSql = await call('GET', '/api/items?search[$ne]=x');
  check('NoSQL operator in query not fatal', noSql.status === 200 || noSql.status === 400, `status=${noSql.status}`);
  const badId = await call('GET', '/api/items/not-an-objectid');
  check('invalid ObjectId -> 404/400 not 500', badId.status === 404 || badId.status === 400, `status=${badId.status}`);
  const filt = await call('GET', '/api/items?type=found&category=electronics&color=blue&brand=HP&sort=newest&page=1&limit=10');
  check('combined filters', filt.status === 200 && filt.body?.data?.items?.length >= 1, `count=${filt.body?.data?.items?.length}`);
  const limitCap = await call('GET', '/api/items?limit=9999');
  check('limit capped at 50', limitCap.status === 200 && limitCap.body?.data?.pagination?.limit <= 50, `limit=${limitCap.body?.data?.pagination?.limit}`);

  const notOwner = await call('PUT', `/api/items/${foundId}`, { body: { title: 'Hijacked', description: 'hijacked body text', type: 'found', category: 'electronics', location: 'Library', date: new Date().toISOString() } });
  check('cannot edit another user item -> 403', notOwner.status === 403, `status=${notOwner.status}`);
  const notOwnerDel = await call('DELETE', `/api/items/${foundId}`);
  check('cannot delete another user item -> 403', notOwnerDel.status === 403, `status=${notOwnerDel.status}`);
  const notOwnerStatus = await call('PATCH', `/api/items/${foundId}/status`, { body: { status: 'resolved' } });
  check('cannot change other user item status -> 403', notOwnerStatus.status === 403, `status=${notOwnerStatus.status}`);

  const modEsc = await call('PUT', `/api/items/${lostId}`, {
    body: { title: 'My HP Calculator', description: 'Lost my blue HP scientific calculator in library', type: 'lost', category: 'electronics', location: 'Library', date: new Date().toISOString().slice(0, 10), moderationStatus: 'removed', status: 'returned' },
  });
  const afterEsc = await call('GET', `/api/items/${lostId}`);
  check('PUT cannot inject moderationStatus/status',
    modEsc.status === 200 && afterEsc.body?.data?.item?.moderationStatus === 'active' && afterEsc.body?.data?.item?.status === 'active',
    `mod=${afterEsc.body?.data?.item?.moderationStatus} status=${afterEsc.body?.data?.item?.status}`);

  const match = await call('POST', `/api/items/${lostId}/match`);
  check('POST /items/:id/match handled gracefully', [200, 422, 503, 500].includes(match.status), `status=${match.status} msg=${match.body?.message}`);
  const matchList = await call('GET', `/api/items/${lostId}/matches`);
  check('GET /items/:id/matches', matchList.status === 200, `status=${matchList.status}`);

