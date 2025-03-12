"use client";
import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useOrgStore } from "@/store";
import { Organization } from "@prisma/client";
import { useEffect } from "react";
import prisma from "@/lib/prisma";
import { useSession } from "next-auth/react";
import { getOrganizations } from "@/config/db";

import { Icon } from "@iconify/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
const OrgSelector = () => {
  const [open, setOpen] = React.useState<boolean>(false);
  const { selectedOrg, setSelectedOrg, allOrgs, setAllOrgs } = useOrgStore();

  const handleSelectOrg = (orgId: string) => {
    const org = allOrgs?.find((org) => org.id.toString() === orgId);
    setSelectedOrg(org ?? null);
    setOpen(false);
  };

  useEffect(() => {
    const fetchOrgs = async () => {
      const response = await getOrganizations();
      const orgs = response.data.organizations;
      console.log("orgs - ", orgs)
      setSelectedOrg(orgs[0] ?? null);
      setAllOrgs(orgs ?? []);
    };
    fetchOrgs();
  }, []);

  return (
    <React.Fragment>
      <div className="flex">
        <Button
          className="ltr:rounded-r-none  rtl:rounded-l-none"
          variant="outline"
        >
          {selectedOrg ? selectedOrg.name : "Select organization..."}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="ltr:rounded-l-none ltr:border-l-0 rtl:rounded-r-none rtl:border-r-0"
              size="icon"
            >
              <Icon icon="heroicons:chevron-down" className=" h-5 w-5 " />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[196px]" align="start">
            <DropdownMenuLabel>Your Organizations</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allOrgs?.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onSelect={() => handleSelectOrg(org.id.toString())}
              >
                {org.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </React.Fragment>
  );
};
export default OrgSelector;
