"use client";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useThemeStore } from "@/store";
import { useTheme } from "next-themes";
import { themes } from "@/config/thems";
import { format, parseISO } from "date-fns";

interface ReportsChartProps {
  series: { data: number[] }[];
  chartColor: string;
  categories?: string[];
  height?: number;
}

const ReportsChart = ({ series, chartColor, categories = [], height = 300 }: ReportsChartProps) => {
  const { isRtl } = useThemeStore();
  const { theme: mode } = useTheme();

  // If no data provided or empty arrays, show a placeholder
  const hasData = series.length > 0 && series[0].data && series[0].data.length > 0;
  
  // Format dates for display
  const formattedCategories = categories.map(dateStr => {
    try {
      return format(parseISO(dateStr), "MMM dd");
    } catch (e) {
      return dateStr;
    }
  });

  const options: any = {
    chart: {
      height: height,
      type: "area",
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    colors: [chartColor],
    xaxis: {
      categories: formattedCategories.length > 0 ? formattedCategories : undefined,
      labels: {
        style: {
          colors: "#999",
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      tickAmount: 4,
      floating: false,
      min: hasData ? Math.max(0, Math.min(...series[0].data) * 0.8) : 0,
      max: hasData ? Math.max(...series[0].data) * 1.2 : 100,
      labels: {
        style: {
          colors: "#999",
        },
      },
    },
    tooltip: {
      theme: mode === "dark" ? "dark" : "light",
      x: {
        format: "dd/MM/yy"
      }
    },
    grid: {
      borderColor: "rgba(0,0,0,0.1)",
      strokeDashArray: 3,
      yaxis: {
        lines: {
          show: true,
        },
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10,
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.5,
        gradientToColors: undefined,
        inverseColors: true,
        opacityFrom: 0.8,
        opacityTo: 0.2,
        stops: [0, 100],
        colorStops: []
      }
    },
    legend: {
      show: false
    },
    responsive: [
      {
        breakpoint: 600,
        options: {
          chart: {
            height: 240,
          },
          yaxis: {
            show: false,
          },
        },
      },
    ],
  };
  
  // Display a placeholder if no data
  if (!hasData) {
    return (
      <div className="flex justify-center items-center h-64 text-default-500">
        No data available for this time period
      </div>
    );
  }

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