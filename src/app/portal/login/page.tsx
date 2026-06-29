"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail, FolderKanban, FileText, Bell, UploadCloud } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, source: "portal" })
      });
      setLoading(false);
      
      if (!response.ok) {
        if (response.status === 403) {
          setError("Acceso no autorizado. Si eres parte del equipo ERFOR, usa el panel interno.");
        } else {
          setError("Credenciales inválidas. Verifica tu correo y contraseña.");
        }
        return;
      }
      
      const data = await response.json();
      
      if (data?.user?.role !== "CLIENTE_EXTERNO") {
        setError("Acceso exclusivo para clientes.");
        return;
      } else {
        router.push("/portal");
      }
      router.refresh();
    } catch (err) {
      setLoading(false);
      setError("Ocurrió un error al conectar. Intenta de nuevo.");
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-800">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* Panel Izquierdo: Características y Beneficios */}
        <section className="relative flex flex-col justify-between overflow-hidden bg-erfor-deep p-8 lg:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(47,168,79,.3),transparent_70%)]" />
          
          <div className="relative z-10">
            <BrandLogo variant="light" size="xl" className="w-max" />
            <p className="mt-6 text-2xl font-semibold text-white/95">
              Todo bajo control.
            </p>
            <p className="mt-2 text-white/70 max-w-md">
              Mantente al día con tus procesos ambientales sin complicaciones. Todo lo que necesitas, en un solo lugar.
            </p>

            <div className="mt-12 grid gap-6">
              <FeatureCard 
                icon={FolderKanban} 
                title="Seguimiento en tiempo real" 
                desc="Conoce exactamente en qué fase están tus expedientes y trámites." 
              />
              <FeatureCard 
                icon={FileText} 
                title="Documentos organizados" 
                desc="Encuentra actas, conceptos y autos organizados y seguros." 
              />
              <FeatureCard 
                icon={Bell} 
                title="Alertas de vencimientos" 
                desc="Te avisamos con anticipación para que nunca pierdas una fecha límite." 
              />
              <FeatureCard 
                icon={UploadCloud} 
                title="Carga directa de soportes" 
                desc="Sube tus comprobantes directamente desde la plataforma." 
              />
            </div>
          </div>

          <div className="relative z-10 mt-12 text-sm text-white/60">
            <p className="font-medium text-white/80 border-t border-white/10 pt-4">
              "Más de X empresas confían la tranquilidad de sus trámites en ERFOR."
            </p>
          </div>
        </section>

        {/* Panel Derecho: Login Form */}
        <section className="flex flex-col justify-center bg-slate-50 p-6 lg:p-12 text-slate-800">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-8 text-center">
              <h2 className="mt-2 text-3xl font-bold text-slate-800">Ingreso de Clientes</h2>
              <p className="mt-2 text-sm text-slate-500">Accede a tu Portal de Seguimiento Ambiental</p>
            </div>
            
            <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <label className="mb-5 block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Correo Electrónico</span>
                <span className="flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 focus-within:border-erfor-green focus-within:ring-1 focus-within:ring-erfor-green transition">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <input 
                    className="w-full outline-none text-slate-800 bg-transparent placeholder-slate-400" 
                    type="email" 
                    placeholder="tu@empresa.com"
                    value={email} 
                    onChange={(event) => setEmail(event.target.value)} 
                    required 
                  />
                </span>
              </label>

              <label className="mb-6 block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Contraseña</span>
                <span className="flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 focus-within:border-erfor-green focus-within:ring-1 focus-within:ring-erfor-green transition">
                  <LockKeyhole className="h-5 w-5 text-slate-400" />
                  <input 
                    className="w-full outline-none text-slate-800 bg-transparent placeholder-slate-400" 
                    type="password"
                    placeholder="••••••••"
                    value={password} 
                    onChange={(event) => setPassword(event.target.value)} 
                    required 
                  />
                </span>
              </label>

              {error && (
                <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-100 flex flex-col gap-2">
                  <p>{error}</p>
                  {error.includes("panel interno") && (
                    <Link href="/login" className="font-semibold text-red-800 hover:underline">
                      Ir al panel de consultores &rarr;
                    </Link>
                  )}
                </div>
              )}

              <button 
                type="submit"
                className="w-full rounded-lg bg-erfor-green px-4 py-3.5 font-bold text-white transition hover:bg-green-700 hover:shadow-lg disabled:opacity-70 disabled:hover:shadow-none" 
                disabled={loading}
              >
                {loading ? "Verificando..." : "Acceder a mi portal"}
              </button>
            </form>

            <div className="mt-12 text-center text-sm text-slate-500">
              <Link href="/login" className="font-medium hover:text-erfor-green transition">
                ¿Eres del equipo ERFOR? Ingresa por aquí.
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 mt-1 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h4 className="text-lg font-semibold text-white/95">{title}</h4>
        <p className="mt-1 text-sm text-white/65">{desc}</p>
      </div>
    </div>
  );
}
