"use client";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

import { useThemeStore } from "@/store";
import { useTheme } from "next-themes";
import { themes } from "@/config/thems";

interface RolePerformance {
  categories: string[];
  series: {
    name: string;
    data: number[];
  }[];
}

interface RoleStatsProps {
  rolePerformance?: RolePerformance;
  height?: number;
}

const RoleStats = ({ rolePerformance, height = 250 }: RoleStatsProps) => {
  const { theme: config } = useThemeStore();
  const { theme: mode } = useTheme();
  const theme = themes.find((theme) => theme.name === config);

  // Default data if none provided
  const defaultCategories = ["Inductor", "Stower", "Downstacker"];
  const defaultSeries = [
    {
      name: "Actual",
      data: [0, 0, 0]
    },
    {
      name: "Target",
      data: [180, 140, 90]
    }
  ];

  // Use provided data or fallback to defaults
  const categories = rolePerformance?.categories || defaultCategories;
  const series = rolePerformance?.series || defaultSeries;

  const options: any = {
    chart: {
      type: 'bar',
      height: height,
      toolbar: {
        show: false,
      },
      stacked: false,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 5,
      },
    },
    dataLabels: {
      enabled: false
    },
    grid: {
      borderColor: "#f1f1f1",
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10
      }
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: Array(8).fill(
            `hsl(${theme?.cssVars[
              mode === "dark" || mode === "system" ? "dark" : "light"
            ].chartLabel})`
          ),
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: [
            `hsl(${theme?.cssVars[
              mode === "dark" || mode === "system" ? "dark" : "light"
            ].chartLabel})`
          ],
        },
      },
    },
    legend: {
      labels: {
        colors: [
          `hsl(${theme?.cssVars[
            mode === "dark" || mode === "system" ? "dark" : "light"
          ].chartLabel})`
        ],
      },
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + " packages/hr";
        }
      }
    },
    fill: {
      opacity: 1
    },
    colors: [
      `hsl(${theme?.cssVars[mode === "dark" ? "dark" : "light"].primary})`,
      `hsl(${theme?.cssVars[mode === "dark" ? "dark" : "light"].success})`,
    ],
  };

  return (
    <Chart
      options={options}
      series={series}
      type="bar"
      height={height}
      width={"100%"}
    />
  );
};

export default RoleStats;