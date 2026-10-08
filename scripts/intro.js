"use strict";
(() => {
    const SETTLE_DURATION = 2000;
    const SCAN_DURATION = 3000;
    const SCAN_START = 2000;
    const VISIT_KEY = 'chc:crt-intro:v1';
    const root = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const REPLAY_KEY = 'chc:crt-hard-refresh:v1';
    let hardRefresh = false;

    // Native navigation timing labels both soft and hard refreshes as "reload".
    // Record explicit keyboard intent without preventing the browser's cache bypass.
    try {
        const requestedAt = Number(sessionStorage.getItem(REPLAY_KEY));
        sessionStorage.removeItem(REPLAY_KEY);
        const age = Date.now() - requestedAt;
        const navigation = window.performance?.getEntriesByType('navigation')[0];
        hardRefresh = requestedAt > 0 && age >= 0 && age < 7500 && navigation?.type === 'reload';
        const seen = sessionStorage.getItem(VISIT_KEY);
        sessionStorage.setItem(VISIT_KEY, 'seen');
        window.addEventListener('keydown', event => {
            const key = event.key.toLowerCase();
            const shortcut = (key === 'r' && event.shiftKey && (event.metaKey || event.ctrlKey))
                || (key === 'f5' && (event.shiftKey || event.ctrlKey));
            if (!shortcut || event.repeat || event.altKey) return;
            try {
                sessionStorage.setItem(REPLAY_KEY, String(Date.now()));
            } catch {
                // Storage-disabled visitors still retain the browser's refresh behavior.
            }
        }, { capture: true });
        if (seen && !hardRefresh) return;
    } catch {
        // Never show a repeating intro when a visit cannot be remembered.
        return;
    }
    if (reducedMotion.matches || location.hash) return;

    // An explicit replay should begin at the CRT, not a restored mid-page position.
    let previousScrollRestoration;
    if (hardRefresh && window.history) {
        previousScrollRestoration = window.history.scrollRestoration;
        window.history.scrollRestoration = 'manual';
        window.scrollTo(0, 0);
    }

    let finished = false;
    let started = false;
    const timers = new Set();
    const listeners = [];
    const later = (callback, delay) => {
        const timer = window.setTimeout(() => {
            timers.delete(timer);
            callback();
        }, delay);
        timers.add(timer);
    };
    const listen = (target, type, callback, options) => {
        target.addEventListener(type, callback, options);
        listeners.push(() => target.removeEventListener(type, callback, options));
    };
    const clearTimers = () => {
        timers.forEach(timer => window.clearTimeout(timer));
        timers.clear();
    };
    const safeRect = node => {
        try {
            return node?.getBoundingClientRect?.() ?? null;
        } catch {
            return null;
        }
    };
    const cleanup = () => {
        clearTimers();
        listeners.splice(0).forEach(remove => remove());
        if (previousScrollRestoration !== undefined) {
            window.history.scrollRestoration = previousScrollRestoration;
            previousScrollRestoration = undefined;
        }
    };
    const finish = (animate = false) => {
        if (finished && !root.classList.contains('intro-revealing')) return;
        finished = true;
        clearTimers();
        const motion = animate && !reducedMotion.matches;
        const glide = motion ? document.querySelector('.hero-art') : null;
        const hero = motion ? document.querySelector('.home-hero') : null;
        const first = glide ? safeRect(glide) : null;
        const heroFirst = hero ? safeRect(hero) : null;
        root.classList.remove('intro-pending');
        delete root.dataset.introPhase;
        if (motion) {
            root.classList.add('intro-revealing');
            // FLIP: the isolated layout just centered the artwork in the viewport.
            // Slide it to its flow position, and glide the hero box from its
            // viewport-filling height down to its flow height so the sections
            // below settle with the fade instead of snapping up when the text
            // returns to the layout.
            const last = glide ? safeRect(glide) : null;
            if (first && last && typeof glide.animate === 'function') {
                const dx = first.left - last.left;
                const dy = first.top - last.top;
                if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                    try {
                        glide.animate(
                            [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0px, 0px)' }],
                            { duration: 500, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
                        );
                    } catch {
                        // A missing animation only costs the glide, never the reveal.
                    }
                }
            }
            const heroLast = hero ? safeRect(hero) : null;
            if (heroFirst && heroLast && typeof hero.animate === 'function') {
                const settle = heroFirst.height - heroLast.height;
                if (settle > 2) {
                    try {
                        hero.animate(
                            [{ height: `${heroFirst.height}px` }, { height: `${heroLast.height}px` }],
                            { duration: 500, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
                        );
                    } catch {
                        // Layout keeps its final size; only the glide is lost.
                    }
                }
            }
            later(() => {
                root.classList.remove('intro-revealing');
                cleanup();
            }, 600);
        } else {
            root.classList.remove('intro-revealing');
            cleanup();
        }
    };
    const skip = () => finish();
    root.classList.add('intro-pending');
    root.dataset.introPhase = 'waiting';

    // Fail open even if fonts stall or the normal sequence cannot initialize.
    later(skip, 7000);
    listen(window, 'keydown', event => {
        if (['Escape', 'Tab'].includes(event.key)) skip();
    });
    listen(window, 'pagehide', skip);
    listen(window, 'pageshow', event => {
        if (event.persisted) skip();
    });
    listen(reducedMotion, 'change', event => {
        if (event.matches) skip();
    });

    const start = async () => {
        if (finished || started) return;
        started = true;
        const art = document.querySelector('.crt-ascii');
        const loader = document.querySelector('.crt-loader');
        if (!art || !loader) return skip();
        try {
            if (document.fonts) await document.fonts.ready;
        } catch {
            return skip();
        }
        if (finished) return;
        // Resource readiness gets its own watchdog; it must not truncate the longer boot.
        clearTimers();
        later(skip, SETTLE_DURATION + SCAN_START + SCAN_DURATION + 1800);
        later(() => {
            root.dataset.introPhase = 'power';
            later(() => {
                root.dataset.introPhase = 'loading';
                const frames = [
                    '[>         ]', '[=>        ]', '[==>       ]',
                    '[===>      ]', '[====>     ]', '[=====>    ]',
                    '[======>   ]', '[=======>  ]', '[========> ]', '[==========]'
                ];
                frames.forEach((frame, index) => later(() => {
                    loader.textContent = 'BOOTING PETER_\n' + frame;
                }, index * 120));
            }, 800);
            later(() => { root.dataset.introPhase = 'scanning'; }, SCAN_START);
            later(() => { root.dataset.introPhase = 'ready'; }, SCAN_START + SCAN_DURATION);
            later(() => finish(true), SCAN_START + SCAN_DURATION + 200);
        }, SETTLE_DURATION);
    };
    if (document.readyState !== 'complete') {
        listen(window, 'load', start, { once: true });
    } else {
        start();
    }
})();
