"use client";
import { Button } from "@/components/ui/button";
import { cn, formatDate, formatSize, getImageSource } from "@/lib/utils";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { Document } from "@prisma/client";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteFromS3 } from "@/lib/s3";
import toast from "react-hot-toast";
import { deleteDocument } from "@/config/db";

const SingleFileCard = ({
  item,
  fetchFiles,
}: {
  item: Document;
  fetchFiles: () => Promise<void>;
}) => {
  const handleDownload = async () => {
    const link = document.createElement("a");
    link.href = item.fileUrl;
    link.setAttribute("download", item.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async () => {
    try {
      const data = await deleteFromS3(item.fileKey);

      if (data.success) {
        const response = await deleteDocument(item.id);

        if (response.status === 200) {
          toast.success("Deleted Successfully");
          fetchFiles();
        } else {
          toast.error("Unable to delete file");
        }
      } else {
        console.log("Error deleting file from S3");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error deleting file");
    }
  };

  return (
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
              src={getImageSource(item.fileType)}
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
              "text-base font-medium text-default-800 dark:text-white truncate",
              {
                "text-default-50": item?.fileType == "png",
              }
            )}
          >
            {item?.fileName}
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
                  Are you sure you want to delete the file?
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
                  <Button color="destructive" onClick={handleDelete}>
                    Delete
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default SingleFileCard;
