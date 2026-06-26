"use client";

import { useState, useEffect, Fragment } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { Search, Building2, Map, FolderKanban, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useClient } from "@/lib/client-context";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useDebounce } from "@/lib/hooks/use-debounce";

type SearchResults = {
  clients: any[];
  properties: any[];
  files: any[];
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();
  const { setSelectedClientId } = useClient();

  const { data, isLoading } = useSWR<{ results: SearchResults }>(
    debouncedQuery.length >= 2 ? `/api/search?q=${encodeURIComponent(debouncedQuery)}` : null,
    fetcher
  );

  const results = data?.results;
  const hasResults = results && (results.clients.length > 0 || results.properties.length > 0 || results.files.length > 0);

  const handleSelect = (item: any) => {
    if (!item) return;

    if (item.type === "client") {
      setSelectedClientId(item.id);
      router.push("/dashboard");
    } else if (item.type === "property") {
      if (item.clientId) setSelectedClientId(item.clientId);
      router.push("/predios"); // Ideally /predios/[id] if implemented, but /predios is safe
    } else if (item.type === "file") {
      if (item.clientId) setSelectedClientId(item.clientId);
      router.push(`/expedientes/${item.id}`);
    }
    
    setQuery("");
  };

  // Flatten results for Combobox
  const flattenedResults = [];
  if (results) {
    results.clients.forEach((c: any) => flattenedResults.push({ ...c, type: "client", label: c.name, icon: Building2, color: "text-erfor-green" }));
    results.properties.forEach((p: any) => flattenedResults.push({ ...p, type: "property", label: p.name || p.cadastralCode || 'Predio', icon: Map, color: "text-sky-600" }));
    results.files.forEach((f: any) => flattenedResults.push({ ...f, type: "file", label: f.internalCode || f.officialCode || 'Expediente', icon: FolderKanban, color: "text-amber-600" }));
  }

  return (
    <div className="relative w-full max-w-[300px] z-50">
      <Combobox value={null} onChange={handleSelect}>
        <div className="relative flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 focus-within:border-erfor-green transition">
          <Combobox.Input
            className="w-full bg-transparent text-sm outline-none placeholder-slate-400"
            placeholder="Buscar clientes, expedientes..."
            displayValue={() => query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : (
            <Search className="h-4 w-4 text-slate-400" />
          )}
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery("")}
        >
          <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
            {debouncedQuery.length < 2 && (
              <div className="relative cursor-default select-none py-2 px-4 text-slate-500 text-xs">
                Escribe al menos 2 caracteres...
              </div>
            )}
            
            {debouncedQuery.length >= 2 && !isLoading && !hasResults && (
              <div className="relative cursor-default select-none py-2 px-4 text-slate-500 text-xs text-center">
                No se encontraron resultados.
              </div>
            )}

            {results?.clients.length > 0 && (
              <div className="py-1">
                <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Clientes</div>
                {results.clients.map((client: any) => (
                  <Combobox.Option
                    key={`client-${client.id}`}
                    value={{ ...client, type: 'client' }}
                    className={({ active }) => `relative cursor-default select-none py-2 pl-3 pr-4 flex items-center gap-3 ${active ? "bg-erfor-green/10" : ""}`}
                  >
                    <Building2 className="h-4 w-4 text-erfor-green shrink-0" />
                    <div className="truncate text-slate-800">{client.name}</div>
                  </Combobox.Option>
                ))}
              </div>
            )}

            {results?.files.length > 0 && (
              <div className="py-1">
                <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Expedientes</div>
                {results.files.map((file: any) => (
                  <Combobox.Option
                    key={`file-${file.id}`}
                    value={{ ...file, type: 'file' }}
                    className={({ active }) => `relative cursor-default select-none py-2 pl-3 pr-4 flex items-center gap-3 ${active ? "bg-amber-100" : ""}`}
                  >
                    <FolderKanban className="h-4 w-4 text-amber-600 shrink-0" />
                    <div className="truncate text-slate-800">{file.internalCode || file.officialCode}</div>
                  </Combobox.Option>
                ))}
              </div>
            )}

            {results?.properties.length > 0 && (
              <div className="py-1">
                <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Predios</div>
                {results.properties.map((prop: any) => (
                  <Combobox.Option
                    key={`prop-${prop.id}`}
                    value={{ ...prop, type: 'property' }}
                    className={({ active }) => `relative cursor-default select-none py-2 pl-3 pr-4 flex items-center gap-3 ${active ? "bg-sky-100" : ""}`}
                  >
                    <Map className="h-4 w-4 text-sky-600 shrink-0" />
                    <div className="truncate text-slate-800">{prop.name || prop.cadastralCode || 'Predio sin nombre'}</div>
                  </Combobox.Option>
                ))}
              </div>
            )}
          </Combobox.Options>
        </Transition>
      </Combobox>
    </div>
  );
}
