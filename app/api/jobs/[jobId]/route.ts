import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const PATCH = auth(async function PATCH(request, response) {
  if (!request.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  let jobId = response.params?.jobId;

  if (!jobId) {
    return NextResponse.json(
      { message: "Job ID is required" },
      { status: 400 }
    );
  }

  if (Array.isArray(jobId)) {
    jobId = jobId[0];
  }
  const parseJobId = parseInt(jobId);

  try {
    const data = await request.json();
    console.log("Received data - ", data);
    const updatedJob = await prisma.job.update({
      where: {
        id: parseJobId,
      },
      data,
    });

    return NextResponse.json(
      { message: "Job updated successfully", updatedJob },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
});
