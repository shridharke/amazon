"use client";
import { createDocument } from "@/config/db";
import { getS3Url, uploadToS3 } from "@/lib/s3";
import { useOrgStore } from "@/store";
import axios from "axios";
import { Inbox, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";

interface FileUploadProps {
  fetchFiles: () => Promise<void>;
}

const FileUpload: React.FC<FileUploadProps> = ({ fetchFiles }) => {
  const [uploading, setUploading] = useState(false);
  const { selectedOrg } = useOrgStore();

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        [".pptx"],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      const fileExtension = file.name.split(".").pop();

      console.log(fileExtension);

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large");
        return;
      }

      try {
        setUploading(true);
        const data = await uploadToS3(file);
        if (!data?.file_key || !data.file_name) {
          toast.error("Something went wrong");
          return;
        }

        const response = await createDocument({
          fileName: data.file_name,
          fileKey: data.file_key,
          name: file.name,
          fileUrl: getS3Url(data.file_key),
          fileType: fileExtension,
          size: file.size,
          orgId: selectedOrg?.id,
        });

        if (response.status === 201) {
          toast.success("File uploaded and saved successfully");
          fetchFiles();
        } else {
          toast.error("Error creating document");
        }
      } catch (error) {
        console.error(error);
        toast.error("Error uploading file");
      } finally {
        setUploading(false);
      }
    },
  });

  return (
    <div className="p-2 bg-accent rounded-xl">
      <div
        {...getRootProps({
          className:
            "border-dashed border-2 rounded-xl cursor-pointer bg-accent py-8 flex justify-center items-center flex-col",
        })}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <>
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            <p className="mt-2 text-sm text-slate-400">Uploading file...</p>
          </>
        ) : (
          <>
            <Inbox className="w-10 h-10 text-blue-500" />
            <p className="mt-2 text-sm text-state-400">Drop PDF Here</p>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
