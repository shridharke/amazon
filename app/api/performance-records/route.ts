// app/api/performance-records/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EmployeeTask } from '@prisma/client';

// Performance record request type
interface PerformanceRequest {
  date: string;
  comparisonType: 'overall' | 'employee' | 'taskType';
  selectedEntity?: string;
  entries: { hours: number; packages: number }[];
  totalHours: number;
  totalPackages: number;
  efficiencyRate: number;
  efficiencyPercentage: number;
  scheduleId?: number;
}

export async function POST(request: NextRequest) {
  try {
    const data: PerformanceRequest = await request.json();
    
    // Validate date
    const date = new Date(data.date);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }
    
    // Get organization ID (assuming first org for now, but you'd normally get this from session)
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }
    
    const orgId = organization.id;
    
    // Find the schedule for this date if not provided
    let scheduleId = data.scheduleId;
    
    if (!scheduleId) {
      const schedule = await prisma.schedule.findFirst({
        where: {
          organizationId: orgId,
          date: {
            gte: new Date(date.setHours(0, 0, 0, 0)),
            lte: new Date(date.setHours(23, 59, 59, 999))
          }
        }
      });
      
      if (!schedule) {
        return NextResponse.json(
          { error: 'No schedule found for this date' }, 
          { status: 404 }
        );
      }
      
      scheduleId = schedule.id;
    }
    
    // Get the schedule
    const schedule = await prisma.schedule.findUnique({
      where: {
        id: scheduleId
      },
      include: {
        scheduleEmployee: true
      }
    });
    
    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' }, 
        { status: 404 }
      );
    }
    
    // Find or create a shift for this schedule
    let shift = await prisma.shift.findUnique({
      where: {
        scheduleId: schedule.id
      }
    });
    
    if (!shift) {
      // Get the day of week
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = days[date.getDay()];
      
      // Create a new shift
      shift = await prisma.shift.create({
        data: {
          scheduleId: schedule.id,
          organizationId: orgId,
          date,
          dayOfWeek,
          startTime: new Date(),
          totalPackages: data.totalPackages,
          status: 'IN_PROGRESS'
        }
      });
    }
    
    // Prepare for creating performance records
    let employeeId: number | null = null;
    let task: EmployeeTask | null = null;
    
    // Determine employee and task based on comparison type
    if (data.comparisonType === 'employee' && data.selectedEntity) {
      employeeId = parseInt(data.selectedEntity);
      
      // Find the employee's task from the schedule
      const scheduleEmployee = schedule.scheduleEmployee.find(se => se.employeeId === employeeId);
      
      if (scheduleEmployee?.task) {
        task = scheduleEmployee.task;
      }
    } else if (data.comparisonType === 'taskType' && data.selectedEntity) {
      task = data.selectedEntity as EmployeeTask;
    }
    
    // Determine which employees to update or create records for
    let scheduleEmployeesToProcess: any[] = [];
    
    if (data.comparisonType === 'overall') {
      // Process all employees with assigned tasks
      scheduleEmployeesToProcess = schedule.scheduleEmployee.filter(se => se.task !== null);
    } else if (employeeId) {
      // Process just the selected employee
      scheduleEmployeesToProcess = schedule.scheduleEmployee.filter(se => se.employeeId === employeeId);
    } else if (task) {
      // Process all employees with the selected task
      scheduleEmployeesToProcess = schedule.scheduleEmployee.filter(se => se.task === task);
    }
    
    // For each relevant schedule employee, create or update a performance record
    const updatedRecords = [];
    
    for (const se of scheduleEmployeesToProcess) {
      if (!se.task) continue; // Skip employees without assigned tasks
      
      // Check if a performance record already exists
      const existingRecord = await prisma.performanceRecord.findFirst({
        where: {
          shiftId: shift.id,
          employeeId: se.employeeId
        }
      });
      
      if (existingRecord) {
        // Update existing record
        const updated = await prisma.performanceRecord.update({
          where: {
            id: existingRecord.id
          },
          data: {
            packagesHandled: data.totalPackages,
            workingHours: Math.round(data.totalHours),
            totalPackages: data.totalPackages
          }
        });
        updatedRecords.push(updated);
      } else {
        // Create new record
        const created = await prisma.performanceRecord.create({
          data: {
            shiftId: shift.id,
            employeeId: se.employeeId,
            scheduleEmployeeId: se.id,
            organizationId: orgId,
            task: se.task,
            packagesHandled: data.totalPackages,
            workingHours: Math.round(data.totalHours),
            date,
            dayOfWeek: shift.dayOfWeek,
            totalPackages: data.totalPackages
          }
        });
        updatedRecords.push(created);
      }
    }
    
    // If a package exists for this shift, update its completedCount
    if (shift.packageId) {
      await prisma.package.update({
        where: {
          id: shift.packageId
        },
        data: {
          completedCount: data.totalPackages
        }
      });
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Updated performance records for ${updatedRecords.length} employees`,
      data: updatedRecords
    });
  } catch (error) {
    console.error('Error in performance-records API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    const employeeIdParam = searchParams.get('employeeId');
    const taskParam = searchParams.get('task');
    
    // Get organization ID (assuming first org for now, but you'd normally get this from session)
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }
    
    const orgId = organization.id;
    
    // Build query
    const query: any = {
      organizationId: orgId
    };
    
    if (dateParam) {
      const date = new Date(dateParam);
      if (!isNaN(date.getTime())) {
        // Match records for the entire day
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        query.date = {
          gte: startDate,
          lte: endDate
        };
      }
    }
    
    if (employeeIdParam) {
      query.employeeId = parseInt(employeeIdParam);
    }
    
    if (taskParam) {
      query.task = taskParam;
    }
    
    // Get performance records
    const records = await prisma.performanceRecord.findMany({
      where: query,
      include: {
        employee: true,
        shift: true,
        scheduleEmployee: true
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    // Format records for response
    const formattedRecords = records.map(record => ({
      id: record.id,
      employeeId: record.employeeId,
      employeeName: record.employee.name,
      task: record.task,
      packagesHandled: record.packagesHandled,
      workingHours: record.workingHours,
      date: record.date.toISOString(),
      dayOfWeek: record.dayOfWeek,
      efficiency: record.scheduleEmployee.efficiency,
      shiftStatus: record.shift.status
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedRecords
    });
  } catch (error) {
    console.error('Error in performance-records API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}