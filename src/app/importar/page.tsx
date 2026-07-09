import { AppShell } from "@/components/app-shell";
import { BulkImportModule } from "@/components/bulk-import-module";
import { ReanalyzeAllModule } from "@/components/reanalyze-all-module";

export const metadata = {
  title: "Importación Masiva - ERFOR",
  description: "Carga masiva de directorios y expedientes",
};

export default function ImportPage() {
  return (
    <AppShell>
      <main className="p-4 lg:p-6 xl:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Importación Masiva</h1>
          <p className="text-slate-500 text-sm mt-1">Sube estructuras de carpetas para registrar automáticamente clientes, expedientes y documentos físicos.</p>
        </div>
        <BulkImportModule />
        <ReanalyzeAllModule />
      </main>
    </AppShell>
  );
}
