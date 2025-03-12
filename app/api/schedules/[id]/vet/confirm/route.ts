// app/api/schedules/[id]/vet/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { employeeId } = await request.json();
    
    // Ensure scheduleId is properly parsed
    const scheduleId = parseInt(params.id);
    
    if (isNaN(scheduleId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid schedule ID' },
        { status: 400 }
      );
    }

    // Validate employeeId
    if (!employeeId || isNaN(parseInt(employeeId))) {
      return NextResponse.json(
        { success: false, error: 'Invalid employee ID' },
        { status: 400 }
      );
    }

    return await prisma.$transaction(async (tx) => {
      // Get the schedule with VET
      const schedule = await tx.schedule.findUniqueOrThrow({
        where: { 
          id: scheduleId // Make sure this is provided and is a number
        },
        include: {
          vet: {
            where: { status: 'OPEN' },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      if (!schedule.vet || schedule.vet.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No active VET found for this schedule' },
          { status: 404 }
        );
      }

      const activeVet = schedule.vet[0];

      // Get employee efficiency
      const employee = await tx.employee.findUniqueOrThrow({
        where: { id: parseInt(employeeId) }
      });

      // Check if employee is already assigned to this schedule
      const existingAssignment = await tx.scheduleEmployee.findFirst({
        where: {
          scheduleId,
          employeeId: parseInt(employeeId)
        }
      });

      if (existingAssignment) {
        return NextResponse.json(
          { success: false, error: 'Employee is already assigned to this schedule' },
          { status: 400 }
        );
      }

      // Add employee to schedule
      await tx.scheduleEmployee.create({
        data: {
          scheduleId,
          employeeId: parseInt(employeeId),
          efficiency: employee.stowerEff,
          status: 'CONFIRMED'
        }
      });

      // Update remaining package count
      const remainingCount = Math.max(0, activeVet.targetPackageCount - employee.stowerEff);

      // If remaining count <= 50, close VET
      if (remainingCount <= 50) {
        await tx.vET.update({
          where: { id: activeVet.id },
          data: {
            status: 'CLOSED',
            closedAt: new Date(),
            targetPackageCount: remainingCount
          }
        });
      } else {
        await tx.vET.update({
          where: { id: activeVet.id },
          data: {
            targetPackageCount: remainingCount
          }
        });
      }

      // Get updated schedule info
      const updatedSchedule = await tx.schedule.findUnique({
        where: { id: scheduleId },
        include: {
          shift: {
            include: { package: true }
          },
          scheduleEmployee: {
            include: { employee: true }
          },
          vet: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      return NextResponse.json({ 
        success: true, 
        data: updatedSchedule,
        message: remainingCount <= 50 
          ? 'VET confirmed and closed as target has been met' 
          : 'VET confirmed successfully'
      });
    });
  } catch (error) {
    console.error('Error confirming VET:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('No active VET found')) {
        return NextResponse.json(
          { success: false, error: 'No active VET found for this schedule' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { success: false, error: 'The specified VET or employee record could not be found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to confirm VET. Please try again.' },
      { status: 500 }
    );
  }
}