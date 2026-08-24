# Testing report

## Automated coverage

The repository includes:

- Prompt Architect tests for Arabic inference, English output and complete professional structure.
- Structural score tests, including the non-scientific 0–100 boundary.
- Optimizer tests for intent preservation and measurable structural improvement.
- Moderation tests for ordinary business requests, prompt injection review, blocked credential theft/malware and input normalization.
- Prisma schema validation and production compilation in the release checks.

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Local verification result

The implementation revision was verified with:

- ESLint: passed with no warnings or errors.
- TypeScript strict check: passed.
- Vitest: 2 files, 8 tests passed.
- Prisma schema validation and client generation: passed.
- Next.js production build: passed; all localized, protected and API routes compiled.
- Production dependency audit: 0 known vulnerabilities. A patched `deepmerge-ts` override is pinned because the current Prisma release otherwise resolves an advisory-affected transitive version.

MySQL, SMTP, AI-provider and payment-gateway integration tests were not represented as passed without those services. They remain explicit staging checks below.

## Required staging QA

These integration scenarios require configured MySQL, SMTP, AI and payment credentials and must be completed in staging:

- Register, verify email, login, logout, reset password and expire old sessions.
- Enroll TOTP; verify valid, invalid and rate-limited codes; confirm admin MFA enforcement.
- Search Arabic and English terms, filters and zero-result aggregation.
- Create a bilingual prompt product, add variables, submit/publish, and verify premium text is absent from page source and catalog APIs.
- Process successful, failed, duplicate and amount-mismatched payment webhooks.
- Confirm only a signed paid webhook creates an entitlement and Vault access.
- Execute AI success, provider failure, moderation rejection, insufficient credit, retry and fallback.
- Confirm failed AI calls do not add ledger usage.
- Run all workflow steps and verify prior output context and per-step credit charges.
- Test Arabic RTL and English LTR at 320, 360, 390, 430, tablet and desktop widths.
- Test keyboard-only navigation, focus order, labels, contrast and reduced motion.

No fake payment, provider, review, revenue or uptime data is used to make these integration cases appear complete.
