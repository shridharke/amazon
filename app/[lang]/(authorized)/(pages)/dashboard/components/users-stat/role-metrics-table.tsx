"use client"

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RoleMetric {
  id: number;
  role: string;
  assigned: string;
  high: string;
  medium: string;
  low: string;
}

interface RoleMetricsTableProps {
  metrics: RoleMetric[];
}

const RoleMetricsTable = ({ metrics }: RoleMetricsTableProps) => {
  return (
    <div className="relative h-[250px] w-full overflow-auto">
      <div className="min-w-[600px]">
        <Table className="border border-default-200">
          <TableHeader>
            <TableRow className="border-b border-default-200">
              <TableHead className="text-sm h-10 font-medium text-default-800">Role</TableHead>
              <TableHead className="text-sm h-10 font-medium text-default-800 text-center">Assigned</TableHead>
              <TableHead className="text-sm h-10 font-medium text-default-800 text-center">High</TableHead>
              <TableHead className="text-sm h-10 font-medium text-default-800 text-center">Medium</TableHead>
              <TableHead className="text-sm h-10 font-medium text-default-800 text-center">Low</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((item) => (
              <TableRow key={item.id} className="border-b border-default-200">
                <TableCell className="text-sm font-medium text-default-800 py-3">
                  <Badge
                    className={cn("font-normal", {
                      "bg-primary text-primary-foreground": item.role === "Inductor",
                      "bg-warning text-warning-foreground": item.role === "Stower",
                      "bg-info text-info-foreground": item.role === "Downstacker",
                    })}
                  >
                    {item.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm py-3 text-center font-semibold text-default-800">
                  {item.assigned}
                </TableCell>
                <TableCell className="text-sm py-3 text-center text-success font-medium">
                  {item.high}
                </TableCell>
                <TableCell className="text-sm py-3 text-center text-warning font-medium">
                  {item.medium}
                </TableCell>
                <TableCell className="text-sm py-3 text-center text-destructive font-medium">
                  {item.low}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="text-sm font-bold py-3 text-default-800">Total</TableCell>
              <TableCell className="text-sm py-3 text-center font-bold text-default-800">
                {metrics.reduce((sum, item) => sum + parseInt(item.assigned), 0)}
              </TableCell>
              <TableCell className="text-sm py-3 text-center font-bold text-success">
                {metrics.reduce((sum, item) => sum + parseInt(item.high), 0)}
              </TableCell>
              <TableCell className="text-sm py-3 text-center font-bold text-warning">
                {metrics.reduce((sum, item) => sum + parseInt(item.medium), 0)}
              </TableCell>
              <TableCell className="text-sm py-3 text-center font-bold text-destructive">
                {metrics.reduce((sum, item) => sum + parseInt(item.low), 0)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RoleMetricsTable;