# EVELIA Intelligence architecture

## Deployment shape

EVELIA is a Hostinger-compatible modular monolith: Next.js server rendering and secure route handlers run in one Node.js application, with MySQL/MariaDB as the durable store. It requires no Kubernetes, microservices or permanent background workers.

## Core boundaries

- `src/app/[locale]`: Arabic RTL and English LTR public, workspace, billing and administration surfaces.
- `src/lib/organizations.ts`: organization membership and role enforcement.
- `src/lib/business-tasks.ts`: employee selection, approved knowledge grounding, AI execution and usage recording.
- `src/lib/business-intelligence.ts`: evidence-based recommendations and explainable Business Intelligence Score.
- `src/lib/document-intelligence.ts`: bounded PDF, DOCX and text extraction.
- `src/lib/ai`: provider abstraction, moderation and atomic credit pipeline.
- `src/lib/payments`: hosted checkout adapter, signed webhook verification and subscription lifecycle.
- `prisma/schema.prisma`: normalized identity, organization, knowledge, task, report, usage, billing, CMS and audit domains.

## Organization isolation

Every private business entity carries an `organizationId`: memberships, employee activations, Company Brain knowledge, documents, projects, tasks, usage, recommendations, reports, subscriptions and workflow runs.

Private APIs:

1. authenticate the opaque HttpOnly session;
2. load an active membership for the exact organization;
3. enforce Owner, Manager, Employee or Viewer minimum role;
4. scope every query by `organizationId`;
5. return private no-store responses.

Suspended and deleted organizations fail the shared membership check. Internal provider instructions and API keys are never selected into user-facing responses.

## AI employee execution

1. Validate same-origin, typed input and idempotency key.
2. Verify organization membership and active employee activation.
3. Enforce plan/employee limits and check the ledger balance.
4. Load only approved, automatic-use Company Brain entries from the same organization.
5. Put internal employee instructions and company context in the provider system channel; persist only the user's public instruction.
6. Normalize and moderate input.
7. Execute the configured provider, then an enabled fallback if required.
8. Evaluate output structure.
9. Atomically deduct credits, append a ledger transaction, save the task and append an organization usage event.
10. On failure, record the failure without charging credits.

Private mode stores task/input hashes and operational metadata but not task text or output.

## Company Brain

Manual entries and extracted documents are organization-scoped and approval-aware. PDF, DOCX, TXT and Markdown extraction is bounded to 10 MB and 250,000 normalized characters. Files are not placed under the public web root. `vectorReference` and `embeddingMetadata` support a future semantic index without requiring unsupported infrastructure now.

Entries marked manual-only remain visible to authorized members but are excluded from automatic employee context.

## Business intelligence

Recommendations are emitted only when real evidence exists, such as product knowledge without customer knowledge or an active support employee without FAQ data.

Business Intelligence Score has five explainable 0–20 dimensions:

- AI employee adoption
- process organization
- customer service readiness
- content consistency
- company knowledge completeness

It is explicitly described as a guidance indicator, not a scientific measure.

## Billing

Plans, prices, limits and employee allowances live in MySQL. Paid checkout:

1. validates plan and organization ownership on the server;
2. creates an idempotent subscription checkout;
3. redirects to a configured real payment provider;
4. waits for a signed webhook;
5. validates amount and currency;
6. activates, renews or cancels the subscription;
7. allocates credits through the ledger exactly once.

Success pages never activate subscriptions.

## Administration

Administrative routes require both role authorization and enrolled TOTP. The control center manages organization status, credit adjustments, AI employee availability/cost, encrypted provider credentials, CMS content and security audit records. Secret values and internal employee instructions are omitted from audit changes.

## Future expansion

The organization, employee, task and provider boundaries are ready for WhatsApp, CRM, Shopify, WooCommerce, mobile apps, API clients and enterprise identity without changing core data ownership.
