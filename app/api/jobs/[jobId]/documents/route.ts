import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = auth(async function GET(request, response) {
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
    const job = await prisma.job.findUnique({
      where: {
        id: parseJobId,
      },
      include: {
        documents: true,
      },
    });

    return NextResponse.json(
      {
        message: "Documents retrieved successfully",
        job,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to retrieve documents:", error);

    return NextResponse.json(
      {
        message: "Failed to retrieve documents",
        details: error,
      },
      { status: 500 }
    );
  }
});

export const POST = auth(async function POST(request, response) {
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

    const updatedJob = await prisma.job.update({
      where: {
        id: parseInt(jobId),
      },
      data: {
        documents: {
          connect: data.map((id: number) => ({ id })),
        },
      },
    });

    return NextResponse.json(
      {
        message: "Documents attached successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to attach documents:", error);

    return NextResponse.json(
      {
        message: "Failed to attach documents",
        details: error,
      },
      { status: 500 }
    );
  }
});
