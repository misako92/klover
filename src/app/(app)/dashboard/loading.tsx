import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="fade-in mx-auto flex h-full w-full max-w-[1600px] animate-in flex-col gap-8 p-8 duration-500">
      {/* Header Skeleton */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64 rounded-lg bg-muted/60 md:w-96" />
          <Skeleton className="h-5 w-48 rounded-md bg-muted/50" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-32 rounded-lg bg-muted/50" />
          <Skeleton className="h-10 w-10 rounded-lg bg-muted/50 md:w-32" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-border bg-background/60 shadow-sm">
          <CardHeader className="space-y-2 pb-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24 bg-muted/50" />
              <Skeleton className="size-8 rounded-lg bg-muted/50" />
            </div>
            <Skeleton className="h-8 w-32 bg-muted/70" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-3 w-48 bg-muted/50" />
          </CardContent>
        </Card>
        <Card className="border-border bg-background/60 shadow-sm md:col-span-2">
          <CardHeader className="space-y-2 pb-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32 bg-muted/50" />
              <Skeleton className="size-8 rounded-lg bg-muted/50" />
            </div>
            <Skeleton className="h-8 w-48 bg-muted/70" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-3 w-64 bg-muted/50" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid h-full grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-[400px] w-full rounded-xl bg-muted/40" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[400px] w-full rounded-xl bg-muted/40" />
        </div>
      </div>
    </div>
  );
}
