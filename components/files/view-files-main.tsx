"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { getJobDocuments, removeJobDocument } from "@/config/db";
import { cn } from "@/lib/utils";
import { Document, Job } from "@prisma/client";
import { LayoutGrid, List, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CircularProgress } from "../ui/progress";
import ListFileCard from "./list-file-card-main";
import SelectFiles from "./select-files-main";
import SingleFileCard from "./single-file-card-main";

interface ViewFileProps {
  task: Job;
}

const ViewFiles = ({ task }: ViewFileProps) => {
  const [fileView, setFileView] = useState<"grid" | "list">("list");
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      if (task) {
        const response = await getJobDocuments(task.id);
        setDocuments(response.data.job.documents);
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
  }, []);

  const handleDelete = async (fileId: number) => {
    try {
      const response = await removeJobDocument(task.id, fileId);

      if (response.status === 200) {
        toast.success("File Removed Successfully");
        fetchDocs();
      } else {
        toast.error("Unable to delete file");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error deleting file");
    }
  };

  return (
    <Card className="mt-1">
      {loading ? (
        <div className="flex justify-center items-center w-full h-full">
          <CircularProgress value={50} color="primary" loading />
        </div>
      ) : (
        <>
          <CardHeader className="mb-0 border-none px-8">
            <div className="flex flex-wrap justify-between gap-4">
              <div className="flex-1">
                <div className="text-base font-medium text-default-900 whitespace-nowrap">
                  Job Files
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Button
                  size="icon"
                  variant="outline"
                  className={cn("hover:bg-transparent  ", {
                    "hover:border-primary hover:text-primary":
                      fileView === "grid",
                    "hover:border-muted-foreground hover:text-muted-foreground":
                      fileView !== "grid",
                  })}
                  color={fileView === "grid" ? "primary" : "secondary"}
                  onClick={() => setFileView("grid")}
                >
                  <LayoutGrid className="h-5 w-5" />
                </Button>

                <Button
                  size="icon"
                  variant="outline"
                  className={cn("hover:bg-transparent  ", {
                    "hover:border-primary hover:text-primary":
                      fileView === "list",
                    "hover:border-muted-foreground hover:text-muted-foreground":
                      fileView !== "list",
                  })}
                  color={fileView === "list" ? "primary" : "secondary"}
                  onClick={() => setFileView("list")}
                >
                  <List className="h-5 w-5" />
                </Button>

                <SelectFiles
                  task={task}
                  attachedFiles={documents}
                  fetchFiles={fetchDocs}
                />
              </div>
            </div>
          </CardHeader>

          {documents.length === 0 ? (
            <div className="text-center w-full mt-6 mb-6">
              No documents attached
            </div>
          ) : (
            <CardContent>
              {fileView === "grid" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {documents?.map((item, i) => (
                    <SingleFileCard
                      item={item}
                      handleDelete={handleDelete}
                      key={i}
                    />
                  ))}
                </div>
              )}
              {fileView === "list" && (
                <ListFileCard files={documents} handleDelete={handleDelete} />
              )}
            </CardContent>
          )}
        </>
      )}
    </Card>
  );
};

export default ViewFiles;
