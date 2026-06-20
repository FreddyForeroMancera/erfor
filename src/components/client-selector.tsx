"use client";

import { useState, Fragment } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Listbox, Transition } from "@headlessui/react";
import { Check, ChevronDown, Building2, Globe } from "lucide-react";
import { useClient } from "@/lib/client-context";

type ClientLight = {
  id: string;
  name: string;
};

export function ClientSelector() {
  const { selectedClientId, setSelectedClientId } = useClient();
  const { data, error, isLoading: loading } = useSWR<{ items: ClientLight[] }>("/api/clients?limit=100", fetcher);
  const clients = data?.items || [];

  const selected = clients.find((c) => c.id === selectedClientId);

  return (
    <div className="w-[280px]">
      <Listbox value={selectedClientId} onChange={setSelectedClientId}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-default rounded-md border border-slate-200 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-erfor-green focus:outline-none transition sm:text-sm">
            <span className="flex items-center gap-2 truncate">
              {selectedClientId ? <Building2 className="h-4 w-4 text-erfor-green" /> : <Globe className="h-4 w-4 text-erfor-green" />}
              {loading ? "Cargando..." : (selected ? selected.name : "Todos los Clientes (General)")}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
              <Listbox.Option
                className={({ active }) =>
                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                    active ? "bg-erfor-green/10 text-erfor-green" : "text-slate-900"
                  }`
                }
                value={null}
              >
                {({ selected }) => (
                  <>
                    <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                      Todos los Clientes (General)
                    </span>
                    {selected ? (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-erfor-green">
                        <Check className="h-4 w-4" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
              {clients.map((client) => (
                <Listbox.Option
                  key={client.id}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? "bg-erfor-green/10 text-erfor-green" : "text-slate-900"
                    }`
                  }
                  value={client.id}
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                        {client.name}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-erfor-green">
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
