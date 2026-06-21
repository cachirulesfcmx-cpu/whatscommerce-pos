"use client";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportsExport({
  filename, headers, rows,
}: {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  function exportCsv() {
    const head = headers.join(",") + "\n";
    const body = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([head + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Button variant="outline" size="sm" onClick={exportCsv}>
      <Download className="h-4 w-4" /> Exportar CSV
    </Button>
  );
}
