# Redesign verification — September 8, 2026

final result: passed

## Visual target and evidence

- Approved target: `docs/design-reference.png` (1424 × 1120 pixels). The user selected the centered computer concept with black, off-white and orange, then authorized a ground-up redesign using their beaver artwork.
- Implementation: `http://127.0.0.1:4173/` in the Codex in-app browser.
- Desktop evidence: `.omx/qa/home-desktop.png`, 1424 × 1120 pixels, CSS viewport 1424 × 1120, device scale factor 1. No density normalization required. The reference and implementation were opened together for direct visual comparison.
- State: homepage at the top, navigation closed, fonts loaded. The palette strip in the design board is presentation material and is intentionally replaced by real site content.
- Mobile evidence: `.omx/qa/home-mobile.png`, `.omx/qa/home-mobile-workshops.png`, `.omx/qa/home-mobile-story.png` at 390 × 844 CSS pixels.
- Supporting views: `.omx/qa/primes-desktop.png`, `.omx/qa/primes-mobile.png`, `.omx/qa/server-desktop.png`, `.omx/qa/utilities-desktop.png`, `.omx/qa/troubleshoot-mobile.png`.
- Full-page stitched browser captures showed capture artifacts and were not used as fidelity evidence. Normal viewport captures and manual scrolling verified the lower homepage. The hero artwork, typography, side text and primary action are readable in the full viewport comparison; no magnified hero crop was necessary.

## Findings and comparison history

1. Initial desktop pass: 84/100, revise. [P2] Excess hero spacing placed the computer and workshop strip roughly 100px too low. [P2] Image margins produced 10px horizontal mobile overflow.
2. Reduced header/heading spacing, lifted desktop side text and clipped only the artwork's excess black margins. Second pass: 89/100, revise. Desktop composition resolved; [P2] mobile invitation copy still needed larger text. Integration review also identified [P2] fullscreen server content retaining the normal page-width cap.
3. Stacked the mobile invitation under the artwork with 14px text and a 54px-high action. Fixed fullscreen content width to 96vw. Captured the revised desktop/mobile views and checked expanded content at 1367px within a 1424px viewport.
4. Final comparison: 94/100, pass. No outstanding P0/P1/P2 design findings.

## Required fidelity surfaces

- **Typography:** Jersey 10 provides a real, self-hosted pixel display face, with IBM Plex Mono for body and controls. The exact generated glyphs are interpreted through a working font rather than rasterized text. Desktop hierarchy, mobile wrapping and readable invitation text verified.
- **Spacing:** Centered artwork, supporting text on either side, wide margins, flat workshop rows and thin dividers retain the approved composition. On phones, the heading wraps and the invitation stacks below the artwork. This is an intentional responsive adaptation.
- **Colors:** CSS tokens are black `#000000`, off-white `#F2F2EE`, muted gray `#A1A1A1`, dividers `#303030`, and orange `#FF6B2C`. Orange buttons use black text. No green, decorative glow or gradient surfaces were introduced.
- **Images:** `images/ascii/beaver-crt.png` is the original supplied 1254 × 1254 export, copied unchanged. CSS handles its black margins. Club and officer photos are existing assets with grayscale presentation. No placeholders replace real club images.
- **Content:** Club identity, contacts, existing officers and workshop/tool content retained. New homepage writing and information hierarchy fit the approved casual direction. No invented meeting dates or upcoming events.

## Functional verification

- `npm run verify`: passed (Node build regression test and static build). New shared styles, fonts and ASCII artwork are covered by the build inventory.
- `node --check scripts/site.js`: passed. Inline workshop/tool scripts were also syntax-checked.
- `git diff --check`: passed.
- Static HTML check: eight pages, 140 asset/link references, no broken local targets or fragments, no duplicate IDs.
- All eight pages checked at 320px CSS width: no horizontal page overflow or broken images.
- Homepage mobile menu, workshop dropdown and navigation links work. Escape closes the dropdown first, then the mobile menu; ARIA expanded states update correctly. Workshop jump link tested.
- Utilities: QR SVG renders after editing input; random-number generation returned three sevens for a 7–7 range; invalid bounds show validation; stopwatch starts/pauses/resets; one-second timer reaches completion and resets.
- Prime reference: searching `bytearray` changes ranked results; copying a result produces the corresponding Python source.
- Server tracker: CPU $12.50 plus GPU $7.50 produces $20.00; custom part creation works; totals, team and parts persist across reload; malformed JSON is rejected and valid JSON imports. Test build data was reset to blank.
- Expanded server sizing verified after the fix.
- No browser console errors were reported during the tested flows.

## Changed files and simplifications

- Rebuilt `index.html`, `about/index.html`, `404.html` and `500.html`.
- Redesigned `utilities/index.html` and `workshops/{primes,troubleshoot,serverbuild}.html`, preserving their functional content.
- Replaced the old large light-theme stylesheet with `styles/main.css`, shared `styles/site-shell.css`, and `styles/workshops.css`.
- Simplified `scripts/site.js` to shared accessible navigation and year updates; removed reveal/parallax code and duplicate page-level dropdown handlers.
- Added original ASCII artwork, self-hosted fonts and font licenses; updated build asset checks and `docs/site-maintenance.md`.
- Preserved pre-existing untracked workshop/utility work and `inspection-reports/`. No commit or deployment performed.

## Remaining limits

- Troubleshooting and server-build pages retain existing Tailwind and Lucide CDN dependencies.
- Browser verification used the Codex in-app browser, not a separate Safari/Firefox test matrix. External Discord/email/GitHub destinations were retained, not exercised as external communications.
- No separate lint/typecheck scripts exist for this plain HTML/CSS/JavaScript project.

The local preview remains open for review.

## Homepage annotation revision

The subsequent nine user annotations supersede the original homepage copy and workshop-list composition above. Applied in `index.html` and `styles/main.css`:

- Headline changed to “Wherefore art thou, Peter?” with responsive wrapping; tagline removed.
- Invitation reduced to two sentences with an explicit line break. Matching font/line-height and button-space allowance align its first line with the identity block when side by side.
- Removed the complete homepage workshop section, the story eyebrow, and the closing CTA eyebrow.
- Removed the forced line break and final period from “Leave your résumé at home”.
- Homepage copyright now reads “© 2026 Computer Hardware Club”. Other pages' footer content was not changed.
- The retained workshop strip now uses a native details picker with the existing workshop links instead of a broken link to the removed section.
- The existing 1100px compact breakpoint places the art above the two aligned text columns; the existing phone breakpoint retains the stacked layout.

Verified at 752px (annotated size), 900px (intermediate), 1424px (desktop) and 390px (phone). The side-by-side text blocks had a measured 0px top offset at 752, 900 and 1424px. No page overflow; native workshop picker opens and exposes all three working relative targets. Screenshots: `.omx/qa/annotations-752.png` and `.omx/qa/annotations-mobile.png`. Compared with the user's annotated screenshots and requested changes; no remaining actionable visual differences. This is a scoped annotation pass, not a new design direction.

Annotation pass final result: passed

### Follow-up removals

Removed the entire homepage workshop strip and only the “HARDWARE IS BETTER WITH FRIENDS.” caption. The remaining “CHC / OSU” caption stays right-aligned. Updated `index.html` and `styles/main.css`; refreshed the stylesheet URL to invalidate the stale browser copy. Browser inspection confirms both removals and `justify-content: flex-end`. Build regression checks passed. Follow-up final result: passed.

### About-page annotations

Applied all 18 About-page annotations in `about/index.html` and `styles/main.css`: removed the page/section/contact eyebrows, both photo captions, the values grid and all four officer descriptions; replaced the introduction and curiosity/contact headings exactly as requested; removed the OSU suffix from this page's footer. A scoped `section-intro--left` modifier makes both section introductions use the full content column at every existing breakpoint, without changing other pages. Officer photos, role labels and names remain.

Verified at 1105×767 and 390×844. Both desktop headings and paragraphs begin at x=48, matching the main container. No mobile overflow. All removed selectors absent, new strings exact, all four officer cards present. Screenshots: `.omx/qa/about-annotations-intros.png`, `.omx/qa/about-annotations-officers.png`, `.omx/qa/about-annotations-mobile.png`. Build/tests and diff whitespace checks passed. About annotation final result: passed.

### About introduction spacing and copy

Updated the contact heading to “Have a question? An inquiry, perhaps?” and the officer introduction to “The people keeping the workshops running and the parts (somewhat) organized.” The curiosity text is unchanged. Its dedicated `about-welcome` section now sits 32px below the photo, has 36px bottom padding and a thin bottom divider, with 48px before the officer section. Removed the old stacked section/introduction spacing from this specific block without changing other sections or breakpoints.

Verified at 752px and 390px: no overflow, exact copy, and the long contact heading wraps within its column. Evidence: `.omx/qa/about-welcome-spacing.png` and `.omx/qa/about-contact-mobile.png`. Build/tests and diff checks passed. Final result: passed.

## First-visit CRT boot sequence

final result: passed

Implemented the requested black-screen CRT introduction on the homepage. It preserves the current image position and uses the supplied ASCII art as the visual reference. Empty screen → blinking red bezel character → ASCII loader → downward scan revealing the beaver → staggered page fade. No new raster assets or dependencies.

Files: `index.html`, `scripts/intro.js`, `styles/intro.css`, `tests/intro.test.mjs`, and the build asset inventory in `tests/site-build.test.mjs`.

Visual evidence: `.omx/qa/intro-power.png`, `intro-loader.png`, `intro-scan.png`, `intro-reveal.png` at 1424×1000; `.omx/qa/intro-mobile-loader.png`, `intro-mobile-scan.png`, `intro-mobile-ready.png` at 390×844. Opened and compared the successive states with the source artwork and user sequence. First pass found the scan beam too short; extended its ASCII row to fill the clipped display. The revised mobile scan shows the leading line and partially revealed beaver. The settled beaver occupies exactly the original display; there is no positional jump at handoff. No remaining P0/P1/P2 findings.

Verification: 35 Node tests pass, including build verification. Syntax and whitespace checks pass. Browser testing confirmed full playback, immediate downward-scroll skip with native scroll continuing (scrollY 779), no replay after navigating to About and back, correct mobile completion without overflow, and no console errors. Reduced-motion, touch/key interruption, stalled image recovery, session-storage failure and bfcache lifecycle are covered by deterministic tests. Physical touch-device testing was not performed.

Animation purpose: first-visit delight. CSS animates opacity, clip-path and transform; JavaScript orchestrates the short phases and interruption. Constant scan uses linear timing; page entrance uses cubic-bezier(0.23, 1, 0.32, 1). Session scope is the browser tab's sessionStorage lifetime. The original image remains unchanged and the static page remains usable if intro JavaScript cannot run.

## Real-character CRT revision

final result: passed

Replaced the PNG-based CRT and screen-mask effects with static HTML generated from the supplied `images/ascii/beaver-crt.txt` (156 columns × 91 rows). `render-crt.mjs` preserves every visible source glyph and row position; background dashes display as spaces. The original TXT is byte-for-byte identical to the file in Downloads. Literal trailing row padding is encoded as numeric space entities in generated HTML.

The red power light is now three actual `+` source cells, row 57 / columns 123–125. The beaver has 750 separate single-character spans, each with an ordered raster scan delay. No image, black masking rectangle, clipped bitmap, or overlaid fake power-light glyph remains in the CRT. The existing loader, page fade, session guard, reduced-motion bypass and immediate interruption behavior continue to work.

Changed files: `index.html`, `build.mjs`, `render-crt.mjs`, `images/ascii/beaver-crt.txt`, `scripts/intro.js`, `styles/intro.css`, `tests/intro.test.mjs`, `tests/crt-art.test.mjs`, `tests/site-build.test.mjs`, and maintenance documentation. The build regenerates only the marked artwork block and preserves all surrounding user-edited content. The source-page generator command is documented for local previews.

Visual evidence: `.omx/qa/text-crt-power.png`, `text-crt-loader.png`, `text-crt-scan.png`, `text-crt-ready.png` at 1424×1000, and `.omx/qa/text-crt-mobile-scan.png` at 390×844. Compared the successive browser states with the source character grid. The scan capture had 160 of 750 glyphs visible; the ready state showed the complete beaver. The bezel remained intact, with its real characters providing the red light.

Verification: all 43 Node tests passed, including exact character reconstruction, HTML escaping, ordered scan positions, real power cells, marker preservation, font-wait failure recovery, all prior lifecycle/skip scenarios and production build inventory. Syntax, whitespace and original-file equality checks passed. Browser return navigation showed no replay and zero CRT image elements. Scrolling during the phone scan immediately displayed all 750 glyphs while scrolling naturally to y=844. No overflow or console errors. No remaining actionable visual issues; CSS glyph rendering can vary slightly by browser rasterization.

## Keyboard refinement and persistent power light

final result: passed

Updated the editable text artwork below row 59 with a regular keyboard layout, wide spacebar, clean front edge, simple mouse and connected cable. Rows 0–59 (including the CRT, beaver and power-light cells) are identical to the supplied source. The original export is preserved in `images/ascii/beaver-crt-original.txt` and matches Downloads byte-for-byte. The grid remains 156×91 with all 750 beaver glyphs intact.

The first visual pass found the keyboard's front edge clipped by the old hero containment. Changed only that container to clip horizontally and allow vertical overflow. The revised desktop and phone captures show the complete deck without page overflow: `.omx/qa/crt-keyboard-desktop.png`, `.omx/qa/crt-keyboard-mobile.png`.

The three real power characters now have a steady red resting color, including reduced-motion mode; only the startup phase blinks. A complete browser boot finished with no active phase/fade, all 750 beaver cells visible and power color rgb(255,72,72). All 43 tests, build and whitespace checks passed. Changed the working TXT, generated homepage, `styles/intro.css`, the hero containment in `styles/main.css`, and documentation. No outstanding visual findings.

### Keyboard reverted

Restored the original supplied keyboard and right-hand artwork at the user’s request. The working TXT again matches `beaver-crt-original.txt` exactly. Persistent red power light remains. Regenerated the homepage; all 43 tests and the build pass.

## Explicit hard-refresh replay

Regular reloads remain suppressed by the session flag. Updated `scripts/intro.js` and its tests to recognize an explicit hard-refresh keyboard request, consume it only on the next timely reload, and preserve the browser's native cache-bypass behavior. Added Ctrl+F5 as well as Cmd/Ctrl+Shift+R and Shift+F5. Stale requests, ordinary refresh keys, key repeats, unrelated modifiers, link navigation and history traversal cannot request a replay. Reduced motion still bypasses animation, and temporary manual scroll restoration is restored after finishing or skipping.

All 48 tests, build, syntax and whitespace checks passed. A local browser fixture confirmed a captured Mac hard-refresh chord followed by native `location.reload()` entered the power phase and consumed the marker; its next regular native reload stayed quiet. The in-app automation's reload method reported navigation rather than native reload, so the fixture's native reload button was used to test that distinction. No new user-facing controls or layout changes were introduced.

Limitation: this implements observed hard-refresh shortcuts, not universal detection of browser-menu hard reloads. The browser API categorizes both hard and normal refresh as `reload` (https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming/type). We do not claim toolbar/DevTools-only detection. The homepage preview is open.

## Scroll-independent intro

Updated `scripts/intro.js`, `styles/intro.css`, the homepage asset versions and lifecycle tests. Removed all wheel, scroll and touch cancellation handlers, the initial scroll-position cancellation, and cancellation from scrolling keys. Escape/Tab, reduced motion and lifecycle safety still work. Only the header and hero text participate in the intro; the story, lower CTA and footer stay visible and do not fade again when boot completes.

All 48 tests and the build pass, including non-cancellation checks at all five animation stages. Browser verification scrolled to y=767 while the power phase remained active: all three lower sections had opacity 1, visible visibility and no animation. Intro completion preserved y=767 and did not animate the lower content. Final result: passed.

## Workshop fidelity restoration

final result: passed

Restored exact pre-redesign originals for `workshops/primes.html`, `workshops/troubleshoot.html`, and `workshops/serverbuild.html`, recovered from this task's original file-read outputs into `.omx/recovery/workshops/`. This preserves the newer local tools and navigation additions that were absent from the older sibling repository. Recovery provenance and hashes are retained there.

The only subsequent changes inside those documents are CSS imports in existing style blocks. Removing style-block contents yields exact equality with each recovered original, including all HTML, inline JavaScript, text, attributes and whitespace. Verification hashes are saved in `.omx/recovery/workshops/css-only-verification.json`.

`styles/workshop-theme.css` supplies black/off-white surfaces, orange accents and focus treatments without replacing the original typography, type scale, page structure, navigation or controls. Original semantic colors remain where appropriate. CSS-only responsive fixes allow the filename headers to wrap, contain mobile dropdowns and long documentation cards, and remove a decorative pseudo-element that caused page overflow. No new HTML links or elements were added to the originals.

Browser checks: original workshop dropdowns navigate correctly; original server JSON dialog opens/closes; original prime reference search ranks bytearray results. All three workshop layouts were inspected. At 390px, the corrected dropdown is bounded by x=16 and x=366, and populated prime results no longer expand the page (scrollWidth 390). Screenshots include `.omx/qa/workshop-primes-faithful.png`, `.omx/qa/workshop-server-faithful.png`, and `.omx/qa/workshop-menu-mobile.png`. No console errors in the tested flows. All 48 tests and the build pass. Existing Tailwind/Lucide and Google Font dependencies remain as in the original documents.

The previous workshop redesign and unified-header statements earlier in this report are superseded by this restoration. Future workshop visual edits are CSS-only unless the user requests content or functional changes.

## Error-diffusion photo replacement

final result: passed

Replaced all six active photographic images with matching exports from Downloads: homepage group photo, About soldering photo, and four officer portraits. Added lossless WebP assets, updated `index.html` / `about/index.html` references and dimensions, removed grayscale filters in `styles/main.css`, and added new assets to the build inventory. No workshop markup changed. Input/output sizes and encoding details are documented in `docs/image-assets.md`.

All six format conversions have zero pixel differences from their resized PNG intermediates. Nearest-neighbor resizing preserves discrete color values; the original PNG exports remain untouched. Combined delivered files total 500,638 bytes.

Browser views at 1280×900 and 390×844 confirm all images load, retain their intended crop and colors, and introduce no page overflow. Evidence: `.omx/qa/dither-home.png`, `.omx/qa/dither-officers.png`, `.omx/qa/dither-mobile.png`. Source exports were visually inspected before conversion. All 48 tests and build pass. Earlier grayscale-photo descriptions in this report are superseded by the supplied colored error-diffusion treatment.

## Workshop remaster — September 8, 2026

final result: passed (visual verdict 94/100)

This revision supersedes the palette-only workshop restoration. The user requested integration into the redesign while keeping all content and items intact. Updated `workshops/primes.html`, `workshops/serverbuild.html`, and `workshops/troubleshoot.html` only around their mastheads: retained original navigation destinations and handlers, moved the prime navigation above its hero, and kept server/troubleshooting filenames as labels above readable page titles. All three load `styles/workshop-remaster.css`, which reuses the existing shared font/token stylesheet. Main workshop markup and every inline/external script element remain byte-for-byte unchanged.

The remaster replaces pill/rounded treatments with square controls and thin dividers, uses Jersey 10 for display headings and IBM Plex Mono for reading text, broadens the reading surface, and aligns navigation with the redesign. All original rules, examples, command-table rows, OODA steps, optimization phases, documentation entries, tracker slots, thumbnails, controls, and footer items remain. No new dependencies or shared homepage stylesheet/script edits were needed.

Verification:
- Added `tests/workshop-preservation.test.mjs` and `tests/fixtures/workshop-originals.json` before edits. SHA-256 checks lock the original complete main markup and every script, and verify original link destinations remain.
- All 51 tests and static build pass. Inline JavaScript syntax and `git diff --check` pass. This plain static project has no separate lint/typecheck scripts.
- All three pages have no horizontal document overflow at 320, 390, 768 and 1424 CSS pixels. Workshop dropdowns open, close and stay within the viewport.
- Tracker: $12.50 CPU + $7.50 GPU = $20.00; custom slot addition, reload persistence, invalid JSON feedback, dialog cancel, one-second timer completion and reset pass. Fullscreen expands main to 1367px in a 1424px viewport. Browser test storage was restored afterward.
- Prime reference: bytearray search returns 16 matches; expand/collapse and asynchronous Copied feedback pass. Desktop/mobile result cards and code panels inspected.
- Visually checked all page tops, tracker fields, prime reference, troubleshooting command table and OODA sequence. No browser console errors in tested flows.

Evidence lives in `output/playwright/`: final `{primes,serverbuild,troubleshoot}-{desktop,mobile}.png`, `server-tracker-desktop.png`, `server-part-mobile.png`, `primes-search-mobile.png`, and `troubleshoot-reference-{desktop,mobile}.png`. Verdict is stored under `.omx/state/workshop-remaster/ralph-progress.json`.

Remaining limits: existing Tailwind/Lucide and Google Font dependencies are retained. Verification used Chromium; Safari and Firefox were not exercised. No deployment performed.

## Orange ASCII title logo

Added the supplied ASCII beaver to the right of “About the clerb.” During review the user provided a new lower-density `-small` export; this supersedes the initial dense version. The active logo comes from `images/ascii/club-logo-small.txt`, with its empty `@` border trimmed to a 20×14 visible grid. Its text uses the site orange, and its 56–90px width stays beside a responsively sized title. The homepage CRT beaver also uses accent orange; the red power cells are unchanged.

Verified the small logo at 390px without overflow and measured both orange logos as rgb(255,107,44), with the CRT power light rgb(255,72,72). All 51 tests and the build passed. Changed the About markup, logo source assets, `styles/main.css`, `styles/intro.css`, and homepage stylesheet version. Final result: passed.
