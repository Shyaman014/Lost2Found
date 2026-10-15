/**
 * tests/auth.test.js
 *
 * Tests:
 *  - POST /api/auth/register
 *  - POST /api/auth/login
 *  - GET  /api/auth/me
 *  - POST /api/auth/logout
 *  - Role-based access control (admin vs student vs unauthenticated)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { api, register, login, extractCookie, authed } from './helpers/auth.js';
import { clearCollections } from './helpers/db.js';

beforeEach(async () => {
  await clearCollections('users', 'items', 'claims', 'conversations');
});

// ═══════════════════════════════════════════════════════════════════════════
// Registration
// ═══════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/register', () => {
  it('registers a new user and returns 201 with user data', async () => {
    const { res } = await register({ name: 'Alice', email: 'alice@test.com', password: 'Password123!' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({
      name:  'Alice',
      email: 'alice@test.com',
      role:  'student',
    });
  });

  it('sets an HttpOnly jwt cookie on successful registration', async () => {
    const { res, cookie } = await register({ email: 'alice2@test.com' });

    expect(res.status).toBe(201);
    expect(cookie).toBeTruthy();
    expect(cookie).toMatch(/^jwt=.+/);
    // Verify the Set-Cookie header includes HttpOnly
    const raw = res.headers['set-cookie'];
    const jwtHeader = (Array.isArray(raw) ? raw : [raw]).find((c) => c.startsWith('jwt='));
    expect(jwtHeader).toMatch(/HttpOnly/i);
  });

  it('never returns the password hash in the response body', async () => {
    const { res } = await register({ email: 'alice3@test.com' });

    expect(res.status).toBe(201);
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/\$2[aby]\$/); // bcrypt hash pattern
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await api.post('/api/auth/register').send({ email: 'no-name@test.com', password: 'Password123!' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 409 for a duplicate email', async () => {
    await register({ email: 'dup@test.com' });
    const { res } = await register({ email: 'dup@test.com' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('forces role to "student" regardless of body payload', async () => {
    const { res } = await register({ email: 'mallory@test.com', role: 'admin' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('student');
    // Verify in DB too
    const dbUser = await User.findOne({ email: 'mallory@test.com' });
    expect(dbUser.role).toBe('student');
  });

  it('normalises email to lowercase', async () => {
    const { res } = await register({ email: 'UPPER@TEST.COM' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('upper@test.com');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Login
// ═══════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/login', () => {
  const EMAIL    = 'login_test@test.com';
  const PASSWORD = 'Password123!';

  beforeEach(async () => {
    await register({ email: EMAIL, password: PASSWORD });
  });

  it('returns 200 and a jwt cookie for valid credentials', async () => {
    const { res, cookie } = await login(EMAIL, PASSWORD);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(cookie).toBeTruthy();
  });

  it('returns 401 for a wrong password', async () => {
    const { res } = await login(EMAIL, 'WrongPassword!');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for a non-existent email', async () => {
    const { res } = await login('nobody@test.com', PASSWORD);
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing credentials', async () => {
    const res = await api.post('/api/auth/login').send({ email: EMAIL });
    expect(res.status).toBe(400);
  });

  it('returns 401 for an inactive (banned) account', async () => {
    await User.findOneAndUpdate({ email: EMAIL }, { isActive: false });
    const { res } = await login(EMAIL, PASSWORD);
    expect(res.status).toBe(401);
  });

  it('never returns the password hash in the login response', async () => {
    const { res } = await login(EMAIL, PASSWORD);
    expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/auth/me  — Authentication middleware
// ═══════════════════════════════════════════════════════════════════════════
describe('GET /api/auth/me', () => {
  it('returns the current user for a valid jwt cookie', async () => {
    const { res: regRes, cookie } = await register({ email: 'me_test@test.com' });
    expect(regRes.status).toBe(201);

    const res = await authed('get', '/api/auth/me', cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('me_test@test.com');
  });

  it('returns 401 when no cookie is provided', async () => {
    const res = await api.get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 for a tampered/invalid token', async () => {
    const res = await api
      .get('/api/auth/me')
      .set('Cookie', 'jwt=this.is.not.a.valid.token');
    expect(res.status).toBe(401);
  });

  it('returns 401 for a token signed with a wrong secret', async () => {
    const badToken = jwt.sign({ userId: 'fakeid', role: 'student' }, 'wrong_secret');
    const res = await api.get('/api/auth/me').set('Cookie', `jwt=${badToken}`);
    expect(res.status).toBe(401);
  });

  it('returns 401 for an inactive user with a valid token', async () => {
    const { res: regRes, body, cookie } = await register({ email: 'inactive_me@test.com' });
    expect(regRes.status).toBe(201);
    await User.findOneAndUpdate({ email: body.email }, { isActive: false });

    const res = await authed('get', '/api/auth/me', cookie);
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/auth/logout
// ═══════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/logout', () => {
  it('returns 200 and clears the jwt cookie', async () => {
    const { cookie } = await register({ email: 'logout@test.com' });
    expect(cookie).toBeTruthy();

    const res = await api.post('/api/auth/logout').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // The Set-Cookie header should expire / blank the jwt cookie
    const setCookie = res.headers['set-cookie'];
    const cleared = (Array.isArray(setCookie) ? setCookie : [setCookie]).find((c) =>
      c.startsWith('jwt=')
    );
    expect(cleared).toBeTruthy();
    // Either the value is empty or expires is in the past
    expect(cleared).toMatch(/jwt=;|expires=Thu, 01 Jan 1970/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Role-based access control
// ═══════════════════════════════════════════════════════════════════════════
describe('Role-based access control', () => {
  it('blocks unauthenticated requests from protected routes → 401', async () => {
    const res = await api.get('/api/admin/dashboard/stats');
    expect(res.status).toBe(401);
  });

  it('blocks students from admin routes → 403', async () => {
    const { cookie } = await register({ email: 'student_rbac@test.com' });
    const res = await authed('get', '/api/admin/dashboard/stats', cookie);
    expect(res.status).toBe(403);
  });

  it('allows admin users to access admin routes → 200', async () => {
    // Admins can only be created directly in the DB (role is forced to student via register)
    const admin = await User.create({
      name:     'Admin User',
      email:    'admin_rbac@test.com',
      password: 'Password123!',
      role:     'admin',
      isActive: true,
    });
    const token = jwt.sign(
      { userId: admin._id.toString(), role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await api
      .get('/api/admin/dashboard/stats')
      .set('Cookie', `jwt=${token}`);

    expect(res.status).toBe(200);
  });

  it('blocks a student from accessing /api/claims/my without auth → 401', async () => {
    const res = await api.get('/api/claims/my');
    expect(res.status).toBe(401);
  });

  it('allows an authenticated student to access /api/claims/my → 200', async () => {
    const { cookie } = await register({ email: 'student_claims@test.com' });
    const res = await authed('get', '/api/claims/my', cookie);
    expect(res.status).toBe(200);
  });
});
