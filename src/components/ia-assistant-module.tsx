"use client";

import { useState } from "react";
import { Bot, Send, User, Upload, Search, FileText, Zap, ChevronRight, Loader2 } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function IaAssistantModule() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "¡Hola, Erwin! Soy tu Asistente Ambiental ERFOR. Puedo ayudarte a analizar documentos, extraer obligaciones legales, preparar informes técnicos o responder dudas normativas.\n\n¿En qué te puedo ayudar hoy?"
    }
  ]);
  const [loading, setLoading] = useState(false);

  const suggestions = [
    { title: "Analizar resolución ANLA", icon: FileText, text: "Extraer obligaciones de la resolución reciente" },
    { title: "Verificar matriz legal", icon: Search, text: "Revisar cumplimiento del Lote Industrial" },
    { title: "Generar reporte", icon: Zap, text: "Crear borrador del reporte mensual de vertimientos" }
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    const newMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages(prev => [...prev, newMsg]);
    setQuery("");
    setLoading(true);

    // Simulador de respuesta
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Entendido. Estoy analizando tu solicitud en la base de datos de expedientes y la matriz normativa de ERFOR...\n\n(Esta es una respuesta simulada para demostración. En producción, la IA procesará la orden, consultará RAG de documentos y entregará la información estructurada)."
        }
      ]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white">
      <div className="border-b border-slate-200 p-4 lg:px-8 py-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-erfor-mist flex items-center justify-center">
            <Bot className="h-6 w-6 text-erfor-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">IA Asistente Ambiental</h1>
            <p className="text-sm text-slate-500">Agente experto en normativa y gestión ERFOR</p>
          </div>
        </div>
        <div className="hidden md:flex gap-2">
          <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Mis Conversaciones
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-8 erfor-scroll bg-[#fbfcfc]">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${msg.role === "assistant" ? "bg-erfor-green text-white shadow-md shadow-green-900/20" : "bg-slate-200 text-slate-600"}`}>
                {msg.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
              </div>
              <div className={`px-5 py-4 rounded-2xl max-w-[85%] whitespace-pre-wrap text-sm leading-relaxed ${
                msg.role === "assistant" ? "bg-white border border-slate-200 text-slate-700 shadow-sm" : "bg-erfor-ink text-white"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4">
              <div className="h-10 w-10 shrink-0 rounded-full bg-erfor-green text-white flex items-center justify-center shadow-md shadow-green-900/20">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div className="px-5 py-4 rounded-2xl bg-white border border-slate-200 flex items-center gap-2 shadow-sm">
                <span className="h-2 w-2 bg-slate-300 rounded-full animate-bounce"></span>
                <span className="h-2 w-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="h-2 w-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 lg:px-8 pb-8 shrink-0 bg-white">
        <div className="max-w-4xl mx-auto">
          {messages.length === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              {suggestions.map((s, i) => (
                <button 
                  key={i}
                  onClick={() => handleSend(s.title + ": " + s.text)}
                  className="text-left p-4 rounded-xl border border-slate-200 hover:border-erfor-green hover:shadow-md transition bg-white group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <s.icon className="h-5 w-5 text-erfor-green transition group-hover:scale-110" />
                    <span className="font-bold text-sm text-slate-800">{s.title}</span>
                  </div>
                  <p className="text-xs text-slate-500">{s.text}</p>
                </button>
              ))}
            </div>
          )}
          
          <div className="relative flex items-center bg-white border border-slate-300 focus-within:border-erfor-green focus-within:ring-1 focus-within:ring-erfor-green rounded-2xl shadow-sm overflow-hidden transition-all">
            <button className="p-4 text-slate-400 hover:text-erfor-green transition-colors">
              <Upload className="h-5 w-5" />
            </button>
            <input 
              type="text" 
              className="flex-1 py-4 bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
              placeholder="Pregunta sobre normativa, trámites o sube un documento para analizar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(query); }}
            />
            <button 
              onClick={() => handleSend(query)}
              disabled={!query.trim()}
              className="m-2 p-3 bg-erfor-green text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:hover:bg-erfor-green"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-3">
            El asistente ambiental puede cometer errores. Verifica la información normativa oficial.
          </p>
        </div>
      </div>
    </div>
  );
}
