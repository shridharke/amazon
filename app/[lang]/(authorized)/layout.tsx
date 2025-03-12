import DashBoardLayoutProvider from "@/provider/dashboard.layout.provider";
import { redirect } from "next/navigation";
import { getDictionary } from "@/app/dictionaries";
import { auth } from "@/lib/auth";

const layout = async ({
  children,
  params: { lang },
}: {
  children: React.ReactNode;
  params: { lang: any };
}) => {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  return <>{children}</>;
};

export default layout;
