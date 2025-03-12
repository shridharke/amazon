"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";

interface MetricItem {
  id: number;
  name: string;
  count: string;
  rate: string;
  isUp: boolean;
  color: string;
  icon?: React.ReactNode;
}

interface ReportsAreaProps {
  metrics?: MetricItem[];
}

const ReportsArea = ({ metrics }: ReportsAreaProps) => {
  // Default icons for metrics if not provided
  const getIconForMetric = (name: string) => {
    switch (name.toLowerCase()) {
      case "packages/hour":
        return <Icon icon="material-symbols:package" className="h-4 w-4" />;
      case "stower efficiency":
        return <Icon icon="mdi:account-group" className="h-4 w-4" />;
      case "error rate":
        return <Icon icon="mdi:alert-circle-outline" className="h-4 w-4" />;
      case "queue time":
        return <Icon icon="mdi:timer-sand" className="h-4 w-4" />;
      default:
        return <Icon icon="mdi:chart-line" className="h-4 w-4" />;
    }
  };

  // Default metrics if none are provided
  const defaultMetrics = [
    {
      id: 1,
      name: "Packages/Hour",
      count: "0",
      rate: "0",
      isUp: true,
      color: "primary",
    },
    {
      id: 2,
      name: "Stower Efficiency",
      count: "0%",
      rate: "0",
      isUp: true,
      color: "info",
    },
    {
      id: 3,
      name: "Error Rate",
      count: "0%",
      rate: "0",
      isUp: false,
      color: "warning",
    },
    {
      id: 4,
      name: "Queue Time",
      count: "0m",
      rate: "0",
      isUp: false,
      color: "destructive",
    },
  ];

  // Use provided metrics or fallback to defaults
  const metricsToRender = metrics || defaultMetrics;

  // Add icons if not present
  const enrichedMetrics = metricsToRender.map(metric => ({
    ...metric,
    icon: getIconForMetric(metric.name)
  }));

  return (
    <>
      {enrichedMetrics.map((item, index) => (
        <Card key={`metric-card-${index}`}>
          <CardHeader className="flex-col-reverse sm:flex-row flex-wrap gap-2 border-none mb-0 pb-0">
            <span className="text-sm font-medium text-default-900 flex-1">{item.name}</span>
            <span className={cn("flex-none h-9 w-9 flex justify-center items-center bg-default-100 rounded-full", {
              "bg-primary bg-opacity-10 text-primary": item.color === "primary",
              "bg-info bg-opacity-10 text-info": item.color === "info",
              "bg-warning bg-opacity-10 text-warning": item.color === "warning",
              "bg-destructive bg-opacity-10 text-destructive": item.color === "destructive",
            })}>{item.icon}</span>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <div className="text-2xl font-semibold text-default-900 mb-2.5">{item.count}</div>
            <div className="flex items-center font-semibold gap-1">
              {
                item.isUp ? (
                  <>
                    <span className={item.color === "warning" || item.color === "destructive" ? "text-destructive" : "text-success"}>
                      {item.rate}%
                    </span>
                    <Icon 
                      icon="heroicons:arrow-trending-up-16-solid" 
                      className={item.color === "warning" || item.color === "destructive" ? "text-destructive text-xl" : "text-success text-xl"} 
                    />
                  </>
                ) : (
                  <>
                    <span className={item.color === "warning" || item.color === "destructive" ? "text-success" : "text-destructive"}>
                      {item.rate}%
                    </span>
                    <Icon 
                      icon="heroicons:arrow-trending-down-16-solid" 
                      className={item.color === "warning" || item.color === "destructive" ? "text-success text-xl" : "text-destructive text-xl"} 
                    />
                  </>
                )
              }
            </div>
            <div className="mt-1 text-xs text-default-600">vs Previous Shift</div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export default ReportsArea;