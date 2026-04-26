# Workaholic API Documentation

## Base URL

- **Production (Render)**: `https://workaholic-v2l5.onrender.com`
- **API base**: `https://workaholic-v2l5.onrender.com/api`

## Authentication

This API uses **Bearer JWT** authentication.

- **Header**: `Authorization: Bearer <token>`
- Get a token via `POST /api/auth/login` or `POST /api/auth/register`

### Roles

Some endpoints require a specific role:

- **employee**
- **hr**
- **admin**

If your role is insufficient you will receive:

- `403 { "message": "Access denied: insufficient role" }`

### Common auth errors

- Missing token:
  - `401 { "message": "Not authorized, no token" }`
- Invalid/expired token:
  - `401 { "message": "Token invalid or expired" }`

## Content Types

- JSON endpoints use `Content-Type: application/json`
- File upload endpoint uses `multipart/form-data`

## Health

### GET `/api/health`

Returns service status.

**Response 200**

```json
{ "status": "ok", "time": "2026-04-21T14:20:40.419Z" }
```

---

## Auth (`/api/auth`)

### POST `/api/auth/register`

Public self-registration. Always creates an **employee** account.

**Body (JSON)**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123",
  "department": "Engineering",
  "position": "Frontend",
  "workStartTime": "09:00"
}
```

**Response 201**

```json
{
  "token": "<jwt>",
  "user": {
    "_id": "...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "employee",
    "department": "Engineering",
    "position": "Frontend",
    "avatar": "",
    "workStartTime": "09:00",
    "vacationBalance": 21,
    "kpiScore": 100,
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Errors**

- `400 { "message": "Name, email and password are required" }`
- `400 { "message": "Password must be at least 6 characters" }`
- `400 { "message": "Email already registered" }`

### POST `/api/auth/register/admin` (admin/hr)

Create a user with a specific role (protected).

- **Auth**: required
- **Role**: `admin` or `hr`

**Body (JSON)**

```json
{
  "name": "New Employee",
  "email": "new@example.com",
  "password": "secret123",
  "role": "employee",
  "department": "Engineering",
  "position": "Backend",
  "workStartTime": "09:00"
}
```

**Response 201**

```json
{ "token": "<jwt>", "user": { /* User */ } }
```

**Errors**

- `400 { "message": "Email already registered" }`
- `403 { "message": "Access denied: insufficient role" }`

### POST `/api/auth/login`

**Body (JSON)**

```json
{ "email": "jane@example.com", "password": "secret123" }
```

**Response 200**

```json
{ "token": "<jwt>", "user": { /* User */ } }
```

**Errors**

- `401 { "message": "Invalid email or password" }`

### GET `/api/auth/me`

- **Auth**: required

**Response 200**

Returns the current user (no password).

### PATCH `/api/auth/profile`

- **Auth**: required

**Body (JSON)** (any subset)

```json
{ "name": "Jane", "department": "HR", "position": "Specialist", "workStartTime": "09:00" }
```

**Response 200**: updated user document.

### PATCH `/api/auth/avatar`

Upload/update the current user's avatar.

- **Auth**: required
- **Content-Type**: `multipart/form-data`
- **Form field**: `avatar` (file)

**Response 200**

```json
{ "avatar": "data:<mime>;base64,...", "user": { /* User */ } }
```

**Errors**

- `400 { "message": "No image file provided" }`

---

## Attendance (`/api/attendance`)

All attendance endpoints require authentication.

### POST `/api/attendance/clock-in`

- **Auth**: required

**Body (JSON)** (GPS optional)

```json
{ "lat": 30.0444, "lng": 31.2357 }
```

**Response 200**

```json
{
  "record": { /* AttendanceRecord */ },
  "locationVerified": true,
  "gpsVerified": true,
  "latenessMinutes": 0,
  "status": "on-time"
}
```

**Errors**

- `400 { "message": "Already clocked in today" }`

### POST `/api/attendance/clock-out`

- **Auth**: required

**Body (JSON)** (GPS optional)

```json
{ "lat": 30.0444, "lng": 31.2357 }
```

**Response 200**

Returns the updated attendance record.

**Errors**

- `400 { "message": "You have not clocked in yet" }`
- `400 { "message": "Already clocked out today" }`

### GET `/api/attendance/history`

- **Auth**: required
- **Query params**:
  - `page` (default `1`)
  - `limit` (default `20`)

**Response 200**

```json
{ "records": [/* AttendanceRecord */], "total": 0, "page": 1, "pages": 0 }
```

### GET `/api/attendance/today`

- **Auth**: required

**Response 200**

Returns today’s attendance record or `null`.

### GET `/api/attendance/my-stats`

- **Auth**: required

**Response 200**

Returns chart-ready stats for the current month:

```json
{
  "dailyHours": [{ "date": "YYYY-MM-DD", "day": "Mon 1", "hours": 0, "status": "on-time" }],
  "breakdown": { "on-time": 0, "late": 0, "early-leave": 0, "absent": 0 },
  "weeklyTrend": [{ "week": "Week 1", "latenessMinutes": 0, "daysPresent": 0 }],
  "totalRecords": 0
}
```

### GET `/api/attendance/live` (admin/hr)

- **Auth**: required
- **Role**: `admin` or `hr`

Returns today’s currently clocked-in employees (no clock-out yet).

### GET `/api/attendance/admin` (admin/hr)

- **Auth**: required
- **Role**: `admin` or `hr`
- **Query params**:
  - `userId` (optional)
  - `startDate` (optional, `YYYY-MM-DD`)
  - `endDate` (optional, `YYYY-MM-DD`)

---

## Leave (`/api/leave`)

### POST `/api/leave/request`

Create a leave request (optionally with proof upload).

- **Auth**: required
- **Content-Type**: `multipart/form-data`
- **Form fields**:
  - `type`: `vacation | sick | emergency | other`
  - `startDate`: date
  - `endDate`: date
  - `reason`: string (optional)
  - `proof`: file (optional)

**Response 201**: created `LeaveRequest`.

**Errors**

- `400 { "message": "Insufficient vacation balance" }`

### GET `/api/leave/my-leaves`

- **Auth**: required

Returns your leave requests (latest first).

### GET `/api/leave/balance`

- **Auth**: required

```json
{ "vacationBalance": 21 }
```

### GET `/api/leave/all` (admin/hr)

- **Auth**: required
- **Role**: `admin` or `hr`
- **Query params**:
  - `status` (optional): `pending | approved | rejected`
  - `userId` (optional)

### PATCH `/api/leave/:id/approve` (admin/hr)

- **Auth**: required
- **Role**: `admin` or `hr`

**Body (JSON)** (optional)

```json
{ "adminComment": "Approved" }
```

**Errors**

- `404 { "message": "Leave not found" }`
- `400 { "message": "Already reviewed" }`

### PATCH `/api/leave/:id/reject` (admin/hr)

- **Auth**: required
- **Role**: `admin` or `hr`

**Body (JSON)** (optional)

```json
{ "adminComment": "Not eligible" }
```

**Errors**

- `404 { "message": "Leave not found" }`
- `400 { "message": "Already reviewed" }`

---

## KPI (`/api/kpi`)

### GET `/api/kpi/my-score`

- **Auth**: required
- **Query params**:
  - `month` (optional, 1-12; defaults to current)
  - `year` (optional; defaults to current)

Returns your KPI score (computes it on demand if missing).

### GET `/api/kpi/team` (admin/hr)

- **Auth**: required
- **Role**: `admin` or `hr`
- **Query params**:
  - `month` (optional)
  - `year` (optional)

### GET `/api/kpi/report/:userId` (admin/hr)

- **Auth**: required
- **Role**: `admin` or `hr`

Returns up to 12 KPI entries for the user.

### POST `/api/kpi/compute` (admin)

- **Auth**: required
- **Role**: `admin`

**Body (JSON)** (optional)

```json
{ "month": 4, "year": 2026 }
```

**Response 200**

```json
{ "message": "KPI computed", "count": 0 }
```

---

## Admin (`/api/admin`)

### GET `/api/admin/dashboard` (admin/hr)

- **Auth**: required
- **Role**: `admin` or `hr`

Returns dashboard aggregates (attendance counts, pending leaves, team KPI, etc).

### GET `/api/admin/users` (admin/hr)

- **Auth**: required
- **Role**: `admin` or `hr`
- **Query params**:
  - `role` (optional): `employee | hr | admin`
  - `department` (optional)

### POST `/api/admin/users` (admin)

- **Auth**: required
- **Role**: `admin`

**Body (JSON)**

```json
{
  "name": "User",
  "email": "user@example.com",
  "password": "secret123",
  "role": "employee",
  "department": "Engineering",
  "position": "Backend",
  "workStartTime": "09:00"
}
```

### PATCH `/api/admin/users/:id` (admin)

- **Auth**: required
- **Role**: `admin`

Body supports fields:
`name`, `role`, `department`, `position`, `workStartTime`, `vacationBalance`, `isActive`

### DELETE `/api/admin/users/:id` (admin)

- **Auth**: required
- **Role**: `admin`

Soft-deactivates the user.

```json
{ "message": "User deactivated" }
```

---

## Notifications (`/api/notifications`)

All notification endpoints require authentication.

### GET `/api/notifications`

Returns up to 30 notifications (latest first).

### GET `/api/notifications/unread-count`

```json
{ "count": 0 }
```

### PATCH `/api/notifications/mark-read`

Marks all unread notifications as read.

```json
{ "message": "Marked all as read" }
```

---

## Data Models (high level)

### User

Key fields:

- `name` (string)
- `email` (string)
- `role` (`employee|hr|admin`)
- `department`, `position` (string)
- `avatar` (string; data URL)
- `workStartTime` (string, `HH:mm`)
- `vacationBalance` (number)
- `kpiScore` (number)
- `isActive` (boolean)

### AttendanceRecord

Key fields:

- `userId` (User ref)
- `date` (string `YYYY-MM-DD`)
- `clockIn` / `clockOut` objects with `time`, `coords`, `ip`
- `gpsVerified`, `ipVerified`, `locationVerified` (boolean)
- `hoursWorked` (number)
- `latenessMinutes` (number)
- `status` (`on-time|late|early-leave|absent`)

### LeaveRequest

Key fields:

- `userId` (User ref)
- `type` (`vacation|sick|emergency|other`)
- `startDate`, `endDate` (Date)
- `daysRequested` (number)
- `status` (`pending|approved|rejected`)
- `adminComment` (string)
- `proofUrl` (string)

### KPIScore

Key fields:

- `userId` (User ref)
- `month` (number)
- `year` (number)
- `punctualityScore`, `attendanceScore`, `leaveDeductionScore`, `totalScore`
- `daysPresent`, `daysAbsent`, `totalLatenessMinutes`, `workingDays`

### Notification

Key fields:

- `userId` (User ref)
- `message` (string)
- `type` (`leave-approved|leave-rejected|late-alert|kpi-update|general`)
- `read` (boolean)
- `link` (string)

