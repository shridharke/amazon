import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const POST = auth(async function POST(request) {
  if (!request.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { comment, jobId } = data;

    const userId = request.auth.user?.id;

    if (!comment || !jobId || !userId) {
      return NextResponse.json(
        {
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    const newComment = await prisma.comment.create({
      data: {
        comment,
        jobId,
        userId,
      },
    });

    return NextResponse.json(
      {
        message: "Comment created successfully",
        comment: newComment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create comment:", error);
    return NextResponse.json(
      {
        message: "Failed to create comment",
        details: error,
      },
      { status: 500 }
    );
  }
});
