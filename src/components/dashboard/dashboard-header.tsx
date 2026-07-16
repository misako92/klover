"use client";

import { useUserName } from "@/components/dashboard/user-context";

export function DashboardHeader() {
  const userName = useUserName();
  const firstName = userName?.split(" ")[0] || "";

  const currentPeriod = new Date().toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative z-10 mb-8 flex flex-col gap-2">
      <div className="mb-1 inline-flex w-fit items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1.5 shadow-sm backdrop-blur-xl transition-all hover:bg-white/80">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        </span>
        <span className="font-bold text-[10px] text-emerald-800 uppercase tracking-widest">En ligne</span>
      </div>

      <div className="relative inline-block w-fit">
        <div className="-inset-1 absolute z-0 rounded-full bg-gradient-to-r from-emerald-100/30 to-teal-100/30 blur-2xl" />
        <h1 className="relative z-10 flex items-baseline gap-2 font-bold text-4xl text-slate-800 tracking-tight md:text-5xl">
          Bonjour{firstName ? ` ${firstName}` : ""},{" "}
          <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-emerald-600 text-transparent drop-shadow-sm">
            bienvenue
          </span>
        </h1>
      </div>

      <div className="mt-1 flex items-center gap-2 font-medium text-slate-500 text-sm">
        <span>Vue d'ensemble de votre activité</span>
        <span className="opacity-30">/</span>
        <span className="tabular">{currentPeriod}</span>
      </div>
    </div>
  );
}
