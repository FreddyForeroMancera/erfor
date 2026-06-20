"use client";

import { useState, useMemo, Fragment } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Loader2, X, MapPin, Clock, Tag } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import { useClient } from "@/lib/client-context";
import toast from "react-hot-toast";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";

type CalendarEvent = {
  id: string;
  type: string;
  title: string;
  date: string;
  status: string;
  priority: string;
};

export function CalendarModule({ fileId, embedded }: { fileId?: string; embedded?: boolean }) {
  const { selectedClientId } = useClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const queryParams = new URLSearchParams();
  if (selectedClientId) queryParams.set("clientId", selectedClientId);
  if (fileId) queryParams.set("fileId", fileId);
  const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
  
  const { data, error, isLoading: loading } = useSWR(`/api/calendar${query}`, fetcher);
  const events = (data || []).filter((e: CalendarEvent) => e);
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getDayEvents = (d: Date) => {
    return events.filter((e: CalendarEvent) => e.date && isSameDay(parseISO(e.date), d));
  };

  const getEventColor = (type: string, priority: string) => {
    if (type === "ALERTA" && priority === "CRITICAL") return "bg-red-100 text-red-700 border-red-200";
    if (type === "VISITA") return "bg-green-100 text-green-700 border-green-200";
    if (type === "TRAMITE") return "bg-sky-100 text-sky-700 border-sky-200";
    if (type === "OBLIGACION") return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-slate-100 text-slate-700 border-slate-200"; // TAREA
  };

  return (
    <div className={`flex flex-col ${embedded ? "h-[600px]" : "p-4 lg:p-6 xl:p-8 h-[calc(100vh-4rem)]"}`}>
      {!embedded && (
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-erfor-green" />
              Calendario y Alertas
            </h1>
            <p className="text-slate-500 text-sm mt-1">Visión consolidada de vencimientos, visitas y compromisos</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={today} className="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">Hoy</button>
            <div className="flex items-center border border-slate-200 rounded-md overflow-hidden">
              <button onClick={prevMonth} className="p-1.5 hover:bg-slate-50 transition-colors"><ChevronLeft className="h-5 w-5 text-slate-600" /></button>
              <span className="px-4 py-1.5 font-medium text-slate-700 min-w-[140px] text-center capitalize">
                {format(currentDate, "MMMM yyyy", { locale: es })}
              </span>
              <button onClick={nextMonth} className="p-1.5 hover:bg-slate-50 transition-colors"><ChevronRight className="h-5 w-5 text-slate-600" /></button>
            </div>
            <button className="ml-2 flex items-center gap-2 bg-erfor-green text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition-colors shadow-sm">
              <Plus className="h-4 w-4" />
              Nuevo Evento
            </button>
          </div>
        </div>
      )}

      {embedded && (
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-erfor-green" />
            Calendario del Expediente
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={today} className="px-2 py-1 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">Hoy</button>
            <div className="flex items-center border border-slate-200 rounded-md overflow-hidden text-sm">
              <button onClick={prevMonth} className="p-1 hover:bg-slate-50 transition-colors"><ChevronLeft className="h-4 w-4 text-slate-600" /></button>
              <span className="px-3 py-1 font-medium text-slate-700 min-w-[110px] text-center capitalize">
                {format(currentDate, "MMM yyyy", { locale: es })}
              </span>
              <button onClick={nextMonth} className="p-1 hover:bg-slate-50 transition-colors"><ChevronRight className="h-4 w-4 text-slate-600" /></button>
            </div>
            <button className="ml-1 flex items-center gap-1.5 bg-erfor-green text-white px-3 py-1.5 text-xs rounded-md font-medium hover:bg-green-700 transition-colors shadow-sm">
              <Plus className="h-3 w-3" />
              Nuevo Evento
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-erfor-green" />
          </div>
        )}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(dayName => (
            <div key={dayName} className="py-3 text-center text-sm font-semibold text-slate-600 border-r border-slate-200 last:border-r-0">
              {dayName}
            </div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto">
          {days.map((d, i) => {
            const isCurrentMonth = isSameMonth(d, currentDate);
            const isToday = isSameDay(d, new Date());
            const dayEvents = getDayEvents(d);

            return (
              <div 
                key={i} 
                className={`min-h-[120px] p-2 border-b border-r border-slate-200 last:border-r-0 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col
                  ${!isCurrentMonth ? "bg-slate-50/50 text-slate-400" : "bg-white text-slate-700"}
                `}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-erfor-green text-white" : ""}`}>
                    {format(d, "d")}
                  </span>
                  {dayEvents.length > 0 && <span className="text-xs font-bold text-slate-400">{dayEvents.length}</span>}
                </div>
                <div className="flex flex-col gap-1 overflow-y-auto flex-1 no-scrollbar">
                  {dayEvents.slice(0, 4).map((evt: CalendarEvent, idx: number) => (
                    <div 
                      key={evt.id} 
                      onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt); }}
                      className={`text-xs px-2 py-1 rounded truncate border cursor-pointer hover:opacity-80 transition-opacity ${getEventColor(evt.type, evt.priority)}`} 
                      title={evt.title}
                    >
                      <span className="font-bold mr-1">{evt.type.substring(0,3)}:</span>
                      {evt.title}
                    </div>
                  ))}
                  {dayEvents.length > 4 && (
                    <div className="text-xs text-slate-500 font-medium pl-1">+ {dayEvents.length - 4} más</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Transition appear show={!!selectedEvent} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setSelectedEvent(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-erfor-ink/60 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-5">
                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-slate-900">
                      Detalles del Evento
                    </Dialog.Title>
                    <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {selectedEvent && (
                    <div className="space-y-4">
                      <div>
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getEventColor(selectedEvent.type, selectedEvent.priority)}`}>
                          {selectedEvent.type} - {selectedEvent.priority === "CRITICAL" ? "CRÍTICO" : selectedEvent.priority === "HIGH" ? "ALTO" : selectedEvent.priority === "MEDIUM" ? "MEDIO" : "BAJO"}
                        </span>
                      </div>
                      
                      <h4 className="text-xl font-bold text-erfor-deep">{selectedEvent.title}</h4>
                      
                      <div className="flex flex-col gap-3 mt-4 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span className="capitalize"><strong>Fecha:</strong> {format(parseISO(selectedEvent.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span><strong>Ubicación:</strong> Predio Asignado (Simulado)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Tag className="h-4 w-4 text-slate-400" />
                          <span><strong>Estado actual:</strong> {selectedEvent.status === "PENDING" ? "Pendiente" : selectedEvent.status === "SCHEDULED" ? "Programado" : selectedEvent.status === "OVERDUE" ? "Vencido" : selectedEvent.status}</span>
                        </div>
                      </div>

                      <div className="mt-6 pt-5 border-t border-slate-100 flex justify-end gap-3">
                        <button onClick={() => setSelectedEvent(null)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                          Cerrar
                        </button>
                        <button onClick={() => toast.success("Simulación: Redirigiendo al expediente...")} className="px-4 py-2 text-sm font-medium text-white bg-erfor-green rounded-lg hover:bg-green-700 transition-colors shadow-sm shadow-green-900/20">
                          Ver Expediente
                        </button>
                      </div>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
