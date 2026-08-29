# ReachInbox.ai Cold Email Scheduler (Frontend)

React + TypeScript + Vite + Tailwind CSS frontend interface for ReachInbox.ai Cold Email Scheduler platform.

## Features
- **Landing / Google OAuth Sign In**: Modern SaaS UI with Google OAuth redirect.
- **Scheduled Email Queue**: Table displaying upcoming email jobs with status badges and cancel actions.
- **Sent Emails Log**: Detailed delivery log displaying sent dates, status, and failure reasons.
- **Elasticsearch Search**: Debounced full-text search across recipients, subjects, body text, and status.
- **Compose Modal**: Single and bulk email scheduling with CSV/TXT email extraction and validation.
- **BullMQ Live Queue Metrics**: Real-time stats card displaying waiting, active, completed, delayed, and failed count.
- **Slack OAuth Card**: Connect/disconnect Slack workspace for rate limit alerts.

## Setup & Run

```bash
# Install dependencies
npm install

# Start Vite Dev Server
npm run dev

# Production Build
npm run build
```
