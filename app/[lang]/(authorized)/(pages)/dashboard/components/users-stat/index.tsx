"use client"
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import PackageRateChart from "./users-data-chart";
import RoleMetricsTable from "./users-data-table";

interface RoleMetric {
  id: number;
  role: string;
  current: string;
  target: string;
}

const PackageStats = () => {
  const roleMetrics: RoleMetric[] = [
    {
      id: 1,
      role: "Inductor",
      current: "1934",
      target: "2000",
    },
    {
      id: 2,
      role: "Primary Downstacker",
      current: "1100",
      target: "1200",
    },
    {
      id: 3,
      role: "Secondary Downstacker",
      current: "834",
      target: "800",
    },
    {
      id: 4,
      role: "Stower (Average)",
      current: "185",
      target: "170",
    },
    {
      id: 5,
      role: "Overall Efficiency",
      current: "96%",
      target: "95%",
    },
  ];

  return (
    <Card>
      <CardHeader className="border-none pb-0 mb-5">
        <div className="flex items-center gap-1">
          <div className="flex-1">
            <div className="text-xl font-semibold text-default-900">Current Shift Performance</div>
            <span className="text-xs text-default-600 ml-1">Last 30 Minutes Rate</span>
          </div>
          <div className="flex-none flex items-center gap-1">
            <span className="text-4xl font-semibold text-primary">193</span>
            <span className="text-2xl text-success">
              <Icon icon="heroicons:arrow-trending-up-16-solid" />
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-0">
        <p className="text-xs font-medium text-default-800">Packages Per Minute</p>
        <PackageRateChart />
        <RoleMetricsTable metrics={roleMetrics} />
      </CardContent>
    </Card>
  );
};

export default PackageStats;