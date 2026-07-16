"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { CheckCircle2, KeyRound, Link2Off, Loader2, Settings2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { disconnectEcoOrganism, getEcoOrganismConfigs, saveEcoOrganismConfig } from "@/app/actions/eco-organisms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type OrganismCode = "CITEO" | "LEKO" | "ECOMAISON" | "VALDELIA" | "OTHER";
type OrganismStatus = "CONNECTED" | "DISCONNECTED" | "ERROR";
type MembershipRole = "OWNER" | "ADMIN" | "MEMBER";

interface EcoOrganismConfigItem {
  organism: OrganismCode;
  portalLogin: string;
  status: OrganismStatus;
  lastSyncAt: string | null;
  updatedAt: string | null;
  hasApiKey: boolean;
  hasApiSecret: boolean;
}

interface EcoOrganismResponse {
  role: MembershipRole;
  items: EcoOrganismConfigItem[];
}

const ORGANISM_CARDS: Record<
  OrganismCode,
  {
    title: string;
    description: string;
    accent: string;
    loginLabel: string;
  }
> = {
  CITEO: {
    title: "CITEO",
    description: "Centralisez ici vos acces portail et references internes pour les depots emballages et papiers.",
    accent: "border-emerald-200 bg-emerald-50 text-emerald-700",
    loginLabel: "Compte portail",
  },
  LEKO: {
    title: "Leko",
    description: "Gardez les identifiants utilises pour vos depots ou controles Leko dans le meme espace.",
    accent: "border-blue-200 bg-blue-50 text-blue-700",
    loginLabel: "Compte portail",
  },
  ECOMAISON: {
    title: "Ecomaison",
    description: "Rassemblez ici vos acces de filiere ameublement, bricolage ou deco quand ils sont fournis.",
    accent: "border-amber-200 bg-amber-50 text-amber-700",
    loginLabel: "Compte portail",
  },
  VALDELIA: {
    title: "Valdelia",
    description: "Utilisez cette fiche pour documenter vos acces et rotations de secrets lies a Valdelia.",
    accent: "border-violet-200 bg-violet-50 text-violet-700",
    loginLabel: "Compte portail",
  },
  OTHER: {
    title: "Autre organisme",
    description: "Gardez une configuration generique pour un organisme non couvert par les cartes dediees.",
    accent: "border-slate-200 bg-slate-50 text-slate-700",
    loginLabel: "Reference de portail",
  },
};

function formatDateLabel(value: string | null) {
  if (!value) {
    return "Jamais mise a jour";
  }

  return new Date(value).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StatusBadge({ status }: { status: OrganismStatus }) {
  if (status === "CONNECTED") {
    return <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Configure</Badge>;
  }

  if (status === "ERROR") {
    return (
      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
        Attention
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-muted-foreground">
      Non configure
    </Badge>
  );
}

export default function EcoOrganismesPage() {
  const [data, setData] = useState<EcoOrganismResponse | null>(null);
  const [expandedOrganism, setExpandedOrganism] = useState<OrganismCode | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [disconnectingOrganism, setDisconnectingOrganism] = useState<OrganismCode | null>(null);

  const canManage = data?.role === "OWNER" || data?.role === "ADMIN";

  const loadConfigs = useCallback(async () => {
    const response = (await getEcoOrganismConfigs()) as EcoOrganismResponse;
    setData(response);
  }, []);

  useEffect(() => {
    void loadConfigs();
  }, [loadConfigs]);

  const configs = data?.items ?? [];

  const activeCount = useMemo(() => configs.filter((item) => item.status === "CONNECTED").length, [configs]);

  const openEditor = (item: EcoOrganismConfigItem) => {
    setExpandedOrganism(item.organism);
    setFormData({
      [`${item.organism}-portalLogin`]: item.portalLogin,
      [`${item.organism}-apiKey`]: "",
      [`${item.organism}-apiSecret`]: "",
    });
  };

  const handleSave = (organism: OrganismCode) => {
    startTransition(async () => {
      try {
        await saveEcoOrganismConfig({
          organism,
          portalLogin: formData[`${organism}-portalLogin`] || "",
          apiKey: formData[`${organism}-apiKey`] || "",
          apiSecret: formData[`${organism}-apiSecret`] || "",
        });

        toast.success("Configuration enregistree.");
        setExpandedOrganism(null);
        setFormData({});
        await loadConfigs();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erreur de sauvegarde.");
      }
    });
  };

  const handleDisconnect = async (organism: OrganismCode) => {
    setDisconnectingOrganism(organism);
    try {
      await disconnectEcoOrganism(organism);
      toast.success("Configuration supprimee.");
      if (expandedOrganism === organism) {
        setExpandedOrganism(null);
      }
      await loadConfigs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur de suppression.");
    } finally {
      setDisconnectingOrganism(null);
    }
  };

  return (
    <div className="stagger-1 container mx-auto max-w-5xl animate-enter space-y-8 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl text-foreground tracking-tight">Portails eco-organismes</h1>
        <p className="text-muted-foreground">
          Centralisez les acces portail et les references sensibles par organisme, separes des connecteurs e-commerce et
          sans faux statuts techniques.
        </p>
      </div>

      <Card className="glass-card border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-emerald-600" />
            Etat de la configuration
          </CardTitle>
          <CardDescription>
            Cette page stocke vos identifiants et references internes en base. Aucun depot externe n'est automatise ici
            pour le moment.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
            <div className="font-semibold text-2xl text-emerald-700">{activeCount}</div>
            <p className="text-muted-foreground text-sm">
              organisme{activeCount > 1 ? "s" : ""} configure{activeCount > 1 ? "s" : ""}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background/70 p-4">
            <div className="font-semibold text-2xl text-foreground">{configs.length}</div>
            <p className="text-muted-foreground text-sm">fiches disponibles dans l'espace de travail</p>
          </div>
          <div className="rounded-xl border border-border bg-background/70 p-4">
            <div className="font-semibold text-2xl text-foreground">{canManage ? "Edition" : "Lecture"}</div>
            <p className="text-muted-foreground text-sm">
              {canManage
                ? "Votre role permet de modifier les acces."
                : "Votre role ne permet pas de modifier ces donnees."}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="stagger-2 grid animate-enter gap-6 md:grid-cols-2">
        {configs.map((item) => {
          const meta = ORGANISM_CARDS[item.organism];
          const isExpanded = expandedOrganism === item.organism;
          const isConnected = item.status === "CONNECTED";
          const isDisconnecting = disconnectingOrganism === item.organism;

          return (
            <Card
              key={item.organism}
              className="glass-card flex flex-col transition-colors hover:border-emerald-500/20"
            >
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex size-11 items-center justify-center rounded-xl border font-semibold",
                        meta.accent,
                      )}
                    >
                      {meta.title[0]}
                    </div>
                    <div>
                      <CardTitle>{meta.title}</CardTitle>
                      <p className="mt-1 text-muted-foreground text-xs">{formatDateLabel(item.updatedAt)}</p>
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <CardDescription>{meta.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border bg-muted/20 p-3">
                    <div className="text-muted-foreground text-xs uppercase tracking-wide">Portail</div>
                    <div className="mt-2 font-medium text-sm">{item.portalLogin || "Non renseigne"}</div>
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-3">
                    <div className="text-muted-foreground text-xs uppercase tracking-wide">Cle API</div>
                    <div className="mt-2 font-medium text-sm">{item.hasApiKey ? "Presente" : "Absente"}</div>
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-3">
                    <div className="text-muted-foreground text-xs uppercase tracking-wide">Secret API</div>
                    <div className="mt-2 font-medium text-sm">{item.hasApiSecret ? "Present" : "Absent"}</div>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/10 p-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${item.organism}-portalLogin`}>{meta.loginLabel}</Label>
                      <Input
                        id={`${item.organism}-portalLogin`}
                        value={formData[`${item.organism}-portalLogin`] || ""}
                        placeholder="contact@marque.fr"
                        onChange={(event) =>
                          setFormData((previous) => ({
                            ...previous,
                            [`${item.organism}-portalLogin`]: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`${item.organism}-apiKey`}>Cle API</Label>
                        <Input
                          id={`${item.organism}-apiKey`}
                          type="password"
                          placeholder={
                            item.hasApiKey ? "Laisser vide pour conserver l'existante" : "Renseigner une cle API"
                          }
                          value={formData[`${item.organism}-apiKey`] || ""}
                          onChange={(event) =>
                            setFormData((previous) => ({
                              ...previous,
                              [`${item.organism}-apiKey`]: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${item.organism}-apiSecret`}>Secret API</Label>
                        <Input
                          id={`${item.organism}-apiSecret`}
                          type="password"
                          placeholder={
                            item.hasApiSecret ? "Laisser vide pour conserver l'existant" : "Renseigner un secret API"
                          }
                          value={formData[`${item.organism}-apiSecret`] || ""}
                          onChange={(event) =>
                            setFormData((previous) => ({
                              ...previous,
                              [`${item.organism}-apiSecret`]: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <p className="text-muted-foreground text-xs">
                      Les secrets sont stockes de facon chiffree quand une cle Klover est configuree. Cette page ne
                      teste pas de connexion partenaire.
                    </p>
                  </div>
                ) : null}
              </CardContent>

              <CardFooter className="flex flex-wrap gap-2 border-border/40 border-t bg-muted/10 pt-4">
                {canManage ? (
                  isExpanded ? (
                    <>
                      <Button variant="outline" onClick={() => setExpandedOrganism(null)}>
                        Annuler
                      </Button>
                      <Button
                        onClick={() => handleSave(item.organism)}
                        disabled={isPending}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        {isPending ? (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                          <Settings2 className="mr-2 size-4" />
                        )}
                        Enregistrer
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => openEditor(item)}>
                        <KeyRound className="mr-2 size-4" />
                        {isConnected ? "Modifier" : "Configurer"}
                      </Button>
                      {isConnected ? (
                        <Button
                          variant="ghost"
                          className="text-muted-foreground hover:text-red-600"
                          onClick={() => handleDisconnect(item.organism)}
                          disabled={isDisconnecting}
                        >
                          {isDisconnecting ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          ) : (
                            <Link2Off className="mr-2 size-4" />
                          )}
                          Supprimer
                        </Button>
                      ) : null}
                    </>
                  )
                ) : (
                  <Button variant="outline" disabled>
                    Lecture seule
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Card className="stagger-3 animate-enter border-border border-dashed bg-muted/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-600" />
            Ce que cette page fait vraiment
          </CardTitle>
          <CardDescription>Pas de faux statuts ni de synchronisation inventee.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground text-sm">
          <p>Les fiches ci-dessus centralisent vos acces portail et vos references internes par organisme.</p>
          <p>Les depots automatiques, webhooks ou appels API partenaires ne sont pas encore exposes ici.</p>
          <p>
            Si un connecteur reel est ajoute plus tard, cette base pourra etre rebranchee sans changer l'UX de fond.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
