import { Router } from 'express';
import { uploadMiddleware, chatUploadMiddleware } from '../middlewares/upload.middleware.js';
import { uploadController } from '../controllers/upload.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Route tải lên 1 hình ảnh (Ảnh đại diện, biên lai, ảnh đánh giá)
router.post('/single', uploadMiddleware.single('image'), uploadController.uploadSingle);

// Route tải lên nhiều hình ảnh (Bộ sưu tập ảnh sân bóng, sân con)
router.post('/multiple', uploadMiddleware.array('images', 10), uploadController.uploadMultiple);
router.post('/chat', authenticateToken, chatUploadMiddleware.single('file'), uploadController.uploadChatFile);

export default router;
