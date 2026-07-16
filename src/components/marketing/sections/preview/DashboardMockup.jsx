"use client";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileText,
  Package,
  TrendingUp,
  Upload,
} from "lucide-react";

/**
 * Static CSS-based dashboard mockup for the landing page.
 * Shows a realistic preview of the Klover dashboard without any real data.
 */
export function DashboardMockup() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-300/40">
      {/* Top bar */}
      <div className="flex items-center gap-2 border-slate-100 border-b bg-slate-50/80 px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="size-2.5 rounded-full bg-red-400" />
          <div className="size-2.5 rounded-full bg-amber-400" />
          <div className="size-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="ml-3 flex-1 rounded-md bg-white px-3 py-1 text-center text-[10px] text-slate-400 ring-1 ring-slate-200">
          app.klover.eco/dashboard
        </div>
      </div>

      <div className="flex">
        {/* Sidebar mini */}
        <div className="hidden w-[140px] shrink-0 border-slate-100 border-r bg-slate-50/50 p-3 sm:block">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-emerald-600">
              <span className="font-bold text-[9px] text-white">K</span>
            </div>
            <span className="font-semibold text-[11px] text-slate-700">Klover</span>
          </div>
          <nav className="space-y-1">
            {[
              { label: "Dashboard", active: true, icon: BarChart3 },
              { label: "Produits", active: false, icon: Package },
              { label: "Déclarations", active: false, icon: FileText },
              { label: "Import", active: false, icon: Upload },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 font-medium text-[10px] ${
                  item.active ? "bg-emerald-50 text-emerald-700" : "text-slate-500"
                }`}
              >
                <item.icon className="size-3" />
                {item.label}
              </div>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 p-3 sm:p-4">
          {/* Header */}
          <div className="mb-3">
            <h3 className="font-semibold text-[11px] text-slate-800 sm:text-xs">Bonjour, Marie</h3>
            <p className="text-[9px] text-slate-400 sm:text-[10px]">Votre conformité REP du mois</p>
          </div>

          {/* Stat cards */}
          <div className="mb-3 grid grid-cols-3 gap-2">
            <MockStatCard
              label="À vérifier"
              value="3"
              badge={{ text: "À traiter", variant: "warning" }}
              icon={<AlertTriangle className="size-2.5" />}
            />
            <MockStatCard
              label="Catalogue"
              value="94%"
              badge={{ text: "6% incomplet", variant: "neutral" }}
              icon={<CheckCircle2 className="size-2.5" />}
            />
            <MockStatCard
              label="Éco-contribution"
              value="1 247 €"
              badge={{ text: "Estimé", variant: "success" }}
              icon={<FileText className="size-2.5" />}
            />
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-5 gap-2">
            {/* Left: Chart + Workflow */}
            <div className="col-span-3 space-y-2">
              {/* Mini chart */}
              <div className="rounded-lg border border-slate-100 bg-white p-2.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-[9px] text-slate-600 sm:text-[10px]">Tonnage mensuel</span>
                  <span className="flex items-center gap-0.5 text-[8px] text-emerald-600">
                    <TrendingUp className="size-2.5" />
                    +12%
                  </span>
                </div>
                <MockChart />
              </div>

              {/* Workflow step */}
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-2.5">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <span className="font-bold text-[7px]">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[9px] text-slate-700 sm:text-[10px]">
                      Vérifier 3 produits non classés
                    </p>
                    <p className="text-[8px] text-slate-500">Bloquent la déclaration de mars</p>
                  </div>
                  <ArrowRight className="mt-0.5 size-3 text-emerald-500" />
                </div>
              </div>
            </div>

            {/* Right: Distribution + Activity */}
            <div className="col-span-2 space-y-2">
              {/* Distribution donut */}
              <div className="rounded-lg border border-slate-100 bg-white p-2.5">
                <span className="mb-2 block font-medium text-[9px] text-slate-600 sm:text-[10px]">Répartition</span>
                <MockDonut />
                <div className="mt-2 space-y-1">
                  {[
                    { label: "Papier/Carton", color: "bg-emerald-500", pct: "62%" },
                    { label: "Plastique", color: "bg-blue-500", pct: "24%" },
                    { label: "Verre", color: "bg-amber-500", pct: "14%" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <div className={`size-1.5 rounded-full ${item.color}`} />
                      <span className="flex-1 text-[8px] text-slate-500">{item.label}</span>
                      <span className="font-medium text-[8px] text-slate-700">{item.pct}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent activity */}
              <div className="rounded-lg border border-slate-100 bg-white p-2.5">
                <span className="mb-1.5 block font-medium text-[9px] text-slate-600 sm:text-[10px]">Activité</span>
                <div className="space-y-1.5">
                  {[
                    { text: "Import CSV — 142 refs", time: "il y a 2h" },
                    { text: "Déclaration CITEO", time: "hier" },
                    { text: "3 produits classifiés", time: "2 jours" },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center justify-between">
                      <span className="text-[8px] text-slate-600">{item.text}</span>
                      <span className="text-[7px] text-slate-400">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockStatCard({ label, value, badge, icon }) {
  const badgeColors = {
    warning: "border-amber-200 bg-amber-50 text-amber-600",
    success: "border-emerald-200 bg-emerald-50 text-emerald-600",
    neutral: "border-slate-200 bg-slate-50 text-slate-500",
  };

  return (
    <div className="rounded-lg border border-slate-100 bg-white p-2 transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[8px] text-slate-500 sm:text-[9px]">{label}</span>
        <div className="flex size-4 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          {icon}
        </div>
      </div>
      <p className="mt-1 font-bold text-slate-800 text-sm tabular-nums leading-none sm:text-base">{value}</p>
      {badge && (
        <span
          className={`mt-1.5 inline-block rounded-full border px-1.5 py-0.5 font-medium text-[7px] ${badgeColors[badge.variant]}`}
        >
          {badge.text}
        </span>
      )}
    </div>
  );
}

function MockChart() {
  const bars = [35, 48, 42, 60, 55, 72, 68, 80, 75, 88, 82, 90];
  const maxH = 40;

  return (
    <div className="flex items-end gap-[3px]" style={{ height: maxH }}>
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm bg-gradient-to-t from-emerald-500 to-emerald-400 opacity-80 transition-all hover:opacity-100"
          style={{ height: `${(h / 100) * maxH}px` }}
        />
      ))}
    </div>
  );
}

function MockDonut() {
  // SVG donut chart
  const segments = [
    { pct: 62, color: "#10b981", offset: 0 },
    { pct: 24, color: "#3b82f6", offset: 62 },
    { pct: 14, color: "#f59e0b", offset: 86 },
  ];
  const r = 16;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex justify-center">
      <svg viewBox="0 0 48 48" className="size-12">
        {segments.map((seg) => (
          <circle
            key={seg.color}
            cx="24"
            cy="24"
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="6"
            strokeDasharray={`${(seg.pct / 100) * circ} ${circ}`}
            strokeDashoffset={`${-(seg.offset / 100) * circ}`}
            transform="rotate(-90 24 24)"
          />
        ))}
      </svg>
    </div>
  );
}
