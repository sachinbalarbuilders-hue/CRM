# 🚀 CRM Setup Guide

Follow these steps to configure and run the CRM locally using Supabase.

## 1. Prerequisites
- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [Git](https://git-scm.com/)
- A free [Supabase](https://supabase.com/) account

## 2. Clone the Repository
```bash
git clone https://github.com/sachinbalarbuilders-hue/CRM.git
cd CRM
```

## 3. Install Dependencies
Install all the required packages using npm:
```bash
npm install
```

## 4. Supabase Setup
1. Log in to [Supabase](https://supabase.com/) and click **New Project**.
2. Give your project a name and generate a secure database password. Keep this password safe!
3. Wait for the database to provision (this takes about 1-2 minutes).
4. Once ready, go to **Project Settings -> API** to find your `Project URL` and `anon public key`.
5. Go to **Project Settings -> Database** to find your `Connection string` (URI). 

## 5. Environment Variables
1. In the root of your project folder, create a new file named `.env.local`.
2. Copy the contents from `.env.example` into `.env.local`.
3. Replace the placeholder values with your actual Supabase credentials:

```env
# Example .env.local
DATABASE_URL="postgresql://postgres.[your-project-ref]:[your-password]@aws-0-[region].pooler.supabase.com:5432/postgres"
SUPABASE_URL="https://[your-project-ref].supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1..."
```

*(Note: Replace `[your-password]` with your actual database password, and ensure there are no brackets remaining).*

## 6. Initialize the Database
We use Prisma to manage the database schema. Push the schema to your new Supabase database:
```bash
npx prisma db push
```

*(Optional)* If you want to view or manage your database data visually on your local machine, you can run:
```bash
npx prisma studio
```

## 7. Run the Development Server
Start the Next.js local server:
```bash
npm run dev
```

Open your browser and navigate to [http://localhost:3000](http://localhost:3000). 
You are all set! 🎉
