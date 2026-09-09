import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../scripts/intro.js', import.meta.url), 'utf8');
const visitKey = 'chc:crt-intro:v1';
const replayKey = 'chc:crt-hard-refresh:v1';

function eventTarget() {
    const listeners = new Map();
    return {
        addEventListener(type, callback, options) {
            const entries = listeners.get(type) ?? [];
            entries.push({ callback, once: options?.once });
            listeners.set(type, entries);
        },
        removeEventListener(type, callback) {
            listeners.set(type, (listeners.get(type) ?? []).filter(entry => entry.callback !== callback));
        },
        dispatch(type, event = {}) {
            for (const entry of [...(listeners.get(type) ?? [])]) {
                if (entry.once) this.removeEventListener(type, entry.callback);
                entry.callback(event);
            }
        },
        listenerCount() {
            return [...listeners.values()].reduce((total, entries) => total + entries.length, 0);
        }
    };
}

function createVisit(options = {}) {
    let now = 0;
    let timerId = 0;
    let fontWaits = 0;
    const timers = new Map();
    const classes = new Set();
    const storage = options.storage ?? new Map();
    const root = {
        dataset: {},
        classList: {
            add: name => classes.add(name),
            remove: name => classes.delete(name),
            contains: name => classes.has(name)
        }
    };
    const loader = { textContent: '' };
    const art = {};
    const fonts = {
        get ready() {
            fontWaits += 1;
            return options.fontsReady ? options.fontsReady() : Promise.resolve();
        }
    };
    const reducedMotion = Object.assign(eventTarget(), { matches: options.reducedMotion ?? false });
    const window = Object.assign(eventTarget(), {
        scrollY: options.scrollY ?? 0,
        matchMedia: () => reducedMotion,
        performance: { getEntriesByType: () => [{ type: options.navigationType ?? 'navigate' }] },
        history: { scrollRestoration: 'auto' },
        scrollTo(_x, y) { this.scrollY = y; },
        setTimeout(callback, delay) {
            const id = ++timerId;
            timers.set(id, { callback, at: now + delay });
            return id;
        },
        clearTimeout: id => timers.delete(id)
    });
    const document = Object.assign(eventTarget(), {
        documentElement: root,
        readyState: options.readyState ?? 'complete',
        fonts: options.missingFontAPI ? undefined : fonts,
        querySelector(selector) {
            if (selector === '.crt-ascii') return options.missingArt ? null : art;
            if (selector === '.crt-loader') return options.missingLoader ? null : loader;
            throw new Error(`Unexpected selector: ${selector}`);
        }
    });
    const sessionStorage = {
        getItem(key) {
            if (options.storageFailure === 'get') throw new Error('Storage unavailable');
            return storage.get(key) ?? null;
        },
        removeItem(key) { storage.delete(key); },
        setItem(key, value) {
            if (options.storageFailure === 'set') throw new Error('Storage unavailable');
            storage.set(key, value);
        }
    };
    runInNewContext(source, { window, document, sessionStorage, location: { hash: options.hash ?? '' }, Date: { now: () => options.now ?? 10000 } });

    return {
        root, loader, window, document, reducedMotion, storage, timers,
        get fontWaits() { return fontWaits; },
        async advance(milliseconds = 0) {
            // Font readiness resumes on a microtask before the browser's next timer.
            await new Promise(resolve => setImmediate(resolve));
            const end = now + milliseconds;
            while (true) {
                const next = [...timers.entries()]
                    .filter(([, timer]) => timer.at <= end)
                    .sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
                if (!next) break;
                now = next[1].at;
                timers.delete(next[0]);
                next[1].callback();
                await new Promise(resolve => setImmediate(resolve));
            }
            now = end;
            await new Promise(resolve => setImmediate(resolve));
        },
        assertOpen() {
            assert.equal(classes.has('intro-pending'), false, 'page must not remain hidden');
            assert.equal(classes.has('intro-revealing'), false, 'reveal animation must be finished');
            assert.equal(root.dataset.introPhase, undefined, 'old phases must not restart');
        },
        assertClean() {
            assert.equal(timers.size, 0, 'no stale sequence timers');
            assert.equal(window.listenerCount() + document.listenerCount() + reducedMotion.listenerCount(), options.storageFailure ? 0 : 1,
                'only the persistent hard-refresh shortcut listener remains');
        }
    };
}

test('first visit boots the CRT in order, fills the loader, and fades in the page', async () => {
    const visit = createVisit();
    assert.equal(visit.storage.get(visitKey), 'seen');
    assert.equal(visit.root.classList.contains('intro-pending'), true);
    await visit.advance(1999);
    assert.equal(visit.root.dataset.introPhase, 'waiting');
    assert.equal(visit.loader.textContent, '');
    await visit.advance(1);
    assert.equal(visit.root.dataset.introPhase, 'power');
    await visit.advance(800);
    assert.equal(visit.root.dataset.introPhase, 'loading');
    const initialFrame = visit.loader.textContent;
    assert.match(initialFrame, /\[.*\]/);
    await visit.advance(1080);
    assert.notEqual(visit.loader.textContent, initialFrame, 'ASCII loader must advance');
    assert.match(visit.loader.textContent, /\[=+\]/);
    await visit.advance(120);
    assert.equal(visit.root.dataset.introPhase, 'scanning');
    await visit.advance(3000);
    assert.equal(visit.root.dataset.introPhase, 'ready');
    await visit.advance(200);
    assert.equal(visit.root.classList.contains('intro-pending'), false);
    assert.equal(visit.root.classList.contains('intro-revealing'), true);
    await visit.advance(600);
    visit.assertOpen();
    visit.assertClean();
});

test('same-tab return does not replay after completion or a skip', async () => {
    for (const skip of [false, true]) {
        const first = createVisit();
        if (skip) first.window.dispatch('keydown', { key: 'Escape' });
        await first.advance(8000);
        const returning = createVisit({ storage: first.storage });
        await returning.advance(10000);
        returning.assertOpen();
        returning.assertClean();
        assert.equal(returning.fontWaits, 0);
    }
});

test('a new session plays again', async () => {
    const first = createVisit();
    await first.advance(8000);
    const nextSession = createVisit();
    await nextSession.advance(2000);
    assert.equal(nextSession.root.dataset.introPhase, 'power');
});

test('scrolling and touch leave every animation stage running', async t => {
    const gestures = {
        wheel: visit => visit.window.dispatch('wheel', { deltaY: 150 }),
        scroll: visit => { visit.window.scrollY = 40; visit.window.dispatch('scroll'); },
        touch: visit => {
            visit.window.dispatch('touchstart', { touches: [{ clientY: 200 }] });
            visit.window.dispatch('touchmove', { touches: [{ clientY: 140 }] });
        },
        keyboard: visit => {
            for (const key of ['PageDown', 'ArrowDown', 'End', ' ']) visit.window.dispatch('keydown', { key });
        }
    };
    for (const [gesture, act] of Object.entries(gestures)) {
        for (const elapsed of [0, 2000, 3000, 5500, 7050, 7300]) {
            await t.test(`${gesture} at ${elapsed}ms`, async () => {
                const visit = createVisit();
                await visit.advance(elapsed);
                const phase = visit.root.dataset.introPhase;
                const pending = visit.root.classList.contains('intro-pending');
                const fading = visit.root.classList.contains('intro-revealing');
                act(visit);
                assert.equal(visit.root.dataset.introPhase, phase);
                assert.equal(visit.root.classList.contains('intro-pending'), pending);
                assert.equal(visit.root.classList.contains('intro-revealing'), fading);
                await visit.advance(8000);
                visit.assertOpen();
                visit.assertClean();
            });
        }
    }
});

test('upward gestures and minor touch movement do not skip', async () => {
    const visit = createVisit();
    await visit.advance(2000);
    visit.window.dispatch('wheel', { deltaY: -100 });
    visit.window.dispatch('touchstart', { touches: [{ clientY: 200 }] });
    visit.window.dispatch('touchmove', { touches: [{ clientY: 197 }] });
    visit.window.dispatch('touchmove', { touches: [{ clientY: 250 }] });
    visit.window.dispatch('keydown', { key: 'ArrowUp' });
    assert.equal(visit.root.dataset.introPhase, 'power');
});

test('keyboard access and Escape dismiss the intro', async () => {
    for (const key of ['Escape', 'Tab']) {
        const visit = createVisit();
        await visit.advance();
        visit.window.dispatch('keydown', { key });
        visit.assertOpen();
        visit.assertClean();
    }
});

test('reduced motion and unavailable session storage fail open', async () => {
    for (const options of [{ reducedMotion: true }, { storageFailure: 'get' }, { storageFailure: 'set' }]) {
        const visit = createVisit(options);
        await visit.advance(10000);
        visit.assertOpen();
        visit.assertClean();
        assert.equal(visit.fontWaits, 0);
    }
});

test('enabling reduced motion during boot immediately reveals the site', async () => {
    const visit = createVisit();
    await visit.advance(2500);
    visit.reducedMotion.matches = true;
    visit.reducedMotion.dispatch('change', { matches: true });
    visit.assertOpen();
    await visit.advance(10000);
    visit.assertClean();
});

test('deep links bypass the intro, while a scrolled position does not cancel it', async () => {
    const linked = createVisit({ hash: '#club-title' });
    await linked.advance();
    linked.assertOpen();
    linked.assertClean();
    const scrolled = createVisit({ scrollY: 400 });
    await scrolled.advance(2000);
    assert.equal(scrolled.root.dataset.introPhase, 'power');
    await scrolled.advance(8000);
    scrolled.assertOpen();
});

test('missing intro elements and font readiness rejection leave the page usable', async () => {
    for (const options of [
        { missingArt: true },
        { missingLoader: true },
        { fontsReady: () => Promise.reject(new Error('Fonts failed')) }
    ]) {
        const visit = createVisit(options);
        await visit.advance();
        visit.assertOpen();
        visit.assertClean();
    }
});

test('stalled fonts fail open, and late readiness cannot resurrect the intro', async () => {
    let resolveFonts;
    const fontReadiness = new Promise(resolve => { resolveFonts = resolve; });
    const visit = createVisit({ fontsReady: () => fontReadiness });
    await visit.advance(7000);
    visit.assertOpen();
    visit.assertClean();
    resolveFonts();
    await visit.advance(10000);
    visit.assertOpen();
    visit.assertClean();
});

test('font readiness gates the sequence, while browsers without the font API can still boot', async () => {
    let resolveFonts;
    const fontReadiness = new Promise(resolve => { resolveFonts = resolve; });
    const visit = createVisit({ fontsReady: () => fontReadiness });
    await visit.advance(2000);
    assert.equal(visit.root.dataset.introPhase, 'waiting');
    assert.equal(visit.loader.textContent, '');
    resolveFonts();
    await visit.advance(2000);
    assert.equal(visit.root.dataset.introPhase, 'power');
    await visit.advance(5800);
    visit.assertOpen();
    visit.assertClean();

    const fallback = createVisit({ missingFontAPI: true });
    await fallback.advance(2000);
    assert.equal(fallback.root.dataset.introPhase, 'power');
    await fallback.advance(5800);
    fallback.assertOpen();
    fallback.assertClean();
});

test('skipping before fonts are ready prevents a late start', async () => {
    let resolveFonts;
    const fontReadiness = new Promise(resolve => { resolveFonts = resolve; });
    const visit = createVisit({ fontsReady: () => fontReadiness });
    visit.window.dispatch('keydown', { key: 'Escape' });
    visit.assertOpen();
    resolveFonts();
    await visit.advance(10000);
    visit.assertOpen();
    visit.assertClean();
});

test('pagehide and bfcache restoration clean up both boot and the final fade', async () => {
    for (const type of ['pagehide', 'pageshow']) {
        for (const elapsed of [1000, 7300]) {
            const visit = createVisit();
            await visit.advance(elapsed);
            visit.window.dispatch(type, { persisted: true });
            visit.assertOpen();
            await visit.advance(10000);
            visit.assertClean();
        }
    }
});

test('full window load starts once, but skipping before it arrives keeps the page open', async () => {
    const visit = createVisit({ readyState: 'loading' });
    assert.equal(visit.fontWaits, 0);
    visit.document.dispatch('DOMContentLoaded');
    await visit.advance(1000);
    assert.equal(visit.fontWaits, 0, 'DOM readiness alone must not start the boot');
    visit.window.dispatch('load');
    visit.window.dispatch('load');
    await visit.advance(2000);
    assert.equal(visit.fontWaits, 1);
    assert.equal(visit.root.dataset.introPhase, 'power');

    const skipped = createVisit({ readyState: 'loading' });
    skipped.window.dispatch('keydown', { key: 'Escape' });
    skipped.window.dispatch('load');
    await skipped.advance(10000);
    assert.equal(skipped.fontWaits, 0);
    skipped.assertOpen();
    skipped.assertClean();
});


test('regular refresh and ordinary navigation do not replay a completed visit', async () => {
    for (const navigationType of ['reload', 'navigate', 'back_forward']) {
        const visit = createVisit({ storage: new Map([[visitKey, 'seen']]), navigationType });
        await visit.advance(10000);
        visit.assertOpen();
        visit.assertClean();
        assert.equal(visit.fontWaits, 0);
    }
});

test('hard-refresh shortcuts arm exactly the next reload without cancelling native behavior', async () => {
    for (const shortcut of [
        { key: 'R', metaKey: true, shiftKey: true },
        { key: 'r', ctrlKey: true, shiftKey: true },
        { key: 'F5', shiftKey: true },
        { key: 'F5', ctrlKey: true }
    ]) {
        const old = createVisit({ storage: new Map([[visitKey, 'seen']]) });
        old.window.dispatch('keydown', { ...shortcut, preventDefault() { assert.fail('native hard refresh must remain intact'); } });
        assert.equal(old.storage.get(replayKey), '10000');
        const fresh = createVisit({ storage: old.storage, navigationType: 'reload', now: 10100, scrollY: 500 });
        await fresh.advance(2000);
        assert.equal(fresh.root.dataset.introPhase, 'power');
        assert.equal(fresh.window.scrollY, 0);
        assert.equal(fresh.window.history.scrollRestoration, 'manual');
        assert.equal(fresh.storage.has(replayKey), false);
        await fresh.advance(8000);
        fresh.assertOpen();
        assert.equal(fresh.window.history.scrollRestoration, 'auto');
        const regular = createVisit({ storage: fresh.storage, navigationType: 'reload', now: 10200 });
        regular.assertOpen();
    }
});

test('regular-refresh keys, repeated keys and unrelated modifiers do not arm replay', () => {
    for (const key of [
        { key: 'r', metaKey: true }, { key: 'r', ctrlKey: true }, { key: 'F5' },
        { key: 'R', shiftKey: true }, { key: 'r', metaKey: true, shiftKey: true, repeat: true },
        { key: 'r', metaKey: true, shiftKey: true, altKey: true }
    ]) {
        const visit = createVisit({ storage: new Map([[visitKey, 'seen']]) });
        visit.window.dispatch('keydown', key);
        assert.equal(visit.storage.has(replayKey), false);
    }
});

test('stale replay requests and requests followed by link navigation are discarded', () => {
    for (const options of [
        { now: 18000, navigationType: 'reload' },
        { now: 10100, navigationType: 'navigate' },
        { now: 10100, navigationType: 'back_forward' },
        { now: 9000, navigationType: 'reload' }
    ]) {
        const storage = new Map([[visitKey, 'seen'], [replayKey, '10000']]);
        const visit = createVisit({ storage, ...options });
        visit.assertOpen();
        assert.equal(storage.has(replayKey), false);
    }
});

test('hard-refresh replay still respects reduced motion and restores scrolling after a skip', async () => {
    const reduced = createVisit({ storage: new Map([[visitKey, 'seen'], [replayKey, '10000']]), now: 10100, navigationType: 'reload', reducedMotion: true });
    reduced.assertOpen();
    assert.equal(reduced.window.history.scrollRestoration, 'auto');
    const visit = createVisit({ storage: new Map([[visitKey, 'seen'], [replayKey, '10000']]), now: 10100, navigationType: 'reload', scrollY: 500 });
    await visit.advance();
    visit.window.dispatch('keydown', { key: 'Escape' });
    visit.assertOpen();
    visit.assertClean();
    assert.equal(visit.window.history.scrollRestoration, 'auto');
});
