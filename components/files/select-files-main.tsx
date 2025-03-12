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
import { addJobDocuments, getDocuments } from "@/config/db";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate, formatSize, getImageSource } from "@/lib/utils";
import { useOrgStore } from "@/store";
import { Document, Job } from "@prisma/client";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../ui/button";
import { CircularProgress } from "../ui/progress";
import { UploadCloud } from "lucide-react";

type Props = {
  task: Job;
  attachedFiles: Document[];
  fetchFiles: () => Promise<void>;
};

const SelectFiles = (props: Props) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const { task, attachedFiles, fetchFiles } = props;

  const { selectedOrg } = useOrgStore();

  const fetchDocs = async () => {
    try {
      setLoading(true);
      if (selectedOrg) {
        const response = await getDocuments(selectedOrg.id);
        const allDocuments: Document[] = response.data.documents;

        const attachedFileIds = new Set(attachedFiles.map((file) => file.id));

        const documentsToSet = allDocuments.filter(
          ({ id }) => !attachedFileIds.has(id)
        );

        setDocuments(documentsToSet);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error fetching documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [selectedOrg]);

  const handleSelectAll = (event: any) => {
    if (selectedRows?.length === documents?.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(documents.map((row) => row.id));
    }
  };

  const handleRowSelect = (id: number) => {
    const updatedSelectedRows = [...selectedRows];
    if (selectedRows.includes(id)) {
      updatedSelectedRows.splice(selectedRows.indexOf(id), 1);
    } else {
      updatedSelectedRows.push(id);
    }
    setSelectedRows(updatedSelectedRows);
  };

  const handleAddDocuments = async () => {
    if (selectedRows.length === 0) {
      toast.error("Please select atleast 1 document to add");
      return;
    }

    try {
      const response = await addJobDocuments(task.id, selectedRows);
      if (response.status === 201) {
        toast.success("Documents attached successfully");
        fetchFiles();
      } else {
        toast.error("Error adding documents");
      }
    } catch (error) {
      toast.error("Error adding documents");
      console.log(error);
    } finally {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogTrigger asChild>
        <Button asChild onClick={() => setOpen(true)}>
          <span className="cursor-pointer flex items-center gap-1">
            <UploadCloud className="h-4 w-4" />
            Add File{" "}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent size="4xl">
        <DialogHeader >
          <DialogTitle className="text-lg font-medium text-default-700 ">
            Select Files
          </DialogTitle>
        </DialogHeader>

        <div className="text-sm text-default-500  space-y-4">
          <div className="flex-1 h-full overflow-auto no-scrollbar">
            {loading ? (
              <div className="flex justify-center items-center w-full h-full">
                <CircularProgress value={50} color="primary" loading />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center w-full mt-6 mb-6">
                No documents found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center  space-x-1">
                        <Checkbox
                          checked={
                            selectedRows.length === documents.length ||
                            "indeterminate"
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">File Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="whitespace-nowrap">
                      Upload Date
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {documents.map((item) => (
                    <TableRow
                      key={item.id}
                      className="hover:bg-muted whitespace-nowrap"
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.includes(item.id)}
                          onCheckedChange={() => handleRowSelect(item.id)}
                        />
                      </TableCell>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
        <DialogFooter className="mt-8">
          <DialogClose asChild>
            <Button type="submit" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleAddDocuments}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 

export default SelectFiles;
