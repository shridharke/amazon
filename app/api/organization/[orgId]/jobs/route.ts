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
    orgId = orgId[0];
  }

  const parsedOrgId = parseInt(orgId);

  try {
    const jobs = await prisma.job.findMany({
      where: {
        orgId: parsedOrgId,
      },
    });

    return NextResponse.json(
      {
        message: "Job retrieved successfully",
        jobs,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to retrieve jobs:", error);

    return NextResponse.json(
      {
        message: "Failed to retrieve jobs",
        details: error,
      },
      { status: 500 }
    );
  }
});
