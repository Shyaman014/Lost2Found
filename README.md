# Lost2Found — Smart Lost & Found Platform for Colleges

Lost2Found is a modern, AI-powered Lost & Found platform designed specifically for college and university communities. It features real-time notifications, intelligent item matching, a strict claims verification system, and a comprehensive admin moderation dashboard.

---

## 🚀 Features

- **Authentication:** Secure JWT-based authentication with `HttpOnly` and `SameSite` cookies, role-based access control (Student vs. Admin), and rigorous input validation.
- **Lost & Found Reporting:** Dedicated flows to report lost and found items.
- **Image Uploads:** Seamless media uploads directly to Cloudinary.
- **Search & Filtering:** Robust searching, categorical filtering, and robust pagination.
- **AI Matching:** Automated potential matching powered by Google Gemini, instantly connecting lost items with potential found matches based on visual and textual similarity.
- **Ownership Claims:** A secure workflow allowing users to file claims with evidence.
- **Anonymous Chat:** Real-time messaging between finders and claimants powered by Socket.io, protecting student privacy until an item is successfully returned.
- **Notifications:** Instant real-time alerts for new matches, messages, and claim status updates.
- **Admin Moderation & Analytics:** A dedicated portal for administrators to review reported items, flag inappropriate content, manage users, and view dynamic platform analytics.

---

## 🛠️ Technology Stack

**Frontend (Client)**
- React.js (v19)
- Vite
- Tailwind CSS v4
- React Router DOM
- Socket.io-client

**Backend (Server)**
- Node.js & Express.js
- MongoDB & Mongoose
- JSON Web Tokens (JWT) & bcryptjs
- Cloudinary (Image Hosting)
- Google Generative AI (Gemini)
- Socket.io (WebSockets)
- Security: `helmet`, `cors`, `express-rate-limit`, `express-mongo-sanitize`

---

## 💻 Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB connection string (Atlas or Local)
- Cloudinary Account
- Google Gemini API Key

### 1. Clone & Install
```bash
# Clone the repository
git clone https://github.com/your-username/lost2found.git
cd lost2found

# Install Server dependencies
cd server
npm install

# Install Client dependencies
cd ../client
npm install
```

### 2. Environment Variables

#### Server (`server/.env`)
Create a `.env` file in the `server` directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30d
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
AI_MATCH_THRESHOLD=70
```

#### Client (`client/.env`)
Create a `.env` file in the `client` directory:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Running the Application
```bash
# Start the Backend (from /server)
npm run dev

# Start the Frontend (from /client)
npm run dev
```
The application will be accessible at `http://localhost:5173`.

---

## 📚 API Documentation

### Authentication (`/api/auth`)
- `POST /register`: Register a new student.
- `POST /login`: Authenticate and receive `HttpOnly` JWT.
- `POST /logout`: Clear authentication cookie.
- `GET /me`: Retrieve current authenticated user profile.

### Items (`/api/items`)
- `GET /`: Retrieve all items (with search, filter, sort, pagination).
- `POST /`: Report a new lost/found item (FormData for image).
- `GET /:id`: Retrieve specific item details.
- `PUT /:id`: Update item details.
- `DELETE /:id`: Delete an item.
- `PATCH /:id/status`: Mark item as active or resolved.
- `PATCH /:id/returned`: Mark a claimed item as physically returned.

### Claims (`/api/claims` & `/api/items/:id/claims`)
- `POST /items/:id/claims`: File a new claim on a found item.
- `GET /items/:id/claims`: View all claims for a specific item (Finder only).
- `GET /my`: View claims filed by the current user.
- `PATCH /:id/approve`: Approve a claim.
- `PATCH /:id/reject`: Reject a claim.
- `PATCH /:id/cancel`: Cancel a pending claim.

### AI Matches (`/api/items/:id/match`)
- `POST /items/:id/match`: Trigger manual Gemini AI match generation.
- `GET /items/:id/matches`: Retrieve potential matches for an item.

### Conversations & Messages (`/api/conversations`)
- `GET /`: List user's active conversations.
- `GET /:id`: Retrieve conversation details and messages.

### Admin & Analytics (`/api/admin`)
- `GET /users`: List all users.
- `PATCH /users/:id/status`: Deactivate/activate user.
- `GET /analytics/overview`: Retrieve platform metrics and aggregation pipelines.
- `PATCH /items/:id/moderate`: Admin override to remove/flag items.
- `GET /reports`: View all user-generated reports.

---

## 🌍 Production Deployment Guide

### 1. Database (MongoDB Atlas)
1. Create a production cluster on MongoDB Atlas.
2. Under **Database Access**, create a dedicated user with a strong password.
3. Under **Network Access**, whitelist your backend hosting provider's IP addresses (or use `0.0.0.0/0` if dynamic, but ensure strong credentials).
4. Save the connection string for the backend `.env`.

### 2. Frontend Deployment (Vercel / Netlify)
The frontend is a standard Vite SPA.
1. Connect your repository to Vercel or Netlify.
2. Set the Framework Preset to **Vite**.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. **Environment Variables**:
   - `VITE_API_BASE_URL`: The production URL of your backend (e.g., `https://api.lost2found.com/api`)
6. **SPA Routing**: Vercel/Netlify handles fallback routing automatically for Vite, but ensure `vercel.json` or `_redirects` is configured if manual intervention is needed for React Router paths like `/login`.

### 3. Backend Deployment (Render / Heroku)
The backend requires Node.js and WebSocket support.
1. Connect your repository to Render or Heroku.
2. Build Command: `npm install`
3. Start Command: `node server.js`
4. **Environment Variables**:
   - Set all variables from `server/.env` with your production values.
   - `NODE_ENV=production`
   - `CLIENT_URL=https://your-production-frontend.com` (Critical for CORS and Socket.io)
5. **WebSockets**: Ensure your hosting provider supports persistent WebSocket connections (Render natively supports this; Heroku requires standard configuration).

### 4. Security Notes
- The application uses `helmet`, `express-rate-limit`, and `express-mongo-sanitize` for production security.
- Cookies are automatically set to `Secure: true` and `SameSite=strict` when `NODE_ENV=production`.
- **Never expose your backend `.env` variables or Cloudinary/Gemini secrets in the frontend.**
