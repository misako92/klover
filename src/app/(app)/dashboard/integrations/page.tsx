"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import { ArrowRightLeft, CheckCircle2, Link2, Link2Off, Loader2, RefreshCw, ShoppingBag, Store } from "lucide-react";
import { toast } from "sonner";

import { disconnectIntegration, getIntegrations, saveIntegration, syncIntegration } from "@/app/actions/integrations";
import { FeatureGate } from "@/components/subscription/feature-gate";
import { useSubscription } from "@/components/subscription/subscription-provider";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface IntegrationData {
  id: string;
  platform: string;
  shopUrl: string;
  isActive: boolean;
  lastSyncAt: Date | null;
  productCount: number;
  orderCount: number;
}

const PLATFORMS = [
  {
    id: "shopify" as const,
    name: "Shopify",
    icon: ShoppingBag,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    description: "Importez vos produits et commandes depuis votre boutique Shopify.",
    fields: [
      { name: "shopUrl", label: "URL de la boutique", placeholder: "ma-boutique.myshopify.com", type: "text" },
      { name: "accessToken", label: "Access Token (Private App)", placeholder: "shpat_...", type: "password" },
    ],
    helpText: "Creez une Custom App dans Shopify Admin > Settings > Apps > Develop Apps.",
  },
  {
    id: "woocommerce" as const,
    name: "WooCommerce",
    icon: Store,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    description: "Importez vos produits et commandes depuis votre site WooCommerce.",
    fields: [
      { name: "shopUrl", label: "URL du site", placeholder: "https://mon-site.com", type: "text" },
      { name: "apiKey", label: "Consumer Key", placeholder: "ck_...", type: "password" },
      { name: "apiSecret", label: "Consumer Secret", placeholder: "cs_...", type: "password" },
    ],
    helpText: "WordPress Admin > WooCommerce > Settings > Advanced > REST API.",
  },
];

export default function IntegrationsPage() {
  const plan = useSubscription();
  const hasIntegrations = plan.features.integrations;
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [integrations, setIntegrations] = useState<IntegrationData[]>([]);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);

  const loadIntegrations = useCallback(async () => {
    try {
      const data = await getIntegrations();
      setIntegrations(data as IntegrationData[]);
    } catch {
      // No integrations configured yet.
    }
  }, []);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  const handleConnect = (platformId: string) => {
    startTransition(async () => {
      try {
        const platform = PLATFORMS.find((item) => item.id === platformId);
        if (!platform) {
          return;
        }

        const credentials: Record<string, string> = { platform: platformId };
        for (const field of platform.fields) {
          credentials[field.name] = formData[`${platformId}-${field.name}`] || "";
        }

        const result = await saveIntegration(credentials as Parameters<typeof saveIntegration>[0]);
        toast.success(`Connexion reussie a ${result.shopName || platform.name}.`);
        setExpandedPlatform(null);
        setFormData({});
        loadIntegrations();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erreur de connexion");
      }
    });
  };

  const handleSync = async (platformId: string) => {
    setSyncingPlatform(platformId);
    try {
      const results = await syncIntegration(platformId, "all");
      const syncedProducts = results.products?.syncedCount || 0;
      const createdProducts = results.products?.createdCount || 0;
      const updatedProducts = results.products?.updatedCount || 0;
      const importedOrders = results.orders?.syncedCount || 0;

      toast.success(
        `Synchronisation terminee : ${syncedProducts} produits (${createdProducts} nouveaux, ${updatedProducts} mis a jour), ${importedOrders} commandes importees.`,
      );
      loadIntegrations();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur de synchronisation");
    } finally {
      setSyncingPlatform(null);
    }
  };

  const handleDisconnect = async (platformId: string) => {
    try {
      await disconnectIntegration(platformId);
      toast.success("Integration deconnectee.");
      loadIntegrations();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  return (
    <div className="stagger-1 container mx-auto max-w-5xl animate-enter space-y-8 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl text-foreground tracking-tight">Connecteurs e-commerce</h1>
        <p className="text-muted-foreground">
          Connectez vos plateformes de vente pour importer produits et commandes, sans melanger ces flux avec les
          portails eco-organismes.
        </p>
      </div>

      {!hasIntegrations && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-amber-200 bg-amber-50/60 p-8 text-center">
          <ArrowRightLeft className="size-10 text-amber-500" />
          <div>
            <h2 className="font-semibold text-lg">Fonctionnalite reservee au plan Growth</h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Les connecteurs e-commerce (Shopify, WooCommerce) sont disponibles a partir du plan Growth.
            </p>
          </div>
          <Button
            onClick={() => setUpgradeOpen(true)}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Voir les plans
          </Button>
          <UpgradeModal
            open={upgradeOpen}
            onOpenChange={setUpgradeOpen}
            currentPlan={plan}
            reason="Les connecteurs e-commerce ne sont pas disponibles sur votre plan actuel."
          />
        </div>
      )}

      <div className={cn("grid gap-6 md:grid-cols-2", !hasIntegrations && "pointer-events-none opacity-50")}>
        {PLATFORMS.map((platform) => {
          const integration = integrations.find((item) => item.platform === platform.id);
          const isConnected = integration?.isActive;
          const isExpanded = expandedPlatform === platform.id;
          const isSyncing = syncingPlatform === platform.id;

          return (
            <Card key={platform.id} className={cn("glass-card transition-all", isConnected && platform.borderColor)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("rounded-xl p-2.5", platform.bgColor)}>
                      <platform.icon className={cn("size-6", platform.color)} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{platform.name}</CardTitle>
                      {isConnected ? (
                        <Badge
                          variant="outline"
                          className="mt-1 border-emerald-200 bg-emerald-50 text-emerald-700 text-xs"
                        >
                          <CheckCircle2 className="mr-1 size-3" /> Connecte
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  {isConnected ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-red-600"
                      onClick={() => handleDisconnect(platform.id)}
                    >
                      <Link2Off className="size-4" />
                    </Button>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">{platform.description}</p>

                {isConnected && integration ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-muted/50 p-3 text-center">
                        <p className="font-bold text-foreground text-lg">{integration.productCount}</p>
                        <p className="text-muted-foreground text-xs">Produits sync.</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3 text-center">
                        <p className="font-bold text-foreground text-lg">{integration.orderCount}</p>
                        <p className="text-muted-foreground text-xs">Cmdes importees</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3 text-center">
                        <p className="font-medium text-foreground text-xs">
                          {integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleDateString("fr-FR") : "-"}
                        </p>
                        <p className="text-muted-foreground text-xs">Dernier sync</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Les compteurs affichent le dernier passage de synchronisation.
                    </p>
                  </div>
                ) : null}

                {isExpanded && !isConnected ? (
                  <div className="animate-enter space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
                    {platform.fields.map((field) => (
                      <div key={field.name}>
                        <label htmlFor={`${platform.id}-${field.name}`} className="mb-1.5 block font-medium text-sm">
                          {field.label}
                        </label>
                        <Input
                          id={`${platform.id}-${field.name}`}
                          type={field.type}
                          placeholder={field.placeholder}
                          value={formData[`${platform.id}-${field.name}`] || ""}
                          onChange={(event) =>
                            setFormData((prev) => ({
                              ...prev,
                              [`${platform.id}-${field.name}`]: event.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}
                    <p className="text-muted-foreground text-xs">Astuce: {platform.helpText}</p>
                  </div>
                ) : null}
              </CardContent>

              <CardFooter className="gap-2">
                {isConnected ? (
                  <Button
                    onClick={() => handleSync(platform.id)}
                    disabled={isSyncing}
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Synchronisation...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 size-4" />
                        Synchroniser
                      </>
                    )}
                  </Button>
                ) : isExpanded ? (
                  <>
                    <Button variant="outline" className="flex-1" onClick={() => setExpandedPlatform(null)}>
                      Annuler
                    </Button>
                    <Button
                      className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={() => handleConnect(platform.id)}
                      disabled={isPending}
                    >
                      {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Link2 className="mr-2 size-4" />}
                      Connecter
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => setExpandedPlatform(platform.id)}>
                    <ArrowRightLeft className="mr-2 size-4" />
                    Configurer
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
