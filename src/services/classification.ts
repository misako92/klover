import "server-only";

import prisma from "@/lib/db";

// Prisma types are not available in this repo's generated client typings.
// biome-ignore lint/suspicious/noExplicitAny: Types are relaxed locally to favor build optimization without DB dependencies.
type Product = any;
// biome-ignore lint/suspicious/noExplicitAny: Schema bypassed locally
type ClassificationRule = any;
// biome-ignore lint/suspicious/noExplicitAny: Schema bypassed locally
type MaterialType = any;
// biome-ignore lint/suspicious/noExplicitAny: Schema bypassed locally
type EcoOrganism = any;

/** Convert rule priority (0-100 scale) to confidence score (0-1 scale). */
function normalizeRulePriority(priority: number): number {
  const clamped = Math.max(0, Math.min(100, priority));
  return Math.round((clamped / 100) * 100) / 100;
}

export async function applyClassificationRules(
  product: Product,
  orgId: string,
  rulesOverride?: ClassificationRule[],
): Promise<{
  confidenceScore: number;
  // biome-ignore lint/suspicious/noExplicitAny: complex structure returned
  explanation: any;
  materialType?: MaterialType;
  ecoOrganism?: EcoOrganism;
  packagingType?: string;
} | null> {
  const rules = rulesOverride ?? (await getActiveClassificationRules(orgId));

  for (const rule of rules) {
    if (matchRule(product, rule)) {
      return {
        materialType: rule.outputMaterial || undefined,
        ecoOrganism: rule.outputEcoOrganism || undefined,
        packagingType: rule.outputPackaging || undefined,
        confidenceScore: normalizeRulePriority(rule.priority),
        explanation: {
          ruleId: rule.id,
          matchedPattern: rule.pattern,
          field: rule.inputField,
        },
      };
    }
  }

  return null;
}

export async function getActiveClassificationRules(orgId: string) {
  await ensureDefaultRules(orgId);

  return prisma.classificationRule.findMany({
    where: { orgId, isActive: true },
    orderBy: { priority: "desc" },
  });
}

function matchRule(product: Product, rule: ClassificationRule): boolean {
  const fieldValue = getProductField(product, rule.inputField);
  if (!fieldValue) return false;

  const normalizedField = normalizeText(fieldValue);
  const normalizedPattern = normalizeText(String(rule.pattern));

  if (rule.type === "REGEX") {
    try {
      if (String(rule.pattern).length > 256) {
        console.error(`Regex pattern too long for rule ${rule.id}`);
        return false;
      }
      const regex = new RegExp(rule.pattern, "i");
      return regex.test(fieldValue);
    } catch {
      console.error(`Invalid regex for rule ${rule.id}: ${rule.pattern}`);
      return false;
    }
  }

  if (rule.type === "KEYWORD") {
    return normalizedField.includes(normalizedPattern);
  }

  if (rule.type === "SKU_PREFIX") {
    return fieldValue.startsWith(rule.pattern);
  }

  return false;
}

function getProductField(product: Product, fieldName: string): string | null {
  if (fieldName === "name") return product.name;
  if (fieldName === "sku") return product.sku;
  return null;
}

function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function ensureDefaultRules(orgId: string) {
  const count = await prisma.classificationRule.count({
    where: { orgId },
  });

  if (count > 0) return;

  const defaultRules = [
    { pattern: "carton", type: "KEYWORD", outputMaterial: "CARDBOARD", outputEcoOrganism: "CITEO", priority: 50 },
    { pattern: "boite", type: "KEYWORD", outputMaterial: "CARDBOARD", outputEcoOrganism: "CITEO", priority: 45 },
    { pattern: "etui", type: "KEYWORD", outputMaterial: "CARDBOARD", outputEcoOrganism: "CITEO", priority: 45 },
    { pattern: "kraft", type: "KEYWORD", outputMaterial: "CARDBOARD", outputEcoOrganism: "CITEO", priority: 40 },
    { pattern: "notice", type: "KEYWORD", outputMaterial: "CARDBOARD", outputEcoOrganism: "CITEO", priority: 30 },
    { pattern: "livret", type: "KEYWORD", outputMaterial: "CARDBOARD", outputEcoOrganism: "CITEO", priority: 30 },
    { pattern: "papier", type: "KEYWORD", outputMaterial: "CARDBOARD", outputEcoOrganism: "CITEO", priority: 50 },
    { pattern: "verre", type: "KEYWORD", outputMaterial: "GLASS", outputEcoOrganism: "CITEO", priority: 50 },
    { pattern: "bouteille", type: "KEYWORD", outputMaterial: "GLASS", outputEcoOrganism: "CITEO", priority: 40 },
    { pattern: "bocal", type: "KEYWORD", outputMaterial: "GLASS", outputEcoOrganism: "CITEO", priority: 50 },
    { pattern: "flacon verre", type: "KEYWORD", outputMaterial: "GLASS", outputEcoOrganism: "CITEO", priority: 60 },
    { pattern: "pot verre", type: "KEYWORD", outputMaterial: "GLASS", outputEcoOrganism: "CITEO", priority: 60 },
    { pattern: "plastique", type: "KEYWORD", outputMaterial: "PLASTIC", outputEcoOrganism: "CITEO", priority: 50 },
    { pattern: "sachet", type: "KEYWORD", outputMaterial: "PLASTIC", outputEcoOrganism: "CITEO", priority: 40 },
    { pattern: "film", type: "KEYWORD", outputMaterial: "PLASTIC", outputEcoOrganism: "CITEO", priority: 40 },
    { pattern: "blister", type: "KEYWORD", outputMaterial: "PLASTIC", outputEcoOrganism: "CITEO", priority: 50 },
    { pattern: "tube", type: "KEYWORD", outputMaterial: "PLASTIC", outputEcoOrganism: "CITEO", priority: 30 },
    { pattern: "pouch", type: "KEYWORD", outputMaterial: "PLASTIC", outputEcoOrganism: "CITEO", priority: 45 },
    { pattern: "doypack", type: "KEYWORD", outputMaterial: "PLASTIC", outputEcoOrganism: "CITEO", priority: 50 },
    { pattern: "aluminium", type: "KEYWORD", outputMaterial: "ALUMINUM", outputEcoOrganism: "CITEO", priority: 50 },
    { pattern: "alu", type: "KEYWORD", outputMaterial: "ALUMINUM", outputEcoOrganism: "CITEO", priority: 40 },
    { pattern: "canette", type: "KEYWORD", outputMaterial: "ALUMINUM", outputEcoOrganism: "CITEO", priority: 50 },
    { pattern: "boite fer", type: "KEYWORD", outputMaterial: "STEEL", outputEcoOrganism: "CITEO", priority: 60 },
    { pattern: "conserve", type: "KEYWORD", outputMaterial: "STEEL", outputEcoOrganism: "CITEO", priority: 50 },
    { pattern: "bois", type: "KEYWORD", outputMaterial: "WOOD", outputEcoOrganism: "VALDELIA", priority: 50 },
    { pattern: "palette", type: "KEYWORD", outputMaterial: "WOOD", outputEcoOrganism: "VALDELIA", priority: 60 },
    { pattern: "caisse bois", type: "KEYWORD", outputMaterial: "WOOD", outputEcoOrganism: "VALDELIA", priority: 60 },
  ];

  await prisma.classificationRule.createMany({
    data: defaultRules.map((rule) => ({
      orgId,
      // biome-ignore lint/suspicious/noExplicitAny: prisma enums are relaxed locally
      type: rule.type as any,
      pattern: rule.pattern,
      inputField: "name",
      // biome-ignore lint/suspicious/noExplicitAny: prisma enums are relaxed locally
      outputMaterial: rule.outputMaterial as any,
      // biome-ignore lint/suspicious/noExplicitAny: prisma enums are relaxed locally
      outputEcoOrganism: rule.outputEcoOrganism as any,
      isActive: true,
      priority: rule.priority,
      confidenceBoost: rule.priority,
    })),
  });
}
