"use client";
import TaskDate from "../common/task-date";
import { Icon } from "@iconify/react";
import Priority from "../common/priority";
import { Job } from "@prisma/client";

const SheetActions = ({ task, taskId }: {
  task: Job
  taskId: Job["id"]
}) => {
  return (
    <div className="py-5 px-4 lg:px-6 border-b border-default-200">
      <div className="grid  grid-cols-2  md:grid-cols-3 md:gap-2 gap-y-6">
        {/*Priority*/}
        <div>
          <div className="flex items-center gap-1 mb-3">
            <div className="bg-default-100 h-6 w-6 rounded-full grid place-content-center">
              <Icon
                icon="heroicons:scale"
                className="text-primary w-3.5 h-3.5"
              />
            </div>
            <span className="text-sm font-medium text-default-900">
              Priority
            </span>
          </div>
          <Priority task={task} taskId={taskId} />
        </div>
        {/* task date */}
        <div>
          <div className="flex items-center gap-1 mb-3">
            <div className="bg-default-100 h-6 w-6 rounded-full grid place-content-center">
              <Icon
                icon="heroicons:calendar"
                className="text-primary w-3.5 h-3.5"
              />
            </div>
            <span className="text-sm font-medium text-default-900">Date</span>
          </div>
          <TaskDate task={task} />
        </div>
      </div>
    </div>
  );
};

export default SheetActions;
