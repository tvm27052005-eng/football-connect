import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true
});

/**
 * Uploads an in-memory buffer to Cloudinary using upload_stream.
 * If Cloudinary credentials are not configured, it gracefully falls back
 * to saving the image locally in public/uploads and returning a local URL.
 */
export async function uploadImageToCloudinary(
  fileBuffer: Buffer,
  folder: string = 'football-connect',
  filename?: string
): Promise<{ url: string; public_id: string; provider: 'cloudinary' | 'local' }> {
  const isCloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { quality: 'auto', fetch_format: 'auto' }
          ]
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            console.error('Cloudinary upload error:', error);
            return reject(error || new Error('Upload to Cloudinary failed'));
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
  }

  // Graceful Local Fallback when Cloudinary API Key is not set in .env
  console.log('⚠️ Cloudinary API Key chua duoc cau hinh. Chuyen sang luu anh cuc bo tai public/uploads...');
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const safeFilename = `${Date.now()}-${filename ? filename.replace(/[^a-zA-Z0-9.-]/g, '_') : 'image.jpg'}`;
  const filePath = path.join(uploadsDir, safeFilename);
  fs.writeFileSync(filePath, fileBuffer);

  return {
    url: `/uploads/${safeFilename}`,
    public_id: safeFilename,
    provider: 'local'
  };
}

export default cloudinary;
