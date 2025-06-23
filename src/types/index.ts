export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Establishment {
  id: string;
  name: string;
  userId: string;
  dayStart: string; // formato "07:00"
  dayEnd: string; // formato "19:00"
  nightStart: string; // formato "19:00"
  nightEnd: string; // formato "07:00"
  createdAt: Date;
}

export interface Group {
  id: string;
  name: string;
  establishmentId: string;
  validShifts: ShiftType[];
  defaultMonthlyHours: number;
  defaultShiftHours: number;
  createdAt: Date;
}

export interface DutyWorker {
  id: string;
  name: string;
  groupId: string;
  preferences: ShiftType[];
  unavailableWeekdays: number[]; // 0-6 (domingo-sábado)
  monthlyHours: number;
  monthlyRestrictions: { [month: string]: number[] }; // ex: {"2024-01": [15, 23]}
  createdAt: Date;
}

export interface Schedule {
  id: string;
  groupId: string;
  month: string; // formato "2024-01"
  year: number;
  assignments: { [day: string]: Assignment[] }; // ex: {"1": [{workerId: "1", shift: "D"}]}
  status: 'draft' | 'confirmed';
  createdAt: Date;
  confirmedAt?: Date;
}

export interface Assignment {
  workerId: string;
  shift: ShiftType;
  hours: number;
}

export type ShiftType = 'D' | 'N' | 'P' | 'ND';

export interface ShiftConfig {
  type: ShiftType;
  label: string;
  hours: number;
  color: string;
  description: string;
}

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  workerId?: string;
  day?: number;
}

export interface DashboardStats {
  totalEstablishments: number;
  totalGroups: number;
  totalWorkers: number;
  activeSchedules: number;
  pendingSchedules: number;
}