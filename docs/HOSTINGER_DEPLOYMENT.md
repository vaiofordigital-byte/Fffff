# Hostinger deployment

## 1. Hosting plan

Use a Hostinger plan that supports:

- Node.js 22 applications
- persistent MySQL or compatible MariaDB
- environment variables
- custom domains and SSL
- scheduled database backup/export

EVELIA does not require Kubernetes, Redis, a permanent worker or a separate AI server.

## 2. Database

Create a dedicated database and least-privilege application user. Use `utf8mb4` for native Arabic and international text.

Set both Prisma's migration URL and the runtime adapter fields:

```text
DATABASE_URL=mysql://user:password@host:3306/evelia
DATABASE_HOST=host
DATABASE_PORT=3306
DATABASE_USER=user
DATABASE_PASSWORD=password
DATABASE_NAME=evelia
DATABASE_CONNECTION_LIMIT=10
```

Do not expose MySQL publicly unless an IP allowlist and TLS are configured.

## 3. Environment

Copy every required key from `.env.example` into Hostinger's environment settings. Generate unique production values:

```bash
openssl rand -hex 32
openssl rand -base64 32
```

- `SECURITY_HASH_PEPPER`: first value
- `ENCRYPTION_KEY`: Base64 value that decodes to exactly 32 bytes
- `NEXT_PUBLIC_APP_URL`: exact HTTPS origin, without a trailing path
- `SESSION_COOKIE_NAME`: unique production cookie name

Configure SMTP before opening registration. Configure AI and payment credentials only in the environment or encrypted Admin control center, never in client code.

## 4. Build and migration

```bash
npm ci
npm run db:generate
npm run build
npm run db:deploy
npm run db:seed
```

Start command:

```bash
npm run start
```

The seed is idempotent and installs configurable plans, six AI employee definitions, industry packages, workflows and feature flags. Use `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` only for the first seed, then remove them. The administrator must enroll TOTP.

## 5. Domain and SSL

1. Point the domain's DNS record to Hostinger.
2. Issue and enable Hostinger SSL.
3. Redirect HTTP to HTTPS.
4. Set `NEXT_PUBLIC_APP_URL` to the final HTTPS origin.
5. restart the Node.js application.
6. verify HSTS, CSP, cookie flags and Arabic/English canonical links.

## 6. Provider callbacks

Payment webhook:

```text
https://your-domain.example/api/webhooks/payments/<provider-key>
```

The provider implementation must send the raw signed payload contract documented by `PaymentAdapter`. Verify success, failure, duplicate event, amount mismatch, renewal, refund and cancellation in staging.

## 7. Upload limits

Company Brain extraction accepts PDF, DOCX, TXT and Markdown up to 10 MB. Ensure Hostinger's reverse-proxy body limit is at least 11 MB. Extraction happens synchronously; no permanent worker is required.

## 8. Backups

- daily encrypted MySQL backup
- binary logs or the closest Hostinger point-in-time option
- encrypted environment/configuration export
- immutable Git release and migration history

Never store dumps under the public application directory. Follow `docs/BACKUP-RECOVERY.md` and test a restore before launch.

## 9. Release checklist

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

Deploy to staging first. Verify organization isolation, document extraction, real AI task execution, no-charge provider failure, subscription webhooks and MFA before promoting the same artifact to production.
