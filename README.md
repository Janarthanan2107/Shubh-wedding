# Shubh

Shubh is a demo wedding invitation and wedding-management app for Indian families and planners. It runs locally with SQLite. No paid API keys are required.

## Run

```bash
npm install
copy .env.example .env
npm run assets:generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open http://localhost:3000.

## Demo accounts

Password for every demo account: `Demo@123`

- couple@demo.com — Raja & Rani, published at `/w/raja-weds-rani`
- planner@demo.com — Demo Atelier, three weddings
- admin@demo.com — platform stats, templates, simulated orders

Sign-in is demo authentication. The session cookie is shaped so a JWT or OTP provider can replace `src/lib/auth.ts` without changing the pages.

Reset the fictional data from Settings, or run `npm run db:reset`.

## Scripts

- `npm test` — unit tests
- `npm run test:e2e` — browser journey
- `npm run assets:validate` — template files and image budgets
- `npm run assets:previews` — refresh gallery images from the live renderer (app must be running)

## What is real in this build

The invitation renderer, editor, guest book, RSVP, publishing, and role dashboards talk to Prisma. Payments are simulated. File storage is the local disk, with an S3-compatible adapter stub. There is no WhatsApp Business API; share links use `wa.me`.

## Docs

- [How to add a template](docs/TEMPLATES.md)
- [WhatsApp](docs/WHATSAPP.md)
- [Features and limits](docs/FEATURES.md)
- API outline: http://localhost:3000/docs and `GET /api/openapi`
