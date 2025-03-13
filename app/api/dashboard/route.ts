// app/api/dashboard/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EmployeeTask, EmployeeType, PerformanceRecord } from '@prisma/client';
import { format, parseISO } from 'date-fns';

// Type for a performance record with its relations
type PerformanceRecordWithRelations = PerformanceRecord & {
  employee: {
    id: number;
    name: string;
    type: EmployeeType;
    // Add other required fields
  };
  shift: {
    id: number;
    // Add other required fields
  } | null;
};

// Type for employee performance tracking
type EmployeePerformanceData = {
  employeeId: number;
  name: string;
  task: EmployeeTask;
  totalPackages: number;
  totalHours: number;
  records: PerformanceRecordWithRelations[];
};

// Type for metrics calculator functions
type MetricCalculator = (records: PerformanceRecordWithRelations[]) => number;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get('from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = searchParams.get('to') || new Date().toISOString().split('T')[0];
    const taskFilter = searchParams.get('task') || 'all';

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

    // Build where clause for task filtering
    const taskWhere = taskFilter !== 'all' 
      ? { task: taskFilter as EmployeeTask } 
      : {};

    // Fetch all the data needed for the dashboard
    const [
      performanceRecords,
      employees,
      packages,
      shifts,
      schedules
    ] = await Promise.all([
      // Performance Records for the date range
      prisma.performanceRecord.findMany({
        where: {
          organizationId: orgId,
          date: {
            gte: startDate,
            lte: endDate
          },
          ...taskWhere
        },
        include: {
          employee: true,
          shift: true
        },
        orderBy: {
          date: 'asc'
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
      }),
      
      // Schedules in the date range
      prisma.schedule.findMany({
        where: {
          organizationId: orgId,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          scheduleEmployee: {
            include: {
              employee: true
            }
          }
        },
        orderBy: {
          date: 'asc'
        }
      })
    ]);

    // Group performance records by date
    const recordsByDate = new Map<string, PerformanceRecordWithRelations[]>();
    
    performanceRecords.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!recordsByDate.has(dateKey)) {
        recordsByDate.set(dateKey, []);
      }
      recordsByDate.get(dateKey)!.push(record as PerformanceRecordWithRelations);
    });

    // Group packages by date
    const packagesByDate = new Map<string, typeof packages[0][]>();
    
    packages.forEach(pkg => {
      const dateKey = pkg.date.toISOString().split('T')[0];
      if (!packagesByDate.has(dateKey)) {
        packagesByDate.set(dateKey, []);
      }
      packagesByDate.get(dateKey)!.push(pkg);
    });

    // Process package metrics - get all unique dates
    const allDates = [...new Set([
      ...Array.from(recordsByDate.keys()),
      ...Array.from(packagesByDate.keys())
    ])].sort();

    // Calculate total packages per day (using Package entity)
    const totalPackageCounts = allDates.map(date => {
      const dayPackages = packagesByDate.get(date) || [];
      return dayPackages.reduce((total, pkg) => total + pkg.totalCount, 0);
    });

    // Filter performance records by task type
    const inductorRecords = performanceRecords.filter(
      record => record.task === EmployeeTask.INDUCTOR
    ) as PerformanceRecordWithRelations[];
    
    const stowerRecords = performanceRecords.filter(
      record => record.task === EmployeeTask.STOWER
    ) as PerformanceRecordWithRelations[];
    
    const downstackerRecords = performanceRecords.filter(
      record => record.task === EmployeeTask.DOWNSTACKER
    ) as PerformanceRecordWithRelations[];

    // Calculate average packages per hour for each role
    const calculateRoleMetricsByDate = (
      records: PerformanceRecordWithRelations[], 
      role: string
    ): { dates: string[], metrics: number[] } => {
      const metricsByDate = new Map<string, number>();
      
      allDates.forEach(date => {
        const dayRecords = records.filter(r => r.date.toISOString().split('T')[0] === date);
        
        if (dayRecords.length > 0) {
          const totalPackages = dayRecords.reduce((sum, r) => sum + r.packagesHandled, 0);
          const totalHours = dayRecords.reduce((sum, r) => sum + r.workingHours, 0);
          const avgPackagesPerHour = totalHours > 0 ? totalPackages / totalHours : 0;
          
          metricsByDate.set(date, Math.round(avgPackagesPerHour));
        } else {
          metricsByDate.set(date, 0);
        }
      });
      
      return {
        dates: allDates,
        metrics: allDates.map(date => metricsByDate.get(date) || 0)
      };
    };

    const inductorMetrics = calculateRoleMetricsByDate(inductorRecords, 'inductor');
    const stowerMetrics = calculateRoleMetricsByDate(stowerRecords, 'stower');
    const downstackerMetrics = calculateRoleMetricsByDate(downstackerRecords, 'downstacker');

    // Calculate current averages
    const calculateCurrentAverage = (records: PerformanceRecordWithRelations[]): number => {
      if (records.length === 0) return 0;
      const totalPackages = records.reduce((sum, record) => sum + record.packagesHandled, 0);
      const totalHours = records.reduce((sum, record) => sum + record.workingHours, 0);
      return totalHours > 0 ? Math.round(totalPackages / totalHours) : 0;
    };

    const currentInductorRate = calculateCurrentAverage(inductorRecords);
    const currentStowerRate = calculateCurrentAverage(stowerRecords);
    const currentDownstackerRate = calculateCurrentAverage(downstackerRecords);

    // Calculate total packages processed in the period
    const totalPackagesInPeriod = packages.reduce((sum, pkg) => sum + pkg.totalCount, 0);

    // Employee distribution by role and performance
    const fixedEmployees = employees.filter(e => e.type === EmployeeType.FIXED).length;
    const flexEmployees = employees.filter(e => e.type === EmployeeType.FLEX).length;

    // Count employees by assigned tasks from the schedules
    const employeeRoles = new Map<string, EmployeeTask>();
    
    schedules.forEach(schedule => {
      schedule.scheduleEmployee.forEach(se => {
        if (se.task) {
          const key = `${se.employeeId}-${se.task}`;
          employeeRoles.set(key, se.task);
        }
      });
    });
    
    // Count unique employees by role
    const uniqueInductors = new Set<string | number>();
    const uniqueStowers = new Set<string | number>();
    const uniqueDownstackers = new Set<string | number>();
    
    for (const [key, task] of employeeRoles.entries()) {
      const [employeeId] = key.split('-');
      if (task === EmployeeTask.INDUCTOR) uniqueInductors.add(employeeId);
      if (task === EmployeeTask.STOWER) uniqueStowers.add(employeeId);
      if (task === EmployeeTask.DOWNSTACKER) uniqueDownstackers.add(employeeId);
    }

    // Calculate performance metrics for employees
    const employeePerformanceMap = new Map<string, EmployeePerformanceData>();
    
    performanceRecords.forEach(record => {
      const key = `${record.employeeId}-${record.task}`;
      
      if (!employeePerformanceMap.has(key)) {
        employeePerformanceMap.set(key, {
          employeeId: record.employeeId,
          name: (record as PerformanceRecordWithRelations).employee.name,
          task: record.task,
          totalPackages: 0,
          totalHours: 0,
          records: []
        });
      }
      
      const empPerf = employeePerformanceMap.get(key)!;
      empPerf.totalPackages += record.packagesHandled;
      empPerf.totalHours += record.workingHours;
      empPerf.records.push(record as PerformanceRecordWithRelations);
    });
    
    // Calculate efficiency for each employee
    const employeePerformance = [];
    
    for (const [_, perf] of employeePerformanceMap.entries()) {
      if (perf.totalHours === 0) continue;
      
      const packagesPerHour = perf.totalPackages / perf.totalHours;
      
      // Get target rate for role
      const targetRate = 
        perf.task === EmployeeTask.INDUCTOR ? 250 :
        perf.task === EmployeeTask.STOWER ? 50 :
        perf.task === EmployeeTask.DOWNSTACKER ? 150 : 110;
      
      const efficiency = Math.round((packagesPerHour / targetRate) * 100);
      
      let status = 'On Target';
      if (efficiency < 85) {
        status = 'Needs Improvement';
      } else if (efficiency < 95) {
        status = 'Below Target';
      }
      
      employeePerformance.push({
        id: perf.employeeId.toString(),
        name: perf.name,
        role: perf.task,
        packages: Math.round(packagesPerHour),
        efficiency,
        status
      });
    }
    
    // Calculate stower distribution
    const stowerPerformance = Array.from(employeePerformanceMap.values())
      .filter(perf => perf.task === EmployeeTask.STOWER && perf.totalHours > 0)
      .map(perf => ({
        employeeId: perf.employeeId,
        packagesPerHour: perf.totalPackages / perf.totalHours
      }));
    
    const stowerDistribution = {
      highPerformers: stowerPerformance.filter(stower => stower.packagesPerHour >= 150).length,
      average: stowerPerformance.filter(stower => stower.packagesPerHour >= 100 && stower.packagesPerHour < 150).length,
      belowTarget: stowerPerformance.filter(stower => stower.packagesPerHour < 100).length
    };

    // Calculate period comparison for key metrics
    const midPoint = new Date((startDate.getTime() + endDate.getTime()) / 2);
    
    const firstHalfRecords = performanceRecords.filter(
      record => record.date < midPoint
    ) as PerformanceRecordWithRelations[];
    
    const secondHalfRecords = performanceRecords.filter(
      record => record.date >= midPoint
    ) as PerformanceRecordWithRelations[];
    
    const calculateMetricChange = (
      firstHalf: PerformanceRecordWithRelations[], 
      secondHalf: PerformanceRecordWithRelations[], 
      metric: MetricCalculator
    ): { change: number, isImprovement: boolean } => {
      const firstHalfValue = metric(firstHalf);
      const secondHalfValue = metric(secondHalf);
      
      if (firstHalfValue === 0) return { change: 0, isImprovement: false };
      
      const change = ((secondHalfValue - firstHalfValue) / firstHalfValue) * 100;
      return {
        change: Math.round(change),
        isImprovement: change > 0
      };
    };
    
    const packagesPerHourMetric = (records: PerformanceRecordWithRelations[]): number => {
      if (records.length === 0) return 0;
      const totalPackages = records.reduce((sum: number, record) => sum + record.packagesHandled, 0);
      const totalHours = records.reduce((sum: number, record) => sum + record.workingHours, 0);
      return Math.round(totalPackages / totalHours);
    };
    
    const efficiencyMetric = (records: PerformanceRecordWithRelations[]): number => {
      if (records.length === 0) return 0;
      
      return records.reduce((sum: number, record) => {
        const targetRate = 
          record.task === EmployeeTask.INDUCTOR ? 250 :
          record.task === EmployeeTask.STOWER ? 50 :
          record.task === EmployeeTask.DOWNSTACKER ? 150 : 110;
        
        const efficiency = (record.packagesHandled / record.workingHours) / targetRate * 100;
        return sum + efficiency;
      }, 0) / records.length;
    };
    
    const completionRateMetric = (records: PerformanceRecordWithRelations[]): number => {
      if (records.length === 0) return 0;
      
      // Calculate what percentage of assigned packages were completed
      const totalAssigned = packages.reduce((sum: number, pkg) => sum + pkg.totalCount, 0);
      const totalHandled = records.reduce((sum: number, record) => sum + record.packagesHandled, 0);
      
      return totalAssigned > 0 ? (totalHandled / totalAssigned) * 100 : 0;
    };
    
    // Calculate current values and changes
    const currentPackagesPerHour = packagesPerHourMetric(performanceRecords as PerformanceRecordWithRelations[]);
    const packagesPerHourChange = calculateMetricChange(firstHalfRecords, secondHalfRecords, packagesPerHourMetric);
    
    const currentEfficiency = Math.round(efficiencyMetric(performanceRecords as PerformanceRecordWithRelations[]));
    const efficiencyChange = calculateMetricChange(firstHalfRecords, secondHalfRecords, efficiencyMetric);
    
    const currentCompletionRate = Math.round(completionRateMetric(performanceRecords as PerformanceRecordWithRelations[]));
    const completionRateChange = calculateMetricChange(firstHalfRecords, secondHalfRecords, completionRateMetric);

    // Format dates for the dashboard
    const formattedDates = allDates.map(dateStr => {
      try {
        return format(parseISO(dateStr), "MMM dd");
      } catch (e) {
        return dateStr;
      }
    });

    const roleDistributionData = {
      inductor: uniqueInductors.size,
      stower: uniqueStowers.size,
      downstacker: uniqueDownstackers.size,
      unassigned: employees.filter(e => e.isActive).length - 
        (uniqueInductors.size + uniqueStowers.size + uniqueDownstackers.size)
    };
    
    // Efficiency data by date range
    const efficiencyData = {
      current: {
        inductor: currentInductorRate > 0 ? Math.round((currentInductorRate / 180) * 100) : 0,
        stower: currentStowerRate > 0 ? Math.round((currentStowerRate / 140) * 100) : 0,
        downstacker: currentDownstackerRate > 0 ? Math.round((currentDownstackerRate / 90) * 100) : 0,
      },
      target: {
        inductor: 100,
        stower: 100,
        downstacker: 100
      }
    };

    const packageStatuses = packages.reduce((acc, pkg) => {
      if (pkg.status === 'COMPLETED') acc.completed++;
      else if (pkg.status === 'IN_PROGRESS') acc.inProgress++;
      else acc.scheduled++;
      return acc;
    }, { completed: 0, inProgress: 0, scheduled: 0 });
    
    const totalPackages = packageStatuses.completed + packageStatuses.inProgress + packageStatuses.scheduled;
    const taskCompletionData = totalPackages > 0 ? {
      completed: Math.round((packageStatuses.completed / totalPackages) * 100),
      inProgress: Math.round((packageStatuses.inProgress / totalPackages) * 100),
      scheduled: Math.round((packageStatuses.scheduled / totalPackages) * 100)
    } : { completed: 0, inProgress: 0, scheduled: 0 };

    // Format data for dashboard
    const dashboardData = {
      packageMetrics: {
        total: {
          series: [{ data: totalPackageCounts }],
          dates: allDates,
          current: totalPackagesInPeriod
        },
        inductor: {
          series: [{ data: inductorMetrics.metrics }],
          dates: inductorMetrics.dates,
          current: currentInductorRate
        },
        stower: {
          series: [{ data: stowerMetrics.metrics }],
          dates: stowerMetrics.dates,
          current: currentStowerRate
        },
        downstacker: {
          series: [{ data: downstackerMetrics.metrics }],
          dates: downstackerMetrics.dates,
          current: currentDownstackerRate
        }
      },
      employeeStats: {
        active: employees.filter(e => e.isActive).length,
        fixed: fixedEmployees,
        flex: flexEmployees,
        roles: {
          inductors: uniqueInductors.size,
          stowers: uniqueStowers.size,
          downstackers: uniqueDownstackers.size
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
          count: currentPackagesPerHour.toString(),
          rate: Math.abs(packagesPerHourChange.change).toString(),
          isUp: packagesPerHourChange.isImprovement,
          color: "primary"
        },
        {
          id: 2,
          name: "Avg Efficiency",
          count: currentEfficiency + "%",
          rate: Math.abs(efficiencyChange.change).toString(),
          isUp: efficiencyChange.isImprovement,
          color: "info"
        },
        {
          id: 3,
          name: "Completion Rate",
          count: currentCompletionRate + "%",
          rate: Math.abs(completionRateChange.change).toString(),
          isUp: completionRateChange.isImprovement,
          color: "success"
        },
        {
          id: 4,
          name: "Fixed vs Flex",
          count: `${fixedEmployees}:${flexEmployees}`,
          rate: "0",
          isUp: true,
          color: "warning"
        }
      ],
      rolePerformance: {
        categories: ['Inductor', 'Stower', 'Downstacker'],
        series: [
          {
            name: "Actual",
            data: [
              currentInductorRate,
              currentStowerRate,
              currentDownstackerRate
            ]
          },
          {
            name: "Target",
            data: [250, 50, 150]
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
      employeePerformance: employeePerformance.sort((a, b) => b.efficiency - a.efficiency),
      roleDistributionData,
      efficiencyData,
      taskCompletionData
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error in dashboard API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}