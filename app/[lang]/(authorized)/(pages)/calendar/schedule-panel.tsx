// app/schedule/calendar/components/schedule-panel.tsx
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, Users, Clock } from "lucide-react";
import { ScheduleInfo } from "@/types/schedule";

function formatDateTime(date: Date): string {
    return new Date(date).toLocaleString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

interface SchedulePanelProps {
  selectedSchedule: ScheduleInfo;
  onViewDailyDetails: () => void;
}

const getBadgeVariant = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return 'secondary';
    case 'IN_PROGRESS':
      return 'default';
    case 'COMPLETED':
      return 'success';
    default:
      return 'default';
  }
};

export function SchedulePanel({ selectedSchedule, onViewDailyDetails }: SchedulePanelProps) {
  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-4 p-4">
        <div className="info-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Schedule Information</h3>
            <Badge color={getBadgeVariant(selectedSchedule.status)}>
              {selectedSchedule.status}
            </Badge>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Date</span>
              <span>{new Date(selectedSchedule.date).toLocaleDateString()}</span>
            </div>
            {selectedSchedule.shift && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Packages</span>
                  <span>{selectedSchedule.shift.totalPackages}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span>{selectedSchedule.shift.completedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Fixed Employee Capacity</span>
                  <span>{selectedSchedule.fixedEmployeesEfficiency}</span>
                </div>
                {selectedSchedule.remainingPackages > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Remaining Packages</span>
                    <span>{selectedSchedule.remainingPackages}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {selectedSchedule.vet && (
          <div className="info-card relative">
            {selectedSchedule.vet.status === 'OPEN' && (
              <span className="absolute top-2 right-2 h-3 w-3 rounded-full bg-green-500 animate-pulse" />
            )}
            <h3 className="font-medium mb-3">VET Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge color={selectedSchedule.vet.status === 'OPEN' ? 'default' : 'secondary'}>
                  {selectedSchedule.vet.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Target Packages</span>
                <span>{selectedSchedule.vet.targetPackageCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Remaining</span>
                <span>{selectedSchedule.vet.remainingCount}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Opened: {formatDateTime(selectedSchedule.vet.openedAt)}</p>
                {selectedSchedule.vet.closedAt && (
                  <p>Closed: {formatDateTime(selectedSchedule.vet.closedAt)}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedSchedule.employees.length > 0 && (
          <div className="info-card">
            <h3 className="font-medium mb-3">Assigned Employees</h3>
            <div className="space-y-2">
              {selectedSchedule.employees.map((emp) => (
                <div key={emp.id} className="employee-card">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{emp.name}</p>
                    <Badge color={emp.type === 'FIXED' ? 'default' : 'secondary'}>
                      {emp.type}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    <p>Task: {emp.task}</p>
                    <p>Efficiency: {emp.efficiency}%</p>
                    <p>Status: {emp.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button 
          onClick={onViewDailyDetails} 
          className="w-full"
        >
          View Daily Details
        </Button>
      </div>
    </ScrollArea>
  );
}