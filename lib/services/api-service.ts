import { FilesData, TransferMode } from '@/lib/types';

const OWNER_HEADER = 'x-ratio1-owner';
const SECRET_HEADER = 'x-ratio1-secret';
const FILENAME_HEADER = 'x-ratio1-filename';

// Base API service class
class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // File operations
  async getFiles(): Promise<FilesData> {
    return this.request<FilesData>('/api/files');
  }

  async uploadFileStreaming(formData: FormData): Promise<any> {
    const headers = this.extractUploadHeaders(formData);
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    return response.json();
  }

  async uploadFileBase64(data: {
    file_base64_str: string;
    filename?: string;
    secret?: string;
    owner?: string;
  }): Promise<any> {
    return this.request('/api/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async downloadFileStreaming(cid: string, secret?: string): Promise<Response> {
    const params = new URLSearchParams({ cid, mode: 'streaming' });
    if (secret) {
      params.append('secret', secret);
    }

    const response = await fetch(`/api/download?${params}`, {
      method: 'GET',
    });

    // For streaming downloads, we don't check response.ok here
    // because the frontend will handle the response appropriately
    // and streaming responses might not always be "ok" in the traditional sense
    return response;
  }

  async downloadFileBase64(cid: string, secret?: string): Promise<any> {
    return this.request('/api/download', {
      method: 'POST',
      body: JSON.stringify({
        cid,
        secret: secret || undefined,
        mode: 'base64',
      }),
    });
  }

  // Status operations
  async getStatus(): Promise<any> {
    return this.request('/api/status');
  }

  async getR1FSStatus(): Promise<any> {
    return this.request('/api/r1fs-status');
  }

  async getCStoreStatus(): Promise<any> {
    return this.request('/api/cstore-status');
  }

  // Refresh files
  async refreshFiles(): Promise<FilesData> {
    return this.getFiles();
  }

  // Upload with progress tracking
  async uploadFileWithProgress(
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');

      const headers = this.extractUploadHeaders(formData);
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      };

      xhr.onload = () => {
        try {
          const result = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(result);
          } else {
            reject(new Error(result.error || 'Upload failed'));
          }
        } catch {
          reject(new Error('Upload failed'));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Upload failed'));
      };

      xhr.send(formData);
    });
  }

  private extractUploadHeaders(formData: FormData): Record<string, string> {
    const headers: Record<string, string> = {};

    const ownerValue = formData.get('owner');
    if (typeof ownerValue === 'string' && ownerValue.trim()) {
      headers[OWNER_HEADER] = ownerValue.trim();
    }

    const secretValue = formData.get('secret');
    if (typeof secretValue === 'string' && secretValue.trim()) {
      headers[SECRET_HEADER] = secretValue.trim();
    }

    const explicitFilename = formData.get('filename');
    let filename: string | undefined;
    if (typeof explicitFilename === 'string' && explicitFilename.trim()) {
      filename = explicitFilename.trim();
    } else {
      const fileValue = formData.get('file');
      if (fileValue instanceof File && fileValue.name) {
        filename = fileValue.name;
      }
    }

    if (filename) {
      headers[FILENAME_HEADER] = filename;
    }

    return headers;
  }
}

// Export a singleton instance
export const apiService = new ApiService();

// Export the class for testing purposes
export { ApiService }; 
