"use client";
import { type Board as BoardType } from "@/app/[lang]/(authorized)/(pages)/jobs/page";
import Blank from "@/components/blank";
import { Card, CardContent } from "@/components/ui/card";
import { Job } from "@prisma/client";
import React, { useState } from "react";
import Board from "./board";
import Task from "./task";
import TaskSheet from "./task-sheet";
import { updateJob } from "@/config/db";
import toast from "react-hot-toast";

interface TaskBoardProps {
  boards: BoardType[];
  tasks: Job[];
  setJobs: (newJobs: Job[]) => void;
}

const TaskBoard = ({ boards, tasks, setJobs }: TaskBoardProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = React.useState<
    Job["id"] | undefined
  >(undefined);
  const [selectedTask, setSelectedTask] = React.useState<Job | undefined>(
    undefined
  );

  const updateTaskHandler = (task: Job) => {
    setSelectedTaskId(task.id);
    setSelectedTask(task);
    setOpen(true);
  };

  const closeUpdateTaskHandler = () => {
    setSelectedTaskId(undefined);
    setSelectedTask(undefined);
    setOpen(false);
  };

  const filteredTasks = (tasks: Job[], boardStatus: string) => {
    return tasks?.filter((task) => task.status === boardStatus);
  };

  const handleMoveTask = async (task: Job, status: BoardType["name"]) => {
    const newData = {
      ...task,
      status,
    };
    try {
      const response = await updateJob(task.id, newData);
      if (response.status === 200) {
        toast.success("Job Status updated successfully");
        const updatedTasks = [...tasks]; // Create a copy to avoid mutation
        const updatedJobIndex = updatedTasks.findIndex((job) => job.id === task.id);
  
        if (updatedJobIndex !== -1) {
          updatedTasks[updatedJobIndex] = response.data.updatedJob; // Replace with updated job
          setJobs(updatedTasks); // Update the state with the modified tasks
        } else {
          console.warn("Updated job not found in existing tasks. This shouldn't happen.");
        }
      }
    } catch (error) {
      toast.error("Error updating status");
      console.log(error);
    }
  };

  return (
    <>
      {boards?.length > 0 ? (
        <Card className="overflow-y-auto pt-6">
          <CardContent>
            <div className="overflow-x-auto">
              <div className="flex flex-nowrap gap-6">
                {boards?.map((board, i) => (
                  <Board key={`board-id-${board.name}`} board={board}>
                    {filteredTasks(tasks, board.name)?.map(
                      (filteredTask, j) => (
                        <Task
                          key={`task-key-${j}`}
                          task={filteredTask}
                          onUpdateTask={updateTaskHandler}
                          boards={boards}
                          handleMoveTask={handleMoveTask}
                        />
                      )
                    )}
                  </Board>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Blank className="max-w-[353px] mx-auto space-y-4">
          <div className=" text-xl font-semibold text-default-900">
            No Task Here
          </div>
          <div className=" text-default-600 text-sm">
            There is no task create. If you create a new task then click this
            button & create new board.
          </div>
        </Blank>
      )}
      <TaskSheet
        open={open}
        onClose={closeUpdateTaskHandler}
        task={selectedTask as Job}
        taskId={selectedTaskId as Job["id"]}
        boards={boards}
        handleMoveTask={handleMoveTask}
      />
    </>
  );
};

export default TaskBoard;
