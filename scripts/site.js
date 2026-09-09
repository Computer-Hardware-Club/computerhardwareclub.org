"use strict";
(() => {
    const nav = document.querySelector('.site-nav');
    const menuToggle = document.querySelector('[data-menu-toggle]');
    const menu = document.querySelector('#nav-links');
    if (nav && menu && menuToggle) {
        const dropdowns = [...menu.querySelectorAll('.nav-dropdown')];
        const setDropdown = (dropdown, open) => {
            dropdown.classList.toggle('is-open', open);
            dropdown.querySelector('.nav-dropdown-btn').setAttribute('aria-expanded', String(open));
        };
        const closeDropdowns = () => dropdowns.forEach(dropdown => setDropdown(dropdown, false));
        const setMenu = (open) => {
            nav.classList.toggle('menu-open', open);
            menuToggle.setAttribute('aria-expanded', String(open));
            menuToggle.textContent = open ? 'Close' : 'Menu';
            if (!open) closeDropdowns();
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
                setMenu(false);
                menuToggle.focus();
            }
        });
        window.matchMedia('(max-width: 860px)').addEventListener('change', () => setMenu(false));
    }
    document.querySelectorAll('[data-year]').forEach(element => {
        element.textContent = String(new Date().getFullYear());
    });
})();
