"use strict";
(() => {
    const queueFrame = (callback) => {
        if (typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(() => callback());
            return;
        }

        window.setTimeout(callback, 16);
    };

    const reduceMotion =
        typeof window.matchMedia === 'function'
            ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
            : false;

    const header = document.querySelector('.site-header');
    const nav = document.querySelector('.site-nav');
    const menuToggle = document.querySelector('[data-menu-toggle]');
    const menu = document.querySelector('#nav-links');
    const revealTargets = Array.from(document.querySelectorAll('.reveal'));

    const revealAll = () => {
        revealTargets.forEach((node) => {
            node.classList.add('visible');
        });
    };

    const syncHeaderState = () => {
        if (!header) {
            return;
        }

        header.classList.toggle('is-scrolled', window.scrollY > 8);
    };

    try {
        syncHeaderState();
        window.addEventListener('scroll', syncHeaderState, { passive: true });
    } catch (_error) {
        // Keep page usable even if sticky header behavior fails.
    }

    try {
        if (menuToggle && nav && menu) {
            const setMenu = (open) => {
                nav.classList.toggle('menu-open', open);
                menuToggle.setAttribute('aria-expanded', String(open));
            };

            menuToggle.addEventListener('click', () => {
                const isOpen = nav.classList.contains('menu-open');
                setMenu(!isOpen);
            });

            menu.querySelectorAll('a').forEach((link) => {
                link.addEventListener('click', () => setMenu(false));
            });

            document.addEventListener('click', (event) => {
                if (!nav.classList.contains('menu-open')) {
                    return;
                }

                const target = event.target;
                if (!(target instanceof Node) || nav.contains(target)) {
                    return;
                }

                setMenu(false);
            });

            window.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    setMenu(false);
                }
            });

            window.addEventListener('resize', () => {
                if (window.innerWidth > 860) {
                    setMenu(false);
                }
            });
        }
    } catch (_error) {
        // Ignore non-critical menu behavior errors.
    }

    try {
        if (revealTargets.length) {
            revealTargets.forEach((node, index) => {
                const delayMs = Math.min(index * 50, 260);
                node.style.setProperty('--reveal-delay', `${delayMs}ms`);
            });
        }

        if (!revealTargets.length || reduceMotion) {
            revealAll();
        } else if (typeof window.IntersectionObserver === 'function') {
            const observer = new IntersectionObserver(
                (entries, currentObserver) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) {
                            return;
                        }

                        entry.target.classList.add('visible');
                        currentObserver.unobserve(entry.target);
                    });
                },
                {
                    threshold: 0.12,
                    rootMargin: '0px 0px -40px 0px'
                }
            );

            revealTargets.forEach((node) => observer.observe(node));
        } else {
            revealAll();
        }
    } catch (_error) {
        revealAll();
    }

    try {
        if (!reduceMotion) {
            const parallaxNodes = Array.from(document.querySelectorAll('[data-parallax]'));

            if (parallaxNodes.length) {
                let ticking = false;

                const updateParallax = () => {
                    const y = window.scrollY;

                    parallaxNodes.forEach((node) => {
                        const speed = Number(node.dataset.parallax) || 0.04;
                        const offset = Math.round(y * speed * 10) / 10;
                        node.style.transform = `translate3d(0, ${offset}px, 0)`;
                    });

                    ticking = false;
                };

                updateParallax();
                window.addEventListener(
                    'scroll',
                    () => {
                        if (ticking) {
                            return;
                        }

                        ticking = true;
                        queueFrame(updateParallax);
                    },
                    { passive: true }
                );
            }
        }
    } catch (_error) {
        // Ignore non-critical parallax behavior errors.
    }

    try {
        const year = new Date().getFullYear();
        document.querySelectorAll('[data-year]').forEach((element) => {
            element.textContent = String(year);
        });
    } catch (_error) {
        // Ignore year hydration errors.
    }

    queueFrame(() => {
        document.body.classList.add('is-ready');
    });
})();
