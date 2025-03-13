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
      case "avg efficiency":
        return <Icon icon="mdi:account-group" className="h-4 w-4" />;
      case "completion rate":
        return <Icon icon="mdi:check-circle-outline" className="h-4 w-4" />;
      case "fixed vs flex":
        return <Icon icon="mdi:account-switch" className="h-4 w-4" />;
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
      name: "Avg Efficiency",
      count: "0%",
      rate: "0",
      isUp: true,
      color: "info",
    },
    {
      id: 3,
      name: "Completion Rate",
      count: "0%",
      rate: "0",
      isUp: false,
      color: "success",
    },
    {
      id: 4,
      name: "Fixed vs Flex",
      count: "0:0",
      rate: "0",
      isUp: true,
      color: "warning",
    },
  ];

  // Use provided metrics or fallback to defaults
  const metricsToRender = metrics || defaultMetrics;

  // Add icons if not present
  const enrichedMetrics = metricsToRender.map(metric => ({
    ...metric,
    icon:getIconForMetric(metric.name)
  }));

  // Helper function to get appropriate context label based on metric name
  const getComparisonLabel = (metricName: string) => {
    switch (metricName.toLowerCase()) {
      case "packages/hour":
      case "avg efficiency":
      case "completion rate":
        return "vs Period Average";
      case "fixed vs flex":
        return "Current Ratio";
      default:
        return "vs Previous Period";
    }
  };

  return (
    <>
      {enrichedMetrics.map((item, index) => (
        <Card key={`metric-card-${index}`}>
          <CardHeader className="flex-col-reverse sm:flex-row flex-wrap gap-2 border-none mb-0 pb-0">
            <span className="text-sm font-medium text-default-900 flex-1">{item.name}</span>
            <span className={cn("flex-none h-9 w-9 flex justify-center items-center bg-default-100 rounded-full", {
              "bg-primary bg-opacity-10 text-primary": item.color === "primary",
              "bg-info bg-opacity-10 text-info": item.color === "info",
              "bg-success bg-opacity-10 text-success": item.color === "success",
              "bg-warning bg-opacity-10 text-warning": item.color === "warning",
              "bg-destructive bg-opacity-10 text-destructive": item.color === "destructive",
            })}>{item.icon}</span>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <div className="text-2xl font-semibold text-default-900 mb-2.5">{item.count}</div>
            
            {/* Conditional rendering based on metric type */}
            {item.name.toLowerCase() === "fixed vs flex" ? (
              <div className="mt-1 text-xs text-default-600">
                {item.rate !== "0" ? `${item.rate}% ${item.isUp ? "more fixed than flex" : "more flex than fixed"}` : "Equal distribution"}
              </div>
            ) : (
              <div className="flex items-center font-semibold gap-1">
                {item.isUp ? (
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
                )}
              </div>
            )}
            
            <div className="mt-1 text-xs text-default-600">
              {getComparisonLabel(item.name)}
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export default ReportsArea;