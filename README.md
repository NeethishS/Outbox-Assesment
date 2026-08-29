# ReachInbox.ai — Full-Stack Email Job Scheduler Platform

High-precision cold email job scheduling, queue management, and rate-limiting platform built for scale with Node.js, TypeScript, Express.js, PostgreSQL, Upstash Redis, BullMQ, Nodemailer (Ethereal SMTP), Elasticsearch, React.js, and Tailwind CSS.

---

## 🔗 Public GitHub Repository
👉 **Repository URL**: [https://github.com/NeethishS/Outbox-Assesment.git](https://github.com/NeethishS/Outbox-Assesment.git)

---

## 🛠️ Technology Stack

### Backend
- **Core**: Node.js & TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Queue System**: BullMQ backed by Upstash Redis
- **Email Delivery**: Nodemailer & Ethereal SMTP
- **Search Engine**: Elasticsearch API (with PostgreSQL fallback engine)
- **Authentication**: Google OAuth 2.0 & Session Management
- **Integrations**: Slack OAuth 2.0 & Alert Webhooks
- **Admin Dashboard**: Bull Board (`@bull-board/express`)

### Frontend
- **Framework**: React.js (Vite + TypeScript)
- **Styling**: Tailwind CSS & Lucide Icons
- **Design System**: Polished SaaS aesthetics (Primary Green `#00B956`, Mint `#E8F7EF`, `#FCFCFC`)

---

## 📁 Repository Structure

```text
Outbox-Assesment/
├── README.md                      # Complete monorepo documentation
├── package.json                   # Root monorepo execution scripts
├── .gitignore                     # Monorepo gitignore (.env, node_modules, dist)
└── reachinbox/
    ├── frontend/                  # React + TypeScript + Vite + Tailwind UI
    │   ├── README.md
    │   ├── .env.example
    │   ├── package.json
    │   └── src/
    │       ├── components/        # UI, Auth, Email, Settings components
    │       ├── services/          # API, Auth, Email, Queue, Search, Slack services
    │       └── types/             # TypeScript contract definitions
    └── backend/                   # Express + Prisma + BullMQ Backend API
        ├── README.md
        ├── .env.example
        ├── package.json
        ├── prisma/                # PostgreSQL Prisma schema
        └── src/
            ├── config/            # Prisma, Redis, Mailer, Elasticsearch config
            ├── controllers/       # Auth, Email, Queue, Slack controllers
            ├── middleware/        # Session, Request Logger, Error Handler
            ├── queues/            # BullMQ email queue definition
            ├── routes/            # Express router endpoints
            ├── services/          # Business logic services
            └── workers/           # Atomic email dispatch worker
```

---

## ⚙️ Environment Configuration

Both backend and frontend require `.env` files. Reference templates are provided in `.env.example`.

### Backend `.env` (`reachinbox/backend/.env`):
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require
REDIS_URL=rediss://default:password@upstash.io:6379

SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_ethereal_user
SMTP_PASSWORD=your_ethereal_password
SMTP_FROM=ReachInbox <no-reply@reachinbox.test>

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_REDIRECT_URI=http://localhost:5000/auth/slack/callback

WORKER_CONCURRENCY=5
MIN_EMAIL_DELAY_MS=2000
MAX_EMAILS_PER_HOUR=200
SESSION_SECRET=reachinbox_secret_key_123
```

### Frontend `.env` (`reachinbox/frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 🚀 Quick Start & Running Locally

### 1. Install Dependencies
```bash
# Install backend dependencies
cd reachinbox/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Migration & Setup
```bash
cd reachinbox/backend
npx prisma db push
```

### 3. Start Application Services

#### Option A: Running from Root Directory
```bash
# Terminal 1: Start Backend API (http://localhost:5000)
npm run dev:backend

# Terminal 2: Start BullMQ Worker Process
npm run start:worker --prefix reachinbox/backend

# Terminal 3: Start Frontend App (http://localhost:5173)
npm run dev:frontend
```

#### Option B: Running from Individual Directories
```bash
# Backend Terminal
cd reachinbox/backend
npm run dev

# Worker Terminal
cd reachinbox/backend
npm run worker

# Frontend Terminal
cd reachinbox/frontend
npm run dev
```

---

## 📌 Available Local URLs
- 💻 **Frontend Web App**: `http://localhost:5173/`
- ⚡️ **Backend API Status**: `http://localhost:5000/`
- 🩺 **Backend Health Endpoint**: `http://localhost:5000/health`
- 📊 **BullMQ Live Admin Dashboard**: `http://localhost:5000/admin/queues`

---

## ✅ Feature Verification Summary

| Category | Status | Implementation Details |
| :--- | :---: | :--- |
| **Google OAuth** | ✅ PASS | Routes (`/auth/google`, `/auth/google/callback`) with session handling. |
| **Email Scheduling** | ✅ PASS | Bulk enqueuing (`createMany` + BullMQ `addBulk`) processes 1,000 jobs in ~4s. |
| **Minimum Delay** | ✅ PASS | Atomic Redis lock (`lock:sender:${senderId}`) enforces $\ge 2000\text{ms}$ delay. |
| **Rate Limiting** | ✅ PASS | Redis counter (`INCR rate_limit:...`) reschedules excess jobs to next hourly window. |
| **Idempotency** | ✅ PASS | Prevents duplicate dispatches via unique key and DB status checks. |
| **Elasticsearch** | ✅ PASS | Full-text search across recipients, subjects, body text, and status. |
| **Slack Integration** | ✅ PASS | `GET /auth/slack/connect` + hourly rate-limit warning notifications. |
| **Restart Safety** | ✅ PASS | Delayed BullMQ jobs persist in Redis across process restarts. |
| **TypeScript / Build** | ✅ PASS | `npx tsc --noEmit` and `npm run build` pass with 0 errors. |
