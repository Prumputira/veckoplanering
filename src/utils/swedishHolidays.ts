import { addDays, format, startOfDay } from 'date-fns';
import { sv } from 'date-fns/locale';

// Beräkna påskdagen (Meeus/Jones/Butcher algoritm)
const getEasterSunday = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

// Midsommardagen: lördagen mellan 20-26 juni
const getMidsummerDay = (year: number): Date => {
  for (let d = 20; d <= 26; d++) {
    const date = new Date(year, 5, d);
    if (date.getDay() === 6) return date;
  }
  return new Date(year, 5, 20);
};

// Alla helgons dag: lördagen mellan 31 okt och 6 nov
const getAllSaintsDay = (year: number): Date => {
  // Sök från 31 oktober
  let date = new Date(year, 9, 31);
  while (date.getDay() !== 6) {
    date = addDays(date, 1);
  }
  return date;
};

export interface Holiday {
  date: Date;
  name: string;
}

export const getSwedishHolidays = (year: number): Holiday[] => {
  const easter = getEasterSunday(year);

  return [
    { date: new Date(year, 0, 1), name: 'Nyårsdagen' },
    { date: new Date(year, 0, 6), name: 'Trettondedag jul' },
    { date: addDays(easter, -2), name: 'Långfredagen' },
    { date: easter, name: 'Påskdagen' },
    { date: addDays(easter, 1), name: 'Annandag påsk' },
    { date: new Date(year, 4, 1), name: 'Första maj' },
    { date: addDays(easter, 39), name: 'Kristi himmelsfärdsdag' },
    { date: addDays(easter, 49), name: 'Pingstdagen' },
    { date: new Date(year, 5, 6), name: 'Sveriges nationaldag' },
    { date: getMidsummerDay(year), name: 'Midsommardagen' },
    { date: getAllSaintsDay(year), name: 'Alla helgons dag' },
    { date: new Date(year, 11, 25), name: 'Juldagen' },
    { date: new Date(year, 11, 26), name: 'Annandag jul' },
  ];
};

export const getNextHoliday = (from: Date = new Date()): Holiday | null => {
  const today = startOfDay(from);
  const year = today.getFullYear();
  const candidates = [...getSwedishHolidays(year), ...getSwedishHolidays(year + 1)]
    .filter((h) => startOfDay(h.date).getTime() > today.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  return candidates[0] ?? null;
};

export const formatHolidayDate = (date: Date): string => {
  const weekday = format(date, 'EEEE', { locale: sv });
  return `${format(date, 'd MMM', { locale: sv })} ${weekday}`;
};
