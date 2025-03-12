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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatSize, getImageSource } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { Document } from "@prisma/client";
import Image from "next/image";
import { useState } from "react";
import ViewComponent from "./view-component";

const ListFileCard = ({
  files,
  handleDelete,
}: {
  files: Document[];
  handleDelete: (fileId: number) => Promise<void>;
}) => {
  const [viewUrl, setViewUrl] = useState<string | null>(null);

  const handleDownload = async (item: Document) => {
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
      <div
        className={`flex-1 h-[calc(100vh-180px)] overflow-auto no-scrollbar ${
          viewUrl ? "ml-auto" : ""
        }`}
      >
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
                          <Button
                            color="destructive"
                            onClick={() => handleDelete(item.id)}
                          >
                            Remove
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
    </div>
  );
};

export default ListFileCard;
