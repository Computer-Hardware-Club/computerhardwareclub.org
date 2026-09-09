import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const testFile = fileURLToPath(import.meta.url);
const projectRoot = dirname(dirname(testFile));

test('build.mjs creates the core static site bundle', () => {
    execFileSync(process.execPath, ['build.mjs'], {
        cwd: projectRoot,
        stdio: 'inherit'
    });

    const expectedFiles = [
        'dist/404.html',
        'dist/index.html',
        'dist/about/index.html',
        'dist/500.html',
        'dist/CNAME',
        'dist/styles/main.css',
        'dist/styles/site-shell.css',
        'dist/styles/workshop-theme.css',
        'dist/styles/fonts/jersey-10-latin.woff2',
        'dist/styles/fonts/ibm-plex-mono-latin.woff2',
        'dist/styles/fonts/ibm-plex-mono-semibold-latin.woff2',
        'dist/images/ascii/beaver-crt.png',
        'dist/images/ascii/beaver-crt.txt',
        'dist/scripts/site.js',
        'dist/scripts/intro.js',
        'dist/styles/intro.css',
        'dist/images/club/group_photo.jpeg',
        'dist/images/club/members_solering.jpeg',
        'dist/images/club/group_photo-error-diffusion.webp',
        'dist/images/club/members_solering-error-diffusion.webp',
        'dist/images/officers/president-error-diffusion.webp',
        'dist/images/officers/vicepresident-error-diffusion.webp',
        'dist/images/officers/treasurer-error-diffusion.webp',
        'dist/images/officers/workshop_coordinator-error-diffusion.webp',
        'dist/workshops/primes.html',
        'dist/workshops/troubleshoot.html',
        'dist/workshops/serverbuild.html'
    ];

    expectedFiles.forEach((relativePath) => {
        assert.equal(existsSync(join(projectRoot, relativePath)), true, `${relativePath} should exist after build`);
    });

    assert.equal(existsSync(join(projectRoot, 'utilities')), false, 'Utilities source should be removed');
    assert.equal(existsSync(join(projectRoot, 'dist/utilities')), false, 'Utilities should not be published');
    assert.equal(existsSync(join(projectRoot, 'dist/styles/workshops.css')), false, 'Unused utility styles should not be published');

    const homePage = readFileSync(join(projectRoot, 'dist/index.html'), 'utf8');
    const aboutPage = readFileSync(join(projectRoot, 'dist/about/index.html'), 'utf8');
    const troubleshootPage = readFileSync(join(projectRoot, 'dist/workshops/troubleshoot.html'), 'utf8');
    const serverbuildPage = readFileSync(join(projectRoot, 'dist/workshops/serverbuild.html'), 'utf8');
    const primesPage = readFileSync(join(projectRoot, 'dist/workshops/primes.html'), 'utf8');
    const cname = readFileSync(join(projectRoot, 'dist/CNAME'), 'utf8').trim();

    assert.match(homePage, /Computer Hardware Club/);
    assert.match(homePage, /class="crt-ascii"/);
    assert.doesNotMatch(homePage, /<img[^>]+beaver-crt\.png/);
    assert.match(homePage, /Join on Discord/);
    assert.match(homePage, /nav-dropdown/);
    assert.match(aboutPage, /aria-labelledby="officers-title"/);
    assert.equal(cname, 'computerhardwareclub.org');

    // All workshop pages have nav-dropdown
    assert.match(troubleshootPage, /nav-dropdown/, 'Troubleshoot page should have nav-dropdown');
    assert.match(serverbuildPage, /nav-dropdown/, 'Server Build page should have nav-dropdown');
    assert.match(primesPage, /nav-dropdown/, 'Primes page should have nav-dropdown');

    const workshopNames = ['1-Second Prime Showdown', 'Troubleshooting Workshop', 'Server Build Competition'];
    workshopNames.forEach((name) => {
        assert.ok(troubleshootPage.includes(name), `Troubleshoot dropdown should link to ${name}`);
        assert.ok(serverbuildPage.includes(name), `Server Build dropdown should link to ${name}`);
        assert.ok(primesPage.includes(name), `Primes dropdown should link to ${name}`);
    });

    // Unified footer links on all pages
    const footerLinks = [/GitHub/, /Discord/, /Email/];
    const allPages = [homePage, aboutPage, troubleshootPage, serverbuildPage, primesPage];
    allPages.forEach((page, i) => {
        const pageName = ['Home', 'About', 'Troubleshoot', 'Server Build', 'Primes'][i];
        footerLinks.forEach((link) => {
            assert.match(page, link, `${pageName} page should have footer link matching ${link.source}`);
        });
    });

    // Keep the home shell consistent in source and published pages, including errors.
    const pagePaths = ['index.html', 'about/index.html',
        '404.html', '500.html', 'workshops/primes.html',
        'workshops/troubleshoot.html', 'workshops/serverbuild.html'];
    const canonicalHeader = (page, path) => page.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0]
        .replace(/href="([^"]+)"/g, (_, href) => `href="${new URL(href, `https://computerhardwareclub.org/${path}`).pathname}"`)
        .replace(/ aria-current="page"/g, '')
        .replace(/\s+>/g, '>');
    const canonicalFooter = page => page.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)?.[0];
    for (const prefix of ['', 'dist/']) {
        for (const path of pagePaths) {
            const page = readFileSync(join(projectRoot, prefix + path), 'utf8');
            assert.doesNotMatch(page, /href="[^"\s]*utilities(?:[/?#"])/i, `${path}: no links to removed Utilities page`);
            assert.equal(canonicalHeader(page, path), canonicalHeader(homePage, 'index.html'), `${prefix + path}: home navigation`);
            assert.equal(canonicalFooter(page), canonicalFooter(homePage), `${prefix + path}: home footer`);
            assert.equal([...page.matchAll(/<footer\b/g)].length, 1, `${path}: one site footer`);
            assert.match(page, /<script src="(?:\.\.\/|\/)?scripts\/site\.js" defer><\/script>/, `${path}: shared menu behavior`);
            assert.doesNotMatch(page, /document\.querySelectorAll\('\.nav-dropdown-btn'\)/, `${path}: no competing menu handler`);
        }
    }
});
