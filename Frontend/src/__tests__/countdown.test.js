import test from 'node:test';
import assert from 'node:assert/strict';

function calculateCountdown(expiresAt) {
  if (!expiresAt) {
    return { totalSeconds: 0, minutes: 0, seconds: 0, formatted: '০০:০০', isExpired: true };
  }
  const target = new Date(expiresAt).getTime();
  const now = Date.now();
  const diff = Math.max(0, Math.floor((target - now) / 1000));

  const minutes = Math.floor(diff / 60);
  const seconds = diff % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    totalSeconds: diff,
    minutes,
    seconds,
    formatted,
    isExpired: diff <= 0,
  };
}

test('Calculates countdown remaining time and identifies expired holds', () => {
  // Past date -> isExpired should be true
  const pastDate = new Date(Date.now() - 5000).toISOString();
  const res1 = calculateCountdown(pastDate);
  assert.equal(res1.isExpired, true);
  assert.equal(res1.totalSeconds, 0);
  assert.equal(res1.formatted, '00:00');

  // Future date (5 minutes ahead = 300 seconds)
  const futureDate = new Date(Date.now() + 300 * 1000 + 500).toISOString();
  const res2 = calculateCountdown(futureDate);
  assert.equal(res2.isExpired, false);
  assert.ok(res2.totalSeconds >= 299 && res2.totalSeconds <= 301);
  assert.equal(res2.minutes, 5);

  // Null / undefined expiresAt
  const res3 = calculateCountdown(null);
  assert.equal(res3.isExpired, true);
});
