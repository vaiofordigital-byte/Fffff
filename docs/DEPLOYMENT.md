# Deployment guide

## Environments

Maintain isolated development, staging and production environments. Each environment needs a separate database, application URL, provider credentials, webhook secret and SMTP account. Never send test AI or payment traffic to production.

## Hostinger / Node.js

1. Provision a Node.js 22 application and MySQL database.
2. Upload the repository or connect the Git branch.
3. Configure environment variables from `.env.example` in the hosting control panel. Do not upload `.env`.
4. Install and build:

   ```bash
   npm ci
   npm run build
   npm run db:deploy
   npm run db:seed
   ```

5. Start with:

   ```bash
   npm run start
   ```

6. Configure the public domain and HTTPS, then set `NEXT_PUBLIC_APP_URL` to the exact HTTPS origin.
7. Point the payment provider webhook to:

   `https://your-domain.example/api/webhooks/payments/<provider-key>`

8. Verify registration email, MFA, AI execution, payment success/failure and duplicate webhook behavior in staging.

`npm run db:seed` is idempotent. Remove bootstrap administrator credentials after the first successful run.

## Release process

1. Run lint, type checking, tests and a production build.
2. Back up the production database and configuration.
3. Deploy to staging and run account, marketplace, AI and payment smoke tests.
4. Apply migrations with `npm run db:deploy`.
5. Deploy the immutable build artifact to production.
6. Confirm health and error reporting without logging private prompt content.

## Environment requirements

- MySQL 8+ or compatible MariaDB
- TLS at the reverse proxy
- Persistent database storage
- SMTP for account verification and password reset
- A compatible hosted payment adapter configuration
- An OpenAI-compatible AI endpoint, or a custom `AiProvider` implementation

## Rollback

Roll application code back to the prior immutable release. Database migrations must be forward-compatible; write an explicit corrective migration instead of editing or deleting a migration already applied in production.
