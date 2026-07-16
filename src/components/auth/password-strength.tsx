"use client";

import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  score: number; // 0 to 4
  className?: string;
}

export function PasswordStrength({ score, className }: PasswordStrengthProps) {
  return (
    <div className={cn("mt-2 flex h-1 w-full gap-1", className)}>
      {[0, 1, 2, 3].map((level) => (
        <div
          key={level}
          className={cn(
            "h-full flex-1 rounded-full transition-all duration-500",
            score > level
              ? score <= 1
                ? "bg-red-500"
                : score <= 2
                  ? "bg-orange-500"
                  : score <= 3
                    ? "bg-yellow-500"
                    : "bg-emerald-500"
              : "bg-zinc-200",
          )}
        />
      ))}
    </div>
  );
}

export function getStrength(password: string): number {
  let score = 0;
  if (!password) return 0;
  if (password.length > 5) score++;
  if (password.length > 7) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

export function getStrengthLabel(score: number): string {
  switch (score) {
    case 0:
      return "Très faible";
    case 1:
      return "Faible";
    case 2:
      return "Moyen";
    case 3:
      return "Bon";
    case 4:
      return "Excellent";
    default:
      return "";
  }
}
