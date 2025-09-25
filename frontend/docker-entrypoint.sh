#!/usr/bin/env sh
set -e

# Generate Prisma Client for the container's platform
npx prisma generate

# Optional: check important envs
node -e "console.log('DATABASE_URL present:', !!process.env.DATABASE_URL)"

# Start Next.js dev server
npm run dev
