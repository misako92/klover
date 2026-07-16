import type { ReactNode } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/app/(app)/dashboard/_components/sidebar/app-sidebar";
import { CommandMenu } from "@/components/dashboard/command-menu";
import { UserNameProvider } from "@/components/dashboard/user-context";
import { SupportWidget } from "@/components/layout/support-widget";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ComplianceDataProvider } from "@/features/compliance/context/compliance-data-context";
import { getCurrentOrgId, requireUser } from "@/lib/auth/context";
import prisma from "@/lib/db";
import { SIDEBAR_COLLAPSIBLE_VALUES, SIDEBAR_VARIANT_VALUES } from "@/lib/preferences/layout";
import { cn } from "@/lib/utils";
import { getPreference } from "@/server/server-actions";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const user = await requireUser();

  // Check if user has completed onboarding (has at least one org)
  const membershipCount = await prisma.organizationMember.count({
    where: { userId: user.id },
  });
  if (membershipCount === 0) {
    redirect("/onboarding");
  }

  const [variant, collapsible, currentOrgId, memberships, dbUser] = await Promise.all([
    getPreference("sidebar_variant", SIDEBAR_VARIANT_VALUES, "inset"),
    getPreference("sidebar_collapsible", SIDEBAR_COLLAPSIBLE_VALUES, "icon"),
    getCurrentOrgId(),
    prisma.organizationMember.findMany({
      where: { userId: user.id },
      select: {
        role: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true },
    }),
  ]);

  const organizations = memberships.map((membership) => ({
    id: membership.organization.id,
    name: membership.organization.name,
    slug: membership.organization.slug,
    role: membership.role,
  }));

  const displayName = dbUser?.name || user.user_metadata?.full_name || "";

  return (
    <UserNameProvider name={displayName}>
      <ComplianceDataProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar
            variant={variant}
            collapsible={collapsible}
            user={{
              name: user.user_metadata?.full_name || user.email || "Compte",
              email: user.email || "",
              avatar: user.user_metadata?.avatar_url || "",
            }}
            currentOrgId={currentOrgId ?? organizations[0]?.id ?? null}
            organizations={organizations}
          />
          <CommandMenu />
          <SupportWidget />
          <SidebarInset className={cn("premium-bg flex h-[100dvh] flex-col overflow-hidden")}>
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-4">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </ComplianceDataProvider>
    </UserNameProvider>
  );
}
