# Team Task Manager (Full-Stack)

A MERN stack web application for creating projects, assigning tasks to team members, and tracking progress with **role-based access control (Admin vs Member)**.

## Features

| Feature | Description |
|---------|-------------|
| **Authentication** | Secure signup and login with JWT |
| **Project & Team Management** | Admins create projects and add/remove team members |
| **Task Management** | Create tasks, assign users, update status (`todo`, `in_progress`, `done`) |
| **Dashboard** | Stats, status bars, overdue tasks, **due in 3 days** (client-side), priority-sorted lists |
| **RBAC** | Admin: full control. Member: projects they belong to; **dashboard shows only tasks assigned to them** |
| **Status requests** | Members request status changes; admins approve or reject (with confirm on reject) |
| **Notifications** | In-app bell: assignment, approval/rejection, new comments |
| **Comments** | Thread on each task for admin ↔ member communication |
| **Project archive** | `active` / `archived` — archived projects are read-only |
| **Task priority** | `low` \| `medium` \| `high` — used for dashboard sorting |
| **UX** | Toasts, dashboard skeleton, session-expired redirect, password show/hide + strength hint |

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
- `POST /api/auth/register` — Sign up (first user = admin; others = member unless `adminInviteCode` matches `ADMIN_INVITE_CODE`)
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user (protected)
- `GET /api/auth/profile` — Full profile with stats and project list

### Projects
- `GET /api/projects` — List projects (admin: owned, member: assigned)
- `POST /api/projects` — Create project (admin only)
- `GET /api/projects/:id` — Project details
- `PUT /api/projects/:id` — Update project (admin only); body may include `status`: `active` \| `archived`
- `DELETE /api/projects/:id` — Delete project (admin only)
- `POST /api/projects/:id/members` — Add team members (admin only)
- `DELETE /api/projects/:id/members/:memberId` — Remove member (admin only)

### Tasks
- `GET /api/tasks/project/:projectId` — List tasks
- `POST /api/tasks/project/:projectId` — Create task (admin only)
- `PUT /api/tasks/:id` — Update task (admin: full; member: status on assigned tasks via status requests)
- `DELETE /api/tasks/:id` — Delete task (admin only)

Task fields include `priority` (`low` \| `medium` \| `high`) and optional `dueDate`.

### Dashboard
- `GET /api/dashboard` — Stats, status breakdown, overdue, **dueSoon** (due within 3 days), recent tasks sorted by priority. Members receive `memberViewNote` and counts only for **their assigned** tasks.

### Status change requests
- `GET /api/status-requests/project/:projectId/pending` — Pending requests (admin)
- `GET /api/status-requests/project/:projectId` — Member’s own requests
- `POST /api/status-requests/task/:taskId` — Submit request (`requestedStatus`)
- `PATCH /api/status-requests/:id/approve` — Approve (admin)
- `PATCH /api/status-requests/:id/reject` — Reject (admin)

### Notifications
- `GET /api/notifications` — List + unread count
- `PATCH /api/notifications/:id/read` — Mark one read
- `PATCH /api/notifications/read-all` — Mark all read

Types: `assigned`, `status_approved`, `status_rejected`, `comment`.

### Comments
- `GET /api/comments/task/:taskId` — List comments
- `POST /api/comments/task/:taskId` — Add comment (`text`)

### Users
- `GET /api/users/members` — List members for team assignment (admin only)

## Member vs admin behavior

| Area | Admin | Member |
|------|--------|--------|
| Projects | Create, edit, archive, delete; manage team | View projects they are added to |
| Tasks | Create, assign, delete, change status directly | See all tasks in project; **edit status only on tasks assigned to them** (via approval request) |
| Dashboard | All tasks in their projects | **Only tasks assigned to them** (not unassigned pool tasks) |
| Archived project | Can restore | Read-only view |

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
   CLIENT_URL=http://localhost:3000
   ADMIN_INVITE_CODE=your_optional_admin_code
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
4. As Member: open the project, request status changes on **your assigned** tasks; admin approves from the project page.
5. View **Dashboard** — overdue, **due in 3 days**, priority-sorted recent tasks. Check the **notification bell** after assignments/approvals.
6. Try **comments** on a task, **archive** a project (read-only), and **priority** on new tasks.

## Deployment on Railway (Required)

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for a step-by-step Railway checklist.

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
| `CLIENT_URL` | Your Railway app URL (e.g. `https://your-app.up.railway.app`) |
| `ADMIN_INVITE_CODE` | Optional; required to create additional admin accounts |
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
