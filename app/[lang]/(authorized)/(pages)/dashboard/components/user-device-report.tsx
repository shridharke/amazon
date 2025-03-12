"use client";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

import { useThemeStore } from "@/store";
import { useTheme } from "next-themes";
import { themes } from "@/config/thems";

const StowerPerformanceReport = ({ height = 250 }) => {
  const { theme: config, setTheme: setConfig, isRtl } = useThemeStore();
  const { theme: mode } = useTheme();
  const theme = themes.find((theme) => theme.name === config);
  
  // Distribution of stower performance
  // High performers: >200 packages
  // Average: 110-200 packages
  // Below target: <110 packages
  const series = [4, 7, 1]; // Number of stowers in each category

  const options: any = {
    chart: {
      toolbar: {
        show: false,
      },
    },
    labels: ["High Performers (200+)", "Average (110-200)", "Below Target (<110)"],
    dataLabels: {
      enabled: false,
    },
    colors: [
      `hsl(${theme?.cssVars[mode === "dark" ? "dark" : "light"].success})`,
      `hsl(${theme?.cssVars[mode === "dark" ? "dark" : "light"].primary})`,
      `hsl(${theme?.cssVars[mode === "dark" ? "dark" : "light"].destructive})`
    ],
    tooltip: {
      theme: mode === "dark" ? "dark" : "light",
      y: {
        formatter: function(value: number) {
          return value + " stowers";
        }
      }
    },
    stroke: {
      width: 0
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "24px",
              fontWeight: 500,
              color: `hsl(${theme?.cssVars[
                mode === "dark" || mode === "system" ? "dark" : "light"
              ].chartLabel})`
            },
            value: {
              show: true,
              fontSize: "18px",
              fontWeight: 600,
              color: `hsl(${theme?.cssVars[
                mode === "dark" || mode === "system" ? "dark" : "light"
              ].chartLabel})`,
              formatter: function(val: number) {
                return val + " stowers";
              }
            },
            total: {
              show: true,
              label: "Total Stowers",
              fontSize: "16px",
              fontWeight: 600,
              color: `hsl(${theme?.cssVars[
                mode === "dark" || mode === "system" ? "dark" : "light"
              ].chartLabel})`,
              formatter: function(w: any) {
                return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
              }
            },
          },
        },
      },
    },
    legend: {
      position: "bottom",
      labels: {
        colors: `hsl(${theme?.cssVars[
          mode === "dark" || mode === "system" ? "dark" : "light"
        ].chartLabel})`
      },
      formatter: function(seriesName: string, opts: any) {
        return seriesName + ": " + opts.w.globals.series[opts.seriesIndex] + " stowers";
      },
      itemMargin: {
        horizontal: 5,
        vertical: 5,
      },
      markers: {
        width: 10,
        height: 10,
        radius: 10,
        offsetX: isRtl ? 5 : -5
      },
    },
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  };

  return (
    <Chart
      options={options}
      series={series}
      type="donut"
      height={height}
      width={"100%"}
    />
  );
};

export default StowerPerformanceReport;