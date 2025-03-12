"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerWithRangeProps {
  className?: string
  value?: DateRange | undefined
  onChange?: (date: DateRange | undefined) => void
}

export default function DatePickerWithRange({
  className,
  value,
  onChange,
}: DatePickerWithRangeProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(
    value || {
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      to: new Date(),
    }
  )

  // Synchronize with parent component if provided
  React.useEffect(() => {
    if (value && (
      !date || 
      value.from !== date.from || 
      value.to !== date.to
    )) {
      setDate(value)
    }
  }, [value, date])

  // Handle internal state changes and propagate to parent if onChange provided
  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate)
    if (onChange) {
      onChange(newDate)
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateChange}
            numberOfMonths={2}
          />
          <div className="flex justify-between p-3 border-t border-default-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                const range = {
                  from: addDays(today, -30),
                  to: today
                }
                handleDateChange(range)
              }}
            >
              Last 30 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                const range = {
                  from: addDays(today, -90),
                  to: today
                }
                handleDateChange(range)
              }}
            >
              Last 90 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                const range = {
                  from: new Date(today.getFullYear(), today.getMonth(), 1),
                  to: today
                }
                handleDateChange(range)
              }}
            >
              This Month
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}