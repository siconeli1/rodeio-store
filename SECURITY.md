# Security

This repository does not include production credentials, local environment files, runtime logs or assistant-specific configuration.

## Environment variables

Use `.env.example` as a template and keep real values in `.env.local` or in the hosting provider dashboard.

Server-side secrets must never be exposed to the browser:

- `SUPABASE_SERVICE_ROLE_KEY`
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `CRON_SECRET`

Only variables prefixed with `NEXT_PUBLIC_` are intended for client-side use.

## Reporting issues

If you find a security issue, avoid opening a public issue with sensitive details. Contact the maintainer privately with the affected route, reproduction steps and impact.
