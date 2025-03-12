"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CircularProgress } from "@/components/ui/progress";
import { CalendarIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useOrgStore } from "@/store";
import toast from "react-hot-toast";

// Task types
const TASKS = [
  { id: "1", name: "Inductor", baseRate: 100 },
  { id: "2", name: "Downstacker", baseRate: 150 },
  { id: "3", name: "Stower", baseRate: 200 }
];

// Mock data for employees
const EMPLOYEES = [
  { 
    id: "EMP001", 
    name: "Sarah Johnson", 
    age: 38, 
    gender: "F", 
    scheduleType: "Flexible", 
    experience: 13,
    efficiency: {
      "1": 1.5, // Inductor
      "2": 1.8, // Downstacker
      "3": 1.3  // Stower
    }
  },
  { 
    id: "EMP002", 
    name: "John Smith", 
    age: 34, 
    gender: "M", 
    scheduleType: "Flexible", 
    experience: 7,
    efficiency: {
      "1": 1.2,
      "2": 1.6,
      "3": 1.9
    }
  },
  { 
    id: "EMP003", 
    name: "David Lee", 
    age: 39, 
    gender: "M", 
    scheduleType: "Fixed", 
    experience: 8,
    efficiency: {
      "1": 1.9,
      "2": 1.3,
      "3": 1.4
    }
  },
  { 
    id: "EMP004", 
    name: "Maria Garcia", 
    age: 28, 
    gender: "F", 
    scheduleType: "Fixed", 
    experience: 5,
    efficiency: {
      "1": 1.7,
      "2": 1.2,
      "3": 1.6
    }
  },
  { 
    id: "EMP005", 
    name: "Robert Chen", 
    age: 41, 
    gender: "M", 
    scheduleType: "Flexible", 
    experience: 15,
    efficiency: {
      "1": 1.4,
      "2": 1.7,
      "3": 1.8
    }
  },
  { 
    id: "EMP006", 
    name: "Emma Wilson", 
    age: 33, 
    gender: "F", 
    scheduleType: "Fixed", 
    experience: 8,
    efficiency: {
      "1": 1.6,
      "2": 1.9,
      "3": 1.4
    }
  },
  { 
    id: "EMP007", 
    name: "Michael Brown", 
    age: 46, 
    gender: "M", 
    scheduleType: "Flexible", 
    experience: 3,
    efficiency: {
      "1": 1.3,
      "2": 1.5,
      "3": 1.8
    }
  },
  { 
    id: "EMP008", 
    name: "Jennifer Lopez", 
    age: 40, 
    gender: "F", 
    scheduleType: "Fixed", 
    experience: 9,
    efficiency: {
      "1": 1.8,
      "2": 1.5,
      "3": 1.3
    }
  },
  { 
    id: "EMP009", 
    name: "James Taylor", 
    age: 31, 
    gender: "M", 
    scheduleType: "Fixed", 
    experience: 5,
    efficiency: {
      "1": 1.4,
      "2": 1.9,
      "3": 1.5
    }
  },
  { 
    id: "EMP010", 
    name: "Emily Davis", 
    age: 38, 
    gender: "F", 
    scheduleType: "Fixed", 
    experience: 6,
    efficiency: {
      "1": 1.9,
      "2": 1.4,
      "3": 1.6
    }
  },
  { 
    id: "EMP011", 
    name: "Daniel Martin", 
    age: 31, 
    gender: "M", 
    scheduleType: "Flexible", 
    experience: 5,
    efficiency: {
      "1": 1.7,
      "2": 1.4,
      "3": 1.6
    }
  },
  { 
    id: "EMP012", 
    name: "Thomas Wright", 
    age: 31, 
    gender: "M", 
    scheduleType: "Flexible", 
    experience: 15,
    efficiency: {
      "1": 1.5,
      "2": 1.8,
      "3": 1.3
    }
  },
  { 
    id: "EMP013", 
    name: "Jessica Adams", 
    age: 36, 
    gender: "F", 
    scheduleType: "Flexible", 
    experience: 7,
    efficiency: {
      "1": 1.8,
      "2": 1.5,
      "3": 1.7
    }
  },
  { 
    id: "EMP014", 
    name: "Kevin Walker", 
    age: 22, 
    gender: "M", 
    scheduleType: "Flexible", 
    experience: 3,
    efficiency: {
      "1": 1.3,
      "2": 1.6,
      "3": 1.9
    }
  },
  { 
    id: "EMP015", 
    name: "Lisa Thompson", 
    age: 29, 
    gender: "F", 
    scheduleType: "Fixed", 
    experience: 4,
    efficiency: {
      "1": 1.6,
      "2": 1.4,
      "3": 1.8
    }
  }
];

// Generate random schedule data for the next 30 days
const generateSchedules = () => {
  const schedules = [];
  const currentDate = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(currentDate.getDate() + i);
    const dateString = formatDate(date);
    
    // Randomly select 8-10 employees for this day
    const employeeCount = Math.floor(Math.random() * 3) + 8; // 8-10 employees
    const shuffledEmployees = [...EMPLOYEES]
      .sort(() => 0.5 - Math.random())
      .slice(0, employeeCount);
    
    schedules.push({
      date: dateString,
      employees: shuffledEmployees.map(emp => emp.id)
    });
  }
  
  return schedules;
};

// Mock schedule data
const SCHEDULES = generateSchedules();

// Mock assignments
const INITIAL_ASSIGNMENTS = [
  { date: "2025-03-03", employeeId: "EMP001", taskId: "2" },
  { date: "2025-03-03", employeeId: "EMP002", taskId: "3" },
  { date: "2025-03-04", employeeId: "EMP004", taskId: "1" }
];

const TaskAllocationPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(false);
  const [scheduledEmployees, setScheduledEmployees] = useState<any[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<any[]>(INITIAL_ASSIGNMENTS);
  const [suggestions, setSuggestions] = useState<any>({});
  const { selectedOrg } = useOrgStore();

  // Helper function to format date
  const formatDateString = (date: Date | undefined) => {
    if (!date) return "";
    return formatDate(date);
  };

  // Fetch scheduled employees for the selected date
  const fetchScheduledEmployees = () => {
    setLoading(true);
    
    // Format date to string for comparison with mock data
    const dateString = formatDateString(date);
    
    // Find the schedule for the selected date
    const schedule = SCHEDULES.find(s => s.date === dateString);
    
    if (schedule) {
      // Get the employee details for scheduled employees
      const employees = schedule.employees.map(empId => {
        return EMPLOYEES.find(emp => emp.id === empId);
      }).filter(Boolean);
      
      setScheduledEmployees(employees);
      generateSuggestions(employees, dateString);
    } else {
      // If no schedule found for this specific date, generate one on the fly
      // This ensures employees always show up regardless of date selected
      const employeeCount = Math.floor(Math.random() * 3) + 8; // 8-10 employees
      const randomEmployees = [...EMPLOYEES]
        .sort(() => 0.5 - Math.random())
        .slice(0, employeeCount);
      
      setScheduledEmployees(randomEmployees);
      generateSuggestions(randomEmployees, dateString);
    }
    
    setLoading(false);
  };

  // Generate task suggestions based on efficiency scores
  const generateSuggestions = (employees: any[], dateString: string) => {
    const newSuggestions: any = {};
    
    employees.forEach(employee => {
      if (!employee) return;
      
      // Find the task with highest efficiency for this employee
      let bestTaskId = null;
      let bestEfficiency = 0;
      
      Object.entries(employee.efficiency).forEach(([taskId, efficiency]) => {
        if (Number(efficiency) > bestEfficiency) {
          bestEfficiency = Number(efficiency);
          bestTaskId = taskId;
        }
      });
      
      if (bestTaskId) {
        newSuggestions[employee.id] = bestTaskId;
      }
    });
    
    setSuggestions(newSuggestions);
  };

  // Assign a task to an employee
  const assignTask = (employeeId: string, taskId: string) => {
    const dateString = date ? formatDate(date) : "";
    
    // Check if assignment already exists
    const existingIndex = taskAssignments.findIndex(
      a => a.date === dateString && a.employeeId === employeeId
    );
    
    if (existingIndex >= 0) {
      // Update existing assignment
      const newAssignments = [...taskAssignments];
      newAssignments[existingIndex] = { 
        date: dateString, 
        employeeId, 
        taskId 
      };
      setTaskAssignments(newAssignments);
    } else {
      // Add new assignment
      setTaskAssignments([
        ...taskAssignments,
        { date: dateString, employeeId, taskId }
      ]);
    }
    
    toast.success(`Task assigned successfully`);
  };

  // Get the current task assignment for an employee
  const getCurrentAssignment = (employeeId: string) => {
    const dateString = date ? formatDate(date) : "";
    return taskAssignments.find(
      a => a.date === dateString && a.employeeId === employeeId
    );
  };

  // Calculate performance metric for an employee-task combination
  const calculatePerformance = (employee: any, taskId: string) => {
    const task = TASKS.find(t => t.id === taskId);
    if (!task || !employee) return 0;
    
    const efficiency = employee.efficiency[taskId] || 1.0;
    return task.baseRate * efficiency;
  };

  // Update when date changes
  useEffect(() => {
    if (date) {
      fetchScheduledEmployees();
    }
  }, [date]);

  // Auto-assign tasks based on suggestions with operational constraints
  const autoAssignTasks = () => {
    const dateString = formatDateString(date);
    
    // Create optimization problem:
    // 1. Sort employees by their efficiency for each task type
    // 2. Allocate best employees to each task type within constraints
    // 3. Maintain the operational constraints (1-2 inductors, max 3 downstackers)
    
    // Define types for employee data
    interface EmployeeEfficiency {
      id: string;
      inductorScore: number;
      downstackerScore: number;
      stowerScore: number;
    }
    
    // Define type for task allocation
    interface TaskAllocation {
      [employeeId: string]: string;
    }
    
    // Get efficiency data for all scheduled employees
    const employeeData: EmployeeEfficiency[] = scheduledEmployees.map(employee => ({
      id: employee.id,
      inductorScore: employee.efficiency["1"] || 1.0,
      downstackerScore: employee.efficiency["2"] || 1.0,
      stowerScore: employee.efficiency["3"] || 1.0
    }));
    
    // Sort employees by their inductor efficiency (highest first)
    const inductorCandidates = [...employeeData]
      .sort((a, b) => b.inductorScore - a.inductorScore);
    
    // Sort employees by their downstacker efficiency
    const downstackerCandidates = [...employeeData]
      .sort((a, b) => b.downstackerScore - a.downstackerScore);
    
    // Sort employees by their stower efficiency
    const stowerCandidates = [...employeeData]
      .sort((a, b) => b.stowerScore - a.stowerScore);
    
    // Allocate tasks within constraints
    const taskAllocation: TaskAllocation = {}; 
    const usedEmployees = new Set<string>();
    
    // Step 1: Allocate 1-2 inductors (based on team size)
    const inductorCount = scheduledEmployees.length <= 8 ? 1 : 2;
    for (let i = 0; i < inductorCount; i++) {
      // Find next best inductor who hasn't been assigned
      for (const candidate of inductorCandidates) {
        if (!usedEmployees.has(candidate.id)) {
          taskAllocation[candidate.id] = "1"; // Assign to inductor task
          usedEmployees.add(candidate.id);
          break;
        }
      }
    }
    
    // Step 2: Allocate up to 3 downstackers (based on team size)
    const downstackerCount = Math.min(3, Math.floor(scheduledEmployees.length * 0.3));
    for (let i = 0; i < downstackerCount; i++) {
      // Find next best downstacker who hasn't been assigned
      for (const candidate of downstackerCandidates) {
        if (!usedEmployees.has(candidate.id)) {
          taskAllocation[candidate.id] = "2"; // Assign to downstacker task
          usedEmployees.add(candidate.id);
          break;
        }
      }
    }
    
    // Step 3: Assign all remaining employees as stowers
    for (const employee of scheduledEmployees) {
      if (!usedEmployees.has(employee.id)) {
        taskAllocation[employee.id] = "3"; // Assign to stower task
        usedEmployees.add(employee.id);
      }
    }
    
    // Create new assignments from the allocation
    const newAssignments = [...taskAssignments];
    
    // Update assignments based on optimization
    Object.entries(taskAllocation).forEach(([employeeId, taskId]) => {
      // Check if assignment already exists
      const existingIndex = newAssignments.findIndex(
        a => a.date === dateString && a.employeeId === employeeId
      );
      
      if (existingIndex >= 0) {
        // Update existing assignment
        newAssignments[existingIndex] = { 
          date: dateString, 
          employeeId, 
          taskId 
        };
      } else {
        // Add new assignment
        newAssignments.push({ 
          date: dateString, 
          employeeId, 
          taskId 
        });
      }
    });
    
    setTaskAssignments(newAssignments);
    
    // Count the assigned roles
    const inductors = Object.values(taskAllocation).filter(t => t === "1").length;
    const downstackers = Object.values(taskAllocation).filter(t => t === "2").length;
    const stowers = Object.values(taskAllocation).filter(t => t === "3").length;
    
    toast.success(
      `Auto-assigned tasks: ${inductors} inductors, ${downstackers} downstackers, ${stowers} stowers`
    );
  };

  // Save all assignments
  const saveAssignments = () => {
    // Here you would call your API to persist the assignments
    toast.success("Task assignments saved successfully");
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Task Allocation</h1>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="w-full lg:w-1/3">
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
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
            
            <div className="mt-6">
              <h3 className="font-medium mb-2">Tasks</h3>
              <div className="space-y-2">
                {TASKS.map(task => (
                  <div key={task.id} className="flex justify-between items-center">
                    <span>{task.name}</span>
                    <span className="text-sm text-muted-foreground">
                      Base: {task.baseRate} units/hr
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <Button 
              className="w-full mt-6" 
              onClick={autoAssignTasks}
              disabled={scheduledEmployees.length === 0}
            >
              Auto-Assign Tasks (ML)
            </Button>
            
            <Button 
              className="w-full mt-2" 
              variant="outline"
              onClick={saveAssignments}
              disabled={scheduledEmployees.length === 0}
            >
              Save Assignments
            </Button>
          </CardContent>
        </Card>
        
        <Card className="w-full lg:w-2/3">
          <CardHeader>
            <CardTitle>
              Employee Task Assignments
              {date && <span className="ml-2 text-muted-foreground">({formatDate(date)})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <CircularProgress value={50} color="primary" loading />
              </div>
            ) : scheduledEmployees.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  No employees scheduled for this date.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please select a different date or schedule employees first.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Efficiency</TableHead>
                    <TableHead>Estimated Output</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledEmployees.map(employee => {
                    const currentAssignment = getCurrentAssignment(employee.id);
                    const suggestedTaskId = suggestions[employee.id];
                    
                    return (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {employee.id} • {employee.scheduleType}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{employee.experience} years</TableCell>
                        <TableCell>
                          <Select
                            value={currentAssignment?.taskId || ""}
                            onValueChange={(value) => assignTask(employee.id, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select task" />
                            </SelectTrigger>
                            <SelectContent>
                              {TASKS.map(task => (
                                <SelectItem 
                                  key={task.id} 
                                  value={task.id}
                                  className={cn(
                                    suggestedTaskId === task.id && "font-medium"
                                  )}
                                >
                                  {task.name}
                                  {suggestedTaskId === task.id && (
                                    <Badge className="ml-2 bg-success/20 hover:bg-success/30 text-success-foreground">
                                      Recommended
                                    </Badge>
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {currentAssignment?.taskId ? (
                            <div className="flex items-center">
                              <span className="font-medium">
                                {(employee.efficiency[currentAssignment.taskId] || 1.0).toFixed(1)}x
                              </span>
                              {suggestedTaskId === currentAssignment.taskId && (
                                <CheckCircle2 className="h-4 w-4 text-success ml-2" />
                              )}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {currentAssignment?.taskId ? (
                            <div>
                              {calculatePerformance(employee, currentAssignment.taskId)} units/hr
                            </div>
                          ) : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaskAllocationPage;