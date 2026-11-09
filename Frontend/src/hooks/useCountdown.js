import { useState, useEffect, useRef } from 'react';

/**
 * Calculates countdown remaining time and triggers expiration callback.
 * Ensures the requirement: "মেয়াদ শেষ হলে page reload ছাড়াই আবেদন EXPIRED দেখাবে,
 * আর 'ভর্তি ফি দিন' button বন্ধ হবে।"
 */
export function useCountdown(expiresAt, onExpire) {
  const calculate = () => {
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
  };

  const [timeLeft, setTimeLeft] = useState(calculate);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const hasExpiredTriggeredRef = useRef(false);

  useEffect(() => {
    hasExpiredTriggeredRef.current = false;
    const initial = calculate();
    setTimeLeft(initial);

    if (initial.isExpired) {
      if (onExpireRef.current) {
        onExpireRef.current();
      }
      return;
    }

    const interval = setInterval(() => {
      const next = calculate();
      setTimeLeft(next);

      if (next.isExpired) {
        clearInterval(interval);
        if (!hasExpiredTriggeredRef.current) {
          hasExpiredTriggeredRef.current = true;
          if (onExpireRef.current) {
            onExpireRef.current();
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return timeLeft;
}
