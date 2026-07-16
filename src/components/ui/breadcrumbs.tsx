"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";

const routeNameMap: Record<string, string> = {
    dashboard: "Vue d'ensemble",
    products: "Produits",
    import: "Imports",
    orders: "Import ventes",
    tasks: "Tâches",
    declarations: "Déclarations",
    settings: "Paramètres",
    billing: "Facturation",
    "eco-organismes": "Éco-organismes",
    integrations: "Intégrations",
    notifications: "Notifications",
    audit: "Journal d'audit",
    analytics: "Analytics",
    documentation: "Guide CSV",
    modulation: "Modulation",
    default: "Accueil",
};

export function Breadcrumbs() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);

    // If we are just on dashboard/default or dashboard, show "Vue d'ensemble"
    if (segments.length <= 1 || (segments.length === 2 && segments[1] === "default")) {
        return (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                <span className="text-foreground">Vue d'ensemble</span>
            </div>
        );
    }

    return (
        <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:text-emerald-600 transition-colors">
                <Home className="size-3.5" />
            </Link>
            {segments.slice(1).map((segment, index) => {
                const path = `/${segments.slice(0, index + 2).join("/")}`;
                const isLast = index === segments.slice(1).length - 1;
                const name = routeNameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

                return (
                    <Fragment key={path}>
                        <ChevronRight className="size-3.5 text-muted-foreground/70" />
                        {isLast ? (
                            <span className="text-foreground font-medium">{name}</span>
                        ) : (
                            <Link href={path} className="hover:text-emerald-600 transition-colors">
                                {name}
                            </Link>
                        )}
                    </Fragment>
                );
            })}
        </div>
    );
}
