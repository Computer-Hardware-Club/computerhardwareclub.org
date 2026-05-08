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
        'dist/scripts/site.js',
        'dist/images/club/group_photo.jpeg',
        'dist/utilities/index.html',
        'dist/utilities/vendor/qrcode.min.js',
        'dist/workshops/primes.html',
        'dist/workshops/troubleshoot.html',
        'dist/workshops/serverbuild.html'
    ];

    expectedFiles.forEach((relativePath) => {
        assert.equal(existsSync(join(projectRoot, relativePath)), true, `${relativePath} should exist after build`);
    });

    const homePage = readFileSync(join(projectRoot, 'dist/index.html'), 'utf8');
    const aboutPage = readFileSync(join(projectRoot, 'dist/about/index.html'), 'utf8');
    const utilitiesPage = readFileSync(join(projectRoot, 'dist/utilities/index.html'), 'utf8');
    const cname = readFileSync(join(projectRoot, 'dist/CNAME'), 'utf8').trim();

    assert.match(homePage, /Computer Hardware Club/);
    assert.match(homePage, /Join on Discord/);
    assert.match(homePage, /Utilities/);
    assert.match(homePage, /nav-dropdown/);
    assert.match(aboutPage, /Officer team/i);
    assert.match(aboutPage, /Utilities/);
    assert.match(utilitiesPage, /QR Generator/i);
    assert.match(utilitiesPage, /Random Number Generator/i);
    assert.equal(cname, 'computerhardwareclub.org');
});
