# Code Inspection Report

> Generated: 2026-05-08
> Scope: Full codebase — all HTML pages, scripts, CSS, and build/test tooling

---

## 🔴 Critical

### C-1: `document.execCommand('copy')` — Deprecated API in serverbuild.html
`serverbuild.html` (line ~846) and `primes.html` (line ~3323) use `document.execCommand('copy')` as a clipboard fallback. This API has been obsolete in the HTML Living Standard since 2021 and was removed from all major browsers in 2025. If `navigator.clipboard.writeText()` throws (e.g., insecure context), the fallback silently does nothing on modern browsers.

**Fix:** Remove `execCommand` entirely. The Clipboard API works in all modern browsers for user-gesture-initiated calls. If a non-gesture context is needed, show a manual "select and copy" fallback UI instead.

---

## 🟠 High

### H-1: Duplicate `defer` scripts conflict — `site.js` loaded after inline scripts run
Several workshop pages (`serverbuild.html`, `troubleshoot.html`, `primes.html`, `utilities/index.html`) contain:
- Inline `<script>` blocks (no `defer`) that attach event listeners, initialize dropdowns, etc.
- A separate `<script src="../scripts/site.js" defer></script>` further down

Because inline scripts execute immediately on parse, but `defer` scripts run after DOMContentLoaded, `site.js` initializes the **same** dropdown/menu logic again on top of already-attached handlers. This causes:
- Double event listeners on `.nav-dropdown-btn`
- Conflicting mobile menu state management between inline code and `site.js`
- `site.js` dropdown logic at line 77-92 won't trigger on the dark-theme pages because the click target is not inside `.site-nav` (dark-theme nav omits the `.site-nav` container)

**Fix:** Either remove the inline dropdown code from workshop pages entirely (let `site.js` handle it universally), or remove `site.js` on those pages. Don't duplicate logic.

### H-2: `primes.html` file is ~3,547 lines — severe monolith
The entire page, including embedded CSS (~945 lines), ~95 documentation entries, a full search engine with inverted index, edit-distance fuzzy matching, synonym expansion, scoring, rendering, and keyboard navigation, lives in a single HTML file. This creates:
- Slow page parse
- Difficult maintenance and code review
- No cache granularity (any change invalidates the entire file)

**Fix:** Move the search engine and documentation data to `scripts/primes-search.js`. Move styles to `styles/primes.css`. The HTML file should only contain the content markup and a `<script defer>` reference.

### H-3: `serverbuild.html` — 1,203-line single-page monolith
Similar to H-2. The entire server build app (Timer, localStorage persistence, build tracker, image handling, base64 URL sharing, full-screen toggling, Lucide icon management) is embedded in one file along with 170 lines of CSS. This makes the page hard to test, audit, and extend.

**Fix:** Extract to `scripts/serverbuild.js` and `styles/serverbuild.css`.

### H-4: External CDN dependencies block render on workshop pages
`serverbuild.html` and `troubleshoot.html` load Tailwind CSS (`cdn.tailwindcss.com`) and Lucide Icons (`unpkg.com`) via `<script>` tags in `<head>`. This:
- Blocks page rendering until CDNs respond
- Fails on offline/slow connections (critical for in-workshop use)
- Introduces unversioned dependencies (breaking changes possible)

**Fix:** Pre-build a Tailwind CSS file locally and bundle Lucide icons as static SVGs.

### H-5: `copyCode()` in `primes.html` has no fallback for clipboard API failure
`primes.html` line 1172 uses `navigator.clipboard.writeText()` with no catch for the `.then()` chain. If the page loads over HTTP (not HTTPS), `clipboard.writeText` throws.

**Fix:** Add a `.catch()` handler with a visible error message to the user.

### H-6: Missing `<meta name="description">` on most pages
Only `utilities/index.html` has a meta description. The homepage, `about/`, error pages, and all workshop pages lack one. This hurts SEO and social sharing previews.

**Fix:** Add `<meta name="description" content="...">` to every page `<head>`.

### H-7: Workshop pages have inconsistent navigation vs main site
Workshop pages and `utilities/index.html` have entirely custom dark-theme nav bars that are styled inline and lack the `.site-header .site-nav .brand` logo structure present on main site pages. The navigation markup is also structurally different:
- Main site: `<header class="site-header"><nav class="container site-nav" aria-label="...">`
- Workshops: `<header class="border-b ... bg-... sticky ..."><div class="max-w-5xl ...">`

This means `site.js`'s mobile menu and dropdown code targeting `.site-header`, `.site-nav`, `.menu-toggle`, etc. **will not work** on the workshop pages, which is why they have their own inline dropdown handlers. However, those inline handlers are incomplete (no mobile menu toggle, no Escape key close for the main dropdown on some pages).

**Fix:** Unify the navigation structure across all pages. The dark-theme overrides should be CSS-only, not separate HTML structures.

---

## 🟡 Medium

### M-1: Spell-typos in image filenames
- `images/club/members_solering.jpeg` → should be `members_soldering.jpeg`
- Referenced in: `index.html:110` as `alt="Club members working during a build session"`

**Fix:** Rename the file and update the `<img src>` reference. This also improves image searchability for maintainers.

### M-2: Unused `placeholder-note` elements visible to sighted users
Multiple images are wrapped in `<figcaption class="media-caption"><div class="placeholder-note">...</div></figcaption>` blocks. These serve as internal labels (e.g., "Homepage Hero Image", "Soldering Image") but are visible to all visitors. They clutter the UI.

**Fix:** Either remove these elements entirely or add a `.placeholder-note { display: none; }` rule that only shows during development (e.g., via a `data-dev` attribute on `<html>`).

### M-3: Missing `<title>` prefix on workshop pages
- `primes.html`: `<title>1-Second Prime Showdown | Computer Hardware Club</title>` ✓
- `serverbuild.html`: `<title>Server Build Competition</title>` — missing site suffix
- `troubleshoot.html`: `<title>Troubleshooting Workshop</title>` — missing site suffix

**Fix:** Standardize to "Page Name | Computer Hardware Club" format.

### M-4: `utilities/index.html` — 1,152-line monolith
All CSS (594 lines), 6 inline `<script>` blocks covering QR codes, clock, stopwatch, timer, RNG, and shared nav, plus the full HTML markup, live in one file.

**Fix:** Extract CSS to `styles/utilities.css` and JS to `scripts/utilities.js`.

### M-5: Google Fonts loaded without `font-display: swap`
All pages load fonts via Google Fonts API (e.g., `fonts.googleapis.com/css2?family=...&display=swap`). The `&display=swap` parameter is present, but the raw `<link>` tags block rendering while fonts download. Fonts are also loaded differently across page types (Manrope on main site, IBM Plex Sans on utilities, JetBrains Mono on workshops).

**Fix:** Consider self-hosting fonts for:
- Faster initial paint (no external request)
- Offline resilience
- Workshop pages specifically may be used offline

### M-6: `.DS_Store` files checked into `images/`
`images/.DS_Store` exists in the working tree. It's tracked by `.gitignore` for the repo root (`**/.DS_Store` pattern), but the file may already be committed (check `git ls-files` to confirm).

**Fix:** Run `git rm --cached images/.DS_Store` if tracked, then remove locally.

### M-7: No `<link rel="canonical">` on any page
Every page loads content from a unique URL but has no canonical tag. Not critical for a small static site, but best practice for SEO.

**Fix:** Add `<link rel="canonical" href="https://computerhardwareclub.org/path">` to each page.

### M-8: Workshop nav dropdowns close on any page click
Multiple workshop pages have this pattern:
```js
document.addEventListener('click', () => {
    document.querySelectorAll('.nav-dropdown.is-open').forEach((dd) => {
        dd.classList.remove('is-open');
        // ...
    });
});
```
This closes the dropdown when clicking **anywhere** on the page, including the dropdown button itself. The `e.stopPropagation()` on the button's own click handler prevents immediate re-closing, but clicking other nav items will unintentionally close the dropdown before navigating.

**Fix:** Same as H-1 unify with `site.js` which checks `!nav.contains(target)` before closing.

### M-9: `utilities/index.html` nav is non-standard
The page has its own `<header class="site-header">` but the nav is `site-nav` without the `container` class, and the `<button class="menu-toggle">` and `<ul class="nav-links">` are used differently than on the main site. The dark-theme CSS overrides at line 112-350 are extensive and use `!important` to override `main.css`, but `main.css` isn't even loaded — the entire style is inline.

**Fix:** Pull out the inline `~600 lines of CSS` to a separate stylesheet. Use the same nav HTML structure as main pages.

### M-10: QR code textarea — missing `id` attribute association
The `<label for="qr-text">` correctly points to `#qr-text`, but the label element is not associated via wrapping. This is cosmetic but wrapping is more robust.

**Fix:** Minor. No action needed if `for/id` is correct.

---

## 🔵 Low / Nice-to-Have

### L-1: No CSP headers or inline script nonces
The site uses inline `<script>` blocks on nearly every page. Without Content Security Policy headers, these pages are vulnerable to XSS if the hosting layer becomes compromised. GitHub Pages doesn't support custom response headers without middleware.

**Fix:** Consider migrating to a lightweight hosting setup that supports custom headers, or extract all inline scripts to external files with `type="module"` for tighter isolation.

### L-2: Missing `loading="lazy"` on above-the-fold images
`index.html:68` has `fetchpriority="high"` (correct for hero image), but the parallax image uses `loading="eager"` implicitly. `about/index.html:50` similarly has a high-priority hero image, but officer portraits use `loading="lazy"` correctly.

**Current state is acceptable.** Verified: hero images have explicit `fetchpriority="high"`, below-fold images have `loading="lazy"`.

### L-3: Images lack explicit `width`/`height` attributes
None of the `<img>` tags specify `width` and `height` attributes. This causes Cumulative Layout Shift (CLS) during loading as the browser doesn't know the aspect ratio. The CSS `aspect-ratio` rules mitigate this partially, but native attributes reserve space before CSS loads.

**Fix:** Add `width` and `height` attributes matching the natural image dimensions, at least on above-the-fold images.

### L-4: `main.css` — `overflow-x: hidden` on body hides legitimate overflow
`body { overflow-x: hidden; }` at line 48 is used to prevent layout shift from decorative background gradients, but it also silently clips any legitimately wide content (e.g., long code blocks or tables).

**Fix:** Consider using `overflow-x: auto` and fixing the root cause of horizontal overflow with proper container constraints.

### L-5: `404.html` and `500.html` missing navigation
The error pages don't have the site header/nav. If a visitor lands on a dead-end URL, they can only go home or email. Adding nav would let them explore the site.

**Fix:** Add the standard `<header>` nav block or ensure the "Return Home" + email CTAs are sufficient (they likely are for error pages; low priority).

### L-6: No Open Graph / Twitter Card meta tags
Social media sharing of any page URL will produce a minimal preview (link text only). Adding OG tags would provide title, description, and image previews.

**Fix:** Add `<meta property="og:title">`, `og:description`, `og:image`, `og:url`, and `twitter:card` meta tags to each page.

### L-7: `build.mjs` doesn't verify output integrity
The build script copies files to `dist/` but doesn't verify that all expected files are present after copy. If a new page is added but not listed in `siteEntries`, it's silently excluded.

**Fix:** Add a post-copy validation step that checks for expected files, or walk the source tree automatically rather than hardcoding the `siteEntries` array.

### L-8: Timer in `serverbuild.html` uses `setInterval` — potential drift
The workshop timer uses `setInterval` to decrement every 1000ms. In background tabs or under GC pressure, `setInterval` fires late, causing the displayed time to drift. The `utilities/index.html` timer uses `performance.now()` with `requestAnimationFrame`, which is correct.

**Fix:** Use the same `performance.now()` + target timestamp approach in `serverbuild.html` as in `utilities/index.html`.

### L-9: Missing `<noscript>` fallback on utility pages
If JavaScript is disabled, `utilities/index.html` displays all interactive widgets in their default empty state with no indication that JS is required.

**Fix:** Add `<noscript>` blocks with a short notice.

### L-10: `primes.html` — no `data-lucide` icons, but other pages rely on Lucide CDN
`primes.html` uses emoji-based and text-based sections without Lucide, which is fine. But `serverbuild.html` and `troubleshoot.html` depend on `lucide.createIcons()` being called after DOM ready. If the unpkg CDN fails to load, all icons are broken with no fallback.

**Fix:** Inline the Lucide SVGs or use a bundled copy instead of relying on CDN.

### L-11: `site.js` — IIFE structure prevents module tree-shaking
`scripts/site.js` uses an IIFE with `"use strict"`. While perfectly valid, this means the code can't be imported as a module for testing or composition. Not a bug, but limits future architectural options.

**Fix:** No action needed. Note for future refactoring.

### L-12: `inspection-reports/` directory not in `.gitignore`
This directory is new and may contain working files. Ensure it's tracked appropriately.

**Fix:** Either keep it in git for audit trail, or add `inspection-reports/` to `.gitignore` if reports are local-only.

### L-13: `workshops/serverbuild.html` — `escapeHtml` uses DOM method (slow for repeated calls)
The `escapeHtml` function at line 448 creates a DOM element per call:
```js
function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}
```
Meanwhile `primes.html` uses the faster string replacement approach at line 3160. The DOM method works but allocates garbage on every call.

**Fix:** Replace with `str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')`

### L-14: Redundant `rel="noopener noreferrer"` on `mailto:` links
`mailto:` links don't open new tabs, so `rel="noopener noreferrer"` is unnecessary:
- `index.html:50` — `mailto:...` with no `target="_blank"` ✓ (correct)
- This is fine everywhere; just noting for consistency checks.

### L-15: `site.js` parallax uses `window.scrollY` instead of `document.documentElement.scrollTop`
Minor: `scrollY` is correct for modern browsers but falls back to `window.pageYOffset` in older ones. `window.scrollY` is the recommended modern approach, so this is fine.

### L-16: No `robots.txt` or `sitemap.xml`
The site has no `robots.txt` or XML sitemap, which means crawlers may not discover all pages efficiently.

**Fix:** Add `/robots.txt` and `/sitemap.xml` to the root directory.

### L-17: `primes.html` starter code — HTML entity issue in code block
The starter code in the `<pre><code>` block uses `&lt;=` for comparison operators, which renders correctly in the browser but makes the code harder to maintain in the raw HTML source. Some search engines may also struggle to extract the raw code.

**Fix:** Consider using a `<template>` element or loading the code from a separate `.py` file.

### L-18: Inconsistent footer copyright year hydration
All pages use `<span data-year></span>` with `site.js` injecting the year via JS. On the workshop pages, `site.js` may not load or may not target the footer correctly due to structural differences.

**Fix:** Use a server-side or build-time approach to inject the year, or ensure `site.js` loads reliably on all pages.

---

## 📋 Summary

| Severity | Count | Requires Action |
|----------|-------|-----------------|
| 🔴 Critical | 1 | Yes — `execCommand` removal |
| 🟠 High | 7 | Yes — refactor duplicated logic, monoliths, accessibility |
| 🟡 Medium | 10 | Yes — typos, SEO, consistency, maintainability |
| 🔵 Low | 18 | Consider — optimizations, nice-to-haves |

**Total issues: 28**

### Top 3 priorities:
1. **Extract inline scripts** from all workshop/utility pages into separate `.js` files — this alone addresses C-1 (deprecated API), H-1 (duplicated handlers), H-2/H-3/H-4 (monoliths), H-5 (missing error handling), M-4 (utilities monolith), L-1 (inline scripting), and L-13 (inefficient escape).
2. **Unify navigation HTML** across all pages so `site.js` handles menus, dropdowns, and mobile toggle universally — addresses H-1, H-7, M-8, M-9.
3. **Add `meta description`, OG tags, canonical URLs** to all pages — addresses H-6, M-7, L-6, improves discoverability immediately.
