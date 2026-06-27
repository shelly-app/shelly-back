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
