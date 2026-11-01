# Features

## Included

- Marketing site, demo login, couple, planner and admin areas
- Six-step wedding wizard with several ceremonies
- Six original invitation templates, three palettes each, motif packs
- Editor with drag-and-drop, layers, undo, autosave, snapshots and device preview
- Freeform section for Premium
- Simulated Premium checkout with GST, failed and pending outcomes
- Publish, unpublish and public site at `/w/<slug>`
- English, Tamil and Hindi
- Guest book, CSV import and export, RSVP, personal links, WhatsApp `wa.me` links, QR
- PNG and PDF export of the invitation card
- Planner tasks, vendors, budget and team
- Admin counts, template tier, and order filters

## Mocked or limited

- Authentication is a demo password check, not OTP or a hosted identity provider.
- Payments never leave the app. The Razorpay class is a stub behind `PaymentProvider`.
- Files are stored in `data/uploads`. The S3/R2 class is stubbed until signing is added.
- Maps are Google search links, not an embedded Maps JavaScript API.
- Music and video accept a URL. Video is limited to YouTube.
- Collaboration shows who else has the editor open in this server process and refuses a save when the revision does not match. It is not a multi-region presence service.
- Free accounts may keep draft weddings, and can publish one site. Premium removes that publish cap for that wedding.
- Legal pages are templates and need a lawyer before a public launch.
- Indic fonts are loaded from `next/font` with `font-display: swap`. Tamil and Devanagari are not preloaded, to keep the first screen lighter.
- The database is SQLite for the demo. `DATABASE_URL` can point at PostgreSQL after the Prisma datasource is switched and migrations are regenerated.
