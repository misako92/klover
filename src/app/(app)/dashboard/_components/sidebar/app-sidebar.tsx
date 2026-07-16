"use client";

import Link from "next/link";

import { useShallow } from "zustand/react/shallow";

import { BrandLogo } from "@/components/brand-logo";
import { useSubscriptionState } from "@/components/subscription/subscription-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    avatar: string;
    email: string;
    name: string;
  };
  currentOrgId: null | string;
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }>;
}

export function AppSidebar({ user, currentOrgId, organizations, ...props }: AppSidebarProps) {
  const { plan, isTrialing, trialEndsAt } = useSubscriptionState();
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.sidebarVariant,
      sidebarCollapsible: s.sidebarCollapsible,
      isSynced: s.isSynced,
    })),
  );

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  return (
    <Sidebar
      {...props}
      variant={variant}
      collapsible={collapsible}
      className="border-r border-white/40 bg-white/40 shadow-soft backdrop-blur-3xl supports-[backdrop-filter]:bg-white/40"
    >
      <SidebarHeader className="border-white/20 border-b pb-3">
        <SidebarMenu>
          <SidebarMenuItem id="command-menu-trigger">
            <SidebarMenuButton asChild className="h-auto rounded-lg px-2 py-2.5">
              <Link prefetch={false} href="/dashboard/default">
                <BrandLogo className="size-6 text-primary" />
                <div className="flex min-w-0 flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base">{APP_CONFIG.name}</span>
                    <span
                      className={`rounded-full border px-1.5 py-0.5 font-semibold text-[10px] uppercase tracking-wide ${
                        isTrialing && trialDaysLeft > 0
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : plan.id === "free"
                            ? "border-zinc-200 bg-zinc-50 text-zinc-600"
                            : "border-emerald-200 bg-emerald-50 text-emerald-800"
                      }`}
                    >
                      {isTrialing && trialDaysLeft > 0 ? `Essai · ${trialDaysLeft}j` : plan.name}
                    </span>
                  </div>
                  <span className="text-sidebar-foreground/65 text-xs">Pilotage conformité AGEC/REP</span>
                </div>
                <span className="sr-only">{plan.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarItems} />
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} currentOrgId={currentOrgId} organizations={organizations} />
      </SidebarFooter>
    </Sidebar>
  );
}
