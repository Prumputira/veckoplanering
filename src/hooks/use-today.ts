import { useEffect, useState } from 'react';

export const useToday = () => {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    let timeoutId: number | undefined;

    const syncToday = () => {
      setToday((previousToday) => {
        const nextToday = new Date();

        return previousToday.toDateString() === nextToday.toDateString()
          ? previousToday
          : nextToday;
      });
    };

    const scheduleNextMidnightUpdate = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      timeoutId = window.setTimeout(() => {
        setToday(new Date());
        scheduleNextMidnightUpdate();
      }, nextMidnight.getTime() - now.getTime() + 1000);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncToday();
      }
    };

    syncToday();
    scheduleNextMidnightUpdate();

    window.addEventListener('focus', syncToday);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      window.removeEventListener('focus', syncToday);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return today;
};