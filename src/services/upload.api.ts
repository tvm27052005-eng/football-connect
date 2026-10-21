import { api } from './api.js';

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
    public_id: string;
    provider: 'cloudinary' | 'local';
    filename: string;
    size?: number;
  };
}

export interface UploadMultipleResponse {
  success: boolean;
  message: string;
  data: Array<{
    url: string;
    public_id: string;
    provider: 'cloudinary' | 'local';
    filename: string;
  }>;
}

export const uploadApi = {
  /**
   * Upload một ảnh (Avatar, Ảnh sân, Ảnh đánh giá)
   * Sử dụng Multer & Cloudinary
   */
  async uploadSingle(file: File, folder: string = 'football-connect/uploads'): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    const res = await api.post<UploadResponse>('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return res.data.data.url;
  },

  /**
   * Upload nhiều ảnh cùng lúc
   */
  async uploadMultiple(files: File[], folder: string = 'football-connect/galleries'): Promise<string[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    formData.append('folder', folder);

    const res = await api.post<UploadMultipleResponse>('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return res.data.data.map(item => item.url);
  },

  async uploadChatFile(file: File): Promise<{
    url: string;
    filename: string;
    mimeType: string;
    size: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<{
      success: boolean;
      data: {
        url: string;
        filename: string;
        mimeType: string;
        size: number;
      };
    }>('/upload/chat', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.data;
  }
};
