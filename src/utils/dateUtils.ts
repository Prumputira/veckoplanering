import { format, startOfWeek, addDays, getWeek, getYear, addWeeks } from 'date-fns';
import { sv } from 'date-fns/locale';

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
