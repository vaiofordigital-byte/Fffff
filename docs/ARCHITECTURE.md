# PROMPTX architecture

## Application boundaries

PROMPTX is a modular monolith designed for Hostinger-compatible Node.js hosting. It avoids infrastructure that requires unsupported managed queues or microservices.

- `src/app`: localized pages, protected workspaces, admin surfaces and route handlers.
- `src/components`: reusable design-system and domain components.
- `src/lib/auth.ts`, `security.ts`, `encryption.ts`: identity and security controls.
- `src/lib/prompt-engine.ts`: deterministic prompt architecture, optimization and structural scoring.
- `src/lib/ai`: provider abstraction, moderation and generation/credit pipeline.
- `src/lib/payments`: payment adapter, server-priced checkout and webhook processing.
- `src/lib/entitlements.ts`: the only premium-content read path.
- `prisma/schema.prisma`: normalized commerce, SaaS, content and AI domain model.

## Protected prompt flow

1. Public product pages select preview and version metadata only.
2. The Vault page lists an entitlement's product metadata without selecting premium content.
3. The authenticated browser requests `/api/products/:productId/content`.
4. The server validates session, product status, direct/bundle/subscription entitlement and expiry.
5. Only then does the server select and return the current published prompt version with `private, no-store` caching.

Personal customization happens in the browser and never mutates the official version. Server-side personal revision entities are available for durable history.

## AI generation flow

1. Validate same-origin request and typed input.
2. Normalize and moderate input on the server.
3. Create an idempotent generation record.
4. Check current credit balance without charging.
5. Call the configured provider, then a configured fallback when appropriate.
6. Run structural output evaluation.
7. Atomically decrement balance, append a ledger transaction and mark the generation complete.
8. On provider failure, mark the generation failed and leave the ledger untouched.

Private mode stores only an input hash and operational metadata. The returned output is not persisted.

## Commerce flow

Checkout ignores client prices. It reloads published products, currency, sale price and configured tax from MySQL. An idempotency key uniquely identifies both the order and payment initiation.

The payment success URL does not grant access. The adapter verifies the raw webhook signature, event identity, amount and currency. A transaction updates payment/order status and creates unique entitlements. Duplicate events return the prior result.

## Authorization

Roles form an increasing permission hierarchy:

`USER < SUPPORT_AGENT < CONTENT_EDITOR < PROMPT_EDITOR < ADMINISTRATOR < SUPER_ADMIN`

Ownership checks are applied to projects, contexts, workflows, generated prompts and Vault assets. Administrative routes require a verified MFA session; administrators without TOTP enrollment are redirected to security setup.

## Extensibility

- Additional AI vendors implement `AiProvider`.
- Additional payment gateways implement `PaymentAdapter`.
- Plans, prices, limits, categories, feature flags, CMS pages and AI configuration are stored in the database.
- Team, enterprise, API and mobile clients can reuse the existing entitlement, project, workflow and ledger boundaries.
