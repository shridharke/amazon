"use client";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useThemeStore } from "@/store";
import { useTheme } from "next-themes";
import { themes } from "@/config/thems";
import {
  getGridConfig,
  getXAxisConfig,
  getYAxisConfig,
} from "@/lib/appex-chart-options";

interface ReportsChartProps {
  series: ApexAxisChartSeries;
  chartColor: string;
  height?: number;
}

const ReportsChart = ({ series, chartColor, height = 300 }: ReportsChartProps) => {
  const { theme: config, setTheme: setConfig } = useThemeStore();
  const { theme: mode } = useTheme();

  const theme = themes.find((theme) => theme.name === config);

  const options: any = {
    chart: {
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      }
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 4,
    },
    colors: [chartColor],
    tooltip: {
      theme: mode === "dark" ? "dark" : "light",
      y: {
        formatter: function(value: number) {
          return value + " packages";
        }
      }
    },
    grid: getGridConfig(
      `hsl(${theme?.cssVars[mode === "dark" ? "dark" : "light"].chartGird})`
    ),
    fill: {
      type: "gradient",
      colors: chartColor,
      gradient: {
        shadeIntensity: 0.1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [50, 100, 0],
      },
    },
    yaxis: {
      ...getYAxisConfig(
        `hsl(${theme?.cssVars[mode === "dark" ? "dark" : "light"].chartLabel})`
      ),
      title: {
        text: 'Packages',
        style: {
          color: `hsl(${theme?.cssVars[mode === "dark" ? "dark" : "light"].chartLabel})`
        }
      },
      min: function(min: number) {
        return min * 0.8;
      },
      max: function(max: number) {
        return max * 1.2;
      }
    },
    xaxis: {
      ...getXAxisConfig(
        `hsl(${theme?.cssVars[mode === "dark" ? "dark" : "light"].chartLabel})`
      ),
      categories: ['30 Jan 25', '31 Jan 25', '3 Feb 25', '4 Feb 25', '5 Feb 25', '6 Feb 25', '7 Feb 25', '10 Feb 25', '11 Feb 25', '12 Feb 25'],
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
      type="area"
      height={height}
      width={"100%"}
    />
  );
};

export default ReportsChart;