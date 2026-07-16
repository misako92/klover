"use client";

import * as React from "react";

import { useSearchParams } from "next/navigation";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Filter,
  MoreHorizontal,
  Recycle,
  Save,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { UpgradeFallback } from "@/components/subscription/feature-gate";
import { useFeature } from "@/components/subscription/subscription-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useComplianceData } from "@/features/compliance/context/compliance-data-context";
import { MATERIAL_LABELS, ORGANISM_LABELS } from "@/features/compliance/data/constants";
import type { EcoOrganism, MaterialType, PackagingType, ProductRecord } from "@/features/compliance/data/types";
import { cn } from "@/lib/utils";

const MATERIAL_OPTIONS: MaterialType[] = [
  "PLASTIC_PET",
  "PLASTIC",
  "CARDBOARD",
  "GLASS",
  "ALUMINUM",
  "STEEL",
  "WOOD",
  "TEXTILE",
  "COMPOSITE",
  "UNKNOWN",
];

const ORGANISM_OPTIONS: EcoOrganism[] = ["CITEO", "LEKO", "ECOMAISON", "VALDELIA", "OTHER"];

const PACKAGING_BADGE: Record<PackagingType, { label: string; className: string }> = {
  PRIMARY: {
    label: "Primaire",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  SECONDARY: {
    label: "Secondaire",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  TERTIARY: {
    label: "Tertiaire",
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
};

type GroupedProductRow = ProductRecord & {
  kind: "group";
  members: ProductRecord[];
  groupSize: number;
  reviewCount: number;
  classifiedCount: number;
};

type ProductTableRow = ProductRecord | GroupedProductRow;

function isGroupedProductRow(row: ProductTableRow): row is GroupedProductRow {
  return "kind" in row && row.kind === "group";
}

function normalizeProductName(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getSimilarGroupKey(product: ProductRecord) {
  return [normalizeProductName(product.name), product.packagingType ?? "PRIMARY"].join("::");
}

function getProductCompletenessScore(product: ProductRecord) {
  let score = 0;

  if (product.materialType) score += 3;
  if (product.ecoOrganism) score += 3;
  if (product.weightG && product.weightG > 0) score += 3;
  if (product.classificationSource === "AI_SUGGESTION") score += 1;
  if (product.confidence) score += product.confidence;
  if (product.quantitySold > 0) score += 0.25;

  return score;
}

function pickBestReferenceProduct(products: ProductRecord[]) {
  return [...products].sort((a, b) => {
    const completenessDiff = getProductCompletenessScore(b) - getProductCompletenessScore(a);
    if (completenessDiff !== 0) {
      return completenessDiff;
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  })[0];
}

function getRowMembers(row: ProductTableRow) {
  return isGroupedProductRow(row) ? row.members : [row];
}

function formatClassificationPreview(product: ProductRecord) {
  const parts: string[] = [];

  if (product.materialType) {
    parts.push(MATERIAL_LABELS[product.materialType]);
  }
  if (product.weightG && product.weightG > 0) {
    parts.push(`${product.weightG} g`);
  }
  if (product.ecoOrganism) {
    parts.push(ORGANISM_LABELS[product.ecoOrganism]);
  }

  return parts.length > 0 ? parts.join(" - ") : "Aucune classification exploitable";
}

function getReviewBlockers(row: ProductTableRow) {
  const members = getRowMembers(row).filter((member) => member.status === "TO_REVIEW");
  const blockers: string[] = [];

  const missingMaterial = members.filter((member) => !member.materialType).length;
  const missingWeight = members.filter((member) => !member.weightG || member.weightG <= 0).length;
  const missingOrganism = members.filter((member) => !member.ecoOrganism).length;

  if (missingMaterial > 0) {
    blockers.push(`${missingMaterial} sans matiere`);
  }
  if (missingWeight > 0) {
    blockers.push(`${missingWeight} sans poids`);
  }
  if (missingOrganism > 0) {
    blockers.push(`${missingOrganism} sans organisme`);
  }

  if (blockers.length === 0 && row.reviewReason) {
    blockers.push(row.reviewReason);
  }

  return blockers;
}

function buildGroupedProductRows(products: ProductRecord[]): ProductTableRow[] {
  const groups = new Map<string, ProductRecord[]>();
  const orderedKeys: string[] = [];

  for (const product of products) {
    const key = getSimilarGroupKey(product);
    if (!groups.has(key)) {
      groups.set(key, []);
      orderedKeys.push(key);
    }
    groups.get(key)?.push(product);
  }

  return orderedKeys.map((key) => {
    const members = groups.get(key)!;
    if (members.length === 1) {
      return members[0];
    }

    const representative = pickBestReferenceProduct(members);

    const reviewCount = members.filter((member) => member.status === "TO_REVIEW").length;

    return {
      ...representative,
      id: `group:${key}`,
      kind: "group",
      members,
      groupSize: members.length,
      reviewCount,
      classifiedCount: members.length - reviewCount,
      quantitySold: members.reduce((sum, member) => sum + member.quantitySold, 0),
      status: reviewCount > 0 ? "TO_REVIEW" : "CLASSIFIED",
      updatedAt: members.reduce(
        (latest, member) => (latest > member.updatedAt ? latest : member.updatedAt),
        representative.updatedAt,
      ),
      reviewReason:
        representative.reviewReason ??
        (reviewCount > 0 ? `${reviewCount} SKU similaires restent a completer dans ce groupe.` : null),
    };
  });
}

function statusBadge(product: ProductTableRow) {
  const isAISuggestion = product.classificationSource === "AI_SUGGESTION";
  const confidence = product.confidence ? Math.round(product.confidence * 100) : 0;
  const isGrouped = isGroupedProductRow(product);

  let label = product.status === "CLASSIFIED" ? "Classifie" : isAISuggestion ? "En attente" : "A verifier";

  if (isAISuggestion && product.status !== "CLASSIFIED") {
    label += ` (${confidence}%)`;
  }

  if (isGrouped) {
    label +=
      product.status === "CLASSIFIED"
        ? ` - ${product.groupSize} SKU`
        : ` (${product.reviewCount}/${product.groupSize})`;
  }

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 py-1 pr-2.5 pl-1.5 shadow-sm",
        product.status === "CLASSIFIED"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : isAISuggestion
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : "border-amber-200 bg-amber-50 text-amber-700",
      )}
    >
      <span className="font-medium">{label}</span>
    </Badge>
  );

  if (product.reviewReason && product.status !== "CLASSIFIED") {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-block cursor-help">{badge}</div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[260px] text-xs">
            <p>{product.reviewReason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

export default function ProductsPage() {
  const {
    db,
    products,
    compliance,
    bulkMarkClassified,
    generateAISuggestions,
    updateProductClassification,
    deleteProduct,
    bulkDeleteProducts,
  } = useComplianceData();
  const canUseAdvancedRules = Boolean(useFeature("advancedAnalytics"));
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");
  const initialTab = urlTab === "review" ? "review" : "all";

  const [tab, setTab] = React.useState<"all" | "review" | "rules">(initialTab);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [groupSimilarRows, setGroupSimilarRows] = React.useState(true);
  const [editingTargets, setEditingTargets] = React.useState<ProductRecord[]>([]);
  const editing = editingTargets[0] ?? null;
  const [saving, setSaving] = React.useState(false);
  const [editMaterial, setEditMaterial] = React.useState<MaterialType>("CARDBOARD");
  const [editOrganism, setEditOrganism] = React.useState<EcoOrganism>("CITEO");
  const [editWeight, setEditWeight] = React.useState("120");
  const [editPackagingType, setEditPackagingType] = React.useState<PackagingType>("PRIMARY");
  const [editIsReusable, setEditIsReusable] = React.useState(false);
  const [editReuseCount, setEditReuseCount] = React.useState(1);

  const pageSize = 25;

  React.useEffect(() => {
    setPage(1);
    setSelected({});
  }, []);

  const filteredProducts = React.useMemo(() => {
    return products
      .filter((product) => {
        if (tab === "review" && product.status !== "TO_REVIEW") {
          return false;
        }

        if (!search.trim()) {
          return true;
        }

        const query = search.toLowerCase();
        return product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query);
      })
      .sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === "TO_REVIEW" ? -1 : 1;
        }
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [products, search, tab]);

  const similarProductsByKey = React.useMemo(() => {
    const map = new Map<string, ProductRecord[]>();
    for (const product of products) {
      const key = getSimilarGroupKey(product);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(product);
    }
    return map;
  }, [products]);

  const displayRows = React.useMemo<ProductTableRow[]>(() => {
    if (!groupSimilarRows) {
      return filteredProducts;
    }
    return buildGroupedProductRows(filteredProducts);
  }, [filteredProducts, groupSimilarRows]);

  const totalPages = Math.max(1, Math.ceil(displayRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = displayRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const selectedIds = Object.keys(selected).filter((id) => selected[id]);
  const latestUpdateLabel = React.useMemo(() => {
    const latest = products.reduce<string | null>((acc, product) => {
      if (!acc) return product.updatedAt;
      return acc > product.updatedAt ? acc : product.updatedAt;
    }, db.updatedAt ?? null);

    if (!latest) {
      return "n/a";
    }

    return new Date(latest).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
  }, [db.updatedAt, products]);

  const seedEditForm = React.useCallback((product: ProductRecord) => {
    setEditMaterial(product.materialType ?? "CARDBOARD");
    setEditOrganism(product.ecoOrganism ?? "CITEO");
    setEditWeight(String(product.weightG ?? 120));
    setEditPackagingType(product.packagingType ?? "PRIMARY");
    setEditIsReusable(product.isReusable ?? false);
    setEditReuseCount(product.reuseCount ?? 1);
  }, []);

  const getReferenceProduct = React.useCallback(
    (row: ProductTableRow) => {
      const anchorProduct = isGroupedProductRow(row) ? row.members[0] : row;
      const candidates = similarProductsByKey.get(getSimilarGroupKey(anchorProduct)) ?? [anchorProduct];
      return pickBestReferenceProduct(candidates);
    },
    [similarProductsByKey],
  );

  const openEdit = React.useCallback(
    (row: ProductTableRow) => {
      const targets = isGroupedProductRow(row) ? row.members : [row];
      const referenceProduct = getReferenceProduct(row);
      setEditingTargets(targets);
      seedEditForm(referenceProduct);
    },
    [getReferenceProduct, seedEditForm],
  );

  const openEditSimilar = React.useCallback(
    (product: ProductRecord) => {
      const targets = similarProductsByKey.get(getSimilarGroupKey(product)) ?? [product];
      setEditingTargets(targets);
      seedEditForm(product);
    },
    [seedEditForm, similarProductsByKey],
  );

  const getSimilarCount = React.useCallback(
    (product: ProductRecord) => {
      return similarProductsByKey.get(getSimilarGroupKey(product))?.length ?? 1;
    },
    [similarProductsByKey],
  );

  const closeEditing = React.useCallback(() => {
    setEditingTargets([]);
  }, []);

  const handleSave = async () => {
    if (!editing) {
      return;
    }

    const weight = Number(editWeight);
    if (!Number.isFinite(weight) || weight <= 0) {
      toast.error("Poids invalide");
      return;
    }

    setSaving(true);
    try {
      for (const product of editingTargets) {
        await updateProductClassification({
          productId: product.id,
          materialType: editMaterial,
          ecoOrganism: editOrganism,
          weightG: weight,
          confidence: 0.95,
          packagingType: editPackagingType,
          isReusable: editIsReusable,
          reuseCount: editIsReusable ? editReuseCount : 0,
        });
      }

      toast.success(
        editingTargets.length > 1
          ? `Classification appliquee a ${editingTargets.length} produits similaires`
          : "Produit classe",
      );
      closeEditing();
    } finally {
      setSaving(false);
    }
  };

  const runBulkConfirm = async () => {
    if (selectedIds.length === 0) {
      toast.info("Aucun produit selectionne");
      return;
    }
    const updated = await bulkMarkClassified(selectedIds);
    toast.success(`${updated} produits classes`);
    setSelected({});
  };

  const runBulkAI = async () => {
    if (selectedIds.length === 0) {
      toast.info("Aucun produit selectionne");
      return;
    }
    const count = await generateAISuggestions(selectedIds);
    toast.success(`${count} suggestions generees`);
    setSelected({});
  };

  const sharedTableProps = {
    search,
    setSearch,
    rows: paginatedRows,
    selected,
    setSelected,
    onEdit: openEdit,
    onApplyToSimilar: openEditSimilar,
    getSimilarCount,
    getReferenceProduct,
    groupSimilarRows,
    onGroupSimilarRowsChange: setGroupSimilarRows,
    page: safePage,
    totalPages,
    onPageChange: setPage,
    onBulkClassify: runBulkConfirm,
    onBulkAI: runBulkAI,
    onDelete: async (product: ProductRecord) => {
      if (confirm("Supprimer ce produit ?")) {
        await deleteProduct(product.id);
        toast.success("Produit supprime");
      }
    },
    onBulkDelete: async () => {
      if (confirm(`Supprimer ${selectedIds.length} produits ?`)) {
        await bulkDeleteProducts(selectedIds);
        toast.success("Produits supprimes");
        setSelected({});
      }
    },
  };

  return (
    <div className="stagger-1 w-full flex-1 animate-enter space-y-8 px-4 py-8 md:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-baseline gap-2 font-bold text-4xl text-slate-800 tracking-tight">
            Catalogue{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-emerald-600 text-transparent">
              Produits
            </span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Gere la classification et les donnees techniques de tes references sans retraiter dix fois les memes
            emballages.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-white/50 px-3 py-1.5 text-muted-foreground text-xs shadow-sm backdrop-blur-sm md:flex">
            <Clock3 className="size-3.5" />
            <span suppressHydrationWarning>Mis a jour : {latestUpdateLabel}</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/50 px-3 py-1.5 text-amber-800 text-xs shadow-sm backdrop-blur-sm">
            <AlertTriangle className="size-3.5" />
            <span className="font-medium" suppressHydrationWarning>
              {compliance.needsReviewCount} a verifier
            </span>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as "all" | "review" | "rules")} className="space-y-6">
        <TabsList className="relative z-10 inline-flex w-full rounded-xl border border-white/60 bg-white/70 p-1 shadow-sm backdrop-blur-xl sm:w-auto">
          <TabsTrigger value="all" className="rounded-lg px-4">
            Tous ({products.length})
          </TabsTrigger>
          <TabsTrigger value="review" className="gap-2 rounded-lg px-4">
            A verifier
            <Badge
              variant="secondary"
              className="ml-1 h-5 bg-amber-100 px-1.5 text-[10px] text-amber-700 hover:bg-amber-100"
            >
              {compliance.needsReviewCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="rules" className="rounded-lg px-4" disabled={!canUseAdvancedRules}>
            Regles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="stagger-2 animate-enter space-y-4">
          <ProductTableCard {...sharedTableProps} />
        </TabsContent>

        <TabsContent value="review" className="stagger-2 animate-enter space-y-4">
          <ReviewQueueCard {...sharedTableProps} />
        </TabsContent>

        <TabsContent value="rules" className="stagger-2 animate-enter space-y-4">
          {canUseAdvancedRules ? (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Regles de classification</CardTitle>
                <CardDescription>Regles systeme actives pour assister la classification du catalogue.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground text-sm">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 rounded-xl border border-border/50 bg-white/40 p-4">
                    <h3 className="flex items-center gap-2 font-medium text-foreground">
                      <SlidersHorizontal className="size-4" /> Regles actives
                    </h3>
                    <ul className="space-y-2 pl-1">
                      <RuleItem pattern="bouteille|pet|flacon" type="Plastique PET" confidence={93} />
                      <RuleItem pattern="carton|boite|etui" type="Carton / Papier" confidence={90} />
                      <RuleItem pattern="verre|bocal" type="Verre" confidence={91} />
                    </ul>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 border-dashed bg-muted/20 p-4 text-center">
                    <p className="mb-1 font-medium text-foreground">Edition non exposee</p>
                    <p className="max-w-[220px] text-xs">
                      Les regles affichees sont actives, mais leur edition reste reservee a un futur lot produit.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <UpgradeFallback message="L'onglet regles avancees est disponible a partir du plan Growth." />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && closeEditing()}>
        <DialogContent className="overflow-hidden border-white/60 bg-white/70 p-6 shadow-2xl backdrop-blur-3xl sm:max-w-[425px]">
          <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-emerald-100/40 via-white/50 to-white/20" />
          <div className="relative z-10 flex flex-col space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingTargets.length > 1 ? "Classer des produits similaires" : "Editer classification"}
              </DialogTitle>
              <DialogDescription>
                {editing?.name}
                {editingTargets.length > 1 ? ` - ${editingTargets.length} SKU similaires` : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Matiere principale</Label>
                <Select value={editMaterial} onValueChange={(value) => setEditMaterial(value as MaterialType)}>
                  <SelectTrigger className="bg-white/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_OPTIONS.map((material) => (
                      <SelectItem key={material} value={material}>
                        {MATERIAL_LABELS[material]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Poids unitaire (g)</Label>
                <Input
                  type="number"
                  value={editWeight}
                  onChange={(event) => setEditWeight(event.target.value)}
                  className="bg-white/50"
                />
              </div>

              <div className="grid gap-2">
                <Label>Eco-organisme</Label>
                <Select value={editOrganism} onValueChange={(value) => setEditOrganism(value as EcoOrganism)}>
                  <SelectTrigger className="bg-white/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORGANISM_OPTIONS.map((organism) => (
                      <SelectItem key={organism} value={organism}>
                        {ORGANISM_LABELS[organism]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="packagingType">Type d'emballage</Label>
                <Select
                  value={editPackagingType}
                  onValueChange={(value) => setEditPackagingType(value as PackagingType)}
                >
                  <SelectTrigger id="packagingType" className="bg-white/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIMARY">Primaire</SelectItem>
                    <SelectItem value="SECONDARY">Secondaire</SelectItem>
                    <SelectItem value="TERTIARY">Tertiaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between py-1">
                <Label htmlFor="isReusable">Emballage reemployable</Label>
                <Switch id="isReusable" checked={editIsReusable} onCheckedChange={setEditIsReusable} />
              </div>

              {editIsReusable && (
                <div className="space-y-2">
                  <Label htmlFor="reuseCount">Nombre de reutilisations</Label>
                  <Input
                    id="reuseCount"
                    type="number"
                    min={1}
                    max={100}
                    value={editReuseCount}
                    onChange={(event) => setEditReuseCount(Math.max(1, parseInt(event.target.value, 10) || 1))}
                    className="bg-white/50"
                  />
                  <p className="text-muted-foreground text-xs">
                    Nombre de fois ou cet emballage peut etre reutilise avant recyclage.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={closeEditing}>
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                className="hover:-translate-y-0.5 bg-emerald-600 text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow"
                disabled={saving}
              >
                {saving ? <span className="mr-2 animate-spin">...</span> : <Save className="mr-2 size-4" />}
                {editingTargets.length > 1 ? "Appliquer au groupe" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductTableCard(props: {
  search: string;
  setSearch: (value: string) => void;
  rows: ProductTableRow[];
  selected: Record<string, boolean>;
  setSelected: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onEdit: (row: ProductTableRow) => void;
  onApplyToSimilar: (product: ProductRecord) => void;
  getSimilarCount: (product: ProductRecord) => number;
  groupSimilarRows: boolean;
  onGroupSimilarRowsChange: (value: boolean) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onBulkClassify: () => void;
  onBulkAI: () => void;
  onDelete: (product: ProductRecord) => void;
  onBulkDelete: () => void;
  reviewMode?: boolean;
}) {
  const {
    search,
    setSearch,
    rows,
    selected,
    setSelected,
    onEdit,
    onApplyToSimilar,
    getSimilarCount,
    groupSimilarRows,
    onGroupSimilarRowsChange,
    page,
    totalPages,
    onPageChange,
    onBulkClassify,
    onBulkAI,
    onDelete,
    onBulkDelete,
    reviewMode,
  } = props;

  const currentRowIds = React.useMemo(() => {
    const ids = new Set<string>();
    for (const row of rows) {
      if (isGroupedProductRow(row)) {
        for (const member of row.members) {
          ids.add(member.id);
        }
      } else {
        ids.add(row.id);
      }
    }
    return Array.from(ids);
  }, [rows]);

  const selectedCount = Object.keys(selected).filter((id) => selected[id]).length;
  const allSelected = currentRowIds.length > 0 && currentRowIds.every((id) => selected[id]);
  const visibleSkuCount = rows.reduce((sum, row) => sum + (isGroupedProductRow(row) ? row.groupSize : 1), 0);
  const visibleGroupCount = rows.filter((row) => isGroupedProductRow(row)).length;
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({});

  const toggleRow = (row: ProductTableRow) => {
    const targetIds = isGroupedProductRow(row) ? row.members.map((member) => member.id) : [row.id];
    const shouldSelect = !targetIds.every((id) => selected[id]);

    setSelected((previous) => {
      const next = { ...previous };
      for (const id of targetIds) {
        next[id] = shouldSelect;
      }
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((previous) => {
      const next = { ...previous };
      for (const id of currentRowIds) {
        next[id] = !allSelected;
      }
      return next;
    });
  };

  const toggleGroupDetails = (groupId: string) => {
    setExpandedGroups((previous) => ({
      ...previous,
      [groupId]: !previous[groupId],
    }));
  };

  return (
    <Card className="glass-card overflow-hidden border-border/40 shadow-soft transition-all duration-300 hover:shadow-soft-lg">
      <div className="relative flex flex-col gap-4 overflow-hidden border-border/40 border-b bg-gradient-to-r from-slate-50/50 to-white/50 p-4">
        <div className="pointer-events-none absolute inset-0 bg-noise opacity-[0.02] mix-blend-multiply" />
        <div className="relative z-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher (nom, SKU...)"
              className="border-border/60 bg-white/60 pl-9 transition-all focus:bg-white"
            />
          </div>

          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            {selectedCount > 0 && (
              <div className="fade-in slide-in-from-right-4 flex animate-in items-center gap-2">
                <span className="text-muted-foreground text-xs">{selectedCount} selectionne(s)</span>

                <Button
                  onClick={onBulkDelete}
                  size="sm"
                  variant="destructive"
                  className="h-8 gap-2 shadow-sm"
                  aria-label="Supprimer la selection"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
                <Button
                  onClick={onBulkAI}
                  size="sm"
                  className="h-8 gap-2 bg-blue-500 text-white shadow-sm hover:bg-blue-600"
                >
                  <Sparkles className="size-4" />
                  Suggere avec l'IA
                </Button>
                <Button
                  onClick={onBulkClassify}
                  size="sm"
                  className="h-8 gap-2 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                >
                  <CheckCircle2 className="size-4" />
                  Valider tout
                </Button>
              </div>
            )}
            <div className="mx-1 hidden h-4 w-px bg-border/60 sm:block" />
            <Button variant="outline" size="sm" className="gap-2 bg-white/50">
              <Filter className="size-3.5" />
              Filtres
            </Button>
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-muted-foreground text-xs">
            {groupSimilarRows
              ? `${visibleSkuCount} SKU affiches sous ${rows.length} ligne(s), dont ${visibleGroupCount} groupe(s)`
              : `${rows.length} ligne(s) affichee(s)`}
          </div>
          <div className="flex items-center gap-3 rounded-full border border-border/60 bg-white/60 px-3 py-2 shadow-sm">
            <Switch
              id={`group-similar-${reviewMode ? "review" : "all"}`}
              checked={groupSimilarRows}
              onCheckedChange={onGroupSimilarRowsChange}
            />
            <Label
              htmlFor={`group-similar-${reviewMode ? "review" : "all"}`}
              className="cursor-pointer text-foreground text-xs"
            >
              Regrouper les produits similaires
            </Label>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border-white/20 border-t">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40px]">
                <input
                  type="checkbox"
                  className="translate-y-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  onChange={toggleAll}
                  checked={allSelected}
                />
              </TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Quantite</TableHead>
              <TableHead>Matiere</TableHead>
              <TableHead>Poids (g)</TableHead>
              <TableHead>Organisme</TableHead>
              <TableHead>Type emb.</TableHead>
              <TableHead className="text-center">Reemploi</TableHead>
              <TableHead>Confiance</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="h-64 text-center">
                  <EmptyState
                    icon={Search}
                    title="Aucun produit trouve"
                    description={
                      search
                        ? "Essaie de modifier tes filtres ou ta recherche."
                        : "Le catalogue ne contient aucun produit pour le moment."
                    }
                    action={
                      !search
                        ? {
                            label: "Importer des ventes",
                            onClick: () => {
                              window.location.href = "/dashboard/orders";
                            },
                          }
                        : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const grouped = isGroupedProductRow(row);
                const similarCount = grouped ? row.groupSize : getSimilarCount(row);
                const isExpanded = grouped ? Boolean(expandedGroups[row.id]) : false;

                return (
                  <React.Fragment key={row.id}>
                    <TableRow
                      className="group relative cursor-pointer transition-all duration-300 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-emerald-500 before:opacity-0 hover:bg-emerald-50/40 hover:shadow-[inset_0_1px_0_0_rgba(16,185,129,0.1),inset_0_-1px_0_0_rgba(16,185,129,0.1)] hover:before:opacity-100"
                      onClick={() => onEdit(row)}
                    >
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="translate-y-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          checked={
                            grouped ? row.members.every((member) => selected[member.id]) : Boolean(selected[row.id])
                          }
                          onChange={() => toggleRow(row)}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-foreground/90">
                        <div className="flex items-start gap-2">
                          {grouped ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="mt-[-2px] h-6 w-6 shrink-0 text-muted-foreground"
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleGroupDetails(row.id);
                              }}
                              aria-label={isExpanded ? "Replier le groupe" : "Afficher le detail du groupe"}
                            >
                              {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                            </Button>
                          ) : null}
                          <div className="flex flex-col gap-1">
                            <span>{row.name}</span>
                            {grouped ? (
                              <span className="text-muted-foreground text-xs">
                                {row.groupSize} SKU similaires - {row.reviewCount} a completer
                              </span>
                            ) : similarCount > 1 ? (
                              <span className="text-muted-foreground text-xs">
                                {similarCount} SKU partagent ce meme emballage probable
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground text-xs">
                        {grouped ? `${row.groupSize} SKU` : row.sku}
                      </TableCell>
                      <TableCell className="font-medium tabular-nums">
                        {row.quantitySold.toLocaleString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        {row.materialType ? (
                          <div className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-emerald-500/50" />
                            {MATERIAL_LABELS[row.materialType]}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">a definir</span>
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {row.weightG ?? <span className="text-muted-foreground text-xs italic">-</span>}
                      </TableCell>
                      <TableCell>
                        {row.ecoOrganism ? (
                          ORGANISM_LABELS[row.ecoOrganism]
                        ) : (
                          <span className="text-muted-foreground text-xs italic">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={PACKAGING_BADGE[row.packagingType].className}>
                          {PACKAGING_BADGE[row.packagingType].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex cursor-help items-center justify-center">
                                <Recycle
                                  aria-label={
                                    row.isReusable
                                      ? `Reemployable - ${row.reuseCount} reutilisations`
                                      : "Non reemployable"
                                  }
                                  className={`h-4 w-4 ${row.isReusable ? "text-emerald-600" : "text-muted-foreground/40"}`}
                                />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {row.isReusable
                                ? `Reemployable - ${row.reuseCount} reutilisation${(row.reuseCount ?? 0) > 1 ? "s" : ""}`
                                : "Non reemployable"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        {row.confidence !== undefined && row.confidence !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn(
                                  "h-full rounded-full bg-emerald-500",
                                  row.confidence < 0.8 ? "bg-amber-500" : "",
                                )}
                                style={{ width: `${row.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-muted-foreground text-xs">{Math.round(row.confidence * 100)}%</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">-</span>
                        )}
                      </TableCell>
                      <TableCell>{statusBadge(row)}</TableCell>
                      <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              aria-label="Actions sur cette ligne"
                            >
                              <MoreHorizontal aria-hidden="true" className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onEdit(row)}>
                              <SlidersHorizontal className="mr-2 size-4" />
                              {grouped ? "Editer le groupe" : "Editer"}
                            </DropdownMenuItem>
                            {!grouped && similarCount > 1 ? (
                              <DropdownMenuItem onClick={() => onApplyToSimilar(row)}>
                                <CheckCircle2 className="mr-2 size-4" />
                                Appliquer aux {similarCount} similaires
                              </DropdownMenuItem>
                            ) : null}
                            {!grouped ? <DropdownMenuSeparator /> : null}
                            {!grouped ? (
                              <DropdownMenuItem
                                onClick={() => onDelete(row)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 size-4" />
                                Supprimer
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    {grouped && isExpanded ? (
                      <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                        <TableCell colSpan={12} className="px-6 py-4">
                          <div className="rounded-xl border border-border/40 bg-white/60 p-4 shadow-sm backdrop-blur-sm">
                            <div className="mb-3 flex items-center justify-between">
                              <div className="font-medium text-foreground text-sm">Detail du groupe</div>
                              <div className="text-muted-foreground text-xs">
                                {row.groupSize} SKU • {row.quantitySold.toLocaleString("fr-FR")} unites
                              </div>
                            </div>
                            <div className="grid gap-2 md:grid-cols-2">
                              {row.members.map((member) => (
                                <div
                                  key={member.id}
                                  className="flex items-center justify-between rounded-lg border border-border/40 bg-white/50 px-3 py-2 text-sm transition-colors hover:border-emerald-100 hover:bg-white/80"
                                >
                                  <div className="min-w-0">
                                    <div className="truncate font-medium text-foreground">{member.sku}</div>
                                    <div className="truncate text-muted-foreground text-xs">
                                      {member.quantitySold.toLocaleString("fr-FR")} unites •{" "}
                                      {member.status === "TO_REVIEW" ? "A verifier" : "Classifie"}
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="shrink-0 text-muted-foreground text-xs hover:text-foreground"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onEdit(member);
                                    }}
                                  >
                                    Ouvrir
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-border/40 border-t bg-muted/10 p-4">
        <p className="text-muted-foreground text-sm">
          Page {page} sur {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="h-8"
          >
            Precedent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="h-8"
          >
            Suivant
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ReviewQueueCard(props: {
  search: string;
  setSearch: (value: string) => void;
  rows: ProductTableRow[];
  selected: Record<string, boolean>;
  setSelected: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onEdit: (row: ProductTableRow) => void;
  onApplyToSimilar: (product: ProductRecord) => void;
  getSimilarCount: (product: ProductRecord) => number;
  getReferenceProduct: (row: ProductTableRow) => ProductRecord;
  groupSimilarRows: boolean;
  onGroupSimilarRowsChange: (value: boolean) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onBulkClassify: () => void;
  onBulkAI: () => void;
}) {
  const {
    search,
    setSearch,
    rows,
    selected,
    setSelected,
    onEdit,
    onApplyToSimilar,
    getSimilarCount,
    getReferenceProduct,
    groupSimilarRows,
    onGroupSimilarRowsChange,
    page,
    totalPages,
    onPageChange,
    onBulkClassify,
    onBulkAI,
  } = props;

  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({});

  const currentRowIds = React.useMemo(() => {
    const ids = new Set<string>();
    for (const row of rows) {
      for (const member of getRowMembers(row)) {
        ids.add(member.id);
      }
    }
    return Array.from(ids);
  }, [rows]);

  const selectedCount = Object.keys(selected).filter((id) => selected[id]).length;
  const allSelected = currentRowIds.length > 0 && currentRowIds.every((id) => selected[id]);
  const visibleSkuCount = rows.reduce((sum, row) => sum + getRowMembers(row).length, 0);
  const totalUnits = rows.reduce((sum, row) => sum + row.quantitySold, 0);

  const toggleRow = (row: ProductTableRow) => {
    const targetIds = getRowMembers(row).map((member) => member.id);
    const shouldSelect = !targetIds.every((id) => selected[id]);

    setSelected((previous) => {
      const next = { ...previous };
      for (const id of targetIds) {
        next[id] = shouldSelect;
      }
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((previous) => {
      const next = { ...previous };
      for (const id of currentRowIds) {
        next[id] = !allSelected;
      }
      return next;
    });
  };

  const toggleGroupDetails = (groupId: string) => {
    setExpandedGroups((previous) => ({
      ...previous,
      [groupId]: !previous[groupId],
    }));
  };

  return (
    <Card className="glass-card overflow-hidden border-border/40 shadow-soft transition-all duration-300 hover:shadow-soft-lg">
      <CardHeader className="relative gap-4 overflow-hidden border-border/40 border-b bg-gradient-to-r from-amber-50/30 to-amber-100/10">
        <div className="pointer-events-none absolute inset-0 bg-noise opacity-[0.02] mix-blend-multiply" />
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-4">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un groupe a verifier"
                className="border-border/60 bg-white/60 pl-9 transition-all focus:bg-white"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-full bg-white/70 px-3 py-1 text-foreground text-xs">
                {rows.length} file(s) de validation
              </Badge>
              <Badge variant="secondary" className="rounded-full bg-white/70 px-3 py-1 text-foreground text-xs">
                {visibleSkuCount} SKU a traiter
              </Badge>
              <Badge variant="secondary" className="rounded-full bg-white/70 px-3 py-1 text-foreground text-xs">
                {totalUnits.toLocaleString("fr-FR")} unites impactees
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={toggleAll} className="bg-white/60">
              {allSelected ? "Tout deselectionner" : "Selectionner la page"}
            </Button>
            {selectedCount > 0 ? (
              <>
                <Button
                  onClick={onBulkAI}
                  size="sm"
                  className="gap-2 bg-blue-500 text-white shadow-sm hover:bg-blue-600"
                >
                  <Sparkles className="size-4" />
                  Suggere avec l'IA
                </Button>
                <Button
                  onClick={onBulkClassify}
                  size="sm"
                  className="gap-2 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                >
                  <CheckCircle2 className="size-4" />
                  Valider la selection
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>File de validation</CardTitle>
            <CardDescription>
              Traite les emballages a verifier par groupe, puis applique la classification au lot complet.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-border/60 bg-white/60 px-3 py-2 shadow-sm">
            <Switch id="group-review-similar" checked={groupSimilarRows} onCheckedChange={onGroupSimilarRowsChange} />
            <Label htmlFor="group-review-similar" className="cursor-pointer text-foreground text-xs">
              Regrouper les SKU similaires
            </Label>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        {rows.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Aucun produit a verifier"
            description={
              search
                ? "Aucun groupe ne correspond a ta recherche."
                : "Le catalogue ne contient aucun emballage en attente de validation."
            }
          />
        ) : (
          rows.map((row) => {
            const grouped = isGroupedProductRow(row);
            const members = getRowMembers(row);
            const referenceProduct = getReferenceProduct(row);
            const similarCount = getSimilarCount(referenceProduct);
            const otherClassifiedCount = Math.max(0, similarCount - members.length);
            const blockers = getReviewBlockers(row);
            const rowSelected = members.every((member) => selected[member.id]);
            const isExpanded = grouped ? Boolean(expandedGroups[row.id]) : false;
            const actionLabel =
              otherClassifiedCount > 0
                ? grouped
                  ? "Propager la reference"
                  : "Appliquer la reference"
                : grouped
                  ? "Valider le groupe"
                  : "Valider le SKU";
            const nextStep =
              otherClassifiedCount > 0
                ? `${otherClassifiedCount} SKU deja classes peuvent servir de reference.`
                : row.classificationSource === "AI_SUGGESTION" && row.confidence
                  ? `Verifier la suggestion IA (${Math.round(row.confidence * 100)}%).`
                  : "Completer la matiere, le poids et l'organisme avant validation.";

            return (
              <div
                key={row.id}
                className="group hover:-translate-y-0.5 rounded-2xl border border-border/40 bg-white/60 p-4 shadow-soft backdrop-blur-md transition-all duration-300 hover:border-emerald-200 hover:shadow-soft-lg"
              >
                <div className="flex gap-3">
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      className="translate-y-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      checked={rowSelected}
                      onChange={() => toggleRow(row)}
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-base text-foreground">{row.name}</h3>
                          {statusBadge(row)}
                          <Badge
                            variant="secondary"
                            className="rounded-full bg-muted/60 px-2.5 py-1 text-foreground text-xs"
                          >
                            {members.length} SKU
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="rounded-full bg-muted/60 px-2.5 py-1 text-foreground text-xs"
                          >
                            {row.quantitySold.toLocaleString("fr-FR")} unites
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {grouped
                            ? `${members.length} SKU attendent la meme decision de classification dans ce groupe.`
                            : `SKU ${row.sku} en attente de validation.`}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {grouped ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleGroupDetails(row.id)}
                            className="bg-white/60"
                          >
                            {isExpanded ? (
                              <ChevronDown className="mr-2 size-4" />
                            ) : (
                              <ChevronRight className="mr-2 size-4" />
                            )}
                            {isExpanded ? "Masquer le detail" : "Voir les SKU"}
                          </Button>
                        ) : similarCount > 1 ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onApplyToSimilar(row)}
                            className="bg-white/60"
                          >
                            Appliquer aux {similarCount} similaires
                          </Button>
                        ) : null}

                        <Button
                          onClick={() => onEdit(row)}
                          size="sm"
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="mr-2 size-4" />
                          {actionLabel}
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-3">
                      <div className="rounded-xl border border-border/50 bg-muted/10 p-3">
                        <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                          Blocages
                        </div>
                        <div className="mt-2 text-foreground text-sm">
                          {blockers.length > 0 ? blockers.join(" · ") : "Aucun blocage detecte, validation possible."}
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/50 bg-muted/10 p-3">
                        <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                          Reference exploitable
                        </div>
                        <div className="mt-2 text-foreground text-sm">
                          {formatClassificationPreview(referenceProduct)}
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/50 bg-muted/10 p-3">
                        <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                          Prochaine action
                        </div>
                        <div className="mt-2 text-foreground text-sm">{nextStep}</div>
                      </div>
                    </div>

                    {grouped && isExpanded ? (
                      <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="font-medium text-foreground text-sm">SKU inclus dans le groupe</div>
                          <div className="text-muted-foreground text-xs">
                            {members.length} SKU - {row.quantitySold.toLocaleString("fr-FR")} unites
                          </div>
                        </div>

                        <div className="grid gap-2 md:grid-cols-2">
                          {members.map((member) => {
                            const memberBlockers = getReviewBlockers(member);

                            return (
                              <div
                                key={member.id}
                                className="flex items-center justify-between rounded-lg border border-border/40 bg-white/50 px-3 py-2 text-sm transition-colors hover:border-emerald-100 hover:bg-white/80"
                              >
                                <div className="min-w-0">
                                  <div className="truncate font-medium text-foreground">{member.sku}</div>
                                  <div className="truncate text-muted-foreground text-xs">
                                    {member.quantitySold.toLocaleString("fr-FR")} unites
                                    {memberBlockers.length > 0
                                      ? ` - ${memberBlockers.join(", ")}`
                                      : " - Pret a valider"}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="shrink-0 text-muted-foreground text-xs hover:text-foreground"
                                  onClick={() => onEdit(member)}
                                >
                                  Ouvrir
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      <div className="flex items-center justify-between border-border/40 border-t bg-muted/10 p-4">
        <p className="text-muted-foreground text-sm">
          Page {page} sur {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="h-8"
          >
            Precedent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="h-8"
          >
            Suivant
          </Button>
        </div>
      </div>
    </Card>
  );
}

function RuleItem({ pattern, type, confidence }: { pattern: string; type: string; confidence: number }) {
  return (
    <li className="flex items-center justify-between rounded-md border border-border/40 bg-white/60 p-2 text-xs">
      <div className="flex items-center gap-2">
        <code className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">{pattern}</code>
        <span className="text-muted-foreground">-&gt;</span>
        <span className="font-medium">{type}</span>
      </div>
      <Badge variant="secondary" className="h-4 border-emerald-100 bg-emerald-50 text-[10px] text-emerald-700">
        {confidence}%
      </Badge>
    </li>
  );
}
