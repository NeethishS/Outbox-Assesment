# ReachInbox.ai Full-Stack Email Job Scheduler (Backend)

High-precision cold email job scheduling, queue management, and rate-limiting backend platform built with Node.js, TypeScript, Express.js, PostgreSQL (Prisma ORM), Upstash Redis, BullMQ, Nodemailer (Ethereal SMTP), Elasticsearch, Google OAuth, and Slack OAuth.

---

## 🛠️ Required Tech Stack
- **Runtime**: Node.js & TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Queue & Cache**: Redis & BullMQ
- **Email Delivery**: Nodemailer & Ethereal Email SMTP
- **Search Engine**: Elasticsearch API
- **Authentication**: Google OAuth 2.0 & Express Sessions
- **Integrations**: Slack OAuth & Webhooks
- **Dashboard**: Bull Board (`@bull-board/express`)

---

## ⚡ Key Features

1. **Email Scheduling & Bulk Enqueuing**
   - High-performance bulk job creation using `prisma.emailJob.createMany` and `emailQueue.addBulk`.
   - Schedules email jobs with customizable start times, delay parameters, and hourly rate limits.

2. **Atomic Concurrency & Minimum Delay Guard**
   - Redis mutex locking (`lock:sender:${senderId}`) guarantees that dispatches for the same sender maintain a minimum delay (`MIN_EMAIL_DELAY_MS >= 2000ms`) across multiple concurrent BullMQ workers.

3. **Hourly Rate Limiting & Automatic Rescheduling**
   - Redis atomic counter (`INCR rate_limit:sender:${senderId}:${hourKey}`) caps emails per hour (`MAX_EMAILS_PER_HOUR`).
   - Excess emails transition to status `RATE_LIMITED` and are automatically delayed for the next hourly window.

4. **Idempotency & Duplicate Prevention**
   - Database checks (`status === 'SENT'`) and unique idempotency keys prevent duplicate email dispatches.

5. **Elasticsearch Full-Text Search**
   - Search across recipients, subjects, body text, and status with automatic fallback to PostgreSQL query engine.

6. **Slack Integration & Rate-Limit Alerts**
   - Deduplicated real-time Slack notifications when senders exceed hourly rate limit thresholds.

7. **Bull Board Live Dashboard**
   - Live queue administration UI mounted at `/admin/queues`.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL Database URL
- Upstash Redis Connection URL

### 2. Environment Setup
Create a `.env` file in the root of `reachinbox/backend`:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

DATABASE_URL=your_postgresql_url
REDIS_URL=your_upstash_redis_url

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
SESSION_SECRET=your_session_secret
```

### 3. Installation & Run

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:push

# Start API Server
npm run dev

# Start BullMQ Email Worker (in a separate terminal)
npm run worker
```

---

## 📌 API Endpoints

- **Health Check**: `GET /health`
- **Root Status**: `GET /`
- **Google OAuth**: `GET /auth/google` & `GET /auth/google/callback`
- **Current Session User**: `GET /api/auth/me`
- **Logout User**: `POST /api/auth/logout`
- **Schedule Emails**: `POST /api/emails/schedule`
- **Get Scheduled Emails**: `GET /api/emails/scheduled`
- **Get Sent Emails**: `GET /api/emails/sent`
- **Search Emails**: `GET /api/emails/search?q=<query>`
- **Cancel Scheduled Email**: `DELETE /api/emails/:id`
- **Slack OAuth**: `GET /auth/slack/connect` & `GET /auth/slack/callback`
- **Slack Status**: `GET /api/integrations/slack/status`
- **Disconnect Slack**: `DELETE /api/integrations/slack`
- **Queue Statistics**: `GET /api/queue/stats`
- **Bull Board Dashboard**: `GET /admin/queues`
