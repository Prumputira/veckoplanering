export type StatusType = 'unset' | 'office' | 'home' | 'absent' | 'site_visit';

export interface StatusSegment {
  status: StatusType;
  reason?: string;
  period?: string; // e.g., "FM" (förmiddag), "EM" (eftermiddag), or custom time
  office?: string; // e.g., "Solna", "Sundsvall", "Enköping", "Nyköping"
}

export interface DayStatus {
  segments: StatusSegment[];
}

export interface Employee {
  id: string;
  name: string;
  week: {
    [key: string]: DayStatus; // mon, tue, wed, thu, fri
  };
}

export interface WeekData {
  weekNumber: number;
  year: number;
  employees: Employee[];
}
