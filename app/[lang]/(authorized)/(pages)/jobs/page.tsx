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
    
    console.log("Fetching schedule for date:", formatDateString(date));
    
    setLoading(true);
    try {
      // Use the new getScheduleByDate method directly instead of fetching schedules first
      const scheduleData = await ScheduleService.getScheduleByDate(
        selectedOrg.id,
        formatDateString(date)
      );
      
      console.log("Schedule data for date:", scheduleData);
      
      if (scheduleData) {
        // Make sure scheduleData and its properties exist before proceeding
        
        // Initialize employees array safely
        const employeeList = scheduleData.employees || [];
        
        // Convert service types to component types with proper type checking
        const convertedSchedule: Schedule = {
          ...scheduleData,
          employees: employeeList.map(emp => ({
            id: emp.id,
            name: emp.name || "Unknown",
            type: (emp.type as EmployeeType) || "FLEX",
            task: (emp.task as EmployeeTask) || undefined,
            status: (emp.status as EmployeeScheduleStatus) || undefined,
            efficiency: emp.efficiency || 1.0,
            stowerEff: emp.stowerEff || 1.0,
            inductorEff: emp.inductorEff || 1.0,
            downstackerEff: emp.downstackerEff || 1.0
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
        
        // Generate workforce plans with the fixed function
        generateWorkforcePlans(convertedSchedule.employees);
      } else {
        // No schedule found for this date
        console.log("No schedule found for date:", formatDateString(date));
        setSchedule(null);
        setScheduledEmployees([]);
        setTaskAssignments({});
        setWorkforcePlans(null);
        setSelectedPlan(null);
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
      
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      
      toast.error("Failed to fetch schedule for the selected date");
      
      // Reset states on error
      setSchedule(null);
      setScheduledEmployees([]);
      setTaskAssignments({});
      setWorkforcePlans(null);
      setSelectedPlan(null);
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
    if (!employees || employees.length === 0) {
      console.log("No employees to generate workforce plans for");
      return;
    }
    
    console.log("Generating workforce plans for", employees.length, "employees");
    
    // Get employee IDs
    const employeeIds = employees.map(emp => emp.id);
    
    // Function to randomly select n employees from the list
    const selectRandomEmployees = (count: number) => {
      // Make sure we don't try to select more employees than we have
      const actualCount = Math.min(count, employeeIds.length);
      const shuffled = [...employeeIds].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, actualCount);
    };
    
    // Generate random work history for demonstration purposes (in hours)
    const generateWorkHistory = () => Math.floor(Math.random() * 10) * 5; // Multiply by 5 hours per shift
    
    // Create empty plans structure first
    let plans: WorkforcePlans = {
      High: {
        Inductor: [],
        Downstackers: [],
        Stowers: []
      },
      Medium: {
        Inductor: [],
        Downstackers: [],
        Stowers: []
      },
      Low: {
        Inductor: [],
        Downstackers: [],
        Stowers: []
      }
    };
    
    // === PLAN 1 ===
    
    // Find an employee with high inductor efficiency for first plan
    const plan1InductorEmployee = employeeIds.find(id => {
      const emp = employees.find(e => e.id === id);
      return emp && emp.inductorEff && emp.inductorEff > 1.5;
    }) || employeeIds[0];
    
    // Add inductor to first plan
    plans.High.Inductor = [{
      "Employee ID": plan1InductorEmployee,
      "Times Worked (Last 30 Days)": generateWorkHistory()
    }];
    
    // Select downstackers for first plan
    const plan1Downstackers = selectRandomEmployees(2);
    plans.High.Downstackers = plan1Downstackers.map(id => ({
      "Employee ID": id,
      "Times Worked (Last 30 Days)": generateWorkHistory()
    }));
    
    // Assign remaining employees as stowers for first plan
    const assignedPlan1Ids = new Set([plan1InductorEmployee, ...plan1Downstackers]);
    plans.High.Stowers = employeeIds
      .filter(id => !assignedPlan1Ids.has(id))
      .map(id => ({
        "Employee ID": id,
        "Times Worked (Last 30 Days)": generateWorkHistory()
      }));
    
    // === PLAN 2 ===
    
    // Find an employee with medium inductor efficiency for second plan
    const plan2InductorEmployee = employeeIds.find(id => {
      const emp = employees.find(e => e.id === id);
      return emp && emp.inductorEff && emp.inductorEff > 1.2 && emp.inductorEff <= 1.5;
    }) || employeeIds[Math.min(1, employeeIds.length - 1)] || employeeIds[0];
    
    // Add inductor to second plan
    plans.Medium.Inductor = [{
      "Employee ID": plan2InductorEmployee,
      "Times Worked (Last 30 Days)": generateWorkHistory()
    }];
    
    // Select downstackers for second plan
    const plan2Downstackers = selectRandomEmployees(Math.min(3, employeeIds.length - 1));
    plans.Medium.Downstackers = plan2Downstackers.map(id => ({
      "Employee ID": id,
      "Times Worked (Last 30 Days)": generateWorkHistory()
    }));
    
    // Assign remaining employees as stowers for second plan
    const assignedPlan2Ids = new Set([plan2InductorEmployee, ...plan2Downstackers]);
    plans.Medium.Stowers = employeeIds
      .filter(id => !assignedPlan2Ids.has(id))
      .map(id => ({
        "Employee ID": id,
        "Times Worked (Last 30 Days)": generateWorkHistory()
      }));
    
    // === PLAN 3 ===
    
    // Find an employee with low inductor efficiency for third plan
    const plan3InductorEmployee = employeeIds.find(id => {
      const emp = employees.find(e => e.id === id);
      return emp && emp.inductorEff && emp.inductorEff <= 1.2;
    }) || employeeIds[Math.min(2, employeeIds.length - 1)] || employeeIds[0];
    
    // Add inductor to third plan
    plans.Low.Inductor = [{
      "Employee ID": plan3InductorEmployee,
      "Times Worked (Last 30 Days)": generateWorkHistory()
    }];
    
    // Select downstackers for third plan
    const plan3Downstackers = selectRandomEmployees(1);
    plans.Low.Downstackers = plan3Downstackers.map(id => ({
      "Employee ID": id,
      "Times Worked (Last 30 Days)": generateWorkHistory()
    }));
    
    // Assign remaining employees as stowers for third plan
    const assignedPlan3Ids = new Set([plan3InductorEmployee, ...plan3Downstackers]);
    plans.Low.Stowers = employeeIds
      .filter(id => !assignedPlan3Ids.has(id))
      .map(id => ({
        "Employee ID": id,
        "Times Worked (Last 30 Days)": generateWorkHistory()
      }));
    
    // NEW CODE: Reorder plans based on actual completion time
    if (schedule?.shift?.totalPackages) {
      // Use our completion time calculation to determine which plan is fastest
      const calculatePlanTime = (planType: "High" | "Medium" | "Low") => {
        const plan = plans[planType];
        const totalPackages = schedule.shift!.totalPackages;
        
        // Calculate total efficiency for each task type
        let inductorEfficiency = 0;
        let downstackerEfficiency = 0;
        let stowerEfficiency = 0;
        
        // Calculate inductor total efficiency
        plan.Inductor.forEach(emp => {
          const employee = findEmployeeById(emp["Employee ID"]);
          if (employee) {
            inductorEfficiency += (employee.inductorEff || 1.0);
          }
        });
        
        // Calculate downstacker total efficiency
        plan.Downstackers.forEach(emp => {
          const employee = findEmployeeById(emp["Employee ID"]);
          if (employee) {
            downstackerEfficiency += (employee.downstackerEff || 1.0);
          }
        });
        
        // Calculate stower total efficiency
        plan.Stowers.forEach(emp => {
          const employee = findEmployeeById(emp["Employee ID"]);
          if (employee) {
            stowerEfficiency += (employee.stowerEff || 1.0);
          }
        });
        
        // Calculate time needed for each task type (packages / total efficiency)
        const inductorTime = inductorEfficiency > 0 ? totalPackages / (inductorEfficiency * TASKS.find(t => t.id === "INDUCTOR")!.baseRate) : Infinity;
        const downstackerTime = downstackerEfficiency > 0 ? totalPackages / (downstackerEfficiency * TASKS.find(t => t.id === "DOWNSTACKER")!.baseRate) : Infinity;
        const stowerTime = stowerEfficiency > 0 ? totalPackages / (stowerEfficiency * TASKS.find(t => t.id === "STOWER")!.baseRate) : Infinity;
        
        // Get the maximum time (bottleneck)
        return Math.max(inductorTime, downstackerTime, stowerTime);
      };
      
      // Calculate completion time for each plan
      const planTimes = {
        High: calculateCompletionTimeValue("High"),
        Medium: calculateCompletionTimeValue("Medium"),
        Low: calculateCompletionTimeValue("Low")
      };
      
      console.log("Original plan times:", planTimes);
      
      // Sort plans by completion time
      const sortedPlans = Object.entries(planTimes)
        .sort((a, b) => a[1] - b[1])
        .map(entry => entry[0] as "High" | "Medium" | "Low");
      
      console.log("Sorted plans by completion time:", sortedPlans);
      
      // Reorder plans based on completion time (fastest to slowest)
      if (sortedPlans.length === 3) {
        const reorderedPlans = {
          High: plans[sortedPlans[0]],
          Medium: plans[sortedPlans[1]],
          Low: plans[sortedPlans[2]]
        };
        
        plans = reorderedPlans;
        console.log("Reordered plans based on completion time");
      }
    }
    
    console.log("Generated workforce plans:", plans);
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
    console.log("Schedule changed:", schedule);
    if (schedule) {
      console.log("Fetching workforce plans for schedule:", schedule.id);
      fetchWorkforcePlans();
    }
  }, [schedule]);
  
  // Update when date changes
  useEffect(() => {
    console.log("Date changed:", date);
    if (date && selectedOrg) {
      console.log("Fetching schedule for date:", date);
      fetchSchedule();
    }
  }, [date, selectedOrg]);

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
  const calculateCompletionTimeValue = (planType: "High" | "Medium" | "Low") => {
    if (!workforcePlans || !schedule?.shift?.totalPackages) return Infinity;
    
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
    return Math.max(inductorTime, downstackerTime, stowerTime);
  };
  
  // The formatted version for display
  const calculateCompletionTime = (planType: "High" | "Medium" | "Low") => {
    const maxTime = calculateCompletionTimeValue(planType);
    
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
                  <TableHead>Hours Worked (Last 30 Days)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledEmployees.map(employee => {
                  const currentTask = taskAssignments[employee.id] || employee.task;
                  // Find hours worked from workforcePlans
                  let hoursWorked = 0;
                  
                  if (workforcePlans && selectedPlan) {
                    const plan = workforcePlans[selectedPlan];
                    
                    // Check if employee is an inductor
                    const inductorEntry = plan.Inductor.find(emp => emp["Employee ID"] === employee.id);
                    if (inductorEntry) {
                      hoursWorked = inductorEntry["Times Worked (Last 30 Days)"];
                    }
                    
                    // Check if employee is a downstacker
                    const downstackerEntry = plan.Downstackers.find(emp => emp["Employee ID"] === employee.id);
                    if (downstackerEntry) {
                      hoursWorked = downstackerEntry["Times Worked (Last 30 Days)"];
                    }
                    
                    // Check if employee is a stower
                    const stowerEntry = plan.Stowers.find(emp => emp["Employee ID"] === employee.id);
                    if (stowerEntry) {
                      hoursWorked = stowerEntry["Times Worked (Last 30 Days)"];
                    }
                  }
                  
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
                      <TableCell>
                        {hoursWorked} hrs
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