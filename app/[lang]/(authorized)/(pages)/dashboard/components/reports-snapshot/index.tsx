"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportsChart from "./reports-chart";
import { useThemeStore } from "@/store";
import { useTheme } from "next-themes";
import { themes } from "@/config/thems";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import DashboardSelect from "@/components/dasboard-select";
import { cn } from "@/lib/utils";

interface ReportsSnapshotProps {
  metrics?: {
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
}

const ReportsSnapshot = ({ metrics }: ReportsSnapshotProps) => {
  const { theme: config, setTheme: setConfig } = useThemeStore();
  const { theme: mode } = useTheme();
  const theme = themes.find((theme) => theme.name === config);

  const primary = `hsl(${theme?.cssVars[mode === "dark" ? "dark" : "light"].primary})`;
  const warning = `hsl(${theme?.cssVars[mode === "dark" ? "dark" : "light"].warning})`;
  const success = `hsl(${theme?.cssVars[mode === "dark" ? "dark" : "light"].success})`;
  const info = `hsl(${theme?.cssVars[mode === "dark" ? "dark" : "light"].info})`;

  // If no metrics provided, use empty data
  const emptyData = [{ data: [] }];
  
  const totalSeries = metrics?.total?.series || emptyData;
  const inductorSeries = metrics?.inductor?.series || emptyData;
  const stowerSeries = metrics?.stower?.series || emptyData;
  const downstackerSeries = metrics?.downstacker?.series || emptyData;

  const tabsTrigger = [
    {
      value: "total",
      text: "Total Packages",
      total: metrics?.total?.current?.toLocaleString() || "0",
      color: "primary",
    },
    {
      value: "inductor",
      text: "Inductor Rate",
      total: metrics?.inductor?.current?.toLocaleString() || "0",
      color: "warning",
    },
    {
      value: "stower",
      text: "Avg Stower Rate",
      total: metrics?.stower?.current?.toLocaleString() || "0",
      color: "success",
    },
    {
      value: "downstacker",
      text: "Downstacker Rate",
      total: metrics?.downstacker?.current?.toLocaleString() || "0", 
      color: "info",
    },
  ];

  const tabsContentData = [
    {
      value: "total",
      series: totalSeries,
      dates: metrics?.total?.dates || [],
      color: primary,
    },
    {
      value: "inductor",
      series: inductorSeries,
      dates: metrics?.inductor?.dates || [],
      color: warning,
    },
    {
      value: "stower",
      series: stowerSeries,
      dates: metrics?.stower?.dates || [],
      color: success,
    },
    {
      value: "downstacker",
      series: downstackerSeries,
      dates: metrics?.downstacker?.dates || [],
      color: info,
    },
  ];

  return (
    <Card>
      <CardHeader className="border-none pb-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1">
            <div className="text-xl font-semibold text-default-900 whitespace-nowrap">
              Package Handling Metrics
            </div>
            <span className="text-xs text-default-600">
              Daily performance across all roles
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-1 md:p-5">
        <Tabs defaultValue="total">
          <TabsList className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6 justify-start w-full bg-transparent h-full">
            {tabsTrigger.map((item, index) => (
              <TabsTrigger
                key={`report-trigger-${index}`}
                value={item.value}
                className={cn(
                  "flex flex-col gap-1.5 p-4 overflow-hidden items-start relative before:absolute before:left-1/2 before:-translate-x-1/2 before:bottom-1 before:h-[2px] before:w-9 before:bg-primary/50 dark:before:bg-primary-foreground before:hidden data-[state=active]:shadow-none data-[state=active]:before:block",
                  {
                    "bg-primary/30 data-[state=active]:bg-primary/30 dark:bg-primary/70": item.color === "primary",
                    "bg-orange-50 data-[state=active]:bg-orange-50 dark:bg-orange-500": item.color === "warning",
                    "bg-green-50 data-[state=active]:bg-green-50 dark:bg-green-500": item.color === "success",
                    "bg-cyan-50 data-[state=active]:bg-cyan-50 dark:bg-cyan-500": item.color === "info",
                  }
                )}
              >
                <span
                  className={cn(
                    "h-10 w-10 rounded-full bg-primary/40 absolute -top-3 -right-3 ring-8 ring-primary/30",
                    {
                      "bg-primary/50 ring-primary/20 dark:bg-primary dark:ring-primary/40": item.color === "primary",
                      "bg-orange-200 ring-orange-100 dark:bg-orange-300 dark:ring-orange-400": item.color === "warning",
                      "bg-green-200 ring-green-100 dark:bg-green-300 dark:ring-green-400": item.color === "success",
                      "bg-cyan-200 ring-cyan-100 dark:bg-cyan-300 dark:ring-cyan-400": item.color === "info",
                    }
                  )}
                ></span>
                <span className="text-sm text-default-800 dark:text-primary-foreground font-semibold capitalize relative z-10">
                  {item.text}
                </span>
                <span className={`text-lg font-semibold text-${item.color}/80 dark:text-primary-foreground`}>
                  {item.total}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          {tabsContentData.map((item, index) => (
            <TabsContent key={`report-tab-${index}`} value={item.value}>
              <ReportsChart series={item.series} chartColor={item.color} categories={item.dates} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ReportsSnapshot;