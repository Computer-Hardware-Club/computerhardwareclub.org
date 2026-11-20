(() => {
    const command = document.querySelector('#retep-check-command');
    const button = document.querySelector('#retep-copy-check');
    const status = document.querySelector('#retep-copy-status');
    if (!command || !button || !status || !navigator.clipboard?.writeText) return;

    button.hidden = false;
    button.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(command.textContent.trim());
            status.textContent = 'Copied check-system.';
        } catch {
            status.textContent = 'Select check-system and copy it manually.';
        }
    });
})();
