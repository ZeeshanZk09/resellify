# Project Setup & Run Guide (Next.js + Prisma + Neon)

This repository is a **starter template** for a Next.js project with **Prisma ORM** and **Neon (PostgreSQL)** already configured.

---

## Tech Stack

- Next.js (App Router)
- Prisma ORM
- Neon PostgreSQL
- Node.js (LTS recommended)

---

## Prerequisites

Make sure you have the following installed:

- Node.js (v18 or later)
- npm / pnpm / yarn
- A Neon account

---

## Environment Variables Setup

Create a `.env` file in the root of the project and add the following variables:

```env
# Neon Database URL
DATABASE_URL="postgresql://<username>:<password>@<host>/<db>?sslmode=require"

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ **Note:** Replace placeholders with your actual Neon database credentials.

---

## Prisma Setup

After cloning or creating a new project from this template:

- Design your schema

- If you want to sync database schema:

```bash
npx run prisma:migrate:dev
```

To create a type-safe database client (Prisma Client) and other artifacts, making it easy to interact with your database using code, providing methods for CRUD operations tailored to your models, and you must run it again after any schema changes.:

```bash
npx run prisma:generate
```

To open Prisma Studio:

```bash
npx prisma studio
```

---

## Install Dependencies

```bash
npm install
```

(or `pnpm install` / `yarn install`)

---

## Run the Project (Development)

```bash
npm run dev
```

The app will be available at:

```
http://localhost:3000
```

---

## Production Build

```bash
npm run build
npm start
```

---

## Creating a New Project Using This Setup

1. Clone or copy this repository
2. Create a new Neon database
3. Update `.env` with new database credentials
4. Run Prisma commands (`generate`, `migrate`)
5. Start the dev server

---

## Common Issues

### Prisma Client Error

Run:

```bash
npx prisma generate
```

### Database Connection Error

- Check `DATABASE_URL`
- Ensure SSL mode is enabled for Neon

---

## Notes

- This project is designed to be reused as a **starter template**
- Always keep `.env` out of version control

---

Happy coding 🚀
