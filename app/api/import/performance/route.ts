// app/api/import/performance/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { parse } from "papaparse";

export const POST = auth(async (request) => {
  console.log("Starting performance data import process");
  
  if (!request.auth) {
    console.log("Authentication failed");
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  
  try {
    console.log("Authentication successful, processing request");
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const organizationId = formData.get("organizationId") as string;
    
    console.log(`Received request with organizationId: ${organizationId}, file: ${file?.name || 'No file'}`);
    
    if (!file || !organizationId) {
      console.log("Missing required fields", { file: !!file, organizationId: !!organizationId });
      return NextResponse.json(
        { message: "File and organization ID are required" },
        { status: 400 }
      );
    }
    
    // Convert file to text
    const text = await file.text();
    console.log(`File content length: ${text.length} characters`);
    
    // Parse CSV content
    const { data } = parse(text, { 
      header: true, 
      skipEmptyLines: true,
      dynamicTyping: true  // Automatically convert numbers and booleans
    });
    
    console.log(`Successfully parsed CSV with ${data.length} rows`);
    console.log("Sample data:", data.slice(0, 2)); // Log first two rows for debugging
    
    // Process and insert the data
    console.log(`Starting data processing for organization ID: ${organizationId}`);
    const result = await processPerformanceData(data, parseInt(organizationId));
    
    console.log("Performance data processed with results:", result);
    
    // Update employee efficiencies based on imported data
    console.log("Starting efficiency updates");
    const efficiencyStats = await updateEmployeeEfficiencies(parseInt(organizationId));
    
    console.log("Efficiency updates completed:", efficiencyStats);
    
    return NextResponse.json({
      message: "Performance data imported successfully",
      stats: { efficiencyUpdates: efficiencyStats }
    }, { status: 200 });
  } catch (error) {
    console.error("Failed to import performance data:", error);
    return NextResponse.json(
      { message: "Failed to import data", details: error },
      { status: 500 }
    );
  }
});

async function processPerformanceData(data: any[], organizationId: number) {
  console.log(`Processing ${data.length} performance records for organization ${organizationId}`);
  
  // Keep track of statistics
  const stats = {
    totalRecords: data.length,
    processedRecords: 0,
    createdShifts: 0,
    createdSchedules: 0,
    createdPackages: 0,
    createdPerformanceRecords: 0,
    errors: 0,
    errorDetails: [] as string[]
  };
  
  // Group data by date to process each day
  const groupedByDate = new Map();
  
  for (const row of data) {
    const dateStr = row.Date;
    if (!groupedByDate.has(dateStr)) {
      groupedByDate.set(dateStr, []);
    }
    groupedByDate.get(dateStr).push(row);
  }
  
  console.log(`Grouped data by date: ${groupedByDate.size} unique dates found`);
  
  // Process each date using Array.from to avoid iterator issues
  const dateKeys = Array.from(groupedByDate.keys());
  
  for (const dateStr of dateKeys) {
    console.log(`Processing date: ${dateStr}`);
    try {
      const records = groupedByDate.get(dateStr);
      const date = new Date(dateStr);
      const dayOfWeek = records[0].Day;
      const totalPackages = records[0]["Total Packages"]; // Assuming it's the same for all records on this day
      
      console.log(`Date ${dateStr}: Processing ${records.length} records, Total Packages: ${totalPackages}`);
      
      // Create or find Package for this date
      console.log(`Creating/updating package for date ${dateStr}`);
      const package_ = await prisma.package.upsert({
        where: {
          organizationId_date: {
            organizationId,
            date
          }
        },
        update: {
          totalCount: totalPackages,
          completedCount: totalPackages, // Historical data is completed
          status: "COMPLETED"
        },
        create: {
          date,
          organizationId,
          totalCount: totalPackages,
          completedCount: totalPackages,
          status: "COMPLETED"
        }
      });
      console.log(`Package created/updated with ID: ${package_.id}`);
      stats.createdPackages++;
      
      // Create or find Schedule for this date
      console.log(`Creating/updating schedule for date ${dateStr}`);
      const schedule = await prisma.schedule.upsert({
        where: {
          organizationId_date: {
            organizationId,
            date
          }
        },
        update: {
          status: "COMPLETED",
          calculatedAt: new Date(),
          confirmedAt: new Date(),
          closedAt: new Date()
        },
        create: {
          date,
          organizationId,
          status: "COMPLETED",
          calculatedAt: new Date(),
          confirmedAt: new Date(),
          closedAt: new Date()
        }
      });
      console.log(`Schedule created/updated with ID: ${schedule.id}`);
      stats.createdSchedules++;
      
      // Create Shift for this date
      console.log(`Creating/updating shift for date ${dateStr}`);
      const shift = await prisma.shift.upsert({
        where: {
          scheduleId: schedule.id
        },
        update: {
          packageId: package_.id,
          date,
          dayOfWeek,
          totalPackages,
          status: "COMPLETED",
          startTime: new Date(new Date(date).setHours(9, 0, 0)), // Assuming 9 AM start
          endTime: new Date(new Date(date).setHours(14, 0, 0))   // Assuming 5 hours later
        },
        create: {
          scheduleId: schedule.id,
          packageId: package_.id,
          organizationId,
          date,
          dayOfWeek,
          totalPackages,
          status: "COMPLETED",
          startTime: new Date(new Date(date).setHours(9, 0, 0)),
          endTime: new Date(new Date(date).setHours(14, 0, 0))
        }
      });
      console.log(`Shift created/updated with ID: ${shift.id}`);
      stats.createdShifts++;
      
      // Process each employee's record for this date
      console.log(`Processing ${records.length} employee records for date ${dateStr}`);
      for (const record of records) {
        try {
          const employeeId = record["Employee ID"];
          let role = record.Role;
          const packagesHandled = record["Packages Handled"];
          const workingHours = record.working_hours || 5;
          
          console.log(`Processing record for Employee ID: ${employeeId}, Role: ${role}, Packages: ${packagesHandled}`);
          
          // Convert role to enum format
          role = role.toUpperCase();
          if (!["INDUCTOR", "DOWNSTACKER", "STOWER"].includes(role)) {
            console.warn(`Invalid role ${role} for employee ${employeeId} on date ${dateStr}`);
            stats.errorDetails.push(`Invalid role ${role} for employee ${employeeId} on date ${dateStr}`);
            stats.errors++;
            continue;
          }
          
          // Find or create employee
          console.log(`Finding or creating employee with ID: ${employeeId}`);
          const employee = await findOrCreateEmployee(employeeId, organizationId);
          
          if (!employee) {
            console.error(`Failed to find or create employee ${employeeId} for date ${dateStr}`);
            stats.errorDetails.push(`Failed to find or create employee ${employeeId} for date ${dateStr}`);
            stats.errors++;
            continue;
          }
          
          console.log(`Employee found/created with ID: ${employee.id}, Name: ${employee.name}`);
          
          // Create or update ScheduleEmployee
          console.log(`Creating/updating schedule employee for Employee ID: ${employee.id}`);
          const scheduleEmployee = await prisma.scheduleEmployee.upsert({
            where: {
              scheduleId_employeeId: {
                scheduleId: schedule.id,
                employeeId: employee.id
              }
            },
            update: {
              task: role as any, // Type casting to EmployeeTask enum
              status: "CONFIRMED",
              efficiency: packagesHandled
            },
            create: {
              scheduleId: schedule.id,
              employeeId: employee.id,
              task: role as any, // Type casting to EmployeeTask enum
              status: "CONFIRMED",
              efficiency: packagesHandled
            }
          });
          console.log(`Schedule employee created/updated with ID: ${scheduleEmployee.id}`);
          
          // Create PerformanceRecord
          console.log(`Creating/updating performance record for Employee ID: ${employee.id}`);
          const performanceRecord = await prisma.performanceRecord.upsert({
            where: {
              shiftId_employeeId: {
                shiftId: shift.id,
                employeeId: employee.id
              }
            },
            update: {
              task: role as any,
              packagesHandled,
              workingHours,
              date,
              dayOfWeek,
              totalPackages
            },
            create: {
              shiftId: shift.id,
              employeeId: employee.id,
              scheduleEmployeeId: scheduleEmployee.id,
              organizationId,
              task: role as any,
              packagesHandled,
              workingHours,
              date,
              dayOfWeek,
              totalPackages
            }
          });
          console.log(`Performance record created/updated with ID: ${performanceRecord.id}`);
          
          stats.createdPerformanceRecords++;
          stats.processedRecords++;
        } catch (error) {
          console.error(`Error processing record:`, record, error);
          stats.errorDetails.push(`Error processing record: ${JSON.stringify(record)}: ${error}`);
          stats.errors++;
        }
      }
    } catch (error) {
      console.error(`Error processing date ${dateStr}:`, error);
      stats.errorDetails.push(`Error processing date ${dateStr}: ${error}`);
      stats.errors++;
    }
  }
  
  console.log("Performance data processing completed with stats:", stats);
  return stats;
}

async function findOrCreateEmployee(employeeId: number, organizationId: number) {
  console.log(`Finding or creating employee ${employeeId} for organization ${organizationId}`);
  try {
    // Try to find the employee first
    let employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        organizationId
      }
    });
    
    console.log(`Employee search result:`, employee ? `Found employee ${employee.id}` : 'Employee not found');
    
    // If not found, create a placeholder employee
    if (!employee) {
      // Generate a unique email address
      const email = `employee${employeeId}_org${organizationId}@example.com`;
      console.log(`Creating new employee with email: ${email}`);
      
      employee = await prisma.employee.create({
        data: {
          name: `Employee ${employeeId}`,
          email: email,
          type: "FIXED", // Default to FIXED
          organizationId,
          // Default efficiency values will be used
        }
      });
      console.log(`Created new employee with ID: ${employee.id}`);
    }
    
    return employee;
  } catch (error) {
    console.error(`Error finding/creating employee ${employeeId}:`, error);
    return null;
  }
}

async function updateEmployeeEfficiencies(organizationId: number) {
  console.log(`Updating efficiencies for employees in organization ${organizationId}`);
  const stats = {
    employeesUpdated: 0,
    errors: 0,
    errorDetails: [] as string[]
  };
  
  try {
    // Get all employees for this organization
    const employees = await prisma.employee.findMany({
      where: {
        organizationId,
        isActive: true
      }
    });
    
    console.log(`Found ${employees.length} active employees for efficiency updates`);
    
    for (const employee of employees) {
      console.log(`Updating efficiency metrics for employee ${employee.id} (${employee.name})`);
      try {
        // Calculate average efficiency for each task type
        const inductorRecords = await prisma.performanceRecord.findMany({
          where: {
            employeeId: employee.id,
            task: "INDUCTOR"
          }
        });
        
        const stowerRecords = await prisma.performanceRecord.findMany({
          where: {
            employeeId: employee.id,
            task: "STOWER"
          }
        });
        
        const downstackerRecords = await prisma.performanceRecord.findMany({
          where: {
            employeeId: employee.id,
            task: "DOWNSTACKER"
          }
        });
        
        console.log(`Employee ${employee.id} records: Inductor: ${inductorRecords.length}, Stower: ${stowerRecords.length}, Downstacker: ${downstackerRecords.length}`);
        
        // Calculate average efficiency for each role
        const inductorEff = inductorRecords.length > 0
          ? inductorRecords.reduce((sum, record) => sum + record.packagesHandled, 0) / inductorRecords.length
          : employee.inductorEff; // Keep existing if no records
          
        const stowerEff = stowerRecords.length > 0
          ? stowerRecords.reduce((sum, record) => sum + record.packagesHandled, 0) / stowerRecords.length
          : employee.stowerEff;
          
        const downstackerEff = downstackerRecords.length > 0
          ? downstackerRecords.reduce((sum, record) => sum + record.packagesHandled, 0) / downstackerRecords.length
          : employee.downstackerEff;
          
        // Calculate overall average
        const allRecords = [...inductorRecords, ...stowerRecords, ...downstackerRecords];
        const avgEff = allRecords.length > 0
          ? allRecords.reduce((sum, record) => sum + record.packagesHandled, 0) / allRecords.length
          : employee.avgEfficiency;
        
        console.log(`Calculated efficiencies for ${employee.id}: Inductor: ${inductorEff}, Stower: ${stowerEff}, Downstacker: ${downstackerEff}, Average: ${avgEff}`);
          
        const stowerEffFinal = stowerEff / 5;
        const inductorEffFinal = inductorEff / 5;
        const downstackerEffFinal = downstackerEff / 5;
        const avgEffFinal = avgEff / 5;

        // Update employee
        await prisma.employee.update({
          where: {
            id: employee.id
          },
          data: {
            inductorEff: inductorEffFinal,
            stowerEff: stowerEffFinal,
            downstackerEff: downstackerEffFinal,
            avgEfficiency: avgEffFinal
          }
        });
        
        console.log(`Updated efficiency metrics for employee ${employee.id}`);
        stats.employeesUpdated++;
      } catch (error) {
        console.error(`Error updating efficiency for employee ${employee.id}:`, error);
        stats.errorDetails.push(`Error updating efficiency for employee ${employee.id}: ${error}`);
        stats.errors++;
      }
    }
    
    console.log(`Completed efficiency updates for ${stats.employeesUpdated} employees with ${stats.errors} errors`);
    return stats;
  } catch (error) {
    console.error("Error updating employee efficiencies:", error);
    stats.errorDetails.push(`General error updating efficiencies: ${error}`);
    stats.errors++;
    return stats;
  }
}