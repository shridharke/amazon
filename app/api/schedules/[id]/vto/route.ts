// app/api/schedules/[id]/vto/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendVtoNotification } from '@/lib/email';
import { ScheduleStatus, VTOStatus, EmployeeScheduleStatus } from '@prisma/client';
import { APIResponse } from '@/types/schedule';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scheduleId = parseInt(params.id);
    const body = await req.json();
    const { organizationId } = body;

    console.log(`Creating VTO for schedule ${scheduleId}`);

    // Check if schedule exists
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        shift: true,
      }
    });

    if (!schedule) {
      return NextResponse.json({ 
        success: false,
        error: 'Schedule not found' 
      }, { status: 404 });
    }

    // Check if VTO already exists for this schedule
    const existingVto = await prisma.vTO.findFirst({
      where: { scheduleId: scheduleId }
    });

    if (existingVto) {
      return NextResponse.json({ 
        success: false,
        error: 'VTO already exists for this schedule' 
      }, { status: 400 });
    }

    // Create VTO
    const vto = await prisma.vTO.create({
      data: {
        scheduleId: scheduleId,
        status: 'OPEN',
        openedAt: new Date(),
      }
    });

    // Update schedule status
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { status: 'CONFIRMED' }
    });

    // Send VTO notifications to scheduled employees
    const scheduledEmployees = await prisma.scheduleEmployee.findMany({
      where: { 
        scheduleId: scheduleId,
        status: 'SCHEDULED' // Only notify employees who are currently scheduled
      },
      include: {
        employee: {
          select: { 
            id: true,
            email: true, 
            name: true, 
            type: true
          }
        }
      }
    });

    const employeeEmails = scheduledEmployees
      .map(se => se.employee.email)
      .filter(Boolean);
    
    console.log(`Sending VTO notifications to ${employeeEmails.length} scheduled employees`);

    // Send emails to eligible employees
    try {
      await sendVtoNotification(employeeEmails, {
        date: schedule.date.toISOString(),
        scheduleId: scheduleId
      });
      
      console.log('VTO notifications sent successfully');
    } catch (emailError) {
      console.warn('Failed to send VTO notifications:', emailError);
      // Continue execution even if emails fail
    }

    return NextResponse.json({ 
      success: true,
      data: vto
    });
  } catch (error) {
    console.error('Error creating VTO:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create VTO' 
    }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scheduleId = parseInt(params.id);
    const body = await req.json();
    const { action } = body;

    // Find the VTO for this schedule
    const vto = await prisma.vTO.findFirst({
      where: { scheduleId: scheduleId }
    });

    if (!vto) {
      return NextResponse.json({ 
        success: false,
        error: 'No VTO found for this schedule' 
      }, { status: 404 });
    }
    
    // Get the schedule for notifications and updates
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId }
    });
    
    if (!schedule) {
      return NextResponse.json({ 
        success: false,
        error: 'Schedule not found' 
      }, { status: 404 });
    }

    let updatedVto;
    
    // Handle different actions based on the action parameter
    if (action === 'reopen') {
      // Check if VTO is closed
      if (vto.status !== 'CLOSED') {
        return NextResponse.json({ 
          success: false,
          error: 'Cannot reopen a VTO that is not closed' 
        }, { status: 400 });
      }
      
      // Reopen the VTO - set status back to OPEN and reset closedAt field
      updatedVto = await prisma.vTO.update({
        where: {
          id: vto.id,
        },
        data: {
          status: 'OPEN',
          // Set closedAt to null as it's now open again
          closedAt: null
        }
      });
      
      // Update schedule status back to CONFIRMED
      await prisma.schedule.update({
        where: { id: scheduleId },
        data: { status: 'CONFIRMED' }
      });
      
      // Send VTO reopening notifications to eligible employees
      const scheduledEmployees = await prisma.scheduleEmployee.findMany({
        where: { 
          scheduleId: scheduleId,
          status: 'SCHEDULED'
        },
        include: {
          employee: {
            select: { 
              id: true,
              email: true, 
              name: true, 
              type: true
            }
          }
        }
      });
      
      const employeeEmails = scheduledEmployees
        .map(se => se.employee.email)
        .filter(Boolean);
      
      console.log(`Sending VTO reopening notifications to ${employeeEmails.length} employees`);
      
      // Send emails about the reopened VTO
      try {
        await sendVtoNotification(employeeEmails, {
          date: schedule.date.toISOString(),
          scheduleId: scheduleId,
          isReopened: true
        });
        
        console.log('VTO reopening notifications sent successfully');
      } catch (emailError) {
        console.warn('Failed to send VTO reopening notifications:', emailError);
        // Continue execution even if emails fail
      }
      
      console.log(`Reopened VTO for schedule ${scheduleId}`);
    } else if (action === 'close') {
      // Check if VTO is already closed
      if (vto.status === 'CLOSED') {
        return NextResponse.json({ 
          success: false,
          error: 'VTO is already closed' 
        }, { status: 400 });
      }
      
      // Close the VTO
      updatedVto = await prisma.vTO.update({
        where: {
          id: vto.id,
        },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
        }
      });
      
      // Update schedule status to indicate VTO is no longer active
      await prisma.schedule.update({
        where: { id: scheduleId },
        data: { status: 'IN_PROGRESS' }
      });
      
      // Notify employees that VTO is no longer available
      const scheduledEmployees = await prisma.scheduleEmployee.findMany({
        where: {
          scheduleId: scheduleId,
          status: 'SCHEDULED'
        },
        include: {
          employee: {
            select: { email: true, name: true }
          }
        }
      });
      
      const employeeEmails = scheduledEmployees
        .map(se => se.employee.email)
        .filter(Boolean);
      
      if (employeeEmails.length > 0) {
        try {
          // Send closure notifications
          await sendVtoNotification(employeeEmails, {
            date: schedule.date.toISOString(),
            scheduleId: scheduleId,
            isClosed: true
          });
          
          console.log('VTO closure notifications sent successfully');
        } catch (emailError) {
          console.warn('Failed to send VTO closure notifications:', emailError);
        }
      }
      
      console.log(`Closed VTO for schedule ${scheduleId}`);
    } else if (action === 'complete') {
      // Complete the VTO
      updatedVto = await prisma.vTO.update({
        where: {
          id: vto.id,
        },
        data: {
          status: 'COMPLETED'
        }
      });
      
      console.log(`Completed VTO for schedule ${scheduleId}`);
    } else {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid action specified' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      data: updatedVto 
    });
  } catch (error) {
    console.error('Error updating VTO:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update VTO' 
    }, { status: 500 });
  }
}