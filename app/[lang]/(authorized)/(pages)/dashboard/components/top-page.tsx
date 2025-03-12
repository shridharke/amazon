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
import { Input } from "@/components/ui/input";

interface EmployeeData {
  id: string;
  name: string;
  role: string;
  packages: number;
  efficiency: number;
  status: string;
  link: string;
}

interface TopPageProps {
  employeeData?: EmployeeData[];
}

const TopPage = ({ employeeData = [] }: TopPageProps) => {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'efficiency', desc: true }
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [searchQuery, setSearchQuery] = React.useState("");

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
        <Link href={`/employees/${row.getValue("id")}`} className="text-primary hover:underline">Details</Link>
      ),
    }
  ];

  // Filter the data based on search query
  const filteredData = React.useMemo(() => {
    if (!searchQuery) return employeeData;
    return employeeData.filter(employee => 
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [employeeData, searchQuery]);

  const table = useReactTable<EmployeeData>({
    data: filteredData,
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
      <div className="p-4">
        <Input
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-80 mb-4"
        />
      </div>
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
                  No results found.
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
};

export default TopPage;