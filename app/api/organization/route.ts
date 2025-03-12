import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = auth(async (request) => {
  if (!request.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    const userId = request.auth.user?.id;
    const userWithOrgs = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        orgs: true,
      },
    });
    if (!userWithOrgs) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Organizations retrieved successfully",
      organizations: userWithOrgs.orgs
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user organizations:", error);

    return NextResponse.json(
      { 
        message: "Failed to fetch user organizations",
        details: error
      },
      { status: 500 }
    );
  }
});

export const POST = auth(async (request) => {
  if (!request.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const userId = request.auth.user?.id;

    if (!data.orgName || !data.doi || !data.gstno) {
      return NextResponse.json(
        {
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Create the organization with the updated schema
    const organization = await prisma.organization.create({
      data: {
        name: data.orgName,
        shiftStartTime: data.shiftStartTime || "09:00", // Default value
        shiftDuration: data.shiftDuration || 5, // Default value
        users: {
          connect: [{ id: userId }],
        },
      },
    });

    return NextResponse.json(
      {
        message: "Organization created successfully",
        organization,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create organization:", error);

    return NextResponse.json(
      {
        message: "Failed to create organization",
        details: error,
      },
      { status: 500 }
    );
  }
});