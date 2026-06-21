"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, LockKeyhole, Mail } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("erwin@erfor.co");
  const [password, setPassword] = useState("Erfor2026!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await login(email, password);
  }

  async function demoLogin() {
    const demoEmail = "erwin@erfor.co";
    const demoPassword = "Erfor2026!";
    setEmail(demoEmail);
    setPassword(demoPassword);
    await login(demoEmail, demoPassword);
  }

  async function login(loginEmail: string, loginPassword: string) {
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail, password: loginPassword })
    });
    setLoading(false);
    if (!response.ok) {
      setError("Credenciales inválidas o seed pendiente.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-erfor-ink text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative flex flex-col justify-between overflow-hidden p-8 lg:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(47,168,79,.26),transparent_34%),linear-gradient(135deg,rgba(6,44,40,.96),rgba(4,20,24,.98))]" />
          <div className="relative">
            <BrandLogo variant="light" className="w-max" />
            <p className="mt-3 max-w-sm text-lg text-white/82">Plataforma Integral de Asesoría Ambiental</p>
          </div>
          <div className="relative max-w-xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-white/78">
              <Leaf className="h-4 w-4 text-erfor-lime" />
              Cumplimiento, sostenibilidad y confianza
            </div>
            <h1 className="text-4xl font-semibold leading-tight lg:text-6xl">Control Agroambiental Empresarial</h1>
            <p className="mt-5 text-lg leading-8 text-white/72">
              Administración de Clientes
            </p>
          </div>
          <p className="relative text-sm text-white/55">Gestión · Cumplimiento · Sostenibilidad</p>
        </section>

        <section className="flex items-center justify-center bg-[#f6f8f7] p-6 text-erfor-ink">
          <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-black/8 bg-white p-8 shadow-soft">
            <div className="mb-8">
              <BrandLogo variant="dark" className="mb-6 w-max" />
              <p className="text-sm font-semibold text-erfor-green">Bienvenido</p>
              <h2 className="mt-2 text-3xl font-semibold">Ingreso de Erwin Forero</h2>
              <p className="mt-2 text-sm text-slate-500">Acceso seguro a la plataforma Agroambiental.</p>
            </div>
            <label className="mb-4 block">
              <span className="mb-2 block text-sm font-medium">Correo</span>
              <span className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <input className="w-full outline-none" value={email} onChange={(event) => setEmail(event.target.value)} />
              </span>
            </label>
            <label className="mb-6 block">
              <span className="mb-2 block text-sm font-medium">Contraseña</span>
              <span className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
                <LockKeyhole className="h-4 w-4 text-slate-400" />
                <input className="w-full outline-none" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </span>
            </label>
            {error ? <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
            <button className="w-full rounded-md bg-erfor-green px-4 py-3 font-semibold text-white transition hover:bg-erfor-deep" disabled={loading}>
              {loading ? "Validando..." : "Iniciar sesión"}
            </button>
            <button
              type="button"
              onClick={demoLogin}
              className="mt-3 w-full rounded-md border border-erfor-green bg-erfor-mist px-4 py-3 font-semibold text-erfor-green transition hover:bg-white"
              disabled={loading}
            >
              Acceso DEMO
            </button>
            <p className="mt-3 text-center text-xs text-slate-500">
              Ingresa como Erwin Forero para presentar el flujo completo de la plataforma.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
