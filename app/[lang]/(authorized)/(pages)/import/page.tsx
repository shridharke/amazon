// app/(dashboard)/[lang]/import/performance/page.tsx
"use client";

import { useState } from "react";
import { useOrgStore } from "@/store/index";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export default function ImportPerformanceData() {
  const { selectedOrg } = useOrgStore();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedOrg) {
      toast({
        title: "Error",
        description: "Please select a file and organization",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("organizationId", selectedOrg.id.toString());

      const response = await fetch("/api/import/performance", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Performance data imported successfully",
        });
        setResult(data.stats);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to import data",
        });
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-medium text-default-800">
        Import Historical Performance Data
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Upload Performance CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="mb-2">
                Upload a CSV file with historical performance data. The file should have the
                following columns:
              </p>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>Date (format: MM/DD/YYYY)</li>
                <li>Day (e.g., Monday, Tuesday)</li>
                <li>Employee ID (must match existing employee IDs)</li>
                <li>Role (Inductor, Downstacker, or Stower)</li>
                <li>Packages Handled</li>
                <li>Total Packages</li>
                <li>working_hours</li>
              </ul>
            </div>

            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-white
                  hover:file:bg-primary/80"
              />
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading || !selectedOrg}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload"
                )}
              </Button>
            </div>

            {result && (
              <div className="mt-6 p-4 bg-muted rounded-md">
                <h3 className="font-medium mb-2">Import Results:</h3>
                <ul className="space-y-1 text-sm">
                  <li>Total Records: {result.totalRecords}</li>
                  <li>Processed Records: {result.processedRecords}</li>
                  <li>Created Shifts: {result.createdShifts}</li>
                  <li>Created Schedules: {result.createdSchedules}</li>
                  <li>Created Packages: {result.createdPackages}</li>
                  <li>Created Performance Records: {result.createdPerformanceRecords}</li>
                  <li>Errors: {result.errors}</li>
                </ul>
                {result.errors > 0 && (
                  <div className="mt-2">
                    <details>
                      <summary className="cursor-pointer text-sm text-red-500">View Error Details</summary>
                      <pre className="mt-2 p-2 bg-red-50 rounded text-xs overflow-auto max-h-40">
                        {result.errorDetails.join('\n')}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}