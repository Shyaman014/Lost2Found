# 🔍 Lost2Found

**Smart, AI-Powered Campus Lost & Found Platform**

Lost2Found is a modern web application designed for university and college campuses. It helps students recover lost belongings through **Google Gemini AI** image/text matching, secure ownership claims, and **real-time anonymous messaging** via WebSockets.

---

## 🚀 Key Features

- 🤖 **AI-Powered Item Matching**: Automatically calculates match similarity between lost and found reports using Google Gemini multimodal AI.
- 💬 **Anonymous Real-Time Chat**: Finders and claimants communicate instantly via Socket.io without sharing private phone numbers or personal contacts.
- 🛡️ **Verified Ownership Claims**: Structured claims workflow requiring proof of ownership before an item can be released.
- ⚡ **Modern Responsive UI**: Built with React 19, Vite, and Tailwind CSS v4 with smooth transitions and mobile-first layouts.
- 📊 **Admin Dashboard**: Moderation tools to review items, manage flagged reports, inspect users, and view platform metrics.
- 🔒 **Secure Authentication**: JWT session handling stored in `HttpOnly`, `SameSite` cookies with role-based access control.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router DOM, Socket.io Client, Axios |
| **Backend** | Node.js, Express 5, MongoDB, Mongoose, Socket.io, Multer |
| **AI & Media** | Google Gemini Generative AI (`@google/generative-ai`), Cloudinary (with local fallback) |
| **Security** | Helmet (CORP enabled), bcryptjs, express-rate-limit, express-mongo-sanitize |

---

## 📋 How It Works

1. **Report**: A student reports a lost or found item with details and photos.
2. **AI Match**: Gemini AI compares new reports against existing database entries and suggests matches.
3. **Claim**: The owner files a claim with proof of ownership.
4. **Chat & Handover**: Finder and owner verify details in an anonymous chat and arrange physical handover.
5. **Resolve**: The item is marked as resolved and closed.

---

## ⚡ Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- Google Gemini API key ([Google AI Studio](https://aistudio.google.com/))

### Installation

```bash
# 1. Clone repository
git clone https://github.com/Shyaman014/Lost2Found.git
cd Lost2Found

# 2. Install dependencies (root, server, client)
npm run install-all
```

### Environment Setup

#### Server (`server/.env`)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
MONGO_URI=mongodb://localhost:27017/lost2found
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=30d
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
AI_MATCH_THRESHOLD=70

# Optional (uses local upload fallback if blank)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

#### Client (`client/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Run Locally

```bash
# Start backend and frontend concurrently
npm run dev
```

The frontend runs at `http://localhost:5173` and the backend at `http://localhost:5000`.

---

## 📡 Core API Routes

- `POST /api/auth/register` — Create student account
- `POST /api/auth/login` — Sign in (sets secure cookie)
- `GET  /api/auth/me` — Get current profile
- `PUT  /api/auth/profile` — Update user profile & avatar
- `GET  /api/items` — Search and filter lost/found items
- `POST /api/items` — Report new lost/found item
- `POST /api/items/:id/claims` — File claim on an item
- `PATCH /api/claims/:id/approve` — Finder approves claim
- `GET  /api/conversations` — Active chat conversations
- `GET  /api/admin/analytics/overview` — Admin overview statistics

---

## 📄 License

MIT License. Created by [Shyaman014](https://github.com/Shyaman014).
