import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true
});

const isCloudinaryConfigured = (): boolean => Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const saveLocally = (
  fileBuffer: Buffer,
  filename: string | undefined,
  fallbackName: string
): { url: string; public_id: string; provider: 'local' } => {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const safeFilename = `${Date.now()}-${filename ? filename.replace(/[^a-zA-Z0-9.-]/g, '_') : fallbackName}`;
  fs.writeFileSync(path.join(uploadsDir, safeFilename), fileBuffer);
  return {
    url: `/uploads/${safeFilename}`,
    public_id: safeFilename,
    provider: 'local'
  };
};

const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string,
  resourceType: 'image' | 'auto'
): Promise<{ url: string; public_id: string; provider: 'cloudinary' }> =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        ...(resourceType === 'image' ? { transformation: [{ quality: 'auto', fetch_format: 'auto' }] } : {})
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          return reject(error || new Error('Tải tệp lên Cloudinary thất bại'));
        }
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          provider: 'cloudinary'
        });
      }
    );
    uploadStream.end(fileBuffer);
  });

export async function uploadImageToCloudinary(
  fileBuffer: Buffer,
  folder: string = 'football-connect',
  filename?: string
): Promise<{ url: string; public_id: string; provider: 'cloudinary' | 'local' }> {
  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(fileBuffer, folder, 'image');
  }
  return saveLocally(fileBuffer, filename, 'image.jpg');
}

export async function uploadFileToCloudinary(
  fileBuffer: Buffer,
  folder: string = 'football-connect/chat',
  filename?: string
): Promise<{ url: string; public_id: string; provider: 'cloudinary' | 'local' }> {
  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(fileBuffer, folder, 'auto');
  }
  return saveLocally(fileBuffer, filename, 'file');
}

export default cloudinary;
