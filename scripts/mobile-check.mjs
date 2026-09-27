// Mobile verification harness for the home and about pages.
//
// Checks the composed phone/tablet layout, confirms the desktop rendering is
// untouched, exercises the mobile menu and records the CRT intro sequence.
// Playwright is not a dependency of this static site; point PLAYWRIGHT_PATH at
// any playwright install (defaults to a sibling project's copy).
//
//   node scripts/dev-server.mjs &
//   node scripts/mobile-check.mjs
//
// Findings are written to output/mobile-audit/.
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const playwrightEntry = process.env.PLAYWRIGHT_PATH
    || 'C:/Users/ofhd/Documents/Projects/oliverdougherty.com/node_modules/playwright/index.js';
const mod = await import(pathToFileURL(playwrightEntry).href);
const chromium = mod.chromium || mod.default?.chromium;

const base = process.env.BASE || 'http://127.0.0.1:8099';
const outDir = 'output/mobile-audit';
const pages = ['index.html', 'about/index.html'];
const phoneWidths = [320, 390, 430];
const tabletWidths = [768, 860];

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const failures = [];

const open = (width, height) => browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: width <= 430,
    hasTouch: width <= 430,
    reducedMotion: 'reduce'
});

// Anything wider than the viewport, ignoring elements deliberately clipped by an
// ancestor's overflow, would let the page scroll sideways on a phone.
const measure = page => page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const overflowing = [];
    document.querySelectorAll('body *').forEach(element => {
        const rect = element.getBoundingClientRect();
        if (!rect.width && !rect.height) return;
        const style = getComputedStyle(element);
        if (style.position === 'fixed' || style.display === 'none' || style.visibility === 'hidden') return;
        for (let parent = element.parentElement; parent; parent = parent.parentElement) {
            const parentStyle = getComputedStyle(parent);
            if (parentStyle.overflowX === 'hidden' || parentStyle.overflowX === 'clip') return;
        }
        if (rect.right > viewport + 1 || rect.left < -1) {
            overflowing.push(`${element.tagName.toLowerCase()}.${(element.className || '').toString().split(' ')[0]} [${Math.round(rect.left)},${Math.round(rect.right)}]`);
        }
    });
    const undersized = [];
    document.querySelectorAll('a, button, summary, input, select, textarea').forEach(element => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') return;
        // The ASCII artwork is decorative text, never a control.
        if (element.closest('.crt-display, .about-ascii-logo')) return;
        if ((rect.width && rect.height) && (rect.height < 32 || rect.width < 24)) {
            undersized.push(`${element.tagName.toLowerCase()} "${(element.textContent || '').trim().slice(0, 24)}" ${Math.round(rect.width)}x${Math.round(rect.height)}`);
        }
    });
    const order = [...document.querySelector('.hero-stage')?.children || []]
        .map(element => ({ name: element.className.split(' ')[0], y: Math.round(element.getBoundingClientRect().top) }))
        .sort((a, b) => a.y - b.y)
        .map(entry => entry.name);
    const heading = document.querySelector('.hero-heading h1');
    const dropdown = document.querySelector('.nav-dropdown');
    return {
        viewport,
        scrollWidth: document.documentElement.scrollWidth,
        overflowing,
        undersized,
        heroOrder: order,
        workshopsMenuVisible: dropdown ? dropdown.getBoundingClientRect().height > 0 : false,
        headingSize: heading ? getComputedStyle(heading).fontSize : null,
        headerPosition: getComputedStyle(document.querySelector('.site-header')).position
    };
});

for (const pagePath of pages) {
    const slug = pagePath.replace(/[\/.]/g, '_');
    for (const width of [...phoneWidths, ...tabletWidths]) {
        const context = await open(width, width <= 430 ? 844 : 1024);
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(String(error)));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        await page.goto(`${base}/${pagePath}`, { waitUntil: 'load' });
        await page.waitForTimeout(400);
        const result = await measure(page);
        await page.screenshot({ path: `${outDir}/${slug}-${width}.png`, fullPage: true });

        if (result.scrollWidth > result.viewport) failures.push(`${pagePath}@${width}: page scrolls sideways (${result.scrollWidth} > ${result.viewport})`);
        result.overflowing.forEach(item => failures.push(`${pagePath}@${width}: overflows viewport -> ${item}`));
        result.undersized.forEach(item => failures.push(`${pagePath}@${width}: touch target under 32px -> ${item}`));
        errors.forEach(error => failures.push(`${pagePath}@${width}: console error -> ${error}`));

        if (width <= 430) {
            if (result.workshopsMenuVisible) failures.push(`${pagePath}@${width}: workshops menu is offered on a phone`);
            if (pagePath === 'index.html' && result.heroOrder.join(',') !== 'hero-art,hero-identity,hero-invite') {
                failures.push(`${pagePath}@${width}: hero order is ${result.heroOrder.join(' > ')}`);
            }
        }
        console.log(`${pagePath}@${width}: scrollWidth=${result.scrollWidth} hero=[${result.heroOrder.join(' > ')}] workshopsNav=${result.workshopsMenuVisible} heading=${result.headingSize}`);
        await context.close();
    }
}

// Desktop control: the identity-left, art-centre, invite-right composition and
// the workshops menu must survive exactly as before.
for (const width of [1280, 1440]) {
    const context = await open(width, 900);
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const layout = await page.evaluate(() => {
        const box = selector => {
            const rect = document.querySelector(selector).getBoundingClientRect();
            return {
                x: Math.round(rect.left),
                width: Math.round(rect.width),
                top: Math.round(rect.top),
                center: Math.round(rect.top + rect.height / 2)
            };
        };
        return {
            identity: box('.hero-identity'),
            art: box('.hero-art'),
            invite: box('.hero-invite'),
            columns: getComputedStyle(document.querySelector('.hero-stage')).gridTemplateColumns,
            headerPosition: getComputedStyle(document.querySelector('.site-header')).position,
            workshopsVisible: document.querySelector('.nav-dropdown').getBoundingClientRect().height > 0,
            workshopsLinks: document.querySelectorAll('.nav-dropdown-list a').length
        };
    });
    await page.screenshot({ path: `${outDir}/index_html-desktop-${width}.png` });
    const { identity, art, invite } = layout;
    // Baseline: identity occupies column 1, the artwork keeps the centre column,
    // and the invitation sits in column 3. The side blocks are vertically centred
    // against the artwork (they carry a small deliberate lift).
    if (!(identity.x < art.x && art.x < invite.x)) failures.push(`desktop@${width}: hero columns moved (identity x=${identity.x}, art x=${art.x}, invite x=${invite.x})`);
    if (art.width < 260) failures.push(`desktop@${width}: artwork column shrank to ${art.width}px`);
    const centers = [identity.center, art.center, invite.center];
    if (Math.max(...centers) - Math.min(...centers) > 120) failures.push(`desktop@${width}: hero blocks left the shared row (centers ${centers.join(', ')})`);
    if (layout.headerPosition !== 'relative') failures.push(`desktop@${width}: header position changed to ${layout.headerPosition}`);
    if (!layout.workshopsVisible || layout.workshopsLinks !== 3) failures.push(`desktop@${width}: workshops menu is missing or incomplete`);
    console.log(`desktop@${width}: columns=[${layout.columns}] identity.x=${identity.x} art.x=${art.x} invite.x=${invite.x} header=${layout.headerPosition} workshops=${layout.workshopsVisible}`);
    await context.close();
}

// Mobile menu open state.
{
    const context = await open(390, 844);
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    await page.click('[data-menu-toggle]');
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${outDir}/index_html-menu-open.png` });
    const state = await page.evaluate(() => ({
        expanded: document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded'),
        aboutVisible: document.querySelector('#nav-links a[href="about/"]')?.getBoundingClientRect().height > 0
    }));
    if (state.expanded !== 'true' || !state.aboutVisible) failures.push('mobile menu did not open with a usable About link');
    console.log(`mobile menu: ${JSON.stringify(state)}`);
    await context.close();
}

// First-visit CRT intro must still boot in order on a phone and on desktop.
for (const [label, width, height] of [['mobile', 390, 844], ['desktop', 1440, 900]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'load' });
    const phases = [];
    const deadline = Date.now() + 14000;
    while (Date.now() < deadline) {
        const phase = await page.evaluate(() => document.documentElement.dataset.introPhase || '');
        if (phase && !phases.includes(phase)) {
            phases.push(phase);
            await page.screenshot({ path: `${outDir}/intro-${label}-${phase}.png` });
        }
        if (phase === 'ready') break;
        await page.waitForTimeout(120);
    }
    await page.waitForTimeout(600);
    const settled = await page.evaluate(() => ({
        pending: document.documentElement.classList.contains('intro-pending'),
        beaver: [...document.querySelectorAll('.crt-beaver')].filter(cell => getComputedStyle(cell).visibility === 'visible').length
    }));
    const expected = ['waiting', 'power', 'loading', 'scanning', 'ready'];
    if (phases.join(',') !== expected.join(',')) failures.push(`intro@${label}: phases were ${phases.join(',')}`);
    if (settled.pending || settled.beaver !== 750) failures.push(`intro@${label}: settled state ${JSON.stringify(settled)}`);
    console.log(`intro@${label}: ${phases.join(' > ')} settled=${JSON.stringify(settled)}`);
    await context.close();
}

await browser.close();

if (failures.length) {
    console.error(`\n${failures.length} mobile check failure(s):`);
    failures.forEach(failure => console.error(` - ${failure}`));
    process.exitCode = 1;
} else {
    console.log('\nAll mobile checks passed.');
}
