"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import {
  ArrowRightLeft,
  CreditCard,
  FileText,
  Laptop,
  LayoutDashboard,
  LineChart,
  LogOut,
  Moon,
  Package,
  Settings,
  Sparkles,
  Sun,
  Upload,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();

  React.useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Rechercher une commande..." />
      <CommandList>
        <CommandEmpty>Aucun resultat.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/default"))}>
            <LayoutDashboard className="mr-2 size-4" />
            <span>Vue d'ensemble</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/orders"))}>
            <Upload className="mr-2 size-4" />
            <span>Imports</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/products"))}>
            <Package className="mr-2 size-4" />
            <span>Catalogue</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/declarations"))}>
            <FileText className="mr-2 size-4" />
            <span>Declarations</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings"))}>
            <Settings className="mr-2 size-4" />
            <span>Parametres</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Outils">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/analytics"))}>
            <LineChart className="mr-2 size-4" />
            <span>Analytics</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/integrations"))}>
            <ArrowRightLeft className="mr-2 size-4" />
            <span>Integrations</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/activity"))}>
            <FileText className="mr-2 size-4" />
            <span>Activite</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions rapides">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/orders?action=new"))}>
            <Sparkles className="mr-2 size-4" />
            <span>Nouvel import CSV</span>
            <CommandShortcut>Ctrl+N</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
            <Sun className="mr-2 size-4" />
            <span>Clair</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            <Moon className="mr-2 size-4" />
            <span>Sombre</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
            <Laptop className="mr-2 size-4" />
            <span>Systeme</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Compte">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings"))}>
            <User className="mr-2 size-4" />
            <span>Compte</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/billing"))}>
            <CreditCard className="mr-2 size-4" />
            <span>Abonnement</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/logout"))}>
            <LogOut className="mr-2 size-4" />
            <span>Se deconnecter</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
