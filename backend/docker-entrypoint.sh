#!/usr/bin/env sh
set -e

# Ensure Prisma Client is generated for the container FS after bind-mounts
npx prisma generate

# Optionally validate env
node -e "console.log('DATABASE_URL present:', !!process.env.DATABASE_URL)"

# Start dev server
nodemon index.js