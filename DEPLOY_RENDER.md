# Deploy Workaholic API on Render

## Prerequisites

- MongoDB Atlas cluster; **Network Access** allows `0.0.0.0/0` (or Render egress IPs).
- **Brevo SMTP** (recommended) for transactional email — see below.
- Leave proof files are stored **in MongoDB** (no Cloudinary).

## Create the Web Service

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Web Service**.
2. Connect your Git repository.
3. **Root Directory:** leave empty (this repo is the backend). If you later make a monorepo, set it to the backend folder name.
4. **Runtime:** Node.
5. **Build Command:** `npm ci`
6. **Start Command:** `npm start`
7. **Instance type:** Free (cold starts ~50s after idle).

## Health check

Set **Health Check Path** to: `/api/health`

## Environment variables

Add these in **Render → your service → Environment**:

| Variable | Required | Notes |
|----------|----------|--------|
| `MONGO_URI` | Yes | Atlas connection string with DB name in path. |
| `JWT_SECRET` | Yes | Long random string. |
| `JWT_REFRESH_SECRET` | Yes | Different long random string. |
| `CLIENT_URL` | Yes | Your Vercel URL, e.g. `https://your-app.vercel.app`. For multiple origins (preview + prod), comma-separated, no spaces: `https://a.vercel.app,https://b.vercel.app` |
| `OFFICE_LAT` / `OFFICE_LNG` / `OFFICE_RADIUS_KM` | Recommended | Geo attendance. |
| `EMAIL_SMTP_USER` | If email | Brevo **SMTP login** (Brevo Dashboard → SMTP & API; often looks like `xxxxxx@smtp-brevo.com`). |
| `EMAIL_PASS` | If email | Brevo **SMTP key** (same screen; keep secret — set only in Render, never commit). |
| `EMAIL_FROM` | If email | **Verified sender** in Brevo (Senders tab) — the visible “From” address (must not be `…@smtp-brevo.com`). |
| `SMTP_HOST` | Optional | Default `smtp-relay.brevo.com`. |
| `SMTP_PORT` | Optional | Default `587` (STARTTLS). |
| `IPAPI_KEY` | Optional | ipapi.co key for IP geolocation. |

### Brevo (external SMTP) — quick setup

1. Brevo → **Settings → SMTP & API** → copy **SMTP login** and **SMTP key**.
2. Brevo → **Senders** → add/verify the address you will use as **`EMAIL_FROM`**.
3. On Render, set `EMAIL_SMTP_USER`, `EMAIL_PASS`, `EMAIL_FROM` as in the table above.

The app uses Nodemailer with **port 587 + STARTTLS** against `smtp-relay.brevo.com` (see `config/email.js`).

Do **not** set `PORT` — Render injects it.

Optional blueprint: see `render.yaml` in this folder (adjust `rootDir` / region if needed).

## After deploy

- API base URL: `https://<your-service>.onrender.com/api`
- On **Vercel**, set **`VITE_API_URL`** to that full URL (see `frontend/DEPLOY_VERCEL.md`).
- Set **`CLIENT_URL`** on Render to your final Vercel URL(s) so CORS + Socket.io work.

## Free tier notes

- Service spins down after ~15 minutes idle; first request wakes it (slow).
- Socket.io reconnects after wake-up; realtime may briefly disconnect.
