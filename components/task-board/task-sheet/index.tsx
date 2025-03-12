"use client";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";

import ViewFiles from "@/components/files/view-files-main";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { Job } from "@prisma/client";
import { X } from "lucide-react";
import { useState } from "react";
import SheetActions from "./sheet-actions";
import SheetTitleDesc from "./sheet-title-desc";
import TaskSheetHeader from "./task-sheet-header";
import { type Board as BoardType } from "@/app/[lang]/(authorized)/(pages)/jobs/page";
import Comments from "./comments";

interface TaskSheetProps {
  open: boolean;
  onClose: () => void;
  taskId: Job["id"];
  task: Job;
  boards: BoardType[];
  handleMoveTask: (taskId: Job, status: BoardType["name"]) => Promise<void>;
}
const TaskSheet = ({
  open,
  onClose,
  taskId,
  task,
  boards,
  handleMoveTask,
}: TaskSheetProps) => {
  const [collapseSheet, setCollapseSheet] = useState(false);
  const toggleCollapse = () => setCollapseSheet(!collapseSheet);
  return (
    <Sheet open={open}>
      <SheetContent
        side="right"
        onClose={onClose}
        closeIcon={<X className="h-4 w-4 relative top-4" />}
        className={cn("w-[75%] md:max-w-[1500px] p-0", {
          "md:max-w-[1000px]": collapseSheet,
        })}
      >
        <SheetHeader className="sm:flex-row justify-between gap-3 space-y-0 border-b border-default-200  px-2 xl:px-6 py-5">
          <TaskSheetHeader
            toggleCollapse={toggleCollapse}
            boards={boards}
            task={task}
            handleMoveTask={handleMoveTask}
          />
        </SheetHeader>
        <div
          className={cn("grid grid-cols-1 xl:grid-cols-[3fr,2fr]", {
            "xl:grid-cols-1": collapseSheet,
          })}
        >
          {/* Attachments Section */}
          <div className="border-r border-default-200 min-h-screen">
            <div className="h-[calc(100vh-70px)]">
              <ScrollArea className="h-full">
                <SheetTitleDesc task={task} taskId={taskId} />
                <SheetActions task={task} taskId={taskId} />
                <Tabs defaultValue="attachments">
                  <TabsList className="flex justify-between w-full bg-default-100 h-12 p-0 px-2 xl:px-12 rounded-none">
                    <TabsTrigger
                      value="attachments"
                      className="py-0 h-full bg-transparent text-base font-medium text-default-600 capitalize rounded-none border-b border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                      <Icon
                        icon="heroicons:paper-clip"
                        className="w-3.5 h-3.5 mr-1.5"
                      />
                      attachments
                    </TabsTrigger>
                    <TabsTrigger
                      value="comments"
                      className={cn(
                        "py-0 h-full bg-transparent text-sm font-medium text-default-600 capitalize rounded-none border-b border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                        {
                          "flex xl:hidden": !collapseSheet,
                        }
                      )}
                    >
                      <Icon
                        icon="heroicons:chat-bubble-bottom-center"
                        className="w-3.5 h-3.5 mr-1.5"
                      />
                      comments
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="attachments">
                    <ViewFiles task={task} />
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            </div>
          </div>

          {/* Comments Section */}
          <div
            className={cn("hidden xl:block", {
              "xl:hidden": collapseSheet,
            })}
          >
            <Comments className="h-[calc(100vh-210px)]" taskId={taskId} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskSheet;
