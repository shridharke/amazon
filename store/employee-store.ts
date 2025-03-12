import { create } from "zustand";
import { Employee, EmployeeType } from "@prisma/client";

interface EmployeeState {
  employees: Employee[] | null;
  setEmployees: (employees: Employee[] | null) => void;
  selectedEmployee: Employee | null;
  setSelectedEmployee: (employee: Employee | null) => void;
  isCreateModalOpen: boolean;
  setCreateModalOpen: (isOpen: boolean) => void;
  isEditModalOpen: boolean;
  setEditModalOpen: (isOpen: boolean) => void;
}

export const useEmployeeStore = create<EmployeeState>((set) => ({
  employees: null,
  setEmployees: (employees) => set((state) => ({ ...state, employees })),
  selectedEmployee: null,
  setSelectedEmployee: (employee) => set((state) => ({ ...state, selectedEmployee: employee })),
  isCreateModalOpen: false,
  setCreateModalOpen: (isOpen) => set((state) => ({ ...state, isCreateModalOpen: isOpen })),
  isEditModalOpen: false,
  setEditModalOpen: (isOpen) => set((state) => ({ ...state, isEditModalOpen: isOpen })),
}));