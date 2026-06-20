# Supabase Setup Guide

This guide explains how to configure Supabase for this CRM project. We use Prisma as the ORM, connecting to Supabase's PostgreSQL database with pgBouncer for connection pooling.

## 1. Create a Supabase Project
1. Go to [Supabase](https://supabase.com/) and sign in.
2. Click **New Project** and select your organization.
3. Choose a name, database password, and region.
4. Click **Create new project** and wait for the database to be provisioned.

## 2. Get Database Connection Strings
Once your project is ready, navigate to **Project Settings -> Database**:

1. Under **Connection string**, select **URI**.
2. Make sure you check the box that says "Use connection pooling" (often on port 6543).
3. The pooler connection string is required for Serverless environments (like Next.js on Vercel).
4. The direct connection string (port 5432) is required for Prisma migrations.

## 3. Configure Environment Variables
Create a `.env` file in the root of your project based on `.env.example`.

You need to provide **two** Database URLs:

```env
# The Transaction connection pooler (port 6543, pgbouncer=true)
DATABASE_URL="postgresql://postgres.[YOUR_PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# The Direct connection (port 5432) - Used ONLY for migrations
DIRECT_URL="postgresql://postgres.[YOUR_PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

## 4. Run Migrations
To push the database schema to your new Supabase database, run the following command in your terminal:

```bash
npx prisma db push
```
*(Alternatively, you can run `npx prisma migrate dev` if you want to track migration history).*

## 5. Generate Prisma Client
After pushing the schema, generate the Prisma client so TypeScript knows about your tables:

```bash
npx prisma generate
```

## 6. Supabase Auth & Storage (Optional)
Currently, this project uses NextAuth for authentication, but if you decide to utilize Supabase Storage (e.g., for WhatsApp media attachments) or Supabase Auth in the future, add the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR_PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"
```
You can find these under **Project Settings -> API** in the Supabase dashboard.

## 7. Start the Application
You are all set! Start your development server:

```bash
npm run dev
```
