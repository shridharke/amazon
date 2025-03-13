// services/schedule-service.ts

import { formatISO, parseISO } from "date-fns";
import { EmployeeTask, EmployeeType, ScheduleStatus } from "@prisma/client";
import toast from "react-hot-toast";

// Types for our schedule data
export interface ScheduleData {
  id: number;
  date: Date;
  status: ScheduleStatus;
  package?: {
    id: number;
    totalCount: number;
    completedCount: number;
    status: string;
  };
  fixedEmployees: EmployeeSchedule[];
  flexEmployees: EmployeeSchedule[];
  fixedCapacity: number;
  flexCapacity: number;
  vet?: {
    id: number;
    status: string;
    openedAt: Date;
    closedAt?: Date;
    targetPackageCount: number;
  };
  vto?: {
    id: number;
    status: string;
    openedAt: Date;
    closedAt?: Date;
  };
  shift?: {
    id: number;
    status: string;
    startTime?: Date;
    endTime?: Date;
    totalPackages: number;
  };
}

export interface EmployeeSchedule {
  id: number;
  employeeId: number;
  name: string;
  email: string;
  type: EmployeeType;
  task?: EmployeeTask;
  status: string;
  efficiency?: number;
  avgEfficiency: number;
  inductorEff: number;
  stowerEff: number;
  downstackerEff: number;
}

export interface TaskAllocationOption {
  id: string;
  name: string;
  expectedCompletionTime: string;
  allocations: {
    employeeId: number;
    name: string;
    task: EmployeeTask;
    efficiency: number;
  }[];
}

// Get all schedules for a month
export async function getMonthSchedules(organizationId: number, year: number, month: number) {
  try {
    const response = await fetch(`/api/schedules?organizationId=${organizationId}&year=${year}&month=${month}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data: data.schedules };
    } else {
      return { success: false, error: data.message || "Failed to fetch schedules" };
    }
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Get schedule for a specific date
export async function getScheduleForDate(organizationId: number, date: Date) {
  try {
    const formattedDate = formatISO(date, { representation: 'date' });
    const response = await fetch(`/api/schedules/day?organizationId=${organizationId}&date=${formattedDate}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data: data.schedule };
    } else {
      return { success: false, error: data.message || "Failed to fetch schedule" };
    }
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Create/update package count for a date
export async function updatePackageCount(organizationId: number, date: Date, packageCount: number) {
  try {
    const formattedDate = formatISO(date, { representation: 'date' });
    const response = await fetch(`/api/schedules/package`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ organizationId, date: formattedDate, packageCount }),
    });

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data: data.schedule };
    } else {
      return { success: false, error: data.message || "Failed to update package count" };
    }
  } catch (error) {
    console.error("Error updating package count:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// VET operations
export async function openVET(scheduleId: number) {
  try {
    const response = await fetch(`/api/schedules/vet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scheduleId }),
    });

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data: data.vet };
    } else {
      return { success: false, error: data.message || "Failed to open VET" };
    }
  } catch (error) {
    console.error("Error opening VET:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function closeVET(vetId: number) {
  try {
    const response = await fetch(`/api/schedules/vet/${vetId}/close`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data: data.vet };
    } else {
      return { success: false, error: data.message || "Failed to close VET" };
    }
  } catch (error) {
    console.error("Error closing VET:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// VTO operations
export async function openVTO(scheduleId: number) {
  try {
    const response = await fetch(`/api/schedules/vto`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scheduleId }),
    });

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data: data.vto };
    } else {
      return { success: false, error: data.message || "Failed to open VTO" };
    }
  } catch (error) {
    console.error("Error opening VTO:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function closeVTO(vtoId: number) {
  try {
    const response = await fetch(`/api/schedules/vto/${vtoId}/close`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data: data.vto };
    } else {
      return { success: false, error: data.message || "Failed to close VTO" };
    }
  } catch (error) {
    console.error("Error closing VTO:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Task allocation operations
export async function getTaskAllocationOptions(scheduleId: number) {
  try {
    const response = await fetch(`/api/schedules/${scheduleId}/task-options`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data: data.options };
    } else {
      return { success: false, error: data.message || "Failed to get task allocation options" };
    }
  } catch (error) {
    console.error("Error fetching task allocation options:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function applyTaskAllocation(scheduleId: number, optionId: string, adjustments?: any[]) {
  try {
    const response = await fetch(`/api/schedules/${scheduleId}/allocate-tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ optionId, adjustments }),
    });

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data: data.schedule };
    } else {
      return { success: false, error: data.message || "Failed to apply task allocation" };
    }
  } catch (error) {
    console.error("Error applying task allocation:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Shift operations
export async function startShift(scheduleId: number) {
  try {
    const response = await fetch(`/api/schedules/${scheduleId}/start-shift`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data: data.shift };
    } else {
      return { success: false, error: data.message || "Failed to start shift" };
    }
  } catch (error) {
    console.error("Error starting shift:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function endShift(shiftId: number) {
  try {
    const response = await fetch(`/api/shifts/${shiftId}/end`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data: data.shift };
    } else {
      return { success: false, error: data.message || "Failed to end shift" };
    }
  } catch (error) {
    console.error("Error ending shift:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Get performance metrics for a completed shift
export async function getShiftPerformance(shiftId: number) {
  try {
    const response = await fetch(`/api/shifts/${shiftId}/performance`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data: data.performance };
    } else {
      return { success: false, error: data.message || "Failed to fetch shift performance" };
    }
  } catch (error) {
    console.error("Error fetching shift performance:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}


export interface Schedule {
  id: number;
  date: string;
  status: string;
  employees: Employee[];
  shift?: {
    id: number;
    status: string;
    totalPackages: number;
    completedCount: number;
  };
  vet?: {
    id: number;
    status: string;
    targetPackageCount: number;
    remainingCount: number;
    openedAt: string;
    closedAt?: string;
    scheduleId: number;
  };
  fixedEmployeesEfficiency: number;
  remainingPackages: number;
}

export interface Employee {
  id: number;
  name: string;
  type: string;
  task?: string;
  efficiency: number;
  status?: string;
  avgEfficiency?: number;
  inductorEff?: number;
  stowerEff?: number;
  downstackerEff?: number;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  className: string;
  extendedProps: {
    scheduleId: number;
    status: string;
    totalPackages: number;
    completedPackages: number;
    hasActiveVet: boolean;
  };
}

export class ScheduleService {

  static async getScheduleByDate(
    organizationId: number,
    date: string
  ): Promise<Schedule | null> {
    try {
      const response = await fetch(
        `/api/schedules/date?organizationId=${organizationId}&date=${date}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
  
      console.log("Schedule by date response status:", response.status);
  
      if (!response.ok) {
        if (response.status === 404) {
          // Not found is a valid response, return null
          return null;
        }
        throw new Error("Failed to fetch schedule");
      }
  
      const result = await response.json();
      
      if (!result.success || !result.data) {
        console.log("No schedule found for date:", date);
        return null;
      }
      
      return result.data;
    } catch (error) {
      console.error("Error fetching schedule by date:", error);
      toast.error("Failed to fetch schedule");
      throw error;
    }
  }

  // Get all schedules for a date range
  static async getSchedules(
    organizationId: number, 
    startDate: string, 
    endDate: string
  ): Promise<ScheduleEvent[]> {
    try {
      const response = await fetch(
        `/api/schedules?organizationId=${organizationId}&start=${startDate}&end=${endDate}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("schedule response", response);

      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error("Error fetching schedules:", error);
      toast.error("Failed to fetch schedules");
      throw error;
    }
  }

  // Get a specific schedule by ID
  static async getScheduleById(scheduleId: number): Promise<Schedule> {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch schedule");
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error fetching schedule:", error);
      toast.error("Failed to fetch schedule details");
      throw error;
    }
  }

  // Create a new schedule
  static async createSchedule(
    organizationId: number,
    date: string,
    packageCount: number
  ): Promise<Schedule> {
    try {
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          date,
          packageCount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create schedule");
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error creating schedule:", error);
      toast.error("Failed to create schedule");
      throw error;
    }
  }

  // Start VET for a schedule
  static async startVET(
    scheduleId: number,
    targetPackageCount: number
  ): Promise<any> {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/vet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetPackageCount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start VET");
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error starting VET:", error);
      toast.error("Failed to start VET");
      throw error;
    }
  }

  // Close VET for a schedule
  static async closeVET(scheduleId: number): Promise<any> {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/vet`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to close VET");
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error closing VET:", error);
      toast.error("Failed to close VET");
      throw error;
    }
  }

  // Confirm employee for VET
  static async confirmVET(
    scheduleId: number,
    employeeId: number
  ): Promise<any> {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/vet/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to confirm VET");
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error confirming VET:", error);
      toast.error("Failed to confirm VET");
      throw error;
    }
  }
}