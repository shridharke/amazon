"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReportsSnapshot from "./components/reports-snapshot";
import StowerPerformanceReport from "./components/user-device-report";
import RoleStats from "./components/user-stats-chart";
import UsersStat from "./components/users-stat";
import ReportsArea from "./components/reports-area";
import DashboardSelect from "@/components/dasboard-select";
import TopPage from "./components/top-page";
import DatePickerWithRange from "@/components/date-picker-with-range";

interface DashboardPageViewProps {
  trans: {
    [key: string]: string;
  };
}

const DashboardPageView = ({ trans }: DashboardPageViewProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center flex-wrap justify-between gap-4">
        <div className="text-2xl font-medium text-default-800">
          Warehouse Performance Metrics {trans?.dashboard}
        </div>
        <DatePickerWithRange />
      </div>
      
      {/* Package Metrics Overview */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <ReportsSnapshot />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <UsersStat />
        </div>
      </div>

      {/* Role Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReportsArea />
        </div>
        <Card>
          <CardHeader className="border-none p-6 pt-5 mb-0">
            <CardTitle className="text-lg font-semibold text-default-900 p-0">
              Daily Performance Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RoleStats />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-none p-6 pt-5 mb-0">
            <CardTitle className="text-lg font-semibold text-default-900 p-0">
              Role Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="warehouse-metrics">
              <StowerPerformanceReport />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Employee Performance */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <Card>
            <CardHeader className="border-none pb-0">
              <CardTitle className="pt-2.5">Employee Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <TopPage />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPageView;
