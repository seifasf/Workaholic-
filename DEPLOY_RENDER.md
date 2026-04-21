# Deploy Workaholic API on Render

## Prerequisites

- MongoDB Atlas cluster; **Network Access** allows `0.0.0.0/0` (or Render egress IPs).
- Brevo (or other SMTP) credentials if you use email.
- Optional: Cloudinary for leave proof uploads.

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
| `EMAIL_SMTP_USER` | If email | Brevo SMTP login. |
| `EMAIL_PASS` | If email | Brevo SMTP key. |
| `EMAIL_FROM` | If email | Verified sender in Brevo (not `…@smtp-brevo.com`). |
| `IPAPI_KEY` | Optional | ipapi.co key for IP geolocation. |
| `CLOUDINARY_*` | Optional | Leave proof uploads. |

Do **not** set `PORT` — Render injects it.

Optional blueprint: see `render.yaml` in this folder (adjust `rootDir` / region if needed).

## After deploy

- API base URL: `https://<your-service>.onrender.com/api`
- On **Vercel**, set **`VITE_API_URL`** to that full URL (see `frontend/DEPLOY_VERCEL.md`).
- Set **`CLIENT_URL`** on Render to your final Vercel URL(s) so CORS + Socket.io work.

## Free tier notes

- Service spins down after ~15 minutes idle; first request wakes it (slow).
- Socket.io reconnects after wake-up; realtime may briefly disconnect.
