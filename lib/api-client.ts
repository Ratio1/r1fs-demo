import { config } from './config';
import {
  CStoreStatusResponse,
  CStoreValueResponse,
  CStoreHashResponse,
  ChainStoreValue
} from './types';
import createRatio1EdgeNodeClient from '@ratio1/edge-node-client';
import { createRatio1EdgeNodeBrowserClient } from '@ratio1/edge-node-client/browser';
import type { UploadFileRequest } from '@ratio1/edge-node-client/types';
import FormDataNode from 'form-data';
import crossFetch from 'cross-fetch';

// Helper function to ensure URL has proper protocol
function ensureHttpProtocol(url: string | undefined): string | undefined {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `http://${url}`;
}

const CSTORE_API_URL = ensureHttpProtocol(process.env.EE_CHAINSTORE_API_URL || process.env.CHAINSTORE_API_URL);
const R1FS_API_URL = ensureHttpProtocol(process.env.EE_R1FS_API_URL || process.env.R1FS_API_URL);
const CHAINSTORE_PEERS = process.env.EE_CHAINSTORE_PEERS || process.env.CHAINSTORE_PEERS || "";

console.log("🚀 [DEBUG] Initializing API clients with URLs:",{
    CSTORE_API_URL,
    R1FS_API_URL,
    CHAINSTORE_PEERS
});
let fixed = CHAINSTORE_PEERS;
let parsed: string[] = [];

if (fixed?.trim()) {
  try {
    const trimmed = fixed.trim();

    // Remove outer single quotes if present
    let cleaned = trimmed;
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
      cleaned = trimmed.slice(1, -1);
    }

    // Replace any remaining single quotes with double quotes
    cleaned = cleaned.replace(/'/g, '"');

    // Parse the JSON string to get the actual array
    parsed = JSON.parse(cleaned);

    if (config.DEBUG) {
      console.log('✅ [DEBUG] Successfully parsed CHAINSTORE_PEERS:', parsed);
    }
  } catch (err) {
    console.error("❌ Failed to parse CHAINSTORE_PEERS:", fixed);
    console.error("❌ Error details:", err);
    throw err;
  }
}
const sharedClientOptions = {
  cstoreUrl: CSTORE_API_URL,
  r1fsUrl: R1FS_API_URL,
  chainstorePeers: parsed as any,
  debug: config.DEBUG,
  verbose: config.DEBUG,
};

const nodeHttpAdapter = {
  fetch: (url: string, options?: RequestInit) => crossFetch(url, options as any),
};

// Create the ratio1-edge-node-client instance
const ratio1 = typeof window === 'undefined'
  ? createRatio1EdgeNodeClient({
      ...sharedClientOptions,
      httpAdapter: nodeHttpAdapter,
      formDataCtor: FormDataNode as unknown as typeof FormData,
    })
  : createRatio1EdgeNodeBrowserClient(sharedClientOptions);

// CSTORE API Client using ratio1-edge-node-client
class CStoreApiClient {
  async getStatus(): Promise<CStoreStatusResponse> {
    if (config.DEBUG) {
      console.log('🚀 [DEBUG] Getting CStore status...');
    }

    try {
      const result = await ratio1.cstore.getStatus({fullResponse: true});

      if (config.DEBUG) {
        console.log('✅ [DEBUG] CStore status received:', result);
      }

      // Add chainstore peers to the status response
      const statusWithPeers = {
        ...result,
        chainstore_peers: parsed
      };

      return statusWithPeers as unknown as CStoreStatusResponse;
    } catch (error) {
      if (config.DEBUG) {
        console.error('❌ [DEBUG] CStore status error:', error);
      }
      throw error;
    }
  }

  async getValue(cstore_key: string): Promise<CStoreValueResponse> {
    if (config.DEBUG) {
      console.log('🚀 [DEBUG] Getting CStore value for key:', cstore_key);
    }

    try {
      const result = await ratio1.cstore.getValue({key: cstore_key});

      if (config.DEBUG) {
        console.log('✅ [DEBUG] CStore value received:', result);
      }

      return result as unknown as CStoreValueResponse;
    } catch (error) {
      if (config.DEBUG) {
        console.error('❌ [DEBUG] CStore getValue error:', error);
      }
      throw error;
    }
  }

  async setValue(cstore_key: string, chainstore_value: ChainStoreValue): Promise<CStoreValueResponse> {
    if (config.DEBUG) {
      console.log('🚀 [DEBUG] Setting CStore value for key:', cstore_key);
    }

    try {
      const result = await ratio1.cstore.setValue({key: cstore_key, value: chainstore_value});

      if (config.DEBUG) {
        console.log('✅ [DEBUG] CStore setValue result:', result);
      }

      return result as unknown as CStoreValueResponse;
    } catch (error) {
      if (config.DEBUG) {
        console.error('❌ [DEBUG] CStore setValue error:', error);
      }
      throw error;
    }
  }

  async hashSetValue(hkey: string, key: string, value: ChainStoreValue): Promise<CStoreHashResponse> {
    if (config.DEBUG) {
      console.log('🚀 [DEBUG] Setting hash value:', { hkey, key });
    }

    try {
      const result = await ratio1.cstore.hset({hkey, key, value});

      if (config.DEBUG) {
        console.log('✅ [DEBUG] Hash setValue result:', result);
      }

      return result as unknown as CStoreHashResponse;
    } catch (error) {
      if (config.DEBUG) {
        console.error('❌ [DEBUG] Hash setValue error:', error);
      }
      throw error;
    }
  }

  async hashGetValue(hkey: string, key: string): Promise<CStoreHashResponse> {
    if (config.DEBUG) {
      console.log('🚀 [DEBUG] Getting hash value:', { hkey, key });
    }

    try {
      const result = await ratio1.cstore.hget({hkey, key});

      if (config.DEBUG) {
        console.log('✅ [DEBUG] Hash getValue result:', result);
      }

      return result as unknown as CStoreHashResponse;
    } catch (error) {
      if (config.DEBUG) {
        console.error('❌ [DEBUG] Hash getValue error:', error);
      }
      throw error;
    }
  }

  async hashGetAllValues(hkey: string): Promise<CStoreHashResponse> {
    if (config.DEBUG) {
      console.log('🚀 [DEBUG] Getting all hash values for hkey:', hkey);
    }

    try {
      const result = await ratio1.cstore.hgetall({hkey}, {fullResponse: true});

      if (config.DEBUG) {
        console.log('✅ [DEBUG] Hash getAllValues result:', result);
      }

      return result as unknown as CStoreHashResponse;
    } catch (error) {
      if (config.DEBUG) {
        console.error('❌ [DEBUG] Hash getAllValues error:', error);
      }
      throw error;
    }
  }

  async hashGetAllValuesWithQuery(hkey: string): Promise<CStoreHashResponse> {
    // Use the same method as hashGetAllValues since the SDK handles the query internally
    return this.hashGetAllValues(hkey);
  }

  async hashGet(hkey: string, key: string): Promise<CStoreHashResponse> {
    if (config.DEBUG) {
      console.log('🚀 [DEBUG] Getting hash value:', { hkey, key });
    }

    try {
      // The SDK doesn't have a direct hget method, so we'll use hashGetValue
      const result = await ratio1.cstore.hget({hkey, key});

      if (config.DEBUG) {
        console.log('✅ [DEBUG] Hash get result:', result);
      }

      return result as unknown as CStoreHashResponse;
    } catch (error) {
      if (config.DEBUG) {
        console.error('❌ [DEBUG] Hash get error:', error);
      }
      throw error;
    }
  }

  async hashSet(hkey: string, key: string, value: string): Promise<CStoreHashResponse> {
    if (config.DEBUG) {
      console.log('🚀 [DEBUG] Setting hash value:', { hkey, key, value });
    }

    try {
      const result = await ratio1.cstore.hset({hkey, key, value});

      if (config.DEBUG) {
        console.log('✅ [DEBUG] Hash set result:', result);
      }

      return result as unknown as CStoreHashResponse;
    } catch (error) {
      if (config.DEBUG) {
        console.error('❌ [DEBUG] Hash set error:', error);
      }
      throw error;
    }
  }

  // Method to get all files using the correct endpoint
  async getAllFiles(): Promise<any> {
    const response = await this.hashGetAllValues(config.HKEY);
    // Return the hkey data directly (which contains the files structure)
    return response[config.HKEY] || {};
  }
}

// R1FS API Client using ratio1-edge-node-client
class R1FSApiClient {
  async getStatus(): Promise<any> {
    if (config.DEBUG) {
      console.log('🚀 [DEBUG] Getting R1FS status...');
    }

    try {
      const result = await ratio1.r1fs.getStatus({fullResponse: true});

      if (config.DEBUG) {
        console.log('✅ [DEBUG] R1FS status received:', result);
      }

      return result;
    } catch (error) {
      if (config.DEBUG) {
        console.error('❌ [DEBUG] R1FS status error:', error);
      }
      throw error;
    }
  }

  async uploadFileStreaming(request: UploadFileRequest): Promise<any> {
    if (config.DEBUG) {
      const debugMeta = {
        hasFile: Boolean(request.file),
        hasFormData: Boolean(request.formData),
        filename: request.filename,
        secretPresent: Boolean(request.secret && request.secret.trim()),
      };
      console.log('🚀 [DEBUG] Uploading file via streaming...', debugMeta);
    }

    try {
      const result = await ratio1.r1fs.addFile(request, { fullResponse: true });

      if (config.DEBUG) {
        console.log('✅ [DEBUG] File upload result:', result);
      }

      return result;
    } catch (error) {
      if (config.DEBUG) {
        console.error('❌ [DEBUG] File upload error:', error);
        const response = (error as any)?.response as Response | undefined;
        if (response) {
          try {
            const body = await response.clone().text();
            console.error('❌ [DEBUG] File upload error body:', body);
          } catch (parseErr) {
            console.error('❌ [DEBUG] Failed to read error body:', parseErr);
          }
        }
      }
      throw error;
    }
  }

  async uploadFileBase64(data: { file_base64_str: string; filename?: string; secret?: string }): Promise<any> {
    if (config.DEBUG) {
      console.log('🚀 [DEBUG] Uploading file via base64...');
    }

    try {
      const result = await ratio1.r1fs.addFileBase64(data, {fullResponse: true});

      if (config.DEBUG) {
        console.log('✅ [DEBUG] Base64 file upload result:', result);
      }

      return result;
    } catch (error) {
      if (config.DEBUG) {
        console.error('❌ [DEBUG] Base64 file upload error:', error);
      }
      throw error;
    }
  }

  async downloadFileStreaming(cid: string, secret?: string): Promise<Response> {
    if (config.DEBUG) {
      console.log('🚀 [DEBUG] Downloading file via streaming:', { cid, secret });
    }

    try {
      const result = await ratio1.r1fs.getFile({cid, secret});

      if (config.DEBUG) {
        console.log('✅ [DEBUG] File download result received');
      }

      // The SDK returns a Response object directly
      return result as unknown as Response;
    } catch (error) {
      if (config.DEBUG) {
        console.error('❌ [DEBUG] File download error:', error);
      }
      throw error;
    }
  }

  async downloadFileBase64(cid: string, secret?: string): Promise<any> {
    if (config.DEBUG) {
      console.log('🚀 [DEBUG] Downloading file via base64:', { cid, secret });
    }

    try {
      // @ts-ignore - SDK types don't match implementation
      const result = await ratio1.r1fs.getFileBase64(cid, secret);

      if (config.DEBUG) {
        console.log('✅ [DEBUG] Base64 file download result received');
      }

      return result;
    } catch (error) {
      if (config.DEBUG) {
        console.error('❌ [DEBUG] Base64 file download error:', error);
      }
      throw error;
    }
  }
}

// Export instances of the API clients
export const cstoreApi = new CStoreApiClient();
export const r1fsApi = new R1FSApiClient();

// Legacy ApiClient for backward compatibility
export class ApiClient {
  static async getAllFiles(): Promise<any> {
    return cstoreApi.getAllFiles();
  }

  static async getStatus(): Promise<any> {
    return r1fsApi.getStatus();
  }

  static async getR1FSStatus(): Promise<any> {
    return r1fsApi.getStatus();
  }

  static async getCStoreStatus(): Promise<any> {
    return cstoreApi.getStatus();
  }

  static async uploadFileStreaming(request: UploadFileRequest): Promise<any> {
    return r1fsApi.uploadFileStreaming(request);
  }

  static async uploadFileBase64(data: { file_base64_str: string; filename?: string; secret?: string }): Promise<any> {
    return r1fsApi.uploadFileBase64(data);
  }

  static async downloadFileStreaming(cid: string, secret?: string): Promise<Response> {
    return r1fsApi.downloadFileStreaming(cid, secret);
  }

  static async downloadFileBase64(cid: string, secret?: string): Promise<any> {
    return r1fsApi.downloadFileBase64(cid, secret);
  }

  static async hashGet(hkey: string, key: string): Promise<any> {
    return cstoreApi.hashGet(hkey, key);
  }

  static async hashSet(hkey: string, key: string, value: string): Promise<any> {
    return cstoreApi.hashSet(hkey, key, value);
  }
}
