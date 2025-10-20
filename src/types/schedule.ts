export type StatusType = 'office' | 'home' | 'absent';

export interface DayStatus {
  status: StatusType;
  reason?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  week: {
    [key: string]: DayStatus; // mon, tue, wed, thu, fri
  };
}

export interface WeekData {
  weekNumber: number;
  year: number;
  employees: Employee[];
}
