import { Skeleton } from "@/components/ui/skeleton";

export default function BillingLoading() {
  return (
    <div className="dashboard-container fade-in flex animate-in flex-col gap-6 duration-300">
      <div className="dashboard-header">
        <div className="space-y-3">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-5 w-64" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-[320px] w-full rounded-xl" />
        <Skeleton className="h-[320px] w-full rounded-xl" />
        <Skeleton className="h-[320px] w-full rounded-xl" />
      </div>
    </div>
  );
}
