import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const START = '<!-- CRT_ASCII_START -->';
const END = '<!-- CRT_ASCII_END -->';
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export function renderCrt(source) {
    const lines = source.replaceAll('\r\n', '\n').trimEnd().split('\n');
    if (lines.length !== 91 || lines.some(line => line.length !== 156)) {
        throw new Error('CRT artwork must be 156 columns × 91 rows; recalibrate the screen and power cells for a different export.');
    }
    // These are cells of the supplied text export, not pixel coordinates.
    const screen = { top: 22, bottom: 51, left: 46, right: 117 };
    const screenWidth = screen.right - screen.left + 1;
    const screenCells = (screen.bottom - screen.top + 1) * screenWidth;
    let beaverCount = 0;
    const rows = lines.map((line, row) => {
        let html = '';
        for (let col = 0; col < line.length; col++) {
            // Dashes encode the exporter's black background. Keep the original TXT intact.
            const glyph = line[col] === '-' ? ' ' : line[col];
            if (row === 57 && col === 123) {
                const power = line.slice(col, col + 3);
                if (power !== '+++') throw new Error('Expected three power-light cells in the lower-right CRT bezel.');
                html += `<span class="crt-power" data-cell="${row}:${col}">${power}</span>`;
                col += 2;
            } else if (row >= screen.top && row <= screen.bottom && col >= screen.left && col <= screen.right && glyph !== ' ') {
                const progress = ((row - screen.top) * screenWidth + col - screen.left) / screenCells;
                html += `<span class="crt-beaver" data-cell="${row}:${col}" style="--scan-progress:${progress.toFixed(6)}">${escape(glyph)}</span>`;
                beaverCount++;
            } else {
                html += escape(glyph);
            }
        }
        // Keep exact row padding without literal trailing whitespace in the HTML source.
        return html.replace(/ +$/, padding => '&#32;'.repeat(padding.length));
    });
    return {
        rows: lines.length,
        columns: lines[0].length,
        beaverCount,
        html: `<div class="crt-display" role="img" aria-label="ASCII art of a beaver on a retro computer monitor" style="--crt-columns:156;--crt-rows:91">
<pre class="crt-ascii" aria-hidden="true">${rows.join('\n')}</pre>
<pre class="crt-loader" aria-hidden="true">BOOTING PETER_
[&gt;         ]</pre>
</div>`
    };
}

export function renderCrtIntoPage(page, source) {
    const start = page.indexOf(START);
    const end = page.indexOf(END, start);
    if (start < 0 || end < 0) throw new Error('Homepage CRT generation markers are missing.');
    return page.slice(0, start + START.length) + '\n' + renderCrt(source).html + '\n' + page.slice(end);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--write')) {
    const page = new URL('./index.html', import.meta.url);
    const art = readFileSync(new URL('./images/ascii/beaver-crt.txt', import.meta.url), 'utf8');
    writeFileSync(page, renderCrtIntoPage(readFileSync(page, 'utf8'), art));
}
