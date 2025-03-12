"use client"
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";

const ReportsArea = () => {
  const metrics = [
    {
      id: 1,
      name: "Packages/Hour",
      count: "185",
      rate: "12",
      isUp: true,
      icon: <Icon icon="material-symbols:package" className="h-4 w-4" />,
      color: "primary",
    },
    {
      id: 2,
      name: "Stower Efficiency",
      count: "92%",
      rate: "5",
      isUp: true,
      icon: <Icon icon="mdi:account-group" className="h-4 w-4" />,
      color: "info",
    },
    {
      id: 3,
      name: "Error Rate",
      count: "0.8%",
      rate: "15",
      isUp: false,
      icon: <Icon icon="mdi:alert-circle-outline" className="h-4 w-4" />,
      color: "warning",
    },
    {
      id: 4,
      name: "Queue Time",
      count: "4.2m",
      rate: "30",
      isUp: false,
      icon: <Icon icon="mdi:timer-sand" className="h-4 w-4" />,
      color: "destructive",
    },
  ];

  return (
    <>
      {metrics.map((item, index) => (
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