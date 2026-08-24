# EVELIA Intelligence

EVELIA is an Arabic-first AI Business Operating System for modern companies. Businesses activate specialized AI employees, give them approved company knowledge, assign real work and review outputs, reports, recommendations and usage from one operating dashboard.

## Product modules

- Specialized AI employees for marketing, customer service, sales, content, e-commerce and business analysis
- Organization-isolated Company Brain with manual knowledge and PDF, DOCX, TXT and Markdown extraction
- Business tasks, private mode, refinements, projects and multi-step workflows
- Actual-data Business Intelligence Score, recommendations and weekly reports
- Industry packages for e-commerce, restaurants, real estate and agencies
- Organization members with Owner, Manager, Employee and Viewer roles
- Ledger-based AI credits, configurable plans, hosted subscription checkout and signed webhook processing
- Arabic RTL and English LTR public, workspace, email and administration experiences
- MFA-protected administration for companies, employees, providers, costs, CMS and audit logs

EVELIA does not fabricate AI results or integrations. AI, email and paid billing remain disabled until real credentials are configured.

## Stack

- Next.js App Router, React, TypeScript and Tailwind CSS
- MySQL/MariaDB with Prisma ORM
- Database-backed opaque sessions, Argon2id passwords and encrypted TOTP MFA
- OpenAI-compatible provider adapter with encrypted database configuration and fallback support
- Hosted payment adapter with idempotent signed webhooks
- Vitest unit tests

## Local setup

Requirements: Node.js 22+, npm, and MySQL 8 or MariaDB 10.6+.

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

Generate unique security values:

```bash
openssl rand -hex 32
openssl rand -base64 32
```

Use the first for `SECURITY_HASH_PEPPER` and the 32-byte Base64 output for `ENCRYPTION_KEY`.

Set `BOOTSTRAP_ADMIN_EMAIL` and a strong `BOOTSTRAP_ADMIN_PASSWORD` for the first seed only. Administrative accounts must enroll TOTP before entering the control center.

## Real integrations

- AI tasks require an enabled provider in Admin → AI or complete `AI_API_*` environment values.
- Paid plans require a compatible hosted payment adapter and webhook secret. Free onboarding works without billing.
- Verification, recovery and event email require SMTP.
- Document extraction runs synchronously inside supported Hostinger-compatible Node.js requests; no permanent worker is required.

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:seed
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Hostinger deployment](docs/HOSTINGER_DEPLOYMENT.md)
- [Security checklist](docs/SECURITY.md)
- [Testing report](docs/TESTING.md)
- [Backup and recovery](docs/BACKUP-RECOVERY.md)

## Important behavior

- Business Intelligence Score is an explainable guidance indicator based on real data completeness and usage. It is not scientific.
- Credits are deducted only after successful AI execution.
- Private tasks do not persist task text or output.
- Company knowledge is scoped by organization and selected only after server-side membership checks.
- Payment success pages never activate plans; only signed, idempotent webhooks do.
