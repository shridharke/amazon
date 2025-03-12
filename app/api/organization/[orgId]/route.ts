// app/api/organization/[orgId]/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = auth(async (request, response) => {
  if (!request.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  let orgId = response.params?.id;

  if (!orgId) {
    return NextResponse.json(
      { message: "Org ID is required" },
      { status: 400 }
    );
  }

  if (Array.isArray(orgId)) {
      orgId = orgId[0];
  }
  const id = parseInt(orgId);

  try {
    // Verify user has access to this organization
    const userOrg = await prisma.organization.findFirst({
      where: {
        id,
        users: {
          some: {
            id: request.auth.user?.id
          }
        }
      }
    });

    if (!userOrg) {
      return NextResponse.json({ message: "Organization not found or access denied" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Organization retrieved successfully",
        organization: userOrg,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to retrieve organization:", error);

    return NextResponse.json(
      {
        message: "Failed to retrieve organization",
        details: error,
      },
      { status: 500 }
    );
  }
});

export const PATCH = auth(async (request, response) => {
  if (!request.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  let orgId = response.params?.id;

  if (!orgId) {
    return NextResponse.json(
      { message: "Org ID is required" },
      { status: 400 }
    );
  }

  if (Array.isArray(orgId)) {
      orgId = orgId[0];
  }
  const id = parseInt(orgId);

  try {
    // Verify user has access to this organization
    const userOrg = await prisma.organization.findFirst({
      where: {
        id,
        users: {
          some: {
            id: request.auth.user?.id
          }
        }
      }
    });

    if (!userOrg) {
      return NextResponse.json({ message: "Organization not found or access denied" }, { status: 404 });
    }

    const data = await request.json();
    
    // Update the organization
    const updatedOrg = await prisma.organization.update({
      where: {
        id,
      },
      data: {
        name: data.orgName !== undefined ? data.orgName : undefined,
        shiftStartTime: data.shiftStartTime !== undefined ? data.shiftStartTime : undefined,
        shiftDuration: data.shiftDuration !== undefined ? data.shiftDuration : undefined,
      },
    });

    return NextResponse.json(
      {
        message: "Organization updated successfully",
        organization: updatedOrg,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to update organization:", error);

    return NextResponse.json(
      {
        message: "Failed to update organization",
        details: error,
      },
      { status: 500 }
    );
  }
});

export const DELETE = auth(async (request, response) => {
  if (!request.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  let orgId = response.params?.id;

  if (!orgId) {
    return NextResponse.json(
      { message: "Org ID is required" },
      { status: 400 }
    );
  }

  if (Array.isArray(orgId)) {
      orgId = orgId[0];
  }
  const id = parseInt(orgId);

  try {
    // Verify user has access to this organization
    const userOrg = await prisma.organization.findFirst({
      where: {
        id,
        users: {
          some: {
            id: request.auth.user?.id
          }
        }
      }
    });

    if (!userOrg) {
      return NextResponse.json({ message: "Organization not found or access denied" }, { status: 404 });
    }

    // Delete the organization
    // Note: Consider if this should be a soft delete instead
    const deletedOrg = await prisma.organization.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      {
        message: "Organization deleted successfully",
        organization: deletedOrg,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete organization:", error);

    return NextResponse.json(
      {
        message: "Failed to delete organization",
        details: error,
      },
      { status: 500 }
    );
  }
});