"use client";
import RoleMetricsTable from "./role-metrics-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface EmployeeStats {
  active: number;
  roles: {
    inductors: number;
    stowers: number;
    downstackers: number;
  };
  performance: {
    high: number;
    medium: number;
    low: number;
  };
}

interface UsersStatProps {
  employeeStats?: EmployeeStats;
}

const UsersStat = ({ employeeStats }: UsersStatProps) => {
  // Default values if no stats provided
  const active = employeeStats?.active || 0;
  const roles = employeeStats?.roles || { inductors: 0, stowers: 0, downstackers: 0 };
  const performance = employeeStats?.performance || { high: 0, medium: 0, low: 0 };

  // Calculate totals
  const totalRoles = roles.inductors + roles.stowers + roles.downstackers;
  const totalPerformance = performance.high + performance.medium + performance.low;

  // Role metrics for table
  const metrics = [
    {
      id: 1,
      role: "Inductors",
      current: roles.inductors.toString(),
      target: Math.round(active * 0.15).toString(), // Example targets - 15% of active employees
    },
    {
      id: 2,
      role: "Stowers",
      current: roles.stowers.toString(),
      target: Math.round(active * 0.65).toString(), // 65% of active employees
    },
    {
      id: 3,
      role: "Downstackers",
      current: roles.downstackers.toString(),
      target: Math.round(active * 0.2).toString(), // 20% of active employees
    },
    {
      id: 4,
      role: "High Performers",
      current: performance.high.toString(),
      target: Math.round(active * 0.3).toString(), // 30% of active employees
    },
    {
      id: 5,
      role: "Medium Performers",
      current: performance.medium.toString(),
      target: Math.round(active * 0.6).toString(), // 60% of active employees
    },
    {
      id: 6,
      role: "Low Performers",
      current: performance.low.toString(),
      target: Math.round(active * 0.1).toString(), // 10% of active employees
    },
  ];

  return (
    <Card>
      <CardHeader className="border-none">
        <div className="flex items-center gap-1 mb-3">
          <Icon icon="heroicons:users" className="text-xl text-default-600" />
          <CardTitle className="text-xl font-medium">Workforce Overview</CardTitle>
        </div>
        <div className="flex items-center gap-5 mb-[15px]">
          <div>
            <div className="font-medium text-3xl mb-1">{active}</div>
            <CardDescription className="text-xs uppercase font-medium">
              Active Employees
            </CardDescription>
          </div>
          <div className="border-l pl-5 border-default-200 h-full">
            <div className={cn("flex items-center gap-2")}>
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <span className="text-default-600 text-xs mb-[3px]">
                {totalRoles} Specialized Roles
              </span>
            </div>
            <div className={cn("flex items-center gap-2")}>
              <div className="h-2 w-2 rounded-full bg-success"></div>
              <span className="text-default-600 text-xs mb-[3px]">
                {performance.high} High Performers
              </span>
            </div>
            <div className={cn("flex items-center gap-2")}>
              <div className="h-2 w-2 rounded-full bg-warning"></div>
              <span className="text-default-600 text-xs mb-[3px]">
                {performance.medium} Medium Performers
              </span>
            </div>
            <div className={cn("flex items-center gap-2")}>
              <div className="h-2 w-2 rounded-full bg-destructive"></div>
              <span className="text-default-600 text-xs">
                {performance.low} Low Performers
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 px-6 pb-6">
        <div className="border border-dashed border-default-200 rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="text-sm font-medium text-default-900 mb-4">
              Role Distribution
            </div>
            <div className="flex items-center justify-between text-default-600 text-xs">
              <div>
                <h6 className="font-regular">Current Staffing</h6>
                <div className="text-base text-default
                  -900 font-semibold mt-1">
                  {totalRoles} Employees
                </div>
              </div>
              <div>
                <h6 className="font-regular">Suggested Targets</h6>
                <div className="text-base text-default-900 font-semibold mt-1">
                  {active} Employees
                </div>
              </div>
            </div>
          </div>
          <RoleMetricsTable metrics={metrics} />
        </div>
      </CardContent>
    </Card>
  );
};

export default UsersStat;