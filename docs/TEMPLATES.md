# Adding a template

Templates are data. The invitation page does not have a React file per template.

1. Pick a slug, for example `lotus-pond`.
2. Create `public/templates/lotus-pond/` with:
   - `thumb.webp` 600×800
   - `preview-desktop.webp` 1440×900
   - `preview-mobile.webp` 390×844
   - `hero-bg.svg` and `hero-bg.webp` (hero WebP under 150 KB)
   - `border-top.svg`, `border-bottom.svg`, `divider.svg`
   - `corner-tl.svg`, `corner-tr.svg`, `corner-bl.svg`, `corner-br.svg`
   - `pattern.svg`
   - `motifs/` with at least six SVGs
   - `og-card.png` 1200×630
   - `theme.json`
3. In `theme.json` set `layout.heroStyle` to one of `palace`, `kolam`, `floral`, `minimal`, `botanical`, `temple`, or extend the shared renderer in `src/components/invitation/view.tsx` if you need a new arrangement.
4. Give the template at least three palettes. Ornament SVGs should use `var(--ornament-color)` so a palette can recolour them when they are inlined.
5. Add the slug to `TEMPLATE_SLUGS` in `src/lib/assets.ts`.
6. Run `npm run assets:validate`, then `npm run db:seed` so the template row exists. New files are also picked up on the next seed or an admin can leave the row active.
7. Artwork must be original. Do not copy a photographer’s invitation, a film still, or a found vector pack.

`npm run assets:generate` rebuilds the six shipped templates. `npm run assets:previews` replaces the thumbnails with Playwright screenshots of `/preview/template/<slug>` while the app is running.
