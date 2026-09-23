# 🚀 Powerhouse — Internal Company Announcement & Compliance PWA

**Powerhouse** is an enterprise-grade Progressive Web App (PWA) designed for modern companies to broadcast announcements, manage policy sign-offs, track mandatory read receipts, and synchronize company calendars.

Built with **Next.js 16 (App Router + Turbopack)**, **TypeScript**, **Vanilla CSS Design System**, **Supabase (PostgreSQL + RLS)**, and optimized for **Vercel** deployment.

---

## 📸 Key Features

- 🏠 **Home Announcement Feed**
  - Pulsating urgent alert banner for critical security/office closure notices.
  - Pinned announcement carousel & priority badges (🔴 Urgent, 🟡 Important, 🟢 General).
  - Multi-category filtering: **HR Policies**, **IT & Security**, **Town Hall**, **Events**, **General**.
  - Real-time search across titles, summaries, tags, departments, and authors.
- 📰 **Detailed Announcement View**
  - Rich markdown content rendering with attachments preview (PDFs, guides).
  - **Mandatory Policy Sign-Off ("Must-Read")**: Tracks exact timestamp and logs audit compliance when employees click *"I have read and understood"*.
  - Interactive lightweight emoji reactions (`👍`, `❤️`, `👏`, `🎉`, `💡`).
  - Threaded comment section with toggle moderation.
- 📅 **Company Calendar & .ics Export**
  - Integrated company deadlines, office closures, holidays, town halls, and social tech talks.
  - One-click **.ICS Calendar Download** (compatible with Apple Calendar & Outlook).
  - Instant **"Add to Google Calendar"** web links.
- 📁 **Department & Category Hubs**
  - Dedicated sub-hubs for **People & HR**, **IT Operations & Security**, **Leadership Town Hall**, and **Culture**.
  - Direct links to verified company documents (Employee Handbook, VPN guides, AMA Slido).
- ⚙️ **Admin Console & Compliance Analytics**
  - Full post lifecycle management: **Active**, **Scheduled**, **Drafts**, **Archived**.
  - **Read Receipts & Compliance Audit Modal**: Real-time sign-off progress bar (e.g. 75% completed), per-employee status filter (All, Signed, Pending), and **one-click CSV audit export**.
  - Built-in **Role Persona Switcher** (Super Admin, HR Admin, Contributor, Viewer / Employee) to test permissions easily.
- ✍️ **Rich Post Editor & Audience Targeting**
  - Live markdown editor with formatting toolbars.
  - Audience targeting by **Department** (Engineering, HR, Sales, Design) or **Location** (Bangkok HQ, Singapore, Tokyo, Remote).
  - Scheduling & auto-archive expiration dates.
  - Slack & Microsoft Teams webhook broadcasting.
- 📱 **Progressive Web App (PWA)**
  - Fully installable on iOS, Android, macOS, and Windows with standalone display.
  - Service worker caching for fast offline shell access.

---

## 🗄️ Supabase Setup (`db.sql`)

The repository includes a ready-to-execute `db.sql` script containing the complete database schema, enums, Row-Level Security (RLS) policies, triggers, and starter seed data.

### Step-by-Step Instructions:
1. Log in to [Supabase](https://supabase.com) and create a new project.
2. Go to the **SQL Editor** tab in the left sidebar.
3. Open [`db.sql`](./db.sql) from this repository, copy its entire contents, paste it into the Supabase SQL editor, and click **Run**.
4. Go to **Project Settings > API** to retrieve your:
   - `Project URL`
   - `anon` `public` key
   - `service_role` `secret` key

---

## ⚙️ Environment Variables Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Configure your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# (Optional) Slack / Teams Webhooks
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
TEAMS_WEBHOOK_URL=
```

> **Note**: If you run Powerhouse without setting Supabase keys, the app seamlessly runs in **Demo Mode**, using persistent in-memory/localStorage state so you can test all features and role-switching immediately!

---

## 💻 Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Deploying to Vercel

1. **Push your code to GitHub / GitLab**:
   ```bash
   git add .
   git commit -m "feat: complete Powerhouse announcement PWA"
   git push origin main
   ```

2. **Deploy on Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New Project"**.
   - Import your GitHub repository.
   - Under **Environment Variables**, add:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY` (optional)
     - `SLACK_WEBHOOK_URL` (optional)
   - Click **Deploy**.
   - Your PWA will be live with a production HTTPS URL in under 60 seconds!

---

## 📱 Installing the PWA

- **iOS / Safari**: Open your deployed URL, tap the **Share** button (⎙), and select **"Add to Home Screen"**.
- **Android / Chrome**: Tap the **"Install Powerhouse App"** banner at the bottom or the 3-dots menu -> **"Install app"**.
- **Desktop (Chrome / Edge / Safari)**: Click the **Install** icon in the browser address bar.

---

## 🔒 Security & Compliance

- **Row Level Security (RLS)**: Enforced directly on PostgreSQL for multi-tenant safety.
- **Audit Trails**: Sign-offs are immutably timestamped with user ID, user agent, and timestamp.
- **Role Isolation**: Enforces viewer, contributor, HR admin, and super admin privilege boundaries.
