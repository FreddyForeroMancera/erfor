import "server-only";

const TENANT_ID = process.env.ONEDRIVE_TENANT_ID;
const CLIENT_ID = process.env.ONEDRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.ONEDRIVE_CLIENT_SECRET;
const DRIVE_ID = process.env.ONEDRIVE_DRIVE_ID;

let accessToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Autentica contra Azure AD para obtener un token de acceso a Microsoft Graph
 */
async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("OneDrive credentials are not configured in environment variables.");
  }

  const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to get access token: ${err}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  // Expira en (expires_in) segundos. Restamos 5 min por seguridad.
  tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;

  return accessToken!;
}

/**
 * Busca archivos nuevos o modificados en un Drive o Carpeta específica
 */
export async function fetchLatestFilesFromOneDrive(folderPath: string = "/AgroAmbiental_Sync") {
  const token = await getAccessToken();
  
  // Microsoft Graph API Endpoint para listar los hijos de un path específico
  const url = `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:${folderPath}:/children`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch from OneDrive: ${response.statusText}`);
  }

  const data = await response.json();
  return data.value; // Arreglo de DriveItems
}

/**
 * Descarga el contenido físico de un archivo de OneDrive dado su ID
 */
export async function downloadFileFromOneDrive(fileId: string): Promise<ArrayBuffer> {
  const token = await getAccessToken();
  const url = `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${fileId}/content`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download file from OneDrive: ${response.statusText}`);
  }

  return await response.arrayBuffer();
}

/**
 * Elimina un archivo de OneDrive
 */
export async function deleteFileFromOneDrive(fileId: string): Promise<void> {
  const token = await getAccessToken();
  const url = `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${fileId}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete file from OneDrive: ${response.statusText}`);
  }
}
