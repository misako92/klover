import { inferEcoOrganism, normalizeConfidence } from "./constants";
import type { EcoOrganism, MaterialType } from "./types";

export interface ClassificationResult {
  materialType: MaterialType;
  ecoOrganism: EcoOrganism;
  confidence: number;
  reason: string;
}

const CLASSIFICATION_RULES: Array<{
  id: string;
  regex: RegExp;
  materialType: MaterialType;
  confidence: number;
}> = [
  {
    id: "plastic-pet",
    regex: /(bouteille|flacon|pet|bidon|capsule)/i,
    materialType: "PLASTIC_PET",
    confidence: 0.93,
  },
  {
    id: "cardboard",
    regex: /(carton|bo[iî]te|box|etui|emballage papier|enveloppe)/i,
    materialType: "CARDBOARD",
    confidence: 0.9,
  },
  {
    id: "glass",
    regex: /(verre|bocal|pot en verre)/i,
    materialType: "GLASS",
    confidence: 0.91,
  },
  {
    id: "aluminum",
    regex: /(alu|aluminium|canette|capsule alu)/i,
    materialType: "ALUMINUM",
    confidence: 0.87,
  },
  {
    id: "steel",
    regex: /(acier|steel|bo[iî]te metal)/i,
    materialType: "STEEL",
    confidence: 0.85,
  },
  {
    id: "textile",
    regex: /(tee|t-shirt|hoodie|chaussette|textile|linge)/i,
    materialType: "TEXTILE",
    confidence: 0.84,
  },
  {
    id: "wood",
    regex: /(bois|wood|planche|palette|meuble)/i,
    materialType: "WOOD",
    confidence: 0.82,
  },
  {
    id: "composite",
    regex: /(multicouche|composite|mixte|lamine)/i,
    materialType: "COMPOSITE",
    confidence: 0.8,
  },
];

export function classifyByHeuristics(input: { name: string; sku: string }): ClassificationResult | null {
  const haystack = `${input.name} ${input.sku}`.trim();
  for (const rule of CLASSIFICATION_RULES) {
    if (rule.regex.test(haystack)) {
      return {
        materialType: rule.materialType,
        ecoOrganism: inferEcoOrganism(rule.materialType),
        confidence: normalizeConfidence(rule.confidence),
        reason: `Règle ${rule.id}`,
      };
    }
  }
  return null;
}
