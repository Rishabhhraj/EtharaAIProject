# Team Task Manager (Full-Stack)

A MERN stack web application for creating projects, assigning tasks to team members, and tracking progress with **role-based access control (Admin vs Member)**.

## Features

| Feature | Description |
|---------|-------------|
| **Authentication** | Secure signup and login with JWT |
| **Project & Team Management** | Admins create projects and add/remove team members |
| **Task Management** | Create tasks, assign users, update status (`todo`, `in_progress`, `done`) |
| **Dashboard** | Visual overview: task counts by status, overdue tasks, recent activity |
| **RBAC** | Admin: full project/task/team control. Member: view assigned projects, update status on own tasks |

## Tech Stack

- **MongoDB** — database with Mongoose ODM and entity relationships
- **Express** — REST API with validation and JWT auth
- **React** — SPA (Vite) with React Router
- **Node.js** — backend runtime

## Project Structure

```
├── backend/          # Express API, models, routes, RBAC middleware
├── frontend/         # React (Vite) client
├── package.json      # Root scripts for build & deploy
├── railway.json      # Railway deployment config
└── README.md
```

## API Endpoints

### Auth
- `POST /api/auth/register` — Sign up (role: `admin` or `member`)
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user (protected)

### Projects
- `GET /api/projects` — List projects (admin: owned, member: assigned)
- `POST /api/projects` — Create project (admin only)
- `GET /api/projects/:id` — Project details
- `PUT /api/projects/:id` — Update project (admin only)
- `DELETE /api/projects/:id` — Delete project (admin only)
- `POST /api/projects/:id/members` — Add team members (admin only)
- `DELETE /api/projects/:id/members/:memberId` — Remove member (admin only)

### Tasks
- `GET /api/tasks/project/:projectId` — List tasks
- `POST /api/tasks/project/:projectId` — Create task (admin only)
- `PUT /api/tasks/:id` — Update task (admin: full; member: status on assigned tasks)
- `DELETE /api/tasks/:id` — Delete task (admin only)

### Dashboard
- `GET /api/dashboard` — Stats, status breakdown, overdue tasks

### Users
- `GET /api/users/members` — List members for team assignment (admin only)

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB (see options below)

### MongoDB setup (Windows)

**Option A — Portable (no admin, recommended for this project)**

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-portable-mongo.ps1
powershell -ExecutionPolicy Bypass -File scripts/start-mongo.ps1
```

Data is stored in `data/mongodb/`. Set `USE_EMBEDDED_MONGO=false` in `backend/.env`.

**Option B — System install (requires Administrator PowerShell)**

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-mongodb.ps1
```

**Option C — [MongoDB Atlas](https://www.mongodb.com/atlas)** — paste connection string into `MONGODB_URI`.

**Option D — In-memory (no install, data lost on restart)** — set `USE_EMBEDDED_MONGO=true` in `backend/.env`.

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd team-task-manager
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure backend environment**
   ```bash
   cp backend/.env.example backend/.env
   ```
   Edit `backend/.env`:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/team-task-manager
   JWT_SECRET=your_secret_key_here
   NODE_ENV=development
   ```

4. **Start MongoDB** (if running locally)

5. **Run backend** (terminal 1)
   ```bash
   npm run dev:backend
   ```

6. **Run frontend** (terminal 2)
   ```bash
   npm run dev:frontend
   ```

7. Open **http://localhost:3000**

### Demo workflow

1. **Sign up** as **Admin** — create projects and tasks.
2. **Sign up** as **Member** (different email) — in another browser/incognito.
3. As Admin: create a project, add the member to the team, create tasks and assign them.
4. As Member: open the project, update task status on assigned tasks.
5. View **Dashboard** for status overview and overdue items.

## Deployment on Railway (Required)

### 1. Push to GitHub
Create a repository and push this project.

### 2. Create Railway project
1. Go to [railway.app](https://railway.app) and sign in.
2. **New Project** → **Deploy from GitHub repo** → select your repo.

### 3. Add MongoDB
1. In the project, click **+ New** → **Database** → **MongoDB**.
2. Copy the `MONGO_URL` (or `MONGODB_URI`) connection string from the MongoDB service variables.

### 4. Configure the web service
Set environment variables on your **web** service:

| Variable | Value |
|----------|--------|
| `MONGODB_URI` | MongoDB connection string from Railway |
| `JWT_SECRET` | A long random secret string |
| `NODE_ENV` | `production` |
| `PORT` | Railway sets this automatically |

### 5. Build settings
Railway uses `railway.json`:
- **Build:** `npm run install:all && npm run build`
- **Start:** `npm start` (serves API + React build from one service)

### 6. Generate domain
In the web service → **Settings** → **Networking** → **Generate Domain**.

Your live URL will look like: `https://your-app.up.railway.app`

## Submission Checklist

- [ ] Live URL (Railway deployment)
- [ ] GitHub repository link
- [ ] This README (setup, API, deployment)
- [ ] 2–5 minute demo video (signup, projects, tasks, dashboard, admin vs member)

## Security

- Passwords hashed with bcrypt
- JWT for authenticated requests
- RBAC middleware on protected routes
- Project access enforced per user role and membership
- Input validation via `express-validator`

## License

MIT
