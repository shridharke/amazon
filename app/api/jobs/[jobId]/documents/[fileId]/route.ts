import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const DELETE = auth(async function DELETE(request, response) {
  if (!request.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  let jobId = response.params?.jobId;
  let fileId = response.params?.fileId;

  if (!jobId) {
    return NextResponse.json(
      { message: "Job ID is required" },
      { status: 400 }
    );
  }

  if (!fileId) {
    return NextResponse.json(
      { message: "File ID is required" },
      { status: 400 }
    );
  }

  if (Array.isArray(fileId)) {
    fileId = fileId[0];
  }
  const parseFileId = parseInt(fileId);

  if (Array.isArray(jobId)) {
    jobId = jobId[0];
  }
  const parseJobId = parseInt(jobId);

  try {
    const updatedJob = await prisma.job.update({
      where: {
        id: parseJobId,
      },
      data: {
        documents: {
          disconnect: {
            id: parseFileId,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Document deleted successfully", updatedJob },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
});
