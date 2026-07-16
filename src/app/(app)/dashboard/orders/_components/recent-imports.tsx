"use client";


import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useComplianceData } from "@/features/compliance/context/compliance-data-context";

const statusStyles = {
  COMPLETED: { label: "Succes", className: "bg-emerald-100 text-emerald-700" },
  FAILED: { label: "Echec", className: "bg-red-100 text-red-700" },
} as const;

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "A l'instant";
  if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
  return date.toLocaleDateString("fr-FR");
}

export function RecentImports() {
  const { imports } = useComplianceData();

  if (imports.length === 0) {
    return (
      <div className="divide-y rounded-xl border border-border bg-card">
        <div className="p-6">
          <Empty className="border-border border-dashed bg-card/40">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText className="size-5" />
              </EmptyMedia>
              <EmptyTitle>Aucun import recent</EmptyTitle>
              <EmptyDescription>Importez un fichier pour demarrer le calcul des eco-contributions.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700">
                <a href="#upload-zone">Importer un CSV</a>
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y rounded-xl border border-border bg-card">
      {imports.slice(0, 5).map((session) => {
        const status = statusStyles[session.status] ?? statusStyles.COMPLETED;
        return (
          <div key={session.id} className="flex items-center justify-between p-4 transition-colors hover:bg-muted/40">
            <div className="flex items-center gap-4">
              <div className="grid size-10 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                <FileText className="size-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">{session.fileName}</p>
                <p className="text-muted-foreground text-xs">
                  {formatRelativeTime(session.importedAt)} • {session.rowCount.toLocaleString("fr-FR")} lignes
                </p>
              </div>
            </div>
            <div className={`rounded-full px-3 py-1 font-medium text-xs ${status.className}`}>{status.label}</div>
          </div>
        );
      })}
    </div>
  );
}
