"use strict";
(() => {
    const nav = document.querySelector('.site-nav');
    const menuToggle = document.querySelector('[data-menu-toggle]');
    const menu = document.querySelector('#nav-links');
    const narrow = window.matchMedia('(max-width: 860px)');

    // The home hero is a three-column stage on desktop and is stacked purely by
    // CSS order on narrow screens. Its DOM order is deliberately left alone:
    // reordering the blocks would change which grid column each one lands in and
    // move the desktop composition.
    //
    // The current page is marked here so the menu is followable without sight;
    // the active color alone cannot convey that.
    const markCurrentPage = () => {
        if (!menu) return;
        const here = window.location.pathname.replace(/index\.html$/, '');
        menu.querySelectorAll('a[href]').forEach(link => {
            const target = new URL(link.getAttribute('href'), window.location.href);
            const current = target.pathname.replace(/index\.html$/, '');
            if (target.origin === window.location.origin && current === here) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    };

    if (nav && menu && menuToggle) {
        const dropdowns = [...menu.querySelectorAll('.nav-dropdown')];
        const setDropdown = (dropdown, open) => {
            dropdown.classList.toggle('is-open', open);
            dropdown.querySelector('.nav-dropdown-btn').setAttribute('aria-expanded', String(open));
        };
        const closeDropdowns = () => dropdowns.forEach(dropdown => setDropdown(dropdown, false));
        const setMenu = (open, restoreFocus = false) => {
            nav.classList.toggle('menu-open', open);
            menuToggle.setAttribute('aria-expanded', String(open));
            menuToggle.textContent = open ? 'Close' : 'Menu';
            if (!open) closeDropdowns();
            if (restoreFocus) menuToggle.focus();
        };
        menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
        dropdowns.forEach(dropdown => {
            const button = dropdown.querySelector('.nav-dropdown-btn');
            button.addEventListener('click', () => {
                const open = button.getAttribute('aria-expanded') !== 'true';
                closeDropdowns();
                setDropdown(dropdown, open);
            });
        });
        menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
        document.addEventListener('click', event => {
            if (!nav.contains(event.target)) setMenu(false);
        });
        nav.addEventListener('focusout', event => {
            if (!nav.contains(event.relatedTarget)) setMenu(false);
        });
        document.addEventListener('keydown', event => {
            if (event.key !== 'Escape') return;
            const openDropdown = dropdowns.find(dropdown => dropdown.classList.contains('is-open'));
            if (openDropdown) {
                setDropdown(openDropdown, false);
                openDropdown.querySelector('button').focus();
            } else if (nav.classList.contains('menu-open')) {
                setMenu(false, true);
            }
        });
        // Crossing the breakpoint swaps between the menu panel and the nav row.
        narrow.addEventListener('change', () => setMenu(false));
    }

    narrow.addEventListener('change', markCurrentPage);
    window.addEventListener('pageshow', markCurrentPage);
    markCurrentPage();
    document.querySelectorAll('[data-year]').forEach(element => {
        element.textContent = String(new Date().getFullYear());
    });
})();
