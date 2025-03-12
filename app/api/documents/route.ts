import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const POST = auth(async function POST(request) {
  if (!request.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    const data = await request.json();

		const { name, fileName, fileKey, fileType, fileUrl, size, orgId} = data;

    const document = await prisma.document.create({
      data: {
        name,
        fileName,
        fileKey,
        fileUrl,
        fileType,
        size,
        orgId
      }
    });

    return NextResponse.json(
      {
        message: "Document created successfully",
        document,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create document:", error);

    return NextResponse.json(
      {
        message: "Failed to create document",
        details: error,
      },
      { status: 500 }
    );
  }
});
