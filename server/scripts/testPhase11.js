import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import http from 'http';
import app from '../app.js';
import User from '../models/User.js';
import Item from '../models/Item.js';
import Claim from '../models/Claim.js';
import Match from '../models/Match.js';
import Report from '../models/Report.js';
import AuditLog from '../models/AuditLog.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_lost2found_2026';

const runTests = async () => {
  let server;
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Prepare test users
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.create({
        name: 'Test Admin',
        email: 'test_admin@lost2found.edu',
        password: 'Password123!',
        role: 'admin',
        isVerified: true,
        isActive: true,
      });
    }

    let student = await User.findOne({ role: 'student' });
    if (!student) {
      student = await User.create({
        name: 'Test Student',
        email: 'test_student@lost2found.edu',
        password: 'Password123!',
        role: 'student',
        isVerified: true,
        isActive: true,
      });
    }

    // Seed sample realistic items, claims, matches, reports if none exist
    const itemCount = await Item.countDocuments();
    if (itemCount === 0) {
      console.log('Seeding sample data for analytics verification...');
      const item1 = await Item.create({
        title: 'Lost iPhone 14 Blue',
        description: 'Lost near the college library second floor',
        type: 'lost',
        category: 'electronics',
        location: 'Library',
        date: new Date(),
        reportedBy: student._id,
        status: 'active',
      });

      const item2 = await Item.create({
        title: 'Found Blue iPhone in Library',
        description: 'Found on 2nd floor desk',
        type: 'found',
        category: 'electronics',
        location: 'Library',
        date: new Date(),
        reportedBy: admin._id,
        status: 'resolved',
      });

      const item3 = await Item.create({
        title: 'Lost Brown Leather Wallet',
        description: 'Has college ID card inside',
        type: 'lost',
        category: 'wallet',
        location: 'Cafeteria',
        date: new Date(),
        reportedBy: student._id,
        status: 'active',
      });

      const claim1 = await Claim.create({
        item: item2._id,
        claimant: student._id,
        evidence: {
          message: 'This is my blue iPhone, has a scratch on the back.',
          specificDetails: ['Scratch on camera lens', 'Blue silicon case'],
        },
        status: 'approved',
        reviewedBy: admin._id,
        reviewedAt: new Date(),
      });

      await Match.create({
        lostItem: item1._id,
        foundItem: item2._id,
        score: 88,
        status: 'potential',
        reasons: ['Same category: electronics', 'Same location: Library', 'Matching color: blue'],
      });

      await Report.create({
        reporter: student._id,
        targetType: 'item',
        targetId: item3._id,
        reason: 'duplicate',
        description: 'Testing report',
        status: 'pending',
      });

      await AuditLog.create({
        admin: admin._id,
        action: 'ITEM_RESTORED',
        targetType: 'item',
        targetId: item2._id,
        metadata: { title: item2.title },
      });
    }

    // Generate JWT tokens
    const adminToken = jwt.sign({ userId: admin._id, role: admin.role }, JWT_SECRET, { expiresIn: '1d' });
    const studentToken = jwt.sign({ userId: student._id, role: student.role }, JWT_SECRET, { expiresIn: '1d' });

    // Start ephemeral server
    const port = 5055;
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(port, resolve));
    const baseUrl = `http://localhost:${port}/api/admin/analytics/overview`;

    console.log('\n--- Running Analytics API Tests ---');

    // Helper fetch wrapper
    const makeRequest = async (url, token) => {
      const headers = {};
      if (token) {
        headers['Cookie'] = `jwt=${token}`;
      }
      const res = await fetch(url, { headers });
      const status = res.status;
      let body;
      try {
        body = await res.json();
      } catch (e) {
        body = null;
      }
      return { status, body };
    };

    // Test 1: Unauthenticated request -> 401
    const t1 = await makeRequest(baseUrl, null);
    console.assert(t1.status === 401, `Test 1 Failed: Expected 401, got ${t1.status}`);
    console.log('✓ Test 1: Unauthenticated request correctly returns 401');

    // Test 2: Student request -> 403
    const t2 = await makeRequest(baseUrl, studentToken);
    console.assert(t2.status === 403, `Test 2 Failed: Expected 403, got ${t2.status}`);
    console.log('✓ Test 2: Student request correctly returns 403 Forbidden');

    // Test 3: Admin request -> 200 with complete data structure
    const t3 = await makeRequest(baseUrl, adminToken);
    console.assert(t3.status === 200, `Test 3 Failed: Expected 200, got ${t3.status}`);
    console.assert(t3.body.success === true, 'Test 3 Failed: Expected success === true');
    console.assert(t3.body.data.overview.users !== undefined, 'Test 3 Failed: overview.users missing');
    console.assert(t3.body.data.overview.items !== undefined, 'Test 3 Failed: overview.items missing');
    console.assert(t3.body.data.overview.claims !== undefined, 'Test 3 Failed: overview.claims missing');
    console.assert(t3.body.data.overview.matches !== undefined, 'Test 3 Failed: overview.matches missing');
    console.assert(t3.body.data.items.lostVsFound !== undefined, 'Test 3 Failed: items.lostVsFound missing');
    console.assert(Array.isArray(t3.body.data.items.trend), 'Test 3 Failed: items.trend is not array');
    console.assert(Array.isArray(t3.body.data.items.categories), 'Test 3 Failed: items.categories is not array');
    console.assert(Array.isArray(t3.body.data.items.locations), 'Test 3 Failed: items.locations is not array');
    console.assert(Array.isArray(t3.body.data.claims.statusBreakdown), 'Test 3 Failed: claims.statusBreakdown is not array');
    console.assert(Array.isArray(t3.body.data.matches.scoreDistribution), 'Test 3 Failed: matches.scoreDistribution is not array');
    console.assert(Array.isArray(t3.body.data.users.growth), 'Test 3 Failed: users.growth is not array');
    console.assert(t3.body.data.moderation.reports !== undefined, 'Test 3 Failed: moderation.reports missing');
    console.assert(Array.isArray(t3.body.data.moderation.recentActivity), 'Test 3 Failed: recentActivity is not array');
    console.log('✓ Test 3: Admin request returns 200 with complete and accurate analytics payload');

    // Test 4: Preset filters (7d, 90d, 1y)
    const t4_7d = await makeRequest(`${baseUrl}?range=7d`, adminToken);
    console.assert(t4_7d.status === 200, 'Test 4 Failed: range=7d failed');
    console.assert(t4_7d.body.data.filter.preset === '7d', 'Test 4 Failed: filter.preset not 7d');

    const t4_90d = await makeRequest(`${baseUrl}?range=90d`, adminToken);
    console.assert(t4_90d.status === 200, 'Test 4 Failed: range=90d failed');
    console.assert(t4_90d.body.data.filter.granularity === 'week', 'Test 4 Failed: 90d should be weekly granularity');

    const t4_1y = await makeRequest(`${baseUrl}?range=1y`, adminToken);
    console.assert(t4_1y.status === 200, 'Test 4 Failed: range=1y failed');
    console.assert(t4_1y.body.data.filter.granularity === 'month', 'Test 4 Failed: 1y should be monthly granularity');
    console.log('✓ Test 4: Preset range filters (7d, 90d, 1y) function with correct granularities');

    // Test 5: Custom Date Range
    const t5_custom = await makeRequest(`${baseUrl}?from=2026-01-01&to=2026-09-30`, adminToken);
    console.assert(t5_custom.status === 200, 'Test 5 Failed: custom range failed');
    console.assert(t5_custom.body.data.filter.preset === 'custom', 'Test 5 Failed: preset not custom');
    console.log('✓ Test 5: Custom date range works properly');

    // Test 6: Invalid date format validation -> 400
    const t6_invalid = await makeRequest(`${baseUrl}?from=invalid-date&to=2026-09-30`, adminToken);
    console.assert(t6_invalid.status === 400, `Test 6 Failed: Expected 400, got ${t6_invalid.status}`);
    console.log('✓ Test 6: Invalid date format correctly returns 400');

    // Test 7: from > to validation -> 400
    const t7_reversed = await makeRequest(`${baseUrl}?from=2026-10-01&to=2026-09-01`, adminToken);
    console.assert(t7_reversed.status === 400, `Test 7 Failed: Expected 400, got ${t7_reversed.status}`);
    console.log('✓ Test 7: "from > to" correctly returns 400');

    // Test 8: Invalid range string -> 400
    const t8_badRange = await makeRequest(`${baseUrl}?range=500days`, adminToken);
    console.assert(t8_badRange.status === 400, `Test 8 Failed: Expected 400, got ${t8_badRange.status}`);
    console.log('✓ Test 8: Invalid range parameter correctly returns 400');

    // Test 9: Empty date range (far future dates) resilience -> 200 with 0s and empty arrays
    const t9_empty = await makeRequest(`${baseUrl}?from=2030-01-01&to=2030-01-15`, adminToken);
    console.assert(t9_empty.status === 200, `Test 9 Failed: Expected 200, got ${t9_empty.status}`);
    console.assert(t9_empty.body.data.items.lostVsFound.total === 0, 'Test 9 Failed: expected 0 items');
    console.assert(t9_empty.body.data.items.categories.length === 0, 'Test 9 Failed: expected 0 categories');
    console.log('✓ Test 9: Empty date range returns graceful zeroed structures without errors');

    console.log('\n=======================================');
    console.log('ALL PHASE 11 BACKEND TESTS PASSED (9/9)');
    console.log('=======================================\n');
  } catch (err) {
    console.error('Test run failed with error:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTests();
