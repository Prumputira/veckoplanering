import { format, startOfWeek, addDays, getWeek, getYear, addWeeks, setISOWeek, setISOWeekYear, startOfDay, differenceInCalendarDays } from 'date-fns';
import { sv } from 'date-fns/locale';

/**
 * Returnerar måndagen för en given ISO-vecka (svensk standard).
 * Om veckan redan passerat i år, hoppar vi till nästa år.
 */
export const getMondayOfIsoWeek = (weekNumber: number, from: Date = new Date()): Date => {
  const today = startOfDay(from);
  let year = getYear(today);
  let candidate = startOfWeek(setISOWeek(setISOWeekYear(new Date(year, 0, 4), year), weekNumber), { weekStartsOn: 1 });
  if (candidate.getTime() <= today.getTime()) {
    year += 1;
    candidate = startOfWeek(setISOWeek(setISOWeekYear(new Date(year, 0, 4), year), weekNumber), { weekStartsOn: 1 });
  }
  return candidate;
};

export const daysUntil = (target: Date, from: Date = new Date()): number => {
  return differenceInCalendarDays(startOfDay(target), startOfDay(from));
};

export const getWeekDays = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  return Array.from({ length: 5 }, (_, i) => addDays(start, i));
};

export const getWeekNumber = (date: Date) => {
  return getWeek(date, { weekStartsOn: 1, firstWeekContainsDate: 4 });
};

export const getWeekYear = (date: Date) => {
  return getYear(date);
};

export const formatDate = (date: Date) => {
  return format(date, 'd MMM', { locale: sv });
};

export const formatDayName = (date: Date) => {
  return format(date, 'EEEE', { locale: sv });
};

export const getDayKey = (date: Date): string => {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri'];
  return days[date.getDay() - 1];
};

export const navigateWeek = (currentDate: Date, direction: 'prev' | 'next'): Date => {
  return addWeeks(currentDate, direction === 'next' ? 1 : -1);
};
