# Security checklist

## Identity

- [x] Argon2id password hashing with memory and time cost.
- [x] Opaque, hashed database session tokens in HttpOnly, Secure, SameSite cookies.
- [x] Email verification and single-use expiring reset tokens.
- [x] Per-IP and per-account login throttling.
- [x] TOTP MFA with encrypted secrets; required for administration.
- [x] Session invalidation after password reset.
- [ ] Add recovery codes before offering self-service MFA reset.

## Authorization and data

- [x] Role hierarchy and server-side administrative checks.
- [x] Ownership checks for projects, context and workflow runs.
- [x] Premium content omitted from public queries and returned only after entitlement checks.
- [x] Private generation content is not persisted or indexed.
- [x] Admin audit logs omit passwords, API keys and premium content.
- [x] Prisma parameterized queries prevent SQL injection.

## Request security

- [x] Same-origin enforcement for authenticated mutations.
- [x] Zod validation and size limits on external input.
- [x] CSP, HSTS, frame denial, content-type and referrer headers.
- [x] Raw-body payment signature verification.
- [x] Payment amount/currency verification and event idempotency.
- [x] Order, payment, credit and entitlement uniqueness constraints.
- [ ] Replace the database rate limiter with a shared atomic limiter if traffic exceeds the single-database target.

## Secrets

- [x] No client-side provider, payment or SMTP secrets.
- [x] AES-256-GCM encryption for TOTP secrets.
- [x] Environment template contains placeholders only.
- [ ] Rotate production webhook, encryption, SMTP and provider secrets under an incident-response policy.

## Before production

1. Generate unique `SECURITY_HASH_PEPPER` and `ENCRYPTION_KEY`.
2. Configure HTTPS and verify HSTS at the public edge.
3. Verify the CSP against the final analytics and payment domains; keep the allowlist minimal.
4. Configure SMTP before accepting registrations.
5. Test payment webhook replay, amount mismatch, failed payment and refund.
6. Complete an external penetration test and dependency review.
7. Document privacy retention periods and jurisdiction-specific tax/license text with counsel.
