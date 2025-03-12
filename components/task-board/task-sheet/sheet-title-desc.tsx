"use client";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Job } from "@prisma/client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
const schema = z.object({
  title: z.string().min(3, {
    message: "Please enter a task description",
  }),
  desc: z.string().min(3, {
     message: "Please enter a description"
  }),
});
const SheetTitleDesc = ({ task, taskId }: {
  task: Job;
  taskId: Job["id"];
}) => {
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const handleFocus = () => {
    setIsFocused(false);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
    }, 3000);
  };

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "all",
  });

  const onSubmit = async (data: any) => {
    const newData = {
      ...task,
      title: data.title,
      desc: data.desc,
    };
    try {
      // await updateTaskAction(taskId, newData);

    } catch (error) {
      console.log(error);
    }
  };

  React.useEffect(() => {
    if (task) {
      setValue("title", task.name);
      setValue("desc", task.description || "");
    }
  }, [task, setValue]);
  
  return (
    <form
      className="py-5 px-6 pb-8 border-b border-default-200"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex items-center gap-1 mb-2">
        <input
          type="text"
          {...register("title")}
          className="h-7 w-full border border-transparent text-lg font-medium text-default-900 rounded-sm focus:border focus:border-default-200 focus:outline-none px-1 focus:bg-default-50 bg-card"
          onInput={handleFocus}
          onBlur={handleBlur}
        />
      </div>
      {errors.title && (
        <div className=" text-destructive">{errors.title.message as string}</div>
      )}

      <div className="flex gap-1 relative">
        <textarea
          className="w-full h-16 border-none border border-transparent focus:border-default-200 focus:outline-none p-1 text-sm text-default-700 peer bg-card focus:bg-default-50"
          placeholder="Add Task Descriptions"
          rows={1}
          {...register("desc")}
          onInput={handleFocus}
          onBlur={handleBlur}
          style={{ resize: "none", overflowY: "hidden" }}
        />
      </div>
      <div className="flex justify-end">
        {isFocused && (
          <Button className=" text-xs h-6 py-0" type="submit">
            Save
          </Button>
        )}
      </div>
    </form>
  );
};

export default SheetTitleDesc;
