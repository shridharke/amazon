import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Edit, 
  MoreHorizontal, 
  Trash2 
} from "lucide-react";
import { Employee } from "@prisma/client";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { EmployeeService } from "@/services/employee-service";
import { toast } from "react-hot-toast";

interface EmployeeListProps {
  employees: Employee[];
  loading: boolean;
  onEdit: (employee: Employee) => void;
  onRefresh: () => Promise<void>;
}

const EmployeeList = ({ 
  employees, 
  loading, 
  onEdit,
  onRefresh 
}: EmployeeListProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;
    setDeleting(true);
  
    toast
      .promise(
        fetch(`/api/employees/${employeeToDelete.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }), {
          loading: "Deleting employee...",
          success: "Employee deleted successfully!",
          error: "Failed to delete employee.",
        }
      )
      .then(async (response) => {
        if (response.ok) {
          await onRefresh();
          setDeleteDialogOpen(false);
          setEmployeeToDelete(null);
        } else {
          console.error("Failed to delete employee:", response.status);
        }
      })
      .catch((error) => {
        console.error("An error occurred:", error);
      })
      .finally(() => {
        setDeleting(false);
      });
  };

  // Helper to parse workDays JSON
  const formatWorkDays = (workDays: string | null) => {
    if (!workDays) return "N/A";
    try {
      const days = JSON.parse(workDays);
      return Array.isArray(days) ? days.join(", ") : workDays;
    } catch (e) {
      return workDays;
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading employees...</div>;
  }

  if (employees.length === 0) {
    return <div className="text-center py-4">No employees found. Add your first employee to get started.</div>;
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Work Days</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.id}</TableCell>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>
                  <Badge variant={employee.type === "FIXED" ? "soft" : "outline"}>
                    {employee.type}
                  </Badge>
                </TableCell>
                <TableCell>{employee.type === "FIXED" ? formatWorkDays(employee.workDays) : "Flexible"}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(employee)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeleteClick(employee)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the employee "{employeeToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmployeeList;