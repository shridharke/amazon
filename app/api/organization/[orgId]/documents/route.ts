import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = auth(async function GET(request, response) {
  if (!request.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  let orgId = response.params?.orgId;
  if (!orgId) {
    return NextResponse.json(
      { message: "Organization ID is required" },
      { status: 400 }
    );
  }

  if (Array.isArray(orgId)) {
    orgId = orgId[0]; // Access the first element of the array
  }

  const parsedOrgId = parseInt(orgId);

  try {
    const documents = await prisma.document.findMany({
      where: {
        orgId: parsedOrgId,
      },
    });

    return NextResponse.json(
      {
        message: "Documents retrieved successfully",
        documents,
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
