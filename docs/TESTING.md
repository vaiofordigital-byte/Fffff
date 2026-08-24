# EVELIA testing report

## Automated checks

The suite covers:

- business output structural quality, actionability and evidence discipline;
- server-side moderation for normal business requests, prompt injection, credential theft and malware;
- Company Brain text extraction, normalization, checksum generation and unsupported upload rejection;
- Prisma schema validation and generated type integrity;
- strict TypeScript and Next.js production compilation.

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

## Local verification result

- ESLint: passed with no warnings or errors.
- TypeScript strict check: passed.
- Vitest: 3 files and 8 tests passed.
- Prisma schema validation, migration generation and client generation: passed.
- Next.js optimized production build: passed.
- Production dependency audit: 0 known vulnerabilities.
- Root returned the expected locale redirect; Arabic, English, login, registration and branded icon routes returned HTTP 200.

The local VM does not provide MySQL, SMTP, AI-provider or payment test services. Their integration scenarios are intentionally listed below instead of being represented as passed.

## Staging integration matrix

These scenarios require MySQL, SMTP, a real AI provider and payment test credentials. They must not be reported as passed without those services.

### Identity and organization

- register, email verify, login, logout and password reset;
- enroll and verify TOTP, invalid-code throttling and admin MFA enforcement;
- onboarding creates exactly one organization, Owner membership, free subscription and idempotent credit allocation;
- Owner, Manager, Employee and Viewer permission boundaries;
- suspended organization loses private API access;
- two organizations cannot read each other's knowledge, tasks, reports, projects or usage.

### AI employees and tasks

- activate within plan employee limit and reject activation above it;
- run a task with approved Company Brain context;
- exclude manual-only knowledge from automatic context;
- save successful output, employee usage and ledger transaction;
- provider failure and moderation rejection consume no credits;
- fallback provider runs only when configured;
- private task stores no task text or output;
- refinement points to its parent task.

### Company Brain

- create manual company, product, policy, customer, FAQ and brand-voice entries;
- extract Arabic and English PDF, DOCX, TXT and Markdown;
- reject executable/unsupported types and files above 10 MB;
- deduplicate documents within one organization without cross-organization deduplication;
- confirm no uploaded file is publicly addressable.

### Business intelligence

- score dimensions use actual organization completeness and activity;
- recommendations appear only when their recorded evidence exists;
- weekly report contains actual tasks, failures, usage and recommendations;
- no fabricated revenue, customers or insights appear in empty states.

### Billing

- free plan onboarding;
- monthly and annual hosted checkout;
- signed payment success activates a plan and allocates credits once;
- duplicate webhook does not duplicate subscription or credits;
- amount/currency mismatch is rejected;
- payment failure leaves plan unchanged;
- renewal extends the period and allocates credits once;
- cancellation is scheduled through the provider;
- refund/cancellation updates subscription status.

### Localization and devices

- Arabic RTL and English LTR at 320, 360, 390 and 430 px;
- tablet and desktop business dashboards;
- mobile bottom navigation and task/document forms;
- keyboard-only navigation, skip link, focus order and reduced motion;
- localized validation, empty, error and email states.

## Privacy and security

- task-history deletion removes the requesting user's task content;
- account deletion requires password and exact confirmation;
- shared organization blocks account deletion until ownership/data is transferred;
- payment and legal records remain pseudonymized where retention is required;
- admin audit records omit provider keys, passwords, internal instructions and private business content.
