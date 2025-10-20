import { Employee } from '@/types/schedule';

export const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Anna Andersson',
    role: 'VD',
    week: {
      mon: { segments: [{ status: 'office' }] },
      tue: { segments: [{ status: 'office' }] },
      wed: { segments: [{ status: 'home', reason: 'Kundmöte online' }] },
      thu: { segments: [{ status: 'office', period: 'FM' }, { status: 'absent', period: 'EM', reason: 'Läkarbesök' }] },
      fri: { segments: [{ status: 'absent', reason: 'Semester' }] },
    },
  },
  {
    id: '2',
    name: 'Erik Eriksson',
    role: 'Säljchef',
    week: {
      mon: { segments: [{ status: 'home' }] },
      tue: { segments: [{ status: 'office' }] },
      wed: { segments: [{ status: 'office' }] },
      thu: { segments: [{ status: 'office' }] },
      fri: { segments: [{ status: 'home' }] },
    },
  },
  {
    id: '3',
    name: 'Maria Svensson',
    role: 'Projektledare',
    week: {
      mon: { segments: [{ status: 'office' }] },
      tue: { segments: [{ status: 'office' }] },
      wed: { segments: [{ status: 'absent', reason: 'VAB' }] },
      thu: { segments: [{ status: 'office' }] },
      fri: { segments: [{ status: 'office' }] },
    },
  },
  {
    id: '4',
    name: 'Johan Johansson',
    role: 'Designer',
    week: {
      mon: { segments: [{ status: 'home' }] },
      tue: { segments: [{ status: 'home' }] },
      wed: { segments: [{ status: 'office', reason: 'Workshop' }] },
      thu: { segments: [{ status: 'home' }] },
      fri: { segments: [{ status: 'home' }] },
    },
  },
  {
    id: '5',
    name: 'Lisa Larsson',
    role: 'Ekonomiansvarig',
    week: {
      mon: { segments: [{ status: 'office' }] },
      tue: { segments: [{ status: 'office' }] },
      wed: { segments: [{ status: 'office' }] },
      thu: { segments: [{ status: 'office' }] },
      fri: { segments: [{ status: 'office' }] },
    },
  },
];
