# Site Maintenance

## What to update most often

- Officer names and roles in `about/index.html`
- Workshop links and contact links in `index.html`
- Active error-diffusion WebP photos in `images/club/` and `images/officers/` (see `docs/image-assets.md`)

## How deployment works

- Source files are committed in the repo root.
- `build.mjs` assembles the deployable site in `dist/`.
- GitHub Actions deploys `dist/` to GitHub Pages.
- `CNAME` keeps the custom domain pointed at `computerhardwareclub.org`.


## Adding content safely

- Reuse existing page sections before creating new layout patterns.
- Keep image filenames descriptive and lowercase when adding new assets.
- Prefer relative links so the site works both locally and on GitHub Pages.
- If a page should be public, make sure it is linked from the site.

## Common checks

```bash
npm run verify
```

Review the generated `dist/` output only when debugging the build. It is not source-of-truth content.

## Visual language

- Black `#000000` backgrounds, off-white `#F2F2EE` text and ASCII, gray `#A1A1A1` secondary text, `#303030` dividers, and signal orange `#FF6B2C` actions.
- `styles/site-shell.css` owns tokens, local font faces, navigation, footer and responsive menu. `styles/main.css` styles the homepage, About and errors. `styles/mobile.css` is the phone and tablet layer for the home and about pages. The workshop guides keep their original embedded CSS, with palette overrides in `styles/workshop-theme.css`.
- Jersey 10 is the pixel display face; IBM Plex Mono is for body text and controls. Both are self-hosted in `styles/fonts/` with their OFL licenses.
- `images/ascii/beaver-crt.txt` is the editable 156 × 91 text artwork, currently restored to the supplied export including its original keyboard. An unchanged backup remains in `images/ascii/beaver-crt-original.txt`, alongside the earlier PNG reference.
- Use flat surfaces, square controls, clear focus outlines and simple separators. Keep long instructional text readable; reserve the pixel font for headings.
- All pages use the shared navigation and menu behavior in `scripts/site.js`. The Utilities page and its assets have been removed.
- The troubleshooting and server-build pages retain their existing Tailwind and Lucide CDN dependencies. Other redesigned pages load their fonts and scripts locally.

## Redesign checks

Alongside `npm run verify`, check the desktop and mobile menu, Escape behavior, server workshop timer completion, Python reference search/copy, and server tracker totals, persistence and JSON import. View the server workshop in fullscreen to check expanded sizing.

## CRT first-visit intro

The homepage loads `scripts/intro.js` in the head before paint and `styles/intro.css` after the main stylesheet. `render-crt.mjs` generates static, accessible text artwork from `images/ascii/beaver-crt.txt`. Three existing plus signs in the lower-right bezel (zero-based row 57, columns 123–125) turn red. Each of the 750 beaver glyphs gets its own scan delay, left-to-right and top-to-bottom. There are no raster masks or image overlays. The exporter’s background dashes render as spaces. The renderer leaves the working TXT unchanged; its keyboard can be edited directly while the original export is retained separately.

Run `node render-crt.mjs --write` after changing the text export to update the marked artwork in the source homepage. The production build regenerates it automatically. Do not edit generated spans by hand. A different grid requires recalibrating the screen and power-cell coordinates in the renderer.

The sequence starts after the text and fonts are ready: power light (800ms), ten-frame ASCII loader (1200ms), downward scan (1400ms), settled image (200ms), then a 500ms header/hero fade with up to 50ms stagger. It takes about 4.2 seconds overall. The three power-light cells stay red after completion or skipping, on return visits, and with reduced motion enabled.

`sessionStorage['chc:crt-intro:v1']` records the visit immediately, including skips. Navigation/reloads in the same tab do not replay; a fresh tab session can play again. Reduced motion, deep links and unavailable storage bypass the intro. Scrolling, touch movement and scroll-navigation keys never cancel the intro. The club story, lower CTA and footer are always visible and never join the intro fade, so visitors can scroll and use them immediately. Escape skips deliberately; Tab also reveals the header and hero for keyboard access. Page exit cancels pending work; a seven-second failsafe prevents stalled media from keeping content hidden.

`tests/intro.test.mjs` covers lifecycle, repeat visits, interruption through the final fade, reduced motion, storage/font failures and late callbacks. Local-only replay controls live at `.omx/qa/intro-preview.html`; this development fixture is excluded from the production build.

### Refresh behavior

Ordinary refresh preserves the completed visit and does not replay. The homepage listens for Cmd+Shift+R, Ctrl+Shift+R, Ctrl+F5 and Shift+F5 without cancelling their native browser behavior. It records a short-lived `chc:crt-hard-refresh:v1` timestamp. Only a navigation reported as `reload` within 7.5 seconds consumes that mark as an explicit replay; later refreshes and link/back navigation stay quiet. Hard-refresh replay starts at the top; normal scroll-restoration behavior is restored on completion or skip. Reduced motion and deep-link bypasses remain respected.

Web navigation timing does not expose a separate hard-refresh type. Browser-menu/DevTools-only hard reloads and shortcuts swallowed by browser chrome cannot be identified reliably by this static page. We intentionally do not infer intent from cache misses, which could replay on ordinary reloads after an asset update. The local replay page remains available for development.

## Workshop fidelity

Workshop visual changes belong in `styles/workshop-theme.css`, imported through each document’s existing CSS block. Preserve the original workshop HTML, headings, navigation, code samples, tool markup and scripts during styling passes. These pages intentionally retain their original typography, scale and layout rather than the homepage’s pixel-heading treatment. The override adjusts the dark palette, focus colors and narrow-screen containment only.

The About title uses the lower-density `images/ascii/club-logo-small.txt` export (20×14 visible cells after trimming the empty border), rendered as orange text beside the heading. The original `@` background cells become spaces. Its width scales from 56px to 90px; the title scales down on phones so the logo stays to its right. On phones the logo steps above the title instead of beside it, so the headline keeps a readable line length. The homepage `.crt-beaver` glyphs use the same accent orange, while `.crt-power` stays red.

## Mobile experience

`styles/mobile.css` holds every phone and tablet override for the home and about pages. It is linked as a normal stylesheet after `styles/main.css` — keep that order. Do not convert it to an `@import`: CSS ignores `@import` that appears after other rules, so the mobile layer would silently lose the cascade to the desktop rules it is overriding.

Every rule in that file is wrapped in `@media (max-width: 860px)`, which is the same breakpoint `styles/site-shell.css` uses for the mobile menu. Above that width the desktop rendering is untouched, and `tests/mobile-shell.test.mjs` guards this. The home hero stacks as artwork, then club identity, then invitation and action; that order comes from CSS `order` on the existing markup. Do not reorder the hero blocks in the DOM or in `scripts/site.js` — the desktop hero is a three-column grid, so moving a block in the markup changes which column it occupies.

The workshop pages keep desktop layouts and are deliberately not offered in the mobile menu (`.site-header .nav-dropdown` is hidden below the breakpoint). They remain published and reachable by direct URL. Any change that makes those pages phone-friendly should revisit that decision.

### Homepage hero on a phone

In portrait the hero is exactly one screen tall, with its contents centred, so the club story and its photo begin at the fold: a first-time visitor sees the whole welcome and no part of the photo. Landscape is deliberately excluded, because there is not enough height there for a full-screen hero; it keeps a natural height and scrolls.

The artwork is sized from the screen height, not the text column, which is what leaves the hero its breathing room. Two details are load-bearing and easy to break:

- `.hero-art` needs `min-width: 0` and `min-height: 0`. It is a flex item, and the CRT artwork inside it is intentionally drawn wider than its box, so without them it sizes to that inflated content instead of the box the CSS asks for.
- `--hero-gap` owns the spacing between the stacked hero blocks. Do not reintroduce `margin-top` on `.hero-identity` or `.hero-invite`: `main.css` still carries margins for them at its 480px breakpoint, and the mobile layer resets them for that reason.

To check the fold and the vertical rhythm at several device sizes:

```bash
node scripts/dev-server.mjs &
node scripts/hero-check.mjs
```

To check the mobile layer in a real browser:

```bash
node scripts/dev-server.mjs &
node scripts/mobile-check.mjs
```

`scripts/mobile-check.mjs` needs Playwright; it is not a dependency of this site, so set `PLAYWRIGHT_PATH` to any Playwright install if the default does not resolve. It writes screenshots to `output/mobile-audit/`.
