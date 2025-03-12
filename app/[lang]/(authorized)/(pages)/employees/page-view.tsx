"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useOrgStore } from "@/store/index";
import { useEmployeeStore } from "@/store/employee-store";
import EmployeeList from "./components/employee-list";
import CreateEmployeeModal from "./components/create-employee";
import EditEmployeeModal from "./components/edit-employee";
import { Employee } from "@prisma/client";
import { EmployeeService } from "@/services/employee-service";

const EmployeePageView = () => {
    const { selectedOrg } = useOrgStore();
    const {
        employees,
        setEmployees,
        isCreateModalOpen,
        setCreateModalOpen,
        isEditModalOpen,
        setEditModalOpen,
        selectedEmployee,
        setSelectedEmployee,
    } = useEmployeeStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchEmployees();
        setRefreshing(false);
    };

    const fetchEmployees = async () => {
        if (!selectedOrg) return;
        setLoading(true);
        try {
            const result = await EmployeeService.getEmployees(selectedOrg.id);
            if (result.success && result.data) {
                setEmployees(result.data);
            } else {
                setEmployees(null);
                toast.error(result.error || "Failed to fetch employees");
            }
        } catch (error) {
            console.error("Failed to fetch employees:", error);
            setEmployees(null);
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedOrg) {
            fetchEmployees();
        }
    }, [selectedOrg]);

    const handleEdit = (employee: Employee) => {
        setSelectedEmployee(employee);
        setEditModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center w-full">
                        <CardTitle className="p-2">Employees</CardTitle>
                        <div className="flex space-x-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={refreshing}
                            >
                                <RefreshCw
                                    className={`h-4 w-4 mr-2 ${
                                        refreshing ? "animate-spin" : ""
                                    }`}
                                />
                                Refresh
                            </Button>
                            <Button
                                onClick={() => setCreateModalOpen(true)}
                                disabled={!selectedOrg}
                                size="sm"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Employee
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <EmployeeList
                        employees={employees || []}
                        loading={loading}
                        onEdit={handleEdit}
                        onRefresh={fetchEmployees}
                    />
                </CardContent>
            </Card>

            {selectedOrg && (
                <>
                    <CreateEmployeeModal
                        open={isCreateModalOpen}
                        onClose={() => setCreateModalOpen(false)}
                        organizationId={selectedOrg.id}
                        onSuccess={fetchEmployees}
                    />

                    {selectedEmployee && (
                        <EditEmployeeModal
                            open={isEditModalOpen}
                            onClose={() => {
                                setEditModalOpen(false);
                                setSelectedEmployee(null);
                            }}
                            employee={selectedEmployee}
                            onSuccess={fetchEmployees}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default EmployeePageView;