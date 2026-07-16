"use client";

import { useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Building2, CreditCard, LogOut, Settings, User } from "lucide-react";
import { toast } from "sonner";

import { logout } from "@/app/actions/auth";
import { setCurrentOrganization } from "@/app/actions/organizations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";

interface OrganizationOption {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export function NavUser({
  user,
  currentOrgId,
  organizations,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  currentOrgId: null | string;
  organizations: OrganizationOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedOrgId, setSelectedOrgId] = useState(currentOrgId ?? organizations[0]?.id ?? "");
  const activeOrganization =
    organizations.find((organization) => organization.id === selectedOrgId) ?? organizations[0] ?? null;

  const handleOrganizationChange = (orgId: string) => {
    if (!orgId || orgId === selectedOrgId) {
      return;
    }

    const previousOrgId = selectedOrgId;
    setSelectedOrgId(orgId);

    startTransition(async () => {
      try {
        await setCurrentOrganization(orgId);
        router.refresh();
      } catch (error) {
        setSelectedOrgId(previousOrgId);
        toast.error(error instanceof Error ? error.message : "Impossible de changer d'organisation");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 w-full justify-start gap-2 px-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={user.avatar || undefined} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-muted-foreground text-xs">{user.email}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" sideOffset={4}>
        {organizations.length > 1 ? (
          <>
            <DropdownMenuLabel className="space-y-1">
              <span className="flex items-center gap-2">
                <Building2 className="size-4" />
                Organisation active
              </span>
              <span className="block truncate font-normal text-muted-foreground text-xs">
                {activeOrganization?.name ?? "Aucune organisation"}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={selectedOrgId} onValueChange={handleOrganizationChange}>
              {organizations.map((organization) => (
                <DropdownMenuRadioItem key={organization.id} value={organization.id} disabled={isPending}>
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <span className="truncate">{organization.name}</span>
                    <span className="truncate text-muted-foreground text-xs uppercase">{organization.role}</span>
                  </div>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
          </>
        ) : null}

        <DropdownMenuItem asChild>
          <Link href="/dashboard/account" prefetch={false}>
            <span className="flex items-center gap-2">
              <User />
              Compte
            </span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings" prefetch={false}>
            <span className="flex items-center gap-2">
              <Settings />
              Parametres
            </span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/billing" prefetch={false}>
            <span className="flex items-center gap-2">
              <CreditCard />
              Facturation
            </span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <form action={logout} className="w-full">
            <button type="submit" className="flex w-full items-center gap-2">
              <LogOut />
              Se deconnecter
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
