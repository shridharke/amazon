"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardHeader
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { type Board as BoardType } from '@/app/[lang]/(authorized)/(pages)/jobs/page'

interface TaskBoardProps {
  board: BoardType;
  children?: React.ReactNode;
}
const taskBoard = ({
  board,
  children,
}: TaskBoardProps) => {
  const { label, color } = board;

  return (
    <>
      <Card
        className={cn(
          "max-w-[277px] border-t-4 rounded-lg  flex-none w-full  shadow-lg bg-default-100 dark:bg-default-50 ",
          {
            "border-primary": color === "primary",
            "border-warning": color === "warning",
            "border-success": color === "success",
          }
        )}
      >
        <CardHeader
          className="flex-row items-center mb-0 justify-between border-b border-default-200 rounded-sm py-4 space-y-0 px-3"
        >
          <div className="text-sm font-semibold text-default-800 capitalize">
            {label}
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="h-[calc(100vh-300px)]">
            <ScrollArea className="h-full">
              <div className="space-y-3 p-3">{children}</div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default taskBoard;
