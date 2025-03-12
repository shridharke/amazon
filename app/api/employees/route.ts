import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/employees?organizationId=1
export const GET = auth(async (request) => {
  if (!request.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    // Get organizationId from query parameters
    const url = new URL(request.url);
    const organizationId = url.searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { message: "Organization ID is required" },
        { status: 400 }
      );
    }

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

    // Get all active employees for the organization
    const employees = await prisma.employee.findMany({
      where: {
        organizationId: parseInt(organizationId),
        isActive: true,
      },
    });

    return NextResponse.json({
      message: "Employees retrieved successfully",
      employees: employees
    });
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch employees",
        details: error,
      },
      { status: 500 }
    );
  }
});

// POST /api/employees
export const POST = auth(async (request) => {
    if (!request.auth) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }
  
    try {
      const data = await request.json();
      const { 
        name, 
        email,
        type, 
        workDays, 
        organizationId 
      } = data;
  
      // Validate required fields
      if (!name || !email || !type || !organizationId) {
        return NextResponse.json(
          { message: "Missing required fields" },
          { status: 400 }
        );
      }
  
      // Verify user has access to this organization
      const userOrg = await prisma.organization.findFirst({
        where: {
          id: organizationId,
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
  
      // Check if email already exists
      const existingEmployee = await prisma.employee.findFirst({
        where: {
          email: email,
          isActive: true // Only check active employees
        },
      });
      
      if (existingEmployee) {
        return NextResponse.json(
          { message: "An employee with this email already exists" },
          { status: 400 }
        );
      }
  
      // Validate work days for fixed employees
      if (type === "FIXED") {
        try {
          const parsedWorkDays = workDays ? JSON.parse(workDays) : [];
          if (!Array.isArray(parsedWorkDays) || parsedWorkDays.length !== 4) {
            return NextResponse.json(
              { message: "Fixed employees must have exactly 4 work days" },
              { status: 400 }
            );
          }
        } catch (e) {
          return NextResponse.json(
            { message: "Invalid work days format" },
            { status: 400 }
          );
        }
      }
  
      // Create the employee
      const employee = await prisma.employee.create({
        data: {
          name,
          email,
          type,
          workDays,
          organizationId,
        },
      });
  
      return NextResponse.json(
        {
          message: "Employee created successfully",
          employee: employee
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Failed to create employee:", error);
      return NextResponse.json(
        {
          message: error instanceof Error ? error.message : "Failed to create employee",
        },
        { status: 500 }
      );
    }
  });