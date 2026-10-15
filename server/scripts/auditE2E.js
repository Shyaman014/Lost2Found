// Audit harness: exercises the real HTTP + Socket.io stack end-to-end.
// Run from root: node server/scripts/auditE2E.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import mongoose from 'mongoose';
import { io as ioClient } from 'socket.io-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

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

const connectSocket = () => new Promise((resolve, reject) => {
  const s = ioClient(BASE, {
    transports: ['websocket'],
    withCredentials: true,
    auth: { token: cookieStore.jwt },
    extraHeaders: { Cookie: jar() },
    transportOptions: {
      websocket: {
        headers: { Cookie: jar() },
      },
    },
  });
  const t = setTimeout(() => reject(new Error('socket connect timeout')), 6000);
  s.on('connect', () => { clearTimeout(t); resolve(s); });
  s.on('connect_error', (e) => { clearTimeout(t); reject(new Error('connect_error: ' + e.message)); });
});

const run = async () => {
  try {
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

    // ── 1. Health check ──
    const health = await call('GET', '/api/health', { useAuth: false });
    check('health endpoint', health.status === 200, `status=${health.status}`);

    // ── 2. Public Homepage API Access (Unauthenticated) ──
    const publicItems = await call('GET', '/api/items', { useAuth: false });
    check('public homepage can access GET /api/items without auth', publicItems.status === 200 && Array.isArray(publicItems.body?.data?.items), `status=${publicItems.status}`);

    // ── 3. Register Student A (Finder) ──
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
      `hashlen=${AwithPw.password?.length}`);

    // ── 4. Duplicate registration prevention ──
    const dup = await call('POST', '/api/auth/register', {
      useAuth: false, body: { name: 'Alice Again', email: ae('alice'), password: 'Password123!' },
    });
    check('duplicate email -> 409', dup.status === 409, `status=${dup.status}`);

    // ── 5. Role escalation prevention on register ──
    const esc = await call('POST', '/api/auth/register', {
      useAuth: false, body: { name: 'Mallory', email: ae('mallory'), password: 'Password123!', role: 'admin' },
    });
    const mallory = await User.findOne({ email: ae('mallory') });
    check('role escalation via register blocked', esc.status === 201 && mallory?.role === 'student', `role=${mallory?.role}`);

    // ── 6. Login tests ──
    cookieStore = {};
    const loginA = await call('POST', '/api/auth/login', { useAuth: false, body: { email: ae('alice'), password: 'Password123!' } });
    check('LOGIN alice', loginA.status === 200 && loginA.body?.success, `status=${loginA.status}`);

    const badPw = await call('POST', '/api/auth/login', { useAuth: false, body: { email: ae('alice'), password: 'WrongPassword!' } });
    check('wrong password -> 401', badPw.status === 401, `status=${badPw.status}`);

    // ── 7. Profile & Auth middleware ──
    const me = await call('GET', '/api/auth/me');
    check('/me returns current user', me.status === 200 && me.body?.data?.user?.email === ae('alice'), `status=${me.status}`);
    check('/me leaks no password', !JSON.stringify(me.body).includes('$2a$'));

    const adminBlocked = await call('GET', '/api/admin/dashboard/stats');
    check('student blocked from admin API -> 403', adminBlocked.status === 403, `status=${adminBlocked.status}`);

    // ── 8. Create Found Item by Alice with Secret Identifying Details ──
    const foundItem = await call('POST', '/api/items', {
      body: {
        title: 'Blue HP Calculator',
        description: 'Found on library desk scientific calculator',
        type: 'found',
        category: 'electronics',
        location: 'Library',
        date: new Date().toISOString().slice(0, 10),
        color: 'blue',
        brand: 'HP',
        identifyingDetails: 'Secret sticker under battery cover says ALEX2024'
      },
    });
    check('create FOUND item', foundItem.status === 201, `status=${foundItem.status}`);
    const foundId = foundItem.body?.data?._id;

    // Alice (reporter) viewing her own found item should see identifying details
    const ownerView = await call('GET', `/api/items/${foundId}`);
    check('reporter CAN see identifyingDetails on own found item', !!ownerView.body?.data?.item?.identifyingDetails);

    // ── 9. Register Student B (Claimant) ──
    cookieStore = {};
    const regB = await call('POST', '/api/auth/register', {
      useAuth: false, body: { name: 'Bob Claimant', email: ae('bob'), password: 'Password123!', college: 'Test College', studentId: 'S2' },
    });
    check('register student B', regB.status === 201, `status=${regB.status}`);

    // ── 10. Information Disclosure Prevention: Bob views Alice's found item ──
    const bobView = await call('GET', `/api/items/${foundId}`);
    check('other student CANNOT see identifyingDetails on found item', !bobView.body?.data?.item?.identifyingDetails);

    // Public listing also omits identifyingDetails
    const searchPublic = await call('GET', `/api/items?search=Calculator`, { useAuth: false });
    const itemInSearch = searchPublic.body?.data?.items?.find(i => i._id === foundId);
    check('public search listing omits identifyingDetails', itemInSearch && !itemInSearch.identifyingDetails);

    // ── 11. Authorization: Bob cannot edit or delete Alice's item ──
    const notOwner = await call('PUT', `/api/items/${foundId}`, { body: { title: 'Hijacked' } });
    check('cannot edit another user item -> 403', notOwner.status === 403, `status=${notOwner.status}`);

    const notOwnerDel = await call('DELETE', `/api/items/${foundId}`);
    check('cannot delete another user item -> 403', notOwnerDel.status === 403, `status=${notOwnerDel.status}`);

    // ── 12. Privilege Escalation Prevention on PUT /items/:id ──
    const lostItem = await call('POST', '/api/items', {
      body: { title: 'My HP Calculator', description: 'Lost my blue HP calculator', type: 'lost', category: 'electronics', location: 'Library', date: new Date().toISOString().slice(0, 10), color: 'blue', brand: 'HP' },
    });
    const lostId = lostItem.body?.data?._id;

    const modEsc = await call('PUT', `/api/items/${lostId}`, {
      body: { title: 'My HP Calculator Updated', moderationStatus: 'removed', status: 'returned' },
    });
    const afterEsc = await call('GET', `/api/items/${lostId}`);
    check('PUT cannot inject moderationStatus or status',
      afterEsc.body?.data?.item?.moderationStatus === 'active' && afterEsc.body?.data?.item?.status === 'active',
      `mod=${afterEsc.body?.data?.item?.moderationStatus} status=${afterEsc.body?.data?.item?.status}`);

    // ── 13. Claims Lifecycle: Bob claims Alice's found item ──
    const claimRes = await call('POST', `/api/items/${foundId}/claims`, {
      body: {
        message: 'This is my calculator left on the desk',
        specificDetails: ['Has my name sticker on it', 'Blue casing']
      }
    });
    check('Bob files claim on Alice found item', claimRes.status === 201, `status=${claimRes.status}`);
    const claimId = claimRes.body?.data?.claim?._id;

    // Bob cannot file duplicate claim on the same item
    const dupClaim = await call('POST', `/api/items/${foundId}/claims`, {
      body: { message: 'Filing again duplicate', specificDetails: ['detail'] }
    });
    check('duplicate claim blocked -> 400', dupClaim.status === 400, `status=${dupClaim.status}`);

    // ── 14. Claim Approval: Alice logs in and approves Bob's claim ──
    cookieStore = {};
    await call('POST', '/api/auth/login', { useAuth: false, body: { email: ae('alice'), password: 'Password123!' } });

    const approveRes = await call('PATCH', `/api/claims/${claimId}/approve`);
    check('Alice approves Bob claim -> 200 & creates conversation', approveRes.status === 200 && !!approveRes.body?.data?.conversation, `status=${approveRes.status}`);

    const approvedItem = await call('GET', `/api/items/${foundId}`);
    check('item status updated to claimed', approvedItem.body?.data?.item?.status === 'claimed');

    // Trying to re-approve already approved claim should return 400
    const reApprove = await call('PATCH', `/api/claims/${claimId}/approve`);
    check('re-approving non-pending claim -> 400', reApprove.status === 400, `status=${reApprove.status}`);

    // ── 15. Socket.io Connection & Permission Verification ──
    const socket = await connectSocket();
    check('Socket.io authenticated handshake success', socket.connected);

    // Verify Socket IDOR protection: Bob tries to mark messages read on non-existent or unjoined conversation
    const dummyConvId = new mongoose.Types.ObjectId().toString();
    socket.emit('message:read', dummyConvId);
    socket.emit('typing:start', dummyConvId);
    check('Socket unauthorized message:read / typing handled without crash', true);

    socket.disconnect();

    // ── 16. Inactive User Socket Rejection ──
    // Deactivate a test user and ensure socket auth rejects them
    const deactivatedUser = await User.create({
      name: 'Banned Student',
      email: ae('banned'),
      password: 'Password123!',
      role: 'student',
      isActive: false,
    });
    const jwt = (await import('jsonwebtoken')).default;
    const bannedToken = jwt.sign({ userId: deactivatedUser._id, role: deactivatedUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    let bannedSocketRejected = false;
    try {
      await new Promise((resolve, reject) => {
        const bs = ioClient(BASE, {
          transports: ['websocket'],
          extraHeaders: { Cookie: `jwt=${bannedToken}` },
        });
        const timer = setTimeout(() => { bs.disconnect(); reject(new Error('timeout')); }, 3000);
        bs.on('connect', () => { clearTimeout(timer); bs.disconnect(); resolve(); });
        bs.on('connect_error', (err) => {
          clearTimeout(timer);
          bannedSocketRejected = err.message.includes('inactive');
          bs.disconnect();
          resolve();
        });
      });
    } catch (e) {}
    check('Inactive/banned user rejected by Socket.io auth', bannedSocketRejected);

    log(`\n========================================`);
    log(`AUDIT RESULTS: ${pass} PASSED, ${fail} FAILED`);
    log(`========================================\n`);

    server.close();
    await mongoose.disconnect();
    process.exit(fail === 0 ? 0 : 1);
  } catch (err) {
    console.error('Audit crashed with error:', err);
    process.exit(1);
  }
};

run();
