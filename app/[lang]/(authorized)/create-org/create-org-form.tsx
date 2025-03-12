"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "react-hot-toast";
import { createOrganization } from "@/config/db";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  orgName: z
    .string()
    .min(3, { message: "Organization name must be at least 3 characters." }),
  gstno: z
    .string()
    .regex(
      /^([0][1-9]|[1-2][0-9]|[3][0-7])([a-zA-Z]{5}[0-9]{4}[a-zA-Z]{1}[1-9a-zA-Z]{1}[zZ]{1}[0-9a-zA-Z]{1})+$/,
      {
        message: "Invalid GST number. Please check.",
      }
    ),
  doi: z.date({
    required_error: "A date of incorporation is required.",
  }),
  shiftStartTime: z.string().default("09:00"),
  shiftDuration: z.number().int().min(1).max(12).default(5),
});

const CreateOrgForm = () => {
  const router = useRouter();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      shiftStartTime: "09:00",
      shiftDuration: 5
    }
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    toast
      .promise(createOrganization(data), {
        loading: "Creating organization...",
        success: "Organization created successfully!",
        error: "Failed to create organization.",
      })
      .then((response) => {
        if (response.status === 201) {
          router.push("/dashboard");
        } else {
          console.error("Failed to create organization:", response.status);
        }
      })
      .catch((error) => {
        console.error("An error occurred:", error);
      });
  };

  return (
    <div className="w-full ">
      <div className="2xl:mt-8 mt-6 2xl:text-3xl text-2xl font-bold text-default-900">
        Hey, Hello 👋
      </div>
      <div className="2xl:text-lg text-base text-default-600 mt-2 leading-6">
        Create an Organization to continue.
      </div>

      <div className="2xl:mt-8 mt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-2">
                <Label
                  htmlFor="orgName"
                  className={cn("", {
                    "text-destructive": form.formState.errors.orgName,
                  })}
                >
                  Organization Name
                </Label>
                <Input
                  type="text"
                  {...form.register("orgName")}
                  placeholder="Your Organization Name"
                  className={cn("", {
                    "border-destructive focus:border-destructive":
                      form.formState.errors.orgName,
                  })}
                />
                {form.formState.errors.orgName && (
                  <p
                    className={cn("text-xs", {
                      "text-destructive": form.formState.errors.orgName,
                    })}
                  >
                    {form.formState.errors.orgName.message}
                  </p>
                )}
              </div>

              <div className="col-span-2 lg:col-span-1 flex flex-col gap-2">
                <Label
                  htmlFor="doi"
                  className={cn("", {
                    "text-destructive": form.formState.errors.doi,
                  })}
                >
                  Date of Incorporation
                </Label>
                <FormField
                  control={form.control}
                  name="doi"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full ltr:pl-3 rtl:pr-3 text-left text-gray font-normal border-gray",
                                {
                                  "border-destructive focus:border-destructive":
                                    form.formState.errors.doi,
                                }
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ltr:ml-auto rtl:mr-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />
                {form.formState.errors.doi && (
                  <p
                    className={cn("text-xs", {
                      "text-destructive": form.formState.errors.doi,
                    })}
                  >
                    {form.formState.errors.doi.message}
                  </p>
                )}
              </div>

              <div className="col-span-2 flex flex-col gap-2">
                <Label
                  htmlFor="gstno"
                  className={cn("", {
                    "text-destructive": form.formState.errors.gstno,
                  })}
                >
                  GST no.
                </Label>
                <Input
                  type="text"
                  {...form.register("gstno")}
                  placeholder="GST no."
                  className={cn("", {
                    "border-destructive focus:border-destructive":
                      form.formState.errors.gstno,
                  })}
                />
                {form.formState.errors.gstno && (
                  <p
                    className={cn("text-xs", {
                      "text-destructive": form.formState.errors.gstno,
                    })}
                  >
                    {form.formState.errors.gstno.message}
                  </p>
                )}
              </div>

              <div className="col-span-2 lg:col-span-1 flex flex-col gap-2">
                <Label
                  htmlFor="shiftStartTime"
                  className={cn("", {
                    "text-destructive": form.formState.errors.shiftStartTime,
                  })}
                >
                  Shift Start Time
                </Label>
                <FormField
                  control={form.control}
                  name="shiftStartTime"
                  render={({ field }) => (
                    <FormItem>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select shift start time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 24 }).map((_, index) => {
                            const hour = index.toString().padStart(2, '0');
                            return (
                              <SelectItem key={hour} value={`${hour}:00`}>
                                {`${hour}:00`}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                {form.formState.errors.shiftStartTime && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.shiftStartTime.message}
                  </p>
                )}
              </div>

              <div className="col-span-2 lg:col-span-1 flex flex-col gap-2">
                <Label
                  htmlFor="shiftDuration"
                  className={cn("", {
                    "text-destructive": form.formState.errors.shiftDuration,
                  })}
                >
                  Shift Duration (hours)
                </Label>
                <FormField
                  control={form.control}
                  name="shiftDuration"
                  render={({ field }) => (
                    <FormItem>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select shift duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((hours) => (
                            <SelectItem key={hours} value={hours.toString()}>
                              {hours} {hours === 1 ? 'hour' : 'hours'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                {form.formState.errors.shiftDuration && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.shiftDuration.message}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Button type="submit">Submit Form</Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CreateOrgForm;