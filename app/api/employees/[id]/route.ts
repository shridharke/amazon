import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/employees/[id]
export const GET = auth(async (request, response) => {
  if (!request.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    
    let empId = response.params?.id;

    if (!empId) {
      return NextResponse.json(
        { message: "File ID is required" },
        { status: 400 }
      );
    }
  
    if (Array.isArray(empId)) {
        empId = empId[0];
    }
    const id = parseInt(empId);

    // Get the employee
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return NextResponse.json(
        { message: "Employee not found" },
        { status: 404 }
      );
    }

    // Verify user has access to this organization
    const userOrg = await prisma.organization.findFirst({
      where: {
        id: employee.organizationId,
        users: {
          some: {
            id: request.auth.user?.id
          }
        }
      }
    });

    if (!userOrg) {
      return NextResponse.json(
        { message: "You don't have access to this employee" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      message: "Employee retrieved successfully",
      employee: employee
    });
  } catch (error) {
    console.error("Failed to fetch employee:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch employee",
        details: error,
      },
      { status: 500 }
    );
  }
});

// PATCH /api/employees/[id]
export const PATCH = auth(async (request, response) => {
  if (!request.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    let empId = response.params?.id;

    if (!empId) {
      return NextResponse.json(
        { message: "File ID is required" },
        { status: 400 }
      );
    }
  
    if (Array.isArray(empId)) {
        empId = empId[0];
    }
    const id = parseInt(empId);

    // Get existing employee
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { message: "Employee not found" },
        { status: 404 }
      );
    }

    // Verify user has access to this organization
    const userOrg = await prisma.organization.findFirst({
      where: {
        id: existingEmployee.organizationId,
        users: {
          some: {
            id: request.auth.user?.id
          }
        }
      }
    });

    if (!userOrg) {
      return NextResponse.json(
        { message: "You don't have access to this employee" },
        { status: 403 }
      );
    }

    // Get update data
    const data = await request.json();
    const { 
      name, 
      type, 
      workDays, 
      avgEfficiency,
      inductorEff,
      stowerEff,
      downstackerEff 
    } = data;

    // Update the employee
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        type: type !== undefined ? type : undefined,
        workDays: workDays !== undefined ? workDays : undefined,
        avgEfficiency: avgEfficiency !== undefined ? avgEfficiency : undefined,
        inductorEff: inductorEff !== undefined ? inductorEff : undefined,
        stowerEff: stowerEff !== undefined ? stowerEff : undefined,
        downstackerEff: downstackerEff !== undefined ? downstackerEff : undefined,
      },
    });

    return NextResponse.json({
      message: "Employee updated successfully",
      employee: employee
    });
  } catch (error) {
    console.error("Failed to update employee:", error);
    return NextResponse.json(
      {
        message: "Failed to update employee",
        details: error,
      },
      { status: 500 }
    );
  }
});

// DELETE /api/employees/[id] (Soft delete)
export const DELETE = auth(async (request, response) => {
  if (!request.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    let empId = response.params?.id;

    if (!empId) {
      return NextResponse.json(
        { message: "File ID is required" },
        { status: 400 }
      );
    }
  
    if (Array.isArray(empId)) {
        empId = empId[0];
    }
    const id = parseInt(empId);

    // Get existing employee
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { message: "Employee not found" },
        { status: 404 }
      );
    }

    // Verify user has access to this organization
    const userOrg = await prisma.organization.findFirst({
      where: {
        id: existingEmployee.organizationId,
        users: {
          some: {
            id: request.auth.user?.id
          }
        }
      }
    });

    if (!userOrg) {
      return NextResponse.json(
        { message: "You don't have access to this employee" },
        { status: 403 }
      );
    }

    // Soft delete the employee
    const employee = await prisma.employee.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Employee deleted successfully",
      employee: employee
    });
  } catch (error) {
    console.error("Failed to delete employee:", error);
    return NextResponse.json(
      {
        message: "Failed to delete employee",
        details: error,
      },
      { status: 500 }
    );
  }
});