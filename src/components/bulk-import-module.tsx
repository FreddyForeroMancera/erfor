"use client";

import { useState, useRef } from "react";
import { UploadCloud, FolderKanban, Users, FileText, Loader2, CheckCircle2, AlertCircle, AlertOctagon } from "lucide-react";
import toast from "react-hot-toast";
import { uploadFileDirect } from "@/lib/direct-upload";

type ParsedDocument = {
  name: string;
  statusFolder: string;
  path: string;
  fileObj?: File;
};

type ParsedExpediente = {
  internalCode: string;
  documents: ParsedDocument[];
};

type ParsedClient = {
  name: string;
  expedientes: ParsedExpediente[];
  datosCsv?: string;
};

// Archivo de datos preestablecidos (representante legal, predio, dirección, etc. ya
// conocidos) ubicado directamente en la carpeta del cliente: RootFolder/ClienteX/datos.csv.
// Tiene prioridad sobre lo que la IA intente extraer de los documentos después.
const CSV_DATA_FILENAME = "datos.csv";

// Archivos de sistema / temporales de Office que el SO o Word/Excel crean automáticamente
// y que nunca son documentos reales del cliente (el archivo real, con el mismo nombre sin
// el prefijo, es el que sí importa). Se descartan en silencio, sin reportarlos como
// "ignorados" (evita ruido en la advertencia de estructura).
const SYSTEM_JUNK_EXACT = [".ds_store", "thumbs.db", "desktop.ini"];
function isJunkFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  if (SYSTEM_JUNK_EXACT.includes(lower)) return true;
  // Archivo de bloqueo de Word/Excel: "~$Nombre real.docx" mientras alguien lo tiene abierto.
  if (fileName.startsWith("~$")) return true;
  // Archivo temporal de recuperación/autoguardado de Word: "~WRL0001.tmp".
  if (/^~wrl\d+\.tmp$/i.test(fileName)) return true;
  return false;
}

export function BulkImportModule() {
  const [clients, setClients] = useState<ParsedClient[]>([]);
  const [skippedFiles, setSkippedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setAnalyzing(true);

    // Simulate a small delay for UI purposes if it's too fast
    await new Promise(r => setTimeout(r, 500));

    const clientMap = new Map<string, ParsedClient>();
    const skipped: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const pathParts = file.webkitRelativePath.split("/");
      const currentFileName = pathParts[pathParts.length - 1];

      // Filtro universal: un archivo de bloqueo/temporal de Office (ej. "~$Auto de
      // inicio.docx") o de sistema puede aparecer en CUALQUIER nivel, incluso dentro de
      // una carpeta de expediente válida. Si no se descarta aquí, se subiría como si
      // fuera un documento real del cliente.
      if (isJunkFile(currentFileName)) continue;

      // Archivo de datos preestablecidos directamente en la carpeta del cliente:
      // RootFolder / ClientName / datos.csv
      if (pathParts.length === 3 && pathParts[2].toLowerCase() === CSV_DATA_FILENAME) {
        const clientName = pathParts[1];
        if (!clientMap.has(clientName)) {
          clientMap.set(clientName, { name: clientName, expedientes: [] });
        }
        clientMap.get(clientName)!.datosCsv = await file.text();
        continue;
      }

      // Estructura esperada: CarpetaRaiz / Cliente / Expediente / [Estado] / Archivo.
      // Un archivo que no llega a ese nivel (ej. suelto directo en la carpeta del cliente,
      // sin subcarpeta de expediente) antes se descartaba en total silencio -> el consultor
      // veía "Estructura analizada" como si todo hubiera entrado, sin saber que faltaba
      // algo. Ahora se reporta explícitamente para que decida si reorganiza esa carpeta.
      if (pathParts.length < 4) {
        skipped.push(file.webkitRelativePath);
        continue;
      }

      const rootFolder = pathParts[0];
      const clientName = pathParts[1];
      const expedienteName = pathParts[2];
      
      // If there are 5 parts, the 3rd index is the status folder. If 4, there is no status folder.
      let statusFolder = "PREPARATION";
      let fileName = "";
      
      if (pathParts.length >= 5) {
        statusFolder = pathParts[pathParts.length - 2];
        fileName = pathParts[pathParts.length - 1];
      } else {
        fileName = pathParts[pathParts.length - 1];
      }

      if (!clientMap.has(clientName)) {
        clientMap.set(clientName, { name: clientName, expedientes: [] });
      }

      const client = clientMap.get(clientName)!;
      let expediente = client.expedientes.find(e => e.internalCode === expedienteName);

      if (!expediente) {
        expediente = { internalCode: expedienteName, documents: [] };
        client.expedientes.push(expediente);
      }

      expediente.documents.push({
        name: fileName,
        statusFolder,
        path: file.webkitRelativePath,
        fileObj: file
      });
    }

    setClients(Array.from(clientMap.values()));
    setSkippedFiles(skipped);
    setAnalyzing(false);

    if (clientMap.size === 0) {
      toast.error("No se encontraron clientes ni expedientes en la estructura de la carpeta.");
    } else {
      toast.success(`Estructura analizada: ${clientMap.size} clientes encontrados.`);
    }
    if (skipped.length > 0) {
      toast.error(
        `${skipped.length} archivo(s) no encajan en la estructura Cliente/Expediente/Archivo y NO se van a subir. Revisa el detalle abajo.`,
        { duration: 10000 }
      );
    }
  };

  const handleUpload = async () => {
    if (clients.length === 0) return;
    setLoading(true);
    setUploadProgress(`Iniciando importación...`);

    try {
      let totalProcessedKeys = 0;
      let totalAlreadyAnalyzedKeys = 0;
      let totalClientsCreated = 0;
      let totalExpedientesCreated = 0;

      // Subir en bloques: un cliente por petición para evitar Timeout o Payload Too Large
      for (let i = 0; i < clients.length; i++) {
        setUploadProgress(`Importando cliente ${i + 1} de ${clients.length}... (${clients[i].name})`);
        const res = await fetch("/api/import/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clients: [clients[i]] }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error en la importación");

        totalClientsCreated += data.results?.clientsCreated || 0;
        totalExpedientesCreated += data.results?.expedientesCreated || 0;

        // Cargar documentos clave para OCR/IA automático. Se suben (a) los PDF cuyo nombre
        // trae palabra clave procedimental y (b) los Word/Excel, que suelen contener el
        // formato de solicitud con el nombre del predio, propietario y representante legal.
        setUploadProgress("Importación base completada. Procesando documentos clave con IA...");
        const keywords = ["auto", "resolucion", "resolución", "concepto", "requerimiento", "indagacion", "indagación"];
        const isOfficeDoc = (name: string) => /\.(docx?|xlsx?)$/i.test(name);
        const isGeoDoc = (name: string) => /\.(kml|kmz)$/i.test(name);

        let processedKeys = 0;
        let alreadyAnalyzedKeys = 0;
        if (data.tree) {
          for (const clientNode of data.tree) {
            for (const expNode of clientNode.expedientes) {
              const parsedClient = clients.find(c => c.name === clientNode.name);
              const parsedExp = parsedClient?.expedientes.find(e => e.internalCode === expNode.internalCode);

              if (parsedExp) {
                for (const doc of parsedExp.documents) {
                  const nameLower = doc.name.toLowerCase();
                  const shouldAnalyze = keywords.some(k => nameLower.includes(k)) || isOfficeDoc(doc.name) || isGeoDoc(doc.name);
                  if (doc.fileObj && shouldAnalyze) {
                    try {
                      // Sube directo del navegador a Supabase Storage (sin pasar por el body
                      // de la función serverless), así los PDF escaneados grandes no chocan
                      // con el límite de 4.5 MB de Vercel. doc.name = nombre base ya aislado
                      // (doc.fileObj.name trae la ruta relativa completa, no solo el archivo).
                      await uploadFileDirect(
                        doc.fileObj,
                        {
                          environmentalFileId: expNode.id,
                          clientId: clientNode.id,
                          category: "Documento ambiental"
                        },
                        doc.name
                      );
                      processedKeys++;
                    } catch (e) {
                      console.error("Error subiendo documento clave", e);
                      alreadyAnalyzedKeys++;
                    }
                  }
                }
              }
            }
          }
        }
        totalProcessedKeys += processedKeys;
        totalAlreadyAnalyzedKeys += alreadyAnalyzedKeys;
      }

      const totalClients = clients.length;
      const totalExpedientesCount = totalExpedientes;
      const existingClients = totalClients - totalClientsCreated;
      const existingExpedientes = totalExpedientesCount - totalExpedientesCreated;

      const parts: string[] = [];
      if (totalClientsCreated > 0 || totalExpedientesCreated > 0) {
        parts.push(`${totalClientsCreated} clientes y ${totalExpedientesCreated} expedientes nuevos.`);
      }
      if (existingClients > 0 || existingExpedientes > 0) {
        parts.push(`${existingClients} clientes y ${existingExpedientes} expedientes ya existían y no se duplicaron.`);
      }
      if (totalProcessedKeys > 0) {
        parts.push(`Se procesaron ${totalProcessedKeys} documentos con IA.`);
      }
      if (totalAlreadyAnalyzedKeys > 0) {
        parts.push(`${totalAlreadyAnalyzedKeys} documentos clave ya habían sido subidos y analizados antes, se omitieron.`);
      }

      setSuccess(true);
      toast.success(`¡Importación completada! ${parts.join(" ")}`, { duration: 8000 });
    } catch (error: any) {
      toast.error(error.message || "Ocurrió un error en la carga masiva");
    } finally {
      setLoading(false);
      setUploadProgress("");
    }
  };

  const totalExpedientes = clients.reduce((acc, client) => acc + client.expedientes.length, 0);
  const totalDocuments = clients.reduce((acc, client) => acc + client.expedientes.reduce((acc2, exp) => acc2 + exp.documents.length, 0), 0);

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-erfor-green" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Importación Completada</h2>
        <p className="text-slate-600 mb-8 text-center max-w-md">
          Toda la estructura de expedientes y clientes ha sido creada en la base de datos con éxito.
        </p>
        <button
          onClick={() => { setSuccess(false); setClients([]); setSkippedFiles([]); }}
          className="bg-erfor-green text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition"
        >
          Realizar otra importación
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 text-center border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Carga Masiva de Directorios</h2>
          <p className="text-slate-600 text-sm max-w-2xl mx-auto mb-6">
            Sube una carpeta desde tu computador. El sistema usará la jerarquía de las subcarpetas para deducir automáticamente a los clientes, los expedientes, los estados y agrupará los documentos correspondientes.
          </p>
          
          <div className="relative">
            <input 
              type="file" 
              // @ts-ignore - webkitdirectory is non-standard but supported by all modern browsers
              webkitdirectory="true" 
              directory=""
              multiple
              ref={fileInputRef}
              onChange={handleFolderSelect}
              className="hidden"
              id="folder-upload"
            />
            <label 
              htmlFor="folder-upload"
              className="inline-flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-700 transition cursor-pointer"
            >
              <UploadCloud className="h-5 w-5" />
              Seleccionar Carpeta Principal
            </label>
          </div>
        </div>

        {analyzing && (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-erfor-green mb-4" />
            <p>Analizando estructura del directorio...</p>
          </div>
        )}

        {!analyzing && clients.length === 0 && skippedFiles.length > 0 && (
          <div className="p-8">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertOctagon className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-red-900">
                    No se detectó ningún cliente/expediente — {skippedFiles.length} archivo(s) fuera de estructura
                  </h4>
                  <p className="text-sm text-red-700 mt-1">
                    La carpeta seleccionada debe ser la raíz que contiene <span className="font-mono">Cliente / Expediente / Archivo</span>.
                    Si seleccionaste directamente una carpeta de cliente o de expediente, sube un nivel y vuelve a intentar.
                  </p>
                  <ul className="mt-3 max-h-40 overflow-y-auto text-xs text-red-800 font-mono space-y-1 bg-white/60 rounded p-2 border border-red-100">
                    {skippedFiles.slice(0, 50).map((path, i) => (
                      <li key={i} className="truncate" title={path}>{path}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {!analyzing && clients.length > 0 && (
          <div className="p-8">
            <div className="flex items-center gap-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <AlertCircle className="h-6 w-6 text-blue-500 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900">Resumen del Análisis</h4>
                <p className="text-sm text-blue-700">Revisa la estructura detectada antes de confirmar la carga al servidor.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-center gap-4">
                <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Clientes Encontrados</p>
                  <p className="text-2xl font-bold text-slate-800">{clients.length}</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-center gap-4">
                <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
                  <FolderKanban className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Nuevos Expedientes</p>
                  <p className="text-2xl font-bold text-slate-800">{totalExpedientes}</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-center gap-4">
                <div className="bg-sky-100 p-3 rounded-full text-sky-600">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Documentos Físicos</p>
                  <p className="text-2xl font-bold text-slate-800">{totalDocuments}</p>
                </div>
              </div>
            </div>

            {skippedFiles.length > 0 && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertOctagon className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-red-900">
                      {skippedFiles.length} archivo(s) NO se van a subir
                    </h4>
                    <p className="text-sm text-red-700 mt-1">
                      La estructura esperada es <span className="font-mono">Cliente / Expediente / Archivo</span> (con una
                      carpeta de estado opcional entre expediente y archivo). Estos archivos están un nivel más arriba o más
                      abajo de lo esperado y no se pudieron asociar a un cliente/expediente. Muévelos dentro de la carpeta
                      de un expediente, o súbelos manualmente después desde la ficha del expediente correspondiente.
                    </p>
                    <ul className="mt-3 max-h-40 overflow-y-auto text-xs text-red-800 font-mono space-y-1 bg-white/60 rounded p-2 border border-red-100">
                      {skippedFiles.map((path, i) => (
                        <li key={i} className="truncate" title={path}>{path}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-6 border-t border-slate-200">
              <button
                onClick={() => { setClients([]); setSkippedFiles([]); }}
                className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition mr-3"
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                onClick={handleUpload}
                disabled={loading}
                className="flex items-center gap-2 bg-erfor-green text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                {loading ? (uploadProgress || "Procesando e Importando...") : "Confirmar y Subir Archivos"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
