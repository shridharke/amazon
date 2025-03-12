"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReportsSnapshot from "./components/reports-snapshot";
import StowerPerformanceReport from "./components/user-device-report";
import RoleStats from "./components/user-stats-chart";
import UsersStat from "./components/users-stat";
import ReportsArea from "./components/reports-area";
import TopPage from "./components/top-page";
import { DateRange } from "react-day-picker";
import { addDays, subDays } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import DatePickerWithRange from './date-picker-with-range';

// Define the metrics interface to match the API response structure
interface DashboardMetrics {
  packageMetrics: {
    total: {
      series: { data: number[] }[];
      dates: string[];
      current: number;
    };
    inductor: {
      series: { data: number[] }[];
      dates: string[];
      current: number;
    };
    stower: {
      series: { data: number[] }[];
      dates: string[];
      current: number;
    };
    downstacker: {
      series: { data: number[] }[];
      dates: string[];
      current: number;
    };
  };
  employeeStats: {
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
  };
  keyMetrics: {
    id: number;
    name: string;
    count: string;
    rate: string;
    isUp: boolean;
    color: string;
  }[];
  rolePerformance: {
    categories: string[];
    series: {
      name: string;
      data: number[];
    }[];
  };
  stowerDistribution: {
    series: number[];
  };
  employeePerformance: {
    id: string;
    name: string;
    role: string;
    packages: number;
    efficiency: number;
    status: string;
    link: string;
  }[];
}

const DashboardPageView = () => {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Format dates for API call
        const fromDate = dateRange?.from?.toISOString().split('T')[0];
        const toDate = dateRange?.to?.toISOString().split('T')[0];
        
        const response = await fetch(`/api/dashboard?from=${fromDate}&to=${toDate}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dateRange, toast]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center flex-wrap justify-between gap-4">
        <div className="text-2xl font-medium text-default-800">
          Warehouse Performance Metrics Dashboard
        </div>
        <DatePickerWithRange value={dateRange} onChange={handleDateRangeChange} />
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Package Metrics Overview */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8">
              <ReportsSnapshot metrics={metrics?.packageMetrics} />
            </div>
            <div className="col-span-12 lg:col-span-4">
              <UsersStat employeeStats={metrics?.employeeStats} />
            </div>
          </div>

          {/* Role Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ReportsArea metrics={metrics?.keyMetrics} />
            </div>
            <Card>
              <CardHeader className="border-none p-6 pt-5 mb-0">
                <CardTitle className="text-lg font-semibold text-default-900 p-0">
                  Daily Performance Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RoleStats rolePerformance={metrics?.rolePerformance} />
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
                  <StowerPerformanceReport stowerStats={metrics?.stowerDistribution} />
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
                  <TopPage employeeData={metrics?.employeePerformance} />
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPageView;