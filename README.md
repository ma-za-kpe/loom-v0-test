# acme-billing-service

A minimal SaaS billing service — the target repo for Loom V0 acceptance testing.

This app uses `@loom/stripe-shim` instead of importing `stripe` directly.
Loom owns the upgrade path and opens patch PRs when a new verified thread
version is available.

## What it does

- `POST /charge` — creates a Stripe payment intent for an order
- `POST /webhooks/stripe` — receives and verifies Stripe webhook events
- `GET /health` — health check

## Running locally

```bash
cp .env.example .env
# fill in STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET

npm install
npm run dev
```

## Tests

```bash
npm test
```

## The Loom connection

`@loom/stripe-shim` is declared in `loom.project.yaml` and pinned in `loom.lock`.
When Stripe releases a new SDK version or a CVE is found, the Loom runner opens
a PR to this repo with:

- The updated thread version in `package.json` and `loom.lock`
- An SBOM diff showing exactly what changed inside the package
- CVEs resolved
- Rollback instructions

The app code never changes — the thread absorbs Stripe's upstream churn
behind a stable interface.
