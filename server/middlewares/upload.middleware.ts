import multer from 'multer';
import { Request } from 'express';

// Store files in memory buffer before streaming to Cloudinary
const storage = multer.memoryStorage();

// File filter to only allow standard image types
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận các tệp định dạng hình ảnh (JPEG, PNG, WEBP, GIF, JPG)'));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Giới hạn kích thước ảnh tối đa 5MB
  }
});
