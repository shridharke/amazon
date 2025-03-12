"use client";

import { useState } from "react"; // Import useState hook
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { updateJob } from "@/config/db";
import { Icon } from "@iconify/react";
import { Job } from "@prisma/client";
import toast from "react-hot-toast";

const Priority = ({
  task,
  taskId,
}: {
  task?: Job | any;
  taskId?: Job["id"];
}) => {
  const [selectedPriority, setSelectedPriority] = useState<string>(
    task?.priority
  );

  const handlePriorityChange = async (value: any) => {
    if (taskId) {
      try {
        const newData: Job = {
          ...task,
          priority: value,
        };

        const response = await updateJob(taskId, newData);
        if (response.status === 200) {
          toast.success("Updated Successfully");
        }
      } catch (error) {
        toast.error("Error updating Priority");
        console.log(error);
      }

      setSelectedPriority(value);
    }
  };

  return (
    <>
      <div className="w-[150px]">
        <DropdownMenu
        >
          <DropdownMenuTrigger asChild>
            <Button variant="soft" className="rounded-full">
              {selectedPriority}
              <Icon icon="heroicons:chevron-down" className=" h-5 w-5 ml-2 " />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[196px]" align="start">
            <DropdownMenuItem onSelect={() => handlePriorityChange("HIGH")}>High</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handlePriorityChange("MEDIUM")}>Medium</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handlePriorityChange("LOW")}>Low</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};

export default Priority;
