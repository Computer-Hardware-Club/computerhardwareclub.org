import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = relativePath => readFileSync(join(projectRoot, relativePath), 'utf8');

const mobileCss = read('styles/mobile.css');
const siteJs = read('scripts/site.js');

// The mobile layer is additive: desktop rules stay in main.css and friends, and
// every mobile override lives behind the same narrow-screen query.
const mobileBreakpoint = '(max-width: 860px)';

test('mobile stylesheet is layered after the desktop stylesheets', () => {
    const home = read('index.html');
    const about = read('about/index.html');
    assert.doesNotMatch(home, /@import\s+url\(['"]\.\/mobile\.css/, 'mobile.css must not be @imported: @import is ignored after other rules, so it would lose the cascade');
    assert.doesNotMatch(read('styles/main.css'), /mobile\.css/, 'main.css should not reference mobile.css');

    for (const [page, expected] of [[home, 'styles/mobile.css'], [about, '../styles/mobile.css']]) {
        const mainIndex = page.indexOf('styles/main.css');
        const mobileIndex = page.indexOf(expected);
        assert.notEqual(mobileIndex, -1, `${expected} must be linked`);
        assert.ok(mobileIndex > mainIndex, `${expected} must load after main.css so its overrides win`);
    }
});

test('mobile stylesheet is scoped to narrow screens', () => {
    assert.match(mobileCss, new RegExp(`@media\\s*${mobileBreakpoint.replace(/[()]/g, '\\$&')}`), 'mobile overrides need the shared narrow-screen query');
    assert.doesNotMatch(mobileCss, /@media\s*\(min-width/, 'mobile.css must not contain desktop-width rules');
    assert.doesNotMatch(mobileCss, /\.workshop-(theme|remaster)\.css/, 'the desktop-only workshop stylesheets must not be pulled into the mobile layer');
});

test('mobile stylesheet covers the composed mobile shell', () => {
    const required = [
        '.hero-stage',                 // stacked hero container
        '.hero-art',                   // artwork first
        '.hero-identity',              // club identity second
        '.hero-invite',                // invitation and action third
        '.officer-grid',               // single-column officer cards
        '.site-header .nav-dropdown',  // desktop-only workshops entry
        '.site-footer .footer-links a',// tappable footer rows
        '.join-section',               // closing call to action
        '.page-title'                  // about page masthead
    ];
    required.forEach(selector => {
        assert.ok(mobileCss.includes(selector), `mobile.css should style ${selector}`);
    });

    assert.match(mobileCss, /\.hero-art\s*\{[^}]*order:\s*1/s, 'artwork should lead the stacked hero');
    assert.match(mobileCss, /\.hero-identity\s*\{[^}]*order:\s*2/s, 'identity should follow the artwork');
    assert.match(mobileCss, /\.hero-invite\s*\{[^}]*order:\s*3/s, 'the invitation should come last');
    assert.match(mobileCss, /\.officer-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s, 'officers should be one column on a phone');
    assert.match(mobileCss, /\.site-header \.nav-dropdown\s*\{[^}]*display:\s*none/s, 'the workshops entry should be withheld on narrow screens');
});

test('mobile stylesheet raises phone reading and tap sizes', () => {
    // Body copy and headings get phone-sized values instead of the shrunken desktop scale.
    assert.match(mobileCss, /\.section-intro p:not\(\.eyebrow\)[\s\S]{0,200}?font-size:\s*16px/, 'body copy should read at 16px on a phone');
    assert.match(mobileCss, /\.officer \.eyebrow[\s\S]{0,120}?font-size:\s*11px/, 'officer role labels should not fall below 11px');
    assert.match(mobileCss, /\.site-footer \.footer-links a\s*\{[^}]*min-height:\s*44px/s, 'footer links need a 44px touch row');
    assert.match(mobileCss, /min-height:\s*56px/, 'primary actions should keep a large touch height');
});

test('page shell opts into safe areas without changing the desktop shell', () => {
    for (const page of ['index.html', 'about/index.html']) {
        const html = read(page);
        assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">/, `${page}: viewport-fit=cover for notched phones`);
        // The desktop shell markup is shared and must not be restructured.
        assert.equal([...html.matchAll(/<header class="site-header">/g)].length, 1, `${page}: one site header`);
        assert.equal([...html.matchAll(/<ul class="nav-links" id="nav-links">/g)].length, 1, `${page}: nav list preserved`);
    }
});

test('shared navigation defers workshop links to desktop and marks the current page', () => {
    assert.match(siteJs, /\.nav-dropdown/, 'the shared script must be aware of the workshops entry');
    assert.match(siteJs, /aria-current/, 'the shared script should mark the current page for screen readers');
    // The stacked hero is CSS order only. Reordering the DOM would change which
    // grid column each block lands in and move the desktop composition.
    assert.doesNotMatch(siteJs, /hero-stage|hero-art|hero-identity|hero-invite/, 'the shared script must not restructure the hero');
    // Workshop pages stay published and directly linkable.
    const workshopPages = ['workshops/primes.html', 'workshops/troubleshoot.html', 'workshops/serverbuild.html'];
    workshopPages.forEach(page => {
        assert.ok(read(page).length > 0, `${page} should still be published`);
    });
});

test('hero keeps its desktop source order', () => {
    const home = read('index.html');
    const art = home.indexOf('class="hero-art"');
    const identity = home.indexOf('class="hero-identity"');
    const invite = home.indexOf('class="hero-invite"');
    assert.ok(art !== -1 && identity !== -1 && invite !== -1, 'home hero blocks must exist');
    assert.ok(identity < art && art < invite, 'source order stays identity, art, invite so the desktop three-column grid is unchanged');
});

test('hero blocks carry explicit mobile order instead of moving markup', () => {
    const orders = [...mobileCss.matchAll(/\.hero-(art|identity|invite)\s*\{[^}]*order:\s*(\d)/g)]
        .map(match => `${match[1]}:${match[2]}`);
    assert.deepEqual(orders.sort(), ['art:1', 'identity:2', 'invite:3'], `hero blocks need explicit mobile order, found ${orders.join(', ') || 'none'}`);
});

test('phone hero fills one portrait screen so the photo stays below the fold', () => {
    // Full-height hero, but only in portrait: landscape has no room for it.
    assert.match(mobileCss, /@media \(orientation: portrait\)\s*\{[\s\S]*?\.home-hero\s*\{[^}]*height:\s*calc\(100svh - var\(--header-height\)\)/s, 'the hero should fill one portrait screen');
    assert.match(mobileCss, /@media \(orientation: portrait\)\s*\{[\s\S]*?\.home-hero\s*\{[^}]*overflow:\s*hidden/s, 'the full-height hero must clip its contents');
    // The artwork box must not be inflated by the deliberately oversized CRT art.
    assert.match(mobileCss, /\.hero-art\s*\{[^}]*min-width:\s*0/s, 'the artwork flex item needs min-width: 0');
    assert.match(mobileCss, /\.hero-art\s*\{[^}]*min-height:\s*0/s, 'the artwork flex item needs min-height: 0');
    // The artwork is sized from screen height, not the text column.
    assert.match(mobileCss, /\.hero-art\s*\{[^}]*width:\s*clamp\([^)]*dvh/s, 'the artwork should be sized from screen height');
    // One gap owns the stack spacing; legacy margins in main.css are reset.
    assert.match(mobileCss, /\.hero-stage\s*\{[^}]*gap:\s*var\(--hero-gap\)/s, 'the stage should own the stack spacing');
    assert.match(mobileCss, /\.hero-identity\s*\{[^}]*margin:\s*0/s, 'legacy identity margins must be reset');
    assert.match(mobileCss, /\.hero-invite\s*\{[^}]*margin:\s*0/s, 'legacy invite margins must be reset');
});
