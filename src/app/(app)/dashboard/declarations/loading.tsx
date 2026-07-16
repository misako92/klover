import { Skeleton } from "@/components/ui/skeleton";

export default function DeclarationsLoading() {
  return (
    <div className="dashboard-container fade-in flex animate-in flex-col gap-6 duration-300">
      <div className="dashboard-header">
        <div className="space-y-3">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="h-9 w-44" />
      </div>

      <Skeleton className="h-[420px] w-full rounded-xl" />
    </div>
  );
}
