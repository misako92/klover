"use client";

import * as React from "react";

import type { z } from "zod";

import { DataTable as BaseDataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { columns as productColumns } from "./columns";
import type { productSchema } from "./schema";

export function DataTable({ data: initialData }: { data: z.infer<typeof productSchema>[] }) {
  const [data, _setData] = React.useState(() => initialData);
  const table = useDataTableInstance({ data, columns: productColumns, getRowId: (row) => row.id.toString() });

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border">
        {/* biome-ignore lint/suspicious/noExplicitAny: columns bypass */}
        <BaseDataTable table={table} columns={productColumns as any} />
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
