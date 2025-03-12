'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, Check, AlertCircle, ArrowLeft, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Employee {
  id: number;
  name: string;
  email?: string;
  type?: string;
}

export default function VETConfirmPage({ params }: { params: { scheduleId: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [scheduleInfo, setScheduleInfo] = useState<any>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch(`/api/employees?organizationId=1`);
        const data = await response.json();
        
        if (data.employees) {
          setEmployees(data.employees);
        }
      } catch (error) {
        console.error('Failed to fetch employees:', error);
        setError('Failed to load employee list');
      } finally {
        setLoadingEmployees(false);
      }
    };

    const fetchScheduleInfo = async () => {
      try {
        const response = await fetch(`/api/schedules/${params.scheduleId}`);
        const data = await response.json();
        
        if (data.data) {
          setScheduleInfo(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch schedule info:', error);
      }
    };

    fetchEmployees();
    fetchScheduleInfo();
  }, [params.scheduleId]);

  const handleConfirm = async () => {
    if (!selectedEmployeeId) {
      setError('Please select an employee');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const response = await fetch(`/api/schedules/${params.scheduleId}/vet/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: parseInt(selectedEmployeeId) }),
      });

      const data = await response.json();

      if (data.success) {
        setConfirmed(true);
      } else {
        setError(data.error || 'Failed to confirm VET');
      }
    } catch (error) {
      setError('Failed to confirm VET');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-md py-10">
      <Card className="shadow-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">VET Confirmation</CardTitle>
            {scheduleInfo && (
              <span className="text-sm font-medium text-muted-foreground">
                Schedule #{params.scheduleId}
              </span>
            )}
          </div>
          <CardDescription>
            Please select your name and confirm availability for this VET
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {scheduleInfo && (
            <div className="bg-muted/50 p-3 rounded-md space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {new Date(scheduleInfo.date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              {scheduleInfo.shift && (
                <div className="text-sm text-muted-foreground">
                  Package count: {scheduleInfo.shift.totalPackages}
                </div>
              )}
            </div>
          )}

          {error && (
            <Alert color="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {confirmed ? (
            <Alert color="default" className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Success</AlertTitle>
              <AlertDescription className="text-green-700">
                Your availability has been confirmed!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="employee" className="text-sm font-medium">
                  Select Employee
                </label>
                <Select 
                  disabled={loading || loadingEmployees}
                  value={selectedEmployeeId} 
                  onValueChange={setSelectedEmployeeId}
                >
                  <SelectTrigger id="employee" className="w-full">
                    <SelectValue placeholder={loadingEmployees ? "Loading employees..." : "Select an employee"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingEmployees ? (
                      <div className="flex justify-center items-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Loading...</span>
                      </div>
                    ) : (
                      <SelectGroup>
                        <SelectLabel className="mt-2">Flex Employees</SelectLabel>
                        {employees
                          .filter(emp => emp.type === "FLEX")
                          .map(emp => (
                            <SelectItem key={emp.id} value={emp.id.toString()}>
                              {emp.name}
                            </SelectItem>
                          ))
                        }
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleConfirm} 
                disabled={loading || loadingEmployees || !selectedEmployeeId}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  'Confirm Availability'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}