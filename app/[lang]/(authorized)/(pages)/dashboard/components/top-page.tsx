"use client";
import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface EmployeeData {
  id: string;
  name: string;
  role: string;
  packages: number;
  efficiency: number;
  status: string;
  link: string;
}

const columns: ColumnDef<EmployeeData>[] = [
  {
    accessorKey: "name",
    header: "Employee",
    cell: ({ row }) => (
      <div className="flex gap-4">
        <span className="text-default-600">{row.getValue("id")}</span>
        <span>{row.getValue("name")}</span>
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <div className="capitalize">
        {row.getValue("role")}
      </div>
    ),
  },
  {
    accessorKey: "packages",
    header: "Packages",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <span>{row.getValue("packages")}</span>
      </div>
    ),
  },
  {
    accessorKey: "efficiency",
    header: "Efficiency",
    cell: ({ row }) => {
      const efficiency = row.getValue("efficiency") as number;
      return (
        <div className={cn("flex items-center gap-1", {
          "text-success": efficiency >= 95,
          "text-warning": efficiency >= 85 && efficiency < 95,
          "text-destructive": efficiency < 85
        })}>
          {efficiency}%
          <Icon 
            icon={efficiency >= 90 ? "heroicons:arrow-trending-up" : "heroicons:arrow-trending-down"} 
            className="w-4 h-4"
          />
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <div className={cn("px-2 py-1 rounded-full text-xs text-center", {
          "bg-success/20 text-success": status === "On Target",
          "bg-warning/20 text-warning": status === "Below Target",
          "bg-destructive/20 text-destructive": status === "Needs Improvement"
        })}>
          {status}
        </div>
      );
    },
  },
  {
    accessorKey: "id",
    header: "Action",
    cell: ({ row }) => (
      <Link href="#" className="text-primary hover:underline">Details</Link>
    )
  }
];

// Sample warehouse employee data
const employeeData: EmployeeData[] = [
  {
    id: "01",
    name: "John Smith",
    role: "Inductor",
    packages: 1934,
    efficiency: 97,
    status: "On Target",
    link: "/"
  },
  {
    id: "02",
    name: "Sarah Johnson",
    role: "Primary Downstacker",
    packages: 1100,
    efficiency: 92,
    status: "On Target",
    link: "/"
  },
  {
    id: "03",
    name: "Mike Chen",
    role: "Secondary Downstacker",
    packages: 834,
    efficiency: 94,
    status: "On Target",
    link: "/"
  },
  {
    id: "04",
    name: "Emily Brown",
    role: "Stower",
    packages: 225,
    efficiency: 98,
    status: "On Target",
    link: "/"
  },
  {
    id: "05",
    name: "David Wilson",
    role: "Stower",
    packages: 185,
    efficiency: 95,
    status: "On Target",
    link: "/"
  },
  {
    id: "06",
    name: "Lisa Anderson",
    role: "Stower",
    packages: 170,
    efficiency: 89,
    status: "Below Target",
    link: "/"
  },
  {
    id: "07",
    name: "James Taylor",
    role: "Stower",
    packages: 165,
    efficiency: 87,
    status: "Below Target",
    link: "/"
  },
  {
    id: "08",
    name: "Maria Garcia",
    role: "Stower",
    packages: 62,
    efficiency: 75,
    status: "Needs Improvement",
    link: "/"
  }
];

const EmployeePerformance = () => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const table = useReactTable<EmployeeData>({
    data: employeeData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-default-300">
            {table.getHeaderGroups().map((headerGroup, index) => (
              <TableRow key={`employee-headerGroup-${index}`}>
                {headerGroup.headers.map((header, index) => (
                  <TableHead
                    key={`employee-header-${index}`}
                    className="text-sm font-semibold text-default-600 bg-default-200 h-12 last:text-end last:pr-7"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="[&_tr:last-child]:border-1">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={`employee-row-${index}`}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-default-50"
                >
                  {row.getVisibleCells().map((cell, index) => (
                    <TableCell
                      key={`employee-cell-${index}`}
                      className="text-sm text-default-700 border-b border-default-100 dark:border-default-200 last:text-end last:pr-6"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        <Button
          size="icon"
          className="h-7 w-7 bg-default-100 text-default-600 hover:text-primary-foreground"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <Icon icon="heroicons:chevron-left" className="w-3.5 h-3.5 rtl:rotate-180" />
        </Button>
        <ul className="flex space-x-3 rtl:space-x-reverse items-center">
          {table.getPageOptions().map((page, pageIndex) => (
            <li key={pageIndex}>
              <Button
                onClick={() => table.setPageIndex(pageIndex)}
                aria-current="page"
                className={cn("h-7 w-7 bg-default-100 text-default-600 p-0 hover:bg-opacity-70 hover:text-primary-foreground", {
                  "bg-primary text-primary-foreground": pageIndex === table.getState().pagination.pageIndex
                })}
              >
                {page + 1}
              </Button>
            </li>
          ))}
        </ul>
        <Button
          size="icon"
          className="h-7 w-7 bg-default-100 text-default-600 hover:text-primary-foreground"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <Icon icon="heroicons:chevron-right" className="w-3.5 h-3.5 rtl:rotate-180" />
        </Button>
      </div>
    </>
  );
}

export default EmployeePerformance;