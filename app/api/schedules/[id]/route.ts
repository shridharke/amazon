// app/api/schedules/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ScheduleStatus, VETStatus, ShiftStatus } from '@prisma/client';
import { APIResponse, ScheduleInfo, CreateScheduleRequest } from '@/types/schedule';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        shift: {
          include: {
            package: true,
          },
        },
        scheduleEmployee: {
          include: {
            employee: true,
          },
        },
        vet: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Calculate remaining packages and fixed employees efficiency
    let remainingCount = 0;
    let remainingPackages = 0;
    let fixedEmployeesEfficiency = 0;
    
    if (schedule.shift) {
      const totalPackages = schedule.shift.totalPackages;
      const completedCount = schedule.shift.package?.completedCount || 0;
      remainingCount = totalPackages - completedCount;
      remainingPackages = remainingCount;
    }
    
    // Calculate the total efficiency of fixed employees
    const fixedEmployees = schedule.scheduleEmployee.filter(se => 
      se.employee.type === 'FIXED'
    );
    
    fixedEmployeesEfficiency = fixedEmployees.reduce((sum, se) => 
      sum + (se.efficiency || 0), 0);

    const scheduleInfo: ScheduleInfo = {
      id: schedule.id,
      date: schedule.date,
      status: schedule.status,
      fixedEmployeesEfficiency: fixedEmployeesEfficiency, // Add the required fixedEmployeesEfficiency
      remainingPackages: remainingPackages, // Add the required remainingPackages
      shift: schedule.shift ? {
        id: schedule.shift.id,
        status: schedule.shift.status,
        totalPackages: schedule.shift.totalPackages,
        completedCount: schedule.shift.package?.completedCount || 0,
      } : undefined,
      employees: schedule.scheduleEmployee.map(se => ({
        id: se.employee.id,
        name: se.employee.name,
        type: se.employee.type, // Add the employee type
        task: se.task!,
        efficiency: se.efficiency || 0,
        status: se.status,
        stowerEff: se.employee.stowerEff || 45,
        inductorEff: se.employee.inductorEff || 230,
        downstackerEff: se.employee.downstackerEff || 150,
      })),
      vet: schedule.vet[0] ? {
        id: schedule.vet[0].id,
        status: schedule.vet[0].status,
        targetPackageCount: schedule.vet[0].targetPackageCount,
        remainingCount: remainingCount, // Add the required remainingCount property
        openedAt: schedule.vet[0].openedAt,
        closedAt: schedule.vet[0].closedAt || undefined,
        scheduleId: schedule.vet[0].scheduleId,
      } : undefined,
    };

    return NextResponse.json({ data: scheduleInfo });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scheduleId = parseInt(params.id);
    
    // Check if the schedule exists
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Perform cascading delete in the correct order to handle foreign key constraints
    
    // 1. Delete VET records related to this schedule
    await prisma.vET.deleteMany({
      where: { scheduleId: scheduleId },
    });

    // 2. Delete schedule employee records
    await prisma.scheduleEmployee.deleteMany({
      where: { scheduleId: scheduleId },
    });

    // 3. Delete shift and package data if they exist
    if (schedule.id) {
      // Get the shift to access package ID
      const shift = await prisma.shift.findUnique({
        where: { id: schedule.id },
        select: { packageId: true }
      });

      // Delete package if it exists
      if (shift?.packageId) {
        await prisma.package.delete({
          where: { id: shift.packageId }
        });
      }

      // Delete shift
      await prisma.shift.delete({
        where: { id: schedule.id }
      });
    }

    // 4. Finally, delete the schedule itself
    await prisma.schedule.delete({
      where: { id: scheduleId }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Schedule and related data successfully deleted'
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to delete schedule. ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { 
      status: 500 
    });
  }
}