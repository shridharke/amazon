// app/api/schedules/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendVetNotification } from '@/lib/email';
import { ScheduleStatus, VETStatus, ShiftStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const organizationId = parseInt(searchParams.get('organizationId') || '1');

    const schedules = await prisma.schedule.findMany({
      where: {
        organizationId,
        date: {
          gte: new Date(startDate!),
          lte: new Date(endDate!),
        },
      },
      include: {
        shift: {
          include: { package: true }
        },
        vet: true
      },
    });

    const calendarEvents = schedules.map(schedule => ({
      id: schedule.id.toString(),
      title: `Packages: ${schedule.shift?.package?.completedCount || 0}/${schedule.shift?.totalPackages || 0}`,
      start: schedule.date,
      end: schedule.date,
      allDay: true,
      className: `schedule-${schedule.status.toLowerCase()}`,
      extendedProps: {
        scheduleId: schedule.id,
        status: schedule.status,
        totalPackages: schedule.shift?.totalPackages || 0,
        completedPackages: schedule.shift?.package?.completedCount || 0,
        hasActiveVet: schedule.vet?.some(v => v.status === 'OPEN') || false
      }
    }));

    return NextResponse.json({ success: true, data: calendarEvents });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch schedules' }, { status: 500 });
  }
}

function getDayName(date: Date) {
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return days[new Date(date).getDay()];
}

// app/api/schedules/route.ts - Updated POST method
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, packageCount, organizationId } = body;

    const fixedEmployees = await prisma.employee.findMany({
      where: {
        organizationId,
        type: 'FIXED',
        workDays: {
          contains: getDayName(date)
        }
      }
    });

    const totalFixedEfficiency = fixedEmployees.reduce((sum, emp) => sum + emp.stowerEff, 0);
    const remainingPackages = Math.max(0, packageCount - totalFixedEfficiency);

    // Create schedule with all relations (but NO VET yet)
    const schedule = await prisma.$transaction(async (tx) => {
      // Create package
      const pkg = await tx.package.create({
        data: {
          date: new Date(date),
          totalCount: packageCount,
          organizationId,
          status: 'SCHEDULED'
        }
      });

      // Create schedule with shift and fixed employees
      const schedule = await tx.schedule.create({
        data: {
          date: new Date(date),
          organizationId,
          status: 'DRAFT',
          shift: {
            create: {
              organizationId,
              date: new Date(date),
              dayOfWeek: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
              startTime: new Date(date),
              totalPackages: packageCount,
              status: 'SCHEDULED',
              packageId: pkg.id
            }
          },
          scheduleEmployee: {
            create: fixedEmployees.map(emp => ({
              employeeId: emp.id,
              efficiency: emp.stowerEff,
              status: 'SCHEDULED'
            }))
          }
        },
        include: {
          shift: {
            include: { package: true }
          },
          scheduleEmployee: {
            include: { employee: true }
          }
        }
      });

      // Note: We removed the VET creation here to allow manual creation via the Start VET button

      return schedule;
    });

    // Format the employees data for the response
    const formattedEmployees = schedule.scheduleEmployee.map(assignment => ({
      id: assignment.employee.id,
      name: assignment.employee.name,
      type: assignment.employee.type,
      efficiency: assignment.employee.stowerEff,
      task: assignment.task
    }));

    return NextResponse.json({ 
      success: true, 
      data: {
        ...schedule,
        employees: formattedEmployees,
        fixedEmployeesEfficiency: totalFixedEfficiency,
        remainingPackages
      }
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json({ success: false, error: 'Failed to create schedule' }, { status: 500 });
  }
}