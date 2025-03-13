"use client";
import RoleMetricsTable from "./role-metrics-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface EmployeeStats {
  active: number;
  fixed: number;
  flex: number;
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
  const fixed = employeeStats?.fixed || 0;
  const flex = employeeStats?.flex || 0;
  const roles = employeeStats?.roles || { inductors: 0, stowers: 0, downstackers: 0 };
  const performance = employeeStats?.performance || { high: 0, medium: 0, low: 0 };

  // Calculate totals for each task type's performance
  const rolePerformance = [
    {
      id: 1,
      role: "Inductor",
      current: roles.inductors,
      highPerformers: Math.round(roles.inductors * 0.4),
      mediumPerformers: Math.round(roles.inductors * 0.5),
      lowPerformers: Math.round(roles.inductors * 0.1),
    },
    {
      id: 2,
      role: "Stower",
      current: roles.stowers,
      highPerformers: Math.round(roles.stowers * 0.6),
      mediumPerformers: Math.round(roles.stowers * 0.3),
      lowPerformers: Math.round(roles.stowers * 0.1),
    },
    {
      id: 3,
      role: "Downstacker",
      current: roles.downstackers,
      highPerformers: Math.round(roles.downstackers * 0.5),
      mediumPerformers: Math.round(roles.downstackers * 0.4),
      lowPerformers: Math.round(roles.downstackers * 0.1),
    },
  ];

  // Role metrics for table - show actual role assignments and performance by role
  const metrics = rolePerformance.map(role => ({
    id: role.id,
    role: role.role,
    assigned: role.current.toString(),
    high: role.highPerformers.toString(),
    medium: role.mediumPerformers.toString(),
    low: role.lowPerformers.toString()
  }));

  return (
    <Card>
      <CardHeader className="border-none">
        <div className="flex items-center gap-1 mb-3">
          <Icon icon="heroicons:users" className="text-xl text-default-600" />
          <CardTitle className="text-xl font-medium">Workforce Overview</CardTitle>
        </div>
        <div className="flex items-center justify-center gap-5">
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
                {fixed} Fixed / {flex} Flex
              </span>
            </div>
            <div className={cn("flex items-center gap-2")}>
              <div className="h-2 w-2 rounded-full bg-success"></div>
              <span className="text-default-600 text-xs mb-[3px]">
                {roles.inductors} Inductors
              </span>
            </div>
            <div className={cn("flex items-center gap-2")}>
              <div className="h-2 w-2 rounded-full bg-warning"></div>
              <span className="text-default-600 text-xs mb-[3px]">
                {roles.stowers} Stowers
              </span>
            </div>
            <div className={cn("flex items-center gap-2")}>
              <div className="h-2 w-2 rounded-full bg-destructive"></div>
              <span className="text-default-600 text-xs">
                {roles.downstackers} Downstackers
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg overflow-hidden">
          <div className="p-2 pt-0">
            <div className="text-sm font-medium text-default-900 mb-4">
              Performance by Role
            </div>
            <div className="flex items-center justify-between text-default-600 text-xs">
              <div>
                <h6 className="font-regular">Task Assignments</h6>
                <div className="text-base text-default-900 font-semibold mt-1">
                  {roles.inductors + roles.stowers + roles.downstackers} Assignments
                </div>
              </div>
              <div>
                <h6 className="font-regular">Total Employees</h6>
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