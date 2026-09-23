<<<<<<< HEAD
# Lost2Found

## Description

A smart Lost & Found platform designed for college campuses.

## Current Phase

Phase 1 — Project Setup & Architecture

## Tech Stack

React
Vite
Tailwind CSS
Node.js
Express.js
MongoDB
Mongoose

## Project Structure

This project follows a standard client/server MERN architecture.
- `client/`: Contains the React/Vite frontend application.
- `server/`: Contains the Node.js/Express backend application.

## Local Development

### 1. Install Dependencies
From the root directory, run:
```bash
npm install
npm run install-all
```

### 2. Configure Environment Variables
Create `.env` files in both the client and server directories:

**Server (`server/.env`)**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/lost2found
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Client (`client/.env`)**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Start MongoDB
Ensure that your MongoDB instance is running (locally or via Atlas).

### 4 & 5. Start Backend and Frontend
From the root directory, you can start both applications concurrently using:
```bash
npm run dev
```
Alternatively, you can run them separately:
- Backend: `cd server && npm run dev`
- Frontend: `cd client && npm run dev`

## API

### Health Check
`GET /api/health`
Returns a status JSON confirming the API is running.

## Future Development

Future phases will introduce:
- Authentication
- Lost/found reports
- Image uploads
- Search and filtering
- Matching
- AI-powered matching
- Claim verification
- Anonymous communication
- Notifications
- Admin moderation
- Analytics
=======
# Lost2Found
>>>>>>> a18572ea22360a9b1bb712ec1e8fc39c87228c28
