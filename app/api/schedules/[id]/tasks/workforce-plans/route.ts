// app/api/schedules/[id]/tasks/workforce-plans/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface EmployeeAssignment {
    "Employee ID": number;
    "Times Worked (Last 30 Days)": number;
  }
  
  // Interface for a complete workforce plan
  interface WorkforcePlan {
    Inductor: EmployeeAssignment[];
    Downstackers: EmployeeAssignment[];
    Stowers: EmployeeAssignment[];
  }

// GET /api/schedules/[id]/tasks/workforce-plans
export const GET = auth(async (request, { params }) => {
  if (!request.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    let scheduleId = params?.id;

    if (!scheduleId) {
      return NextResponse.json(
        { message: "Schedule ID is required" },
        { status: 400 }
      );
    }

    if (Array.isArray(scheduleId)) {
      scheduleId = scheduleId[0];
    }
    const id = parseInt(scheduleId);

    // Get schedule with employees to verify access
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        organization: {
          include: {
            users: {
              where: {
                id: request.auth.user?.id
              }
            }
          }
        },
        scheduleEmployee: {
          include: {
            employee: true
          }
        },
        shift: true
      }
    });

    if (!schedule) {
      return NextResponse.json(
        { message: "Schedule not found" },
        { status: 404 }
      );
    }

    // Verify user has access to this organization
    if (schedule.organization.users.length === 0) {
      return NextResponse.json(
        { message: "You don't have access to this schedule" },
        { status: 403 }
      );
    }

    // In this implementation we'll generate the plans in JavaScript
    // In a production environment, you would call a Python service
    // that implements the provided algorithm
    
    // Get all employees scheduled for this day
    const employees = schedule.scheduleEmployee.map(se => ({
      id: se.employeeId,
      name: se.employee.name,
      type: se.employee.type,
      inductorEff: se.employee.inductorEff || 1.0,
      downstackerEff: se.employee.downstackerEff || 1.0, 
      stowerEff: se.employee.stowerEff || 1.0
    }));
    
    // Fetch historical performance data
    // In a real implementation, this would be actual historical data
    // Here we'll simulate it with random values
    const performanceData = await generateSimulatedPerformanceData(employees.map(e => e.id));

    // Create workforce plans using the JavaScript implementation of the algorithm
    const workforcePlans = generateWorkforcePlans(employees, performanceData, schedule.date);

    return NextResponse.json({
      message: "Workforce plans generated successfully",
      data: workforcePlans
    });
  } catch (error) {
    console.error("Failed to generate workforce plans:", error);
    return NextResponse.json(
      {
        message: "Failed to generate workforce plans",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
});

// Function to generate simulated historical performance data
async function generateSimulatedPerformanceData(employeeIds: number[]) {
  // In a real implementation, this would fetch actual performance records
  // For this demo, we'll generate random data
  
  const performanceData: any[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90); // Last 90 days
  
  const roles = ["Inductor", "Downstacker", "Stower"];
  
  // Generate random performance records for each employee
  for (const employeeId of employeeIds) {
    // For each employee, create 20-40 random performance records
    const recordCount = Math.floor(Math.random() * 20) + 20;
    
    for (let i = 0; i < recordCount; i++) {
      const recordDate = new Date(startDate);
      recordDate.setDate(recordDate.getDate() + Math.floor(Math.random() * 90));
      
      const role = roles[Math.floor(Math.random() * roles.length)];
      const efficiency = (Math.random() * 1.5) + 0.5; // Random efficiency between 0.5 and 2.0
      
      performanceData.push({
        "Employee ID": employeeId,
        "Date": recordDate,
        "Role": role,
        "Packages Handled": Math.floor(Math.random() * 100) + 50,
        "working_hours": 5,
        "Efficiency": efficiency
      });
    }
  }
  
  return performanceData;
}

function calculateRequiredWorkers(totalEmployees: number) {
    // Always 1 inductor
    const inductorCount = 1;
    
    // Calculate stowers and downstackers based on the remaining employees
    const remainingEmployees = totalEmployees - inductorCount;
    
    // Calculate downstackers: 1 per 4 stowers
    // First, estimate stowers as remaining employees - 1 (assuming at least 1 downstacker)
    let stowerCount = remainingEmployees - 1;
    let downstackerCount = Math.ceil(stowerCount / 4);
    
    // Recalculate stowers based on the calculated downstackers
    stowerCount = remainingEmployees - downstackerCount;
    
    // Ensure we have at least 1 downstacker if there are stowers
    if (stowerCount > 0 && downstackerCount < 1) {
      downstackerCount = 1;
      stowerCount = remainingEmployees - downstackerCount;
    }
    
    return {
      inductorCount,
      downstackerCount,
      stowerCount
    };
  }
  

// Function to generate workforce plans (JavaScript implementation of the Python algorithm)
function generateWorkforcePlans(employees: any[], performanceData: any[], allocationDate: Date) {
    // Calculate how many workers we need in each role
    const { inductorCount, downstackerCount, stowerCount } = calculateRequiredWorkers(employees.length);
    
    // Initialize employee efficiency records based on their stored efficiency values
    const employeeRoleEfficiency: Record<number, Record<string, number>> = {};
    employees.forEach(emp => {
      employeeRoleEfficiency[emp.id] = {
        "Inductor": emp.inductorEff,
        "Downstacker": emp.downstackerEff,
        "Stower": emp.stowerEff
      };
    });
    
    // Sort employees by their efficiency in each role
    const sortedByInductor = [...employees].sort((a, b) => {
      return employeeRoleEfficiency[b.id]["Inductor"] - employeeRoleEfficiency[a.id]["Inductor"];
    });
    
    const sortedByDownstacker = [...employees].sort((a, b) => {
      return employeeRoleEfficiency[b.id]["Downstacker"] - employeeRoleEfficiency[a.id]["Downstacker"];
    });
    
    const sortedByStower = [...employees].sort((a, b) => {
      return employeeRoleEfficiency[b.id]["Stower"] - employeeRoleEfficiency[a.id]["Stower"];
    });
    
    // Generate random work history for demonstration
    const getRandomTimesWorked = () => Math.floor(Math.random() * 5);
    
    // High Efficiency Plan
    const highPlan: WorkforcePlan = {
      Inductor: sortedByInductor.slice(0, inductorCount).map(emp => ({
        "Employee ID": emp.id,
        "Times Worked (Last 30 Days)": getRandomTimesWorked()
      })),
      Downstackers: sortedByDownstacker.slice(0, downstackerCount).map(emp => ({
        "Employee ID": emp.id,
        "Times Worked (Last 30 Days)": getRandomTimesWorked()
      })),
      Stowers: [] // Will be filled after calculating assigned employees
    };
    
    // Medium Efficiency Plan
    const mediumPlan: WorkforcePlan = {
      Inductor: [],
      Downstackers: [],
      Stowers: []
    };
    
    // Select middle performers for inductor
    const midInductorIndex = Math.floor((sortedByInductor.length - inductorCount) / 2);
    mediumPlan.Inductor = sortedByInductor.slice(midInductorIndex, midInductorIndex + inductorCount).map(emp => ({
      "Employee ID": emp.id,
      "Times Worked (Last 30 Days)": getRandomTimesWorked()
    }));
    
    // Select middle performers for downstackers
    const midDownstackerIndex = Math.floor((sortedByDownstacker.length - downstackerCount) / 2);
    mediumPlan.Downstackers = sortedByDownstacker.slice(midDownstackerIndex, midDownstackerIndex + downstackerCount).map(emp => ({
      "Employee ID": emp.id,
      "Times Worked (Last 30 Days)": getRandomTimesWorked()
    }));
    
    // Low Efficiency Plan
    const lowPlan: WorkforcePlan = {
      Inductor: sortedByInductor.slice(-inductorCount).map(emp => ({
        "Employee ID": emp.id,
        "Times Worked (Last 30 Days)": getRandomTimesWorked()
      })),
      Downstackers: sortedByDownstacker.slice(-downstackerCount).map(emp => ({
        "Employee ID": emp.id,
        "Times Worked (Last 30 Days)": getRandomTimesWorked()
      })),
      Stowers: []
    };
    
    // Create sets of already assigned employees for each plan
    const highAssigned = new Set([
      ...highPlan.Inductor.map(e => e["Employee ID"]),
      ...highPlan.Downstackers.map(e => e["Employee ID"])
    ]);
    
    const mediumAssigned = new Set([
      ...mediumPlan.Inductor.map(e => e["Employee ID"]),
      ...mediumPlan.Downstackers.map(e => e["Employee ID"])
    ]);
    
    const lowAssigned = new Set([
      ...lowPlan.Inductor.map(e => e["Employee ID"]),
      ...lowPlan.Downstackers.map(e => e["Employee ID"])
    ]);
    
    // Assign remaining employees as stowers for each plan
    highPlan.Stowers = sortedByStower
      .filter(e => !highAssigned.has(e.id))
      .slice(0, stowerCount)
      .map(emp => ({
        "Employee ID": emp.id,
        "Times Worked (Last 30 Days)": getRandomTimesWorked()
      }));
    
    // For medium plan, use middle performers from remaining employees
    const mediumStowerCandidates = sortedByStower.filter(e => !mediumAssigned.has(e.id));
    const midStowerIndex = Math.floor((mediumStowerCandidates.length - stowerCount) / 2);
    mediumPlan.Stowers = mediumStowerCandidates
      .slice(midStowerIndex, midStowerIndex + stowerCount)
      .map(emp => ({
        "Employee ID": emp.id,
        "Times Worked (Last 30 Days)": getRandomTimesWorked()
      }));
    
    // For low plan, use lowest performers for stowers
    lowPlan.Stowers = sortedByStower
      .filter(e => !lowAssigned.has(e.id))
      .slice(-stowerCount)
      .map(emp => ({
        "Employee ID": emp.id,
        "Times Worked (Last 30 Days)": getRandomTimesWorked()
      }));
    
    return {
      High: highPlan,
      Medium: mediumPlan,
      Low: lowPlan
    };
  }

// Helper function to create a plan based on efficiency level
function createPlan(employees: any[], efficiencyData: Record<number, Record<string, number>>, planType: "high" | "medium" | "low") {
  // Sort employees by their efficiency in each role
  const sortedByInductor = [...employees].sort((a, b) => {
    return efficiencyData[b.id]["Inductor"] - efficiencyData[a.id]["Inductor"];
  });
  
  const sortedByDownstacker = [...employees].sort((a, b) => {
    return efficiencyData[b.id]["Downstacker"] - efficiencyData[a.id]["Downstacker"];
  });
  
  const sortedByStower = [...employees].sort((a, b) => {
    return efficiencyData[b.id]["Stower"] - efficiencyData[a.id]["Stower"];
  });
  
  // Generate random work history for demonstration
  const getRandomTimesWorked = () => Math.floor(Math.random() * 5);
  
  // Select employees based on plan type
  let inductorCount, downstackerCount;
  let inductorSelection, downstackerSelection, stowerSelection;
  
  switch (planType) {
    case "high":
      inductorCount = 1;
      downstackerCount = 2;
      inductorSelection = sortedByInductor.slice(0, inductorCount);
      downstackerSelection = sortedByDownstacker.slice(0, downstackerCount);
      break;
    case "medium":
      inductorCount = 1;
      downstackerCount = 2;
      // Take middle performers for medium plan
      const midInductorIndex = Math.floor(sortedByInductor.length / 2);
      const midDownstackerIndex = Math.floor(sortedByDownstacker.length / 2);
      inductorSelection = sortedByInductor.slice(midInductorIndex, midInductorIndex + inductorCount);
      downstackerSelection = sortedByDownstacker.slice(midDownstackerIndex, midDownstackerIndex + downstackerCount);
      break;
    case "low":
      inductorCount = 1;
      downstackerCount = 1;
      // Take lowest performers for low plan
      inductorSelection = sortedByInductor.slice(-inductorCount);
      downstackerSelection = sortedByDownstacker.slice(-downstackerCount);
      break;
  }
  
  // Create sets of employee IDs that have been assigned
  const assignedEmployees = new Set([
    ...inductorSelection.map(e => e.id),
    ...downstackerSelection.map(e => e.id)
  ]);
  
  // Assign remaining employees as stowers
  const remainingEmployees = employees.filter(e => !assignedEmployees.has(e.id));
  
  if (planType === "high") {
    // High performers as stowers
    stowerSelection = remainingEmployees.sort((a, b) => 
      efficiencyData[b.id]["Stower"] - efficiencyData[a.id]["Stower"]
    );
  } else if (planType === "medium") {
    // Medium performers as stowers
    const sortedByStowerEff = remainingEmployees.sort((a, b) => 
      efficiencyData[b.id]["Stower"] - efficiencyData[a.id]["Stower"]
    );
    const midIndex = Math.floor(sortedByStowerEff.length / 2);
    stowerSelection = [
      ...sortedByStowerEff.slice(0, midIndex),
      ...sortedByStowerEff.slice(midIndex)
    ];
  } else {
    // Low performers as stowers
    stowerSelection = remainingEmployees.sort((a, b) => 
      efficiencyData[a.id]["Stower"] - efficiencyData[b.id]["Stower"]
    );
  }
  
  // Format the plan
  return {
    Inductor: inductorSelection.map(emp => ({
      "Employee ID": emp.id,
      "Times Worked (Last 30 Days)": getRandomTimesWorked()
    })),
    Downstackers: downstackerSelection.map(emp => ({
      "Employee ID": emp.id,
      "Times Worked (Last 30 Days)": getRandomTimesWorked()
    })),
    Stowers: stowerSelection.map(emp => ({
      "Employee ID": emp.id,
      "Times Worked (Last 30 Days)": getRandomTimesWorked()
    }))
  };
}