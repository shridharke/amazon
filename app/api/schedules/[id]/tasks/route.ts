import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { EmployeeTask } from "@prisma/client";

// GET /api/schedules/[id]/tasks
export const GET = auth(async (request, { params }) => {
  if (!request.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    let scheduleId = params?.id;

    if (!scheduleId) {
      return NextResponse.json(
        { message: "Schedule ID is required" },
        { status: 400 }
      );
    }

    if (Array.isArray(scheduleId)) {
      scheduleId = scheduleId[0];
    }
    const id = parseInt(scheduleId);

    // Get schedule with employees to verify access
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        organization: {
          include: {
            users: {
              where: {
                id: request.auth.user?.id
              }
            }
          }
        },
        scheduleEmployee: {
          include: {
            employee: true
          }
        }
      }
    });

    if (!schedule) {
      return NextResponse.json(
        { message: "Schedule not found" },
        { status: 404 }
      );
    }

    // Verify user has access to this organization
    if (schedule.organization.users.length === 0) {
      return NextResponse.json(
        { message: "You don't have access to this schedule" },
        { status: 403 }
      );
    }

    // Get task assignments
    const taskAssignments = schedule.scheduleEmployee.map(se => ({
      employeeId: se.employeeId,
      task: se.task
    }));

    return NextResponse.json({
      message: "Task assignments retrieved successfully",
      data: taskAssignments
    });
  } catch (error) {
    console.error("Failed to fetch task assignments:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch task assignments",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
});

// POST /api/schedules/[id]/tasks
export const POST = auth(async (request, { params }) => {
    if (!request.auth) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }
  
    try {
      let scheduleId = params?.id;
  
      if (!scheduleId) {
        return NextResponse.json(
          { message: "Schedule ID is required" },
          { status: 400 }
        );
      }
  
      if (Array.isArray(scheduleId)) {
        scheduleId = scheduleId[0];
      }
      const id = parseInt(scheduleId);
  
      const data = await request.json();
      const { employeeId, task } = data;
  
      if (!employeeId || !task) {
        return NextResponse.json(
          { message: "Employee ID and task are required" },
          { status: 400 }
        );
      }
  
      // Verify the task is valid
      if (!["STOWER", "DOWNSTACKER", "INDUCTOR"].includes(task)) {
        return NextResponse.json(
          { message: "Invalid task" },
          { status: 400 }
        );
      }
  
      // Get schedule to verify access
      const schedule = await prisma.schedule.findUnique({
        where: { id },
        include: {
          organization: {
            include: {
              users: {
                where: {
                  id: request.auth.user?.id
                }
              }
            }
          }
        }
      });
  
      if (!schedule) {
        return NextResponse.json(
          { message: "Schedule not found" },
          { status: 404 }
        );
      }
  
      // Verify user has access to this organization
      if (schedule.organization.users.length === 0) {
        return NextResponse.json(
          { message: "You don't have access to this schedule" },
          { status: 403 }
        );
      }
  
      // Check if the employee is assigned to this schedule
      const scheduleEmployee = await prisma.scheduleEmployee.findUnique({
        where: {
          scheduleId_employeeId: {
            scheduleId: id,
            employeeId
          }
        }
      });
  
      if (!scheduleEmployee) {
        return NextResponse.json(
          { message: "Employee is not assigned to this schedule" },
          { status: 404 }
        );
      }
  
      // Update the task assignment
      const updatedAssignment = await prisma.scheduleEmployee.update({
        where: {
          id: scheduleEmployee.id
        },
        data: {
          task: task as EmployeeTask
        }
      });
  
      return NextResponse.json({
        message: "Task assigned successfully",
        data: {
          employeeId: updatedAssignment.employeeId,
          task: updatedAssignment.task
        }
      });
    } catch (error) {
      console.error("Failed to assign task:", error);
      return NextResponse.json(
        {
          message: "Failed to assign task",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  });