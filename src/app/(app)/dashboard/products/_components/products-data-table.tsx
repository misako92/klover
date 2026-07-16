"use client";

import * as React from "react";

import Link from "next/link";

import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { FileSpreadsheet, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { BulkEditToolbar } from "./bulk-edit-toolbar";
import { type ClassificationStatus, columns, type Product } from "./columns";
import { ProductSheet } from "./product-sheet";

interface ProductsDataTableProps {
  data: Product[];
  showBulkActions?: boolean;
}

export function ProductsDataTable({ data, showBulkActions }: ProductsDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [mergedData, setMergedData] = React.useState<Product[]>(data);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  React.useEffect(() => {
    const nextData = showBulkActions ? data.filter((item) => item.status === "NEEDS_REVIEW") : data;
    setMergedData(nextData);
  }, [data, showBulkActions]);

  const table = useReactTable({
    data: mergedData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  const handleProductSave = (updatedProduct: Product) => {
    setMergedData((prev) => {
      const next = prev.map((item) => (item.id === updatedProduct.id ? updatedProduct : item));
      return showBulkActions ? next.filter((item) => item.status === "NEEDS_REVIEW") : next;
    });
  };

  const handleRowClick = (product: Product) => {
    setSelectedProduct(product);
    setSheetOpen(true);
  };

  const handleBulkConfirmSuccess = (ids: string[]) => {
    const idSet = new Set(ids);
    setMergedData((prev) => {
      const next = prev.map((item) =>
        idSet.has(item.id) ? { ...item, status: "CONFIRMED" as ClassificationStatus } : item,
      );
      return showBulkActions ? next.filter((item) => item.status === "NEEDS_REVIEW") : next;
    });
    setRowSelection({});
  };

  const selectedIds = table.getFilteredSelectedRowModel().rows.map((row) => row.original.id);

  return (
    <div className="space-y-4">
      <ProductSheet product={selectedProduct} open={sheetOpen} onOpenChange={setSheetOpen} onSave={handleProductSave} />

      <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4 shadow-sm">
        <div className="relative w-full max-w-sm">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground/70" />
          <Input
            placeholder="Rechercher un produit..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
            className="border-input pl-10 focus-visible:ring-emerald-500"
          />
        </div>
      </div>

      {showBulkActions && Object.keys(rowSelection).length > 0 && (
        <BulkEditToolbar
          selectedCount={Object.keys(rowSelection).length}
          selectedIds={selectedIds}
          onSuccess={handleBulkConfirmSuccess}
        />
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-border hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-12 font-semibold text-muted-foreground text-xs uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => handleRowClick(row.original)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleRowClick(row.original);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer border-border transition-colors hover:bg-emerald-50/30 data-[state=selected]:border-emerald-100 data-[state=selected]:bg-emerald-50/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10">
                  <Empty className="border-border border-dashed bg-card/40">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <FileSpreadsheet />
                      </EmptyMedia>
                      <EmptyTitle>Aucun produit trouve</EmptyTitle>
                      <EmptyDescription>
                        Importez vos ventes pour generer le catalogue et lancer la classification.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700">
                        <Link href="/dashboard/orders">Importer un CSV</Link>
                      </Button>
                    </EmptyContent>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-end space-x-2 border-border border-t bg-muted/30 px-4 py-4">
          <div className="flex-1 text-muted-foreground text-sm">
            {table.getFilteredSelectedRowModel().rows.length} sur {table.getFilteredRowModel().rows.length} ligne(s)
            selectionnee(s).
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="bg-background text-muted-foreground hover:bg-muted/50"
            >
              Precedent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="bg-background text-muted-foreground hover:bg-muted/50"
            >
              Suivant
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
