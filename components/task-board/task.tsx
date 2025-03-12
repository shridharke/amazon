"use client";
import { type Board as BoardType } from "@/app/[lang]/(authorized)/(pages)/jobs/page";
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteJob } from "@/config/db";
import { cn, formatDate } from "@/lib/utils";
import { Job } from "@prisma/client";
import { Calendar, ChevronDown, MoreHorizontal } from "lucide-react";
import React from "react";
import toast from "react-hot-toast";

const prioritiesColorMap: { [key: string]: any } = {
  high: "destructive",
  medium: "warning",
  low: "info",
};

interface TaskProps {
  task: Job;
  onUpdateTask: (task: Job) => void;
  boards: BoardType[];
  handleMoveTask: (taskId: Job, status: BoardType["name"]) => Promise<void>;
}

const Task = ({ task, onUpdateTask, boards, handleMoveTask }: TaskProps) => {
  const [open, setOpen] = React.useState(false);
  const { id, name, priority, description, dueDate, status } = task;

  const getBoardNameById = (boardId: BoardType["name"]) => {
    const foundBoard = boards.find(
      (board: BoardType) => board.name === boardId
    );
    return foundBoard ? foundBoard.label : "Unknown Board";
  };

  const onAction = async (dltId: number) => {
    try {
      const response = await deleteJob(dltId);
    } catch (error) {
      console.log(error);
      toast.error("Error deleting Job");
    }
  };

  return (
    <>
      <DeleteConfirmationDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => onAction(id)}
      />
      <Card
        className={cn(
          "shadow  border-default-200 rounded-lg p-3 cursor-pointer group relative"
        )}
        onClick={() => onUpdateTask(task)}
      >
        <CardHeader className="space-x-0 space-y-0 p-0 flex-row items-center justify-between mb-3 border-none">
          <div className="flex items-center gap-1 text-sm">
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="text-[10px] leading-[14px] font-semibold  text-default-600 border border-default-200 px-2.5 py-1 rounded-full flex justify-center items-center gap-[2px]">
                    {getBoardNameById(status)}
                    <ChevronDown className="w-3 h-3" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[50px]" align="start">
                  {boards?.map((board: BoardType) => (
                    <DropdownMenuItem
                      onSelect={() => handleMoveTask(task, board.name)}
                      className="text-[10px] leading-[14px] font-semibold  text-default-600 py-1"
                      key={`key-dropdown-${board.name}`}
                    >
                      {board.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  className="h-6 w-6 rounded-full bg-transparent hover:bg-transparent "
                >
                  <MoreHorizontal className="w-4 h-4 text-default-900" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[196px]" align="start">
                <DropdownMenuItem onSelect={() => setOpen(true)}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* <Checkbox radius="xl" size="sm" /> */}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative">
            <div className="text-sm font-semibold text-default-700 my-1 capitalize">
              {name}
            </div>
          </div>

          <div className="text-[13px] text-default-500">{description}</div>

          <div className="flex flex-wrap items-center gap-1 mt-2 text-sm">
            <Badge
              color={prioritiesColorMap[priority]}
              className="text-[10px] px-1 py-0 rounded leading-4 capitalize"
            >
              {priority}
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="p-0 mt-2">
          <div className="w-full flex flex-wrap items-center gap-x-3 gap-y-2">
            <div
              className="flex items-center gap-1 text-xs text-default-600"
              onClick={(e) => e.stopPropagation()}
            >
              <Calendar className="w-3.5 h-3.5 text-default-500" />
              {formatDate(dueDate)}
            </div>
          </div>
        </CardFooter>
      </Card>
    </>
  );
};

export default Task;
