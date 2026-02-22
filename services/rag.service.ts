import { apiClient } from './api';

export interface RagDocument {
  id: number;
  content: string;
  metadata: Record<string, unknown> | null;
}

export interface RagQueryResponse {
  answer: string;
  results: RagDocument[];
}

export interface RagUploadResponse {
  status: string;
  filename: string;
}

export interface IndexedDocument {
  filename: string;
  chunk_count: number;
}

export interface RagListDocumentsResponse {
  documents: IndexedDocument[];
}

export interface RagDeleteByFileResponse {
  status: string;
  deleted: number;
}

export interface RagIngestResponse {
  status: string;
  filename: string;
  chunks: number;
  source: string;
}

export const ragService = {
  async query(query: string, topK: number = 5): Promise<RagQueryResponse> {
    return apiClient.post<RagQueryResponse>('/rag/query', { query, top_k: topK });
  },

  async uploadFile(formData: FormData): Promise<RagUploadResponse> {
    return apiClient.uploadFile<RagUploadResponse>('/rag/upload', formData);
  },

  async addByLink(url: string): Promise<RagIngestResponse> {
    return apiClient.post<RagIngestResponse>('/rag/ingest-url', { url });
  },

  async addByText(text: string, title?: string): Promise<RagIngestResponse> {
    return apiClient.post<RagIngestResponse>('/rag/ingest-text', title != null && title !== '' ? { text, title } : { text });
  },

  async listDocuments(): Promise<RagListDocumentsResponse> {
    return apiClient.get<RagListDocumentsResponse>('/rag/documents');
  },

  async deleteDocumentsByFilenames(filenames: string[]): Promise<RagDeleteByFileResponse> {
    return apiClient.delete<RagDeleteByFileResponse>('/rag/documents/by-file', {
      body: JSON.stringify({ filenames }),
    });
  },

  async health(): Promise<{ status: string }> {
    return apiClient.get<{ status: string }>('/rag/health');
  },
};
