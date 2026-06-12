# Beat Circle — Prelaunch Backend

Express + MongoDB backend for the Beat Circle founding-member waitlist, with a built-in admin panel.

---

## Features

| Area | Details |
|---|---|
| **Waitlist API** | `POST /api/waitlist/submit` — handles Artist, Producer, Music Fan, Brand/Investor |
| **Rate limiting** | Max 3 submissions per IP per hour (in-memory) |
| **Admin login** | JWT-based, 24-hour tokens |
| **Dashboard** | Stats by user type and status |
| **User management** | Search, filter, paginate, approve, reject, delete |
| **CSV export** | Export full or filtered waitlist |
| **Admin panel** | Served at `/admin` — no separate frontend needed |

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and a strong JWT_SECRET
```

### 3. Create the first admin account
```bash
node src/scripts/createAdmin.js <username> <email> <password>

# Example:
node src/scripts/createAdmin.js admin admin@beatcircle.com MyPassword123
```

### 4. Run the server
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Server starts on `http://localhost:5000`
Admin panel → `http://localhost:5000/admin`

---

## API Reference

### Public

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/waitlist/submit` | Submit a waitlist application |
| `GET` | `/health` | Health check |

#### Waitlist body
```json
{
  "userType":    "artist | producer | music_fan | brand_investor",
  "fullName":    "Jane Doe",
  "email":       "jane@example.com",
  "stageName":   "JD",
  "primaryGenre":"Afrobeats",
  "country":     "Nigeria",
  "musicLink":   "https://soundcloud.com/jd"
}
```

### Admin (Bearer token required)

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/admin/login` | Authenticate, receive JWT |
| `GET` | `/api/admin/dashboard` | Aggregated stats + recent entries |
| `GET` | `/api/admin/users` | List entries (search, filter, paginate) |
| `GET` | `/api/admin/users/export` | Download CSV |
| `GET` | `/api/admin/users/:id` | Single entry details |
| `PATCH` | `/api/admin/users/:id/status` | Update status + admin notes |
| `DELETE` | `/api/admin/users/:id` | Remove entry |

#### Query params for `GET /api/admin/users`
| Param | Values |
|---|---|
| `page` | integer (default 1) |
| `limit` | integer (default 25, max 100) |
| `search` | string — searches name, email, stage name |
| `userType` | `artist \| producer \| music_fan \| brand_investor` |
| `status` | `pending \| approved \| rejected` |
| `sortBy` | `createdAt \| fullName \| email \| country \| status` |
| `sortOrder` | `asc \| desc` |

---

## Deployment (Render / Railway / Fly.io)

1. Push to GitHub
2. Set environment variables in your host dashboard
3. Build command: `npm install`
4. Start command: `npm start`

For **CORS**, set `FRONTEND_URL` to your Vercel frontend URL (comma-separated if multiple origins).
