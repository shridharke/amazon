// types/schedule.ts
import { Schedule, ScheduleStatus, EmployeeTask, VETStatus, ShiftStatus, Employee, Package, VET, Prisma, PackageStatus } from '@prisma/client';

export interface VETInfo {
  id: number;
  status: VETStatus;
  targetPackageCount: number;
  openedAt: Date;
  closedAt?: Date;
  scheduleId: number;
}

export interface ShiftInfo {
  id: number;
  status: ShiftStatus;
  totalPackages: number;
  completedCount: number;
}

export interface PackageInfo {
  id: number;
  totalCount: number;
  completedCount: number;
  status: PackageStatus;
}

export interface ScheduleInfo {
    id: number;
    date: Date;
    status: ScheduleStatus;
    shift?: ShiftInfo;
    employees: ScheduleEmployee[];
    vet?: VETInfo;
    fixedEmployeesEfficiency: number;
    remainingPackages: number;
  }

export interface CreateScheduleRequest {
  date: string;
  packageCount: number;
  organizationId: number;
}

export interface VETActionRequest {
  scheduleId: number;
  organizationId: number;
  targetPackageCount?: number;
}

export interface APIResponse<T> {
  data?: T;
  error?: string;
}

// Prisma Types
export type PrismaVET = Prisma.VETGetPayload<{}>;
export type PrismaPackage = Prisma.PackageGetPayload<{}>;
export type PrismaShift = Prisma.ShiftGetPayload<{
  include: {
    package: true;
  };
}>;

export type ScheduleWithRelations = Prisma.ScheduleGetPayload<{
  include: {
    shift: {
      include: {
        package: true;
      };
    };
    scheduleEmployee: {
      include: {
        employee: true;
      };
    };
    vet: true;
  };
}>;

export interface ScheduleEmployee {
  id: number;
  name: string;
  task: EmployeeTask | null;
  efficiency: number;
  status: string;
  type: 'FIXED' | 'FLEX';
}

export interface VETInfo {
  id: number;
  status: VETStatus;
  targetPackageCount: number;
  remainingCount: number;
  openedAt: Date;
  closedAt?: Date;
}

export interface ShiftInfo {
  id: number;
  status: ShiftStatus;
  totalPackages: number;
  completedCount: number;
}

export interface ScheduleInfo {
  id: number;
  date: Date;
  status: ScheduleStatus;
  shift?: ShiftInfo;
  employees: ScheduleEmployee[];
  vet?: VETInfo;
  fixedEmployeesEfficiency: number;
  remainingPackages: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  className: string;
  extendedProps: {
    scheduleId: number;
    status: ScheduleStatus;
    totalPackages: number;
    completedPackages: number;
    hasActiveVet: boolean;
  };
}

export interface CreateScheduleRequest {
  date: string;
  packageCount: number;
  organizationId: number;
  fixedEmployees: any[];
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}