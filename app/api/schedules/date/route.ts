
// app/api/schedules/date/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const organizationId = parseInt(searchParams.get('organizationId') || '1');

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Parse date as UTC to avoid timezone issues
    const queryDate = new Date(date);
    // Set time to start of day
    queryDate.setUTCHours(0, 0, 0, 0);
    
    // Calculate end of day
    const endDate = new Date(queryDate);
    endDate.setUTCHours(23, 59, 59, 999);

    console.log(`Searching for schedule between ${queryDate.toISOString()} and ${endDate.toISOString()}`);

    const schedule = await prisma.schedule.findFirst({
      where: {
        organizationId,
        date: {
          gte: queryDate,
          lte: endDate,
        },
      },
      include: {
        shift: {
          include: { 
            package: true 
          }
        },
        vet: true,
        scheduleEmployee: {
          include: {
            employee: true
          }
        }
      },
    });

    if (!schedule) {
      return NextResponse.json({ 
        success: false, 
        message: 'No schedule found for the specified date' 
      });
    }

    // Format the employees data for the response
    const formattedEmployees = schedule.scheduleEmployee.map(assignment => ({
      id: assignment.employee.id,
      name: assignment.employee.name,
      type: assignment.employee.type,
      task: assignment.task,
      efficiency: assignment.efficiency || 1.0,
      status: assignment.status,
      avgEfficiency: assignment.employee.avgEfficiency || 1.0,
      inductorEff: assignment.employee.inductorEff || 1.0,
      stowerEff: assignment.employee.stowerEff || 1.0,
      downstackerEff: assignment.employee.downstackerEff || 1.0
    }));

    // Calculate fixed employee efficiency (sum of all fixed employees' efficiency)
    const fixedEmployeesEfficiency = formattedEmployees
      .filter(emp => emp.type === 'FIXED')
      .reduce((sum, emp) => sum + (emp.efficiency || 1.0), 0);

    // Calculate remaining packages (total packages - fixed efficiency)
    const totalPackages = schedule.shift?.totalPackages || 0;
    const remainingPackages = Math.max(0, totalPackages - fixedEmployeesEfficiency);

    const formattedSchedule = {
      id: schedule.id,
      date: schedule.date.toISOString(),
      status: schedule.status,
      employees: formattedEmployees,
      shift: schedule.shift ? {
        id: schedule.shift.id,
        status: schedule.shift.status,
        totalPackages: schedule.shift.totalPackages,
        completedCount: schedule.shift.package?.completedCount || 0
      } : undefined,
      vet: schedule.vet && schedule.vet.length > 0 ? {
        id: schedule.vet[0].id,
        status: schedule.vet[0].status,
        targetPackageCount: schedule.vet[0].targetPackageCount,
        openedAt: schedule.vet[0].openedAt.toISOString(),
        closedAt: schedule.vet[0].closedAt?.toISOString(),
        scheduleId: schedule.vet[0].scheduleId
      } : undefined,
      fixedEmployeesEfficiency,
      remainingPackages
    };

    return NextResponse.json({ success: true, data: formattedSchedule });
  } catch (error) {
    console.error('Error fetching schedule by date:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}