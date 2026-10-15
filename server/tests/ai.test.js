/**
 * tests/ai.test.js
 *
 * Tests for POST /api/ai/chat.
 * Gemini API key is set to a placeholder in .env.test, so all calls
 * exercise the graceful-fallback path — no real Gemini calls are made.
 *
 * Tests:
 *  - Authentication guard (401 without token)
 *  - Input validation (empty, too-long, non-string message; non-array history)
 *  - Valid request → 200, reply is a string, fallback flag is boolean
 *  - Multi-turn history accepted
 *  - Exact 500-char boundary accepted
 *  - Inactive user rejected by protect middleware
 */

import { describe, it, expect, beforeEach } from 'vitest';
import User from '../models/User.js';
import { api } from './helpers/auth.js';
import { clearCollections } from './helpers/db.js';

// ── Helper: register a student and return their jwt cookie ────────────────────
const seedUser = async (email) => {
  const res = await api.post('/api/auth/register').send({
    name: 'AI Tester', email, password: 'Password123!', college: 'C', studentId: 'A1',
  });
  const header = res.headers['set-cookie'];
  const arr = Array.isArray(header) ? header : [header];
  const match = arr.find((c) => c.startsWith('jwt='));
  return match ? match.split(';')[0].trim() : null;
};

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  await clearCollections('users', 'items');
});

// ═══════════════════════════════════════════════════════════════════════════
// Auth guard
// ═══════════════════════════════════════════════════════════════════════════
describe('POST /api/ai/chat — auth guard', () => {
  it('returns 401 when no cookie is provided', async () => {
    const res = await api.post('/api/ai/chat').send({ message: 'hello' });
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Input validation
// ═══════════════════════════════════════════════════════════════════════════
describe('POST /api/ai/chat — input validation', () => {
  it('returns 400 for an empty message', async () => {
    const cookie = await seedUser('ai_empty@test.com');
    const res = await api.post('/api/ai/chat').set('Cookie', cookie).send({ message: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when message field is missing', async () => {
    const cookie = await seedUser('ai_missing@test.com');
    const res = await api.post('/api/ai/chat').set('Cookie', cookie).send({});

    expect(res.status).toBe(400);
  });

  it('returns 400 for a message longer than 500 characters', async () => {
    const cookie = await seedUser('ai_long@test.com');
    const res = await api
      .post('/api/ai/chat')
      .set('Cookie', cookie)
      .send({ message: 'A'.repeat(501) });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/500/);
  });

  it('accepts a message that is exactly 500 characters → 200', async () => {
    const cookie = await seedUser('ai_exact@test.com');
    const res = await api
      .post('/api/ai/chat')
      .set('Cookie', cookie)
      .send({ message: 'B'.repeat(500) });

    expect(res.status).toBe(200);
  });

  it('returns 400 for a non-string message (number)', async () => {
    const cookie = await seedUser('ai_num@test.com');
    const res = await api
      .post('/api/ai/chat')
      .set('Cookie', cookie)
      .send({ message: 12345 });

    expect(res.status).toBe(400);
  });

  it('returns 400 for a non-array history', async () => {
    const cookie = await seedUser('ai_hist@test.com');
    const res = await api
      .post('/api/ai/chat')
      .set('Cookie', cookie)
      .send({ message: 'hello', history: 'bad history value' });

    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Valid requests (with fallback mode — no real Gemini key)
// ═══════════════════════════════════════════════════════════════════════════
describe('POST /api/ai/chat — valid requests (fallback mode)', () => {
  it('returns 200 with a non-empty string reply', async () => {
    const cookie = await seedUser('ai_valid@test.com');
    const res = await api
      .post('/api/ai/chat')
      .set('Cookie', cookie)
      .send({ message: 'hello' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.reply).toBe('string');
    expect(res.body.data.reply.length).toBeGreaterThan(0);
  });

  it('response includes a boolean `fallback` field', async () => {
    const cookie = await seedUser('ai_fallback@test.com');
    const res = await api
      .post('/api/ai/chat')
      .set('Cookie', cookie)
      .send({ message: 'lost my phone' });

    expect(res.status).toBe(200);
    expect(typeof res.body.data.fallback).toBe('boolean');
  });

  it('accepts valid multi-turn history without error → 200', async () => {
    const cookie = await seedUser('ai_history@test.com');
    const history = [
      { role: 'ai',   text: 'Hi! How can I help?' },
      { role: 'user', text: 'I lost my phone.' },
      { role: 'ai',   text: 'What kind of phone?' },
    ];

    const res = await api
      .post('/api/ai/chat')
      .set('Cookie', cookie)
      .send({ message: 'An iPhone 13', history });

    expect(res.status).toBe(200);
    expect(typeof res.body.data.reply).toBe('string');
  });

  it('handles an oversized history by trimming silently → 200', async () => {
    const cookie = await seedUser('ai_bighistory@test.com');
    const history = Array.from({ length: 50 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'ai',
      text: `Message number ${i} here`,
    }));

    const res = await api
      .post('/api/ai/chat')
      .set('Cookie', cookie)
      .send({ message: 'Are there any wallets found?', history });

    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Inactive user
// ═══════════════════════════════════════════════════════════════════════════
describe('POST /api/ai/chat — inactive user', () => {
  it('returns 401 for an inactive account with a valid token', async () => {
    const cookie = await seedUser('ai_inactive@test.com');

    // Deactivate the user
    await User.findOneAndUpdate({ email: 'ai_inactive@test.com' }, { isActive: false });

    const res = await api
      .post('/api/ai/chat')
      .set('Cookie', cookie)
      .send({ message: 'hello' });

    expect(res.status).toBe(401);
  });
});
