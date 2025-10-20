import { Employee } from '@/types/schedule';

export const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Anna Andersson',
    role: 'VD',
    week: {
      mon: { status: 'office' },
      tue: { status: 'office' },
      wed: { status: 'home' },
      thu: { status: 'office' },
      fri: { status: 'absent', reason: 'Semester' },
    },
  },
  {
    id: '2',
    name: 'Erik Eriksson',
    role: 'Säljchef',
    week: {
      mon: { status: 'home' },
      tue: { status: 'office' },
      wed: { status: 'office' },
      thu: { status: 'office' },
      fri: { status: 'home' },
    },
  },
  {
    id: '3',
    name: 'Maria Svensson',
    role: 'Projektledare',
    week: {
      mon: { status: 'office' },
      tue: { status: 'office' },
      wed: { status: 'absent', reason: 'VAB' },
      thu: { status: 'office' },
      fri: { status: 'office' },
    },
  },
  {
    id: '4',
    name: 'Johan Johansson',
    role: 'Designer',
    week: {
      mon: { status: 'home' },
      tue: { status: 'home' },
      wed: { status: 'office' },
      thu: { status: 'home' },
      fri: { status: 'home' },
    },
  },
  {
    id: '5',
    name: 'Lisa Larsson',
    role: 'Ekonomiansvarig',
    week: {
      mon: { status: 'office' },
      tue: { status: 'office' },
      wed: { status: 'office' },
      thu: { status: 'office' },
      fri: { status: 'office' },
    },
  },
];
