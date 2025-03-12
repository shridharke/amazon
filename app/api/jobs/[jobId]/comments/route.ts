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
    const comments = await prisma.comment.findMany({
      where: { jobId: parseJobId },
      include: {
        user: true,
      },
    });

    return NextResponse.json(
      {
        message: "Comments retrieved successfully",
        comments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to retrieve comments:", error);

    return NextResponse.json(
      {
        message: "Failed to retrieve comments",
        details: error,
      },
      { status: 500 }
    );
  }
});
