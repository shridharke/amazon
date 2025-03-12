"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Board as BoardType } from "@/app/[lang]/(authorized)/(pages)/jobs/page";
import { ChevronDown } from "lucide-react";
import { Job } from "@prisma/client";
import { Icon } from "@iconify/react";

const TaskSheetHeader = ({
  boards,
  task,
  handleMoveTask,
  toggleCollapse,
}: {
  boards: BoardType[];
  task: Job;
  handleMoveTask: (taskId: Job, status: BoardType["name"]) => Promise<void>;
  toggleCollapse: () => void;
}) => {
  const getBoardNameById = (boardId: BoardType["name"]) => {
    const foundBoard = boards.find(
      (board: BoardType) => board.name === boardId
    );
    return foundBoard ? foundBoard.label : "Unknown Board";
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="text-base font-medium text-default-600 bg-default-100 py-[4px] px-4 rounded">
          Status
        </div>
        <div className="w-fit px-1">
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="text-[10px] leading-[14px] font-semibold  text-default-600 border border-default-200 px-2.5 py-1 rounded-full flex justify-center items-center gap-[2px]">
                  {getBoardNameById(task?.status)}
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
      </div>
      <div className="flex items-center justify-end gap-2 pr-5">
          <div
            onClick={toggleCollapse}
            className="cursor-pointer hidden xl:block"
          >
            <Icon
              icon="heroicons:arrows-right-left-solid"
              className="w-5 h-5 text-default-500"
            />
          </div>
        </div>
    </>
  );
};

export default TaskSheetHeader;
