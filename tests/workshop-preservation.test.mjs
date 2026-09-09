import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const originals = JSON.parse(readFileSync(new URL('./fixtures/workshop-originals.json', import.meta.url)));
const digest = text => createHash('sha256').update(text).digest('hex');
for (const [name, original] of Object.entries(originals)) {
    test(`${name} remaster preserves the complete workshop body, scripts and original destinations`, () => {
        const page = readFileSync(new URL(`../workshops/${name}.html`, import.meta.url), 'utf8');
        assert.equal(digest(page.match(/<main\b[^>]*>[\s\S]*?<\/main>/)[0]), original.main);
        assert.deepEqual([...page.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].map(match => digest(match[0])), original.scripts);
        const resolve = link => new URL(link, `https://computerhardwareclub.org/workshops/${name}.html`).href;
        const links = [...page.matchAll(/href="([^"]+)"/g)].map(match => resolve(match[1]));
        for (const link of original.links) assert.ok(links.includes(resolve(link)), `Missing destination: ${link}`);
    });
}
