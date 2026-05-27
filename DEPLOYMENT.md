# Railway deployment guide

Deploy **Team Task Manager** as a single web service (API + React static build).

## Prerequisites

- GitHub repo: [EtharaAIProject](https://github.com/Rishabhhraj/EtharaAIProject)
- [Railway](https://railway.app) account

## 1. Create Railway project

1. **New Project** → **Deploy from GitHub repo** → select `EtharaAIProject`.
2. Railway detects `railway.json` and runs:
   - **Build:** `npm run install:all && npm run build`
   - **Start:** `npm start` (Express serves API + `frontend/dist`)

## 2. Add MongoDB

1. In the project, **+ New** → **Database** → **MongoDB**.
2. Open the MongoDB service → **Variables** → copy `MONGO_URL` or `MONGODB_URI`.

## 3. Configure web service variables

On the **web** service (not the DB), set:

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Paste from Railway MongoDB plugin |
| `JWT_SECRET` | Long random string (e.g. 32+ chars) |
| `CLIENT_URL` | Your app URL after step 4, e.g. `https://etharaai-production.up.railway.app` |
| `ADMIN_INVITE_CODE` | Optional; code for extra admin signups |
| `AUTH_RATE_LIMIT_MAX` | Optional; default `30` |

Do **not** set `USE_EMBEDDED_MONGO` in production.

## 4. Generate public URL

1. Web service → **Settings** → **Networking** → **Generate Domain**.
2. Copy the URL and set `CLIENT_URL` to that exact origin (no trailing slash).
3. Redeploy if you changed `CLIENT_URL` after the first deploy.

## 5. Verify deployment

- `GET https://YOUR_DOMAIN/api/health` → `{ "success": true, ... }`
- Open `https://YOUR_DOMAIN` → login/signup UI
- Sign up (first user = admin), create a project, add tasks

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails | Check Railway build logs; ensure Node 18+ |
| `JWT_SECRET` / `MONGODB_URI` fatal | Set both env vars on web service |
| CORS errors | `CLIENT_URL` must match browser URL exactly |
| Blank page | Confirm build created `frontend/dist`; check deploy logs |
| Data resets | You used embedded Mongo locally; production needs Railway MongoDB |

## Submission

Include in your assignment:

- Live Railway URL
- GitHub repo link
- README + this file
- 2–5 min demo video
