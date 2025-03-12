import EmployeePageView from "./page-view";
import { getDictionary } from "@/app/dictionaries";

interface EmployeePageProps {
  params: {
    lang: string;
  };
}

const EmployeePage = async ({ params: { lang } }: EmployeePageProps) => {
  return <EmployeePageView />;
};

export default EmployeePage;