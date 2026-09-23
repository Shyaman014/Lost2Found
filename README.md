# Lost2Found — Smart Lost & Found Platform for Colleges

A comprehensive, full-stack Lost & Found platform designed specifically for college campuses, featuring AI matching, real-time messaging, claims verification, moderation tools, and platform analytics.

## Tech Stack

* **Database**: MongoDB with Mongoose ODM
* **Backend**: Node.js & Express.js (REST API, WebSocket via Socket.io)
* **Frontend**: React.js (v19) with Vite & Tailwind CSS (v4)
* **Authentication**: JWT with secure HttpOnly cookies
* **Media Storage**: Cloudinary
* **AI Engine**: Google Generative AI (Gemini)
* **Real-Time**: Socket.io for notifications and anonymous chat

---

## Implemented Phases

1. **MERN Foundation & Architecture**
2. **Authentication & User Management** (JWT + HttpOnly cookies, student/admin roles)
3. **Lost & Found Item Management** (CRUD, status tracking)
4. **Cloudinary Image Upload**
5. **Search, Filter, Sort & Pagination**
6. **AI-Powered Potential Matching** (Gemini embeddings & scoring)
7. **Claim & Ownership Verification**
8. **Anonymous Real-Time Communication** (Socket.io)
9. **Notifications & Real-Time Updates**
10. **Admin Moderation & Management System** (Reports, item moderation, user role/status controls, audit logging)
11. **Analytics & Insights Dashboard** (Server-side MongoDB aggregation, time-series trends, vital KPIs, date filtering)

---

## Phase 11: Analytics & Insights Dashboard

### Analytics Overview
The platform includes an admin-only Analytics & Insights engine designed to give campus administrators descriptive, real-time visibility into lost and found activities, resolution efficiency, claims workflow, AI matching accuracy, and platform moderation health.

All analytics are computed dynamically on the server using optimized MongoDB aggregation pipelines with compound indexes; data is never calculated from incomplete paginated frontend payloads.

### Admin-Only Access & Security
* **Endpoint**: `GET /api/admin/analytics/overview`
* **Protection**: Enforced server-side with `protect` and `authorizeRoles('admin')` middleware.
* **Access Control**:
  * Unauthenticated requests receive HTTP `401 Unauthorized`.
  * Student requests receive HTTP `403 Forbidden`.
  * Only verified active administrator accounts are permitted access.
* The API does not accept arbitrary user ID scoping parameters; analytics represent platform-wide aggregate data.

### Date-Range Behavior & Filtering
The analytics API supports both preset time horizons and custom date intervals:

* **Presets**:
  * `range=7d` (Last 7 Days) → Daily granularity (`YYYY-MM-DD`)
  * `range=30d` (Last 30 Days, default) → Daily granularity (`YYYY-MM-DD`)
  * `range=90d` (Last 90 Days) → Weekly granularity (`YYYY-WW`)
  * `range=1y` (Last 12 Months) → Monthly granularity (`YYYY-MM`)
* **Custom Range**:
  * `from=YYYY-MM-DD&to=YYYY-MM-DD`
  * Granularity is automatically selected based on date span (<= 31 days: daily; <= 120 days: weekly; > 120 days: monthly).
  * Validates date formats, ensures `from <= to`, and caps ranges at a maximum of 5 years.
* **Period Comparison**:
  * For primary metrics (`newUsers`, `newItems`, `newClaims`), the service calculates the equivalent preceding duration and returns `changePercent` (+X% / -X%) to show period-over-period momentum without division-by-zero errors.

### Available Analytics & Metric Definitions

#### 1. Overview KPIs (`overview`)
* **Total Users**: All-time registered user count.
* **Active Users**: Users with `isActive: true`.
* **Inactive Users**: Users deactivated by moderation (`isActive: false`).
* **New Users in Period**: Users created between the selected start and end dates.
* **Total Items**: Total lost and found items created on the platform.
* **Active Items**: Items currently visible (`status: 'active'`, `moderationStatus !== 'removed'`).
* **Resolved Items**: Items marked with `status: 'resolved'`.
* **Claimed Items**: Items marked with `status: 'claimed'`.
* **Returned Items**: Items marked with `status: 'returned'`.
* **Resolution Rate**: `((resolvedItems + returnedItems) / totalEligibleItems) * 100`. Represents the proportion of items successfully resolved or returned.
* **Total Claims**: All-time claim submissions.
* **Claim Approval Rate**: `(approvedClaims / (approvedClaims + rejectedClaims)) * 100`. Only evaluated claims are considered; pending claims are excluded from the denominator.

#### 2. Lost vs Found Breakdown (`items.lostVsFound`)
* Aggregates count of lost vs found items created within the selected period.

#### 3. Item Reporting Trend (`items.trend`)
* Time-series aggregation grouped by date according to the active granularity. Returns `{ date, lost, found, total }`.

#### 4. Top Reported Categories (`items.categories`)
* Ranking of the most frequently reported categories (e.g., Electronics, Wallet, Documents) sorted descending.

#### 5. Top Reported Locations (`items.locations`)
* Campus locations with the highest incident counts, trimmed and sorted descending.

#### 6. Claim Analytics & Trends (`claims`)
* **Status Breakdown**: Counts for `pending`, `approved`, `rejected`, and `cancelled` claims in the period.
* **Claims Over Time**: Time-series volume of claim submissions.

#### 7. AI Match Analytics (`matches`)
* Uses stored `Match` documents (does not invoke Gemini during analytics generation).
* **Summary**: Total generated pairs, potential pending review, dismissed pairs, and average match similarity score.
* **Score Distribution**: Histogram distribution grouped into buckets: `0–20%`, `21–40%`, `41–60%`, `61–80%`, and `81–100%`.

#### 8. User Growth & Platform Engagement (`users`)
* **User Growth**: Registrations over time grouped by date.
* **Users Who Reported Items**: Distinct user IDs who reported at least one item during the period.
* **Users Who Submitted Claims**: Distinct claimant user IDs who submitted a claim during the period.
* **In Active Conversations**: Distinct participants currently involved in active chats.

#### 9. Moderation Health & Audit Activity (`moderation`)
* **Reports Summary**: Counts of `pending`, `reviewed`, `dismissed`, and `action_taken` user reports.
* **Enforcement Actions**: Action tallies derived from `AuditLog` (`ITEM_REMOVED`, `ITEM_RESTORED`, `USER_DEACTIVATED`, `USER_REACTIVATED`, `USER_ROLE_CHANGED`).
* **Recent Activity**: 10 latest immutable audit log entries showing admin actor, action badge, target entity snapshot, and timestamp.

---

## Local Development & Setup

### 1. Prerequisites
* Node.js (v18+)
* MongoDB running locally (`mongodb://127.0.0.1:27017/lost2found`)

### 2. Environment Variables
Create `.env` in `server/`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/lost2found
CLIENT_URL=http://localhost:5173
NODE_ENV=development
JWT_SECRET=super_secret_jwt_key_lost2found_2026
JWT_EXPIRES_IN=30d
ADMIN_NAME=Admin User
ADMIN_EMAIL=admin@lost2found.edu
ADMIN_PASSWORD=AdminPassword123!
```

### 3. Seed Initial Admin Account
```bash
cd server
node scripts/seedAdmin.js
```

### 4. Run Automated Analytics Verification Test Suite
```bash
cd server
node scripts/testPhase11.js
```

### 5. Start Development Servers
From the root directory:
```bash
npm run dev
```
* Backend API: `http://localhost:5000`
* Frontend Client: `http://localhost:5173`
* Admin Dashboard: `http://localhost:5173/admin`
