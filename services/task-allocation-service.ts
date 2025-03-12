// services/task-allocation-service.ts
import toast from "react-hot-toast";

// Types for task allocation
export type EmployeeTask = "STOWER" | "DOWNSTACKER" | "INDUCTOR";
export type TaskAssignments = Record<number, EmployeeTask>;

export interface WorkforcePlan {
  Inductor: Array<{
    "Employee ID": number;
    "Times Worked (Last 30 Days)": number;
  }>;
  Downstackers: Array<{
    "Employee ID": number;
    "Times Worked (Last 30 Days)": number;
  }>;
  Stowers: Array<{
    "Employee ID": number;
    "Times Worked (Last 30 Days)": number;
  }>;
}

export interface WorkforcePlans {
  High: WorkforcePlan;
  Medium: WorkforcePlan;
  Low: WorkforcePlan;
}

export class TaskAllocationService {
  // Assign a task to an employee for a schedule
  static async assignTask(
    scheduleId: number,
    employeeId: number,
    taskId: EmployeeTask
  ): Promise<any> {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          task: taskId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign task");
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error assigning task:", error);
      throw error;
    }
  }

  // Save multiple task assignments for a schedule
  static async saveAssignments(
    scheduleId: number,
    assignments: TaskAssignments
  ): Promise<any> {
    try {
      const formattedAssignments = Object.entries(assignments).map(
        ([employeeId, task]) => ({
          employeeId: parseInt(employeeId),
          task,
        })
      );

      const response = await fetch(`/api/schedules/${scheduleId}/tasks/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignments: formattedAssignments,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save task assignments");
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error saving task assignments:", error);
      throw error;
    }
  }

  // Get task assignments for a schedule
  static async getTaskAssignments(scheduleId: number): Promise<TaskAssignments> {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/tasks`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch task assignments");
      }

      const result = await response.json();
      
      // Convert array of assignments to task assignment object
      const taskAssignments: TaskAssignments = {};
      result.data.forEach((assignment: { employeeId: number; task: EmployeeTask }) => {
        taskAssignments[assignment.employeeId] = assignment.task;
      });
      
      return taskAssignments;
    } catch (error) {
      console.error("Error fetching task assignments:", error);
      throw error;
    }
  }

  // Get workforce plans based on efficiency data (python algorithm)
  static async getWorkforcePlans(
    scheduleId: number
  ): Promise<WorkforcePlans> {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/tasks/workforce-plans`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get workforce plans");
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error getting workforce plans:", error);
      throw error;
    }
  }

  // Apply a specific workforce plan
  static async applyWorkforcePlan(
    scheduleId: number,
    planType: "High" | "Medium" | "Low"
  ): Promise<any> {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/tasks/apply-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planType
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to apply workforce plan");
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error applying workforce plan:", error);
      throw error;
    }
  }
}