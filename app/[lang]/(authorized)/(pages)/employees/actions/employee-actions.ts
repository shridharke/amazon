'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { EmployeeType } from "@prisma/client";
import { z } from "zod";

const employeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  type: z.enum(["FIXED", "FLEX"]),
  workDays: z.string().nullable().optional(), // Store as JSON string in DB
  organizationId: z.number().int().positive(),
  avgEfficiency: z.number().optional(),
  inductorEff: z.number().optional(),
  stowerEff: z.number().optional(),
  downstackerEff: z.number().optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

export async function getEmployees(organizationId: number) {
  try {
    const employees = await prisma.employee.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
    
    return { success: true, data: employees };
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    return { success: false, error: "Failed to fetch employees" };
  }
}

export async function createEmployee(values: EmployeeFormValues) {
  try {
    const validated = employeeSchema.parse(values);
    
    // Check if email already exists
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        email: validated.email,
      },
    });
    
    if (existingEmployee) {
      return { success: false, error: "Email already exists" };
    }
    
    const employee = await prisma.employee.create({
      data: {
        ...validated,
        avgEfficiency: validated.avgEfficiency || 110.0,
        inductorEff: validated.inductorEff || 110.0,
        stowerEff: validated.stowerEff || 110.0,
        downstackerEff: validated.downstackerEff || 110.0,
      },
    });
    
    revalidatePath(`/employees`);
    return { success: true, data: employee };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Failed to create employee:", error);
    return { success: false, error: "Failed to create employee" };
  }
}

export async function updateEmployee(id: number, values: Partial<EmployeeFormValues>) {
  try {
    // If email is being updated, check for uniqueness
    if (values.email) {
      const existingEmployee = await prisma.employee.findFirst({
        where: {
          email: values.email,
          NOT: {
            id: id
          }
        },
      });
      
      if (existingEmployee) {
        return { success: false, error: "Email already exists" };
      }
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: values,
    });
    
    revalidatePath(`/employees`);
    return { success: true, data: employee };
  } catch (error) {
    console.error("Failed to update employee:", error);
    return { success: false, error: "Failed to update employee" };
  }
}

export async function deleteEmployee(id: number) {
  try {
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
    
    revalidatePath(`/employees`);
    return { success: true, data: employee };
  } catch (error) {
    console.error("Failed to delete employee:", error);
    return { success: false, error: "Failed to delete employee" };
  }
}