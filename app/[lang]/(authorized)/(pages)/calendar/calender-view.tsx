"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { APIResponse, CalendarEvent, ScheduleInfo } from "@/types/schedule";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import {
  ArrowRightCircle,
  Calendar,
  Clock,
  Loader2,
  Package,
  Trash2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

interface Employee {
  id: number;
  name: string;
  type: string;
  efficiency: number;
  workDays?: string;
  overallEfficiency?: number;
}

export default function CalendarView() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<CalendarEvent[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleInfo | null>(
    null
  );
  const [packageCount, setPackageCount] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [fixedEmployees, setFixedEmployees] = useState<Employee[]>([]);
  const [remainingPackages, setRemainingPackages] = useState(0);
  const [totalEfficiency, setTotalEfficiency] = useState(0);

  const fetchFixedEmployees = async (date: Date): Promise<void> => {
    try {
      // Use the dedicated fixed employees endpoint if available
      let response: Response;
      try {
        response = await fetch(
          `/api/employees/fixed?date=${date.toISOString()}&organizationId=1`
        );
      } catch (error) {
        console.warn(
          "Fixed employees endpoint not available, falling back to all employees:",
          error
        );
        // Fallback to fetching all employees and filtering client-side
        response = await fetch(`/api/employees?organizationId=1`);
      }

      const data = await response.json();

      // If using the fallback, filter employees by type and work day
      if (!data.employees || !Array.isArray(data.employees)) {
        console.error("Invalid employee data format:", data);
        setFixedEmployees([]);
        setTotalEfficiency(0);
        return;
      }

      let fixedEmps: Employee[] = data.employees;

      // If we used the fallback endpoint, we need to filter for fixed employees and the correct day
      if (response.url.includes("/api/employees?")) {
        const dayOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][
          date.getDay()
        ];

        fixedEmps = data.employees
          .filter((emp: Employee) => {
            if (emp.type !== "FIXED") return false;

            try {
              const workDays = emp.workDays ? JSON.parse(emp.workDays) : [];
              return workDays.includes(dayOfWeek);
            } catch (e: unknown) {
              console.error(
                `Error parsing work days for employee ${emp.id}:`,
                e
              );
              return false;
            }
          })
          .map((emp: Employee) => ({
            id: emp.id,
            name: emp.name,
            type: emp.type,
            efficiency: Math.round(emp.overallEfficiency || 0),
            workDays: emp.workDays,
          }));
      }

      setFixedEmployees(fixedEmps);
      const totalEff = fixedEmps.reduce(
        (sum: number, emp: Employee) => sum + (emp.efficiency * 5 || 0),
        0
      );
      setTotalEfficiency(totalEff);
    } catch (error) {
      console.error("Error fetching fixed employees:", error);
      setFixedEmployees([]);
      setTotalEfficiency(0);
    }
  };
  const handleDateSelect = async (selectInfo: any) => {
    const selectedDate = selectInfo.start;
    setSelectedDate(selectedDate);
    setSelectedSchedule(null);

    if (selectedDate >= new Date()) {
      await fetchFixedEmployees(selectedDate);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!selectedSchedule) return;

    try {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete this schedule for ${new Date(
          selectedSchedule.date
        ).toLocaleDateString()}? This action cannot be undone.`
      );

      if (!confirmDelete) return;

      setLoading(true);

      const response = await fetch(`/api/schedules/${selectedSchedule.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        // Clear the selected schedule
        setSelectedSchedule(null);

        // Refresh the calendar to update the UI
        await fetchSchedules();

        // Optional: show success message
        toast.success("Schedule successfully deleted");
      } else {
        console.error("Error deleting schedule:", data.error);
        toast.error(
          `Failed to delete schedule: ${data.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error in delete operation:", error);
      toast.error("An unexpected error occurred while deleting the schedule");
    } finally {
      setLoading(false);
    }
  };

  console.log("Seelcered scheudle - ", selectedSchedule)

  const calculateRemainingPackages = (totalPackages: number) => {
    const handledByFixed = Math.floor(totalEfficiency);
    return Math.max(0, totalPackages - handledByFixed);
  };

  const calendarRef = useRef<any>(null);

  // Add getDefaultDateRange helper function
  const getDefaultDateRange = () => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    };
  };

  // Update the fetchSchedules function with proper type checking
  const fetchSchedules = async (startDate?: Date, endDate?: Date) => {
    try {
      let finalStart: Date;
      let finalEnd: Date;

      if (startDate && endDate) {
        finalStart = startDate;
        finalEnd = endDate;
      } else {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
          finalStart = calendarApi.view.activeStart;
          finalEnd = calendarApi.view.activeEnd;
        } else {
          const defaultRange = getDefaultDateRange();
          finalStart = defaultRange.start;
          finalEnd = defaultRange.end;
        }
      }

      const params = new URLSearchParams({
        start: finalStart.toISOString(),
        end: finalEnd.toISOString(),
        organizationId: "1",
      });

      const response = await fetch(`/api/schedules?${params}`);
      const data: APIResponse<CalendarEvent[]> = await response.json();

      if (data.success && Array.isArray(data.data)) {
        // The API is already returning calendar event format, so we can use it directly
        setSchedules(data.data);
      } else {
        // Handle empty or invalid response
        setSchedules([]);
        console.warn("No schedule data received or invalid format");
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      setSchedules([]); // Reset schedules on error
    }
  };

  const fetchScheduleDetails = async (scheduleId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/schedules/${scheduleId}`);
      const data: APIResponse<ScheduleInfo> = await response.json();

      if (data.data) {
        // Ensure that employees property always exists
        const scheduleData = {
          ...data.data,
          employees: data.data.employees || [],
        };

        // Calculate the correct remaining packages based on total packages and total employee efficiency
        const totalEff = (scheduleData.employees || []).reduce(
          (sum, emp) => sum + (emp.efficiency * 5 || 0),
          0
        );

        const totalPackages = scheduleData.shift?.totalPackages || 0;
        const calculatedRemaining = Math.max(0, totalPackages - totalEff);

        // Use our calculated value instead of API value which may be incorrect
        scheduleData.remainingPackages = calculatedRemaining;

        console.log("Fetched schedule details:", scheduleData);
        setSelectedSchedule(scheduleData);
      }
    } catch (error) {
      console.error("Error fetching schedule details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (clickInfo: any) => {
    const scheduleId = clickInfo.event.extendedProps.scheduleId;
    fetchScheduleDetails(scheduleId);
  };

  // Updated handlePackageSubmit function to correctly calculate remaining packages
  const handlePackageSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!selectedDate || !packageCount) return;

    const pkgCount = parseInt(packageCount);
    const remaining = calculateRemainingPackages(pkgCount);
    setRemainingPackages(remaining);

    try {
      setLoading(true);

      // Prepare the fixed employees data to be sent to the API
      const preparedFixedEmployees = fixedEmployees.map((emp: Employee) => ({
        id: emp.id,
        name: emp.name,
        efficiency: emp.efficiency || 0,
        type: emp.type,
      }));

      // Create the schedule
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate.toISOString(),
          packageCount: pkgCount,
          organizationId: 1,
          fixedEmployees: preparedFixedEmployees,
        }),
      });

      const data = await response.json();

      if (data.success || data.data) {
        // Handle both API response formats
        const scheduleData = data.schedule || data.data;
        if (scheduleData) {
          // Store the selected date to preserve it
          const selectedDateValue = selectedDate;

          // Calculate the correct remaining packages
          const totalAssignedEfficiency = (scheduleData.employees || []).reduce(
            (sum: number, emp: { efficiency: number }) =>
              sum + (emp.efficiency * 5 || 0),
            0
          );

          const calculatedRemaining = Math.max(
            0,
            pkgCount - totalAssignedEfficiency
          );

          // Set the schedule data, ensuring employees property exists and correct remaining packages
          setSelectedSchedule({
            ...scheduleData,
            employees: scheduleData.employees || [],
            remainingPackages: calculatedRemaining, // Use our calculation instead of API value
          });

          // Refresh calendar events
          await fetchSchedules();

          // Restore the selected date (which might have been cleared during fetches)
          if (!selectedDate) {
            setSelectedDate(selectedDateValue);
          }
        }
      } else {
        // Display error message
        console.error("Error in schedule creation response:", data);
        toast.error("Failed to create schedule. Please try again.");
      }
    } catch (error) {
      console.error("Error creating schedule:", error);
      toast.error("An error occurred while creating the schedule.");
    } finally {
      setLoading(false);
    }
  };

  // Fixed handleVETAction function to ensure it uses correct remaining packages
  const handleVETAction = async (action: "start" | "close" | "reopen") => {
    if (!selectedSchedule) return;

    try {
      setLoading(true);
      const url = `/api/schedules/${selectedSchedule.id}/vet`;
      const method = action === "start" ? "POST" : "PATCH";

      // Different payload based on action type
      let body: any = {};

      if (action === "start") {
        // For starting VET, use the correctly calculated remainingPackages
        body = {
          targetPackageCount:
            selectedSchedule.remainingPackages || remainingPackages,
          scheduleId: selectedSchedule.id,
          organizationId: 1, // Using organization ID 1 as shown in other parts of the code
        };
        console.log("Starting VET with target:", body.targetPackageCount);
      } else if (action === "reopen") {
        // For reopening VET, specify the action
        body = {
          action: "reopen",
          scheduleId: selectedSchedule.id,
          organizationId: 1,
        };
        console.log("Reopening VET for schedule", selectedSchedule.id);
      } else {
        // For closing VET
        body = {
          action: "close",
          scheduleId: selectedSchedule.id,
          organizationId: 1,
        };
        console.log("Closing VET for schedule", selectedSchedule.id);
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.success || data.data) {
        // Refresh the schedule details to show updated VET status
        await fetchScheduleDetails(selectedSchedule.id);

        // Show success notification with action-specific message
        let message = "";
        switch (action) {
          case "start":
            message = "VET successfully started";
            break;
          case "close":
            message = "VET successfully closed";
            break;
          case "reopen":
            message = "VET successfully reopened";
            break;
        }
        toast.success(message);
      } else {
        console.error(`Error ${action} VET:`, data.error || "Unknown error");
        toast.error(
          `Failed to ${action} VET: ${data.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error(`Error ${action} VET:`, error);
      const actionVerb =
        action === "start"
          ? "starting"
          : action === "close"
          ? "closing"
          : "reopening";
      toast.error(`An unexpected error occurred while ${actionVerb} VET`);
    } finally {
      setLoading(false);
    }
  };

  // Add this new handler function for VTO actions
  const handleVTOAction = async (action: "start" | "close" | "reopen") => {
    if (!selectedSchedule) return;

    try {
      setLoading(true);
      const url = `/api/schedules/${selectedSchedule.id}/vto`;
      const method = action === "start" ? "POST" : "PATCH";

      // Different payload based on action type
      let body: any = {};

      if (action === "start") {
        // For starting VTO
        body = {
          scheduleId: selectedSchedule.id,
          organizationId: 1,
        };
        console.log("Starting VTO for schedule", selectedSchedule.id);
      } else if (action === "reopen") {
        // For reopening VTO
        body = {
          action: "reopen",
          scheduleId: selectedSchedule.id,
          organizationId: 1,
        };
        console.log("Reopening VTO for schedule", selectedSchedule.id);
      } else {
        // For closing VTO
        body = {
          action: "close",
          scheduleId: selectedSchedule.id,
          organizationId: 1,
        };
        console.log("Closing VTO for schedule", selectedSchedule.id);
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.success || data.data) {
        // Refresh the schedule details to show updated VTO status
        await fetchScheduleDetails(selectedSchedule.id);

        // Show success notification with action-specific message
        let message = "";
        switch (action) {
          case "start":
            message = "VTO successfully started";
            break;
          case "close":
            message = "VTO successfully closed";
            break;
          case "reopen":
            message = "VTO successfully reopened";
            break;
        }
        toast.success(message);
      } else {
        console.error(`Error ${action} VTO:`, data.error || "Unknown error");
        toast.error(
          `Failed to ${action} VTO: ${data.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error(`Error ${action} VTO:`, error);
      const actionVerb =
        action === "start"
          ? "starting"
          : action === "close"
          ? "closing"
          : "reopening";
      toast.error(`An unexpected error occurred while ${actionVerb} VTO`);
    } finally {
      setLoading(false);
    }
  };

  // Add this function to check if the VTO button should be shown
  const shouldShowVTOButton = () => {
    if (!selectedSchedule) return false;

    // Don't show for completed schedules
    if (selectedSchedule.status === "COMPLETED") return false;

    // Check if VET is closed
    const isVetClosed = selectedSchedule.vet?.status === "CLOSED";

    // Check if the selected date is today
    const today = new Date();
    const scheduleDate = new Date(selectedSchedule.date);
    const isToday =
      scheduleDate.getFullYear() === today.getFullYear() &&
      scheduleDate.getMonth() === today.getMonth() &&
      scheduleDate.getDate() === today.getDate();

    return isVetClosed && isToday;
  };

  // Determine if showing VET button is appropriate
  const shouldShowVETButtons = () => {
    if (!selectedSchedule) return false;

    // Don't show for completed schedules
    if (selectedSchedule.status === "COMPLETED") return false;

    return true;
  };

  // Determine schedule status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get employee card style based on efficiency
  const getEfficiencyStyle = (efficiency: number) => {
    if (efficiency > 120) return "border-l-4 border-green-500";
    if (efficiency > 100) return "border-l-4 border-blue-500";
    if (efficiency > 80) return "border-l-4 border-yellow-500";
    return "border-l-4 border-red-500";
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Blinking animation for VET status
  const [blink, setBlink] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink((prev) => !prev);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-12 gap-6">
      <Card className="col-span-9 overflow-hidden shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-4">
          <CardTitle className="text-xl font-semibold flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary" />
            Scheduling Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 dash-tail-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "title",
              right: "prev,next today",
            }}
            selectable={true}
            events={schedules}
            select={handleDateSelect}
            eventClick={handleEventClick}
            displayEventTime={false}
            eventDisplay="block"
            datesSet={(dateInfo) => {
              fetchSchedules(dateInfo.start, dateInfo.end);
            }}
            height="auto"
            aspectRatio={1.8}
          />
        </CardContent>
      </Card>
      <Card className="col-span-3 shadow-md">
        <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-blue-50">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Schedule Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-200px)]">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : selectedDate && !selectedSchedule ? (
              <div className="px-6 pb-6 space-y-6 pt-4">
                {/* Date Display with improved styling */}
                <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-medium text-lg">
                      {selectedDate.toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedDate.toLocaleDateString(undefined, {
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Fixed Employees Section with improved styling */}
                {fixedEmployees.length > 0 && (
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <h3 className="font-medium">Fixed Employees</h3>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        {fixedEmployees.length}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {fixedEmployees.map((emp) => (
                        <div
                          key={emp.id}
                          className={`bg-gray-50 p-3 rounded-lg border-l-4 ${
                            emp.efficiency > 20
                              ? "border-green-500"
                              : emp.efficiency > 15
                              ? "border-blue-500"
                              : emp.efficiency > 10
                              ? "border-yellow-500"
                              : "border-red-500"
                          } shadow-sm transition-all hover:shadow-md`}
                        >
                          <div className="flex justify-between items-center">
                            <p className="font-medium">{emp.name}</p>
                          </div>
                          <div className="mt-1 flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Packages per hour
                            </span>
                            <span className="font-semibold">
                              {emp.efficiency * 5}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium">Total Capacity:</span>
                      <Badge className="bg-blue-600 hover:bg-blue-700">
                        {totalEfficiency} packages
                      </Badge>
                    </div>
                  </div>
                )}

                <Separator className="my-6" />

                {/* Package Count Form with improved styling */}
                <form
                  onSubmit={handlePackageSubmit}
                  className="space-y-4 bg-white rounded-lg p-4 shadow-sm border border-gray-100"
                >
                  <div>
                    <Label
                      htmlFor="packageCount"
                      className="mb-2 block font-semibold"
                    >
                      Package Count
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="packageCount"
                        type="number"
                        value={packageCount}
                        onChange={(e) => {
                          setPackageCount(e.target.value);
                          if (e.target.value) {
                            setRemainingPackages(
                              calculateRemainingPackages(
                                parseInt(e.target.value)
                              )
                            );
                          }
                        }}
                        placeholder="Enter package count"
                        min="1"
                        required
                        className="flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Submit
                      </Button>
                    </div>

                    {packageCount && (
                      <div className="mt-4 border rounded-lg p-4 bg-gray-50 space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium">Total packages:</p>
                          <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                            {parseInt(packageCount)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium">
                            Handled by fixed employees:
                          </p>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                            {totalEfficiency}
                          </Badge>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between items-center pt-1">
                          <p className="text-sm font-medium">
                            Additional packages for VET:
                          </p>
                          <Badge
                            className={`text-white ${
                              remainingPackages > 0
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-green-500 hover:bg-green-600"
                            }`}
                          >
                            {remainingPackages}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            ) : selectedSchedule ? (
              <div className="px-6 pb-6 space-y-6 pt-4">
                {/* Schedule Header with improved styling */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium text-lg">
                      {new Date(selectedSchedule.date).toLocaleDateString(
                        undefined,
                        {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge
                      className={`
                  ${
                    selectedSchedule.status === "COMPLETED"
                      ? "bg-green-500 text-white"
                      : selectedSchedule.status === "IN_PROGRESS"
                      ? "bg-blue-500 text-white"
                      : "bg-yellow-500 text-white"
                  }
                `}
                    >
                      {selectedSchedule.status}
                    </Badge>
                  </div>

                  {selectedSchedule.shift && (
                    <div className="mt-4 pt-3 border-t space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Total Packages:
                        </span>
                        <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                          {selectedSchedule.shift.totalPackages}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Completed:</span>
                        <div className="flex items-center gap-1">
                          <Badge className="bg-green-500 hover:bg-green-600 text-white">
                            {selectedSchedule.shift.completedCount}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            (
                            {Math.round(
                              (selectedSchedule.shift.completedCount /
                                selectedSchedule.shift.totalPackages) *
                                100
                            )}
                            %)
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Remaining for VET:
                        </span>
                        <Badge
                          className={`text-white ${
                            selectedSchedule.remainingPackages > 0
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-green-500 hover:bg-green-600"
                          }`}
                        >
                          {selectedSchedule.remainingPackages.toFixed(0) ||
                            remainingPackages}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fixed Employees Section with improved styling */}
                {selectedSchedule.employees &&
                  selectedSchedule.employees.length > 0 && (
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          <h3 className="font-medium">Assigned Employees</h3>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                          {selectedSchedule.employees.length}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {selectedSchedule.employees.map((emp) => (
                          <div
                            key={emp.id}
                            className={`p-3 rounded-lg ${
                              emp.type === "FIXED"
                                ? "bg-blue-50 border-l-4 border-blue-500"
                                : "bg-green-50 border-l-4 border-green-500"
                            } shadow-sm transition-all hover:shadow-md`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <p className="font-medium">{emp.name}</p>
                                <Badge
                                  className={`ml-2 text-xs ${
                                    emp.type === "FIXED"
                                      ? "bg-blue-200 text-blue-800"
                                      : "bg-green-200 text-green-800"
                                  }`}
                                >
                                  {emp.type}
                                </Badge>
                              </div>
                            </div>
                            <div className="mt-1 flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">
                                {selectedSchedule.status === "COMPLETED"
                                  ? "Total daily efficiency:"
                                  : "Packages per hour:"}
                              </span>
                              <span className="font-semibold">
                                {selectedSchedule.status === "COMPLETED"
                                  ? emp.efficiency.toFixed(0)
                                  : (emp.efficiency * 5).toFixed(0)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium">
                          {selectedSchedule.status === "COMPLETED"
                            ? "Total Packages Handled:"
                            : "Total Capacity:"}
                        </span>
                        <Badge className="bg-blue-600 hover:bg-blue-700">
                          {selectedSchedule.status === "COMPLETED"
                            ? selectedSchedule.employees
                                .find((emp) => emp.task === "INDUCTOR")
                                ?.efficiency.toFixed(0)
                            : selectedSchedule.employees
                                .reduce(
                                  (sum, emp) => sum + (emp.efficiency * 5 || 0),
                                  0
                                )
                                .toFixed(0)}{" "}
                          packages
                        </Badge>
                      </div>
                    </div>
                  )}

                {/* VET Section with improved styling */}
                {selectedSchedule.vet && (
                  <div
                    className={`
    ${
      selectedSchedule.vet.status === "OPEN"
        ? "bg-gradient-to-r from-amber-100 to-amber-50 border-l-4 border-amber-500"
        : "bg-gradient-to-r from-emerald-100 to-emerald-50 border-l-4 border-emerald-500"
    } rounded-lg p-5 shadow-md mb-2`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-4 w-4 rounded-full ${
                            selectedSchedule.vet.status === "OPEN"
                              ? blink
                                ? "bg-amber-500 shadow-md"
                                : "bg-amber-400"
                              : "bg-emerald-500"
                          } transition-all animate-pulse`}
                        ></div>
                        <h4
                          className={`font-semibold text-lg ${
                            selectedSchedule.vet.status === "OPEN"
                              ? "text-amber-700"
                              : "text-emerald-700"
                          }`}
                        >
                          VET{" "}
                          {selectedSchedule.vet.status === "OPEN"
                            ? "OPEN"
                            : "CLOSED"}
                        </h4>
                      </div>
                      <Badge
                        className={`${
                          selectedSchedule.vet.status === "OPEN"
                            ? "bg-amber-500 hover:bg-amber-600"
                            : "bg-emerald-500 hover:bg-emerald-600"
                        } text-white px-3 py-1`}
                      >
                        {selectedSchedule.vet.status}
                      </Badge>
                    </div>
                    <div className="space-y-3 mt-4">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2">
                          <Package
                            className={`h-4 w-4 ${
                              selectedSchedule.vet.status === "OPEN"
                                ? "text-amber-500"
                                : "text-emerald-500"
                            }`}
                          />
                          <span className="font-medium">Target packages:</span>
                        </div>
                        <span className="font-semibold text-gray-800 bg-gray-100 px-3 py-1 rounded-full">
                          {selectedSchedule.vet.targetPackageCount}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2">
                          <Clock
                            className={`h-4 w-4 ${
                              selectedSchedule.vet.status === "OPEN"
                                ? "text-amber-500"
                                : "text-emerald-500"
                            }`}
                          />
                          <span className="font-medium">Opened at:</span>
                        </div>
                        <span className="font-semibold text-gray-800 bg-gray-100 px-3 py-1 rounded-full">
                          {new Date(
                            selectedSchedule.vet.openedAt
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {selectedSchedule.vet.closedAt && (
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-emerald-500" />
                            <span className="font-medium">Closed at:</span>
                          </div>
                          <span className="font-semibold text-gray-800 bg-gray-100 px-3 py-1 rounded-full">
                            {new Date(
                              selectedSchedule.vet.closedAt
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* VTO Section with improved styling */}
                {selectedSchedule.vto && (
                  <div
                    className={`
                      ${
                        selectedSchedule.vto.status === "OPEN"
                          ? "bg-gradient-to-r from-amber-100 to-amber-50 border-l-4 border-amber-500"
                          : "bg-gradient-to-r from-emerald-100 to-emerald-50 border-l-4 border-emerald-500"
                      } rounded-lg p-5 shadow-md mb-2`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-4 w-4 rounded-full ${
                            selectedSchedule.vto.status === "OPEN"
                              ? blink
                                ? "bg-amber-500 shadow-md"
                                : "bg-amber-400"
                              : "bg-emerald-500"
                          } transition-all animate-pulse`}
                        ></div>
                        <h4
                          className={`font-semibold text-lg ${
                            selectedSchedule.vto.status === "OPEN"
                              ? "text-amber-700"
                              : "text-emerald-700"
                          }`}
                        >
                          VTO{" "}
                          {selectedSchedule.vto.status === "OPEN"
                            ? "OPEN"
                            : "CLOSED"}
                        </h4>
                      </div>
                      <Badge
                        className={`${
                          selectedSchedule.vto.status === "OPEN"
                            ? "bg-amber-500 hover:bg-amber-600"
                            : "bg-emerald-500 hover:bg-emerald-600"
                        } text-white px-3 py-1`}
                      >
                        {selectedSchedule.vto.status}
                      </Badge>
                    </div>
                    <div className="space-y-3 mt-4">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2">
                          <Clock
                            className={`h-4 w-4 ${
                              selectedSchedule.vto.status === "OPEN"
                                ? "text-amber-500"
                                : "text-emerald-500"
                            }`}
                          />
                          <span className="font-medium">Opened at:</span>
                        </div>
                        <span className="font-semibold text-gray-800 bg-gray-100 px-3 py-1 rounded-full">
                          {new Date(
                            selectedSchedule.vto.openedAt
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {selectedSchedule.vto.closedAt && (
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-emerald-500" />
                            <span className="font-medium">Closed at:</span>
                          </div>
                          <span className="font-semibold text-gray-800 bg-gray-100 px-3 py-1 rounded-full">
                            {new Date(
                              selectedSchedule.vto.closedAt
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 space-y-3">
                  {shouldShowVETButtons() && (
                    <>
                      {!selectedSchedule.vet && (
                        <Button
                          onClick={() => handleVETAction("start")}
                          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white transition-colors"
                          disabled={loading}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Start VET (
                          {selectedSchedule.remainingPackages.toFixed(0) ||
                            remainingPackages}{" "}
                          packages)
                        </Button>
                      )}

                      {selectedSchedule.vet?.status === "OPEN" && (
                        <Button
                          onClick={() => handleVETAction("close")}
                          className="w-full bg-green-500 hover:bg-green-600 text-white transition-colors"
                          disabled={loading}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Close VET
                        </Button>
                      )}

                      {selectedSchedule.vet?.status === "CLOSED" && (
                        <Button
                          onClick={() => handleVETAction("reopen")}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                          disabled={loading}
                        >
                          <ArrowRightCircle className="mr-2 h-4 w-4" />
                          Reopen VET
                        </Button>
                      )}
                    </>
                  )}

                  {/* VTO Button - Only shown when VET is closed and the day is today */}
                  {shouldShowVTOButton() && (
                    <>
                    {!selectedSchedule.vto && (
                      <Button
                        onClick={() => handleVTOAction("start")}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white transition-colors"
                        disabled={loading}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Start VTO (
                        {selectedSchedule.remainingPackages.toFixed(0) ||
                          remainingPackages}{" "}
                        packages)
                      </Button>
                    )}

                    {selectedSchedule.vto?.status === "OPEN" && (
                      <Button
                        onClick={() => handleVTOAction("close")}
                        className="w-full bg-green-500 hover:bg-green-600 text-white transition-colors"
                        disabled={loading}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Close VTO
                      </Button>
                    )}

                    {selectedSchedule.vto?.status === "CLOSED" && (
                      <Button
                        onClick={() => handleVTOAction("reopen")}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                        disabled={loading}
                      >
                        <ArrowRightCircle className="mr-2 h-4 w-4" />
                        Reopen VTO
                      </Button>
                    )}
                  </>
                  )}

                  <Button
                    onClick={handleDeleteSchedule}
                    className="w-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                    disabled={loading || !selectedSchedule}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Schedule
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Select a date or schedule to view details
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add a custom style tag for specialized animations and effects */}
      <style jsx global>{`
        .schedule-draft {
          background-color: rgba(234, 179, 8, 0.1);
          border-left: 4px solid rgb(234, 179, 8);
        }

        .schedule-confirmed {
          background-color: rgba(59, 130, 246, 0.1);
          border-left: 4px solid rgb(59, 130, 246);
        }

        .schedule-in_progress {
          background-color: rgba(16, 185, 129, 0.1);
          border-left: 4px solid rgb(16, 185, 129);
        }

        .schedule-completed {
          background-color: rgba(107, 114, 128, 0.1);
          border-left: 4px solid rgb(107, 114, 128);
        }

        /* Better calendar styling */
        .dash-tail-calendar .fc-header-toolbar {
          margin-bottom: 1rem !important;
        }

        .dash-tail-calendar .fc-header-toolbar .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 600;
        }

        .dash-tail-calendar .fc-day-today {
          background-color: rgba(59, 130, 246, 0.05) !important;
        }

        .dash-tail-calendar .fc-event {
          cursor: pointer;
          font-size: 0.875rem;
          padding: 2px 4px;
          border-radius: 4px;
          border: none;
          transition: transform 0.1s ease-in-out;
        }

        .dash-tail-calendar .fc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </div>
  );
}
