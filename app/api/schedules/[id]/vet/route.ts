// app/api/schedules/[id]/vet/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendVetNotification } from '@/lib/email';
import { ScheduleStatus, VETStatus, ShiftStatus } from '@prisma/client';
import { APIResponse, ScheduleInfo, CreateScheduleRequest, VETActionRequest } from '@/types/schedule';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scheduleId = parseInt(params.id);
    const body: VETActionRequest = await req.json();
    const { targetPackageCount } = body;

    console.log(`Creating VET for schedule ${scheduleId} with targetPackageCount: ${targetPackageCount}`);

    if (!targetPackageCount) {
      return NextResponse.json({ 
        success: false,
        error: 'Target package count is required' 
      }, { status: 400 });
    }

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

    // Check if VET already exists for this schedule
    const existingVet = await prisma.vET.findFirst({
      where: { scheduleId: scheduleId }
    });

    if (existingVet) {
      return NextResponse.json({ 
        success: false,
        error: 'VET already exists for this schedule' 
      }, { status: 400 });
    }

    // Create VET with the provided target count
    const vet = await prisma.vET.create({
      data: {
        scheduleId: scheduleId,
        status: 'OPEN',
        targetPackageCount: targetPackageCount,
        openedAt: new Date(),
      }
    });

    // Update schedule status
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { status: 'CONFIRMED' }
    });

    // Send VET notifications to ALL employees (both fixed and flex)
    const allEmployees = await prisma.employee.findMany({
      where: { 
        organizationId: schedule.organizationId,
        isActive: true
      },
      select: { email: true, name: true, type: true }
    });

    // Split employees by type for logging purposes
    const fixedEmployees = allEmployees.filter(emp => emp.type === 'FIXED');
    const flexEmployees = allEmployees.filter(emp => emp.type === 'FLEX');
    
    console.log(`Sending VET notifications to ${fixedEmployees.length} fixed employees and ${flexEmployees.length} flex employees`);

    // Send emails to all employees
    try {
      await sendVetNotification(allEmployees.map(e => e.email), {
        date: schedule.date.toISOString(),
        packages: targetPackageCount,
        scheduleId: scheduleId
      });
      
      console.log('VET notifications sent successfully');
    } catch (emailError) {
      console.warn('Failed to send VET notifications:', emailError);
      // Continue execution even if emails fail
    }

    return NextResponse.json({ 
      success: true,
      data: vet
    });
  } catch (error) {
    console.error('Error creating VET:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create VET' 
    }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scheduleId = parseInt(params.id);

    // Find the VET for this schedule
    const vet = await prisma.vET.findFirst({
      where: { 
        scheduleId: scheduleId,
        status: 'OPEN'
      }
    });

    if (!vet) {
      return NextResponse.json({ 
        success: false,
        error: 'No open VET found for this schedule' 
      }, { status: 404 });
    }

    // Close the VET
    const updatedVet = await prisma.vET.update({
      where: {
        id: vet.id,
      },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      }
    });

    // Update schedule status
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { status: 'IN_PROGRESS' }
    });

    return NextResponse.json({ 
      success: true,
      data: updatedVet 
    });
  } catch (error) {
    console.error('Error closing VET:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to close VET' 
    }, { status: 500 });
  }
}