import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const DELETE = auth(async function DELETE(request, response) {
  if (!request.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  let fileId = response.params?.fileId;

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

  try {
    await prisma.document.delete({
      where: {
        id: parseFileId,
      },
    });

    return NextResponse.json(
      { message: "Document deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
});
