/**
 * tests/helpers/auth.js
 * Supertest helpers for authentication flows.
 */
import request from 'supertest';
import app from '../../app.js';

export const api = request(app);

/**
 * Extract the "jwt=TOKEN" value from a Supertest response's Set-Cookie header.
 * Returns a string suitable for use with .set('Cookie', cookie).
 */
export const extractCookie = (res) => {
  const header = res.headers['set-cookie'];
  if (!header) return null;
  const cookies = Array.isArray(header) ? header : [header];
  const match = cookies.find((c) => c.startsWith('jwt='));
  return match ? match.split(';')[0].trim() : null; // "jwt=TOKEN"
};

/**
 * Register a user. Sensible defaults are provided so callers only need
 * to supply the fields they care about.
 */
export const register = (overrides = {}) => {
  const body = {
    name:      'Test User',
    email:     `user_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`,
    password:  'Password123!',
    college:   'Test College',
    studentId: 'T001',
    ...overrides,
  };
  return api.post('/api/auth/register').send(body).then((res) => ({
    res,
    body,
    cookie: extractCookie(res),
  }));
};

/**
 * Login with email + password. Returns { res, cookie }.
 */
export const login = (email, password) =>
  api
    .post('/api/auth/login')
    .send({ email, password })
    .then((res) => ({ res, cookie: extractCookie(res) }));

/**
 * Register then immediately login.  Returns the cookie + user data.
 */
export const registerAndLogin = async (overrides = {}) => {
  const { res, body } = await register(overrides);
  expect(res.status).toBe(201); // guard
  const { cookie } = await login(body.email, body.password);
  return { cookie, email: body.email, password: body.password };
};

/**
 * Make an authenticated request using a cookie string.
 */
export const authed = (method, path, cookie) =>
  api[method](path).set('Cookie', cookie ?? '');
