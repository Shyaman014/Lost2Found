/**
 * tests/claims.test.js
 *
 * Tests:
 *  - Full claim lifecycle (create → approve → rival rejection → conversation)
 *  - Duplicate claim prevention
 *  - Self-claim prevention (finder can't claim own item)
 *  - Authorization: only the finder can approve/reject claims for their item
 *  - Claim cancellation
 *  - GET /api/claims/my (authenticated, returns only own claims)
 *  - Re-approve already-approved claim → 400
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { api, register, login, authed } from './helpers/auth.js';
import { clearCollections } from './helpers/db.js';

// ── Seed helpers ─────────────────────────────────────────────────────────────

/** Register a user and return their jwt cookie */
const seedUser = async (email, extra = {}) => {
  const res = await api.post('/api/auth/register').send({
    name: 'Test User', email, password: 'Password123!', college: 'C', studentId: 'S1', ...extra,
  });
  const header = res.headers['set-cookie'];
  const arr = Array.isArray(header) ? header : [header];
  const match = arr.find((c) => c.startsWith('jwt='));
  return match ? match.split(';')[0].trim() : null;
};

/** Create a FOUND item as the given user; returns the item ID */
const seedFoundItem = async (cookie) => {
  const res = await api
    .post('/api/items')
    .set('Cookie', cookie)
    .send({
      title:       'Blue HP Calculator',
      description: 'Found on library desk',
      type:        'found',
      category:    'electronics',
      location:    'Library',
      date:        '2026-10-10',
    });
  expect(res.status).toBe(201);
  return res.body.data._id;
};

/** File a claim on foundItemId as the given user; returns the claim ID */
const seedClaim = async (cookie, foundItemId) => {
  const res = await api
    .post(`/api/items/${foundItemId}/claims`)
    .set('Cookie', cookie)
    .send({
      message:        'This is my calculator, I left it on the desk.',
      specificDetails: ['Has my name sticker'],
    });
  expect(res.status).toBe(201);
  return res.body.data.claim._id;
};

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  await clearCollections('users', 'items', 'claims', 'conversations', 'notifications');
});

// ═══════════════════════════════════════════════════════════════════════════
// Claim creation
// ═══════════════════════════════════════════════════════════════════════════
describe('POST /api/items/:id/claims — claim creation', () => {
  it('allows a claimant to file a claim on a found item → 201', async () => {
    const finderCookie   = await seedUser('finder@test.com');
    const claimantCookie = await seedUser('claimant@test.com');
    const foundId        = await seedFoundItem(finderCookie);

    const res = await api
      .post(`/api/items/${foundId}/claims`)
      .set('Cookie', claimantCookie)
      .send({ message: 'This is definitely mine, I dropped it.', specificDetails: ['Has scratch'] });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.claim.status).toBe('pending');
  });

  it('prevents duplicate claims from the same user → 400', async () => {
    const finderCookie   = await seedUser('finder2@test.com');
    const claimantCookie = await seedUser('claimant2@test.com');
    const foundId        = await seedFoundItem(finderCookie);
    await seedClaim(claimantCookie, foundId);

    const res = await api
      .post(`/api/items/${foundId}/claims`)
      .set('Cookie', claimantCookie)
      .send({ message: 'Filing again duplicate claim attempt.', specificDetails: ['Same detail'] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('prevents the item reporter from claiming their own item → 403', async () => {
    const finderCookie = await seedUser('self_claim@test.com');
    const foundId      = await seedFoundItem(finderCookie);

    const res = await api
      .post(`/api/items/${foundId}/claims`)
      .set('Cookie', finderCookie)
      .send({ message: 'Trying to claim my own item self claim.', specificDetails: ['Detail'] });

    expect(res.status).toBe(403);
  });

  it('rejects unauthenticated claim attempts → 401', async () => {
    const finderCookie = await seedUser('finder3@test.com');
    const foundId      = await seedFoundItem(finderCookie);

    const res = await api
      .post(`/api/items/${foundId}/claims`)
      .send({ message: 'No auth claim attempt made by nobody.', specificDetails: ['x'] });

    expect(res.status).toBe(401);
  });

  it('rejects a claim on a non-existent item → 404', async () => {
    const claimantCookie = await seedUser('claimant3@test.com');
    const fakeId         = '64a1b2c3d4e5f6a7b8c9d0e1'; // valid ObjectId, does not exist

    const res = await api
      .post(`/api/items/${fakeId}/claims`)
      .set('Cookie', claimantCookie)
      .send({ message: 'Claiming a nonexistent item here please.', specificDetails: ['d'] });

    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Claim approval
// ═══════════════════════════════════════════════════════════════════════════
describe('PATCH /api/claims/:id/approve — claim approval', () => {
  it('finder approves a claim → 200, conversation created, item status = claimed', async () => {
    const finderCookie   = await seedUser('finder_a@test.com');
    const claimantCookie = await seedUser('claimant_a@test.com');
    const foundId        = await seedFoundItem(finderCookie);
    const claimId        = await seedClaim(claimantCookie, foundId);

    const res = await api
      .patch(`/api/claims/${claimId}/approve`)
      .set('Cookie', finderCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.claim.status).toBe('approved');
    expect(res.body.data.conversation).toBeDefined();
    expect(res.body.data.conversation._id).toBeTruthy();

    // Item should now be marked as 'claimed'
    const itemRes = await api.get(`/api/items/${foundId}`);
    expect(itemRes.body.data.item.status).toBe('claimed');
  });

  it('rejects all other pending claims when one is approved', async () => {
    const finderCookie    = await seedUser('finder_b@test.com');
    const claimant1Cookie = await seedUser('claimant_b1@test.com');
    const claimant2Cookie = await seedUser('claimant_b2@test.com');
    const foundId         = await seedFoundItem(finderCookie);

    const claim1Id = await seedClaim(claimant1Cookie, foundId);
    const claim2Id = await seedClaim(claimant2Cookie, foundId);

    // Approve claim 1
    const approveRes = await api
      .patch(`/api/claims/${claim1Id}/approve`)
      .set('Cookie', finderCookie);
    expect(approveRes.status).toBe(200);

    // Claim 2 should now be rejected
    const claim2Res = await api
      .get('/api/claims/my')
      .set('Cookie', claimant2Cookie);
    expect(claim2Res.status).toBe(200);
    const c2 = claim2Res.body.data.claims.find((c) => c._id === claim2Id);
    expect(c2.status).toBe('rejected');
  });

  it('prevents re-approving an already-approved claim → 400', async () => {
    const finderCookie   = await seedUser('finder_c@test.com');
    const claimantCookie = await seedUser('claimant_c@test.com');
    const foundId        = await seedFoundItem(finderCookie);
    const claimId        = await seedClaim(claimantCookie, foundId);

    await api.patch(`/api/claims/${claimId}/approve`).set('Cookie', finderCookie);

    const res = await api
      .patch(`/api/claims/${claimId}/approve`)
      .set('Cookie', finderCookie);

    expect(res.status).toBe(400);
  });

  it('prevents a stranger from approving another user\'s claim → 403', async () => {
    const finderCookie    = await seedUser('finder_d@test.com');
    const claimantCookie  = await seedUser('claimant_d@test.com');
    const strangerCookie  = await seedUser('stranger_d@test.com');
    const foundId         = await seedFoundItem(finderCookie);
    const claimId         = await seedClaim(claimantCookie, foundId);

    const res = await api
      .patch(`/api/claims/${claimId}/approve`)
      .set('Cookie', strangerCookie);

    expect(res.status).toBe(403);
  });

  it('requires authentication to approve → 401', async () => {
    const finderCookie   = await seedUser('finder_e@test.com');
    const claimantCookie = await seedUser('claimant_e@test.com');
    const foundId        = await seedFoundItem(finderCookie);
    const claimId        = await seedClaim(claimantCookie, foundId);

    const res = await api.patch(`/api/claims/${claimId}/approve`);
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Claim rejection
// ═══════════════════════════════════════════════════════════════════════════
describe('PATCH /api/claims/:id/reject — claim rejection', () => {
  it('finder rejects a pending claim → 200', async () => {
    const finderCookie   = await seedUser('finder_r@test.com');
    const claimantCookie = await seedUser('claimant_r@test.com');
    const foundId        = await seedFoundItem(finderCookie);
    const claimId        = await seedClaim(claimantCookie, foundId);

    const res = await api
      .patch(`/api/claims/${claimId}/reject`)
      .set('Cookie', finderCookie)
      .send({ reason: 'Not the right person' });

    expect(res.status).toBe(200);
    expect(res.body.data.claim.status).toBe('rejected');
    expect(res.body.data.claim.rejectionReason).toBe('Not the right person');
  });

  it('prevents a stranger from rejecting another user\'s claim → 403', async () => {
    const finderCookie   = await seedUser('finder_r2@test.com');
    const claimantCookie = await seedUser('claimant_r2@test.com');
    const strangerCookie = await seedUser('stranger_r2@test.com');
    const foundId        = await seedFoundItem(finderCookie);
    const claimId        = await seedClaim(claimantCookie, foundId);

    const res = await api
      .patch(`/api/claims/${claimId}/reject`)
      .set('Cookie', strangerCookie)
      .send({ reason: 'Unauthorized rejection' });

    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Claim cancellation
// ═══════════════════════════════════════════════════════════════════════════
describe('PATCH /api/claims/:id/cancel — claim cancellation', () => {
  it('claimant can cancel their own pending claim → 200', async () => {
    const finderCookie   = await seedUser('finder_cc@test.com');
    const claimantCookie = await seedUser('claimant_cc@test.com');
    const foundId        = await seedFoundItem(finderCookie);
    const claimId        = await seedClaim(claimantCookie, foundId);

    const res = await api
      .patch(`/api/claims/${claimId}/cancel`)
      .set('Cookie', claimantCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.claim.status).toBe('cancelled');
  });

  it('prevents a stranger from cancelling another user\'s claim → 403', async () => {
    const finderCookie   = await seedUser('finder_cc2@test.com');
    const claimantCookie = await seedUser('claimant_cc2@test.com');
    const strangerCookie = await seedUser('stranger_cc2@test.com');
    const foundId        = await seedFoundItem(finderCookie);
    const claimId        = await seedClaim(claimantCookie, foundId);

    const res = await api
      .patch(`/api/claims/${claimId}/cancel`)
      .set('Cookie', strangerCookie);

    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/claims/my
// ═══════════════════════════════════════════════════════════════════════════
describe('GET /api/claims/my', () => {
  it('returns an empty array when the user has no claims → 200', async () => {
    const cookie = await seedUser('my_claims@test.com');
    const res    = await api.get('/api/claims/my').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.claims).toEqual([]);
  });

  it('returns only the current user\'s claims', async () => {
    const finderCookie   = await seedUser('finder_my@test.com');
    const claimantCookie = await seedUser('claimant_my@test.com');
    const otherCookie    = await seedUser('other_my@test.com');
    const foundId        = await seedFoundItem(finderCookie);

    await seedClaim(claimantCookie, foundId);

    // Other user should see 0 claims
    const otherRes = await api.get('/api/claims/my').set('Cookie', otherCookie);
    expect(otherRes.body.data.claims.length).toBe(0);

    // Claimant should see 1 claim
    const myRes = await api.get('/api/claims/my').set('Cookie', claimantCookie);
    expect(myRes.body.data.claims.length).toBe(1);
  });

  it('requires authentication → 401', async () => {
    const res = await api.get('/api/claims/my');
    expect(res.status).toBe(401);
  });
});
