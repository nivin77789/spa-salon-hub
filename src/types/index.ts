export interface Branch {
  id: string;
  name: string;
  type: 'spa' | 'salon';
  createdAt: Date;
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string;
  age: number;
  address: string;
  contact: string;
  aadharNumber: string;
  role: 'therapist' | 'receptionist' | 'manager' | 'other';
  branchId: string;
  createdAt: Date;
}

export interface Attendance {
  id: string;
  staffId: string;
  date: string;
  entryTime: string;
  exitTime: string;
  status: 'present' | 'absent' | 'half-day';
  branchId: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  type: 'regular' | 'new';
  checkInTime: string;
  therapyDuration: number; // in minutes
  checkOutTime: string;
  therapistId: string;
  therapistName: string;
  date: string;
  branchId: string;
  amount: number;
  isActive: boolean;
}
