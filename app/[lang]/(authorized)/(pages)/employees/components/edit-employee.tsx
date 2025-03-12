"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EmployeeForm, { EmployeeFormData } from "./employee-form";
import { Employee } from "@prisma/client";

interface EditEmployeeModalProps {
  open: boolean;
  onClose: () => void;
  employee: Employee;
  onSuccess: () => Promise<void>;
}

const EditEmployeeModal = ({
  open,
  onClose,
  employee,
  onSuccess,
}: EditEmployeeModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: EmployeeFormData) => {
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);
    
    const loadingToast = toast.loading('Updating employee...');
    
    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          type: data.type,
          workDays: data.workDays,
        }),
      });

      const result = await response.json();

      console.log("Result - ", result);

      if (response.ok) {
        toast.success(`Employee ${data.name} updated successfully`, {
          id: loadingToast,
        });
        await onSuccess(); // Refresh the data first
        onClose(); // Then close the modal
      } else {
        toast.error(result.message || "Failed to update employee", {
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error("Failed to update employee:", error);
      toast.error("An unexpected error occurred", {
        id: loadingToast,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!isSubmitting && !open) { // Only allow closing if not submitting
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Employee: {employee.name}</DialogTitle>
        </DialogHeader>
        <EmployeeForm
          defaultValues={employee}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditEmployeeModal;