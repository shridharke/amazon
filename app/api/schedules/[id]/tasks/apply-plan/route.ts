// app/api/schedules/[id]/tasks/apply-plan/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { EmployeeTask } from "@prisma/client";

// POST /api/schedules/[id]/tasks/apply-plan
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
    const { planType } = data;

    if (!planType || !["High", "Medium", "Low"].includes(planType)) {
      return NextResponse.json(
        { message: "Valid plan type (High, Medium, Low) is required" },
        { status: 400 }
      );
    }

    // Get schedule to verify access and for workforce plans
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

    // First, get the workforce plans
    const workforcePlansResponse = await fetch(
      `${request.nextUrl.origin}/api/schedules/${id}/tasks/workforce-plans`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Pass along the auth cookie
          "Cookie": request.headers.get("cookie") || ""
        }
      }
    );

    if (!workforcePlansResponse.ok) {
      return NextResponse.json(
        { message: "Failed to get workforce plans" },
        { status: 500 }
      );
    }

    const workforcePlansResult = await workforcePlansResponse.json();
    const workforcePlans = workforcePlansResult.data;
    const selectedPlan = workforcePlans[planType];

    if (!selectedPlan) {
      return NextResponse.json(
        { message: "Selected plan not found" },
        { status: 404 }
      );
    }

    // Create task assignments from the selected plan
    const taskAssignments = [];

    // Assign inductors
    for (const employee of selectedPlan.Inductor) {
      taskAssignments.push({
        employeeId: employee["Employee ID"],
        task: "INDUCTOR" as EmployeeTask
      });
    }

    // Assign downstackers
    for (const employee of selectedPlan.Downstackers) {
      taskAssignments.push({
        employeeId: employee["Employee ID"],
        task: "DOWNSTACKER" as EmployeeTask
      });
    }

    // Assign stowers
    for (const employee of selectedPlan.Stowers) {
      taskAssignments.push({
        employeeId: employee["Employee ID"],
        task: "STOWER" as EmployeeTask
      });
    }

    // Update all task assignments in the database
    const results = await prisma.$transaction(
      taskAssignments.map(assignment => 
        prisma.scheduleEmployee.update({
          where: {
            scheduleId_employeeId: {
              scheduleId: id,
              employeeId: assignment.employeeId
            }
          },
          data: {
            task: assignment.task
          }
        })
      )
    );

    return NextResponse.json({
      message: `${planType} plan applied successfully`,
      data: {
        planType,
        assignments: results.map(result => ({
          employeeId: result.employeeId,
          task: result.task
        }))
      }
    });
  } catch (error) {
    console.error("Failed to apply workforce plan:", error);
    
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
        message: "Failed to apply workforce plan",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
});