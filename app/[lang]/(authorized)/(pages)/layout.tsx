import DashBoardLayoutProvider from "@/provider/dashboard.layout.provider";
import { redirect } from "next/navigation";
import { getDictionary } from "@/app/dictionaries";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { useOrgStore } from "@/store";

const layout = async ({
  children,
  params: { lang },
}: {
  children: React.ReactNode;
  params: { lang: any };
}) => {
  const session = await auth();
  const userId = session?.user?.id;

  const userWithOrgs = await prisma.user.findUnique({
    where: {
      id: userId
    },
    include: {
      orgs: true,
    }
  });

  if (userWithOrgs && userWithOrgs.orgs.length > 0) {
    console.log("User has organizations.");
  } else {
    redirect("/create-org")
  }

  const trans = await getDictionary(lang);

  return (
    <DashBoardLayoutProvider trans={trans}>{children}</DashBoardLayoutProvider>
  );
};

export default layout;
