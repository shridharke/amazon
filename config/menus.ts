import {
  Calendar,
  DashBoard,
  Files,
  ListFill
} from "@/components/svg";

export interface MenuItemProps {
  title: string;
  icon: any;
  href?: string;
  child?: MenuItemProps[];
  megaMenu?: MenuItemProps[];
  multi_menu?: MenuItemProps[];
  nested?: MenuItemProps[];
  onClick: () => void;
}

export const menusConfig = {
  mainNav: [
    {
      title: "Dashboard",
      icon: DashBoard,
      href: "/dashboard",
      child: null,
    },
    {
      title: "Scheduling",
      icon: Calendar,
      href: "/calendar",
    },
    {
      title: "Task Allocation",
      icon: ListFill,
      href: "/jobs",
    },
    {
      title: "Employees",
      icon: ListFill,
      href: "/employees",
    },
  ],
  sidebarNav: {
    modern: [
      {
        title: "Dashboard",
        icon: DashBoard,
        href: "/dashboard",
        child: null,
      },
      {
        title: "Scheduling",
        icon: Calendar,
        href: "/calendar",
      },
      {
        title: "Task Allocation",
        icon: ListFill,
        href: "/jobs",
      },
      {
        title: "Employees",
        icon: ListFill,
        href: "/employees",
      },
    ],
    classic: [
      {
        isHeader: true,
        title: "Pages",
      },
      {
        title: "Dashboard",
        icon: DashBoard,
        href: "/dashboard",
        child: null,
      },
      {
        title: "Scheduling",
        icon: Calendar,
        href: "/calendar",
      },
      {
        title: "Task Allocation",
        icon: ListFill,
        href: "/jobs",
      },
      {
        title: "Employees",
        icon: ListFill,
        href: "/employees",
      },
    ],
  },
};

export type ModernNavType = (typeof menusConfig.sidebarNav.modern)[number];
export type ClassicNavType = (typeof menusConfig.sidebarNav.classic)[number];
export type MainNavType = (typeof menusConfig.mainNav)[number];
