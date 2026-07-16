import type { LucideIcon } from "lucide-react";

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  subItems?: NavMainItem[];
}

export interface NavGroup {
  id: number;
  label: string;
  items: NavMainItem[];
}
