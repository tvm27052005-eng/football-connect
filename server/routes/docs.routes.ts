import { Router } from 'express';
import { docsController } from '../controllers/docs.controller.js';

const router = Router();

router.get('/', docsController.getArchitectureDocs);

export default router;
