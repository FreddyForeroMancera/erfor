"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import toast from "react-hot-toast";

function ActivarCuentaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("El enlace de activación es inválido o falta el token.");
      router.push("/portal/login");
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Cuenta activada exitosamente");
        // Redirect to login page
        router.push("/portal/login");
      } else {
        toast.error(data.error || "Error al activar la cuenta");
      }
    } catch (error) {
      toast.error("Error de red");
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null; // Avoid rendering if token is missing and waiting for redirect

  return (
    <div className="min-h-screen bg-erfor-deep flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-8">
        <div className="flex justify-center mb-6">
          <BrandLogo variant="dark" size="xl" className="w-max" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">Activa tu cuenta</h2>
        <p className="text-sm text-slate-500 text-center mb-8">
          Establece una contraseña segura para acceder a tu portal exclusivo de clientes ERFOR.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nueva Contraseña</label>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-erfor-green focus:ring-1 focus:ring-erfor-green"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Confirmar Contraseña</label>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-erfor-green focus:ring-1 focus:ring-erfor-green"
                placeholder="Repite la contraseña"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-erfor-green text-white font-medium py-2.5 rounded-lg hover:bg-green-700 transition disabled:opacity-70 mt-6"
          >
            {loading ? "Guardando..." : "Activar Cuenta y Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ActivarCuentaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-erfor-deep flex items-center justify-center p-4 text-white">Cargando...</div>}>
      <ActivarCuentaForm />
    </Suspense>
  );
}
