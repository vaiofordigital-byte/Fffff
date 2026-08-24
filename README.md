# PROMPTX

PROMPTX is an Arabic-first AI prompt operating system: a bilingual marketplace, prompt architect and optimizer, protected prompt vault, project context system, multi-step workflows, subscriptions/credits architecture, and administration console.

## Stack

- Next.js App Router, React, TypeScript and Tailwind CSS
- MySQL/MariaDB with Prisma ORM
- Opaque database-backed sessions, Argon2id passwords and TOTP MFA
- Adapter layers for OpenAI-compatible AI providers and hosted payment gateways
- Vitest unit tests

Arabic routes are under `/ar` with native RTL rendering. English routes are under `/en`.

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

Set all database fields in `.env`. Generate secrets rather than copying the placeholders:

```bash
openssl rand -hex 32
openssl rand -base64 32
```

Use the first for `SECURITY_HASH_PEPPER` and the 32-byte Base64 output for `ENCRYPTION_KEY`.

To create the first administrator, set `BOOTSTRAP_ADMIN_EMAIL` and a strong `BOOTSTRAP_ADMIN_PASSWORD` before running the seed. The administrator is required to configure TOTP MFA before opening the admin console.

## Real integrations

Features never pretend that an integration is available:

- AI execution is disabled until `AI_API_BASE_URL`, `AI_API_KEY`, and `AI_MODEL` are configured. Prompt architecture and structural optimization remain available because they run locally.
- Checkout is disabled while `PAYMENT_PROVIDER=none`. A gateway adapter must implement the documented hosted-checkout and signed-webhook contract.
- Transactional email records a delivery failure until valid SMTP settings are supplied.

Premium prompt content is selected only by the protected entitlement endpoint and is never included in marketplace HTML or public catalog responses.

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
- [Deployment](docs/DEPLOYMENT.md)
- [Security checklist](docs/SECURITY.md)
- [Testing report](docs/TESTING.md)
- [Backup and recovery](docs/BACKUP-RECOVERY.md)

## Important product behavior

- Prompt Intelligence Score is a structural quality indicator. It is not scientific and does not guarantee model accuracy.
- AI credits are ledger-backed and deducted only after a successful provider response.
- Payment success pages never grant access; only verified, idempotent webhooks create entitlements.
- Private generations store a hash and operational metadata, not generated content.
- Reviews require both a verified purchase and moderation before publication.
