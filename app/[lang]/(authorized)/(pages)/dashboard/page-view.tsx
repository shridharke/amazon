"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportsSnapshot from "./components/reports-snapshot";
import RoleStats from "./components/user-stats-chart";
import UsersStat from "./components/users-stat";
import ReportsArea from "./components/reports-area";
import TopPage from "./components/top-page";
import DatePickerWithRange from "@/components/date-picker-with-range";
import { DateRange } from "react-day-picker";
import { addDays, subDays, format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RoleDistributionChart from './components/user-device-report';
import DailyPerformanceView from './daily-view';

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
  }[];
  roleDistributionData: {
    inductor: number;
    stower: number;
    downstacker: number;
    unassigned: number;
  };
  efficiencyData: {
    current: {
      inductor: number;
      stower: number;
      downstacker: number;
    };
    target: {
      inductor: number;
      stower: number;
      downstacker: number;
    };
  };
  taskCompletionData: {
    completed: number;
    inProgress: number;
    scheduled: number;
  };
}

const DashboardPageView = () => {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("overall");
  
  // Then update your useEffect that fetches data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Format dates for API call with explicit date formatting
        let fromDateStr = '';
        let toDateStr = '';
        
        if (dateRange?.from) {
          // Format date as YYYY-MM-DD without timezone conversion
          fromDateStr = format(dateRange.from, 'yyyy-MM-dd');
        }
        
        if (dateRange?.to) {
          // Format date as YYYY-MM-DD without timezone conversion
          toDateStr = format(dateRange.to, 'yyyy-MM-dd');
        }
        
        console.log(`Fetching data for range: ${fromDateStr} to ${toDateStr}`);
        
        const response = await fetch(`/api/dashboard?from=${fromDateStr}&to=${toDateStr}&task=${taskFilter}`);
        
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

    // Only fetch data for the overall tab
    if (activeTab === "overall") {
      fetchDashboardData();
    }
  }, [dateRange, toast, taskFilter, activeTab]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    console.log('Date range changed:', range);
    setDateRange(range);
  };

  const handleTaskFilterChange = (value: string) => {
    setTaskFilter(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center flex-wrap justify-between gap-4">
        <div className="text-2xl font-medium text-default-800">
          Warehouse Performance Metrics Dashboard
        </div>
        {activeTab === "overall" && (
          <div className="flex gap-4">
            <Select value={taskFilter} onValueChange={handleTaskFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Task" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="INDUCTOR">Inductor</SelectItem>
                <SelectItem value="STOWER">Stower</SelectItem>
                <SelectItem value="DOWNSTACKER">Downstacker</SelectItem>
              </SelectContent>
            </Select>
            <DatePickerWithRange value={dateRange} onChange={handleDateRangeChange} />
          </div>
        )}
      </div>
      
      <Tabs defaultValue="overall" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overall">Overall Efficiency</TabsTrigger>
          <TabsTrigger value="daily">Daily Performance</TabsTrigger>
        </TabsList>
      
        <TabsContent value="overall">
          {loading ? (
            <div className="flex justify-center items-center h-[50vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Package Metrics Overview */}
              <div className="grid grid-cols-12 gap-3 mb-3">
                <div className="col-span-12 lg:col-span-8">
                  <ReportsSnapshot metrics={metrics?.packageMetrics} />
                </div>
                <div className="col-span-12 lg:col-span-4">
                  <UsersStat employeeStats={metrics?.employeeStats} />
                </div>
              </div>

              {/* Role Performance Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ReportsArea metrics={metrics?.keyMetrics} />
                </div>
                <Card>
                  <CardHeader className="border-none p-6 pt-5 mb-0">
                    <CardTitle className="text-lg font-semibold text-default-900 p-0">
                      Performance by Role
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RoleStats rolePerformance={metrics?.rolePerformance} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="border-none p-6 pt-5 mb-0">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-semibold text-default-900 p-0">
                        Role Distribution
                      </CardTitle>
                      {dateRange?.from && dateRange?.to && (
                        <span className="text-xs text-muted-foreground">
                          {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <RoleDistributionChart roleData={metrics?.roleDistributionData} />
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Employee Performance */}
              <div className="grid grid-cols-12 gap-3 mb-3">
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
        </TabsContent>
        
        <TabsContent value="daily">
          <div className="container mx-auto">
            <DailyPerformanceView />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPageView;