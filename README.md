# Shelly API

## Setup

Copy the environment file and fill in the required values:

```bash
cp .env.example .env
```

## Starting the database

```bash
pnpm docker:up
pnpm db:migrate
pnpm db:seed
```

## Starting the API

```bash
pnpm dev
```

## Contact-form email

Contact submissions are stored in Postgres and emailed through standard SMTP.
This does not require AWS SES. For a free Gmail setup:

1. Enable two-step verification on the sender account.
2. Create a Google app password.
3. Set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, and
   `SMTP_SECURE=false`.
4. Set `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, and
   `CONTACT_RECIPIENT_EMAIL` in `.env`.

Any SMTP provider can be used with the same variables.
