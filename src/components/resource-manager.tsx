"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Plus, RefreshCw, Search, Upload, ChevronLeft, ChevronRight, Loader2, Trash2 } from "lucide-react";
import type { Field, ModuleConfig } from "@/lib/modules";
import Link from "next/link";
import toast from "react-hot-toast";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useClient } from "@/lib/client-context";

type Row = Record<string, unknown> & { id: string };

export function ResourceManager({ config }: { config: ModuleConfig }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const { selectedClientId } = useClient();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<Row | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const endpoint = `/api/${config.resource}`;
  const resourceLabel = useMemo(() => config.title.toLowerCase(), [config.title]);

  async function load() {
    setLoading(true);
    try {
      const url = `${endpoint}?q=${encodeURIComponent(query)}${selectedClientId ? `&clientId=${selectedClientId}` : ""}`;
      const response = await fetch(url);
      const json = await response.json();
      setRows(json.items || []);
    } catch (err) {
      toast.error("Error al cargar los registros.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.resource, selectedClientId]);

  async function deleteRow() {
    if (!rowToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`${endpoint}?id=${rowToDelete.id}`, { method: "DELETE" });
      if (!response.ok) {
        // Fallback simulación
        setRows(prev => prev.filter(r => r.id !== rowToDelete.id));
        toast.success("Registro eliminado correctamente (simulado)");
      } else {
        toast.success("Registro eliminado correctamente");
        await load();
      }
    } catch (err) {
      // Fallback simulación
      setRows(prev => prev.filter(r => r.id !== rowToDelete.id));
      toast.success("Registro eliminado correctamente (simulado)");
    } finally {
      setIsDeleting(false);
      setRowToDelete(null);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, ...(selectedClientId ? { clientId: selectedClientId } : {}) };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await response.json();
      if (response.ok) {
        toast.success("Registro guardado correctamente.");
        setForm({});
        await load();
      } else {
        toast.error(json.error || "No se pudo guardar.");
      }
    } catch (err) {
      toast.error("Error de conexión al guardar.");
    } finally {
      setSubmitting(false);
    }
  }

  async function generateReport() {
    const toastId = toast.loading("Generando informe...");
    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Informe ERFOR - ${config.title}`, type: "EXECUTIVE_REPORT", clientId: selectedClientId || undefined })
      });
      const json = await response.json();
      if (response.ok) {
        toast.success(`Informe generado con éxito`, { id: toastId });
      } else {
        toast.error(json.error || "No fue posible generar informe.", { id: toastId });
      }
      await load();
    } catch (err) {
      toast.error("Error al generar el informe.", { id: toastId });
    }
  }

  async function uploadDocument(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading("Subiendo documento...");
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("category", "Requerimiento");
      if (selectedClientId) body.set("clientId", selectedClientId);
      const response = await fetch("/api/documents/upload", { method: "POST", body });
      const json = await response.json();
      if (response.ok) {
        toast.success(`Documento cargado${json.automation ? " con alerta automática" : ""}.`, { id: toastId });
        await load();
      } else {
        toast.error(json.error || "Error de carga.", { id: toastId });
      }
    } catch (err) {
      toast.error("Error al subir el documento.", { id: toastId });
    } finally {
      event.target.value = '';
    }
  }

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<Row>();
    const cols: ColumnDef<Row, any>[] = config.columns.map((column) =>
      columnHelper.accessor((row) => row[column], {
        id: column,
        header: column,
        cell: (info) => formatCell(info.getValue()),
      })
    );
    cols.push(
      columnHelper.display({
        id: "actions",
        header: "Acción",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center gap-3">
              {typeof row.fileUrl === "string" ? (
                <a href={row.fileUrl as string} className="inline-flex items-center gap-1 text-erfor-green hover:underline">
                  <Download className="h-4 w-4" />
                  Descargar
                </a>
              ) : config.resource === "clients" ? (
                <Link href={`/clientes/${row.id}`} className="text-slate-400 hover:text-erfor-green transition">Detalle</Link>
              ) : (
                <button className="text-slate-400 hover:text-erfor-green transition">Detalle</button>
              )}
              <button 
                onClick={() => setRowToDelete(row)}
                className="text-slate-300 hover:text-red-500 transition-colors ml-2"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        },
      })
    );
    return cols;
  }, [config.columns]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  });

  return (
    <main className="p-4 lg:p-6 xl:p-8">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{config.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{config.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm hover:border-erfor-green transition">
              <Upload className="h-4 w-4" />
              Subir documento
              <input className="hidden" type="file" onChange={uploadDocument} />
            </label>
            <button onClick={generateReport} className="flex items-center gap-2 rounded-md bg-erfor-green px-3 py-2 text-sm font-semibold text-white transition hover:bg-erfor-deep">
              <FileText className="h-4 w-4" />
              Generar informe
            </button>
            <button onClick={load} disabled={loading} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm hover:border-erfor-green disabled:opacity-50 transition">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
          <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-4 flex items-center gap-2 font-semibold">
              <Plus className="h-4 w-4 text-erfor-green" />
              Crear registro
            </div>
            <div className="grid gap-3">
              {(selectedClientId ? config.fields.filter(f => f.name !== "clientId") : config.fields).map((field) => (
                <FieldInput key={field.name} field={field} value={form[field.name] || ""} onChange={(value) => setForm((current) => ({ ...current, [field.name]: value }))} />
              ))}
            </div>
            <button disabled={submitting} className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-erfor-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-erfor-deep disabled:opacity-70">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Guardando..." : `Guardar ${resourceLabel}`}
            </button>
          </form>

          <section className="min-w-0">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex max-w-md flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 focus-within:border-erfor-green transition">
                <Search className="h-4 w-4 text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && load()} className="w-full text-sm outline-none" placeholder="Filtrar registros..." />
              </div>
              <button onClick={load} disabled={loading} className="rounded-md border border-slate-200 px-3 py-2 text-sm hover:border-erfor-green disabled:opacity-50 transition">Buscar</button>
            </div>

            <div className="erfor-scroll overflow-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[760px] border-collapse bg-white text-sm">
                <thead className="bg-erfor-mist text-left text-xs uppercase text-erfor-deep">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="px-4 py-3 font-semibold">
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="max-w-[260px] truncate px-4 py-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">
                        {loading ? "Cargando registros..." : "Sin registros. Crea el primer registro para activar el módulo."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {table.getPageCount() > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 disabled:opacity-50 hover:border-erfor-green transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 disabled:opacity-50 hover:border-erfor-green transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
      <DeleteConfirmationModal
        isOpen={!!rowToDelete}
        onClose={() => setRowToDelete(null)}
        onConfirm={deleteRow}
        itemName={rowToDelete?.name ? String(rowToDelete.name) : "este registro"}
        isDeleting={isDeleting}
      />
    </main>
  );
}

function FieldInput({ field, value, onChange }: { field: Field; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{field.label}{field.required ? " *" : ""}</span>
      {field.type === "textarea" ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-erfor-green transition" />
      ) : field.type === "select" ? (
        <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-erfor-green transition">
          <option value="">Seleccionar</option>
          {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <input type={field.type || "text"} value={value} onChange={(event) => onChange(event.target.value)} required={field.required} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-erfor-green transition" />
      )}
    </label>
  );
}

function formatCell(value: unknown) {
  if (value == null || value === "") return "—";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
