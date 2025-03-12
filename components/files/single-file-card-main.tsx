"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn, formatDate, formatSize, getImageSource } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { Document } from "@prisma/client";
import Image from "next/image";
import { useState } from "react";
import ViewComponent from "./view-component";

const SingleFileCard = ({
  item,
  handleDelete,
}: {
  item: Document;
  handleDelete: (fileId: number) => Promise<void>;
}) => {
  const [viewUrl, setViewUrl] = useState<string | null>(null);

  const handleDownload = async () => {
    const link = document.createElement("a");
    link.href = item.fileUrl;
    link.setAttribute("download", item.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (url: string) => {
    setViewUrl(url);
  };

  return (
    <div className="relative">
      {/* ViewComponent */}
      {viewUrl && (
        <ViewComponent url={viewUrl} onClose={() => setViewUrl(null)} />
      )}
      <div className="relative min-h-[164px] shadow-sm dark:border rounded">
        <div className="p-6">
          <div
            className={cn("bg-card p-2.5 h-14 w-14 rounded mx-auto block", {
              hidden: item.fileType === "png",
            })}
          >
            {item.fileType !== "png" && (
              <Image
                alt=""
                className="h-full w-full object-cover"
                src={getImageSource(item?.fileType)}
              />
            )}
          </div>

          <div
            className={cn("text-center mt-3", {
              "text-left mt-2.5 bottom-4 absolute left-4 z-20":
                item?.fileType == "png",
            })}
          >
            <p
              className={cn(
                "text-sm font-medium text-default-800 dark:text-white break-words whitespace-normal",
                {
                  "text-default-50": item?.fileType == "png",
                }
              )}
            >
              <a
                href="#"
                className="text-sm whitespace-nowrap text-card-foreground hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  handleView(item.fileUrl);
                }}
              >
                {item?.fileName}
              </a>
            </p>
            <p
              className={cn(
                "text-xs font-normal text-default-600 dark:text-gray",
                {
                  "text-default-50": item?.fileType == "png",
                }
              )}
            >
              <span>{formatDate(item?.createdAt)}</span>
            </p>
            <p
              className={cn(
                "text-xs font-normal text-default-600 dark:text-gray",
                {
                  "text-default-50": item?.fileType == "png",
                }
              )}
            >
              <span>{formatSize(item?.size)}</span>
            </p>
          </div>

          <div className="absolute  top-3 right-3 flex gap-1.5">
            <Button
              size="icon"
              variant="outline"
              className=" h-6 w-6"
              onClick={handleDownload}
            >
              <Icon icon="heroicons:arrow-down-tray" className=" h-4 w-4  " />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className=" h-6 w-6"
                  color="destructive"
                >
                  <Icon icon="heroicons:trash" className=" h-4 w-4  " />
                </Button>
              </DialogTrigger>
              <DialogContent size="md">
                <DialogHeader>
                  <DialogTitle className="text-base font-medium text-default-700 max-w-[250px] ">
                    Are you sure you want to remove the file from job?
                  </DialogTitle>
                </DialogHeader>

                <div className="text-sm text-default-500  space-y-4">
                  <p>This action cannot be undone.</p>
                </div>
                <DialogFooter className="mt-8">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button
                      color="destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      Remove
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleFileCard;
