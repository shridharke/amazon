"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EmployeeForm, { EmployeeFormData } from "./employee-form";

interface CreateEmployeeModalProps {
  open: boolean;
  onClose: () => void;
  organizationId: number;
  onSuccess: () => Promise<void>;
}

const CreateEmployeeModal = ({
  open,
  onClose,
  organizationId,
  onSuccess,
}: CreateEmployeeModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: EmployeeFormData) => {
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);
    
    const loadingToast = toast.loading('Creating employee...');
    
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          organizationId,
        }),
      });

      const result = await response.json();

      console.log("Result - ", result);

      if (response.ok) {
        toast.success(`Employee ${data.name} created successfully`, {
          id: loadingToast,
        });
        await onSuccess(); // Refresh the data first
        onClose(); // Then close the modal
      } else {
        toast.error(result.message || 'Failed to create employee', {
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error("Failed to create employee:", error);
      toast.error('Network error occurred while creating employee', {
        id: loadingToast,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!isSubmitting && !open) { // Only allow closing if not submitting
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        <EmployeeForm
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateEmployeeModal;