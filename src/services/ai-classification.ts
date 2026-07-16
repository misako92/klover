"use server";

import { revalidatePath } from "next/cache";

import { requireOrgContext, requireOrgRole } from "@/lib/auth/context";
import prisma from "@/lib/db";

type InternalMaterialType =
  | "PLASTIC"
  | "PLASTIC_PET"
  | "CARDBOARD"
  | "GLASS"
  | "ALUMINUM"
  | "STEEL"
  | "WOOD"
  | "TEXTILE"
  | "COMPOSITE"
  | "UNKNOWN";
type InternalEcoOrganism = "CITEO" | "LEKO" | "ECOMAISON" | "VALDELIA" | "OTHER";
type InternalPackagingType = "PRIMARY" | "SECONDARY" | "TERTIARY";
type InternalClassificationStatus = "CONFIRMED" | "NEEDS_REVIEW" | "PENDING" | "ARCHIVED";

interface AISuggestion {
  id: string;
  confidence: number;
  reason: string;
  weightG?: number;
  materialType?: InternalMaterialType;
  ecoOrganism?: InternalEcoOrganism;
  packagingType?: InternalPackagingType;
}

export async function generateAISuggestions(productIds: string[]) {
  if (!productIds || productIds.length === 0) return { count: 0, suggestions: [] };

  const { orgId, membership } = await requireOrgContext();
  requireOrgRole(membership, ["OWNER", "ADMIN"]);

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      orgId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  const suggestions: AISuggestion[] = products.map((product) => {
    const name = product.name.toLowerCase();

    let suggestedMaterial: InternalMaterialType = "CARDBOARD";
    const suggestedOrganism: InternalEcoOrganism = "CITEO";
    let suggestedPackaging: InternalPackagingType = "PRIMARY";
    let suggestedWeight = 150;
    let confidence = 0.65;
    let reason = "Analyse générique basée sur la catégorie d'emballage par défaut.";

    if (name.includes("verre") || name.includes("bouteille") || name.includes("pot")) {
      suggestedMaterial = "GLASS";
      suggestedWeight = 350;
      confidence = 0.92;
      reason = "Détection du mot-clé 'verre' ou 'bouteille'. Gisement lourd estimé.";
    } else if (name.includes("plastique") || name.includes("sachet") || name.includes("film")) {
      suggestedMaterial = "PLASTIC";
      suggestedWeight = 45;
      confidence = 0.88;
      reason = "Emballage plastique léger détecté via l'intitulé.";
    } else if (name.includes("carton") || name.includes("boîte") || name.includes("kraft")) {
      suggestedMaterial = "CARDBOARD";
      suggestedPackaging = "SECONDARY";
      suggestedWeight = 120;
      confidence = 0.85;
      reason = "Classification probable en emballage d'expédition carton.";
    }

    return {
      id: product.id,
      materialType: suggestedMaterial,
      ecoOrganism: suggestedOrganism,
      packagingType: suggestedPackaging,
      weightG: suggestedWeight,
      confidence,
      reason,
    };
  });

  for (const suggestion of suggestions) {
    const status: InternalClassificationStatus = suggestion.confidence > 0.8 ? "PENDING" : "NEEDS_REVIEW";

    await prisma.product.updateMany({
      where: { id: suggestion.id, orgId },
      data: {
        // biome-ignore lint/suspicious/noExplicitAny: prisma enums are relaxed locally
        materialType: suggestion.materialType as any,
        // biome-ignore lint/suspicious/noExplicitAny: prisma enums are relaxed locally
        ecoOrganism: suggestion.ecoOrganism as any,
        // biome-ignore lint/suspicious/noExplicitAny: prisma enums are relaxed locally
        packagingType: suggestion.packagingType as any,
        weightG: suggestion.weightG,
        confidence: suggestion.confidence,
        classificationSource: "AI_SUGGESTION",
        reviewReason: suggestion.reason,
        // biome-ignore lint/suspicious/noExplicitAny: prisma enums are relaxed locally
        status: status as any,
      },
    });
  }

  revalidatePath("/dashboard/products");

  return { count: suggestions.length, suggestions };
}
