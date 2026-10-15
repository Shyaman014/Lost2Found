/**
 * tests/items.test.js
 *
 * Tests:
 *  - Public access (GET /api/items, GET /api/items/:id without auth)
 *  - Item creation (POST /api/items — requires auth)
 *  - Item ownership (PUT/DELETE by non-owner → 403)
 *  - Privilege escalation prevention (PUT cannot inject moderationStatus/status)
 *  - Information disclosure (identifyingDetails hidden from non-owners)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { api } from './helpers/auth.js';
import { clearCollections } from './helpers/db.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const seedUser = async (email) => {
  const res = await api.post('/api/auth/register').send({
    name: 'Test User', email, password: 'Password123!', college: 'C', studentId: 'S1',
  });
  const header = res.headers['set-cookie'];
  const arr = Array.isArray(header) ? header : [header];
  const match = arr.find((c) => c.startsWith('jwt='));
  return match ? match.split(';')[0].trim() : null;
};

const baseItem = (overrides = {}) => ({
  title:       'Test Calculator',
  description: 'A scientific calculator left somewhere',
  type:        'found',
  category:    'electronics',
  location:    'Library',
  date:        '2026-10-10',
  color:       'black',
  brand:       'Casio',
  ...overrides,
});

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  await clearCollections('users', 'items', 'claims', 'conversations');
});

// ═══════════════════════════════════════════════════════════════════════════
// Public access
// ═══════════════════════════════════════════════════════════════════════════
describe('Public item access (no auth required)', () => {
  it('GET /api/items returns 200 without authentication', async () => {
    const res = await api.get('/api/items');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('GET /api/items/:id returns 200 without authentication', async () => {
    const cookie = await seedUser('pub_finder@test.com');
    const createRes = await api
      .post('/api/items')
      .set('Cookie', cookie)
      .send(baseItem());
    expect(createRes.status).toBe(201);
    const itemId = createRes.body.data._id;

    const res = await api.get(`/api/items/${itemId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.item._id).toBe(itemId);
  });

  it('GET /api/items/:id returns 404 for a non-existent item', async () => {
    const res = await api.get('/api/items/64a1b2c3d4e5f6a7b8c9d0e1');
    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Item creation
// ═══════════════════════════════════════════════════════════════════════════
describe('POST /api/items — item creation', () => {
  it('creates an item when authenticated → 201', async () => {
    const cookie = await seedUser('creator@test.com');
    const res = await api
      .post('/api/items')
      .set('Cookie', cookie)
      .send(baseItem({ type: 'lost', title: 'My Casio Calculator' }));

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('My Casio Calculator');
    expect(res.body.data.status).toBe('active');
  });

  it('rejects item creation without authentication → 401', async () => {
    const res = await api.post('/api/items').send(baseItem());
    expect(res.status).toBe(401);
  });

  it('rejects item creation with missing required fields → 400', async () => {
    const cookie = await seedUser('bad_item@test.com');
    const res = await api
      .post('/api/items')
      .set('Cookie', cookie)
      .send({ title: 'Incomplete item' }); // missing description, type, category, location, date

    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Ownership enforcement (PUT / DELETE)
// ═══════════════════════════════════════════════════════════════════════════
describe('Item ownership enforcement', () => {
  it('prevents a non-owner from editing an item → 403', async () => {
    const ownerCookie   = await seedUser('owner_e@test.com');
    const strangCookie  = await seedUser('stranger_e@test.com');

    const createRes = await api
      .post('/api/items')
      .set('Cookie', ownerCookie)
      .send(baseItem());
    const itemId = createRes.body.data._id;

    const res = await api
      .put(`/api/items/${itemId}`)
      .set('Cookie', strangCookie)
      .send({ title: 'Hijacked title' });

    expect(res.status).toBe(403);
  });

  it('prevents a non-owner from deleting an item → 403', async () => {
    const ownerCookie  = await seedUser('owner_d@test.com');
    const strangCookie = await seedUser('stranger_d@test.com');

    const createRes = await api
      .post('/api/items')
      .set('Cookie', ownerCookie)
      .send(baseItem());
    const itemId = createRes.body.data._id;

    const res = await api
      .delete(`/api/items/${itemId}`)
      .set('Cookie', strangCookie);

    expect(res.status).toBe(403);
  });

  it('allows the owner to edit their own item → 200', async () => {
    const cookie = await seedUser('owner_ok@test.com');
    const createRes = await api
      .post('/api/items')
      .set('Cookie', cookie)
      .send(baseItem());
    const itemId = createRes.body.data._id;

    const res = await api
      .put(`/api/items/${itemId}`)
      .set('Cookie', cookie)
      .send({ title: 'Updated title here', description: 'Updated description text', category: 'electronics', type: 'found', location: 'Lab', date: '2026-10-10' });

    expect(res.status).toBe(200);
    expect(res.body.data.item.title).toBe('Updated title here');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Privilege escalation prevention
// ═══════════════════════════════════════════════════════════════════════════
describe('PUT /api/items/:id — privilege escalation prevention', () => {
  it('ignores moderationStatus and status in PUT body (cannot be injected)', async () => {
    const cookie = await seedUser('priv_esc@test.com');
    const createRes = await api
      .post('/api/items')
      .set('Cookie', cookie)
      .send(baseItem({ type: 'lost', title: 'My Lost Item Escape Test' }));
    const itemId = createRes.body.data._id;

    await api
      .put(`/api/items/${itemId}`)
      .set('Cookie', cookie)
      .send({
        title:            'Escalated title item here',
        description:      'Escalated description text here long enough',
        type:             'lost',
        category:         'electronics',
        location:         'Main Hall',
        date:             '2026-10-10',
        moderationStatus: 'removed',  // should be stripped
        status:           'returned', // should be stripped
      });

    const afterRes = await api.get(`/api/items/${itemId}`);
    expect(afterRes.body.data.item.moderationStatus).toBe('active');
    expect(afterRes.body.data.item.status).toBe('active');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Information disclosure — identifyingDetails
// ═══════════════════════════════════════════════════════════════════════════
describe('identifyingDetails disclosure control', () => {
  it('owner CAN see identifyingDetails on their own found item', async () => {
    const cookie = await seedUser('owner_idd@test.com');
    const createRes = await api
      .post('/api/items')
      .set('Cookie', cookie)
      .send(baseItem({ identifyingDetails: 'Secret sticker says ALEX2024' }));
    const itemId = createRes.body.data._id;

    const res = await api.get(`/api/items/${itemId}`).set('Cookie', cookie);
    expect(res.body.data.item.identifyingDetails).toBeTruthy();
  });

  it('non-owner CANNOT see identifyingDetails on a found item', async () => {
    const ownerCookie  = await seedUser('owner_idd2@test.com');
    const otherCookie  = await seedUser('other_idd2@test.com');

    const createRes = await api
      .post('/api/items')
      .set('Cookie', ownerCookie)
      .send(baseItem({ identifyingDetails: 'Secret sticker says ALEX2024' }));
    const itemId = createRes.body.data._id;

    const res = await api.get(`/api/items/${itemId}`).set('Cookie', otherCookie);
    expect(res.body.data.item.identifyingDetails).toBeFalsy();
  });

  it('unauthenticated user CANNOT see identifyingDetails on a found item', async () => {
    const ownerCookie = await seedUser('owner_idd3@test.com');
    const createRes = await api
      .post('/api/items')
      .set('Cookie', ownerCookie)
      .send(baseItem({ identifyingDetails: 'Secret sticker says ALEX2024' }));
    const itemId = createRes.body.data._id;

    const res = await api.get(`/api/items/${itemId}`);
    expect(res.body.data.item.identifyingDetails).toBeFalsy();
  });

  it('public item listing omits identifyingDetails for all callers', async () => {
    const ownerCookie = await seedUser('owner_idd4@test.com');
    await api
      .post('/api/items')
      .set('Cookie', ownerCookie)
      .send(baseItem({ identifyingDetails: 'Secret sticker says ALEX2024', title: 'IDD Search Item' }));

    const listRes = await api.get('/api/items?search=IDD+Search');
    const items = listRes.body.data.items ?? [];
    items.forEach((item) => {
      expect(item.identifyingDetails).toBeFalsy();
    });
  });
});
