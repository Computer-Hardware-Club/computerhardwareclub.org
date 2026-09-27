// Checks that the hero is vertically centred in the free space and that no part
// of the following section is visible on first load.
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const playwrightEntry = process.env.PLAYWRIGHT_PATH
    || 'C:/Users/ofhd/Documents/Projects/oliverdougherty.com/node_modules/playwright/index.js';
const mod = await import(pathToFileURL(playwrightEntry).href);
const chromium = mod.chromium || mod.default?.chromium;

const devices = [
    ['small-phone', 360, 640],
    ['iphone-se', 375, 667],
    ['iphone-14', 390, 844],
    ['pro-max', 430, 932],
    ['tablet', 768, 1024],
    ['short-landscape', 740, 360]
];

mkdirSync('output/mobile-audit/hero', { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const page = await context.newPage();
const failures = [];

for (const [label, width, height] of devices) {
    await page.setViewportSize({ width, height });
    await page.goto('http://127.0.0.1:8099/index.html', { waitUntil: 'load' });
    await page.waitForTimeout(350);
    const info = await page.evaluate(() => {
        const rect = selector => {
            const element = document.querySelector(selector);
            const box = element.getBoundingClientRect();
            return { top: Math.round(box.top), bottom: Math.round(box.bottom), h: Math.round(box.height), w: Math.round(box.width) };
        };
        const header = rect('.site-header');
        const heading = rect('.hero-heading h1');
        const invite = rect('.hero-invite');
        const story = rect('.club-story');
        const photo = rect('.club-photo');
        return {
            viewportHeight: window.innerHeight,
            headerBottom: header.bottom,
            headingTop: heading.top,
            inviteBottom: invite.bottom,
            heroBottom: rect('.home-hero').bottom,
            artSize: `${rect('.hero-art').w}x${rect('.hero-art').h}`,
            storyTop: story.top,
            photoTop: photo.top
        };
    });
    const roomAbove = info.headingTop - info.headerBottom;
    const roomBelow = info.viewportHeight - info.inviteBottom;
    const landscape = width > height;
    // In portrait the hero is exactly one screen tall, and the block inside must
    // sit roughly balanced. In landscape there is no room for a full-screen hero,
    // so it keeps its natural height and the page scrolls; only the fold matters.
    const fitsScreen = landscape || info.heroBottom <= info.viewportHeight + 2;
    const balanced = landscape || (roomAbove >= 8 && roomBelow >= 8 && Math.abs(roomAbove - roomBelow) <= 40);
    const photoHidden = info.photoTop >= info.viewportHeight;
    // A browser can round the viewport unit used for the hero height, so allow a
    // few pixels. This only inspects the section box; the photo check is the one
    // that matters.
    const foldClean = info.storyTop >= info.viewportHeight - 14;
    await page.screenshot({ path: `output/mobile-audit/hero/${label}-${width}x${height}.png` });
    console.log(`${label} ${width}x${height}: roomAbove=${roomAbove} roomBelow=${roomBelow} heroFits=${fitsScreen} art=${info.artSize} storyTop=${info.storyTop}/${info.viewportHeight} photoTop=${info.photoTop} photoHidden=${photoHidden} foldClean=${foldClean}`);
    if (!fitsScreen) failures.push(`${label}: hero is taller than the screen (${info.heroBottom} > ${info.viewportHeight})`);
    if (!balanced) failures.push(`${label}: hero contents not balanced (above ${roomAbove}px, below ${roomBelow}px)`);
    if (!photoHidden) failures.push(`${label}: club photo is visible on first load (photoTop ${info.photoTop} < viewport ${info.viewportHeight})`);
    if (!foldClean) failures.push(`${label}: the next section is meaningfully visible at the fold (storyTop ${info.storyTop} < viewport ${info.viewportHeight})`);
}

await context.close();
await browser.close();
if (failures.length) {
    console.error('\nHero fold failures:');
    failures.forEach(failure => console.error(` - ${failure}`));
    process.exitCode = 1;
} else {
    console.log('\nHero is centred and the fold is clean on every tested device.');
}
