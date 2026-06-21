#!/usr/bin/env bash
set -e
echo "▶ WhatsCommerce POS — setup"

if [ ! -f .env ]; then
  cp .env.example .env
  # generate an auth secret if openssl is available
  if command -v openssl >/dev/null 2>&1; then
    SECRET=$(openssl rand -base64 32)
    if sed --version >/dev/null 2>&1; then
      sed -i "s|AUTH_SECRET=.*|AUTH_SECRET=\"$SECRET\"|" .env
    else
      sed -i '' "s|AUTH_SECRET=.*|AUTH_SECRET=\"$SECRET\"|" .env
    fi
  fi
  echo "✓ Created .env (edit DATABASE_URL if needed)"
fi

echo "▶ Installing dependencies…"
npm install

echo "▶ Starting Postgres + Redis (docker compose)…"
docker compose up -d || echo "⚠ Docker not available — point DATABASE_URL to your own Postgres."

echo "▶ Generating Prisma client + migrating…"
npx prisma generate
npx prisma migrate dev --name init

echo "▶ Seeding demo data…"
npm run db:seed

echo "✅ Listo. Ejecuta: npm run dev"
