import axios from 'axios';
import crypto from 'crypto';

const B2_CONFIG = {
  accountId: process.env.B2_ACCOUNT_ID || '',
  applicationKey: process.env.B2_APPLICATION_KEY || '',
  bucketName: process.env.B2_BUCKET_NAME || '',
  bucketId: process.env.B2_BUCKET_ID || '',
  apiUrl: 'https://api005.backblazeb2.com',
};

export const FOLDER_STRUCTURE = {
  ENTRADA: '00_ENTRADA',
  CATALOGADO: '01_CATALOGADO',
  PRODUCAO: '02_PRODUCAO',
  PUBLICADO: '03_PUBLICADO',
  ARQUIVADO: '04_ARQUIVADO',
  THUMBNAILS: 'thumbnails',
} as const;

export interface B2AuthResponse {
  authorizationToken: string;
  apiUrl: string;
  downloadUrl: string;
}

export interface PresignedUpload {
  uploadUrl: string;
  authorizationToken: string;
  fileName: string;
  filePath: string;
}

let authCache: { token: string; apiUrl: string; downloadUrl: string; expiresAt: number } | null = null;

export async function authorizeB2(): Promise<B2AuthResponse> {
  if (authCache && authCache.expiresAt > Date.now()) {
    return {
      authorizationToken: authCache.token,
      apiUrl: authCache.apiUrl,
      downloadUrl: authCache.downloadUrl,
    };
  }

  const authString = Buffer.from(`${B2_CONFIG.accountId}:${B2_CONFIG.applicationKey}`).toString('base64');
  
  const response = await axios.get(`${B2_CONFIG.apiUrl}/b2api/v2/b2_authorize_account`, {
    headers: { Authorization: `Basic ${authString}` },
  });

  authCache = {
    token: response.data.authorizationToken,
    apiUrl: response.data.apiInfo.storageApi.apiUrl,
    downloadUrl: response.data.apiInfo.storageApi.downloadUrl,
    expiresAt: Date.now() + 23 * 60 * 60 * 1000,
  };

  return {
    authorizationToken: response.data.authorizationToken,
    apiUrl: response.data.apiInfo.storageApi.apiUrl,
    downloadUrl: response.data.apiInfo.storageApi.downloadUrl,
  };
}

export interface FileMetadata {
  area: string;
  nucleo?: string;
  tema: string;
  status: string;
}

export function generateStandardFileName(originalName: string, metadata: FileMetadata): { fileName: string; folderPath: string; fullPath: string } {
  const now = new Date();
  const ano = now.getFullYear();
  const mes = String(now.getMonth() + 1).padStart(2, '0');
  const dia = String(now.getDate()).padStart(2, '0');
  
  const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
  const extensao = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  
  const slugify = (text: string): string => 
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  const areaSlug = slugify(metadata.area);
  const nucleoSlug = metadata.nucleo ? slugify(metadata.nucleo) : 'GERAL';
  const temaSlug = slugify(metadata.tema);
  const statusSlug = slugify(metadata.status);
  
  const fileName = `${ano}_${mes}_${dia}_${areaSlug}_${nucleoSlug}_${temaSlug}_${statusSlug}_${uuid}.${extensao}`;
  
  let baseFolder = FOLDER_STRUCTURE.ENTRADA;
  if (metadata.status === 'CATALOGADO') baseFolder = FOLDER_STRUCTURE.CATALOGADO;
  else if (metadata.status === 'EM_PRODUCAO') baseFolder = FOLDER_STRUCTURE.PRODUCAO;
  else if (metadata.status === 'PUBLICADO') baseFolder = FOLDER_STRUCTURE.PUBLICADO;
  else if (metadata.status === 'ARQUIVADO') baseFolder = FOLDER_STRUCTURE.ARQUIVADO;
  
  const folderPath = `${baseFolder}/${ano}/${mes}/${dia}`;
  const fullPath = `${folderPath}/${fileName}`;
  
  return { fileName, folderPath, fullPath };
}

export async function getUploadUrl(filePath: string): Promise<PresignedUpload> {
  const auth = await authorizeB2();
  
  const uploadUrlResponse = await axios.post(
    `${auth.apiUrl}/b2api/v2/b2_get_upload_url`,
    { bucketId: B2_CONFIG.bucketId },
    { headers: { Authorization: auth.authorizationToken } }
  );
  
  return {
    uploadUrl: uploadUrlResponse.data.uploadUrl,
    authorizationToken: uploadUrlResponse.data.authorizationToken,
    fileName: filePath.split('/').pop() || '',
    filePath: filePath,
  };
}

export async function getDownloadUrl(fileName: string, validDuration: number = 3600): Promise<string> {
  const auth = await authorizeB2();
  
  const response = await axios.post(
    `${auth.apiUrl}/b2api/v2/b2_get_download_authorization`,
    {
      bucketId: B2_CONFIG.bucketId,
      fileNamePrefix: fileName,
      validDurationInSeconds: validDuration,
    },
    { headers: { Authorization: auth.authorizationToken } }
  );
  
  return `${auth.downloadUrl}/file/${B2_CONFIG.bucketName}/${fileName}?Authorization=${response.data.authorizationToken}`;
}

export async function listFiles(prefix: string = ''): Promise<any[]> {
  const auth = await authorizeB2();
  
  const response = await axios.post(
    `${auth.apiUrl}/b2api/v2/b2_list_file_names`,
    {
      bucketId: B2_CONFIG.bucketId,
      prefix: prefix,
      maxFileCount: 1000,
    },
    { headers: { Authorization: auth.authorizationToken } }
  );
  
  return response.data.files || [];
}

export async function deleteFile(fileId: string, fileName: string): Promise<void> {
  const auth = await authorizeB2();
  
  await axios.post(
    `${auth.apiUrl}/b2api/v2/b2_delete_file_version`,
    { fileId: fileId, fileName: fileName },
    { headers: { Authorization: auth.authorizationToken } }
  );
}

export { B2_CONFIG };
