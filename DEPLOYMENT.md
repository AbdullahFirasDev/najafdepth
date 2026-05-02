# PostgreSQL and Vercel Deployment

This project is prepared for PostgreSQL through Prisma 7. Use a hosted PostgreSQL provider such as Supabase or Neon for Vercel deployments.

## 1. Create a Database

- Supabase: create a project, open Project Settings > Database, and copy the PostgreSQL connection string.
- Neon: create a project and database, then copy the pooled or direct PostgreSQL connection string from the connection details.
- Keep `sslmode=require` in the URL for hosted providers.

Examples:

```env
DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres?sslmode=require"
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DATABASE?sslmode=require"
```

## 2. Vercel Environment Variables

Set these in Vercel Project Settings > Environment Variables:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
NEXTAUTH_URL="https://your-domain.example"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
SITE_URL="https://your-domain.example"
NEXT_PUBLIC_SUPABASE_URL="https://PROJECT.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="replace-with-supabase-service-role-key"
SUPABASE_STORAGE_BUCKET="article-images"
MEILISEARCH_HOST=""
MEILISEARCH_ADMIN_KEY=""
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
RESEND_API_KEY=""
EMAIL_FROM=""
ADMIN_EMAIL=""
ADMIN_PASSWORD=""
```

Optional services can stay empty. Meilisearch, Cloudinary, and email sending are skipped or fall back when their environment variables are not configured.

## 3. Supabase Storage

Article images upload through Supabase Storage by default.

1. In Supabase, open Storage and create a bucket named `article-images`.
2. Make the bucket public so article images can be read by visitors.
3. Copy the project URL into `NEXT_PUBLIC_SUPABASE_URL`.
4. Copy the service role key into `SUPABASE_SERVICE_ROLE_KEY`.
5. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Do not expose it in client code.

## 4. Local Setup Commands

After copying `.env.example` to `.env` and setting `DATABASE_URL` to a real PostgreSQL database:

```bash
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run lint
npm run build
```

## 5. DNS Reminder

After deploying on Vercel, point the Hostinger DNS record for the desired subdomain to Vercel with a CNAME record. Configure the same domain in Vercel and update `NEXTAUTH_URL` and `SITE_URL` to the final HTTPS URL.
