import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Employee, EmployeeType } from "@prisma/client";

// Form schema with conditional validation for workDays
const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  type: z.enum(["FIXED", "FLEX"]),
  workDays: z.array(z.string()).default([]).transform(days => {
    if (!days || days.length === 0) return null;
    return JSON.stringify(days);
  }),
}).refine((data) => {
  if (data.type === "FIXED") {
    const days = data.workDays ? JSON.parse(data.workDays as string) : [];
    return days.length === 4;
  }
  return true;
}, {
  message: "Fixed employees must select exactly 4 work days",
  path: ["workDays"],
});

type FormData = z.infer<typeof formSchema>;

export interface EmployeeFormData {
  name: string;
  email: string;
  type: EmployeeType;
  workDays: string | null;
}

interface EmployeeFormProps {
  defaultValues?: Partial<Employee>;
  onSubmit: (data: EmployeeFormData) => void;
  isLoading: boolean;
}

const days = [
  { id: "MON", label: "Monday" },
  { id: "TUE", label: "Tuesday" },
  { id: "WED", label: "Wednesday" },
  { id: "THU", label: "Thursday" },
  { id: "FRI", label: "Friday" },
  { id: "SAT", label: "Saturday" },
];

const EmployeeForm = ({
  defaultValues,
  onSubmit,
  isLoading,
}: EmployeeFormProps) => {
  const parsedWorkDays = defaultValues?.workDays
    ? JSON.parse(defaultValues.workDays as string)
    : [];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      email: defaultValues?.email || "",
      type: (defaultValues?.type as "FIXED" | "FLEX") || "FLEX",
      workDays: parsedWorkDays,
    },
  });

  const employeeType = form.watch("type");
  const showWorkDays = employeeType === "FIXED";

  const handleSubmit = (data: FormData) => {
    onSubmit({
      name: data.name,
      email: data.email,
      type: data.type,
      workDays: data.workDays,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter employee name" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="Enter employee email" 
                    {...field} 
                    disabled={isLoading} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Employee Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee Type</FormLabel>
                <FormControl>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isLoading}
                  >
                    <option value="FLEX">Flexible</option>
                    <option value="FIXED">Fixed</option>
                  </select>
                </FormControl>
                <FormDescription>
                  Fixed employees work on specific days each week
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Work Days (Only for FIXED employees) */}
        {showWorkDays && (
          <FormField
            control={form.control}
            name="workDays"
            render={({ field }) => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">Work Days</FormLabel>
                  <FormDescription>
                    Select exactly 4 days that this employee will work
                  </FormDescription>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {days.map((day) => (
                    <FormItem
                      key={day.id}
                      className="flex flex-row items-start space-x-3 space-y-0"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(day.id)}
                          onCheckedChange={(checked) => {
                            const currentDays = Array.isArray(field.value) ? field.value : [];
                            const newDays = checked
                              ? [...currentDays, day.id]
                              : currentDays.filter((d) => d !== day.id);
                            
                            if (checked && newDays.length > 4) {
                              return false;
                            }
                            field.onChange(newDays);
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {day.label}
                      </FormLabel>
                    </FormItem>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Employee"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EmployeeForm;