import { Request, Response } from 'express';
import { uploadFileToCloudinary, uploadImageToCloudinary } from '../config/cloudinary.config.js';

const normalizeUploadedFilename = (filename: string): string => {
  const mojibakePattern = /Ã|Â|â|ð|�/;
  if (!mojibakePattern.test(filename)) return filename;
  return Buffer.from(filename, 'latin1').toString('utf8');
};

export const uploadController = {
  /**
   * Upload an individual image (Avatar, Proof, Single Venue Photo)
   * POST /api/upload/single
   */
  async uploadSingle(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn tệp hình ảnh để tải lên'
        });
      }

      const folder = (req.body.folder as string) || 'football-connect/uploads';
      const result = await uploadImageToCloudinary(
        req.file.buffer,
        folder,
        req.file.originalname
      );

      return res.status(200).json({
        success: true,
        message: 'Tải lên hình ảnh thành công',
        data: {
          url: result.url,
          public_id: result.public_id,
          provider: result.provider,
          filename: req.file.originalname,
          size: req.file.size
        }
      });
    } catch (error: any) {
      console.error('Lỗi khi tải ảnh lên:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi xử lý khi tải ảnh lên hệ thống'
      });
    }
  },

  /**
   * Upload multiple images (Venue gallery, Field images)
   * POST /api/upload/multiple
   */
  async uploadMultiple(req: Request, res: Response) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn ít nhất một hình ảnh để tải lên'
        });
      }

      const folder = (req.body.folder as string) || 'football-connect/galleries';
      const uploadPromises = files.map(file =>
        uploadImageToCloudinary(file.buffer, folder, file.originalname)
      );

      const results = await Promise.all(uploadPromises);

      return res.status(200).json({
        success: true,
        message: `Đã tải lên thành công ${results.length} hình ảnh`,
        data: results.map((r, index) => ({
          url: r.url,
          public_id: r.public_id,
          provider: r.provider,
          filename: files[index].originalname
        }))
      });
    } catch (error: any) {
      console.error('Lỗi khi tải nhiều ảnh lên:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi tải các tệp ảnh lên hệ thống'
      });
    }
  }
  ,
  async uploadChatFile(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn tệp cần gửi' });
      }
      const filename = normalizeUploadedFilename(req.file.originalname);
      const folder = (req.body.folder as string) || 'football-connect/chat';
      const result = await uploadFileToCloudinary(req.file.buffer, folder, filename);
      return res.status(200).json({
        success: true,
        message: 'Tải tệp lên thành công',
        data: {
          url: result.url,
          filename,
          mimeType: req.file.mimetype,
          size: req.file.size
        }
      });
    } catch (error: any) {
      console.error('Lỗi khi tải tệp chat lên:', error);
      return res.status(500).json({ success: false, message: error.message || 'Không thể tải tệp lên' });
    }
  }
};
