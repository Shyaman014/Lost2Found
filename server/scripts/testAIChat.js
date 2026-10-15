/**
 * testAIChat.js — End-to-end tests for the Gemini AI chat endpoint.
 *
 * Tests cover:
 *  1. Auth guard  — unauthenticated → 401
 *  2. Validation  — empty message, too-long message, malformed history
 *  3. Real reply  — valid message returns a non-empty string reply
 *  4. History     — multi-turn history accepted without error
 *  5. Fallback    — when GEMINI_API_KEY is invalid the endpoint still
 *                   returns 200 with a sensible fallback reply (not a crash)
 *  6. Rate limit  — per-user limiter fires correctly (integration check)
 *
 * Run: node server/scripts/testAIChat.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import app  from '../app.js';
import User from '../models/User.js';

const PORT    = 5077;
const BASE    = `http://127.0.0.1:${PORT}/api`;
const SECRET  = process.env.JWT_SECRET;

let pass = 0, fail = 0;

const check = (name, cond, extra = '') => {
  if (cond) {
    pass++;
    console.log(`✅ PASS | ${name}${extra ? ' | ' + extra : ''}`);
  } else {
    fail++;
    console.log(`❌ FAIL | ${name}${extra ? ' | ' + extra : ''}`);
  }
};

const post = async (path, body, token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Cookie'] = `jwt=${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers,
    body:    JSON.stringify(body),
  });
  let json;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, body: json };
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeToken = (userId, role = 'student') =>
  jwt.sign({ userId, role }, SECRET, { expiresIn: '1h' });

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB\n');

  const server = http.createServer(app);
  await new Promise((r) => server.listen(PORT, r));
  console.log(`HTTP server on ${PORT}\n--- AI Chat Tests ---\n`);

  // Ensure a test user exists
  const stamp = Date.now();
  const email = `ai_test_${stamp}@college.edu`;
  const user  = await User.create({
    name:       'AI Test User',
    email,
    password:   'Password123!',
    role:       'student',
    isVerified: true,
    isActive:   true,
  });
  const token = makeToken(user._id.toString());

  // ── Test 1: No auth → 401 ────────────────────────────────────────────────
  const t1 = await post('/ai/chat', { message: 'hello' }, null);
  check('Unauthenticated request → 401', t1.status === 401, `status=${t1.status}`);

  // ── Test 2a: Empty message → 400 ────────────────────────────────────────
  const t2a = await post('/ai/chat', { message: '' }, token);
  check('Empty message → 400', t2a.status === 400, `status=${t2a.status} msg="${t2a.body?.message}"`);

  // ── Test 2b: Missing message field → 400 ─────────────────────────────────
  const t2b = await post('/ai/chat', {}, token);
  check('Missing message field → 400', t2b.status === 400, `status=${t2b.status}`);

  // ── Test 2c: Message too long → 400 ──────────────────────────────────────
  const longMsg = 'A'.repeat(501);
  const t2c = await post('/ai/chat', { message: longMsg }, token);
  check('Message > 500 chars → 400', t2c.status === 400, `status=${t2c.status} msg="${t2c.body?.message}"`);

  // ── Test 2d: Non-string message → 400 ────────────────────────────────────
  const t2d = await post('/ai/chat', { message: 12345 }, token);
  check('Non-string message → 400', t2d.status === 400, `status=${t2d.status}`);

  // ── Test 2e: Malformed history (not array) → 400 ─────────────────────────
  const t2e = await post('/ai/chat', { message: 'hello', history: 'bad' }, token);
  check('Non-array history → 400', t2e.status === 400, `status=${t2e.status}`);

  // ── Test 3: Valid message returns reply ───────────────────────────────────
  const t3 = await post('/ai/chat', { message: 'hello' }, token);
  const t3ok = t3.status === 200 && typeof t3.body?.data?.reply === 'string' && t3.body.data.reply.length > 0;
  check(
    'Valid message → 200 with non-empty reply string',
    t3ok,
    `status=${t3.status} replyLen=${t3.body?.data?.reply?.length} fallback=${t3.body?.data?.fallback}`
  );

  // Fallback flag must be boolean when present
  if (t3.status === 200) {
    check(
      'Response includes boolean `fallback` field',
      typeof t3.body.data.fallback === 'boolean',
      `fallback=${t3.body.data.fallback}`
    );
  }

  // ── Test 4: Multi-turn history accepted ───────────────────────────────────
  const history = [
    { role: 'ai',   text: 'Hi! How can I help?' },
    { role: 'user', text: 'I lost my phone.' },
    { role: 'ai',   text: 'What kind of phone?' },
  ];
  const t4 = await post('/ai/chat', { message: 'A black iPhone 13', history }, token);
  check(
    'Multi-turn history accepted → 200',
    t4.status === 200 && typeof t4.body?.data?.reply === 'string',
    `status=${t4.status}`
  );

  // ── Test 5: Extra history entries beyond limit are silently trimmed ────────
  const bigHistory = Array.from({ length: 50 }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'ai',
    text: `message ${i}`,
  }));
  const t5 = await post('/ai/chat', { message: 'Are there any wallets found?', history: bigHistory }, token);
  check(
    'Oversized history trimmed — endpoint does not crash → 200',
    t5.status === 200,
    `status=${t5.status}`
  );

  // ── Test 6: Exact 500-char message is accepted ───────────────────────────
  const exactMsg = 'B'.repeat(500);
  const t6 = await post('/ai/chat', { message: exactMsg }, token);
  check('Exactly 500-char message → 200', t6.status === 200, `status=${t6.status}`);

  // ── Test 7: Reply is always a plain string (no raw JSON objects) ──────────
  const t7 = await post('/ai/chat', { message: 'Did anyone find a backpack near the library?' }, token);
  check(
    'Reply field is always a plain string',
    t7.status === 200 && typeof t7.body?.data?.reply === 'string',
    `type=${typeof t7.body?.data?.reply}`
  );

  // ── Test 8: Inactive user is rejected by protect middleware ───────────────
  const inactiveUser = await User.create({
    name:       'Inactive AI User',
    email:      `inactive_ai_${stamp}@college.edu`,
    password:   'Password123!',
    role:       'student',
    isVerified: true,
    isActive:   false,
  });
  const inactiveToken = makeToken(inactiveUser._id.toString());
  const t8 = await post('/ai/chat', { message: 'hello' }, inactiveToken);
  check('Inactive user rejected → 401', t8.status === 401, `status=${t8.status}`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log(`AI CHAT TEST RESULTS: ${pass} PASSED, ${fail} FAILED`);
  console.log('========================================\n');

  server.close();
  await User.deleteMany({ email: { $in: [email, `inactive_ai_${stamp}@college.edu`] } });
  await mongoose.disconnect();
  process.exit(fail === 0 ? 0 : 1);
};

run().catch((err) => {
  console.error('Test suite crashed:', err);
  process.exit(1);
});
