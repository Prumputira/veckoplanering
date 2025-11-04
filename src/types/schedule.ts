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

export interface OfficeWeek {
  id: string;
  week_number: number;
  year: number;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Employee {
  id: string;
  name: string;
  week: {
    [key: string]: DayStatus; // mon, tue, wed, thu, fri
  };
  hasOfficeWeek?: boolean;
}

export interface WeekData {
  weekNumber: number;
  year: number;
  employees: Employee[];
}
