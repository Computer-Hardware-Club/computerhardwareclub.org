import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { renderCrt, renderCrtIntoPage } from '../render-crt.mjs';

const source = readFileSync(new URL('../images/ascii/beaver-crt.txt', import.meta.url), 'utf8');
const lines = source.replaceAll('\r\n', '\n').trimEnd().split('\n');
const startMarker = '<!-- CRT_ASCII_START -->';
const endMarker = '<!-- CRT_ASCII_END -->';

function decodeEntities(text) {
    return text.replaceAll('&#32;', ' ').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
}

function artContent(html) {
    const match = html.match(/<pre class="crt-ascii"[^>]*>([\s\S]*?)<\/pre>/);
    assert.ok(match, 'render must contain the ASCII text layer');
    return match[1];
}

function reconstruct(html) {
    return decodeEntities(artContent(html).replace(/<\/?span\b[^>]*>/g, ''));
}

test('the supplied 156 by 91 export survives rendering with only background dashes removed', () => {
    const result = renderCrt(source);
    assert.equal(lines.length, 91);
    assert.ok(lines.every(line => line.length === 156));
    assert.equal(result.rows, 91);
    assert.equal(result.columns, 156);
    assert.doesNotMatch(result.html, /[\t ]+$/m, 'generated HTML must not contain literal trailing whitespace');
    const restored = reconstruct(result.html);
    assert.equal(restored, lines.join('\n').replaceAll('-', ' '));
    assert.ok(restored.split('\n').every(line => line.length === 156), 'span markup must not add or lose cells');
    assert.equal(renderCrt(source.replaceAll('\n', '\r\n')).html, result.html, 'Windows newlines retain the same grid');
});

test('the power light uses two aligned rows of three source glyphs', () => {
    const html = artContent(renderCrt(source).html);
    const power = [...html.matchAll(/<span class="crt-power" data-cell="(\d+):(\d+)">([^<]*)<\/span>/g)];
    assert.equal(power.length, 2);
    assert.deepEqual(power.map(span => [Number(span[1]), Number(span[2])]), [[57, 123], [58, 123]]);
    for (const [, row, , glyphs] of power) {
        assert.equal(glyphs, '+++');
        assert.equal(glyphs, lines[Number(row)].slice(123, 126));
        assert.equal(reconstruct(renderCrt(source).html).split('\n')[Number(row)].slice(123, 126), '+++');
    }
});

test('every beaver span preserves one source glyph and reveals in row-major order', () => {
    const result = renderCrt(source);
    const spans = [...artContent(result.html).matchAll(
        /<span class="crt-beaver" data-cell="(\d+):(\d+)" style="--scan-progress:([\d.]+)">([^<]*)<\/span>/g
    )];
    const expectedCells = [];
    for (let row = 22; row <= 51; row++) {
        for (let col = 46; col <= 117; col++) {
            if (!['-', ' '].includes(lines[row][col])) expectedCells.push(`${row}:${col}`);
        }
    }
    assert.ok(spans.length > 0, 'the beaver must have animated text cells');
    assert.equal(result.beaverCount, expectedCells.length);
    assert.equal(spans.length, result.beaverCount);
    assert.deepEqual(spans.map(span => `${span[1]}:${span[2]}`), expectedCells,
        'every visible screen glyph is represented exactly once, in source order');
    let previousProgress = -1;
    for (const [, row, col, progressText, encodedGlyph] of spans) {
        const glyph = decodeEntities(encodedGlyph);
        assert.equal(glyph.length, 1, `cell ${row}:${col} must contain exactly one glyph`);
        assert.equal(glyph, lines[Number(row)][Number(col)]);
        const progress = Number(progressText);
        assert.ok(progress >= 0 && progress < 1, 'scan progress stays within the sweep');
        assert.ok(progress > previousProgress, 'each successive source cell reveals later');
        previousProgress = progress;
    }
});

test('HTML-significant source glyphs are escaped without changing displayed text', () => {
    const altered = [...lines];
    altered[30] = altered[30].slice(0, 60) + '<&>' + altered[30].slice(63);
    altered[0] = '<&>' + altered[0].slice(3);
    const result = renderCrt(altered.join('\n'));
    assert.equal(reconstruct(result.html), altered.join('\n').replaceAll('-', ' '));
    assert.ok(artContent(result.html).startsWith('&lt;&amp;&gt;'));
    assert.match(result.html, /data-cell="30:60"[^>]*>&lt;<\/span>/);
    assert.match(result.html, /data-cell="30:61"[^>]*>&amp;<\/span>/);
    assert.match(result.html, /data-cell="30:62"[^>]*>&gt;<\/span>/);
});

test('invalid grid dimensions or moved power cells require explicit recalibration', () => {
    const shortRow = [...lines];
    shortRow[20] = shortRow[20].slice(1);
    const longRow = [...lines];
    longRow[20] += '+';
    for (const malformed of ['', lines.slice(1).join('\n'), [...lines, lines[0]].join('\n'), shortRow.join('\n'), longRow.join('\n')]) {
        assert.throws(() => renderCrt(malformed), /156 columns.*91 rows/);
    }
    for (const row of [57, 58]) {
        const movedPower = [...lines];
        movedPower[row] = movedPower[row].slice(0, 123) + '-' + movedPower[row].slice(124);
        assert.throws(() => renderCrt(movedPower.join('\n')), /power-light cells/);
    }
});

test('page generation replaces only the marked artwork and is repeatable', () => {
    const prefix = '<!doctype html>\n<title>Keep & preserve</title>\n<main><h1>Peter</h1>\n';
    const suffix = '\n<p>Club copy stays here.</p></main><script src="/scripts/intro.js"></script>';
    const page = prefix + startMarker + '\nold art\n' + endMarker + suffix;
    const rendered = renderCrtIntoPage(page, source);
    assert.equal(rendered.slice(0, rendered.indexOf(startMarker)), prefix);
    assert.equal(rendered.slice(rendered.indexOf(endMarker) + endMarker.length), suffix);
    assert.equal(rendered, prefix + startMarker + '\n' + renderCrt(source).html + '\n' + endMarker + suffix);
    assert.equal(renderCrtIntoPage(rendered, source), rendered);
});

test('missing or reversed generation markers do not silently overwrite the page', () => {
    for (const page of ['<main>Unmarked content</main>', startMarker + '<p>No end</p>', '<p>No start</p>' + endMarker, endMarker + startMarker]) {
        assert.throws(() => renderCrtIntoPage(page, source), /markers are missing/);
    }
});
