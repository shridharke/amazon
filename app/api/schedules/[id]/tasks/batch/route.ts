// app/api/schedules/[id]/tasks/batch/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { EmployeeTask } from "@prisma/client";

// POST /api/schedules/[id]/tasks/batch
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
    const { assignments } = data;

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json(
        { message: "Assignments are required" },
        { status: 400 }
      );
    }

    // Verify each assignment has employeeId and task
    for (const assignment of assignments) {
      if (!assignment.employeeId || !assignment.task) {
        return NextResponse.json(
          { message: "Each assignment must have employeeId and task" },
          { status: 400 }
        );
      }

      // Verify the task is valid
      if (!["STOWER", "DOWNSTACKER", "INDUCTOR"].includes(assignment.task)) {
        return NextResponse.json(
          { message: `Invalid task: ${assignment.task}` },
          { status: 400 }
        );
      }
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

    // Update task assignments in a transaction
    const results = await prisma.$transaction(
      assignments.map(assignment => 
        prisma.scheduleEmployee.update({
          where: {
            scheduleId_employeeId: {
              scheduleId: id,
              employeeId: assignment.employeeId
            }
          },
          data: {
            task: assignment.task as EmployeeTask
          }
        })
      )
    );

    return NextResponse.json({
      message: "Tasks assigned successfully",
      data: results.map(result => ({
        employeeId: result.employeeId,
        task: result.task
      }))
    });
  } catch (error) {
    console.error("Failed to assign tasks:", error);
    
    // Check for common errors
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json(
        { 
          message: "One or more employees are not assigned to this schedule",
          details: error.message
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        message: "Failed to assign tasks",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
});