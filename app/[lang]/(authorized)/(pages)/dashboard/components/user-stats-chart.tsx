"use client";

import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useThemeStore } from "@/store";
import { useTheme } from "next-themes";
import { themes } from "@/config/thems";

const RoleStats = ({ height = 250 }) => {
  const { theme: config, setTheme: setConfig, isRtl } = useThemeStore();
  const { theme: mode } = useTheme();
  const theme = themes.find((theme) => theme.name === config);

  // Sample data for packages handled by each role
  const series = [1934, 1100, 834]; // Inductor, Primary Downstacker, Secondary Downstacker

  const options: any = {
    chart: {
      toolbar: {
        show: false,
      },
    },
    labels: ["Inductor", "Primary Downstacker", "Secondary Downstacker"],
    dataLabels: {
      enabled: false,
    },
    colors: [
      `hsl(${theme?.cssVars[mode === "dark" ? "dark" : "light"].primary})`,
      `hsl(${theme?.cssVars[mode === "dark" ? "dark" : "light"].info})`,
      `hsl(${theme?.cssVars[mode === "dark" ? "dark" : "light"].warning})`,
    ],
    tooltip: {
      theme: mode === "dark" ? "dark" : "light",
      y: {
        formatter: function(value: number) {
          return value + " packages";
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
              fontSize: "14px",
              fontWeight: 600,
              colors: `hsl(${theme?.cssVars[
                mode === "dark" || mode === "system" ? "dark" : "light"
              ].chartLabel})`,
            },
            value: {
              show: true,
              fontSize: "14px",
              fontWeight: 600,
              color: `hsl(${theme?.cssVars[
                mode === "dark" || mode === "system" ? "dark" : "light"
              ].chartLabel})`,
              formatter: function(val: number) {
                return val + " pkgs";
              }
            },
            total: {
              show: true,
              label: "Total Packages",
              fontSize: "16px",
              fontWeight: 600,
              color: `hsl(${theme?.cssVars[
                mode === "dark" || mode === "system" ? "dark" : "light"
              ].chartLabel})`,
              formatter: function(w: any) {
                return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0) + " pkgs";
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
        ].chartLabel})`,
      },
      itemMargin: {
        horizontal: 10,
        vertical: 8,
      },
      markers: {
        width: 10,
        height: 10,
        radius: 10,
        offsetX: isRtl ? 5 : -5
      },
      formatter: function(seriesName: string, opts: any) {
        return seriesName + ":  " + opts.w.globals.series[opts.seriesIndex] + " pkgs";
      }
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

export default RoleStats;