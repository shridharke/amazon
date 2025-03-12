import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const DELETE = auth(async function DELETE(request, response) {
  if (!request.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    let commentId = response.params?.v;

    if (!commentId) {
      return NextResponse.json(
        { message: "File ID is required" },
        { status: 400 }
      );
    }

    if (Array.isArray(commentId)) {
      commentId = commentId[0];
    }
    const parseCommentId = parseInt(commentId);

    await prisma.comment.delete({
      where: { id: parseCommentId },
    });

    return NextResponse.json(
      {
        message: "Comment deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return NextResponse.json(
      {
        message: "Failed to delete comment",
        details: error,
      },
      { status: 500 }
    );
  }
});
