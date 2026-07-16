import { BarChart3, FileText, LayoutDashboard, Link2, Package, Recycle, Settings, UploadCloud } from "lucide-react";

import type { NavGroup } from "./types";

export type { NavGroup, NavMainItem } from "./types";

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Cockpit",
    items: [
      {
        title: "Vue d'ensemble",
        url: "/dashboard/default",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 2,
    label: "Opérations",
    items: [
      {
        title: "Imports",
        url: "/dashboard/orders",
        icon: UploadCloud,
      },
      {
        title: "Catalogue",
        url: "/dashboard/products",
        icon: Package,
      },
      {
        title: "Déclarations",
        url: "/dashboard/declarations",
        icon: FileText,
      },
      {
        title: "Analytique",
        url: "/dashboard/analytics",
        icon: BarChart3,
      },
      {
        title: "Éco-organismes",
        url: "/dashboard/eco-organismes",
        icon: Recycle,
      },
      {
        title: "Intégrations",
        url: "/dashboard/integrations",
        icon: Link2,
      },
    ],
  },
  {
    id: 3,
    label: "Configuration",
    items: [
      {
        title: "Paramètres",
        url: "/dashboard/settings",
        icon: Settings,
      },
    ],
  },
];
