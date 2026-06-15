"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, SendHorizonal, X, Loader2, Sparkles } from "lucide-react";

type Message = {
  role: "user" | "ai";
  content: string;
};

export function AiPanel() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hola, soy tu asistente ambiental. ¿En qué te puedo ayudar hoy?" }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function ask(event?: React.FormEvent, promptOverride?: string) {
    event?.preventDefault();
    const textToUse = promptOverride || input;
    if (!textToUse.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: textToUse }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToUse, conversationId })
      });
      const json = await response.json();
      
      if (response.ok) {
        setConversationId(json.conversationId);
        const fuentes = (json.sources || []).length > 0 ? `\n\nFuentes: ${json.sources.join(", ")}` : "";
        setMessages((prev) => [...prev, { role: "ai", content: `${json.message}${fuentes}` }]);
      } else {
        setMessages((prev) => [...prev, { role: "ai", content: json.error || "No fue posible consultar el asistente." }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "ai", content: "Error de conexión con el asistente." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-erfor-green px-5 py-3 font-semibold text-white shadow-2xl shadow-green-950/25 transition hover:scale-105 hover:bg-erfor-deep"
      >
        <Bot className="h-5 w-5" />
        Asistente IA ERFOR
      </button>
      {open ? (
        <section className="fixed bottom-5 right-5 z-50 flex h-[620px] w-[min(430px,calc(100vw-32px))] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
          <header className="flex items-start justify-between bg-erfor-ink p-5 text-white">
            <div className="flex gap-3 items-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-erfor-green/20">
                <Sparkles className="h-5 w-5 text-erfor-green" />
              </span>
              <div>
                <h2 className="font-semibold">Asistente IA ERFOR</h2>
                <p className="text-sm text-white/68">Especialista en cumplimiento</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Cerrar asistente" className="rounded-md p-1 hover:bg-white/10 transition">
              <X className="h-5 w-5" />
            </button>
          </header>
          
          <div ref={scrollRef} className="erfor-scroll flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-erfor-green text-white rounded-br-none' 
                    : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-none border border-slate-200 bg-slate-100 px-4 py-3 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-erfor-green" />
                </div>
              </div>
            )}
            
            {messages.length === 1 && (
              <div className="mt-4 grid gap-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Sugerencias</p>
                {["Resume este requerimiento de CAR Cundinamarca.", "Genera un borrador de respuesta.", "¿Qué documentos faltan para este trámite?"].map((prompt) => (
                  <button key={prompt} onClick={() => ask(undefined, prompt)} disabled={loading} className="rounded-md border border-slate-200 px-3 py-2 text-left text-sm hover:border-erfor-green hover:bg-slate-50 transition disabled:opacity-50">
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <form onSubmit={(e) => ask(e)} className="border-t border-slate-200 p-4 bg-white">
            <div className="flex gap-2">
              <input 
                value={input} 
                onChange={(event) => setInput(event.target.value)} 
                disabled={loading}
                className="min-w-0 flex-1 rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-erfor-green focus:bg-white transition" 
                placeholder="Escribe tu consulta aquí..."
              />
              <button disabled={loading || !input.trim()} className="flex items-center justify-center rounded-full bg-erfor-green h-10 w-10 text-white disabled:opacity-50 transition hover:bg-erfor-deep">
                <SendHorizonal className="h-4 w-4" />
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </>
  );
}
