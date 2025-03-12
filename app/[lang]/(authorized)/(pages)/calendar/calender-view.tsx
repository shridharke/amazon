'use client';

import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { Loader2, Package, Users, Calendar, Clock, ArrowRightCircle } from "lucide-react";
import {
  CalendarEvent,
  ScheduleInfo,
  CreateScheduleRequest,
  APIResponse
} from "@/types/schedule";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleInfo | null>(null);
  const [packageCount, setPackageCount] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [fixedEmployees, setFixedEmployees] = useState<Employee[]>([]);
  const [remainingPackages, setRemainingPackages] = useState(0);
  const [totalEfficiency, setTotalEfficiency] = useState(0);

  const getEventClassName = (status: string | undefined): string => {
    if (!status) return 'schedule-draft';
    
    switch (status.toLowerCase()) {
      case 'draft':
        return 'schedule-draft';
      case 'confirmed':
        return 'schedule-confirmed';
      case 'in_progress':
        return 'schedule-in_progress';
      case 'completed':
        return 'schedule-completed';
      default:
        return 'schedule-draft';
    }
  };
  
  const transformSchedules = (data: any[]): CalendarEvent[] => {
    if (!Array.isArray(data)) return [];
  
    return data.map(item => {
      // Check if the item is already in CalendarEvent format
      if (item.extendedProps && item.start && item.end) {
        // It's already in the right format, return as is
        return item;
      }
      
      // Otherwise, it's a ScheduleInfo and needs transformation
      if (!item) return null;
  
      const id = item.id?.toString() || '';
      const title = getEventTitle(item);
      const date = item.date ? new Date(item.date) : new Date();
      const className = getEventClassName(item.status);
  
      return {
        id,
        title,
        start: date,
        end: date,
        allDay: true,
        className,
        extendedProps: {
          scheduleId: item.id,
          status: item.status,
          totalPackages: item.shift?.totalPackages || 0,
          completedPackages: item.shift?.completedCount || 0,
          hasActiveVet: item.vet?.status === 'OPEN'
        }
      };
    }).filter((event): event is CalendarEvent => event !== null);
  };
  
  const getEventTitle = (schedule: ScheduleInfo): string => {
    if (!schedule || !schedule.shift) return 'No packages';
    
    const packages = schedule.shift.totalPackages || 0;
    const completed = schedule.shift.completedCount || 0;
    return `Packages: ${completed}/${packages}`;
  };

  const fetchFixedEmployees = async (date: Date): Promise<void> => {
    try {
      // Use the dedicated fixed employees endpoint if available
      let response: Response;
      try {
        response = await fetch(`/api/employees/fixed?date=${date.toISOString()}&organizationId=1`);
      } catch (error) {
        console.warn("Fixed employees endpoint not available, falling back to all employees:", error);
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
      if (response.url.includes('/api/employees?')) {
        const dayOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][date.getDay()];
        
        fixedEmps = data.employees.filter((emp: Employee) => {
          if (emp.type !== "FIXED") return false;
          
          try {
            const workDays = emp.workDays ? JSON.parse(emp.workDays) : [];
            return workDays.includes(dayOfWeek);
          } catch (e: unknown) {
            console.error(`Error parsing work days for employee ${emp.id}:`, e);
            return false;
          }
        }).map((emp: Employee) => ({
          id: emp.id,
          name: emp.name,
          type: emp.type,
          efficiency: Math.round(emp.overallEfficiency || 0),
          workDays: emp.workDays
        }));
      }
      
      setFixedEmployees(fixedEmps);
      const totalEff = fixedEmps.reduce((sum: number, emp: Employee) => sum + (emp.efficiency || 0), 0);
      setTotalEfficiency(totalEff);
    } catch (error) {
      console.error('Error fetching fixed employees:', error);
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
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
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
        organizationId: '1',
      });

      const response = await fetch(`/api/schedules?${params}`);
      const data: APIResponse<CalendarEvent[]> = await response.json();

      if (data.success && Array.isArray(data.data)) {
        // The API is already returning calendar event format, so we can use it directly
        setSchedules(data.data);
      } else {
        // Handle empty or invalid response
        setSchedules([]);
        console.warn('No schedule data received or invalid format');
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
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
          employees: data.data.employees || []
        };
        console.log('Fetched schedule details:', scheduleData);
        setSelectedSchedule(scheduleData);
      }
    } catch (error) {
      console.error('Error fetching schedule details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (clickInfo: any) => {
    const scheduleId = clickInfo.event.extendedProps.scheduleId;
    fetchScheduleDetails(scheduleId);
  };

// Updated handleVETAction function to use remainingPackages for VET
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
      type: emp.type
    }));
    
    // Create the schedule
    const response = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
        
        // Set the schedule data, ensuring employees property exists
        setSelectedSchedule({
          ...scheduleData,
          employees: scheduleData.employees || [],
          remainingPackages: remaining // Explicitly set remainingPackages from our calculation
        });
        
        // Refresh calendar events
        await fetchSchedules();
        
        // Restore the selected date (which might have been cleared during fetches)
        if (!selectedDate) {
          setSelectedDate(selectedDateValue);
        }
        
        // Keep the fixed employees visible by not clearing them
        // We don't need to re-fetch here as we already have them
      }
    } else {
      // Display error message
      console.error('Error in schedule creation response:', data);
      // You might want to add a toast or alert here
    }
  } catch (error) {
    console.error('Error creating schedule:', error);
    // You might want to add a toast or alert here
  } finally {
    setLoading(false);
  }
};

// Fixed handleVETAction function to ensure it uses remaining packages
const handleVETAction = async (action: 'start' | 'close') => {
  if (!selectedSchedule) return;

  try {
    setLoading(true);
    const url = `/api/schedules/${selectedSchedule.id}/vet`;
    const method = action === 'start' ? 'POST' : 'PATCH';
    
    // For starting VET, use remainingPackages as targetPackageCount
    const body = action === 'start' ? { 
      // Use remainingPackages from the selectedSchedule or the state
      // Make sure we're using the correct value
      targetPackageCount: selectedSchedule.remainingPackages || remainingPackages 
    } : undefined;

    console.log('Starting VET with target:', body?.targetPackageCount);

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    if (data.success || data.data) {
      // Refresh the schedule details to show updated VET status
      await fetchScheduleDetails(selectedSchedule.id);
    } else {
      console.error('Error managing VET:', data.error || 'Unknown error');
      // You might want to add a toast notification here
    }
  } catch (error) {
    console.error('Error managing VET:', error);
  } finally {
    setLoading(false);
  }
};

  const navigateToDailyView = () => {
    if (selectedSchedule) {
      router.push(`/schedule/daily/${selectedSchedule.id}`);
    }
  };

  // Determine if showing VET button is appropriate
  const shouldShowVETButtons = () => {
    if (!selectedSchedule) return false;
    
    // Don't show for completed schedules
    if (selectedSchedule.status === 'COMPLETED') return false;
    
    return true;
  };

  // Determine schedule status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get employee card style based on efficiency
  const getEfficiencyStyle = (efficiency: number) => {
    if (efficiency > 120) return 'border-l-4 border-green-500';
    if (efficiency > 100) return 'border-l-4 border-blue-500';
    if (efficiency > 80) return 'border-l-4 border-yellow-500';
    return 'border-l-4 border-red-500';
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Blinking animation for VET status
  const [blink, setBlink] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(prev => !prev);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-12 gap-6">
      <Card className="col-span-9 overflow-hidden">
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
      <Card className="col-span-3">
  <CardHeader className="border-b">
    <CardTitle className="flex items-center gap-2">
      <Package className="h-5 w-5" />
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
        <div className="px-6 pb-6 space-y-6">
          {/* Date Display */}
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-medium text-lg">
                {selectedDate.toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedDate.toLocaleDateString(undefined, {
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Fixed Employees Section */}
          {fixedEmployees.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Fixed Employees</h3>
                </div>
                <Badge variant="outline" color="secondary">{fixedEmployees.length}</Badge>
              </div>
              
              <div className="space-y-2">
                {fixedEmployees.map((emp) => (
                  <div 
                    key={emp.id} 
                    className="bg-card p-3 rounded-lg border"
                  >
                    <div className="flex justify-between items-center">
                      <p>{emp.name}</p>
                      <Badge color="secondary" variant="soft">ID: {emp.id}</Badge>
                    </div>
                    <div className="mt-1 flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Efficiency</span>
                      <span>{emp.efficiency}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <span>Total Efficiency:</span>
                <Badge variant="outline" color="info">{totalEfficiency}</Badge>
              </div>
            </div>
          )}

          <Separator />

          {/* Package Count Form */}
          <form onSubmit={handlePackageSubmit} className="space-y-4">
            <div>
              <Label htmlFor="packageCount" className="mb-2 block">Package Count</Label>
              <div className="flex gap-2">
                <Input
                  id="packageCount"
                  type="number"
                  value={packageCount}
                  onChange={(e) => {
                    setPackageCount(e.target.value);
                    if (e.target.value) {
                      setRemainingPackages(
                        calculateRemainingPackages(parseInt(e.target.value))
                      );
                    }
                  }}
                  placeholder="Enter package count"
                  min="1"
                  required
                  className="flex-1"
                />
                <Button type="submit">Submit</Button>
              </div>
              
              {packageCount && (
                <div className="mt-4 border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Packages handled by fixed employees:</p>
                    <Badge variant="outline">{totalEfficiency}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Additional packages for VET:</p>
                    <Badge 
                      color={remainingPackages > 0 ? "destructive" : "success"}
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
        <div className="px-6 pb-6 space-y-6">
          {/* Schedule Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="font-medium text-lg">
                {new Date(selectedSchedule.date).toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h3>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm">Status:</span>
              <Badge color={selectedSchedule.status === 'COMPLETED' ? 'success' : 'default'}>
                {selectedSchedule.status}
              </Badge>
            </div>
            
            {selectedSchedule.shift && (
              <div className="mt-4 pt-3 border-t space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Packages:</span>
                  <Badge variant="outline" color="default">{selectedSchedule.shift.totalPackages}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Completed:</span>
                  <div className="flex items-center gap-1">
                    <Badge color="success">{selectedSchedule.shift.completedCount}</Badge>
                    <span className="text-sm text-muted-foreground">
                      ({Math.round((selectedSchedule.shift.completedCount / selectedSchedule.shift.totalPackages) * 100)}%)
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Remaining for VET:</span>
                  <Badge variant="outline" color={selectedSchedule.remainingPackages > 0 ? "warning" : "success"}>{selectedSchedule.remainingPackages || remainingPackages}</Badge>
                </div>
              </div>
            )}
          </div>
        
          {/* Fixed Employees Section */}
          {fixedEmployees.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Fixed Employees</h3>
                </div>
                <Badge variant="outline">{fixedEmployees.length}</Badge>
              </div>
              
              <div className="space-y-2">
                {fixedEmployees.map((emp) => (
                  <div 
                    key={emp.id} 
                    className="bg-card p-3 rounded-lg border"
                  >
                    <div className="flex justify-between items-center">
                      <p>{emp.name}</p>
                      <Badge color="secondary">ID: {emp.id}</Badge>
                    </div>
                    <div className="mt-1 flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Efficiency</span>
                      <span>{emp.efficiency}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <span>Total Efficiency:</span>
                <Badge variant="outline">{totalEfficiency}</Badge>
              </div>
            </div>
          )}
        
          {/* VET Section */}
          {selectedSchedule.vet && (
            <Alert color={selectedSchedule.vet.status === 'OPEN' ? "warning" : "success"} variant="soft">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${selectedSchedule.vet.status === 'OPEN' ? "bg-orange-500" : "bg-green-500"}`}></div>
                <h4 className="font-medium">
                  VET {selectedSchedule.vet.status === 'OPEN' ? 'OPEN' : 'CLOSED'}
                </h4>
              </div>
              <AlertDescription className="mt-2">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Target:</span>
                    <span>{selectedSchedule.vet.targetPackageCount} packages</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Opened:</span>
                    <span>{new Date(selectedSchedule.vet.openedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  {selectedSchedule.vet.closedAt && (
                    <div className="flex justify-between">
                      <span>Closed:</span>
                      <span>{new Date(selectedSchedule.vet.closedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        
          {/* Assigned Employees */}
          {selectedSchedule.employees && selectedSchedule.employees.length > 0 && (
  <div>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="font-medium">Assigned Employees</h3>
      </div>
      <Badge variant="outline" color="secondary">{selectedSchedule.employees.length}</Badge>
    </div>
    
    <div className="grid grid-cols-1 gap-2">
      {selectedSchedule.employees.map((emp) => (
        <div 
          key={emp.id} 
          className={`p-3 rounded-lg border-l-4 ${
            emp.type === 'FIXED' 
              ? 'border-l-info' 
              : 'border-l-success'
          } bg-card shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <p className="font-medium">{emp.name}</p>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Efficiency:</span>
              <span className="font-medium">{emp.efficiency.toFixed(0)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
        
          {/* Action Buttons */}
          <div className="pt-4 space-y-3">
            {shouldShowVETButtons() && (
              <>
                {!selectedSchedule.vet && (
                                      <Button 
                    onClick={() => handleVETAction('start')} 
                    className="w-full"
                    variant="outline"
                    disabled={loading}
                    color="warning"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Start VET ({selectedSchedule.remainingPackages || remainingPackages} packages)
                  </Button>
                )}
                
                {selectedSchedule.vet?.status === 'OPEN' && (
                                      <Button 
                    onClick={() => handleVETAction('close')} 
                    className="w-full"
                    variant="outline"
                    disabled={loading}
                    color="success"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Close VET
                  </Button>
                )}
              </>
            )}
        
            <Button 
              onClick={navigateToDailyView} 
              className="w-full"
            >
              <ArrowRightCircle className="mr-2 h-4 w-4" />
              View Daily Details
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