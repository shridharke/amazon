"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircularProgress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useOrgStore } from "@/store";
import toast from "react-hot-toast";
import { 
  ScheduleService, 
  type Schedule as ScheduleServiceType, 
  type Employee as EmployeeServiceType 
} from "@/services/schedule-service";
import { EmployeeService } from "@/services/employee-service";
import { 
  TaskAllocationService,
  type EmployeeTask as TaskServiceEmployeeTask
} from "@/services/task-allocation-service";

// Types based on your Prisma schema
type EmployeeTask = "STOWER" | "DOWNSTACKER" | "INDUCTOR";
type EmployeeType = "FIXED" | "FLEX";
type EmployeeScheduleStatus = "SCHEDULED" | "CONFIRMED" | "DECLINED";

interface Employee {
  id: number;
  name: string;
  type: EmployeeType;
  task?: EmployeeTask;
  efficiency: number;
  status?: EmployeeScheduleStatus;
  avgEfficiency?: number;
  inductorEff?: number;
  stowerEff?: number;
  downstackerEff?: number;
}

interface Schedule {
  id: number;
  date: string;
  status: string;
  employees: Employee[];
  shift?: {
    id: number;
    status: string;
    totalPackages: number;
    completedCount: number;
  };
  fixedEmployeesEfficiency: number;
  remainingPackages: number;
}

interface AllocationPlan {
  Inductor: Array<{
    "Employee ID": number;
    "Times Worked (Last 30 Days)": number;
  }>;
  Downstackers: Array<{
    "Employee ID": number;
    "Times Worked (Last 30 Days)": number;
  }>;
  Stowers: Array<{
    "Employee ID": number;
    "Times Worked (Last 30 Days)": number;
  }>;
}

interface WorkforcePlans {
  High: AllocationPlan;
  Medium: AllocationPlan;
  Low: AllocationPlan;
}

// Task information
const TASKS: { id: EmployeeTask; name: string; baseRate: number }[] = [
  { id: "INDUCTOR", name: "Inductor", baseRate: 100 },
  { id: "DOWNSTACKER", name: "Downstacker", baseRate: 150 },
  { id: "STOWER", name: "Stower", baseRate: 200 }
];

const TaskAllocationPage: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [scheduledEmployees, setScheduledEmployees] = useState<Employee[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<Record<number, EmployeeTask>>({});
  const [suggestions, setSuggestions] = useState<Record<number, EmployeeTask>>({});
  const [activeTab, setActiveTab] = useState("task-allocation");
  const [workforcePlans, setWorkforcePlans] = useState<WorkforcePlans | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"High" | "Medium" | "Low" | null>(null);
  const { selectedOrg } = useOrgStore();

  // Helper function to format date
  const formatDateString = (date: Date | undefined) => {
    if (!date) return "";
    return formatDate(date);
  };

  // Fetch schedule for the selected date
  const fetchSchedule = async () => {
    if (!date || !selectedOrg) return;
    
    setLoading(true);
    try {
      // First check if a schedule exists for this date
      const schedules = await ScheduleService.getSchedules(
        selectedOrg.id, 
        formatDateString(date), 
        formatDateString(date)
      );
      
      if (schedules.length > 0) {
        // Schedule exists, fetch details
        const scheduleData = await ScheduleService.getScheduleById(parseInt(schedules[0].id));
        
        // Convert service types to component types
        const convertedSchedule: Schedule = {
          ...scheduleData,
          employees: scheduleData.employees.map(emp => ({
            ...emp,
            type: emp.type as EmployeeType,
            task: emp.task as EmployeeTask | undefined,
            status: emp.status as EmployeeScheduleStatus | undefined
          }))
        };
        
        setSchedule(convertedSchedule);
        setScheduledEmployees(convertedSchedule.employees);
        
        // Initialize task assignments from schedule data
        const assignments: Record<number, EmployeeTask> = {};
        
        convertedSchedule.employees.forEach(emp => {
          if (emp.task) {
            assignments[emp.id] = emp.task;
          }
        });
        
        setTaskAssignments(assignments);
        generateSuggestions(convertedSchedule.employees);
        
        // Generate workforce plans (simulating the Python logic)
        generateWorkforcePlans(convertedSchedule.employees);
      } else {
        // No schedule found for this date
        setSchedule(null);
        setScheduledEmployees([]);
        setTaskAssignments({});
        setWorkforcePlans(null);
        setSelectedPlan(null);
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
      toast.error("Failed to fetch schedule for the selected date");
    } finally {
      setLoading(false);
    }
  };

  // Generate task suggestions based on efficiency scores
  const generateSuggestions = (employees: Employee[]) => {
    const newSuggestions: Record<number, EmployeeTask> = {};
    
    employees.forEach(employee => {
      // Find the task with highest efficiency for this employee
      let bestTask: EmployeeTask = "STOWER";
      let bestEfficiency = employee.stowerEff || 1.0;
      
      if ((employee.inductorEff || 0) > bestEfficiency) {
        bestEfficiency = employee.inductorEff || 0;
        bestTask = "INDUCTOR";
      }
      
      if ((employee.downstackerEff || 0) > bestEfficiency) {
        bestEfficiency = employee.downstackerEff || 0;
        bestTask = "DOWNSTACKER";
      }
      
      newSuggestions[employee.id] = bestTask;
    });
    
    setSuggestions(newSuggestions);
  };

  // Generate workforce plans (simulating the Python logic)
  const generateWorkforcePlans = (employees: Employee[]) => {
    if (!employees.length) return;
    
    // This is a simplified version of the Python logic shown in the requirements
    // In a real implementation, this would call an API endpoint that runs the Python code
    
    // Get employee IDs
    const employeeIds = employees.map(emp => emp.id);
    
    // Function to randomly select n employees from the list
    const selectRandomEmployees = (count: number) => {
      const shuffled = [...employeeIds].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    };
    
    // Generate random work history for demonstration purposes
    const generateWorkHistory = () => Math.floor(Math.random() * 10);
    
    // Create the three efficiency plans
    const plans: WorkforcePlans = {
      High: {
        Inductor: [{
          "Employee ID": employeeIds.find(id => 
            employees.find(e => e.id === id)?.inductorEff || 0 > 1.5
          ) || employeeIds[0],
          "Times Worked (Last 30 Days)": generateWorkHistory()
        }],
        Downstackers: selectRandomEmployees(2).map(id => ({
          "Employee ID": id,
          "Times Worked (Last 30 Days)": generateWorkHistory()
        })),
        Stowers: employeeIds
          .filter(id => 
            !plans.High.Inductor.some(e => e["Employee ID"] === id) && 
            !plans.High.Downstackers.some(e => e["Employee ID"] === id)
          )
          .map(id => ({
            "Employee ID": id,
            "Times Worked (Last 30 Days)": generateWorkHistory()
          }))
      },
      Medium: {
        Inductor: [{
          "Employee ID": employeeIds.find(id => 
            employees.find(e => e.id === id)?.inductorEff || 0 > 1.2 &&
            employees.find(e => e.id === id)?.inductorEff || 0 <= 1.5
          ) || employeeIds[1],
          "Times Worked (Last 30 Days)": generateWorkHistory()
        }],
        Downstackers: selectRandomEmployees(3).map(id => ({
          "Employee ID": id,
          "Times Worked (Last 30 Days)": generateWorkHistory()
        })),
        Stowers: employeeIds
          .filter(id => 
            !plans.Medium.Inductor.some(e => e["Employee ID"] === id) && 
            !plans.Medium.Downstackers.some(e => e["Employee ID"] === id)
          )
          .map(id => ({
            "Employee ID": id,
            "Times Worked (Last 30 Days)": generateWorkHistory()
          }))
      },
      Low: {
        Inductor: [{
          "Employee ID": employeeIds.find(id => 
            employees.find(e => e.id === id)?.inductorEff || 0 <= 1.2
          ) || employeeIds[2],
          "Times Worked (Last 30 Days)": generateWorkHistory()
        }],
        Downstackers: selectRandomEmployees(1).map(id => ({
          "Employee ID": id,
          "Times Worked (Last 30 Days)": generateWorkHistory()
        })),
        Stowers: employeeIds
          .filter(id => 
            !plans.Low.Inductor.some(e => e["Employee ID"] === id) && 
            !plans.Low.Downstackers.some(e => e["Employee ID"] === id)
          )
          .map(id => ({
            "Employee ID": id,
            "Times Worked (Last 30 Days)": generateWorkHistory()
          }))
      }
    };
    
    setWorkforcePlans(plans);
  };

  // Fetch workforce plans
  const fetchWorkforcePlans = async () => {
    if (!schedule) return;
    
    try {
      const plans = await TaskAllocationService.getWorkforcePlans(schedule.id);
      setWorkforcePlans(plans);
    } catch (error) {
      console.error("Error fetching workforce plans:", error);
      toast.error("Failed to fetch task allocation plans");
    }
  };
  
  // Update when schedule changes
  useEffect(() => {
    if (schedule) {
      fetchWorkforcePlans();
    }
  }, [schedule]);
  
  // Update when date changes
  useEffect(() => {
    if (date && selectedOrg) {
      fetchSchedule();
    }
  }, [date, selectedOrg]);

  // Assign a task to an employee
  const assignTask = async (employeeId: number, taskId: EmployeeTask) => {
    if (!schedule) return;
    
    setLoading(true);
    try {
      // Cast our EmployeeTask to the service's type for better compatibility
      await TaskAllocationService.assignTask(schedule.id, employeeId, taskId as TaskServiceEmployeeTask);
      
      // Update local state after successful API call
      setTaskAssignments(prev => ({
        ...prev,
        [employeeId]: taskId
      }));
      
      toast.success(`Task assigned successfully`);
    } catch (error) {
      console.error("Error assigning task:", error);
      toast.error("Failed to assign task");
    } finally {
      setLoading(false);
    }
  };

  // Calculate performance metric for an employee-task combination
  const calculatePerformance = (employee: Employee, taskId: EmployeeTask) => {
    const task = TASKS.find(t => t.id === taskId);
    if (!task) return 0;
    
    let efficiency = 1.0;
    
    // Use specific efficiency for the task
    switch (taskId) {
      case "INDUCTOR":
        efficiency = employee.inductorEff || 1.0;
        break;
      case "DOWNSTACKER":
        efficiency = employee.downstackerEff || 1.0;
        break;
      case "STOWER":
        efficiency = employee.stowerEff || 1.0;
        break;
    }
    
    return Math.round(efficiency * 5);
  };

  // Apply selected workforce plan
  const applyWorkforcePlan = (planType: "High" | "Medium" | "Low") => {
    if (!workforcePlans || !schedule) return;
    
    setSelectedPlan(planType);
    const plan = workforcePlans[planType];
    
    // Create new task assignments based on the selected plan
    const newAssignments: Record<number, EmployeeTask> = {};
    
    // Assign inductors
    plan.Inductor.forEach(emp => {
      newAssignments[emp["Employee ID"]] = "INDUCTOR";
    });
    
    // Assign downstackers
    plan.Downstackers.forEach(emp => {
      newAssignments[emp["Employee ID"]] = "DOWNSTACKER";
    });
    
    // Assign stowers
    plan.Stowers.forEach(emp => {
      newAssignments[emp["Employee ID"]] = "STOWER";
    });
    
    // Update task assignments
    setTaskAssignments(newAssignments);
    
    toast.success(`Applied ${planType} efficiency task allocation plan`);
  };

  // Save all assignments
  const saveAssignments = async () => {
    if (!schedule) return;
    
    setLoading(true);
    try {
      await TaskAllocationService.saveAssignments(schedule.id, taskAssignments);
      
      // Update local state to reflect saved assignments
      const updatedEmployees = scheduledEmployees.map(emp => ({
        ...emp,
        task: taskAssignments[emp.id] || emp.task
      }));
      
      setScheduledEmployees(updatedEmployees);
      
      toast.success("Task assignments saved successfully");
    } catch (error) {
      console.error("Error saving assignments:", error);
      toast.error("Failed to save assignments");
    } finally {
      setLoading(false);
    }
  };

  // Find employee by ID
  const findEmployeeById = (id: number) => {
    return scheduledEmployees.find(emp => emp.id === id);
  };
  
  // Calculate completion time for a plan
  const calculateCompletionTime = (planType: "High" | "Medium" | "Low") => {
    if (!workforcePlans || !schedule?.shift?.totalPackages) return "N/A";
    
    const plan = workforcePlans[planType];
    const totalPackages = schedule.shift.totalPackages;
    
    // Calculate total efficiency for each task type
    let inductorEfficiency = 0;
    let downstackerEfficiency = 0;
    let stowerEfficiency = 0;
    
    // Calculate inductor total efficiency
    plan.Inductor.forEach(emp => {
      const employee = findEmployeeById(emp["Employee ID"]);
      if (employee) {
        inductorEfficiency += calculatePerformance(employee, "INDUCTOR") / 5;
      }
    });
    
    // Calculate downstacker total efficiency
    plan.Downstackers.forEach(emp => {
      const employee = findEmployeeById(emp["Employee ID"]);
      if (employee) {
        downstackerEfficiency += calculatePerformance(employee, "DOWNSTACKER") /5;
      }
    });
    
    // Calculate stower total efficiency
    plan.Stowers.forEach(emp => {
      const employee = findEmployeeById(emp["Employee ID"]);
      if (employee) {
        stowerEfficiency += calculatePerformance(employee, "STOWER")/5;
      }
    });
    
    // Calculate time needed for each task type (packages / total efficiency)
    const inductorTime = inductorEfficiency > 0 ? totalPackages / inductorEfficiency : Infinity;
    const downstackerTime = downstackerEfficiency > 0 ? totalPackages / downstackerEfficiency : Infinity;
    const stowerTime = stowerEfficiency > 0 ? totalPackages / stowerEfficiency : Infinity;
    
    // Get the maximum time (bottleneck)
    const maxTime = inductorTime;
    
    if (maxTime === Infinity) {
      return "N/A";
    }
    
    // Format as hours and minutes
    const hours = Math.floor(maxTime);
    const minutes = Math.round((maxTime - hours) * 60);
    
    return `${hours}h ${minutes}m`;
  };

  // Render different content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "employees":
        return renderEmployees();
      case "task-allocation":
        return renderTaskAllocation();
      default:
        return renderTaskAllocation();
    }
  };

  // Render task allocation plan selection
  const renderPlanSelection = () => {
    if (!workforcePlans) return null;
    
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Task Allocation Plans</CardTitle>
          <CardDescription>
            Select an allocation plan based on efficiency and completion time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["High", "Medium", "Low"].map((planType) => (
              <Card 
                key={planType}
                className={cn(
                  "cursor-pointer hover:shadow-md transition-shadow",
                  selectedPlan === planType && "border-2 border-primary"
                )}
                onClick={() => applyWorkforcePlan(planType as "High" | "Medium" | "Low")}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between items-center">
                    <span>{planType} Efficiency</span>
                    {selectedPlan === planType && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Estimated completion:</span>
                      <Badge variant="outline">
                        {calculateCompletionTime(planType as "High" | "Medium" | "Low")}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Inductors:</span>
                      <span>{workforcePlans[planType as "High" | "Medium" | "Low"].Inductor.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Downstackers:</span>
                      <span>{workforcePlans[planType as "High" | "Medium" | "Low"].Downstackers.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stowers:</span>
                      <span>{workforcePlans[planType as "High" | "Medium" | "Low"].Stowers.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button 
              onClick={saveAssignments}
              disabled={!selectedPlan || !schedule || scheduledEmployees.length === 0}
            >
              Save Task Assignments
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Helper to get the task name
  const getTaskName = (task: EmployeeTask): string => {
    switch(task) {
      case "INDUCTOR": return "Inductor";
      case "DOWNSTACKER": return "Downstacker";
      case "STOWER": return "Stower";
      default: return "Unknown";
    }
  };
  
  // Helper to get task color
  const getTaskColor = (task: EmployeeTask): "default" | "secondary" | "success" | "warning" => {
    switch(task) {
      case "INDUCTOR": return "default";
      case "DOWNSTACKER": return "warning";
      case "STOWER": return "success";
      default: return "default";
    }
  };

  // Render task allocation content
  const renderTaskAllocation = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <CircularProgress value={50} loading />
        </div>
      );
    }
    
    if (!schedule) {
      return (
        <Alert color="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No schedule found</AlertTitle>
          <AlertDescription>
            No schedule exists for the selected date. Please create a schedule first.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (scheduledEmployees.length === 0) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No employees scheduled</AlertTitle>
          <AlertDescription>
            No employees are scheduled for this date. Please add employees to the schedule.
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <div className="space-y-6">
        {renderPlanSelection()}
        
        <Card>
          <CardHeader>
            <CardTitle>
              Employee Task Assignments
              {date && <span className="ml-2 text-muted-foreground">({formatDate(date)})</span>}
            </CardTitle>
            <CardDescription>
              {selectedPlan 
                ? `Showing ${selectedPlan} efficiency plan assignments` 
                : "Select a plan above to assign tasks"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Assigned Task</TableHead>
                  <TableHead>Efficiency</TableHead>
                  <TableHead>Estimated Output</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledEmployees.map(employee => {
                  const currentTask = taskAssignments[employee.id] || employee.task;
                  
                  return (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{employee.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge color={employee.type === "FIXED" ? "default" : "success"}>
                          {employee.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {currentTask ? (
                          <Badge color={getTaskColor(currentTask)}>{getTaskName(currentTask)}</Badge>
                        ) : (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {currentTask && getEfficiencyDisplay(employee, currentTask)}
                      </TableCell>
                      <TableCell>
                        {currentTask ? (
                          <div>
                            {calculatePerformance(employee, currentTask)} units
                          </div>
                        ) : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Helper to get efficiency display
  const getEfficiencyDisplay = (employee: Employee, task: EmployeeTask) => {
    let efficiency = 1.0;
    
    switch (task) {
      case "INDUCTOR":
        efficiency = employee.inductorEff || 1.0;
        break;
      case "DOWNSTACKER":
        efficiency = employee.downstackerEff || 1.0;
        break;
      case "STOWER":
        efficiency = employee.stowerEff || 1.0;
        break;
    }
    
    return (
      <div className="flex items-center">
        <span className="font-medium">
          {efficiency.toFixed(0)} units/hr
        </span>
        {suggestions[employee.id] === task && (
          <CheckCircle2 className="h-4 w-4 text-green-500 ml-2" />
        )}
      </div>
    );
  };

  // Render employees tab
  const renderEmployees = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <CircularProgress value={50} loading />
        </div>
      );
    }
    
    if (!schedule) {
      return (
        <Alert color="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No schedule found</AlertTitle>
          <AlertDescription>
            No schedule exists for the selected date. Please create a schedule first.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (scheduledEmployees.length === 0) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No employees scheduled</AlertTitle>
          <AlertDescription>
            No employees are scheduled for this date. Please add employees to the schedule.
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Scheduled Employees
            {date && <span className="ml-2 text-muted-foreground">({formatDate(date)})</span>}
          </CardTitle>
          <CardDescription>
            All employees scheduled for this day with their assigned tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Assigned Task</TableHead>
                <TableHead>Efficiency</TableHead>
                <TableHead>Estimated Output</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scheduledEmployees.map(employee => {
                const currentTask = taskAssignments[employee.id] || employee.task;
                
                return (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{employee.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge color={employee.type === "FIXED" ? "default" : "success"}>
                        {employee.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {currentTask ? (
                        <Badge color={getTaskColor(currentTask)}>{getTaskName(currentTask)}</Badge>
                      ) : (
                        <span className="text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {currentTask && getEfficiencyDisplay(employee, currentTask)}
                    </TableCell>
                    <TableCell>
                      {currentTask ? (
                        <div>
                          {calculatePerformance(employee, currentTask)} units
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge color={
                        employee.status === "CONFIRMED" ? "success" : 
                        employee.status === "DECLINED" ? "destructive" : 
                        "warning"
                      }>
                        {employee.status || "SCHEDULED"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  // Placeholder for dashboard/analytics tab
  const renderDashboard = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dashboard & Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Dashboard & Analytics tab content will be implemented here.</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Task Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full md:w-auto justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? formatDate(date) : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {schedule && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Schedule Status:</span>
                  <Badge color={getStatusColor(schedule.status)}>{schedule.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Total Packages:</span>
                  <span>{schedule.shift?.totalPackages || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Scheduled Employees:</span>
                  <span>{scheduledEmployees.length}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Tabs defaultValue="task-allocation" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="task-allocation">Task Allocation</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            {renderTabContent()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Helper to get status color
const getStatusColor = (status: string): "default" | "success" | "warning" | "default" | "destructive" => {
  switch (status) {
    case "DRAFT":
      return "default";
    case "CONFIRMED":
      return "warning";
    case "IN_PROGRESS":
      return "success";
    case "COMPLETED":
      return "default";
    default:
      return "default";
  }
};

export default TaskAllocationPage;