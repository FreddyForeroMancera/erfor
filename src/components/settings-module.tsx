"use client";

import { useState, useEffect } from "react";
import { Building, Bell, Bot, Plug, Shield, Save, User, Mail, Smartphone, Globe, Lock, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";
import { BulkImportModule } from "@/components/bulk-import-module";
import { ReanalyzeAllModule } from "@/components/reanalyze-all-module";

export function SettingsModule() {
  const [activeTab, setActiveTab] = useState("perfil");

  const [companyData, setCompanyData] = useState({
    name: "ERFOR Consultores Ambientales",
    nit: "900.123.456-7",
    address: "Calle 100 # 15-20, Bogotá",
    adminName: "Erwin Forero",
    adminEmail: "contacto@erfor.com"
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("erfor_settings");
      if (saved) {
        setCompanyData(JSON.parse(saved));
      }
    }
  }, []);

  const tabs = [
    { id: "perfil", label: "Perfil y Empresa", icon: Building },
    { id: "notificaciones", label: "Notificaciones", icon: Bell },
    { id: "ia", label: "Asistente IA", icon: Bot },
    { id: "integraciones", label: "Integraciones", icon: Plug },
    { id: "usuarios", label: "Usuarios y Roles", icon: Shield },
    { id: "importacion", label: "Carga Masiva", icon: UploadCloud },
  ];

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("erfor_settings", JSON.stringify(companyData));
    }
    toast.success("Configuración guardada correctamente");
  };

  return (
    <div className="p-4 lg:p-6 xl:p-8 flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Configuración del Sistema
          </h1>
          <p className="text-slate-500 text-sm mt-1">Administra las preferencias, notificaciones y usuarios de ERFOR.</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 bg-erfor-green text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition-colors shadow-sm">
          <Save className="h-4 w-4" />
          Guardar Cambios
        </button>
      </div>

      <div className="flex flex-1 flex-col md:flex-row gap-6 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0 overflow-y-auto">
          <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-erfor-mist text-erfor-green border border-erfor-green/20"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                }`}
              >
                <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? "text-erfor-green" : "text-slate-400"}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-y-auto p-6 md:p-8">
          
          {activeTab === "perfil" && (
            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Información de la Empresa</h2>
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Empresa</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-4 w-4 text-slate-400" />
                      </div>
                      <input type="text" value={companyData.name} onChange={(e) => setCompanyData({...companyData, name: e.target.value})} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-erfor-green focus:border-erfor-green text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">NIT</label>
                    <input type="text" value={companyData.nit} onChange={(e) => setCompanyData({...companyData, nit: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-erfor-green focus:border-erfor-green text-sm" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dirección Principal</label>
                  <input type="text" value={companyData.address} onChange={(e) => setCompanyData({...companyData, address: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-erfor-green focus:border-erfor-green text-sm" />
                </div>

                <h2 className="text-lg font-bold text-slate-800 mb-4 mt-8 border-b border-slate-100 pb-2">Perfil del Administrador</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-slate-400" />
                      </div>
                      <input type="text" value={companyData.adminName} onChange={(e) => setCompanyData({...companyData, adminName: e.target.value})} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-erfor-green focus:border-erfor-green text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <input type="email" value={companyData.adminEmail} onChange={(e) => setCompanyData({...companyData, adminEmail: e.target.value})} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-erfor-green focus:border-erfor-green text-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notificaciones" && (
            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Preferencias de Alertas</h2>
              <div className="space-y-6">
                {[
                  { title: "Vencimientos de Trámites", desc: "Recibir correos 15 días antes de cada vencimiento crítico." },
                  { title: "Reportes Mensuales", desc: "Generación automática del PDF consolidado el día 1 de cada mes." },
                  { title: "Alertas de IA", desc: "Notificaciones inmediatas cuando la IA detecte anomalías en consumos." },
                  { title: "Actualizaciones Normativas", desc: "Boletín semanal con nuevas leyes o decretos ambientales." }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-erfor-green"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "ia" && (
            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Configuración del Asistente</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Modelo de Inteligencia Artificial (RAG)</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-erfor-green focus:border-erfor-green text-sm">
                    <option>ERFOR Legal Engine (Optimizado para Normativa Colombia)</option>
                    <option>OpenAI GPT-4o</option>
                    <option>Anthropic Claude 3.5</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-2">El motor propietario de ERFOR garantiza privacidad de datos de tus clientes y precisión legal.</p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                  <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">Privacidad de Datos</h4>
                    <p className="text-xs text-amber-700 mt-1">
                      Todos los expedientes subidos al Asistente IA están protegidos bajo cifrado AES-256. Ningún dato de cliente se utiliza para entrenar modelos públicos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "integraciones" && (
            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Conexiones Externas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "VITAL (ANLA)", status: "Conectado", date: "Sincronización activa" },
                  { name: "Google Drive", status: "Conectado", date: "Sincronizando 12 GB" },
                  { name: "SINA Oficial", status: "Desconectado", date: "Requiere token API" },
                  { name: "Sistemas IDEAM", status: "Conectado", date: "Reportes meteorológicos" }
                ].map((int, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Globe className="h-5 w-5 text-slate-600" />
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${int.status === "Conectado" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                        {int.status}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{int.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">{int.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "usuarios" && (
            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-2">
                <h2 className="text-lg font-bold text-slate-800">Directorio de Usuarios</h2>
                <button className="text-xs font-bold text-erfor-green hover:underline">Invitar Usuario +</button>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { name: "Erwin Forero", role: "Super Administrador", email: "admin@erfor.com" },
                  { name: "María González", role: "Auditora Ambiental", email: "mgonzalez@erfor.com" },
                  { name: "Carlos López", role: "Cliente (Hacienda)", email: "gerencia@laesperanza.com" }
                ].map((user, i) => (
                  <div key={i} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "importacion" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <BulkImportModule />
              <ReanalyzeAllModule />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
