// Countdown clock for the Timer page. The clock is wall-clock based: it stores
// the instant the timer ends rather than accumulating ticks, so a throttled or
// backgrounded tab cannot lose time. Only the pure logic is exported; the DOM
// wiring sits behind a document check so this module stays testable in Node.

const pad = value => String(value).padStart(2, '0');
const HOURS = 3600000;
const MINUTES = 60000;
const SECONDS = 1000;

// "H:MM:SS" -> milliseconds. Hours take one or two digits; minutes and seconds
// must be zero-padded pairs, which keeps the field's format unambiguous.
export function parseDuration(text) {
    const match = /^(\d{1,2}):([0-5]\d):([0-5]\d)$/.exec(String(text).trim());
    if (!match) return null;
    const [, hours, minutes, seconds] = match;
    return Number(hours) * HOURS + Number(minutes) * MINUTES + Number(seconds) * SECONDS;
}

export function formatDuration(millis) {
    const total = Math.max(0, Math.ceil(millis / SECONDS));
    return `${pad(Math.floor(total / 3600))}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`;
}

export class Countdown {
    constructor() {
        this.state = 'idle';
        this.remaining = 0;
        this.endsAt = 0;
    }

    start(millis, now) {
        this.remaining = Math.max(0, millis);
        this.endsAt = now + this.remaining;
        this.state = this.remaining > 0 ? 'running' : 'over';
        return this.state;
    }

    pause(now) {
        if (this.state !== 'running') return this.state;
        this.remaining = Math.max(0, this.endsAt - now);
        this.state = 'paused';
        return this.state;
    }

    resume(now) {
        if (this.state !== 'paused') return this.state;
        this.endsAt = now + this.remaining;
        this.state = this.remaining > 0 ? 'running' : 'over';
        return this.state;
    }

    // Resolve the clock at a given instant; also lands the finished state.
    tick(now) {
        if (this.state === 'running') {
            this.remaining = Math.max(0, this.endsAt - now);
            if (this.remaining === 0) this.state = 'over';
        }
        return this.remaining;
    }

    reset() {
        this.state = 'idle';
        this.remaining = 0;
        this.endsAt = 0;
    }
}

const LABELS = { idle: 'Start', running: 'Pause', paused: 'Resume', over: 'Start' };

function mount({ display, form, input, button, hint, status }) {
    const clock = new Countdown();
    let announced = '';

    const announce = message => {
        if (message === announced) return;
        announced = message;
        status.textContent = message;
    };

    const show = (now = Date.now()) => {
        clock.tick(now);
        display.textContent = formatDuration(clock.remaining);
        display.dataset.state = clock.state;
        button.textContent = LABELS[clock.state];
        // The duration belongs to a run, so it cannot be edited underneath a
        // running or paused clock.
        input.disabled = clock.state === 'running' || clock.state === 'paused';
        if (clock.state === 'over') announce('Time.');
        else if (clock.state === 'paused') announce('Paused.');
    };

    form.addEventListener('submit', event => {
        event.preventDefault();
        if (clock.state === 'running') {
            clock.pause(Date.now());
            show();
            announce('Paused.');
            return;
        }
        if (clock.state === 'paused') {
            clock.resume(Date.now());
            show();
            announce('Running.');
            return;
        }
        const millis = parseDuration(input.value);
        if (millis === null) {
            input.setAttribute('aria-invalid', 'true');
            hint.hidden = false;
            hint.textContent = 'Use HH:MM:SS, like 00:10:00.';
            input.focus();
            return;
        }
        input.removeAttribute('aria-invalid');
        input.value = formatDuration(millis);
        hint.hidden = true;
        hint.textContent = '';
        clock.start(millis, Date.now());
        show();
        announce('Running.');
    });

    input.addEventListener('input', () => {
        input.removeAttribute('aria-invalid');
        hint.hidden = true;
        hint.textContent = '';
    });

    // A throttled tab can skip intervals; resolving from the wall clock on every
    // frame and on focus keeps the readout honest either way.
    const interval = window.setInterval(() => show(), 200);
    window.addEventListener('pageshow', () => show());
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) show();
    });
    // Show the field's duration before any run: idle state, "Start" label.
    clock.remaining = parseDuration(input.value) ?? 10 * MINUTES;
    show();
}

if (typeof document !== 'undefined' && document.getElementById('timer-display')) {
    mount({
        display: document.getElementById('timer-display'),
        form: document.getElementById('timer-controls'),
        input: document.getElementById('timer-input'),
        button: document.getElementById('timer-button'),
        hint: document.getElementById('timer-hint'),
        status: document.getElementById('timer-status')
    });
}
