export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastModifiedBy: string;
  recurring?: RecurringPattern;
}

export type AppointmentStatus =
  | 'confirmed'
  | 'pending'
  | 'cancelled'
  | 'blocked';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  availability: Availability[];
  avatar?: string;
}

export interface Availability {
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  endDate?: string;
  exceptions?: string[];
}
