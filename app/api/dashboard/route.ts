// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EmployeeTask } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get('from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = searchParams.get('to') || new Date().toISOString().split('T')[0];

    // Convert to Date objects
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    
    // Adjust end date to include the entire day
    endDate.setHours(23, 59, 59, 999);

    // Get organization ID (assuming first org for now, but you'd normally get this from session)
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }
    
    const orgId = organization.id;

    // Fetch all the data needed for the dashboard
    const [
      performanceRecords,
      employees,
      packages,
      shifts
    ] = await Promise.all([
      // Performance Records for the date range
      prisma.performanceRecord.findMany({
        where: {
          organizationId: orgId,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          employee: true,
          shift: true
        }
      }),
      
      // Active employees
      prisma.employee.findMany({
        where: {
          organizationId: orgId,
          isActive: true
        }
      }),
      
      // Packages in the date range
      prisma.package.findMany({
        where: {
          organizationId: orgId,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          date: 'asc'
        }
      }),
      
      // Shifts in the date range
      prisma.shift.findMany({
        where: {
          organizationId: orgId,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          date: 'asc'
        }
      })
    ]);

    // Process the data for the dashboard
    
    // Process package metrics
    const packageDates = [...new Set(packages.map(pkg => pkg.date.toISOString().split('T')[0]))];
    const packageCounts = packageDates.map(date => {
      const dayPackages = packages.filter(pkg => pkg.date.toISOString().split('T')[0] === date);
      return dayPackages.reduce((total, pkg) => total + pkg.totalCount, 0);
    });

    // Process employee role distribution
    const inductors = performanceRecords.filter(record => record.task === EmployeeTask.INDUCTOR);
    const stowers = performanceRecords.filter(record => record.task === EmployeeTask.STOWER);
    const downstackers = performanceRecords.filter(record => record.task === EmployeeTask.DOWNSTACKER);

    // Calculate efficiency and rates for each role
    const calculateAverage = (records: typeof performanceRecords) => {
      if (records.length === 0) return 0;
      return records.reduce((sum, record) => sum + (record.packagesHandled / record.workingHours), 0) / records.length;
    };

    const inductorRate = calculateAverage(inductors);
    const stowerRate = calculateAverage(stowers);
    const downstackerRate = calculateAverage(downstackers);

    // Latest performance records for each employee
    const employeeRecordsMap = new Map();
    
    for (const record of performanceRecords) {
      const key = `${record.employeeId}-${record.task}`;
      if (!employeeRecordsMap.has(key) || new Date(record.date) > new Date(employeeRecordsMap.get(key).date)) {
        employeeRecordsMap.set(key, record);
      }
    }
    
    const latestPerformanceRecords = Array.from(employeeRecordsMap.values());

    // Calculate stower distribution
    const stowerPerformance = stowers.map(record => ({
      employeeId: record.employeeId,
      packagesPerHour: record.packagesHandled / record.workingHours
    }));
    
    const stowerDistribution = {
      highPerformers: stowerPerformance.filter(stower => stower.packagesPerHour >= 200).length,
      average: stowerPerformance.filter(stower => stower.packagesPerHour >= 110 && stower.packagesPerHour < 200).length,
      belowTarget: stowerPerformance.filter(stower => stower.packagesPerHour < 110).length
    };

    // Prepare employee performance data
    const employeePerformance = latestPerformanceRecords.map(record => {
      const employee = employees.find(emp => emp.id === record.employeeId);
      const efficiency = record.packagesHandled / (record.workingHours * 
        (record.task === EmployeeTask.INDUCTOR ? inductorRate : 
         record.task === EmployeeTask.STOWER ? stowerRate : 
         downstackerRate)) * 100;
      
      let status = 'On Target';
      if (efficiency < 85) {
        status = 'Needs Improvement';
      } else if (efficiency < 95) {
        status = 'Below Target';
      }
      
      return {
        id: record.employeeId.toString(),
        name: employee?.name || 'Unknown',
        role: record.task,
        packages: record.packagesHandled,
        efficiency: Math.round(efficiency),
        status: status,
        link: `/employees/${record.employeeId}`
      };
    });

    // Calculate key metrics
    const currentPeriodRecords = performanceRecords.filter(
      record => new Date(record.date) >= new Date(new Date().setDate(new Date().getDate() - 7))
    );
    
    const previousPeriodRecords = performanceRecords.filter(
      record => new Date(record.date) < new Date(new Date().setDate(new Date().getDate() - 7)) && 
                new Date(record.date) >= new Date(new Date().setDate(new Date().getDate() - 14))
    );

    const calculateMetric = (
      currentRecords: typeof performanceRecords, 
      previousRecords: typeof performanceRecords, 
      metric: (records: typeof performanceRecords) => number
    ) => {
      const currentValue = metric(currentRecords);
      const previousValue = metric(previousRecords);
      const change = previousValue > 0 ? ((currentValue - previousValue) / previousValue * 100) : 0;
      
      return {
        current: currentValue,
        change: Math.round(change),
        isImprovement: change > 0
      };
    };

    const packagesPerHourMetric = (records: typeof performanceRecords) => {
      if (records.length === 0) return 0;
      const totalPackages = records.reduce((sum, record) => sum + record.packagesHandled, 0);
      const totalHours = records.reduce((sum, record) => sum + record.workingHours, 0);
      return Math.round(totalPackages / totalHours);
    };

    const efficiencyMetric = (records: typeof performanceRecords) => {
      if (records.length === 0) return 0;
      const stowerRecords = records.filter(record => record.task === EmployeeTask.STOWER);
      if (stowerRecords.length === 0) return 0;
      
      return Math.round(stowerRecords.reduce((sum, record) => {
        const employee = employees.find(emp => emp.id === record.employeeId);
        return sum + (record.packagesHandled / (record.workingHours * (employee?.stowerEff || 110) / 100));
      }, 0) / stowerRecords.length * 100);
    };

    const errorRateMetric = (records: typeof performanceRecords) => {
      // This is a placeholder - you'd need to track errors in your system
      return Math.random() * 1.5;
    };

    const queueTimeMetric = (records: typeof performanceRecords) => {
      // This is a placeholder - you'd need actual queue time data
      return Math.random() * 10;
    };

    const packagesPerHour = calculateMetric(currentPeriodRecords, previousPeriodRecords, packagesPerHourMetric);
    const stowerEfficiency = calculateMetric(currentPeriodRecords, previousPeriodRecords, efficiencyMetric);
    const errorRate = calculateMetric(currentPeriodRecords, previousPeriodRecords, errorRateMetric);
    const queueTime = calculateMetric(currentPeriodRecords, previousPeriodRecords, queueTimeMetric);

    // Format data for dashboard
    const dashboardData = {
      packageMetrics: {
        total: {
          series: [{ data: packageCounts }],
          dates: packageDates,
          current: performanceRecords.length > 0 ? 
            performanceRecords.reduce((sum, record) => sum + record.packagesHandled, 0) : 0
        },
        inductor: {
          series: [{ data: inductors.map(record => record.packagesHandled) }],
          dates: inductors.map(record => record.date.toISOString().split('T')[0]),
          current: Math.round(inductorRate)
        },
        stower: {
          series: [{ data: stowers.map(record => record.packagesHandled) }],
          dates: stowers.map(record => record.date.toISOString().split('T')[0]),
          current: Math.round(stowerRate)
        },
        downstacker: {
          series: [{ data: downstackers.map(record => record.packagesHandled) }],
          dates: downstackers.map(record => record.date.toISOString().split('T')[0]),
          current: Math.round(downstackerRate)
        }
      },
      employeeStats: {
        active: employees.filter(e => e.isActive).length,
        roles: {
          inductors: employees.filter(e => e.inductorEff > 0).length,
          stowers: employees.filter(e => e.stowerEff > 0).length,
          downstackers: employees.filter(e => e.downstackerEff > 0).length
        },
        performance: {
          high: employeePerformance.filter(e => e.efficiency >= 95).length,
          medium: employeePerformance.filter(e => e.efficiency >= 85 && e.efficiency < 95).length,
          low: employeePerformance.filter(e => e.efficiency < 85).length
        }
      },
      keyMetrics: [
        {
          id: 1,
          name: "Packages/Hour",
          count: packagesPerHour.current.toString(),
          rate: Math.abs(packagesPerHour.change).toString(),
          isUp: packagesPerHour.isImprovement,
          color: "primary"
        },
        {
          id: 2,
          name: "Stower Efficiency",
          count: stowerEfficiency.current + "%",
          rate: Math.abs(stowerEfficiency.change).toString(),
          isUp: stowerEfficiency.isImprovement,
          color: "info"
        },
        {
          id: 3,
          name: "Error Rate",
          count: errorRate.current.toFixed(1) + "%",
          rate: Math.abs(errorRate.change).toString(),
          isUp: !errorRate.isImprovement, // For error rate, down is good
          color: "warning"
        },
        {
          id: 4,
          name: "Queue Time",
          count: queueTime.current.toFixed(1) + "m",
          rate: Math.abs(queueTime.change).toString(),
          isUp: !queueTime.isImprovement, // For queue time, down is good
          color: "destructive"
        }
      ],
      rolePerformance: {
        categories: ['Inductor', 'Stower', 'Downstacker'],
        series: [
          {
            name: "Actual",
            data: [
              Math.round(inductorRate),
              Math.round(stowerRate),
              Math.round(downstackerRate)
            ]
          },
          {
            name: "Target",
            data: [
              organization.shiftStartTime === "09:00" ? 180 : 200, // Example targets
              organization.shiftStartTime === "09:00" ? 140 : 150,
              organization.shiftStartTime === "09:00" ? 90 : 100
            ]
          }
        ]
      },
      stowerDistribution: {
        series: [
          stowerDistribution.highPerformers,
          stowerDistribution.average,
          stowerDistribution.belowTarget
        ]
      },
      employeePerformance: employeePerformance.sort((a, b) => b.efficiency - a.efficiency)
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error in dashboard API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}