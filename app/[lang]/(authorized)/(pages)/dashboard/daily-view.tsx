"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });
import { useTheme } from 'next-themes';
import { useToast } from '@/components/ui/use-toast';

// Validation schema for the form
const formSchema = z.object({
  date: z.date({
    required_error: "Please select a date",
  }),
  comparisonType: z.enum(["overall", "employee", "taskType"]),
  selectedEntity: z.string().optional(),
  entries: z.array(
    z.object({
      hours: z.number().min(0.25).max(5),
      packages: z.number().min(1),
    })
  ),
});

interface ScheduledEmployee {
  id: number;
  name: string;
  task: string | null;
  type: string;
  efficiency: number;
  status: string;
  avgEfficiency: number;
  inductorEff: number;
  stowerEff: number;
  downstackerEff: number;
}

interface Schedule {
  id: number;
  date: string;
  status: string;
  shift?: {
    id: number;
    totalPackages: number;
    status: string;
    completedCount: number;
  };
  employees: ScheduledEmployee[];
  vet?: {
    id: number;
    status: string;
    targetPackageCount: number;
    openedAt: string;
    closedAt?: string;
    scheduleId: number;
  };
  fixedEmployeesEfficiency: number;
  remainingPackages: number;
}

const DailyPerformanceView = () => {
  const { theme: mode } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [fetchingSchedule, setFetchingSchedule] = useState(false);
  const [noScheduleFound, setNoScheduleFound] = useState(false);
  const [organizationId, setOrganizationId] = useState(1); // Default org ID, can be changed based on user session

  // Initialize form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      comparisonType: "overall",
      selectedEntity: undefined,
      entries: [{ hours: 0.5, packages: 25 }],
    },
  });

  // Watch for changes in form values
  const comparisonType = form.watch('comparisonType');
  const selectedEntity = form.watch('selectedEntity');
  const entries = form.watch('entries');
  const date = form.watch('date');

  // Fetch schedule and employees when date changes
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!date) return;
      
      setFetchingSchedule(true);
      setNoScheduleFound(false);
      try {
        // Format date as YYYY-MM-DD
        const formattedDate = format(date, 'yyyy-MM-dd');
        
        // Use the schedules/date API endpoint
        const response = await fetch(`/api/schedules/date?date=${formattedDate}&organizationId=${organizationId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch schedule');
        }
        
        const result = await response.json();
        
        if (result.success) {
          setSchedule(result.data);
        } else {
          setNoScheduleFound(true);
        }
        
        // Reset selected entity when date changes
        form.setValue('selectedEntity', undefined);
        // Reset entries to a single entry
        form.setValue('entries', [{ hours: 0.5, packages: 25 }]);
      } catch (error) {
        console.error('Error fetching schedule:', error);
        toast({
          title: "Error",
          description: "Failed to load schedule data. Please try again.",
        });
        setNoScheduleFound(true);
      } finally {
        setFetchingSchedule(false);
      }
    };

    fetchSchedule();
  }, [date, organizationId, toast, form]);

  // Calculate the next entry values based on the last entry
  const calculateNextEntryValues = () => {
    const currentEntries = form.getValues('entries');
    if (currentEntries.length === 0) return { hours: 0.5, packages: 25 };
    
    const lastEntry = currentEntries[currentEntries.length - 1];
    return {
      hours: lastEntry.hours + 0.5,
      packages: lastEntry.packages + 25
    };
  };

  // Add a new entry to the form
  const addEntry = () => {
    const currentEntries = form.getValues('entries');
    const newEntryValues = calculateNextEntryValues();
    form.setValue('entries', [...currentEntries, newEntryValues]);
  };

  // Remove an entry from the form
  const removeEntry = (index: number) => {
    const currentEntries = form.getValues('entries');
    if (currentEntries.length > 1) {
      form.setValue('entries', currentEntries.filter((_, i) => i !== index));
    } else {
      toast({
        title: "Cannot remove entry",
        description: "At least one entry is required.",
      });
    }
  };

  // Generate chart data based on form values
  useEffect(() => {
    if (entries.length === 0 || !schedule) return;

    // Sort entries by hours
    const sortedEntries = [...entries].sort((a, b) => a.hours - b.hours);
    
    // Create cumulative data points for actual performance
    const actualData = sortedEntries.reduce((acc, entry, index) => {
      const previousHours = index > 0 ? sortedEntries[index - 1].hours : 0;
      const previousPackages = index > 0 ? acc[index - 1].y : 0;
      
      return [...acc, {
        x: entry.hours,
        y: previousPackages + entry.packages
      }];
    }, [] as { x: number, y: number }[]);

    // Add a starting point at (0,0)
    actualData.unshift({ x: 0, y: 0 });

    // Calculate expected performance rate
    let expectedRate = 0;
    let taskTypeName = '';

    if (comparisonType === 'overall') {
      // For overall, use the total packages for the day divided by 5 hours
      if (schedule.shift?.totalPackages) {
        expectedRate = schedule.shift.totalPackages / 5;
      }
      taskTypeName = 'Overall';
    } else if (comparisonType === 'employee' && selectedEntity) {
      // Find the selected employee
      const employee = schedule.employees.find(emp => emp.id.toString() === selectedEntity);
      
      if (employee && employee.task) {
        // Use the employee's task-specific efficiency directly
        if (employee.task === 'INDUCTOR') expectedRate = employee.inductorEff;
        else if (employee.task === 'STOWER') expectedRate = employee.stowerEff;
        else if (employee.task === 'DOWNSTACKER') expectedRate = employee.downstackerEff;
        else expectedRate = employee.avgEfficiency;
        
        taskTypeName = employee.name;
      }
    } else if (comparisonType === 'taskType' && selectedEntity) {
      // Get all employees with the selected task
      const taskEmployees = schedule.employees.filter(emp => emp.task === selectedEntity);
      
      if (taskEmployees.length > 0) {
        let totalEfficiency = 0;
        
        // Sum up the task-specific efficiencies
        taskEmployees.forEach(emp => {
          if (selectedEntity === 'INDUCTOR') totalEfficiency += emp.inductorEff;
          else if (selectedEntity === 'STOWER') totalEfficiency += emp.stowerEff;
          else if (selectedEntity === 'DOWNSTACKER') totalEfficiency += emp.downstackerEff;
          else totalEfficiency += emp.avgEfficiency;
        });
        
        expectedRate = totalEfficiency;
        taskTypeName = selectedEntity.charAt(0) + selectedEntity.slice(1).toLowerCase() + 's';
      }
    }

    // Generate expected performance data points
    const expectedData = [];
    for (let hour = 0; hour <= 5; hour += 0.5) {
      expectedData.push({
        x: hour,
        y: Math.round(hour * expectedRate)
      });
    }

    // Create chart data
    setChartData({
      series: [
        {
          name: `Expected (${taskTypeName})`,
          data: expectedData
        },
        {
          name: 'Actual Performance',
          data: actualData
        }
      ],
      options: {
        chart: {
          type: 'line',
          height: 350,
          zoom: {
            enabled: false
          },
          toolbar: {
            show: false
          }
        },
        colors: ['#888888', '#10b981'],
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'smooth',
          width: [2, 3]
        },
        grid: {
          borderColor: mode === 'dark' ? '#333' : '#e5e7eb',
        },
        markers: {
          size: 4,
          colors: ['#888888', '#10b981'],
          strokeWidth: 0
        },
        xaxis: {
          title: {
            text: 'Hours',
            style: {
              fontSize: '12px',
              fontWeight: 500,
              color: mode === 'dark' ? '#e5e7eb' : '#6b7280'
            }
          },
          tickAmount: 10,
          min: 0,
          max: 5,
          labels: {
            formatter: function(val: number) {
              return val.toFixed(1);
            },
            style: {
              colors: mode === 'dark' ? '#e5e7eb' : '#6b7280'
            }
          }
        },
        yaxis: {
          title: {
            text: 'Packages',
            style: {
              fontSize: '12px',
              fontWeight: 500,
              color: mode === 'dark' ? '#e5e7eb' : '#6b7280'
            }
          },
          min: 0,
          forceNiceScale: true,
          labels: {
            style: {
              colors: mode === 'dark' ? '#e5e7eb' : '#6b7280'
            }
          }
        },
        legend: {
          position: 'top',
          horizontalAlign: 'right',
          labels: {
            colors: mode === 'dark' ? '#e5e7eb' : '#6b7280'
          }
        },
        tooltip: {
          theme: mode === 'dark' ? 'dark' : 'light',
          x: {
            show: true,
            formatter: function(val: number) {
              return val.toFixed(1) + ' hrs';
            }
          },
          y: {
            formatter: function(val: number) {
              return val + ' packages';
            }
          }
        },
        annotations: {
          yaxis: [{
            y: actualData.length > 0 ? actualData[actualData.length - 1].y : 0,
            borderColor: '#10b981',
            label: {
              borderColor: '#10b981',
              style: {
                color: '#fff',
                background: '#10b981'
              },
              text: 'Total: ' + (actualData.length > 0 ? actualData[actualData.length - 1].y : 0) + ' packages'
            }
          }]
        }
      }
    });
  }, [comparisonType, selectedEntity, entries, mode, schedule]);

  // Calculate total packages and efficiency
  const totalHours = entries.reduce((total, entry) => total + entry.hours, 0);
  const totalPackages = entries.reduce((total, entry) => total + entry.packages, 0);
  
  let efficiencyRate = 0;
  let comparisonRate = 0;
  let efficiencyContext = '';
  
  if (totalHours > 0) {
    efficiencyRate = Math.round(totalPackages / totalHours);
    
    if (schedule) {
      if (comparisonType === 'overall') {
        // Calculate average efficiency for all employees
        const activeEmployees = schedule.employees.filter(emp => emp.task);
        
        if (activeEmployees.length > 0) {
          let totalEfficiency = 0;
          
          activeEmployees.forEach(emp => {
            if (emp.task === 'INDUCTOR') totalEfficiency += emp.inductorEff;
            else if (emp.task === 'STOWER') totalEfficiency += emp.stowerEff;
            else if (emp.task === 'DOWNSTACKER') totalEfficiency += emp.downstackerEff;
            else totalEfficiency += emp.avgEfficiency;
          });
          
          comparisonRate = totalEfficiency / activeEmployees.length;
        }
        
        efficiencyContext = 'Overall';
      } else if (comparisonType === 'employee' && selectedEntity) {
        // Get selected employee's efficiency
        const employee = schedule.employees.find(emp => emp.id.toString() === selectedEntity);
        
        if (employee && employee.task) {
          if (employee.task === 'INDUCTOR') comparisonRate = employee.inductorEff;
          else if (employee.task === 'STOWER') comparisonRate = employee.stowerEff;
          else if (employee.task === 'DOWNSTACKER') comparisonRate = employee.downstackerEff;
          else comparisonRate = employee.avgEfficiency;
          
          efficiencyContext = employee.name;
        }
      } else if (comparisonType === 'taskType' && selectedEntity) {
        // Get average efficiency for selected task
        const taskEmployees = schedule.employees.filter(emp => emp.task === selectedEntity);
        
        if (taskEmployees.length > 0) {
          let totalEfficiency = 0;
          
          taskEmployees.forEach(emp => {
            if (selectedEntity === 'INDUCTOR') totalEfficiency += emp.inductorEff;
            else if (selectedEntity === 'STOWER') totalEfficiency += emp.stowerEff;
            else if (selectedEntity === 'DOWNSTACKER') totalEfficiency += emp.downstackerEff;
            else totalEfficiency += emp.avgEfficiency;
          });
          
          comparisonRate = totalEfficiency / taskEmployees.length;
          efficiencyContext = selectedEntity.charAt(0) + selectedEntity.slice(1).toLowerCase() + 's';
        }
      }
    }
  }
  
  const efficiencyPercentage = comparisonRate > 0 ? Math.round((efficiencyRate / comparisonRate) * 100) : 0;

  // Save performance data to database
  const savePerformanceData = async (data: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const response = await fetch('/api/performance-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: format(data.date, 'yyyy-MM-dd'),
          comparisonType: data.comparisonType,
          selectedEntity: data.selectedEntity,
          entries: data.entries,
          totalHours,
          totalPackages,
          efficiencyRate,
          efficiencyPercentage,
          scheduleId: schedule?.id
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save performance data');
      }
      
      toast({
        title: "Success",
        description: "Performance data saved successfully",
      });
    } catch (error) {
      console.error('Error saving performance data:', error);
      toast({
        title: "Error",
        description: "Failed to save performance data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Submit handler
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    savePerformanceData(data);
  };

  // Get scheduled employees with tasks
  const scheduledEmployeesWithTasks = schedule?.employees.filter(emp => emp.task) || [];
  
  // Get schedule status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-yellow-200 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-200 text-blue-800';
      case 'IN_PROGRESS': return 'bg-green-200 text-green-800';
      case 'COMPLETED': return 'bg-purple-200 text-purple-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 mb-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Date Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Performance Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {fetchingSchedule && (
                  <div className="mt-4 text-xs text-muted-foreground">
                    Loading schedule data...
                  </div>
                )}
                
                {noScheduleFound && !fetchingSchedule && (
                  <Alert color="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Schedule Found</AlertTitle>
                    <AlertDescription>
                      There is no schedule for this date. Please select a different date.
                    </AlertDescription>
                  </Alert>
                )}
                
                {schedule && (
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium">Schedule Info:</h3>
                      <Badge className={getStatusColor(schedule.status)}>
                        {schedule.status}
                      </Badge>
                    </div>
                    
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Packages:</span>
                        <span className="font-medium">{schedule.shift?.totalPackages || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Completed:</span>
                        <span className="font-medium">{schedule.shift?.completedCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fixed Employees:</span>
                        <span className="font-medium">{schedule.employees.filter(e => e.type === 'FIXED').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Flex Employees:</span>
                        <span className="font-medium">{schedule.employees.filter(e => e.type === 'FLEX').length}</span>
                      </div>
                      {schedule.vet && schedule.vet.status === 'OPEN' && (
                        <div className="flex items-center mt-2 text-amber-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          <span>Active VET in progress</span>
                        </div>
                      )}
                    </div>
                    
                    {scheduledEmployeesWithTasks.length > 0 && (
                      <div className="mt-2">
                        <h3 className="text-sm font-medium mb-2">Assigned Employees:</h3>
                        <div className="text-xs text-muted-foreground space-y-1 max-h-32 overflow-y-auto pr-2">
                          {scheduledEmployeesWithTasks.map(emp => (
                            <div key={emp.id} className="flex justify-between">
                              <span>{emp.name} ({emp.type})</span>
                              <span className="font-medium">{emp.task}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {scheduledEmployeesWithTasks.length === 0 && (
                      <Alert color="warning" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No Task Assignments</AlertTitle>
                        <AlertDescription>
                          No employees have been assigned tasks for this schedule.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comparison Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparison Type</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="comparisonType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Select Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="overall" id="overall" />
                            <Label htmlFor="overall">Overall</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="employee" id="employee" disabled={!schedule} />
                            <Label htmlFor="employee" className={!schedule ? "text-muted-foreground" : ""}>Employee</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="taskType" id="taskType" disabled={!schedule} />
                            <Label htmlFor="taskType" className={!schedule ? "text-muted-foreground" : ""}>Task Type</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Entity Selection (only shows when employee or taskType is selected) */}
            {comparisonType !== 'overall' && schedule && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select {comparisonType === 'employee' ? 'Employee' : 'Task Type'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="selectedEntity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{comparisonType === 'employee' ? 'Employee' : 'Task Type'}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${comparisonType === 'employee' ? 'an employee' : 'a task type'}`} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {comparisonType === 'employee' 
                              ? scheduledEmployeesWithTasks.map(employee => (
                                  <SelectItem key={employee.id} value={employee.id.toString()}>
                                    {employee.name} - {employee.task}
                                  </SelectItem>
                                ))
                              : ['INDUCTOR', 'STOWER', 'DOWNSTACKER'].map(task => (
                                  <SelectItem key={task} value={task}>
                                    {task.charAt(0) + task.slice(1).toLowerCase()}
                                  </SelectItem>
                                ))
                            }
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Performance Entries */}
          <Card>
            <CardHeader className="flex-row justify-between items-center">
              <CardTitle className="text-lg">Performance Entries</CardTitle>
              <Button type="button" onClick={addEntry} size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Add Entry
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-2 mb-2">
                  <div className="font-medium text-sm">Hours Worked</div>
                  <div className="font-medium text-sm">Packages Handled</div>
                  <div></div>
                </div>
                
                {entries.map((entry, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <FormField
                      control={form.control}
                      name={`entries.${index}.hours`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.25"
                              min="0.25"
                              max="5"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`entries.${index}.packages`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEntry(index)}
                        disabled={entries.length <= 1}
                      >
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData && schedule ? (
                <div className="mb-6">
                  <Chart
                    options={chartData.options}
                    series={chartData.series}
                    type="line"
                    height={350}
                  />
                </div>
              ) : (
                <div className="h-[350px] flex items-center justify-center bg-muted rounded-md">
                  <p className="text-muted-foreground">
                    {!schedule ? 
                      "Select a date with an active schedule" : 
                      "Please select a comparison type and add performance data"}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="rounded-lg bg-muted p-4">
                  <h3 className="text-sm font-medium mb-2">Total Hours</h3>
                  <p className="text-2xl font-bold">{totalHours.toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <h3 className="text-sm font-medium mb-2">Total Packages</h3>
                  <p className="text-2xl font-bold">{totalPackages}</p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <h3 className="text-sm font-medium mb-2">Efficiency</h3>
                  <p className="text-2xl font-bold">
                    {efficiencyRate} pkg/hr 
                    <span className={cn("ml-2 text-sm", {
                      "text-success": efficiencyPercentage >= 100,
                      "text-warning": efficiencyPercentage >= 85 && efficiencyPercentage < 100,
                      "text-destructive": efficiencyPercentage < 85
                    })}>
                      ({efficiencyPercentage}%)
                    </span>
                  </p>
                  {comparisonRate > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Expected: {Math.round(comparisonRate)} pkg/hr ({efficiencyContext})
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end mb-6">
            <Button type="submit" size="lg" disabled={loading || !schedule}>
              {loading ? 'Saving...' : 'Save Performance Data'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default DailyPerformanceView;