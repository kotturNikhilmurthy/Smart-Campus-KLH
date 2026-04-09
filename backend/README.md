# Smart Campus Backend

Node.js backend powering the Smart Campus frontend (`campus-mark-master-main`). The API now uses local email/password authentication with JWT sessions and exposes REST endpoints for announcements, events, lost & found, clubs, polls, resources, feedback, and dashboards.

## Features

- Express.js server with Helmet, CORS, and morgan logging
- JWT-based local authentication via `/auth/register` and `/auth/login`
- Optional in-memory runtime mode for demos and simple deployments (`USE_DATABASE=false`)
- MongoDB support remains available when `USE_DATABASE=true`
- REST endpoints aligned with the React frontend modules
- Consistent JSON response shape with centralized error handling

## Folder Structure

```text
backend/
+-- config/
¦   +-- db.js
+-- controllers/
¦   +-- authController.js
¦   +-- studentController.js
¦   +-- teacherController.js
¦   +-- userController.js
+-- middleware/
¦   +-- authMiddleware.js
¦   +-- errorMiddleware.js
¦   +-- roleMiddleware.js
¦   +-- uploadMiddleware.js
+-- models/
+-- routes/
¦   +-- apiRoutes.js
¦   +-- authRoutes.js
¦   +-- studentRoutes.js
¦   +-- teacherRoutes.js
+-- services/
¦   +-- mockStore.js
¦   +-- runtimeConfig.js
+-- utils/
¦   +-- asyncHandler.js
¦   +-- generateToken.js
+-- package.json
+-- server.js
```

## Getting Started

### 1. Prerequisites

- Node.js 18+
- MongoDB Atlas only if you want persistent database mode

### 2. Install Dependencies

```powershell
cd backend
npm install
```

### 3. Configure Environment

```env
PORT=5000
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:8080
USE_DATABASE=false
```

Optional database settings:

```env
MONGO_URI=your_mongodb_connection_string
USE_DATABASE=true
```

### 4. Run the Server

```powershell
npm run dev
```

Production:

```powershell
npm start
```

## Authentication

### Register

`POST /auth/register`

Request body:

```json
{
  "name": "Demo Student",
  "email": "student@example.com",
  "password": "student123",
  "role": "student"
}
```

### Login

`POST /auth/login`

Request body:

```json
{
  "email": "student@example.com",
  "password": "student123"
}
```

Both endpoints return:

```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "...",
      "name": "...",
      "email": "...",
      "role": "student"
    }
  }
}
```

Include the JWT in the `Authorization: Bearer <token>` header for protected routes.

## Core Endpoints

| Method | Route | Description | Auth |
| ------ | ----- | ----------- | ---- |
| POST | `/auth/register` | Register a local user and receive JWT | Public |
| POST | `/auth/login` | Login with email/password and receive JWT | Public |
| GET | `/api/user/me` | Current user profile | JWT |
| GET | `/api/announcements` | Fetch announcements | JWT |
| POST | `/api/announcements` | Create announcement | JWT + admin |
| GET | `/api/events` | List events | JWT |
| POST | `/api/events` | Create event | JWT + teacher/admin |
| POST | `/api/events/:eventId/rsvp` | RSVP to event | JWT |
| GET | `/api/lost-found` | List lost & found items | JWT |
| POST | `/api/lost-found` | Submit lost/found item | JWT |
| PATCH | `/api/lost-found/:itemId/status` | Update item status | JWT + teacher/admin |
| GET | `/api/polls` | List polls | JWT |
| POST | `/api/polls` | Create poll | JWT |
| POST | `/api/polls/:pollId/vote` | Vote on a poll | JWT |
| GET | `/api/resources` | List resources | JWT |
| POST | `/api/resources/:resourceId/download` | Register resource download | JWT |
| POST | `/api/feedback` | Submit feedback | JWT |
| GET | `/api/feedback` | Retrieve feedback | JWT |
| GET | `/api/student/dashboard` | Student dashboard metrics | JWT + student |
| GET | `/api/student/clubs` | Student clubs listing | JWT + student |
| POST | `/api/student/clubs/:clubId/join` | Join club | JWT + student |
| POST | `/api/student/clubs/:clubId/leave` | Leave club | JWT + student |
| GET | `/api/teacher/dashboard` | Teacher dashboard metrics | JWT + teacher |
| POST | `/api/teacher/feedback/:feedbackId/respond` | Respond to feedback | JWT + teacher |
| POST | `/api/teacher/resources` | Upload resource | JWT + teacher |
| PATCH | `/api/teacher/resources/:resourceId` | Update resource | JWT + teacher |
| DELETE | `/api/teacher/resources/:resourceId` | Delete resource | JWT + teacher |

## Development Notes

- With `USE_DATABASE=false`, all data is in memory and resets on restart.
- JWTs expire after 7 days by default.
- `CLIENT_URL` supports comma-separated origins if your frontend runs on multiple hosts.

## Next Steps

- Add automated tests for critical auth and API flows
- Add persistent user/password storage if you switch to database mode
- Add rate limiting for production deployments
