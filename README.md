# NexSub – Intelligent Subscription Management System
Video Link - https://drive.google.com/file/d/1fEDyrsUs6BugdT-Vga05vmFGLuqLBaIL/view?usp=drivesdk

> One platform to run plans, subscriptions and recurring billing: from catalog setup to invoices, payments and revenue reporting.

## The Problem

NexSub is a unified subscription management platform designed to automate the complete subscription lifecycle for businesses.
It replaces spreadsheets, manual invoicing, and disconnected payment tracking with a centralized system that enables admins, staff, customers, and finance teams to manage subscriptions efficiently.

## The Solution

NexSub is a unified subscription management platform designed to simplify and automate the complete subscription lifecycle for businesses. It enables admins to manage products, plans, pricing, variants, taxes, and discounts while allowing staff to handle customer subscriptions, quotations, invoices, and payments. The system automates recurring billing, invoice generation, subscription renewals, and payment tracking, reducing manual errors and missed renewals. It also provides a customer self-service portal where users can manage their subscriptions and view invoices, along with a centralized analytics dashboard for tracking active subscriptions, revenue, outstanding payments, and overdue invoices. Built with a scalable architecture, NexSub aims to streamline subscription operations, improve financial visibility, and deliver an efficient billing experience for businesses.

```
Catalog -> Quotation -> Subscription -> Auto-Invoice -> Payment -> Revenue Reporting
```

## Key Features

**Core**
- Role-based access: **Admin**, **Staff**, **Customer** (own data only)
- Secure auth with password rules, unique emails and email-based password reset
- Products with variants (e.g. Brand = Odoo adds 560), plans (daily/weekly/monthly/yearly) with per-plan close, pause and renew rules
- Quotation templates with validity period
- Subscription lifecycle: `Draft -> Quotation -> Confirmed -> Active -> Closed`
- Automated invoice generation with taxes and discounts applied by rule
- Invoice lifecycle: `Draft -> Confirmed -> Paid` (confirm, cancel, send, print PDF)
- Discount rules (fixed or percent, min purchase or quantity, date window, usage limit)
- Payment recording (method, amount, date, note) with outstanding and overdue tracking
- Finance dashboard: active subscriptions, revenue, outstanding, overdue, with filters

**Differentiators**
- **Idempotent billing:** a unique compound index on `(subscription, periodStart)` guarantees nothing is billed twice; catch-up logic guarantees nothing is skipped
- **Billing Run console** with dry-run preview and per-subscription result log
- **Demo Clock** to simulate a whole billing month in minutes without changing system time
- **Margin guard** warns when a discount drops below the cost-based floor
- **Price explainer** shows how every invoice line was calculated
- **Optional AI (Claude API):** natural-language report queries and dunning email drafts, behind a feature flag; billing works with AI off

## Architecture

```mermaid
flowchart TD
    A[React + Vite SPA<br/>Admin / Staff / Customer Portal] -->|HTTPS + JWT| B[Express REST API<br/>modular monolith]
    B --> C[(MongoDB<br/>Mongoose)]
    B --> D[Scheduler<br/>node-cron: billing, snapshots]
    D --> C
    B --> F[Live-metrics RAG<br/>retrieve relevant billing facts]
    F -.optional.-> E[Claude API<br/>grounded chat, dunning drafts]
    B -.fallback.-> G[Embedded response engine<br/>works without Claude]
```

**Billing run flow**

```
Cron job or "Run now"
  -> atomically claim ACTIVE subscriptions with nextBillingDate <= run date
     (findOneAndUpdate sets a short lock lease, so parallel runs never grab the same one)
  -> per subscription, in one transaction/session:
       price -> discount -> tax (pricing engine)
       insert invoice (unique on subscription + periodStart)
       increment discount usage (guarded: usedCount < usageLimit)
       advance nextBillingDate (loop until caught up)
       auto-close if expired and plan allows
  -> log result: CREATED | SKIPPED_DUPLICATE | FAILED(reason)
```

## Tech Stack

| Technology | Use |
|---|---|
| React.js + Vite | Frontend SPA |
| Tailwind CSS | Premium UI Styling |
| Recharts | Interactive Financial Analytics |
| Lucide React | Modern Iconography |
| Node.js + Express.js | Backend REST API |
| MongoDB + Mongoose | Database & Aggregations |
| JWT + bcrypt | Secure Authentication |
| Zod | Request & Data Validation |
| PDFKit | Invoice & Quotation PDF Generation |
| Nodemailer | Transactional Emails & Password Reset |
| node-cron | Automated Billing Engine Scheduler |
| Helmet, CORS, Rate Limit | API Security Hardening |
| Anthropic Claude SDK / Google Gemini API | Optional AI Assistant Integration |
| Deterministic RAG pipeline | Retrieves live billing metrics before AI generation, with a local fallback |

## Project Structure

```
.
├── client/                     # React + Vite
│   └── src/
│       ├── pages/              # admin/, staff/, portal/, auth/
│       ├── components/         # tables, status chips, charts, modals
│       ├── hooks/ api/ routes/ # data fetching, axios client, role-guarded routes
│       └── main.jsx
├── server/
│   └── src/
│       ├── modules/            # auth, users, catalog, rules, quotations, subscriptions,
│       │                       # pricing, billing, invoices, payments, reports, ai
│       ├── models/             # Mongoose schemas
│       ├── middleware/         # auth, rbac, validate, error handler
│       ├── jobs/               # billing scheduler, daily metrics snapshot
│       ├── seed/               # demo data generator
│       └── app.js
├── docker-compose.yml          # MongoDB (replica set), server, client
├── .env.example
└── README.md
```

## Roadmap & Checklist

- [x] Auth, RBAC, staff management
- [x] Catalog: products, variants, plans
- [x] Taxes, discounts, quotation templates
- [x] Subscription and invoice state machines
- [x] Idempotent billing run engine
- [x] Billing Run Console & Dry Run mode
- [x] Payments and overdue tracking
- [x] Smart payment recovery (Dunning & retries)
- [x] Finance dashboard and customer portal
- [x] Demo Clock simulation engine
- [x] Optional AI reports and dunning generation
- [x] RAG-grounded AI chat over live subscription, revenue, customer and overdue-invoice metrics
- [x] Docker & CI/CD workflow

### Gemini configuration

Copy the relevant settings from `.env.example` into a local `.env` file and add your
Gemini key without committing it:

```env
AI_FEATURES_ENABLED=true
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-2.0-flash
GEMINI_API_KEY=your_gemini_api_key
```

The key is used only by the server. If Gemini is unavailable or disabled, the
RAG-grounded embedded response engine remains available.

## Assumptions

1. Plan price applies to the plan's main product line; add-on lines use product sales price plus variant extra. Prices are snapshotted on the line.
2. Taxes are exclusive by default and resolved by rule (product, product type, default).
3. Overdue is derived (`Confirmed` and `dueDate < today` and `amountDue > 0`), never stored.
4. One line-level plus one subscription-level discount per invoice; best value wins at each level.
5. Partial payments allowed; invoice is `Paid` only when `amountDue = 0`.
6. Pause stops invoice generation; resume re-anchors the next billing date.

## Demo Credentials

- **Admin**: `admin@nexsub.com` / `Admin@12345`
- **Staff**: `staff@nexsub.com` / `Staff@12345`
- **Customer**: `acme@example.com` / `Customer@12345` (and 20+ other seeded customers)

## Team Responsibilities

| Name | Role | Responsibilities |
|---|---|---|
| **Aditya Jurel** | Backend Architect | Authentication, RBAC, Catalog, Deployment & Docker |
| **Anupam Dwivedi** | Backend Engineer | Pricing Engine, State Machines, Idempotent Billing Runs & Payments |
| **Avichal Bajpai** | Frontend & UI/UX | Admin Dashboard, Staff Consoles, Customer Portal & Demo Clock |
