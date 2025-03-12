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