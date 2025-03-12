"use client";
import FileUpload from "./file-upload";
import ListFileCard from "@/components/files/list-file-card";
import SingleFileCard from "@/components/files/single-file-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CircularProgress } from "@/components/ui/progress";
import { getDocuments } from "@/config/db";
import { cn, formatSize } from "@/lib/utils";
import { useOrgStore } from "@/store";
import { Document } from "@prisma/client";
import { LayoutGrid, List, Search, UploadCloud } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

type Props = {};

const Documents = (props: Props) => {
  const [fileView, setFileView] = useState<"grid" | "list">("grid");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const { selectedOrg } = useOrgStore();

  const calculateTotalSize = (documents: Document[]) => {
    return documents.reduce((total, doc) => total + doc.size, 0);
  };

  const fetchDocs = async () => {
    try {
      setLoading(true);
      if (selectedOrg) {
        const response = await getDocuments(selectedOrg.id);
        setDocuments(response.data.documents);
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

  return (
    <>
      {open && <FileUpload fetchFiles={fetchDocs} />}
      <Card className="mt-2">
        <CardHeader className="mb-0 border-none p-6">
          <div className="flex flex-wrap justify-between gap-4">
            <div className="flex-1">
              <div className="text-lg font-medium text-default-900 whitespace-nowrap">
                Your Documents
              </div>
              <div className="text-xs lg:text-sm font-medium text-default-600 whitespace-nowrap">
                Total {documents.length} files,{" "}
                {formatSize(calculateTotalSize(documents))} space usage
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

              <Label htmlFor="fileUpload">
                <Button asChild onClick={() => setOpen(!open)}>
                  <span className="cursor-pointer flex items-center gap-1">
                    <UploadCloud className="h-4 w-4" />
                    Upload File{" "}
                  </span>
                </Button>
              </Label>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center w-full h-full">
              <CircularProgress value={50} color="primary" loading />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center w-full mt-6 mb-6">
              No documents found
            </div>
          ) : (
            <>
              {fileView === "grid" && (
                <div className="grid  grid-cols-1  md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {documents?.map((item) => (
                    <SingleFileCard item={item} key={item.id} fetchFiles={fetchDocs}/>
                  ))}
                </div>
              )}
              {fileView === "list" && <ListFileCard files={documents} fetchFiles={fetchDocs}/>}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default Documents;
