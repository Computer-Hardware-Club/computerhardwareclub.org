import assert from 'node:assert/strict';
import test from 'node:test';
import { Countdown, formatDuration, parseDuration } from '../scripts/timer.mjs';

test('parseDuration accepts H:MM:SS and rejects anything else', () => {
    assert.equal(parseDuration('0:10:00'), 600_000);
    assert.equal(parseDuration(' 1:02:03 '), 3723_000);
    assert.equal(parseDuration('99:59:59'), 99 * 3600_000 + 59 * 60_000 + 59_000);
    assert.equal(parseDuration('0:00:00'), 0);
    for (const bad of ['', '10:00', '1:2:3', '0:70:00', '0:00:70', '100:00:00', '0:10:00.5', 'abc', '-0:10:00']) {
        assert.equal(parseDuration(bad), null, `${JSON.stringify(bad)} should be rejected`);
    }
});

test('formatDuration counts up a whole second so the last second is visible', () => {
    assert.equal(formatDuration(0), '00:00:00');
    assert.equal(formatDuration(1), '00:00:01');
    assert.equal(formatDuration(1_000), '00:00:01');
    assert.equal(formatDuration(1_001), '00:00:02');
    assert.equal(formatDuration(600_000), '00:10:00');
    assert.equal(formatDuration(3723_000), '01:02:03');
    assert.equal(formatDuration(-5_000), '00:00:00');
});

test('the countdown runs on the wall clock, survives throttling, and pauses exactly', () => {
    const clock = new Countdown();
    clock.start(10_000, 1_000);
    assert.equal(clock.state, 'running');

    // A tab frozen between 3s and 8s must still land on 2s remaining, not 7s.
    assert.equal(clock.tick(9_000), 2_000);

    clock.pause(9_000);
    assert.equal(clock.state, 'paused');
    assert.equal(clock.tick(60_000), 2_000, 'a paused clock never drains');

    clock.resume(60_000);
    assert.equal(clock.tick(61_000), 1_000);

    clock.tick(62_000);
    assert.equal(clock.state, 'over');
    assert.equal(clock.tick(99_000), 0);
});

test('zero-length and repeated transitions keep the state machine honest', () => {
    const clock = new Countdown();
    assert.equal(clock.start(0, 500), 'over', 'a zero duration cannot run');

    clock.start(5_000, 500);          // ends at 5_500
    assert.equal(clock.pause(1_000), 'paused');   // 4_500 left on the shelf
    assert.equal(clock.pause(1_500), 'paused', 'pausing twice is harmless');
    clock.resume(2_000);              // ends at 6_500
    assert.equal(clock.resume(2_500), 'running', 'resuming twice is harmless');
    assert.equal(clock.tick(5_000), 1_500, 'only the unpaused time drains');

    clock.reset();
    assert.equal(clock.state, 'idle');
    assert.equal(clock.tick(100_000), 0);
});
