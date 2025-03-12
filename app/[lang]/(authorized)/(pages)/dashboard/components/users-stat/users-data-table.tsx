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

interface RoleMetric {
  id: number;
  role: string;
  current: string;
  target: string;
}

interface RoleMetricsTableProps {
  metrics: RoleMetric[];
}

const RoleMetricsTable = ({ metrics }: RoleMetricsTableProps) => {
  return (
    <div className="h-[250px]">
      <ScrollArea className="h-full">
        <Table className="border border-default-200">
          <TableHeader>
            <TableRow className="border-b border-default-200">
              <TableHead className="text-sm h-10 font-medium text-default-800">Role</TableHead>
              <TableHead className="text-sm h-10 font-medium text-default-800 text-right">Current</TableHead>
              <TableHead className="text-sm h-10 font-medium text-default-800 text-right">Target</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((item) => (
              <TableRow key={item.id} className="border-b border-default-200">
                <TableCell className="text-xs text-default-600 py-2">{item.role}</TableCell>
                <TableCell className={`text-xs py-2 text-right ${
                  parseInt(item.current) >= parseInt(item.target) ? 'text-success' : 'text-warning'
                }`}>
                  {item.current}
                </TableCell>
                <TableCell className="text-xs text-default-600 text-right pr-6 py-2">
                  {item.target}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};

export default RoleMetricsTable;