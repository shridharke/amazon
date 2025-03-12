"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { Document } from "@prisma/client";
import { formatDate, formatSize, getImageSource } from "@/lib/utils";
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

const ListFileCard = ({
  files,
  fetchFiles,
}: {
  files: Document[];
  fetchFiles: () => Promise<void>;
}) => {
  const handleDownload = async (item: Document) => {
    const link = document.createElement("a");
    link.href = item.fileUrl;
    link.setAttribute("download", item.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (item: Document) => {
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

  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  return (
    <div className="w-full h-full overflow-auto no-scrollbar">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold">File Name</TableHead>
            <TableHead> Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead className="whitespace-nowrap">Upload Date</TableHead>
            <TableHead className=" text-end">Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {files.map((item) => (
            <TableRow
              key={item.id}
              className="hover:bg-muted whitespace-nowrap"
              data-state={selectedRows.includes(item.id) && "selected"}
            >
              <TableCell className="font-medium  text-card-foreground/80">
                <div className="flex space-x-3  rtl:space-x-reverse items-center">
                  <div className="h-10 w-10">
                    <Image
                      alt=""
                      className="h-full w-full object-cover p-2"
                      src={getImageSource(item.fileType)}
                    />
                  </div>
                  <span className=" text-sm  whitespace-nowrap text-card-foreground">
                    {item?.fileName}
                  </span>
                </div>
              </TableCell>

              <TableCell>.{item?.fileType}</TableCell>
              <TableCell>{formatSize(item?.size)}</TableCell>
              <TableCell>{formatDate(item?.createdAt)}</TableCell>

              <TableCell className="flex justify-end">
                <div className="flex space-x-3 rtl:space-x-reverse">
                  <Button
                    size="icon"
                    variant="outline"
                    className=" h-7 w-7"
                    onClick={() => handleDownload(item)}
                  >
                    <Icon
                      icon="heroicons:arrow-down-tray"
                      className=" h-4 w-4  "
                    />
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="outline"
                        className=" h-7 w-7"
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
                        <Button
                          color="destructive"
                          onClick={() => handleDelete(item)}
                        >
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ListFileCard;
