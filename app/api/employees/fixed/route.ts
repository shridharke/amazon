// app/api/employees/fixed/route.js
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = auth(async (request) => {
  if (!request.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    // Get organizationId and date from query parameters
    const url = new URL(request.url);
    const organizationId = url.searchParams.get("organizationId") || "1"; // Default to 1 if not provided
    const dateParam = url.searchParams.get("date");
    
    // Parse the date to get the day of week
    const date = dateParam ? new Date(dateParam) : new Date();
    const dayOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][date.getDay()];

    // Verify user has access to this organization
    const userOrg = await prisma.organization.findFirst({
      where: {
        id: parseInt(organizationId),
        users: {
          some: {
            id: request.auth.user?.id
          }
        }
      }
    });

    if (!userOrg) {
      return NextResponse.json(
        { message: "You don't have access to this organization" },
        { status: 403 }
      );
    }

    // Get all fixed employees for the organization
    const employees = await prisma.employee.findMany({
      where: {
        organizationId: parseInt(organizationId),
        isActive: true,
        type: "FIXED"
      },
    });

    // Filter employees by work day
    const availableEmployees = employees.filter(emp => {
      try {
        const workDays = JSON.parse(emp.workDays || "[]");
        return workDays.includes(dayOfWeek);
      } catch (e) {
        console.error(`Error parsing work days for employee ${emp.id}:`, e);
        return false;
      }
    });

    // Calculate the average efficiency for each employee
    const employeesWithEfficiency = availableEmployees.map(emp => {
      // Use overallEfficiency as the base value
      const efficiency = emp.stowerEff || 0;
      
      return {
        id: emp.id,
        name: emp.name,
        type: emp.type,
        efficiency: Math.round(efficiency),
        workDays: emp.workDays
      };
    });

    return NextResponse.json({
      message: "Fixed employees retrieved successfully",
      employees: employeesWithEfficiency
    });
  } catch (error) {
    console.error("Failed to fetch fixed employees:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch fixed employees",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
});